/**
 * MARCOS — a régua de performance que o dono pediu: "a cada 100k views, a cada 100 seguidores,
 * com a data".
 *
 * O AJUSTE DE CONCEITO: o marco sozinho é troféu ("chegamos a 200k em 22/07"). O que decide é o
 * INTERVALO entre marcos — 0→100k levou 26 dias, 100k→200k levou 16. Acelerou 1,6×. Por isso a
 * função devolve o intervalo e a variação de ritmo junto de cada marco, e a tela destaca isso.
 *
 * HONESTIDADE DA FONTE: views são reconstituíveis desde 10/06 (leituras_metricas, série diária
 * sem buracos). Seguidores só desde 13/07 (seguidores_historico), e nesse primeiro dia já havia
 * 529 — os marcos de 100 a 500 aconteceram antes de existir registro e são IRRECONSTITUÍVEIS.
 * A tela precisa dizer isso; inventar data para eles seria fabricar história.
 */

export interface PontoSerie {
  data: string
  valor: number
}

export interface Marco {
  /** o valor redondo atingido (100000, 200000… ou 100, 200…) */
  alvo: number
  data: string
  /** dias desde o marco anterior — null quando não há de onde contar */
  diasDesdeAnterior: number | null
  /** ritmo desta etapa (unidades/dia) */
  porDia: number | null
  /** > 1 = acelerou em relação à etapa anterior; < 1 = desacelerou */
  aceleracao: number | null
  /** o intervalo foi contado do início da série, não de um marco anterior */
  ancoradoNoInicio: boolean
}

export interface ResumoMarcos {
  marcos: Marco[]
  atual: number
  /** próximo alvo redondo ainda não atingido */
  proximoAlvo: number
  /** ritmo dos últimos dias (unidades/dia) — base da projeção */
  ritmoRecente: number
  /** dias estimados até o próximo alvo; null se o ritmo for zero ou negativo */
  diasAteProximo: number | null
  dataProximo: string | null
  /** menor valor observado no início da série: abaixo dele não há como saber a data */
  pisoConhecido: number
  primeiroDiaDaSerie: string | null
}

function diasEntre(deISO: string, ateISO: string): number {
  return Math.round(
    (new Date(`${ateISO}T00:00:00Z`).getTime() - new Date(`${deISO}T00:00:00Z`).getTime()) / 86_400_000
  )
}

/**
 * @param serie cumulativa e ordenada por data (valor só cresce)
 * @param passo tamanho do degrau (100_000 para views, 100 para seguidores)
 * @param janelaRitmo dias usados para estimar o ritmo recente
 */
export function calcularMarcos(serie: PontoSerie[], passo: number, janelaRitmo = 7): ResumoMarcos {
  const ordenada = [...serie].filter((p) => Number.isFinite(p.valor)).sort((a, b) => (a.data < b.data ? -1 : 1))
  if (ordenada.length === 0) {
    return {
      marcos: [], atual: 0, proximoAlvo: passo, ritmoRecente: 0,
      diasAteProximo: null, dataProximo: null, pisoConhecido: 0, primeiroDiaDaSerie: null,
    }
  }

  const primeiro = ordenada[0]
  const ultimo = ordenada[ordenada.length - 1]
  const marcos: Marco[] = []

  // só marcos ACIMA do piso: abaixo dele o cruzamento aconteceu antes da série existir
  let alvo = Math.ceil((primeiro.valor + 1) / passo) * passo

  // Quando a série começa ABAIXO do primeiro degrau (views nasceram em 378, o degrau é 100.000),
  // ela pegou a subida inteira: o intervalo do primeiro marco pode ser contado do dia 1 e o
  // primeiro degrau ganha ritmo comparável. Se o piso já passou do degrau (seguidores começaram
  // em 529 com degrau de 100), o começo dessa etapa é anterior ao registro e fica sem intervalo —
  // é o caso em que estimar viraria invenção.
  const comecouDoZero = primeiro.valor < passo
  let anterior: string | null = comecouDoZero ? primeiro.data : null
  let primeiroPendente = comecouDoZero

  for (const p of ordenada) {
    while (p.valor >= alvo) {
      const dias = anterior ? diasEntre(anterior, p.data) : null
      const porDia = dias && dias > 0 ? Math.round(passo / dias) : null
      const anteriorPorDia = marcos.length > 0 ? marcos[marcos.length - 1].porDia : null
      marcos.push({
        alvo,
        data: p.data,
        diasDesdeAnterior: dias,
        porDia,
        aceleracao: porDia && anteriorPorDia ? Math.round((porDia / anteriorPorDia) * 100) / 100 : null,
        ancoradoNoInicio: primeiroPendente,
      })
      primeiroPendente = false
      anterior = p.data
      alvo += passo
    }
  }

  // ritmo recente: variação média por dia na janela
  const janela = ordenada.slice(-Math.min(janelaRitmo + 1, ordenada.length))
  const dias = janela.length > 1 ? diasEntre(janela[0].data, janela[janela.length - 1].data) : 0
  const ritmoRecente = dias > 0 ? (janela[janela.length - 1].valor - janela[0].valor) / dias : 0

  const proximoAlvo = Math.ceil((ultimo.valor + 1) / passo) * passo
  const falta = proximoAlvo - ultimo.valor
  const diasAteProximo = ritmoRecente > 0 ? Math.ceil(falta / ritmoRecente) : null
  const dataProximo =
    diasAteProximo != null
      ? new Date(new Date(`${ultimo.data}T12:00:00Z`).getTime() + diasAteProximo * 86_400_000)
          .toISOString()
          .slice(0, 10)
      : null

  return {
    marcos,
    atual: ultimo.valor,
    proximoAlvo,
    ritmoRecente: Math.round(ritmoRecente),
    diasAteProximo,
    dataProximo,
    pisoConhecido: primeiro.valor,
    primeiroDiaDaSerie: primeiro.data,
  }
}
