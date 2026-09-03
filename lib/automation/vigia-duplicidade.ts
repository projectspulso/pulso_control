/**
 * VIGIA DE DUPLICIDADE — a rede que pega o que a âncora deixar passar.
 *
 * Custa ZERO: é frequência de token no corpo dos roteiros, sem uma única chamada de LLM. A ideia
 * é simples e foi validada contra o acervo real em 02/09/2026: dois roteiros que contam a mesma
 * história compartilham termos RAROS (nomes, lugares, datas, termos técnicos), mesmo quando os
 * títulos não se parecem em nada.
 *
 * Foi assim que os dois repetidos apareceram — invisíveis para a trava lexical, que só via título:
 *   #25 "Por que 25 minutos podem transformar seu estudo?"  ×  #26 "O que Einstein fazia para
 *       manter o foco?"  → 0% de título em comum, 8 termos raros (blocos, pausas, intervalos…)
 *   #8  "Por Que Algumas Pessoas Atraem Relâmpagos?"  ×  #108 "O homem que sobreviveu duas vezes
 *       ao mesmo raio!"  → 0% de título, e os dois falam de `sullivan`
 *
 * REGRA DO RARO: um termo que aparece em até RARO_MAX roteiros é âncora provável; um que aparece
 * em muitos é vocabulário do canal ("mistério", "descoberta") e não distingue nada.
 */

const VAZIAS = new Set(
  ('a o e de da do das dos que com para por um uma uns umas no na nos nas em ao aos se os as ' +
    'mais como qual quais quando onde porque seu sua suas seus pra pelo pela sobre entre ja nao ' +
    'sim foi era sao ser ter the of and mas isso essa esse esta este pelos pelas apenas ainda ' +
    'depois antes tambem muito toda todo todos todas cada outro outra sem sob ate desde entao ' +
    'porem contudo talvez sempre nunca aqui ali agora hoje ontem amanha voce gente eles elas ' +
    'nos eu ele ela').split(' ')
)

/** Termos curtos não ancoram nada; abaixo disso é ruído. */
const MIN_LETRAS = 5
/** Em quantos roteiros um termo pode aparecer e ainda contar como raro. */
const RARO_MAX = 3
/** Quantos termos raros em comum já merecem um olhar humano. */
const MIN_COMUNS = 3
/** Acima disto a trava lexical de título já enxerga o par — não precisa duplicar o aviso. */
const TITULO_MAX = 0.3

function termos(texto: string | null | undefined): Set<string> {
  const s = (texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
  return new Set(s.split(/\s+/).filter((w) => w.length >= MIN_LETRAS && !VAZIAS.has(w)))
}

function termosTitulo(texto: string | null | undefined): Set<string> {
  const s = (texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
  return new Set(s.split(/\s+/).filter((w) => w.length > 2 && !VAZIAS.has(w)))
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0
  let inter = 0
  for (const t of a) if (b.has(t)) inter++
  return inter / (a.size + b.size - inter)
}

export interface ItemVigiado {
  id: string
  titulo: string | null
  corpo: string | null
  /** para a tela saber o que ainda dá tempo de impedir */
  publicado: boolean
  numero?: number | null
}

export interface ParSuspeito {
  a: { id: string; titulo: string; numero?: number | null; publicado: boolean }
  b: { id: string; titulo: string; numero?: number | null; publicado: boolean }
  termosComuns: string[]
  similaridadeTitulo: number
  /** o par ainda dá pra impedir? (pelo menos um dos dois não publicou) */
  evitavel: boolean
}

export function varrerDuplicidade(itens: ItemVigiado[]): ParSuspeito[] {
  const comCorpo = itens.filter((i) => i.corpo && i.titulo)
  const freq = new Map<string, number>()
  const porItem = new Map<string, Set<string>>()
  for (const i of comCorpo) {
    const t = termos(i.corpo)
    porItem.set(i.id, t)
    for (const w of t) freq.set(w, (freq.get(w) || 0) + 1)
  }

  const pares: ParSuspeito[] = []
  for (let x = 0; x < comCorpo.length; x++) {
    for (let y = x + 1; y < comCorpo.length; y++) {
      const A = comCorpo[x]
      const B = comCorpo[y]
      const sim = jaccard(termosTitulo(A.titulo), termosTitulo(B.titulo))
      if (sim >= TITULO_MAX) continue // a trava lexical já vê este
      const tb = porItem.get(B.id)!
      const comuns: string[] = []
      for (const w of porItem.get(A.id)!) {
        if (tb.has(w) && (freq.get(w) || 0) <= RARO_MAX) comuns.push(w)
      }
      if (comuns.length < MIN_COMUNS) continue
      pares.push({
        a: { id: A.id, titulo: A.titulo!, numero: A.numero, publicado: A.publicado },
        b: { id: B.id, titulo: B.titulo!, numero: B.numero, publicado: B.publicado },
        termosComuns: comuns.slice(0, 10),
        similaridadeTitulo: Number(sim.toFixed(2)),
        evitavel: !A.publicado || !B.publicado,
      })
    }
  }

  // o que ainda dá pra impedir vem primeiro; depois o par com mais evidência
  return pares.sort((p, q) => {
    if (p.evitavel !== q.evitavel) return p.evitavel ? -1 : 1
    return q.termosComuns.length - p.termosComuns.length
  })
}
