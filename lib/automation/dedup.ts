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
}

export function chaveSimilaridade(item: DedupItem): Set<string> {
  return tokenize(`${item.titulo} ${item.descricao || ''}`)
}

export interface DuplicataMatch {
  titulo: string
  similar_a: string
  score: number
}

/**
 * Limiar padrão. 0.45 separou o único par real de duplicatas (Mary Celeste,
 * 0.48) sem falsos positivos nas 83 ideias existentes.
 */
export const LIMIAR_DUPLICIDADE = 0.45

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
): Promise<{ aceitas: T[]; ignoradas: DuplicataMatch[] }> {
  const titulos = existentes.map((e) => e.titulo).filter(Boolean)
  if (candidatas.length === 0 || titulos.length === 0) {
    return { aceitas: candidatas, ignoradas: [] }
  }

  const prompt = [
    'Você é curador de um canal de vídeos curtos de curiosidades/mistérios.',
    'Tarefa: para cada IDEIA CANDIDATA, decidir se ela é, NO FUNDO, o MESMO tema/história/fenômeno de alguma IDEIA EXISTENTE — mesmo que escrita com palavras diferentes.',
    'É duplicata (mesmo assunto central):',
    '- "Seu cérebro acha que uma mão falsa é sua" ≡ "Efeito Rubber Hand"',
    '- "O menino que sobreviveu a 2 desastres aéreos" ≡ "A mulher que sobreviveu a 2 desastres aéreos"',
    '- "Voo 19: aviões somem no Triângulo" ≡ "5 aviões da Marinha desaparecem nas Bermudas em 1945"',
    'NÃO é duplicata quando o fenômeno central é diferente (ex.: técnica Pomodoro vs aprender durante o sono são distintas).',
    '',
    'IDEIAS EXISTENTES:',
    ...titulos.map((t, i) => `E${i + 1}. ${t}`),
    '',
    'IDEIAS CANDIDATAS:',
    ...candidatas.map((c, i) => `C${i + 1}. ${c.titulo} — ${(c.descricao || '').slice(0, 140)}`),
    '',
    'Responda APENAS JSON: {"duplicatas":[{"candidata":<n de C>,"igual_a":"<titulo existente>","motivo":"<curto>"}]}.',
    'Inclua só candidatas que são claramente o mesmo assunto central de alguma existente. Na dúvida, NÃO marque.',
  ].join('\n')

  let parsed: { duplicatas?: Array<{ candidata?: number; igual_a?: string }> }
  try {
    parsed = JSON.parse(await callLLM(prompt))
  } catch {
    return { aceitas: candidatas, ignoradas: [] }
  }

  const dup = new Map<number, string>()
  for (const d of parsed.duplicatas || []) {
    if (typeof d.candidata === 'number') dup.set(d.candidata - 1, d.igual_a || '(existente)')
  }
  const aceitas: T[] = []
  const ignoradas: DuplicataMatch[] = []
  candidatas.forEach((c, i) => {
    if (dup.has(i)) ignoradas.push({ titulo: c.titulo, similar_a: dup.get(i)!, score: 1 })
    else aceitas.push(c)
  })
  return { aceitas, ignoradas }
}
