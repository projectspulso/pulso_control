/**
 * MOTOR DE FATOS DO DECISOR — tudo que o app afirma sobre "o que fazer agora" nasce aqui.
 *
 * Funções puras, sem I/O. O LLM analista NÃO faz conta: recebe a saída deste módulo já mastigada
 * e só escreve a frase. Se um número não passou por aqui, o analista não pode citá-lo — é esta
 * separação que impede o analista de inventar.
 *
 * O sinal de assunto vive em ./temas (validado: 10,9× de lift no Facebook). A tese de "âncora
 * concreta no título" foi TESTADA E REFUTADA — ver o cabeçalho de ./temas antes de tentar de novo.
 */

import { classificarTema, PAPEL_NO_FACEBOOK, type Tema } from './temas'

// ====== TIPOS DE ENTRADA (o que as rotas buscam e passam pra cá) ======

export interface PubBruta {
  ideiaId: string | null
  plataforma: string
  dataPublicacao: string | null
  views: number | null
  likes: number | null
  reach: number | null
  taxaConversao: number | null
}

export interface LeituraBruta {
  ideiaId: string | null
  plataforma: string
  postId: string | null
  dataRef: string
  views: number | null
}

// ====== 1. RADAR DE ESTOURO ======

/**
 * Um viral EM CURSO, não o relatório do que já passou.
 *
 * Compara cada post com a mediana da SUA rede NA MESMA IDADE — nunca em views absolutas. Sem
 * isso um post de 5 dias sempre pareceria melhor que um de ontem, e o alerta chegaria tarde: foi
 * exatamente o que aconteceu com os dois virais de 17/07 (29k e 17k no Facebook), que subiram por
 * 4 dias seguidos sem ninguém surfar — nem cross-post, nem sequência do tema no dia seguinte.
 *
 * Por que isso vale mais que qualquer gráfico: com ~6% de taxa de acerto no Facebook, reagir ao
 * bilhete premiado é metade do resultado.
 */
export interface PostEmAlta {
  ideiaId: string
  titulo: string
  tema: Tema
  plataforma: string
  views: number
  idadeDias: number
  medianaNaIdade: number
  multiplo: number
}

const MULTIPLO_ESTOURO = 3
const AMOSTRA_MINIMA = 5 // abaixo disso a mediana da idade não sustenta afirmação
const RECENCIA_MAX_DIAS = 2 // leitura mais velha que isto é história, não alerta

export function radarDeEstouro(
  leituras: LeituraBruta[],
  titulos: Map<string, string | null>,
  publicadoEm: Map<string, string>, // "ideiaId|plataforma" -> data ISO
  opts?: { maxIdadeDias?: number; multiplo?: number; hoje?: string }
): PostEmAlta[] {
  const maxIdade = opts?.maxIdadeDias ?? 4
  const mult = opts?.multiplo ?? MULTIPLO_ESTOURO
  const hoje = opts?.hoje ?? new Date().toISOString().slice(0, 10)

  const amostra = new Map<string, number[]>() // "rede|idade" -> views observadas
  const ultimo = new Map<string, { ideiaId: string; plataforma: string; views: number; idade: number }>()

  for (const l of leituras) {
    if (!l.ideiaId) continue
    const pub = publicadoEm.get(`${l.ideiaId}|${l.plataforma}`)
    if (!pub) continue
    const idade = diasEntre(pub.slice(0, 10), l.dataRef.slice(0, 10))
    if (idade == null || idade < 1 || idade > 10) continue

    // a AMOSTRA usa todo o histórico — é o que dá a mediana da rede naquela idade
    const chave = `${l.plataforma}|${idade}`
    if (!amostra.has(chave)) amostra.set(chave, [])
    amostra.get(chave)!.push(l.views ?? 0)

    // o ALERTA, não. Sem este filtro de recência o radar mostraria os virais de 17/07 para
    // sempre (a leitura de 21/07 daquele post tem idade 4 e passaria), virando exatamente o
    // "relatório do que já passou" que este bloco existe para não ser.
    const atraso = diasEntre(l.dataRef.slice(0, 10), hoje)
    if (atraso == null || atraso > RECENCIA_MAX_DIAS) continue

    if (idade <= maxIdade) {
      const k = `${l.ideiaId}|${l.plataforma}`
      const at = ultimo.get(k)
      if (!at || idade > at.idade) {
        ultimo.set(k, { ideiaId: l.ideiaId, plataforma: l.plataforma, views: l.views ?? 0, idade })
      }
    }
  }

  const saida: PostEmAlta[] = []
  for (const v of ultimo.values()) {
    const arr = amostra.get(`${v.plataforma}|${v.idade}`)
    if (!arr || arr.length < AMOSTRA_MINIMA) continue // amostra fraca: não afirma nada
    const med = mediana(arr)
    if (med <= 0) continue
    const multiplo = v.views / med
    if (multiplo < mult) continue
    const titulo = titulos.get(v.ideiaId) || '(sem título)'
    saida.push({
      ideiaId: v.ideiaId,
      titulo,
      tema: classificarTema(titulo),
      plataforma: v.plataforma,
      views: v.views,
      idadeDias: v.idade,
      medianaNaIdade: Math.round(med),
      multiplo: Math.round(multiplo * 10) / 10,
    })
  }
  return saida.sort((a, b) => b.multiplo - a.multiplo)
}

