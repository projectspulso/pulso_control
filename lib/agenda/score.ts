/**
 * PONTUAÇÃO DO ESTOQUE — qual vídeo publicar primeiro, e por quê.
 *
 * Função pura, sem I/O: as telas passam os dados que já buscam. Existe pra haver UMA
 * cabeça de decisão — antes a /agenda ordenava por maturidade do ativo, a /publicar por
 * nota_hook e a /validacao por `nota × 100000 + views`, cada uma dando uma resposta.
 *
 * POR QUE A nota_hook SAIU DO COMANDO: medida contra o resultado real (n=82), a correlação
 * dela é ~ZERO — −0,015 com views e −0,030 com o percentil de retenção. Ela era o critério
 * dominante das telas de decisão e é ruído. Fica só como desempate leve, até ser auditada
 * contra a retenção observada.
 *
 * O QUE MANDA AGORA:
 *  - retenção do canal (peso 55) — único sinal de QUALIDADE preenchido. Em percentil DENTRO
 *    da rede, porque retenção crua não se compara entre plataformas (o YouTube passa de 100%
 *    quando o Short entra em loop; IG/FB têm teto ~100).
 *  - idade no estoque (peso 30) — vídeo pronto e parado é dinheiro gasto rendendo zero; é
 *    também o que faz buraco cicatrizar em vez de envelhecer.
 *  - nota_hook (peso 15) — desempate.
 *
 * AMOSTRA PEQUENA: canal com poucas leituras é puxado pro neutro (shrinkage k=8). Sem isso o
 * ranking oscilaria com 1 vídeo — há canal com 4 leituras. E TikTok/Kwai NÃO entregam
 * retenção: canal cujo histórico mora lá fica neutro, e o motivo diz isso na cara.
 */

export interface LeituraRetencao {
  plataforma: string
  taxaRetencao: number | null
  canalId: string | null
}

export interface ItemEstoque {
  ideiaId: string
  canalId: string | null
  notaHook: number | null
  /** quando as cenas ficaram prontas — proxy honesto de "parado desde". updated_at não serve:
   *  operação em lote carimba tudo no mesmo dia. */
  prontoDesde: string | null
}

export interface ItemPontuado {
  ideiaId: string
  score: number
  motivo: string
  /** sinais crus, pra tela mostrar sem recalcular */
  percentilCanal: number | null
  leiturasCanal: number
  diasParado: number | null
}

const PESO_RETENCAO = 55
const PESO_IDADE = 30
const PESO_HOOK = 15
const SHRINK_K = 8 // leituras necessárias pra confiar no canal; abaixo disso puxa pro neutro
const SATURA_DIAS = 14 // parado além disso não ganha mais pontos

/** Percentil de um valor dentro da própria rede (0..1). Retenção não é comparável entre redes. */
function percentisPorRede(leituras: LeituraRetencao[]) {
  const porRede = new Map<string, number[]>()
  for (const l of leituras) {
    if (l.taxaRetencao == null) continue
    if (!porRede.has(l.plataforma)) porRede.set(l.plataforma, [])
    porRede.get(l.plataforma)!.push(l.taxaRetencao)
  }
  for (const arr of porRede.values()) arr.sort((a, b) => a - b)
  return (plataforma: string, valor: number) => {
    const arr = porRede.get(plataforma)
    if (!arr || arr.length < 2) return null
    let abaixo = 0
    for (const v of arr) if (v < valor) abaixo++
    return abaixo / (arr.length - 1)
  }
}

/** Média de percentil por canal, amortecida rumo a 0,5 quando a amostra é pequena. */
function retencaoPorCanal(leituras: LeituraRetencao[]) {
  const pct = percentisPorRede(leituras)
  const acc = new Map<string, { soma: number; n: number }>()
  for (const l of leituras) {
    if (!l.canalId || l.taxaRetencao == null) continue
    const p = pct(l.plataforma, l.taxaRetencao)
    if (p == null) continue
    const a = acc.get(l.canalId) || { soma: 0, n: 0 }
    a.soma += p
    a.n += 1
    acc.set(l.canalId, a)
  }
  const saida = new Map<string, { valor: number; n: number }>()
  for (const [canal, a] of acc) {
    const bruto = a.soma / a.n
    // shrinkage: (n·média + k·0,5) / (n + k)
    const valor = (a.n * bruto + SHRINK_K * 0.5) / (a.n + SHRINK_K)
    saida.set(canal, { valor, n: a.n })
  }
  return saida
}

