/**
 * ESCOLHA DO CANAL PARA GERAR IDEIAS — por desempenho, não por contagem.
 *
 * A rotação anterior pegava o "canal com menos ideias", pra equilibrar o acervo. O problema
 * apareceu num teste real em 29/07/2026: ela escolheu o Pulso Dark PT e o lote saiu inteiro de
 * horror fabricado (múmia que morre de susto, espelho que prende almas) — o oposto do que o
 * PLANO_CRESCIMENTO manda produzir. A identidade do canal vence a estratégia de tema, então
 * escolher o canal ERRADO já perde a batalha antes do prompt.
 *
 * E os canais não são equivalentes. Mediana de views no Facebook (a rede que traz seguidor),
 * medida em 29/07:
 *   PULSO Ciencia 1.466 (n=4) · Mistérios & História 1.151 (n=11) · Dark PT 1.088 (n=5)
 *   Curiosidades 964 (n=8) · ... · Estudos & Produtividade 279 (n=9) · Games 198 (n=3) · IA 86 (n=5)
 * A rotação antiga dava o mesmo peso ao PULSO IA (86) e ao Mistérios & História (1.151) — 13× de
 * diferença ignorada.
 *
 * COMO ESCOLHE AGORA: sorteio ponderado pela mediana de Facebook do canal, com duas travas.
 *  - SHRINKAGE (k=5): canal com poucas publicações é puxado pra mediana geral. Sem isso o
 *    PULSO Ciencia lideraria com n=4, e 1 viral definiria a produção de um mês.
 *  - PISO DE EXPLORAÇÃO: todo canal mantém peso mínimo. Cegar num canal só mata a chance de
 *    descobrir o próximo campeão — e a amostra de vários canais ainda é pequena demais pra
 *    cravar que são ruins.
 * Sorteio (e não "sempre o melhor") porque escolher sempre o topo congela o acervo num canal só.
 */

export interface CanalCandidato {
  id: string
  nome: string
  [k: string]: unknown
}

export interface DesempenhoCanal {
  canalId: string
  /** views no Facebook de cada vídeo publicado daquele canal */
  viewsFacebook: number[]
}

const SHRINK_K = 5 // publicações necessárias pra confiar na mediana do canal
// PISO DE EXPLORAÇÃO — quanto de peso todo canal mantém, mesmo indo mal.
//
// Era 0,25. Baixado para 0,10 em 02/09/2026, em recuperação: o canal caiu de ~2.500 para 119
// views/dia depois de 3 dias publicando pela metade, e com o piso alto o sorteio deu 5% a um
// canal de mediana 280 enquanto história/arqueologia faz ~2.900. Em recuperação, cada ideia
// conta demais para gastar em aposta.
//
// NÃO é zero de propósito: cegar no que já vence congela o acervo e mata a chance de achar o
// próximo campeão — a amostra por canal ainda é pequena (n=3 a 11) para cravar que algum é ruim.
// REVISITAR quando as views voltarem ao patamar de ~2.000/dia: aí o piso volta para 0,25.
const PISO_EXPLORACAO = 0.10

function mediana(a: number[]): number {
  if (!a.length) return 0
  const s = [...a].sort((x, y) => x - y)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

export interface EscolhaCanal {
  canal: CanalCandidato
  /** o porquê, pra tela e pro log — nunca uma caixa-preta */
  motivo: string
  pesos: Array<{ nome: string; peso: number; mediana: number; n: number }>
}

/**
 * @param sorteio número em [0,1) — injetável pra teste ser determinístico
 */
export function escolherCanalPorDesempenho(
  canais: CanalCandidato[],
  desempenho: DesempenhoCanal[],
  sorteio: number = Math.random()
): EscolhaCanal | null {
  if (!canais.length) return null

  const porCanal = new Map(desempenho.map((d) => [d.canalId, d.viewsFacebook]))
  const todas = desempenho.flatMap((d) => d.viewsFacebook)
  const medianaGeral = mediana(todas) || 1

  const linhas = canais.map((c) => {
    const v = porCanal.get(c.id) || []
    const n = v.length
    const bruta = n ? mediana(v) : medianaGeral
    // shrinkage rumo à mediana geral quando a amostra é curta
    const ajustada = (n * bruta + SHRINK_K * medianaGeral) / (n + SHRINK_K)
    return { canal: c, n, mediana: Math.round(bruta), peso: ajustada }
  })

  const pesoMedio = linhas.reduce((s, l) => s + l.peso, 0) / linhas.length
  const piso = pesoMedio * PISO_EXPLORACAO
  for (const l of linhas) l.peso = Math.max(l.peso, piso)

  const total = linhas.reduce((s, l) => s + l.peso, 0)
  if (total <= 0) return { canal: canais[0], motivo: 'sem dado de desempenho — primeiro canal', pesos: [] }

  let acc = 0
  const alvo = Math.min(0.999999, Math.max(0, sorteio)) * total
  let escolhido = linhas[linhas.length - 1]
  for (const l of linhas) {
    acc += l.peso
    if (alvo < acc) {
      escolhido = l
      break
    }
  }

  const chance = Math.round((escolhido.peso / total) * 100)
  const motivo = escolhido.n
    ? `mediana ${escolhido.mediana} no Facebook em ${escolhido.n} publicação(ões) — ${chance}% de chance no sorteio ponderado`
    : `sem publicação medida — entrou pelo piso de exploração (${chance}% de chance)`

  return {
    canal: escolhido.canal,
    motivo,
    pesos: linhas
      .map((l) => ({ nome: l.canal.nome, peso: Math.round((l.peso / total) * 100), mediana: l.mediana, n: l.n }))
      .sort((a, b) => b.peso - a.peso),
  }
}
