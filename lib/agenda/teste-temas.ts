/**
 * TESTE DE TEMA NOVO — a trava que deixa experimentar sem queimar a única vaga do dia.
 *
 * POR QUE EXISTE (dono, 23/09/2026). O PULSO passou a publicar 1 vídeo por dia. Com uma vaga só,
 * um tema novo que flopa custa o dia inteiro, e o roteador ainda o premiaria de novo: "parado há
 * muito tempo" pesa no score, e um canal que nunca publicou está parado desde sempre. Sem trava,
 * o mesmo tema ruim podia ocupar a vaga dias seguidos antes de alguém notar.
 *
 * AS QUATRO REGRAS (números aprovados pelo dono, vivem em configuracoes.teste_temas):
 *   1. Um tema em teste por vez — com dois, um flop não diz qual dos dois errou.
 *   2. Intervalo de 7 dias entre tentativas do mesmo tema: o prejuízo máximo de um flop é 1 dia.
 *   3. Corte na hora se uma tentativa fizer menos de 40% do PISO — a mediana do pior tema que já
 *      roda, medida na mesma idade e na mesma rede.
 *   4. Aprovado depois de 3 tentativas sem corte; aí vira tema normal e disputa a vaga como os outros.
 *
 * A UNIDADE DE TESTE É O CANAL. Tema novo = canal novo com `metadata.teste.status = 'em_teste'`.
 * Canal sem `metadata.teste` (os 14 que já rodavam em 23/09) é tema normal e nada aqui o toca.
 *
 * MESMA IDADE, MESMA REDE — senão a comparação mente. Um vídeo de 2 dias contra a mediana de vídeos
 * de 40 dias perde sempre; views de Facebook contra views de TikTok não têm a mesma escala. Por
 * isso o piso é calculado por rede, na idade de avaliação, e a razão da tentativa é a mediana das
 * razões das redes em que ela tem leitura. É o mesmo desenho do radar de estouro (lib/decisor/fatos).
 *
 * Arquivo sem import de alias de propósito: roda com `node --experimental-strip-types` no teste.
 */

export interface RegrasTeste {
  cooldownDias: number
  pisoRelativo: number
  tentativasParaAprovar: number
  idadeAvaliacaoDias: number
}

export const REGRAS_PADRAO: RegrasTeste = {
  cooldownDias: 7,
  pisoRelativo: 0.4,
  tentativasParaAprovar: 3,
  idadeAvaliacaoDias: 2,
}

export function lerRegras(raw: unknown): RegrasTeste {
  let v: Record<string, unknown> = {}
  try {
    v = (typeof raw === 'string' ? JSON.parse(raw) : raw) as Record<string, unknown> || {}
  } catch {
    /* config quebrada: vale o padrão aprovado */
  }
  const num = (x: unknown, padrao: number) => (typeof x === 'number' && Number.isFinite(x) && x > 0 ? x : padrao)
  return {
    cooldownDias: num(v.cooldown_dias, REGRAS_PADRAO.cooldownDias),
    pisoRelativo: num(v.piso_relativo, REGRAS_PADRAO.pisoRelativo),
    tentativasParaAprovar: num(v.tentativas_para_aprovar, REGRAS_PADRAO.tentativasParaAprovar),
    idadeAvaliacaoDias: num(v.idade_avaliacao_dias, REGRAS_PADRAO.idadeAvaliacaoDias),
  }
}

export type StatusTeste = 'em_teste' | 'aprovado' | 'reprovado'

export interface TentativaAvaliada {
  ideia_id: string
  estreia: string
  /** views ÷ piso, mediana entre as redes com leitura; null = ainda sem leitura na idade */
  razao: number | null
  por_rede: Record<string, { views: number; piso: number }>
}

export interface TesteDoCanal {
  status: StatusTeste
  desde: string
  tentativas?: TentativaAvaliada[]
  decidido_em?: string
  motivo?: string
}

export interface CanalComTeste {
  id: string
  nome: string
  teste: TesteDoCanal | null
}

export interface PublicacaoRede {
  ideiaId: string
  plataforma: string
  /** timestamp ISO (UTC) da publicação naquela rede */
  dataPublicacao: string
}

export interface LeituraViews {
  ideiaId: string
  plataforma: string
  dataRef: string
  views: number
}

// ---------- datas (dia de Brasília) ----------

export function diaBRT(iso: string): string {
  const t = new Date(iso)
  if (Number.isNaN(t.getTime())) return iso.slice(0, 10)
  return new Date(t.getTime() - 3 * 3_600_000).toISOString().slice(0, 10)
}

