import { NextRequest, NextResponse } from 'next/server'
import { guardApi } from '@/lib/auth/api-guard'
import { escolherCanalPorDesempenho, type CanalCandidato } from '@/lib/automation/escolher-canal'
import { montarBriefing } from '@/lib/automation/briefing-do-momento'
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
/** duas quebras entre os blocos de contexto do prompt (aprendizado + briefing) */
const SEPARADOR = '\n\n'

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

    // BRIEFING DO MOMENTO — o dado de HOJE, não o resumo salvo dias atrás.
    // O aprendizado (texto) diz COMO escrever; o briefing diz SOBRE O QUE faz sentido escrever
    // agora: o que rende, o que já está na fila e o que não pode repetir. Ver
    // lib/automation/briefing-do-momento.ts. Falha aqui não derruba a geração — só perde contexto.
    let briefing: string | undefined
    try {
      const [pubsQ, ideiasQ, rotQ, audiosQ] = await Promise.all([
        supabase.schema('pulso_content').from('metricas_publicacao').select('ideia_id, plataforma, views, taxa_retencao'),
        supabase.schema('pulso_content').from('ideias').select('id, titulo, status'),
        // nota_hook alimenta o peso do gancho por rede — o eixo que mais separa as redes
        supabase.schema('pulso_content').from('roteiros').select('ideia_id, conteudo_md, nota_hook'),
        supabase.schema('pulso_content').from('audios').select('ideia_id, duracao_segundos'),
      ])
      const corpos = new Map<string, string | null>()
      const notasHook = new Map<string, number>()
      for (const r of (rotQ.data || []) as Array<{ ideia_id: string; conteudo_md: string | null; nota_hook: number | null }>) {
        if (!r.ideia_id) continue
        if (!corpos.has(r.ideia_id)) corpos.set(r.ideia_id, r.conteudo_md)
        if (typeof r.nota_hook === 'number' && !notasHook.has(r.ideia_id)) notasHook.set(r.ideia_id, r.nota_hook)
      }
      const duracoes = new Map<string, number>()
      for (const a of (audiosQ.data || []) as Array<{ ideia_id: string; duracao_segundos: number | null }>) {
        if (a.ideia_id && a.duracao_segundos != null && !duracoes.has(a.ideia_id)) duracoes.set(a.ideia_id, a.duracao_segundos)
      }
      const publicadas = new Set(
        ((pubsQ.data || []) as Array<{ ideia_id: string | null }>).map((p) => p.ideia_id).filter((x): x is string => !!x)
      )
      briefing = montarBriefing(
        (pubsQ.data || []) as Array<{
          ideia_id: string | null
          plataforma: string
          views: number | null
          taxa_retencao: number | null
        }>,
        (ideiasQ.data || []) as Array<{ id: string; titulo: string | null; status: string }>,
        publicadas,
        corpos,
        canal.nome,
        duracoes,
        notasHook,
        quantidade
      ).texto
    } catch (e) {
      console.error('[gerar-ideias] briefing indisponível, seguindo sem ele:', e)
    }

    // Gerar ideias via GPT
    const contexto = [aprendizado, briefing].filter(Boolean).join(SEPARADOR)
    const prompt = buildPromptGerarIdeias(canal, serie, quantidade, contexto || undefined)
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

    // SEGUNDA TENTATIVA quando o lote inteiro cai (30/07/2026). O dono clicou e recebeu
    // "0 ideia(s) gerada(s) · 5 barrada(s)" — botão que não entrega nada é botão quebrado, e a
    // culpa não é dele: o canal Mistérios & História já tem muito assunto ocupado, então é normal
    // um lote inteiro colidir. Em vez de devolver vazio, o gerador roda de novo sabendo o que foi
    // recusado. Uma vez só — se cair de novo, aí é sinal real de saturação e o aviso diz isso.
    let tentouDeNovo = false
    if (ideias.length === 0 && ignoradasTotal.length > 0) {
      tentouDeNovo = true
      const recusadas = ignoradasTotal.map((d) => `- "${d.titulo}" (já existe algo igual)`).join('\n')
      const promptRetry = `${prompt}

ATENÇÃO — TENTATIVA 2. As ideias abaixo você JÁ propôs agora há pouco e TODAS foram recusadas por
já existirem no acervo. Não proponha nenhuma variação delas:
${recusadas}

Escolha CASOS ESPECÍFICOS e inéditos: um evento nomeado, com lugar e época próprios. Evite título
genérico de categoria ("os mapas antigos", "o artefato indecifrável") — genérico colide com tudo
que já existe. Nomeie o caso.`
      try {
        const retry = await callOpenAI(promptRetry, { temperature: 0.9, json_mode: true })
        const p2 = JSON.parse(retry.content)
        const ehLista = (v: unknown): v is unknown[] =>
          Array.isArray(v) && v.length > 0 && typeof v[0] === 'object' && v[0] !== null && 'titulo' in v[0]
        const brutas = Array.isArray(p2) ? p2 : ehLista(p2.ideias) ? p2.ideias : Object.values(p2).find(ehLista) || []
        const cand = (brutas as Array<{ titulo?: string }>).filter((i) => i && typeof i.titulo === 'string' && i.titulo)
        if (cand.length) {
          const lex2 = filtrarDuplicatas(
            cand as Array<{ titulo: string; descricao?: string | null }>,
            existentesIdeias || []
          )
          const sem2 = await filtrarDuplicatasSemantica(lex2.aceitas, existentesIdeias || [], (p) =>
            callOpenAI(p, { json_mode: true, temperature: 0, max_tokens: 1200 }).then((r) => r.content)
          )
          ideias = sem2.aceitas
          ignoradasTotal.push(...lex2.ignoradas, ...sem2.ignoradas)
        }
      } catch {
        /* a 2ª tentativa é bônus — se falhar, cai no aviso de lote vazio abaixo */
      }
    }

    if (ideias.length === 0) {
      return NextResponse.json({
        success: true,
        canal: canal.nome,
        canal_motivo: motivoCanal,
        canal_pesos: pesosCanal,
        quantidade_gerada: 0,
        ideias: [],
        ignoradas_duplicidade: ignoradasTotal,
        // "não consegui checar" pede OUTRA TENTATIVA; "já existe" pede OUTRO ASSUNTO. Enquanto os
        // dois diziam a mesma frase, uma queda da OpenAI parecia acervo saturado.
        checagem_indisponivel: semantica.indisponivel,
        aviso: semantica.indisponivel
          ? 'A checagem semântica não pôde ser feita (IA indisponível) e o lote foi barrado por precaução — NÃO é duplicata. Tente de novo em instantes.'
          : tentouDeNovo
            ? `Duas tentativas e tudo colidiu com o acervo — "${canal.nome}" está saturado. Escolha outro canal no seletor.`
            : 'Todas as ideias geradas já existiam (trava anti-duplicidade lexical + semântica).',
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
        ancora?: string
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
          // A ÂNCORA é o caso concreto no centro da história — a identidade do vídeo, declarada
          // no nascimento em vez de inferida depois. Ver lib/automation/ancora.ts.
          ancora: ideia.ancora || null,
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
