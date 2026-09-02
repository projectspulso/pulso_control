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

    // 4) RETENÇÃO — TikTok e Kwai não entregam; zero aqui é ausência, não desempenho ruim
    const rets = daRede.map((p) => p.taxa_retencao).filter((r): r is number => r != null && r > 0)
    const retencaoMediana = rets.length >= N_MINIMO ? Number(mediana(rets).toFixed(0)) : null

    contrato[rede] = {
      pesoHook,
      amostraHook: { alto: alto.length, baixo: baixo.length },
      duracaoCampea,
      temaTop,
      retencaoMediana,
      instrucao: redigirInstrucao(rede, pesoHook, duracaoCampea, temaTop),
    }
  }
  return contrato
}

/** A frase que o gerador lê. Escrita em português, com o número que a sustenta — sem número,
 *  vira opinião, e opinião não orienta escrita. */
function redigirInstrucao(
  rede: string,
  pesoHook: number | null,
  dur: SinalRede['duracaoCampea'],
  tema: SinalRede['temaTop']
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

  if (dur) partes.push(`melhor faixa de duração: ${dur.faixa} (mediana ${dur.mediana} views, n=${dur.n})`)
  if (tema) partes.push(`assunto que mais rende: ${tema.tema} (mediana ${tema.mediana}, n=${tema.n})`)

  return `${rede}: ${partes.join(' · ')}`
}
