/**
 * ROTEADOR DA AGENDA — qual vídeo entra em cada slot, e por quê.
 *
 * O QUE ISTO SUBSTITUI: a agenda tinha TRÊS cabeças que não se falavam.
 *   1. /api/agenda/popular preenchia por GRADE DE CANAL ("terça 18h é do canal X") e, dentro do
 *      canal, pegava o item mais avançado na produção. Nada de tema, nada de desempenho.
 *   2. lib/agenda/score.ts (retenção + idade + hook) existia, mas só rodava na aba Hoje.
 *   3. o rank por estágio decidia empate.
 *
 * A BURRICE PRINCIPAL era o canal amarrado ao dia: terça é do PULSO IA (mediana 86 no Facebook)
 * tenha ele algo bom ou não, enquanto um história/arqueologia (mediana 2.919) espera na fila. A
 * amarração existia pra forçar variedade quando não havia sinal; hoje há sinal, e ela custa caro.
 *
 * O MODELO REAL (conferido no banco, não suposto): um slot é `dia + horário + faixa`, e cada
 * vídeo publicado vai para as CINCO redes de uma vez — não existe slot por rede. Por isso o tema
 * pesa em todo slot: todo vídeo passa pelo Facebook, e é lá que está a loteria.
 *
 * O SINAL QUE MANDA (medido em 29-30/07/2026 sobre 95 publicações de Facebook):
 *   história/arqueologia  mediana 2.919 — os 6 estouros de 48 dias saíram TODOS dela
 *   tecnologia/IA 268 · produtividade 252 — zero estouros. Lift de 10,9×.
 *
 * POR QUE NÃO ROTEAR 100% PELO QUE VENCE: congelaria a operação em história/arqueologia e mataria
 * a chance de achar o próximo tema campeão — com n=3 a 19 por canal, condenar os outros é cedo.
 * Daí a faixa SAZONAL virar o slot de exploração, e a trava de variedade impedir o mesmo tema
 * dois dias seguidos (fadiga de fórmula já nos custou caro: ver duplicidade-causa-raiz).
 */

import { classificarTema, PAPEL_NO_FACEBOOK, MEDIANA_FB_MEDIDA, type Tema } from '@/lib/decisor/temas'

export type Faixa = 'perene' | 'sazonal'

export interface CandidatoAgenda {
  ideiaId: string
  titulo: string
  /** roteiro (conteudo_md) — desempata o tema quando o título não diz o assunto */
  corpo?: string | null
  /** vídeo pronto > áudio > roteiro > ideia — desempata, não manda */
  estagio: 'video' | 'audio' | 'roteiro' | 'ideia'
  canalId: string | null
  canalNome?: string | null
  /** percentil de retenção do canal dentro da rede (0..1); null = sem histórico */
  percentilCanal: number | null
  /** dias parado no estoque — pronto e parado é dinheiro rendendo zero */
  diasParado: number | null
}

export interface SlotParaPreencher {
  chave: string // "data|horario"
  data: string
  horario: string
  faixa: Faixa
  /** canal da grade — vira PREFERÊNCIA (desempate), não mais amarração */
  canalIdPreferido?: string | null
}

export interface EscolhaSlot {
  ideiaId: string
  titulo: string
  tema: Tema
  estagio: CandidatoAgenda['estagio']
  score: number
  /** escrito em português — o dono precisa poder discordar, não obedecer */
  motivo: string
}

const BONUS_TEMA_SORTEIA = 45
const PENALIDADE_TEMA_MORTO = 35
const PESO_RETENCAO = 30
const PESO_IDADE = 20
const PESO_ESTAGIO = 15
const BONUS_CANAL_PREFERIDO = 8 // a grade vira empurrãozinho, não lei
const PENALIDADE_TEMA_REPETIDO = 25 // fadiga: mesmo tema em dias seguidos cansa o feed
const SATURA_DIAS = 14

const RANK_ESTAGIO: Record<CandidatoAgenda['estagio'], number> = { video: 1, audio: 0.66, roteiro: 0.33, ideia: 0 }

/** Dias mínimos até virar vídeo publicável. Cada etapa leva ~1 dia e o render ainda passa por
 *  fila + autorização humana no kanban — por isso a ideia precisa de 3, não de 0. */
const DIAS_ATE_PRONTO: Record<CandidatoAgenda['estagio'], number> = { video: 0, audio: 1, roteiro: 2, ideia: 3 }
const PENALIDADE_NAO_DA_TEMPO = 60 // maior que o bônus de tema: estar pronto vem antes de ser bom

function hojeISO() {
  return new Date().toISOString().slice(0, 10)
}

function diasEntre(deISO: string, ateISO: string): number | null {
  const a = new Date(`${deISO}T00:00:00Z`).getTime()
  const b = new Date(`${ateISO}T00:00:00Z`).getTime()
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null
  return Math.round((b - a) / 86_400_000)
}

