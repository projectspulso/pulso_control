import { classificarTema, type Tema } from '@/lib/decisor/temas'

/**
 * CONTRATO DE APRENDIZADO POR REDE — o Decisor vira o dono da verdade, e o gerador obedece.
 *
 * A PERGUNTA QUE ISTO RESPONDE: "o que faz um vídeo dar certo em CADA rede?" — porque a
 * resposta não é a mesma para todas, e escrever com uma régua só desperdiça as diferenças.
 *
 * O QUE A MEDIÇÃO DE 01/09/2026 MOSTROU (e que muda o desenho óbvio):
 *  · TEMA NÃO diferencia rede. Em 4 das 5, história/arqueologia lidera e tecnologia/IA afunda.
 *    Calibrar tema por rede seria teatro — todas querem a mesma coisa.
 *  · A FORMA diferencia, e muito. Hook forte (nota 4-5) contra fraco (1-3) rende 2,07× no TikTok
 *    e 1,94× no YouTube — mas 0,68× no Facebook, onde o gancho não decide porque a distribuição
 *    é loteria de alcance. Duração de 71-90s rendeu ~6,7× a dos curtos no Instagram.
 *
 * O QUE A AUDITORIA DE 02/09/2026 ACRESCENTOU (e corrigiu um buraco caro): o banco tinha RETENÇÃO
 * em 456 publicações (158/161 do YouTube, 152/164 do Instagram, 146/175 do Facebook) e o gerador
 * recebia `taxa_retencao: null` em TODAS as linhas. Ele calibrava por `nota_hook` — a nota que ELE
 * MESMO deu — tendo o número medido da plataforma na mão.
 *
 * E a retenção fechou o contrato, porque ela é o espelho exato do gancho:
 *  · Facebook: o gancho NÃO decide (0,68×), mas a retenção decide (274 → 1.087 views do pior ao
 *    melhor quartil, 4,0×). Lá não adianta abertura: adianta segurar.
 *  · Instagram: escada igual, 128 → 530 views (4,1×).
 *  · YouTube: o inverso. O gancho vale 1,94× e a retenção é quase PLANA acima de ~49% (533 → 576
 *    → 522). Acima do primeiro quartil, retenção extra não compra alcance.
 *  · TikTok e Kwai não entregam retenção: lá o sinal continua null, e isso é ausência, não zero.
 *
 * Por isso o sinal não é uma razão só: é a MEDIANA DE VIEWS POR QUARTIL DE RETENÇÃO, e a forma da
 * curva (escada / piso / plana) é o que vira instrução. Uma razão única esconderia o platô.
 *
 * REGRA DURA: nada entra no contrato sem amostra. Cada sinal carrega o `n` que o sustenta, e
 * abaixo de N_MINIMO ele vira null — é melhor não orientar do que orientar por ruído. Foi assim
 * que o experimento de forma de hook já funcionava (mínimo por braço) e é assim aqui.
 */

export const N_MINIMO = 5

export interface SinalRede {
  /** razão entre a mediana de views com hook forte (4-5) e com hook fraco (1-3) */
  pesoHook: number | null
  amostraHook: { alto: number; baixo: number }
  /** faixa de duração com maior mediana de views */
  duracaoCampea: { faixa: string; mediana: number; n: number } | null
  /** tema com maior mediana de views nesta rede */
  temaTop: { tema: Tema | string; mediana: number; n: number } | null
  /** mediana de retenção — só as redes que entregam o dado */
  retencaoMediana: number | null
  /** o que a retenção COMPRA nesta rede, por quartil — null quando a rede não entrega o dado */
  retencao: {
    /** do quartil de menor retenção ao de maior */
    quartis: Array<{ deRet: number; ateRet: number; medianaViews: number; n: number }>
    /** escada = paga até o topo · piso = só o quartil de baixo é punido · plana = não paga */
    forma: 'escada' | 'piso' | 'plana'
    /** quantas vezes o melhor quartil rende sobre o pior */
    ganho: number
  } | null
  /** frase acionável que vai para o prompt do gerador */
  instrucao: string
}

