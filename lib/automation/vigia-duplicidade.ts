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

/**
 * A CTA NÃO É A HISTÓRIA — e ignorá-la tirou o falso positivo mais teimoso.
 *
 * Todo roteiro fecha com a chamada da marca e, muitas vezes, com o teaser do PRÓXIMO vídeo. Dois
 * roteiros que promovem o mesmo próximo vídeo passam a dividir termos raros que não têm nada a ver
 * com o que eles contam. Foi o caso de "Por que o cérebro mente para você?" e "O homem que
 * sobreviveu a um deserto congelante": os dois terminam falando de "um jogador que previu o
 * resultado de todas as partidas", e `jogador` + `partidas` bastaram para o vigia acusar.
 *
 * Cortar SÓ no marcador não resolveu, e a razão importa: o fecho não tem forma única. Um roteiro
 * diz "Siga o PULSO", outro "Segue o Pulso", e um terceiro nem usa a marca — fecha com "fique de
 * olho no próximo vídeo". Por isso o corte é duplo: o marcador quando existe, e SEMPRE a cauda.
 *
 * A cauda é defensável porque a CTA é obrigatória (regra PULSO-CTA): nos ~1.000 caracteres de um
 * roteiro, os últimos 15% são o fecho por construção, nunca o miolo da história.
 *
 * Medido no acervo (189 roteiros): sem corte 23 pares e 5 evitáveis · só marcador 21 e 5 ·
 * marcador + cauda 19 e 4, com o par falso acima eliminado.
 */
const MARCA_CTA = /s[ei]g(?:a|ue|uir)\s+o\s+pulso|fique\s+de\s+olho|no\s+pr[oó]ximo\s+v[ií]deo/i
/** fração do fim que é fecho por construção, com piso para roteiros curtos */
const CAUDA = 0.15
const CAUDA_MIN = 120

function semCta(texto: string | null | undefined): string {
  const t = texto || ''
  const m = t.match(MARCA_CTA)
  const porMarca = m && m.index != null ? m.index : t.length
  const porCauda = Math.max(0, t.length - Math.max(CAUDA_MIN, Math.floor(t.length * CAUDA)))
  return t.slice(0, Math.min(porMarca, porCauda))
}

function termos(texto: string | null | undefined): Set<string> {
  const s = semCta(texto)
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