// ====== 2. CRESCIMENTO DIÁRIO ======

export interface GanhoDia {
  dia: string
  total: number
  porRede: Record<string, number>
}

/** Novas views por dia = soma dos deltas de cada post entre leituras consecutivas. */
export function ganhoPorDia(leituras: LeituraBruta[]): GanhoDia[] {
  const porPost = new Map<string, LeituraBruta[]>()
  for (const l of leituras) {
    const k = `${l.plataforma}|${l.postId || l.ideiaId}`
    if (!porPost.has(k)) porPost.set(k, [])
    porPost.get(k)!.push(l)
  }
  const dias = new Map<string, { total: number; redes: Record<string, number> }>()
  for (const arr of porPost.values()) {
    arr.sort((a, b) => (a.dataRef < b.dataRef ? -1 : 1))
    for (let i = 1; i < arr.length; i++) {
      const dia = arr[i].dataRef.slice(0, 10)
      const delta = Math.max(0, (arr[i].views ?? 0) - (arr[i - 1].views ?? 0))
      if (!dias.has(dia)) dias.set(dia, { total: 0, redes: {} })
      const d = dias.get(dia)!
      d.total += delta
      d.redes[arr[i].plataforma] = (d.redes[arr[i].plataforma] || 0) + delta
    }
  }
  return [...dias.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([dia, v]) => ({ dia, total: v.total, porRede: v.redes }))
}

/** Compara os últimos N dias com os N anteriores — o "estamos crescendo ou caindo?". */
export interface Tendencia {
  janelaDias: number
  atual: number
  anterior: number
  variacao: number // % (positivo = subindo)
  mediaDiaAtual: number
}

export function tendencia(ganhos: GanhoDia[], janelaDias = 7): Tendencia | null {
  if (ganhos.length < janelaDias * 2) return null
  const fim = ganhos.slice(-janelaDias)
  const ini = ganhos.slice(-janelaDias * 2, -janelaDias)
  const soma = (a: GanhoDia[]) => a.reduce((s, g) => s + g.total, 0)
  const atual = soma(fim)
  const anterior = soma(ini)
  return {
    janelaDias,
    atual,
    anterior,
    variacao: anterior > 0 ? Math.round(((atual - anterior) / anterior) * 100) : 0,
    mediaDiaAtual: Math.round(atual / janelaDias),
  }
}

// ====== 3. DEPENDÊNCIA DE VIRAL ======

export interface DependenciaViral {
  concentracaoTop2: number // % do crescimento que veio dos 2 maiores vídeos
  piso: number
  pico: number
  dependente: boolean
}

export function dependenciaDeViral(ganhos: GanhoDia[], viewsPorVideo: Map<string, number>): DependenciaViral {
  const totais = ganhos.map((g) => g.total).filter((t) => t > 0)
  const soma = totais.reduce((s, t) => s + t, 0)
  const top2 = [...viewsPorVideo.values()].sort((a, b) => b - a).slice(0, 2).reduce((s, v) => s + v, 0)
  const concentracao = soma > 0 ? Math.min(1, top2 / soma) : 0
  return {
    concentracaoTop2: Math.round(concentracao * 100),
    piso: totais.length ? Math.min(...totais) : 0,
    pico: totais.length ? Math.max(...totais) : 0,
    dependente: concentracao >= 0.4,
  }
}

// ====== 4. PERFIL DAS REDES (onde vem seguidor × onde vem view) ======