export type ContratoRedes = Record<string, SinalRede>

interface Pub { ideia_id: string | null; plataforma: string; views: number | null; taxa_retencao: number | null }

const FAIXAS: Array<[string, number, number]> = [
  ['até 55s', 0, 55],
  ['56-70s', 56, 70],
  ['71-90s', 71, 90],
  ['91s+', 91, 9999],
]

function mediana(a: number[]): number {
  const o = [...a].sort((x, y) => x - y)
  const m = Math.floor(o.length / 2)
  return o.length % 2 ? o[m] : Math.round((o[m - 1] + o[m]) / 2)
}

export function montarContratoRedes(
  pubs: Pub[],
  titulos: Map<string, string | null>,
  duracoes: Map<string, number>,
  notasHook: Map<string, number>,
  corpos?: Map<string, string | null>
): ContratoRedes {
  const redes = [...new Set(pubs.map((p) => p.plataforma))]
  const contrato: ContratoRedes = {}

  for (const rede of redes) {
    const daRede = pubs.filter((p) => p.plataforma === rede && p.views != null && p.ideia_id)

    // 1) PESO DO HOOK — o eixo que mais separa as redes
    const alto = daRede.filter((p) => (notasHook.get(p.ideia_id!) ?? 0) >= 4).map((p) => p.views!)
    const baixo = daRede.filter((p) => {
      const n = notasHook.get(p.ideia_id!)
      return n != null && n <= 3
    }).map((p) => p.views!)
    const pesoHook =
      alto.length >= N_MINIMO && baixo.length >= N_MINIMO
        ? Number((mediana(alto) / Math.max(1, mediana(baixo))).toFixed(2))
        : null

    // 2) DURAÇÃO CAMPEÃ
    let duracaoCampea: SinalRede['duracaoCampea'] = null
    for (const [faixa, min, max] of FAIXAS) {
      const arr = daRede.filter((p) => {
        const d = duracoes.get(p.ideia_id!)
        return d != null && d >= min && d <= max
      }).map((p) => p.views!)
      if (arr.length < N_MINIMO) continue
      const m = mediana(arr)
      if (!duracaoCampea || m > duracaoCampea.mediana) duracaoCampea = { faixa, mediana: m, n: arr.length }
    }

    // 3) TEMA TOP
    const porTema = new Map<string, number[]>()
    for (const p of daRede) {
      const t = classificarTema(titulos.get(p.ideia_id!) ?? null, corpos?.get(p.ideia_id!) ?? null)
      if (!porTema.has(t)) porTema.set(t, [])
      porTema.get(t)!.push(p.views!)
    }
    let temaTop: SinalRede['temaTop'] = null
    for (const [tema, arr] of porTema) {
      if (arr.length < N_MINIMO) continue
      const m = mediana(arr)
      if (!temaTop || m > temaTop.mediana) temaTop = { tema, mediana: m, n: arr.length }
    }

    // 4) RETENÇÃO — TikTok e Kwai não entregam; ausência aqui não é desempenho ruim.
    // Divide-se a rede em quartis PELA PRÓPRIA retenção (não por corte fixo: 62% no YouTube e 15%
    // no Facebook são o mesmo lugar da distribuição) e mede-se a mediana de views em cada um.
    const rets = daRede.map((p) => p.taxa_retencao).filter((r): r is number => r != null && r > 0)
    const retencaoMediana = rets.length >= N_MINIMO ? Number(mediana(rets).toFixed(0)) : null
    const retencao = medirRetencao(daRede)

    contrato[rede] = {
      pesoHook,
      amostraHook: { alto: alto.length, baixo: baixo.length },
      duracaoCampea,
      temaTop,
      retencaoMediana,
      retencao,
      instrucao: redigirInstrucao(rede, pesoHook, duracaoCampea, temaTop, retencao),
    }
  }
  return contrato
}

/** Quatro quartis exigem massa: com menos de 4× N_MINIMO um quartil vira anedota. */
const N_QUARTIL = N_MINIMO * 4

