import 'server-only'

import { classificarTema, PAPEL_NO_FACEBOOK, type Tema } from '@/lib/decisor/temas'

/**
 * O ELO QUE FALTAVA — o gerador de ideias passa a consultar o DADO DE HOJE, não só o resumo salvo.
 *
 * O QUE ESTAVA QUEBRADO: o gerador lia `aprendizado_cerebro`, um TEXTO reescrito de tempos em
 * tempos (em 27/08/2026 estava com 3,4 dias). O Decisor, ao lado, recalculava o placar tema×rede
 * a cada leitura. Dois cérebros com relógios diferentes: o Decisor sabia o que estourava agora, o
 * gerador ainda escrevia pela foto de três dias atrás. E, pior, o gerador não enxergava o
 * ESTOQUE — podia pedir a quinta ideia de mistério com doze prontas na fila.
 *
 * O QUE ESTE MÓDULO NÃO FAZ (de propósito): mandar "o tema X estoura, escreva sobre X". Foi
 * exatamente assim que o aprendizado fabricou clones de campeão (ver duplicidade-causa-raiz).
 * Aqui o tema quente entra junto com a LISTA DO QUE JÁ EXISTE e a proibição de repetir ângulo —
 * o dado orienta a direção, nunca dita a cópia.
 */

export interface BriefingDoMomento {
  texto: string
  temaQuente: Tema | null
  estoquePorTema: Record<string, number>
  titulosRecentes: string[]
}

interface Pub {
  ideia_id: string | null
  plataforma: string
  views: number | null
}

interface IdeiaLeve {
  id: string
  titulo: string | null
  status: string
}

/**
 * Monta o retrato do momento a partir do banco: o que rende, o que já existe e o que não pode
 * ser repetido. Tudo com dado de agora — nada de cache.
 */
export function montarBriefing(
  pubs: Pub[],
  ideias: IdeiaLeve[],
  publicadas: Set<string>,
  corpos: Map<string, string | null>,
  canalNome: string
): BriefingDoMomento {
  const tituloPorId = new Map(ideias.map((i) => [i.id, i.titulo]))

  // 1) O QUE RENDE — mediana de views por tema no Facebook (a rede que sorteia alcance).
  // Mediana, não média: um viral solitário não pode eleger um tema.
  const viewsPorTema = new Map<Tema, number[]>()
  for (const p of pubs) {
    if (p.plataforma !== 'facebook' || !p.ideia_id || p.views == null) continue
    const tema = classificarTema(tituloPorId.get(p.ideia_id) ?? null, corpos.get(p.ideia_id) ?? null)
    if (!viewsPorTema.has(tema)) viewsPorTema.set(tema, [])
    viewsPorTema.get(tema)!.push(p.views)
  }
  const medianas: Array<{ tema: Tema; mediana: number; n: number }> = []
  for (const [tema, arr] of viewsPorTema) {
    if (arr.length < 3) continue // amostra menor que 3 não elege nada
    const ord = [...arr].sort((a, b) => a - b)
    const meio = Math.floor(ord.length / 2)
    medianas.push({
      tema,
      mediana: ord.length % 2 ? ord[meio] : Math.round((ord[meio - 1] + ord[meio]) / 2),
      n: arr.length,
    })
  }
  medianas.sort((a, b) => b.mediana - a.mediana)
  const temaQuente = medianas[0]?.tema ?? null

  // 2) O QUE JÁ EXISTE — estoque não publicado por tema. É o freio contra fabricar clone.
  const estoquePorTema: Record<string, number> = {}
  const titulosEstoque: string[] = []
  for (const i of ideias) {
    if (publicadas.has(i.id) || i.status === 'DESCARTADA') continue
    const tema = classificarTema(i.titulo, corpos.get(i.id) ?? null)
    estoquePorTema[tema] = (estoquePorTema[tema] || 0) + 1
    if (i.titulo) titulosEstoque.push(i.titulo)
  }

  // 3) O QUE NÃO PODE REPETIR — os títulos que já existem (estoque + publicados recentes).
  const titulosRecentes = titulosEstoque.slice(-40)

  const linhaDesempenho = medianas.length
    ? medianas.slice(0, 5).map((m) => `${m.tema} (mediana ${m.mediana} views, n=${m.n})`).join(' · ')
    : 'ainda sem amostra suficiente por tema'

  const linhaEstoque = Object.entries(estoquePorTema)
    .sort((a, b) => b[1] - a[1])
    .map(([t, n]) => `${t}: ${n}`)
    .join(' · ') || 'estoque vazio'

  const mortos = (Object.keys(PAPEL_NO_FACEBOOK) as Tema[]).filter((t) => PAPEL_NO_FACEBOOK[t] === 'morto')

  const texto = `RETRATO DO MOMENTO (medido no banco agora — vale mais que qualquer preferência):

DESEMPENHO REAL POR TEMA (mediana de views no Facebook, a rede que mais sorteia alcance):
${linhaDesempenho}
${temaQuente ? `O tema que mais rende hoje é ${temaQuente}.` : ''}
Temas que a medição já mostrou fracos: ${mortos.join(', ')}.

ESTOQUE NÃO PUBLICADO POR TEMA (o que já está na fila esperando):
${linhaEstoque}

COMO USAR ISTO (regra dura):
- O tema forte indica a DIREÇÃO, nunca o assunto. É proibido reescrever um campeão com outras
  palavras — clone de campeão foi erro caro do passado e a duplicidade é barrada na entrada.
- Se um tema já tem estoque grande, ele NÃO precisa de mais ideias agora: prefira o tema que rende
  e está sub-representado na fila. Ideia parada não vira view.
- Cada ideia precisa de um objeto/lugar/fenômeno CONCRETO diferente dos que já existem.

TÍTULOS QUE JÁ EXISTEM (não repetir assunto, ângulo nem objeto central):
${titulosRecentes.map((t) => `- ${t}`).join('\n') || '- (fila vazia)'}

Canal desta rodada: ${canalNome}.`

  return { texto, temaQuente, estoquePorTema, titulosRecentes }
}
