import { NextRequest, NextResponse } from 'next/server'
import { guardApi } from '@/lib/auth/api-guard'
import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { callOpenAI } from '@/lib/automation/ai-clients'
import { buildPromptGerarIdeias } from '@/lib/automation/prompts'
import { filtrarDuplicatas, filtrarDuplicatasSemantica } from '@/lib/automation/dedup'

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
  const denied = await guardApi(request)
  if (denied) return denied

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

      if (!canal) {
        // fallback: rotação direta na tabela de canais (canal com menos ideias)
        const [todosQ, ideiasQ] = await Promise.all([
          supabase.schema('pulso_core').from('canais').select('id, nome, descricao, idioma, slug'),
          supabase.schema('pulso_content').from('ideias').select('canal_id'),
        ])
        if (todosQ.error) {
          return NextResponse.json({ error: `Fallback canais: ${todosQ.error.message}` }, { status: 500 })
        }
        const contagem = new Map<string, number>()
        for (const i of ideiasQ.data || []) {
          if (i.canal_id) contagem.set(i.canal_id, (contagem.get(i.canal_id) || 0) + 1)
        }
        canal = (todosQ.data || []).sort(
          (a: { id: string }, b: { id: string }) => (contagem.get(a.id) || 0) - (contagem.get(b.id) || 0)
        )[0]
      }
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

    // Parse JSON response — em json_mode o modelo embrulha o array em alguma chave do objeto
    let ideias
    try {
      const parsed = JSON.parse(content)
      if (Array.isArray(parsed)) {
        ideias = parsed
      } else {
        const ehListaDeIdeias = (v: unknown): v is unknown[] =>
          Array.isArray(v) && v.length > 0 && typeof v[0] === 'object' && v[0] !== null && 'titulo' in v[0]
        const arrayInterno = Object.values(parsed).find(ehListaDeIdeias)
        ideias = ehListaDeIdeias(parsed.ideias) ? parsed.ideias : arrayInterno || [parsed]
      }
      ideias = (ideias as Array<{ titulo?: string }>).filter((i) => i && typeof i.titulo === 'string' && i.titulo)
      if (ideias.length === 0) throw new Error('sem ideias com titulo')
    } catch {
      return NextResponse.json(
        { error: 'GPT retornou JSON inválido', raw: content },
        { status: 422 }
      )
    }

    // TRAVA ANTI-DUPLICIDADE: barra ideias semelhantes a existentes (qualquer
    // canal/status) e dedup intra-lote. Mary Celeste etc. nunca mais entram 2x.
    const { data: existentesIdeias } = await supabase
      .schema('pulso_content')
      .from('ideias')
      .select('titulo, descricao')
    const { aceitas, ignoradas } = filtrarDuplicatas(
      ideias as Array<{ titulo: string; descricao?: string | null }>,
      existentesIdeias || []
    )
    // 2ª camada: duplicidade SEMÂNTICA via LLM — pega o que o Jaccard lexical perde
    // (ex.: "cérebro acha que mão falsa é sua" == "Efeito Rubber Hand"). Resiliente.
    const semantica = await filtrarDuplicatasSemantica(
      aceitas,
      existentesIdeias || [],
      (p) => callOpenAI(p, { json_mode: true, temperature: 0, max_tokens: 1200 }).then((r) => r.content)
    )
    ideias = semantica.aceitas
    const ignoradasTotal = [...ignoradas, ...semantica.ignoradas]

    if (ideias.length === 0) {
      return NextResponse.json({
        success: true,
        canal: canal.nome,
        quantidade_gerada: 0,
        ideias: [],
        ignoradas_duplicidade: ignoradasTotal,
        aviso: 'Todas as ideias geradas já existiam (trava anti-duplicidade lexical + semântica).',
        tokens: usage,
      })
    }

    // Salvar ideias no banco
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ideiasParaSalvar = (ideias as any[]).map(
      (ideia: {
        titulo: string
        descricao: string
        tags?: string[]
        duracao_estimada?: number
        tipo_formato?: string
        prioridade?: number
        gancho_sugerido?: string
        emocao_ancora?: string
        gatilho_psicologico?: string
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
        gatilho_psicologico: ideia.gatilho_psicologico || null,
        metadata: {
          ai_modelo: 'gpt-4o',
          gerado_em: new Date().toISOString(),
          duracao_estimada: `${ideia.duracao_estimada || 30}s`,
          tipo_formato: ideia.tipo_formato,
          gancho_sugerido: ideia.gancho_sugerido,
          emocao_ancora: ideia.emocao_ancora,
          gatilho_psicologico: ideia.gatilho_psicologico,
          harness: 'HARNESS_ROTEIRO_PULSO.md',
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
      ignoradas_duplicidade: ignoradasTotal,
      tokens: usage,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
