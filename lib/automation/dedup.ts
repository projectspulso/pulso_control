/**
 * Trava anti-duplicidade de ideias.
 *
 * O gerador de ideias (GPT) pode, ao longo do tempo, propor o mesmo tema com
 * títulos diferentes ("O navio fantasma..." vs "O enigma do Mary Celeste...").
 * Comparar título exato não pega isso — então usamos similaridade de Jaccard
 * sobre os tokens de título+descrição. Acima do limiar, a candidata é tratada
 * como duplicata e NÃO é inserida (fica registrada em `ignorados` para ser
 * transparente, nunca descartada em silêncio).
 */

import { acharColisao } from './ancora'

const STOP = new Set(
  ('a o e de da do das dos que com para por um uma uns umas no na nos nas em ao aos ' +
    'se os as mais como qual quais quando onde porque seu sua suas seus pra pelo pela ' +
    'sobre entre ja nao sim foi era sao ser ter the of and').split(' ')
)

export function tokenize(text: string): Set<string> {
  const s = (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove acentos (diacríticos combinantes)
    .replace(/[^a-z0-9 ]/g, ' ')
  return new Set(s.split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w)))
}

export function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0
  let inter = 0
  for (const t of a) if (b.has(t)) inter++
  return inter / (a.size + b.size - inter)
}

export interface DedupItem {
  titulo: string
  descricao?: string | null
  /** o caso concreto (ideias.metadata.ancora na existente; `ancora` direto na candidata do GPT) */
  ancora?: string | null
  metadata?: { ancora?: string | null } | null
}

const ancoraDe = (i: DedupItem) => i.ancora || i.metadata?.ancora || null

/**
 * QUEM BLOQUEIA UMA IDEIA NOVA — descartada também bloqueia, com uma exceção.
 *
 * "Descartada" guarda dois motivos opostos, e até 23/09/2026 a trava tratava os dois igual:
 *   · ASSUNTO ruim (Copa, tema centrado em pessoa, duplicata) — tem que continuar bloqueando,
 *     senão o gerador repropõe o mesmo assunto recusado para sempre. Eram 13 das 17 descartadas.
 *   · EXECUÇÃO ruim (erro de fato, roteiro fraco) — o assunto é bom. Bloquear impede justamente
 *     a versão corrigida: o eclipse assírio de 763 a.C. foi barrado por "contar a mesma história"
 *     da versão que atribuía o eclipse aos maias, descartada minutos antes por esse erro.
 *
 * Por isso o tipo mora em `metadata.descarte.tipo`. Sem tipo = assunto (o padrão seguro, e o que
 * vale para todo descarte antigo). Só `'execucao'` libera. A trava do ROTEIRO (âncora e gêmeo, em
 * gerar-roteiro) já ignorava descartadas — esta regra é da trava de IDEIA.
 */
export interface IdeiaParaDedup extends DedupItem {
  status?: string | null
  metadata?: { descarte?: { tipo?: string }; ancora?: string | null } | null
}

export function bloqueiamDuplicidade<T extends IdeiaParaDedup>(existentes: T[]): T[] {
  return existentes.filter((i) => !(i.status === 'DESCARTADA' && i.metadata?.descarte?.tipo === 'execucao'))
}

/**
 * SÓ O TÍTULO — a descrição saiu em 29/07/2026, e essa era a falha principal.
 *
 * Medido nas 6 duplicatas reais do acervo: com título+descrição elas pontuavam 0,11 a 0,25
 * contra um limiar de 0,45 — a trava pegava ZERO. A descrição é longa e sempre diferente entre
 * dois vídeos do mesmo assunto, então ela DILUI a sobreposição do título. Só no título os mesmos
 * pares dão 0,30 a 0,50.
 *
 * Baixar o limiar não resolvia: 0,40 / 0,35 / 0,30 com descrição junto continuavam pegando zero.
 * O problema era a feature, não o corte.
 */
export function chaveSimilaridade(item: DedupItem): Set<string> {
  return tokenize(item.titulo)
}

export interface DuplicataMatch {
  titulo: string
  similar_a: string
  score: number
}

