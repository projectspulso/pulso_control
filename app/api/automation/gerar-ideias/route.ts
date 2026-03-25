import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { callOpenAI } from '@/lib/automation/ai-clients'
import { buildPromptGerarIdeias } from '@/lib/automation/prompts'

/**
 * POST /api/automation/gerar-ideias
 *
 * Gera ideias de conteúdo para um canal via GPT-4o.
 * Payload: { canal_id?: string, quantidade?: number }
 *
 * Se canal_id não fornecido, seleciona automaticamente
 * o próximo canal na rotação.
 */
export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-webhook-secret')
  if (secret && secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await request.json()
  const quantidade = payload.quantidade || 5

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseAdminClient() as any

  try {
    // Determinar canal
    let canal
    if (payload.canal_id) {
      const { data } = await supabase
        .schema('pulso_core')
        .from('canais')
        .select('id, nome, descricao, idioma, slug')
        .eq('id', payload.canal_id)
        .single()
      canal = data
    } else {
      // Rotação automática: canal com menos ideias recentes
      const { data: canais } = await supabase
        .from('vw_pulso_canais')
        .select('id, nome, descricao, idioma, slug, total_ideias')
        .eq('status', 'ATIVO')
        .order('total_ideias', { ascending: true })
        .limit(1)
      canal = canais?.[0]
    }

    if (!canal) {
      return NextResponse.json({ error: 'Nenhum canal encontrado' }, { status: 404 })
    }

    // Buscar série ativa do canal (opcional)
    const { data: series } = await supabase
      .schema('pulso_core')
      .from('series')
      .select('id, nome, descricao')
      .eq('canal_id', canal.id)
      .eq('status', 'ATIVO')
      .limit(1)

    const serie = series?.[0] || null

    // Gerar ideias via GPT
    const prompt = buildPromptGerarIdeias(canal, serie, quantidade)
    const { content, usage } = await callOpenAI(prompt, {
      temperature: 0.8,
      json_mode: true,
    })

    // Parse JSON response
    let ideias
    try {
      const parsed = JSON.parse(content)
      ideias = Array.isArray(parsed) ? parsed : parsed.ideias || [parsed]
    } catch {
      return NextResponse.json(
        { error: 'GPT retornou JSON inválido', raw: content },
        { status: 422 }
      )
    }

    // Salvar ideias no banco
    const ideiasParaSalvar = ideias.map(
      (ideia: {
        titulo: string
        descricao: string
        tags?: string[]
        duracao_estimada?: number
        tipo_formato?: string
        prioridade?: number
        gancho_sugerido?: string
      }) => ({
        canal_id: canal.id,
        serie_id: serie?.id || null,
        titulo: ideia.titulo,
        descricao: ideia.descricao,
        tags: ideia.tags || [],
        linguagem: canal.idioma,
        origem: 'IA',
        prioridade: ideia.prioridade || 5,
        status: 'RASCUNHO',
        metadata: {
          ai_modelo: 'gpt-4o',
          gerado_em: new Date().toISOString(),
          duracao_estimada: `${ideia.duracao_estimada || 30}s`,
          tipo_formato: ideia.tipo_formato,
          gancho_sugerido: ideia.gancho_sugerido,
          tokens_usados: usage,
        },
      })
    )

    const { data: saved, error: saveError } = await supabase
      .schema('pulso_content')
      .from('ideias')
      .insert(ideiasParaSalvar)
      .select('id, titulo')

    if (saveError) {
      return NextResponse.json(
        { error: `Erro ao salvar ideias: ${saveError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      canal: canal.nome,
      quantidade_gerada: saved?.length || 0,
      ideias: saved,
      tokens: usage,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