function medirRetencao(daRede: Pub[]): SinalRede['retencao'] {
  const com = daRede
    .filter((p) => p.taxa_retencao != null && p.taxa_retencao > 0 && p.views != null)
    .sort((a, b) => a.taxa_retencao! - b.taxa_retencao!)
  if (com.length < N_QUARTIL) return null

  const t = Math.floor(com.length / 4)
  const quartis = [0, 1, 2, 3].map((i) => {
    const g = com.slice(i * t, i === 3 ? com.length : (i + 1) * t)
    return {
      deRet: Math.round(g[0].taxa_retencao!),
      ateRet: Math.round(g[g.length - 1].taxa_retencao!),
      medianaViews: mediana(g.map((x) => x.views!)),
      n: g.length,
    }
  })

  const [q1, q2, q3, q4] = quartis.map((q) => q.medianaViews)
  const restante = mediana([q2, q3, q4])
  // ESCADA: o topo continua pagando acima do meio — vale perseguir cada ponto de retenção.
  // PISO: só o quartil de baixo apanha — passar do corte basta, o resto não compra alcance.
  const forma: 'escada' | 'piso' | 'plana' =
    q4 >= 1.5 * q2 && q4 >= q3 * 0.9 ? 'escada' : q1 <= 0.65 * restante ? 'piso' : 'plana'

  return { quartis, forma, ganho: Number((q4 / Math.max(1, q1)).toFixed(2)) }
}

/** A frase que o gerador lê. Escrita em português, com o número que a sustenta — sem número,
 *  vira opinião, e opinião não orienta escrita. */
function redigirInstrucao(
  rede: string,
  pesoHook: number | null,
  dur: SinalRede['duracaoCampea'],
  tema: SinalRede['temaTop'],
  retencao: SinalRede['retencao']
): string {
  const partes: string[] = []

  if (pesoHook == null) {
    partes.push('ainda sem amostra para dizer o quanto o gancho pesa aqui')
  } else if (pesoHook >= 1.5) {
    partes.push(`o GANCHO decide (${pesoHook}× mais views com gancho forte) — invista o máximo na primeira frase`)
  } else if (pesoHook <= 0.9) {
    partes.push(`o gancho NÃO decide aqui (${pesoHook}×) — o que sorteia alcance é o assunto, não a abertura`)
  } else {
    partes.push(`gancho tem peso neutro (${pesoHook}×) — não sacrifique o conteúdo pela abertura`)
  }

  // A retenção vem logo depois do gancho porque as duas são o mesmo eixo visto de dois lados:
  // onde o gancho não decide (Facebook), é a retenção que paga — e vice-versa.
  if (retencao) {
    const q = retencao.quartis
    const base = q[0]
    const topo = q[3]
    const n = q.reduce((acc, x) => acc + x.n, 0)
    if (retencao.forma === 'escada') {
      partes.push(
        `a RETENÇÃO é o que paga aqui: ${base.deRet}-${base.ateRet}% rende ${base.medianaViews} views e ` +
          `${topo.deRet}-${topo.ateRet}% rende ${topo.medianaViews} (${retencao.ganho}×, n=${n}) — ` +
          `segure até o fim: sem enrolação no meio e o pagamento da promessa no último terço`
      )
    } else if (retencao.forma === 'piso') {
      partes.push(
        `a retenção aqui é PISO, não escada: abaixo de ${base.ateRet}% o vídeo morre (${base.medianaViews} views), ` +
          `acima disso ela não compra mais alcance — passe do corte e invista o resto no assunto`
      )
    } else {
      partes.push(
        `a retenção quase não muda o alcance aqui (${base.medianaViews} → ${topo.medianaViews} views do pior ao ` +
          `melhor quartil, n=${n}) — não sacrifique o assunto para segurar mais tempo`
      )
    }
  }

  if (dur) partes.push(`melhor faixa de duração: ${dur.faixa} (mediana ${dur.mediana} views, n=${dur.n})`)
  if (tema) partes.push(`assunto que mais rende: ${tema.tema} (mediana ${tema.mediana}, n=${tema.n})`)

  return `${rede}: ${partes.join(' · ')}`
}