/**
 * Limiar de SUSPEITA, não de veto. 0.30 no título pega as 6 duplicatas reais medidas em 29/07
 * (0,30–0,50) — mas nesse corte o Jaccard também gera falso positivo, porque casa FRASE e não
 * assunto. Dois exemplos reais do acervo:
 *   "Uma carta perdida que mudou tudo"  ×  "O fóssil que mudou tudo em 2003"  (33%) — carta ≠ fóssil
 *   "A estrada que brilha no escuro"    ×  "Por que a Lua brilha no escuro?"  (33%) — estrada ≠ Lua
 *
 * Por isso o lexical virou GERADOR DE CANDIDATOS e quem decide é a camada semântica. O corte
 * anterior (0.45 sobre título+descrição) não pegava nada; este pega demais de propósito, e o LLM
 * separa. Errar pra mais custa uma chamada de LLM; errar pra menos custa um render duplicado.
 */
export const LIMIAR_DUPLICIDADE = 0.3

/**
 * Filtra candidatas contra as ideias existentes E contra as já aceitas no
 * mesmo lote. Retorna o que entra e o que foi barrado (com o motivo).
 */
export function filtrarDuplicatas<T extends DedupItem>(
  candidatas: T[],
  existentes: DedupItem[],
  limiar: number = LIMIAR_DUPLICIDADE
): { aceitas: T[]; ignoradas: DuplicataMatch[] } {
  const aceitas: T[] = []
  const ignoradas: DuplicataMatch[] = []
  const base = existentes.map((e) => ({ titulo: e.titulo, chave: chaveSimilaridade(e) }))

  for (const cand of candidatas) {
    const chaveCand = chaveSimilaridade(cand)
    let pior: DuplicataMatch | null = null
    for (const ref of base) {
      const score = jaccard(chaveCand, ref.chave)
      if (score >= limiar && (!pior || score > pior.score)) {
        pior = { titulo: cand.titulo, similar_a: ref.titulo, score: Number(score.toFixed(2)) }
      }
    }
    if (pior) {
      ignoradas.push(pior)
    } else {
      aceitas.push(cand)
      // a aceita vira referência para o resto do lote (dedup intra-lote)
      base.push({ titulo: cand.titulo, chave: chaveCand })
    }
  }

  return { aceitas, ignoradas }
}

/**
 * ÂNCORA NA IDEIA (29/10/2026) — até aqui ela só agia no roteiro.
 *
 * O que passou: "A ilha que ressurge a cada século!" (âncora `Ilha Bermeja`) entrou com o #214
 * já publicado — "A ilha que flutua e muda de lugar no mapa", âncora `Ilha de Bermeja 1937`. O
 * Jaccard de título deu ~0 e a camada semântica via só os TÍTULOS existentes, onde Bermeja não
 * aparece.
 *
 * SUSPEITA, NÃO VETO. Rodada no acervo inteiro (277 âncoras), a colisão de âncora acusou 14 pares:
 * ~8 eram mesmo caso (Roy Sullivan, UVB-76, Mar Morto, Planeta Nove, Bermeja), ~6 não eram
 * ("escultura do MASP" × "hérnia de disco" por `sao-paulo`; "múmias Chinchorro" × "cactos do
 * Atacama"; "M87*" × "buraco negro de Perseus"). Por isso a colisão vai para a camada semântica
 * como pergunta explícita, com o caso dos dois lados, e o LLM decide.
 */
export interface SuspeitaAncora {
  /** índice da candidata */
  candidata: number
  existente: string
}

export function suspeitasPorAncora(candidatas: DedupItem[], existentes: DedupItem[]): SuspeitaAncora[] {
  const base = existentes
    .map((e, n) => ({ id: String(n), titulo: e.titulo, ancora: ancoraDe(e) }))
    .filter((e) => e.ancora)
  const saida: SuspeitaAncora[] = []
  candidatas.forEach((c, i) => {
    const a = ancoraDe(c)
    const col = a ? acharColisao(a, base) : null
    if (col) saida.push({ candidata: i, existente: `${col.colideCom.titulo} [caso: ${base[Number(col.colideCom.id)]?.ancora ?? col.colideCom.ancora}]` })
  })
  return saida
}

/**
 * DUAS RAZÕES DIFERENTES PARA UM LOTE VAZIO — e elas não podiam continuar iguais na tela.
 *
 * A checagem semântica é fail-closed: se a IA cai ou devolve JSON quebrado, o lote é barrado em
 * vez de entrar sem conferência. Isso está certo. O errado era o desfecho SE PARECER com veto:
 * o dono lia "0 geradas · 5 barradas" sem distinguir "essas cinco já existem" de "não consegui
 * checar". A primeira frase pede outro assunto; a segunda pede outra tentativa. `indisponivel`
 * separa as duas — quem chama decide se tenta de novo ou avisa que o acervo está saturado.
 */
