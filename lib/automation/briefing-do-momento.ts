import 'server-only'

import { classificarTema, PAPEL_NO_FACEBOOK, type Tema } from '@/lib/decisor/temas'
import { montarContratoRedes, type ContratoRedes } from '@/lib/decisor/contrato-redes'

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
  contratoRedes: ContratoRedes
}

interface Pub {
  ideia_id: string | null
  plataforma: string
  views: number | null
  /** o que a plataforma devolve medido; TikTok e Kwai não entregam e vêm null */
  taxa_retencao?: number | null
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
  canalNome: string,
  /** duração do áudio e nota de hook por ideia — alimentam o contrato por rede */
  duracoes: Map<string, number> = new Map(),
  notasHook: Map<string, number> = new Map(),
  quantidade = 0
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

  // CONTRATO POR REDE — a medição de 01/09 mostrou que o TEMA não separa as redes (todas querem
  // história/mistério), mas a FORMA separa muito: o gancho vale 2,07× no TikTok e 0,68× no
  // Facebook. Então cada ideia nasce mirando UMA rede, e a mira é a forma, não o assunto.
  const contratoRedes = montarContratoRedes(
    pubs.map((p) => ({
      ideia_id: p.ideia_id,
      plataforma: p.plataforma,
      views: p.views,
      // até 02/09/2026 esta linha era `taxa_retencao: null` — o dado existia em 456 publicações
      // e nenhuma chegava ao gerador. Ver o cabeçalho de lib/decisor/contrato-redes.ts.
      taxa_retencao: p.taxa_retencao ?? null,
    })),
    tituloPorId,
    duracoes,
    notasHook,
    corpos
  )
  const redesOrdenadas = Object.entries(contratoRedes)
    .filter(([, v]) => v.pesoHook != null || v.duracaoCampea || v.temaTop)
    .sort((a, b) => (b[1].pesoHook ?? 1) - (a[1].pesoHook ?? 1))
  const linhasRede = redesOrdenadas.map(([, v]) => `- ${v.instrucao}`).join('\n')
  // reparte as ideias entre as redes com sinal: a 1ª mira a rede mais exigente, e assim por diante
  const mira = quantidade > 0 && redesOrdenadas.length
    ? Array.from({ length: quantidade }, (_, i) => `Ideia ${i + 1} → mirar ${redesOrdenadas[i % redesOrdenadas.length][0]}`).join(' · ')
    : ''

  const texto = `RETRATO DO MOMENTO (medido no banco agora — vale mais que qualquer preferência):

DESEMPENHO REAL POR TEMA (mediana de views no Facebook, a rede que mais sorteia alcance):
${linhaDesempenho}
${temaQuente ? `O tema que mais rende hoje é ${temaQuente}.` : ''}
Temas que a medição já mostrou fracos: ${mortos.join(', ')}.

ESTOQUE NÃO PUBLICADO POR TEMA (o que já está na fila esperando):
${linhaEstoque}

O QUE CADA REDE PREMIA (medido, com a amostra entre parênteses):
${linhasRede || '- ainda sem amostra suficiente por rede'}

MIRA DESTA RODADA — cada ideia nasce pensada para UMA rede:
${mira || '- sem mira definida nesta rodada'}
O ASSUNTO continua o mesmo para todas (a medição mostrou que as redes concordam no tema);
o que muda por rede é a FORMA: onde o gancho decide, a primeira frase precisa ser a melhor
possível; onde não decide, invista no assunto e no desenvolvimento.

COMO USAR ISTO (regra dura):
- O tema forte indica a DIREÇÃO, nunca o assunto. É proibido reescrever um campeão com outras
  palavras — clone de campeão foi erro caro do passado e a duplicidade é barrada na entrada.
- Se um tema já tem estoque grande, ele NÃO precisa de mais ideias agora: prefira o tema que rende
  e está sub-representado na fila. Ideia parada não vira view.
- Cada ideia precisa de um objeto/lugar/fenômeno CONCRETO diferente dos que já existem.

TÍTULOS QUE JÁ EXISTEM (não repetir assunto, ângulo nem objeto central):
${titulosRecentes.map((t) => `- ${t}`).join('\n') || '- (fila vazia)'}

Canal desta rodada: ${canalNome}.`

  return { texto, temaQuente, estoquePorTema, titulosRecentes, contratoRedes }
}
