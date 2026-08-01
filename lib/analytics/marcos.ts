/**
 * MARCOS — a régua de performance que o dono pediu: "a cada 100k views, a cada 100 seguidores,
 * com a data".
 *
 * O AJUSTE DE CONCEITO: o marco sozinho é troféu ("chegamos a 200k em 22/07"). O que decide é o
 * INTERVALO entre marcos — 0→100k levou 26 dias, 100k→200k levou 16. Acelerou 1,6×. Por isso a
 * função devolve o intervalo e a variação de ritmo junto de cada marco, e a tela destaca isso.
 *
 * HONESTIDADE DA FONTE: views são reconstituíveis desde 18/06 (leituras_metricas, série diária
 * sem buracos). Seguidores só desde 13/07 (seguidores_historico), e nesse primeiro dia já havia
 * 529 — os marcos de 100 a 500 aconteceram antes de existir registro e são IRRECONSTITUÍVEIS.
 * A tela precisa dizer isso; inventar data para eles seria fabricar história.
 *
 * O QUE FICOU DE FORA E POR QUÊ (auditoria de 01/08/2026): só vira escada a série cumulativa cujo
 * DENOMINADOR não muda no meio. `reach` reprovou — em 24/07 os posts que reportavam alcance
 * pularam de 86 para 172 e o acumulado foi de 22.559 para 131.970 num dia. Aquele degrau seria da
 * COLETA, não do alcance. `avg_watch_ms` também fica fora, por outro motivo: é média, não
 * acumulado — não existe "degrau" de média.
 */

export type GrupoEscada = 'alcance' | 'audiencia' | 'engajamento' | 'producao'

/** Uma escada pronta pra tela: a série + como escalonar + o que a fonte não cobre. */
export interface EscadaSerie {
  id: string
  titulo: string
  unidade: string
  grupo: GrupoEscada
  /** degrau padrão */
  passo: number
  /** opções de degrau oferecidas ao humano (o padrão precisa estar aqui) */
  passos: number[]
  /** de onde veio e o que a fonte NÃO cobre — vai impresso embaixo da escada */
  nota: string
  serie: PontoSerie[]
  /**
   * O dia em que este contador estava COMPROVADAMENTE em zero, quando ele é anterior à primeira
   * observação. Views/curtidas/horas nasceram com o primeiro vídeo (10/06) mesmo sem coleta diária
   * até 19/06 — os 34.697 views que apareceram de uma vez eram reais, só não observados. Sem isso
   * o primeiro degrau contaria a partir de 18/06 e diria "18 dias" onde foram 26.
   * Não existe para seguidor nem para views do canal: aquelas contas já tinham número antes.
   */
  inicioReal?: string
}

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

/** Acima disso o piso já comeu parte do primeiro degrau e contar dali distorce a etapa. */
const FRACAO_DE_PISO_TOLERADA = 0.2

/**
 * @param serie cumulativa e ordenada por data (valor só cresce)
 * @param passo tamanho do degrau (100_000 para views, 100 para seguidores)
 * @param opcoes.inicioReal dia em que o contador estava comprovadamente em zero, quando anterior
 *   à primeira observação — é o que permite dizer "0→100k levou 26 dias" numa série que só começou
 *   a ser observada no 9º dia
 * @param opcoes.janelaRitmo dias usados para estimar o ritmo recente
 */
export function calcularMarcos(
  serie: PontoSerie[],
  passo: number,
  opcoes: { inicioReal?: string; janelaRitmo?: number } = {}
): ResumoMarcos {
  const { inicioReal, janelaRitmo = 7 } = opcoes
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

  // De onde contar o PRIMEIRO degrau, em ordem de confiança:
  //  1. `inicioReal` — sabemos o dia do zero (o primeiro vídeo foi ao ar em 10/06), mesmo que a
  //     coleta diária só tenha começado depois. É o caso das views: em 19/06 apareceram 34.697 de
  //     uma vez, e eram reais. Contar da série diria "18 dias" onde foram 26.
  //  2. a série nasceu perto de zero (piso ≤ 20% do degrau) — pegou a subida quase inteira.
  //  3. nada. O começo dessa etapa é anterior a qualquer medição e o degrau sai sem intervalo,
  //     porque estimar aqui seria invenção (é o caso de seguidores, que já eram 529 no dia 1).
  const ancora = inicioReal ?? (primeiro.valor <= passo * FRACAO_DE_PISO_TOLERADA ? primeiro.data : null)
  let anterior: string | null = ancora
  let primeiroPendente = ancora != null

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