export function somarDias(dia: string, n: number): string {
  const d = new Date(`${dia}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

function diasEntre(de: string, ate: string): number {
  return Math.round((new Date(`${ate}T12:00:00Z`).getTime() - new Date(`${de}T12:00:00Z`).getTime()) / 86_400_000)
}

function mediana(arr: number[]): number {
  if (arr.length === 0) return 0
  const s = [...arr].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

/** 1º dia (BRT) em que cada vídeo saiu em QUALQUER rede — é o dia que a tentativa ocupou. */
export function estreias(pubs: PublicacaoRede[]): Map<string, string> {
  const saida = new Map<string, string>()
  for (const p of pubs) {
    if (!p.ideiaId || !p.dataPublicacao) continue
    const d = diaBRT(p.dataPublicacao)
    const atual = saida.get(p.ideiaId)
    if (!atual || d < atual) saida.set(p.ideiaId, d)
  }
  return saida
}

// ---------- estado derivado: quem pode ocupar a vaga, e quando ----------

export interface EstadoTeste {
  canalId: string
  nome: string
  status: StatusTeste
  /** o único tema em teste que pode publicar agora (regra 1) */
  ativo: boolean
  tentativasPublicadas: number
  ultimaEstreia: string | null
  /** primeiro dia em que pode voltar a ocupar a vaga (regra 2); null = já pode */
  liberaEm: string | null
}

/**
 * Só entram no mapa os canais em teste ou reprovados — canal fora do mapa é tema normal.
 * Aprovado sai do mapa: virou tema normal, sem trava nenhuma.
 */
export function estadoDosTestes(
  canais: CanalComTeste[],
  estreiaPorIdeia: Map<string, string>,
  canalPorIdeia: Map<string, string>,
  regras: RegrasTeste
): Map<string, EstadoTeste> {
  const saida = new Map<string, EstadoTeste>()
  for (const c of canais) {
    const st = c.teste?.status
    if (st !== 'em_teste' && st !== 'reprovado') continue
    const datas: string[] = []
    for (const [ideia, canal] of canalPorIdeia) {
      if (canal !== c.id) continue
      const e = estreiaPorIdeia.get(ideia)
      if (e) datas.push(e)
    }
    datas.sort()
    const ultima = datas.length ? datas[datas.length - 1] : null
    saida.set(c.id, {
      canalId: c.id,
      nome: c.nome,
      status: st,
      ativo: false,
      tentativasPublicadas: datas.length,
      ultimaEstreia: ultima,
      liberaEm: ultima ? somarDias(ultima, regras.cooldownDias) : null,
    })
  }
  // REGRA 1: um por vez. Quem já começou a testar termina antes de outro entrar; entre os que
  // não começaram, vale a fila de chegada (`desde`).
  const emTeste = [...saida.values()].filter((e) => e.status === 'em_teste')
  const desde = new Map(canais.map((c) => [c.id, c.teste?.desde || '9999-12-31']))
  emTeste.sort((a, b) => {
    if ((a.tentativasPublicadas > 0) !== (b.tentativasPublicadas > 0)) return a.tentativasPublicadas > 0 ? -1 : 1
    return (desde.get(a.canalId) || '') < (desde.get(b.canalId) || '') ? -1 : 1
  })
  if (emTeste[0]) emTeste[0].ativo = true
  return saida
}

/** Pode um vídeo deste canal ocupar a vaga no `dia`? `motivo` diz por que não. */
export function podeOcuparVaga(
  estado: EstadoTeste | undefined,
  dia: string,
  regras: RegrasTeste,
  jaNoPlano = 0
): { pode: boolean; motivo: string | null } {
  if (!estado) return { pode: true, motivo: null } // tema normal
  if (estado.status === 'reprovado') return { pode: false, motivo: `${estado.nome}: tema reprovado no teste` }
  if (!estado.ativo) return { pode: false, motivo: `${estado.nome}: espera outro tema terminar o teste` }
  if (estado.tentativasPublicadas + jaNoPlano >= regras.tentativasParaAprovar) {
    return { pode: false, motivo: `${estado.nome}: já tem ${regras.tentativasParaAprovar} tentativas, aguardando o veredito` }
  }
  if (estado.liberaEm && dia < estado.liberaEm) {
    return { pode: false, motivo: `${estado.nome}: próxima tentativa só a partir de ${estado.liberaEm}` }
  }
  return { pode: true, motivo: null }
}

// ---------- veredito: views na mesma idade, contra o pior tema que já roda ----------

/** Views de cada (vídeo, rede) na idade de avaliação. Sem leitura exata, a mais próxima em até
 *  ±1 dia (a coleta falha às vezes); nunca além disso, senão volta a comparar idades diferentes. */
export function viewsNaIdade(
  leituras: LeituraViews[],
  publicadoEm: Map<string, string>, // "ideia|rede" -> dia BRT
  idade: number
): Map<string, number> {
  const melhor = new Map<string, { dist: number; views: number }>()
  for (const l of leituras) {
    const k = `${l.ideiaId}|${l.plataforma}`
    const pub = publicadoEm.get(k)
    if (!pub) continue
    const dist = Math.abs(diasEntre(pub, l.dataRef.slice(0, 10)) - idade)
    if (dist > 1) continue
    const at = melhor.get(k)
    if (!at || dist < at.dist) melhor.set(k, { dist, views: l.views ?? 0 })
  }
  return new Map([...melhor].map(([k, v]) => [k, v.views]))
}

const AMOSTRA_MINIMA_PISO = 5 // abaixo disso a mediana de um canal não sustenta ser o piso

/** Por rede: a MENOR mediana entre os temas normais com amostra — "o pior tema que já roda". */
export function pisoPorRede(
  views: Map<string, number>,
  canalPorIdeia: Map<string, string>,
  canaisNormais: Set<string>
): Map<string, { piso: number; canalId: string }> {
  const porRedeCanal = new Map<string, Map<string, number[]>>()
  for (const [k, v] of views) {
    const [ideia, rede] = k.split('|')
    const canal = canalPorIdeia.get(ideia)
    if (!canal || !canaisNormais.has(canal)) continue
    if (!porRedeCanal.has(rede)) porRedeCanal.set(rede, new Map())
    const m = porRedeCanal.get(rede)!
    if (!m.has(canal)) m.set(canal, [])
    m.get(canal)!.push(v)
  }
  const saida = new Map<string, { piso: number; canalId: string }>()
  for (const [rede, m] of porRedeCanal) {
    for (const [canal, arr] of m) {
      if (arr.length < AMOSTRA_MINIMA_PISO) continue
      const med = mediana(arr)
      if (med <= 0) continue
      const at = saida.get(rede)
      if (!at || med < at.piso) saida.set(rede, { piso: med, canalId: canal })
    }
  }
  return saida
}

export function avaliarTeste(
  canal: CanalComTeste,
  ideiasDoCanal: string[],
  estreiaPorIdeia: Map<string, string>,
  views: Map<string, number>,
  pisos: Map<string, { piso: number; canalId: string }>,
  regras: RegrasTeste,
  hoje: string
): { status: StatusTeste; tentativas: TentativaAvaliada[]; motivo: string } {
  const publicadas = ideiasDoCanal
    .filter((i) => estreiaPorIdeia.has(i))
    .sort((a, b) => (estreiaPorIdeia.get(a)! < estreiaPorIdeia.get(b)! ? -1 : 1))

  const tentativas: TentativaAvaliada[] = publicadas.map((ideia) => {
    const estreia = estreiaPorIdeia.get(ideia)!
    const por_rede: TentativaAvaliada['por_rede'] = {}
    const razoes: number[] = []
    // ainda não chegou na idade: não julga nem com leitura parcial
    if (diasEntre(estreia, hoje) >= regras.idadeAvaliacaoDias) {
      for (const [rede, p] of pisos) {
        const v = views.get(`${ideia}|${rede}`)
        if (v == null) continue
        por_rede[rede] = { views: v, piso: Math.round(p.piso) }
        razoes.push(v / p.piso)
      }
    }
    return { ideia_id: ideia, estreia, razao: razoes.length ? Math.round(mediana(razoes) * 100) / 100 : null, por_rede }
  })

  const flop = tentativas.find((t) => t.razao != null && t.razao < regras.pisoRelativo)
  if (flop) {
    const n = tentativas.indexOf(flop) + 1
    return {
      status: 'reprovado',
      tentativas,
      motivo: `tentativa ${n} (${flop.estreia}) fez ${Math.round((flop.razao ?? 0) * 100)}% do piso — abaixo dos ${Math.round(regras.pisoRelativo * 100)}%`,
    }
  }
  const julgadas = tentativas.filter((t) => t.razao != null).length
  if (julgadas >= regras.tentativasParaAprovar) {
    return { status: 'aprovado', tentativas, motivo: `${julgadas} tentativas sem corte — vira tema normal` }
  }
  return { status: 'em_teste', tentativas, motivo: `${julgadas} de ${regras.tentativasParaAprovar} tentativas julgadas` }
}