function diasDesde(iso: string | null, agora: number): number | null {
  if (!iso) return null
  const t = new Date(iso).getTime()
  if (!Number.isFinite(t)) return null
  return Math.max(0, Math.floor((agora - t) / 86_400_000))
}

/**
 * Pontua o estoque pronto. Devolve na ordem de publicação (melhor primeiro), com o motivo
 * escrito — o dono precisa entender o porquê, não obedecer uma caixa-preta.
 */
export function pontuarEstoque(
  itens: ItemEstoque[],
  leituras: LeituraRetencao[],
  nomeCanal: Map<string, string>,
  agora: number = Date.now()
): ItemPontuado[] {
  const porCanal = retencaoPorCanal(leituras)

  const pontuados = itens.map((it) => {
    const ret = it.canalId ? porCanal.get(it.canalId) : undefined
    const percentil = ret?.valor ?? null
    const n = ret?.n ?? 0
    const dias = diasDesde(it.prontoDesde, agora)

    const fRet = percentil ?? 0.5 // sem histórico = neutro, nunca penaliza por falta de dado
    const fIdade = dias == null ? 0 : Math.min(1, dias / SATURA_DIAS)
    const fHook = it.notaHook == null ? 0.5 : Math.min(1, Math.max(0, (it.notaHook - 3) / 2))

    const score = PESO_RETENCAO * fRet + PESO_IDADE * fIdade + PESO_HOOK * fHook

    // MOTIVO: só afirma o que o dado sustenta. Amostra fraca vira ressalva explícita —
    // trocar uma caixa-preta por outra seria pior que não ter score.
    const partes: string[] = []
    const canal = (it.canalId && nomeCanal.get(it.canalId)) || null
    if (percentil != null && n >= 5) {
      const pos = percentil >= 0.6 ? 'acima da média' : percentil <= 0.4 ? 'abaixo da média' : 'na média'
      partes.push(`${canal || 'o canal'} retém ${pos} da casa (${Math.round(percentil * 100)}%, ${n} leituras)`)
    } else if (percentil != null) {
      partes.push(`${canal || 'o canal'} tem só ${n} leitura(s) de retenção — tratado como neutro`)
    } else {
      partes.push(`sem retenção medida neste canal (TikTok e Kwai não entregam esse dado)`)
    }
    if (dias != null && dias >= 7) partes.push(`pronto e parado há ${dias} dias`)
    else if (dias != null) partes.push(`pronto há ${dias} dia(s)`)

    return {
      ideiaId: it.ideiaId,
      score: Math.round(score * 10) / 10,
      motivo: partes.join(' · '),
      percentilCanal: percentil,
      leiturasCanal: n,
      diasParado: dias,
    }
  })

  return pontuados.sort((a, b) => b.score - a.score)
}

/**
 * Escolhe os N do dia a partir da lista ordenada, EVITANDO dois do mesmo canal.
 *
 * Sem isto o dia vira um canal só: o topo do placar real hoje são #88 e #116, os dois de
 * Motivacional, empatados no mesmo score — publicar os dois seguidos desperdiça a variedade
 * que segura a audiência. Só repete canal se não houver alternativa (aí a operação continua,
 * mas o motivo avisa).
 */
export function escolherDoDia(
  ordenados: ItemPontuado[],
  canalPorIdeia: Map<string, string | null>,
  n: number
): Set<string> {
  const escolhidos = new Set<string>()
  const canaisUsados = new Set<string>()

  for (const p of ordenados) {
    if (escolhidos.size >= n) break
    const canal = canalPorIdeia.get(p.ideiaId) || null
    if (canal && canaisUsados.has(canal)) continue // já tem um deste canal hoje
    escolhidos.add(p.ideiaId)
    if (canal) canaisUsados.add(canal)
  }
  // faltou gente? completa na ordem, repetindo canal (estoque curto é pior que repetir)
  for (const p of ordenados) {
    if (escolhidos.size >= n) break
    escolhidos.add(p.ideiaId)
  }
  return escolhidos
}