/**
 * O papel de cada rede sai do CONTADOR DE SEGUIDORES medido todo dia (pulso_core.configuracoes,
 * chave seguidores_historico) — não de estimativa.
 *
 * ERRO CORRIGIDO EM 29/07/2026 (o dono perguntou "a rotina do Kwai não grava os seguidores?" e
 * derrubou a conta): a versão anterior calculava seguidores do Facebook como
 * `taxa_conversao × reach` somado por post, e chegava a 3.093. O contador real do Facebook
 * naquele dia era 408 — errado por 7,5×. `taxa_conversao` NÃO é "% do alcance que virou
 * seguidor"; somá-la entre posts não dá o total de seguidores. Ficou proibido derivar seguidor
 * de métrica de post: o único número honesto é o contador do perfil.
 *
 * A correção inverteu a conclusão. Ganho de 22→29/07: Kwai +46, YouTube +38, Facebook +38,
 * Instagram +26, TikTok +14. O Kwai — que a versão errada chamava de "motor de view que converte
 * pouco" — é quem MAIS ganha seguidor.
 *
 * A razão observada pelo dono (seguidor ≈ 10% das curtidas em Kwai e TikTok) se confirma no dado
 * real: Kwai 144/1.454 = 9,9% e TikTok 151/1.491 = 10,1%. Vira só conferência de sanidade — com
 * o contador diário na mão, não é mais preciso estimar.
 */
export interface PontoSeguidores {
  data: string
  [rede: string]: number | string
}

export interface PerfilRede {
  plataforma: string
  views: number
  likes: number
  seguidores: number | null // contador do perfil, medido
  ganhoJanela: number | null // quanto ganhou na janela do histórico
  diasJanela: number
  seguidorPorMilViews: number | null // eficiência: quanto de view vira seguidor
  papel: 'motor de seguidor' | 'motor de view' | 'indefinido'
}

const REDES_CONHECIDAS = ['facebook', 'youtube', 'instagram', 'tiktok', 'kwai']

export function perfilDasRedes(pubs: PubBruta[], historico: PontoSeguidores[] = []): PerfilRede[] {
  const ag = new Map<string, { views: number; likes: number }>()
  for (const p of pubs) {
    const a = ag.get(p.plataforma) || { views: 0, likes: 0 }
    a.views += p.views ?? 0
    a.likes += p.likes ?? 0
    ag.set(p.plataforma, a)
  }

  const serie = [...historico].sort((a, b) => (a.data < b.data ? -1 : 1))
  const primeiro = serie[0]
  const ultimo = serie[serie.length - 1]
  const diasJanela = primeiro && ultimo ? (diasEntre(String(primeiro.data), String(ultimo.data)) ?? 0) : 0

  // views ganhas na mesma janela, pra eficiência ser comparável (view acumulada vs ganho de
  // seguidor seria comparar estoque com fluxo)
  const num = (v: unknown) => (typeof v === 'number' ? v : null)

  const saida: PerfilRede[] = []
  for (const plataforma of new Set([...ag.keys(), ...REDES_CONHECIDAS])) {
    const a = ag.get(plataforma) || { views: 0, likes: 0 }
    const seg = ultimo ? num(ultimo[plataforma]) : null
    const segIni = primeiro ? num(primeiro[plataforma]) : null
    const ganho = seg != null && segIni != null ? seg - segIni : null

    const porMil = ganho != null && a.views > 0 ? (ganho / a.views) * 1000 : null
    const papel: PerfilRede['papel'] =
      ganho == null ? 'indefinido' : ganho <= 0 ? 'motor de view' : porMil != null && porMil >= 1 ? 'motor de seguidor' : 'motor de view'

    saida.push({
      plataforma,
      views: a.views,
      likes: a.likes,
      seguidores: seg,
      ganhoJanela: ganho,
      diasJanela,
      seguidorPorMilViews: porMil == null ? null : Math.round(porMil * 100) / 100,
      papel,
    })
  }
  return saida.sort((a, b) => (b.ganhoJanela ?? -1) - (a.ganhoJanela ?? -1))
}

// ====== 5. DESEMPENHO POR TEMA (o achado, recalculado sempre no dado vivo) ======

export interface DesempenhoTema {
  tema: Tema
  n: number
  medianaViews: number
  maxViews: number
  estouros: number // ≥ 3k na rede
  papelFacebook: 'sorteia' | 'neutro' | 'morto'
  melhor: string | null
}