export function pontuarCandidato(
  c: CandidatoAgenda,
  slot: SlotParaPreencher,
  temaDoDiaAnterior?: Tema | null
): { score: number; motivo: string; tema: Tema } {
  const tema = classificarTema(c.titulo, c.corpo)
  const papel = PAPEL_NO_FACEBOOK[tema]
  const partes: string[] = []
  let score = 0

  // TEMA — vale em todo slot, porque todo vídeo passa pelo Facebook.
  // Na faixa sazonal o peso cai: ela é o slot de exploração, onde tema novo é bem-vindo.
  const pesoTema = slot.faixa === 'sazonal' ? 0.35 : 1
  if (papel === 'sorteia') {
    score += BONUS_TEMA_SORTEIA * pesoTema
    partes.push(`${tema} é o único tema que estourou no Facebook (mediana ${MEDIANA_FB_MEDIDA[tema]})`)
  } else if (papel === 'morto') {
    score -= PENALIDADE_TEMA_MORTO * pesoTema
    partes.push(`${tema} tem mediana ${MEDIANA_FB_MEDIDA[tema]} e zero estouros em 48 dias`)
  }

  if (temaDoDiaAnterior && tema === temaDoDiaAnterior) {
    score -= PENALIDADE_TEMA_REPETIDO
    partes.push('mesmo tema do slot anterior — evita fadiga')
  }

  const fRet = c.percentilCanal ?? 0.5 // sem histórico = neutro; falta de dado não penaliza
  score += PESO_RETENCAO * fRet
  if (c.percentilCanal != null) {
    const pos = c.percentilCanal >= 0.6 ? 'acima da média' : c.percentilCanal <= 0.4 ? 'abaixo da média' : 'na média'
    partes.push(`retenção do canal ${pos} da casa`)
  }

  if (c.diasParado != null) {
    score += PESO_IDADE * Math.min(1, c.diasParado / SATURA_DIAS)
    if (c.diasParado >= 7) partes.push(`parado há ${c.diasParado} dias`)
  }

  score += PESO_ESTAGIO * RANK_ESTAGIO[c.estagio]

  // DÁ TEMPO DE FICAR PRONTO? — a trava que faltava. Sem ela o tema (peso 45) vencia o estágio
  // (peso 15) e a agenda marcava uma IDEIA pra amanhã enquanto um VÍDEO PRONTO esperava 6 dias.
  // Agenda que promete pra amanhã algo que ainda não tem roteiro é ficção: cada etapa (roteiro,
  // áudio, render) leva cerca de um dia, e o render ainda depende de fila e autorização humana.
  const diasAte = diasEntre(hojeISO(), slot.data)
  const faltam = DIAS_ATE_PRONTO[c.estagio]
  if (diasAte != null && diasAte < faltam) {
    score -= PENALIDADE_NAO_DA_TEMPO
    partes.push(`em ${c.estagio}: não fica pronto até lá`)
  } else if (c.estagio !== 'video') {
    partes.push(`ainda em ${c.estagio}`)
  }

  if (slot.canalIdPreferido && c.canalId === slot.canalIdPreferido) {
    score += BONUS_CANAL_PREFERIDO
  }

  return { score: Math.round(score * 10) / 10, motivo: partes.join(' · '), tema }
}

/**
 * Preenche os slots na ordem cronológica, sem repetir vídeo.
 *
 * Os slots PERENES escolhem antes dos sazonais: são as duas publicações que sustentam o
 * crescimento (18h e 21h), então levam o melhor estoque. O sazonal das 12h fica com o que sobra —
 * e é justamente onde tema novo tem chance de aparecer sem custar o horário nobre.
 */
export function rotearSlots(
  slots: SlotParaPreencher[],
  candidatos: CandidatoAgenda[],
  jaUsados: Set<string> = new Set()
): Map<string, EscolhaSlot> {
  const usados = new Set(jaUsados)
  const saida = new Map<string, EscolhaSlot>()

  const ordenados = [...slots].sort((a, b) => {
    if (a.data !== b.data) return a.data < b.data ? -1 : 1
    // perene primeiro dentro do mesmo dia
    if (a.faixa !== b.faixa) return a.faixa === 'perene' ? -1 : 1
    return a.horario < b.horario ? -1 : 1
  })

  const temaPorData = new Map<string, Tema>()

  for (const slot of ordenados) {
    const livres = candidatos.filter((c) => !usados.has(c.ideiaId))
    if (livres.length === 0) break

    const anterior = temaPorData.get(slot.data) ?? null
    const melhor = livres
      .map((c) => ({ c, ...pontuarCandidato(c, slot, anterior) }))
      .sort((a, b) => b.score - a.score)[0]

    usados.add(melhor.c.ideiaId)
    temaPorData.set(slot.data, melhor.tema)
    saida.set(slot.chave, {
      ideiaId: melhor.c.ideiaId,
      titulo: melhor.c.titulo,
      tema: melhor.tema,
      estagio: melhor.c.estagio,
      score: melhor.score,
      motivo: melhor.motivo || 'melhor disponível no estoque',
    })
  }

  return saida
}
