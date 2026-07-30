import { NextRequest, NextResponse } from 'next/server'
import { guardApi } from '@/lib/auth/api-guard'
import { escolherCanalPorDesempenho, type CanalCandidato } from '@/lib/automation/escolher-canal'
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
    let motivoCanal: string | null = null
    let pesosCanal: Array<{ nome: string; peso: number; mediana: number; n: number }> = []
    if (payload.canal_id) {
      const { data } = await supabase
        .schema('pulso_core')
        .from('canais')
        .select('id, nome, descricao, idioma, slug')
        .eq('id', payload.canal_id)
        .single()
      canal = data
    } else {
      // ESCOLHA POR DESEMPENHO (29/07/2026), no lugar de "canal com menos ideias".
      //
      // A rotação por contagem escolheu o Pulso Dark PT num teste real e o lote saiu inteiro de
      // horror fabricado — o oposto do que o PLANO_CRESCIMENTO manda. A identidade do canal vence
      // a estratégia de tema, então o canal errado já perde antes do prompt. E os canais diferem
      // 13× em mediana de Facebook (IA 86 × Mistérios & História 1.151), diferença que a contagem
      // ignorava. Ver lib/automation/escolher-canal.ts.
      const [canaisQ, ideiasCanalQ, metricasQ] = await Promise.all([
        supabase.schema('pulso_core').from('canais').select('id, nome, descricao, idioma, slug'),
        supabase.schema('pulso_content').from('ideias').select('id, canal_id'),
        supabase
          .schema('pulso_content')
          .from('metricas_publicacao')
          .select('ideia_id, views')
          .eq('plataforma', 'facebook'),
      ])
      if (canaisQ.error) {
        return NextResponse.json({ error: `Canais: ${canaisQ.error.message}` }, { status: 500 })
      }

      const canalDaIdeia = new Map<string, string>()
      for (const i of ideiasCanalQ.data || []) if (i.canal_id) canalDaIdeia.set(i.id, i.canal_id)

      const viewsPorCanal = new Map<string, number[]>()
      for (const m of metricasQ.data || []) {
        const c = m.ideia_id ? canalDaIdeia.get(m.ideia_id) : null
        if (!c) continue
        if (!viewsPorCanal.has(c)) viewsPorCanal.set(c, [])
        viewsPorCanal.get(c)!.push(m.views ?? 0)
      }

      const escolha = escolherCanalPorDesempenho(
        (canaisQ.data || []) as CanalCandidato[],
        [...viewsPorCanal.entries()].map(([canalId, viewsFacebook]) => ({ canalId, viewsFacebook }))
      )
      canal = escolha?.canal as typeof canal
      motivoCanal = escolha?.motivo ?? null
      pesosCanal = escolha?.pesos ?? []
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

    // Aprendizado da audiência (loop fechado): ganchos campeões + tema×rede
    let aprendizado: string | undefined
    try {
      const { data: ap } = await supabase
        .schema('pulso_core')
        .from('configuracoes')
        .select('valor')
        .eq('chave', 'aprendizado_cerebro')
        .maybeSingle()
      if (ap?.valor) aprendizado = JSON.parse(ap.valor).texto
    } catch {
      /* aprendizado é opcional — segue sem ele */
    }

    // Gerar ideias via GPT
    const prompt = buildPromptGerarIdeias(canal, serie, quantidade, aprendizado)
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
        canal_motivo: motivoCanal,
        canal_pesos: pesosCanal,
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
        tipo_hook?: string
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
          tipo_hook: ideia.tipo_hook,
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
      // o porquê da escolha do canal — o dono precisa poder discordar do sorteio
      canal_motivo: motivoCanal,
      canal_pesos: pesosCanal,
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