const LIMITE_ESTOURO = 3000

/**
 * Recalcula o placar de temas no dado atual — não confia no número congelado de 29/07. Se a
 * realidade mudar (um tema novo começar a sortear), a tela mostra a mudança.
 */
export function desempenhoPorTema(
  pubs: PubBruta[],
  titulos: Map<string, string | null>,
  plataforma?: string
): DesempenhoTema[] {
  const porIdeia = new Map<string, number>()
  for (const p of pubs) {
    if (!p.ideiaId) continue
    if (plataforma && p.plataforma !== plataforma) continue
    const v = p.views ?? 0
    porIdeia.set(
      p.ideiaId,
      plataforma ? Math.max(porIdeia.get(p.ideiaId) ?? 0, v) : (porIdeia.get(p.ideiaId) ?? 0) + v
    )
  }

  const grupos = new Map<Tema, Array<{ titulo: string; views: number }>>()
  for (const [id, views] of porIdeia) {
    const titulo = titulos.get(id) || ''
    const tema = classificarTema(titulo)
    if (!grupos.has(tema)) grupos.set(tema, [])
    grupos.get(tema)!.push({ titulo, views })
  }

  const saida: DesempenhoTema[] = []
  for (const [tema, arr] of grupos) {
    const vals = arr.map((a) => a.views)
    const melhor = [...arr].sort((a, b) => b.views - a.views)[0]
    saida.push({
      tema,
      n: arr.length,
      medianaViews: Math.round(mediana(vals)),
      maxViews: Math.max(...vals),
      estouros: vals.filter((v) => v >= LIMITE_ESTOURO).length,
      papelFacebook: PAPEL_NO_FACEBOOK[tema],
      melhor: melhor?.titulo || null,
    })
  }
  return saida.sort((a, b) => b.medianaViews - a.medianaViews)
}

// ====== 6. FILA POR TEMA (o desperdício, antes de acontecer) ======

/**
 * Olha o que está por vir (estoque/fila) e mede quanto dele vai para tema morto no Facebook.
 * Medido em 29/07: 22 dos 95 vídeos publicados (23%) eram tecnologia/IA ou produtividade —
 * temas com mediana ~260 no FB e zero estouros em 48 dias. Isso é slot de Facebook queimado.
 */
export interface FilaPorTema {
  total: number
  porTema: Array<{ tema: Tema; n: number; papelFacebook: 'sorteia' | 'neutro' | 'morto' }>
  emTemaMorto: number
  percentualMorto: number
  emTemaQueSorteia: number
}

export function filaPorTema(titulosFila: Array<string | null>): FilaPorTema {
  const cont = new Map<Tema, number>()
  for (const t of titulosFila) {
    const tema = classificarTema(t)
    cont.set(tema, (cont.get(tema) || 0) + 1)
  }
  const porTema = [...cont.entries()]
    .map(([tema, n]) => ({ tema, n, papelFacebook: PAPEL_NO_FACEBOOK[tema] }))
    .sort((a, b) => b.n - a.n)
  const total = titulosFila.length
  const emTemaMorto = porTema.filter((p) => p.papelFacebook === 'morto').reduce((s, p) => s + p.n, 0)
  const emTemaQueSorteia = porTema.filter((p) => p.papelFacebook === 'sorteia').reduce((s, p) => s + p.n, 0)
  return {
    total,
    porTema,
    emTemaMorto,
    percentualMorto: total > 0 ? Math.round((emTemaMorto / total) * 100) : 0,
    emTemaQueSorteia,
  }
}

// ====== 7. COBERTURA — o que cada API NÃO entrega ======

/**
 * A honestidade do módulo. Sem isto o Decisor afirma "Kwai é motor de view, 44 mil views" sem
 * dizer que aquilo é PRINT DIGITADO À MÃO, não API — e uma conclusão baseada em registro manual
 * de 1 dia atrasado não tem o mesmo peso de uma medida pela Graph API.
 *
 * MEDIDO em 29/07/2026:
 *   facebook  API completa — alcance, retenção 88%, conversão 96%, curva 100%
 *   youtube   API — retenção 98%, curva 92%; NÃO dá alcance nem conversão
 *   instagram API — alcance, retenção 92%; NÃO dá conversão nem curva
 *   tiktok    API pobre — só views e curtidas; NÃO dá retenção, alcance nem tempo médio
 *   kwai      SEM API — 46 de 69 registros são print digitado à mão ([[metricas-manuais-por-foto]])
 *
 * Consequência prática, que a tela precisa dizer: "retenção" e "seguidor ganho" NÃO existem em
 * TikTok e Kwai. Comparar qualidade de vídeo entre redes usando esses campos é comparar com o
 * vazio — e o radar de estouro do Kwai depende de alguém ter digitado o print naquele dia.
 */