export interface ResultadoSemantico<T> {
  aceitas: T[]
  ignoradas: DuplicataMatch[]
  /** true = a checagem não pôde ser feita (barrado por precaução), não que sejam duplicatas */
  indisponivel: boolean
}

/**
 * 2ª camada — duplicidade SEMÂNTICA via LLM. O Jaccard (acima) é lexical: pega
 * "navio fantasma" vs "Mary Celeste" mas PERDE quando o mesmo tema é descrito com
 * palavras totalmente diferentes ("seu cérebro acha que uma mão falsa é sua" ==
 * "Efeito Rubber Hand"; "menino que sobreviveu a 2 desastres" == "mulher que
 * sobreviveu a 2 desastres"). Aqui o próprio modelo julga se o ASSUNTO CENTRAL
 * é o mesmo. Injetamos o `callLLM` pra não acoplar este módulo ao cliente de IA.
 * Resiliente: se a IA falhar/!JSON, devolve tudo como aceito (não trava a geração).
 */
export async function filtrarDuplicatasSemantica<T extends DedupItem>(
  candidatas: T[],
  existentes: DedupItem[],
  callLLM: (prompt: string) => Promise<string>
): Promise<ResultadoSemantico<T>> {
  const suspeitas = suspeitasPorAncora(candidatas, existentes)
  // com o caso ao lado do título: "A ilha que flutua e muda de lugar no mapa" não diz Bermeja
  const titulos = existentes
    .filter((e) => e.titulo)
    .map((e) => (ancoraDe(e) ? `${e.titulo} [caso: ${ancoraDe(e)}]` : e.titulo))
  if (candidatas.length === 0 || titulos.length === 0) {
    return { aceitas: candidatas, ignoradas: [], indisponivel: false }
  }

  const prompt = [
    'Você é curador de um canal de vídeos curtos de curiosidades/mistérios.',
    'Tarefa: para cada IDEIA CANDIDATA, decidir se ela conta a MESMA HISTÓRIA de alguma IDEIA EXISTENTE.',
    '',
    // O CRITÉRIO, e ele é a coisa mais importante deste prompt. Sem defini-lo, "na dúvida barre"
    // fez o modelo barrar por GÊNERO: em 30/07 recusou "a colônia de Roanoke" contra "o Farol das
    // Ilhas Flannan" — colônia inglesa sumida em 1587 na América × faroleiros sumidos em 1900 na
    // Escócia. Só compartilham "gente que desapareceu". Um lote inteiro morreu assim.
    'O CRITÉRIO É O EVENTO/OBJETO ESPECÍFICO, NUNCA O GÊNERO.',
    'Duas ideias sobre desaparecimentos são histórias DIFERENTES se o desaparecimento for outro.',
    'Duas ideias sobre mapas antigos são DIFERENTES se o mapa for outro.',
    'Duas ideias sobre cidades perdidas são DIFERENTES se a cidade for outra.',
    'Pergunte: é o MESMO caso, com o mesmo protagonista/lugar/data? Se for outro caso, NÃO é duplicata.',
    '',
    'É DUPLICATA (mesma história) — barre:',
    '- "Seu cérebro acha que uma mão falsa é sua" ≡ "Efeito Rubber Hand"',
    '- "O menino que sobreviveu a 2 desastres aéreos" ≡ "A mulher que sobreviveu a 2 desastres aéreos"',
    '- "Voo 19: aviões somem no Triângulo" ≡ "5 aviões da Marinha desaparecem nas Bermudas em 1945"',
    // Casos REAIS que passaram e viraram vídeo repetido — o padrão é o mesmo fenômeno com moldura
    // trocada, não o mesmo evento. A versão anterior deste prompt só ensinava "mesmo evento".
    '- "Por que esquecemos o que íamos DIZER ao entrar numa sala" ≡ "...o que íamos FAZER em outra sala" (mesmo efeito de porta)',
    '- "O Erro COMUM que destrói seu foco" ≡ "O Erro MORTAL que destrói seu foco"',
    '- "Um relojoeiro suíço criou em 1923 um relógio que manipula o tempo" ≡ "Um relógio em Praga marcava o tempo ao contrário em 1922" (mesma premissa e época; só trocou o detalhe)',
    '- "Como a Rota da Seda moldou conflitos modernos" ≡ "Como o Irã moldou a Rota da Seda" (mesmo objeto central)',
    '',
    'NÃO é duplicata quando o CASO é outro, mesmo com palavras ou gênero iguais — casos REAIS que',
    'foram barrados por engano em 30/07 e NÃO devem ser barrados:',
    '- "A colônia de ROANOKE que desapareceu" ≠ "O Farol das ILHAS FLANNAN" (dois sumiços, casos distintos)',
    '- "Os mapas antigos que revelam terras desconhecidas" ≠ "O mapa de PIRI REIS" (mapas diferentes)',
    '- "O artefato de 5000 anos indecifrável" ≠ "O manuscrito de VOYNICH" (objetos diferentes)',
    '- "Uma CARTA perdida que mudou tudo" ≠ "O FÓSSIL que mudou tudo em 2003"',
    '- "A ESTRADA que brilha no escuro" ≠ "Por que a LUA brilha no escuro"',
    '- técnica Pomodoro ≠ aprender durante o sono',
    '',
    'IDEIAS EXISTENTES:',
    ...titulos.map((t, i) => `E${i + 1}. ${t}`),
    '',
    'IDEIAS CANDIDATAS:',
    ...candidatas.map((c, i) => `C${i + 1}. ${c.titulo}${ancoraDe(c) ? ` [caso: ${ancoraDe(c)}]` : ''} — ${(c.descricao || '').slice(0, 140)}`),
    '',
    ...(suspeitas.length
      ? [
          '',
          'ATENÇÃO — o CASO declarado destas candidatas colide com o de uma existente. Confira caso a caso',
          '(mesmo lugar/objeto/evento = duplicata, mesmo que o título seja outro; nome em comum por acaso, como',
          'uma cidade citada em duas histórias diferentes, NÃO é):',
          ...suspeitas.map((x) => `- C${x.candidata + 1} × ${x.existente}`),
          '',
        ]
      : []),
    'Responda APENAS JSON: {"duplicatas":[{"candidata":<n de C>,"igual_a":"<titulo existente>","motivo":"<curto>"}]}.',
    // Viés calibrado em 30/07: "na dúvida marque" sozinho zerou um lote inteiro (5 de 5 barradas,
    // 0 geradas), porque a dúvida virava "parece do mesmo tipo". A dúvida legítima é sobre o CASO
    // ser o mesmo, não sobre o gênero — daí a pergunta explícita abaixo.
    'Na dúvida sobre ser O MESMO CASO, marque como duplicata. Mas se for outro caso, deixe passar mesmo que o tema soe parecido — barrar um assunto inédito custa uma ideia boa.',
  ].join('\n')

  let parsed: { duplicatas?: Array<{ candidata?: number; igual_a?: string }> }
  try {
    parsed = JSON.parse(await callLLM(prompt))
  } catch {
    // FAIL-CLOSED (29/07/2026): antes o catch devolvia TUDO como aceito, em silêncio — se a
    // chamada falhasse ou o JSON viesse quebrado, o lote inteiro entrava sem checagem semântica e
    // ninguém ficava sabendo. Agora barra tudo e diz por quê: melhor um lote perdido (o gerador
    // roda de novo) do que duplicata entrando calada na esteira.
    return {
      aceitas: [],
      ignoradas: candidatas.map((c) => ({
        titulo: c.titulo,
        similar_a: '(checagem semântica indisponível — lote barrado por precaução)',
        score: 0,
      })),
      indisponivel: true,
    }
  }

  const dup = new Map<number, string>()
  for (const d of parsed.duplicatas || []) {
    if (typeof d.candidata === 'number') dup.set(d.candidata - 1, d.igual_a || '(existente)')
  }
  const aceitas: T[] = []
  const ignoradas: DuplicataMatch[] = []
  candidatas.forEach((c, i) => {
    if (dup.has(i)) ignoradas.push({ titulo: c.titulo, similar_a: dup.get(i)!.replace(/ \[caso: [^\]]*\]$/, ''), score: 1 })
    else aceitas.push(c)
  })
  return { aceitas, ignoradas, indisponivel: false }
}
