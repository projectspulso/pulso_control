import { NextRequest, NextResponse } from 'next/server'
import { guardApi } from '@/lib/auth/api-guard'
import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { callOpenAI } from '@/lib/automation/ai-clients'
import { buildPromptDoMomento } from '@/lib/automation/prompts'
import { filtrarDuplicatas, filtrarDuplicatasSemantica } from '@/lib/automation/dedup'

/**
 * POST /api/automation/do-momento
 *
 * Raia "DO MOMENTO": recebe um ASSUNTO EM ALTA e gera uma ideia PULSO pelo
 * ângulo educativo/atemporal (harness com guardrails — sem desgraça/política/fake).
 * Payload: { assunto: string, canal_id?: string }
 * Tema sensível (guerra/desastre/religião/política) entra com precisa_revisao=true.
 */
export async function POST(request: NextRequest) {
  const denied = await guardApi(request)
  if (denied) return denied

  const payload = await request.json()
  const assunto = (payload.assunto || '').trim()
  if (!assunto) {
    return NextResponse.json({ error: 'assunto é obrigatório' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseAdminClient() as any

  try {
    // Canal "do Momento" (ou canal_id explícito)
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
      const { data } = await supabase
        .schema('pulso_core')
        .from('canais')
        .select('id, nome, descricao, idioma, slug')
        .ilike('nome', '%do Momento%')
        .limit(1)
      canal = data?.[0]
    }
    if (!canal) {
      return NextResponse.json({ error: 'Canal "do Momento" não encontrado' }, { status: 404 })
    }

    // Gera a ideia com o harness editorial do Momento
    const prompt = buildPromptDoMomento(assunto, canal)
    const { content, usage } = await callOpenAI(prompt, { temperature: 0.7, json_mode: true })

    let ideia: Record<string, unknown>
    try {
      ideia = JSON.parse(content)
    } catch {
      return NextResponse.json({ error: 'GPT retornou JSON inválido', raw: content }, { status: 422 })
    }

    // O modelo pode recusar o assunto (sem ângulo seguro)
    if (ideia.descartar) {
      return NextResponse.json({
        success: true,
        descartado: true,
        motivo: ideia.motivo || 'Sem ângulo educativo/atemporal seguro para este assunto.',
        assunto,
      })
    }
    if (!ideia.titulo || typeof ideia.titulo !== 'string') {
      return NextResponse.json({ error: 'Ideia sem título', raw: content }, { status: 422 })
    }

    // ANTI-DUPLICIDADE — as DUAS camadas, como no gerador de ideias.
    //
    // Esta rota ficou só com a lexical até 02/09/2026, e o Jaccard de título perde justamente o
    // que a raia "do Momento" mais produz: o mesmo assunto em alta descrito com outras palavras.
    // Uma ideia por clique parecia risco pequeno — mas duplicata que entra aqui custa o render
    // inteiro lá na frente, igual às que já viraram vídeo repetido (#85×#76, #9×#73, #113×#111).
    const { data: existentes } = await supabase
      .schema('pulso_content')
      .from('ideias')
      .select('titulo, descricao')
    const candidata = [{ titulo: ideia.titulo as string, descricao: (ideia.descricao as string) || '' }]
    const barrada = (motivo: string) =>
      NextResponse.json({
        success: true,
        duplicada: true,
        aviso: motivo,
        titulo: ideia.titulo,
      })

    const { aceitas } = filtrarDuplicatas(candidata, existentes || [])
    if (aceitas.length === 0) {
      return barrada('Ideia já existe (trava anti-duplicidade).')
    }
    const semantica = await filtrarDuplicatasSemantica(aceitas, existentes || [], (pr) =>
      callOpenAI(pr, { json_mode: true, temperature: 0, max_tokens: 1200 }).then((r) => r.content)
    )
    if (semantica.aceitas.length === 0) {
      const igual = semantica.ignoradas[0]?.similar_a
      return barrada(`Conta a mesma história de "${igual ?? 'uma ideia existente'}" (trava semântica).`)
    }

    const precisaRevisao = ideia.precisa_revisao === true
    const { data: saved, error: saveError } = await supabase
      .schema('pulso_content')
      .from('ideias')
      .insert({
        canal_id: canal.id,
        titulo: ideia.titulo,
        descricao: ideia.descricao || '',
        tags: ideia.tags || [],
        linguagem: canal.idioma,
        origem: 'IA_DO_MOMENTO',
        prioridade: (ideia.prioridade as number) || 7,
        status: 'RASCUNHO',
        gatilho_psicologico: ideia.gatilho_psicologico || null,
        metadata: {
          ai_modelo: 'gpt-4o',
          gerado_em: new Date().toISOString(),
          raia: 'do_momento',
          assunto_origem: assunto,
          angulo: ideia.angulo || null,
          duracao_estimada: `${(ideia.duracao_estimada as number) || 45}s`,
          tipo_formato: ideia.tipo_formato,
          gancho_sugerido: ideia.gancho_sugerido,
          emocao_ancora: ideia.emocao_ancora,
          gatilho_psicologico: ideia.gatilho_psicologico,
          precisa_revisao: precisaRevisao,
          motivo_revisao: ideia.motivo_revisao || '',
          harness: 'HARNESS_DO_MOMENTO',
          tokens_usados: usage,
        },
      })
      .select('id, titulo')
      .single()

    if (saveError) {
      return NextResponse.json({ error: `Erro ao salvar: ${saveError.message}` }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      canal: canal.nome,
      ideia: saved,
      angulo: ideia.angulo,
      precisa_revisao: precisaRevisao,
      motivo_revisao: ideia.motivo_revisao || '',
      gancho_sugerido: ideia.gancho_sugerido,
      tokens: usage,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
