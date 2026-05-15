import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { callClaude, callOpenAI } from '@/lib/automation/ai-clients'
import { buildPromptRelatorioSemanal } from '@/lib/automation/prompts'

/**
 * POST /api/automation/relatorio
 *
 * Gera relatório semanal de performance via Claude (fallback: GPT-4o).
 * Agrega métricas de todas as tabelas do pipeline e gera análise com IA.
 * Payload: { semanas?: number }
 */
export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-webhook-secret')
  if (secret && secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await request.json().catch(() => ({}))
  const semanas = payload.semanas || 1

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseAdminClient() as any

  // Data de corte: N semanas atrás
  const dataCorte = new Date()
  dataCorte.setDate(dataCorte.getDate() - semanas * 7)
  const desde = dataCorte.toISOString()

  try {
    // ====== AGREGAR DADOS DE TODAS AS TABELAS ======

    // 1. Ideias: geradas, aprovadas, descartadas
    const [
      { count: ideiasGeradas },
      { count: ideiasAprovadas },
      { count: ideiasDescartadas },
    ] = await Promise.all([
      supabase
        .schema('pulso_content')
        .from('ideias')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', desde),
      supabase
        .schema('pulso_content')
        .from('ideias')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', desde)
        .eq('status', 'APROVADA'),
      supabase
        .schema('pulso_content')
        .from('ideias')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', desde)
        .eq('status', 'DESCARTADA'),
    ])

    // 2. Roteiros: gerados, aprovados
    const [
      { count: roteirosGerados },
      { count: roteirosAprovados },
    ] = await Promise.all([
      supabase
        .schema('pulso_content')
        .from('roteiros')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', desde),
      supabase
        .schema('pulso_content')
        .from('roteiros')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', desde)
        .eq('status', 'APROVADO'),
    ])

    // 3. Audios gerados
    const { count: audiosGerados } = await supabase
      .schema('pulso_assets')
      .from('assets')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', desde)
      .eq('tipo', 'AUDIO')

    // 4. Posts publicados
    const { count: postsPublicados } = await supabase
      .schema('pulso_distribution')
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', desde)

    // 5. Automation queue stats
    const [
      { count: queueSucesso },
      { count: queueErros },
      { count: queueRetries },
    ] = await Promise.all([
      supabase
        .schema('pulso_automation')
        .from('automation_queue')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', desde)
        .eq('status', 'DONE'),
      supabase
        .schema('pulso_automation')
        .from('automation_queue')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', desde)
        .eq('status', 'ERROR'),
      supabase
        .schema('pulso_automation')
        .from('automation_queue')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', desde)
        .gt('tentativas', 1),
    ])

    // 6. Métricas diárias (analytics) - somas agregadas
    const { data: metricasDiarias } = await supabase
      .schema('pulso_analytics')
      .from('metricas_diarias')
      .select('views, likes, comentarios, compartilhamentos, novos_seguidores')
      .gte('data', desde.split('T')[0])

    const metricasAgregadas = {
      total_views: 0,
      total_likes: 0,
      total_comentarios: 0,
      total_compartilhamentos: 0,
      total_novos_seguidores: 0,
    }

    if (metricasDiarias && metricasDiarias.length > 0) {
      for (const m of metricasDiarias) {
        metricasAgregadas.total_views += m.views || 0
        metricasAgregadas.total_likes += m.likes || 0
        metricasAgregadas.total_comentarios += m.comentarios || 0
        metricasAgregadas.total_compartilhamentos += m.compartilhamentos || 0
        metricasAgregadas.total_novos_seguidores += m.novos_seguidores || 0
      }
    }

    // ====== MONTAR OBJETO DE MÉTRICAS ======

    const metricas = {
      periodo: {
        semanas,
        de: desde,
        ate: new Date().toISOString(),
      },
      pipeline_conteudo: {
        ideias_geradas: ideiasGeradas || 0,
        ideias_aprovadas: ideiasAprovadas || 0,
        ideias_descartadas: ideiasDescartadas || 0,
        roteiros_gerados: roteirosGerados || 0,
        roteiros_aprovados: roteirosAprovados || 0,
        audios_gerados: audiosGerados || 0,
        posts_publicados: postsPublicados || 0,
      },
      automacao: {
        tarefas_sucesso: queueSucesso || 0,
        tarefas_erro: queueErros || 0,
        tarefas_com_retry: queueRetries || 0,
        taxa_sucesso:
          (queueSucesso || 0) + (queueErros || 0) > 0
            ? Math.round(
                ((queueSucesso || 0) /
                  ((queueSucesso || 0) + (queueErros || 0))) *
                  100
              )
            : 100,
      },
      analytics: metricasAgregadas,
      dias_com_metricas: metricasDiarias?.length || 0,
    }

    // ====== GERAR RELATÓRIO VIA IA ======

    const prompt = buildPromptRelatorioSemanal(metricas)

    let relatorio: string
    let modeloUsado: string

    if (process.env.ANTHROPIC_API_KEY) {
      const { content } = await callClaude(prompt, {
        max_tokens: 4096,
        temperature: 0.4,
      })
      relatorio = content
      modeloUsado = 'claude-sonnet-4-6'
    } else {
      const { content } = await callOpenAI(prompt, {
        max_tokens: 4096,
        temperature: 0.4,
      })
      relatorio = content
      modeloUsado = 'gpt-4o'
    }

    if (!relatorio || relatorio.length < 100) {
      return NextResponse.json(
        { error: 'IA retornou relatório muito curto ou vazio' },
        { status: 422 }
      )
    }

    // ====== SALVAR NA AUTOMATION QUEUE ======

    const resultado = {
      relatorio,
      metricas,
      modelo: modeloUsado,
      gerado_em: new Date().toISOString(),
    }

    const { data: saved, error: saveError } = await supabase
      .schema('pulso_automation')
      .from('automation_queue')
      .insert({
        tipo: 'RELATORIO_SEMANAL',
        status: 'DONE',
        payload: { semanas },
        resultado,
        tentativas: 1,
        processado_em: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (saveError) {
      // Ainda retorna o relatório mesmo se falhar ao salvar
      console.error('Erro ao salvar relatório na queue:', saveError.message)
      return NextResponse.json({
        success: true,
        warning: 'Relatório gerado mas não salvo na queue',
        relatorio,
        metricas,
        modelo: modeloUsado,
      })
    }

    return NextResponse.json({
      success: true,
      queue_id: saved?.id,
      relatorio,
      metricas,
      modelo: modeloUsado,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
