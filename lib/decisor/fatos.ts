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
 * Razão seguidor/curtida observada pelo dono nas contas de Kwai e TikTok (29/07/2026):
 * Kwai 154 seguidores / ~1.500 curtidas e TikTok 151 / 1.487 — dois números independentes
 * batendo em ~10%. É ESTIMATIVA direcional, sempre rotulada na tela; nunca vira KPI nem entra
 * em conta que decide sozinha.
 */
const RAZAO_SEGUIDOR_CURTIDA = 0.1
const REDES_RAZAO = new Set(['kwai', 'tiktok'])

export interface PerfilRede {
  plataforma: string
  views: number
  likes: number
  seguidoresMedidos: number | null // só Facebook entrega conversão × alcance
  seguidoresEstimados: number | null // Kwai/TikTok pela razão observada
  seguidorPorMilViews: number
  papel: 'motor de seguidor' | 'motor de view' | 'indefinido'
}

export function perfilDasRedes(pubs: PubBruta[]): PerfilRede[] {
  const ag = new Map<string, { views: number; likes: number; seg: number; temConv: boolean }>()
  for (const p of pubs) {
    const a = ag.get(p.plataforma) || { views: 0, likes: 0, seg: 0, temConv: false }
    a.views += p.views ?? 0
    a.likes += p.likes ?? 0
    if (p.taxaConversao != null && p.reach != null) {
      a.seg += Math.round((p.reach * p.taxaConversao) / 100)
      a.temConv = true
    }
    ag.set(p.plataforma, a)
  }

  const saida: PerfilRede[] = []
  for (const [plataforma, a] of ag) {
    const medidos = a.temConv ? a.seg : null
    const estimados = REDES_RAZAO.has(plataforma) ? Math.round(a.likes * RAZAO_SEGUIDOR_CURTIDA) : null
    const seg = medidos ?? estimados
    const porMil = seg != null && a.views > 0 ? (seg / a.views) * 1000 : 0
    const papel: PerfilRede['papel'] =
      seg == null ? 'indefinido' : porMil >= 10 ? 'motor de seguidor' : 'motor de view'
    saida.push({
      plataforma,
      views: a.views,
      likes: a.likes,
      seguidoresMedidos: medidos,
      seguidoresEstimados: estimados,
      seguidorPorMilViews: Math.round(porMil * 10) / 10,
      papel,
    })
  }
  return saida.sort((a, b) => b.views - a.views)
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