export interface CoberturaRede {
  plataforma: string
  fonte: 'api' | 'manual' | 'misto'
  registros: number
  registrosManuais: number
  ultimaColeta: string | null
  atrasoDias: number | null
  entrega: string[]
  naoEntrega: string[]
}

/** O que cada campo significa na tela — e em quais redes ele existe de verdade. */
const CAMPOS_METRICA: Array<{ chave: keyof CoberturaEntrada; rotulo: string }> = [
  { chave: 'reach', rotulo: 'alcance' },
  { chave: 'taxaRetencao', rotulo: 'retenção' },
  { chave: 'avgWatchMs', rotulo: 'tempo médio' },
  { chave: 'retentionGraph', rotulo: 'curva' },
  { chave: 'taxaConversao', rotulo: 'seguidor ganho' },
]

export interface CoberturaEntrada {
  plataforma: string
  postId: string | null
  ultimaAtualizacao: string | null
  reach: number | null
  taxaRetencao: number | null
  avgWatchMs: number | null
  retentionGraph: unknown | null
  taxaConversao: number | null
}

export function coberturaPorRede(linhas: CoberturaEntrada[], hoje?: string): CoberturaRede[] {
  const ref = hoje ?? new Date().toISOString().slice(0, 10)
  const ag = new Map<
    string,
    { n: number; manuais: number; ultima: string | null; tem: Map<string, number> }
  >()

  for (const l of linhas) {
    if (!ag.has(l.plataforma)) ag.set(l.plataforma, { n: 0, manuais: 0, ultima: null, tem: new Map() })
    const a = ag.get(l.plataforma)!
    a.n++
    // sem post_id = não veio de API nenhuma; alguém digitou (Kwai, via print)
    if (!l.postId || String(l.postId) === 'null') a.manuais++
    if (l.ultimaAtualizacao && (!a.ultima || l.ultimaAtualizacao > a.ultima)) a.ultima = l.ultimaAtualizacao
    for (const c of CAMPOS_METRICA) {
      const v = l[c.chave]
      // zero NÃO conta como entregue: rede que não fornece o campo grava 0, e contar isso
      // como "tem o dado" seria fabricar cobertura que não existe.
      const presente = v != null && v !== 0 && !(typeof v === 'number' && Number.isNaN(v))
      if (presente) a.tem.set(c.rotulo, (a.tem.get(c.rotulo) || 0) + 1)
    }
  }

  const saida: CoberturaRede[] = []
  for (const [plataforma, a] of ag) {
    const entrega: string[] = []
    const naoEntrega: string[] = []
    for (const c of CAMPOS_METRICA) {
      // 20% é o piso pra dizer que a rede "entrega" — abaixo disso é resíduo, não cobertura
      if ((a.tem.get(c.rotulo) || 0) / Math.max(1, a.n) >= 0.2) entrega.push(c.rotulo)
      else naoEntrega.push(c.rotulo)
    }
    const fracManual = a.manuais / Math.max(1, a.n)
    saida.push({
      plataforma,
      fonte: fracManual >= 0.9 ? 'manual' : fracManual > 0 ? 'misto' : 'api',
      registros: a.n,
      registrosManuais: a.manuais,
      ultimaColeta: a.ultima,
      atrasoDias: a.ultima ? diasEntre(a.ultima.slice(0, 10), ref) : null,
      entrega,
      naoEntrega,
    })
  }
  return saida.sort((a, b) => b.entrega.length - a.entrega.length)
}

// ====== HELPERS ======

function mediana(arr: number[]): number {
  if (!arr.length) return 0
  const a = [...arr].sort((x, y) => x - y)
  const m = Math.floor(a.length / 2)
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2
}

function diasEntre(deISO: string, ateISO: string): number | null {
  const a = new Date(`${deISO}T00:00:00Z`).getTime()
  const b = new Date(`${ateISO}T00:00:00Z`).getTime()
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null
  return Math.round((b - a) / 86_400_000)
}
