import { NextRequest, NextResponse } from 'next/server'
import { guardApi } from '@/lib/auth/api-guard'
import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { callOpenAI } from '@/lib/automation/ai-clients'
import { buildPromptGerarRoteiro } from '@/lib/automation/prompts'
import { validarRoteiro } from '@/lib/automation/ai-clients'
import { avaliarHook } from '@/lib/automation/hook-score'

/**
 * POST /api/automation/gerar-roteiro
 *
 * Gera roteiro a partir de uma ideia aprovada via GPT-4o.
 * Payload: { ideia_id: string, canal_id?: string }
 */
export async function POST(request: NextRequest) {
  const denied = await guardApi(request)
  if (denied) return denied

  const payload = await request.json()
  const { ideia_id } = payload

  if (!ideia_id) {
    return NextResponse.json({ error: 'ideia_id é obrigatório' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseAdminClient() as any

  try {
    // Buscar ideia completa
    const { data: ideia, error: ideiaError } = await supabase
      .schema('pulso_content')
      .from('ideias')
      .select('*')
      .eq('id', ideia_id)
      .single()

    if (ideiaError || !ideia) {
      return NextResponse.json({ error: 'Ideia não encontrada' }, { status: 404 })
    }

    // Verificar se já existe roteiro para esta ideia
    const { data: existing } = await supabase
      .schema('pulso_content')
      .from('roteiros')
      .select('id')
      .eq('ideia_id', ideia_id)
      .limit(1)

    if (existing?.length > 0) {
      return NextResponse.json({
        error: 'Roteiro já existe para esta ideia',
        roteiro_id: existing[0].id,
      }, { status: 409 })
    }

    // Buscar canal
    const canalId = payload.canal_id || ideia.canal_id
    let canal = null

    if (canalId) {
      const { data: canalData } = await supabase
        .from('vw_pulso_canais')
        .select('id, nome, descricao, idioma, slug')
        .eq('id', canalId)
        .single()
      canal = canalData
    }

    if (!canal) {
      // Fallback: canal genérico
      canal = { id: canalId, nome: 'PULSO', descricao: '', idioma: 'pt-BR', slug: 'pulso' }
    }

    // Preparar contexto da ideia
    const ideiaCtx = {
      id: ideia.id,
      titulo: ideia.titulo,
      descricao: ideia.descricao,
      tags: ideia.tags,
      gancho_sugerido: ideia.metadata?.gancho_sugerido,
      tipo_formato: ideia.metadata?.tipo_formato,
      emocao_ancora: ideia.metadata?.emocao_ancora,
      duracao_estimada: parseInt(ideia.metadata?.duracao_estimada) || 55,
    }

    // Gerar roteiro via GPT
    const prompt = buildPromptGerarRoteiro(canal, ideiaCtx)
    const { content: roteiro, usage } = await callOpenAI(prompt, {
      temperature: 0.7,
      max_tokens: 2048,
    })

    if (!roteiro || roteiro.length < 50) {
      return NextResponse.json(
        { error: 'GPT retornou roteiro muito curto ou vazio' },
        { status: 422 }
      )
    }

    // Validar qualidade
    const duracaoAlvo = ideiaCtx.duracao_estimada || 35
    const qualidade = validarRoteiro(roteiro, duracaoAlvo)

    // Buscar config de auto-approve
    const { data: autoApproveConfig } = await supabase
      .schema('pulso_automation')
      .from('ai_config')
      .select('valor')
      .eq('chave', 'auto_approve_roteiro')
      .single()

    // TRAVA DE HOOK (Kaizen): nota 1-5 da 1ª frase. Hook <=2 NUNCA auto-aprova.
    const hook = avaliarHook(roteiro)

    const autoApprove = autoApproveConfig?.valor === true || autoApproveConfig?.valor === 'true'
    const autoApproveThreshold = 80
    const shouldAutoApprove = autoApprove && qualidade.score >= autoApproveThreshold && hook.nota >= 3

    // Salvar roteiro
    const { data: saved, error: saveError } = await supabase
      .schema('pulso_content')
      .from('roteiros')
      .insert({
        ideia_id: ideia.id,
        canal_id: canal.id,
        titulo: ideia.titulo,
        conteudo_md: roteiro,
        versao: 1,
        duracao_estimado_segundos: qualidade.duracao_estimada,
        status: shouldAutoApprove ? 'APROVADO' : 'RASCUNHO',
        linguagem: canal.idioma,
        nota_hook: hook.nota,
        metadata: {
          hook_motivos: hook.motivos,
          ai_modelo: 'gpt-4o',
          gerado_em: new Date().toISOString(),
          gerado_via: 'automation',
          prompt_version: '5.0',
          quality_score: qualidade.score,
          validacoes: qualidade,
          auto_aprovado: shouldAutoApprove,
          palavras_total: qualidade.palavras,
          total_caracteres: roteiro.length,
          total_paragrafos: roteiro.split('\n\n').filter(Boolean).length,
          tokens_usados: usage,
        },
      })
      .select('id, titulo, status')
      .single()

    if (saveError) {
      return NextResponse.json(
        { error: `Erro ao salvar roteiro: ${saveError.message}` },
        { status: 500 }
      )
    }

    // mantém o kanban: garante entrada no pipeline (AGUARDANDO_ROTEIRO até aprovação; ROTEIRO_PRONTO se auto-aprovado)
    {
      const { data: pipeExist } = await supabase
        .schema('pulso_content')
        .from('pipeline_producao')
        .select('id')
        .eq('ideia_id', ideia.id)
        .limit(1)
      const statusPipe = shouldAutoApprove ? 'ROTEIRO_PRONTO' : 'AGUARDANDO_ROTEIRO'
      if (pipeExist && pipeExist.length > 0) {
        await supabase
          .schema('pulso_content')
          .from('pipeline_producao')
          .update({ roteiro_id: saved.id, status: statusPipe })
          .eq('id', pipeExist[0].id)
      } else {
        await supabase
          .schema('pulso_content')
          .from('pipeline_producao')
          .insert({ ideia_id: ideia.id, roteiro_id: saved.id, status: statusPipe, prioridade: 5,
            metadata: { criado_por: 'automation' } })
      }
    }

    return NextResponse.json({
      success: true,
      roteiro_id: saved?.id,
      titulo: saved?.titulo,
      status: saved?.status,
      quality_score: qualidade.score,
      auto_aprovado: shouldAutoApprove,
      duracao_estimada: qualidade.duracao_estimada,
      palavras: qualidade.palavras,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
