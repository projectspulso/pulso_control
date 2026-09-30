import { getYoutubeAccessToken } from '@/lib/youtube/oauth'

/**
 * QUEM ASSISTE — o perfil do público por rede, medido pela própria plataforma.
 *
 * Até 30/09/2026 as colunas pais_principal/idade_principal/genero_principal de metricas_publicacao
 * existiam e nunca foram preenchidas: o app não sabia quem era o público. O YouTube Analytics e o
 * Instagram entregam isso por CONTA (não por vídeo) — e é no nível de conta que o dado decide
 * alguma coisa (tom, referência, assunto). O Facebook aposentou a demografia de Página; não entra.
 *
 * Grava em configuracoes.publico_redes (rotina diária /api/automation/aprender).
 */

export interface Fatia {
  rotulo: string
  pct: number
}

export interface PublicoRedes {
  atualizadoEm: string
  youtube?: {
    janelaDias: number
    idade: Fatia[]
    genero: Fatia[]
    paises: Fatia[]
    /** de onde vêm as views (SHORTS = feed de Shorts, YT_SEARCH = busca...) */
    origem: Fatia[]
    /** % das views que vêm de quem já é inscrito */
    inscritosPct: number | null
  }
  instagram?: {
    /** seguidores, não espectadores — é o que a API entrega */
    idade: Fatia[]
    genero: Fatia[]
    paises: Fatia[]
    cidades: Fatia[]
  }
  erros: string[]
}

const pct = (pares: Array<[string, number]>, top = 8): Fatia[] => {
  const total = pares.reduce((s, [, v]) => s + v, 0) || 1
  return pares
    .sort((a, b) => b[1] - a[1])
    .slice(0, top)
    .map(([rotulo, v]) => ({ rotulo, pct: Math.round((v / total) * 1000) / 10 }))
}

async function youtube(erros: string[]): Promise<PublicoRedes['youtube']> {
  const token = await getYoutubeAccessToken()
  if (!token) {
    erros.push('youtube: sem token OAuth')
    return undefined
  }
  const janelaDias = 90
  const fim = new Date().toISOString().slice(0, 10)
  const inicio = new Date(Date.now() - janelaDias * 86_400_000).toISOString().slice(0, 10)
  const relatorio = async (dimensions: string, metrics: string, extra = '') => {
    const url = `https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==MINE&startDate=${inicio}&endDate=${fim}&metrics=${metrics}&dimensions=${dimensions}${extra}`
    const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    if (!r.ok) throw new Error(`${dimensions} ${r.status}`)
    return ((await r.json())?.rows || []) as Array<Array<string | number>>
  }
  try {
    const [ig, paises, origem, insc] = await Promise.all([
      relatorio('ageGroup,gender', 'viewerPercentage'),
      relatorio('country', 'views', '&sort=-views&maxResults=10'),
      relatorio('insightTrafficSourceType', 'views', '&sort=-views'),
      relatorio('subscribedStatus', 'views'),
    ])
    const idade = new Map<string, number>()
    const genero = new Map<string, number>()
    for (const [a, g, v] of ig as Array<[string, string, number]>) {
      const faixa = a.replace('age', '')
      idade.set(faixa, (idade.get(faixa) || 0) + v)
      genero.set(g, (genero.get(g) || 0) + v)
    }
    const inscritos = (insc as Array<[string, number]>).find((r) => r[0] === 'SUBSCRIBED')?.[1] ?? 0
    const totalInsc = (insc as Array<[string, number]>).reduce((s, r) => s + r[1], 0)
    return {
      janelaDias,
      idade: pct([...idade.entries()], 10).sort((a, b) => a.rotulo.localeCompare(b.rotulo)),
      genero: pct([...genero.entries()]),
      paises: pct(paises as Array<[string, number]>),
      origem: pct(origem as Array<[string, number]>, 6),
      inscritosPct: totalInsc ? Math.round((inscritos / totalInsc) * 1000) / 10 : null,
    }
  } catch (e) {
    erros.push(`youtube: ${e instanceof Error ? e.message : 'falhou'}`)
    return undefined
  }
}

async function instagram(erros: string[]): Promise<PublicoRedes['instagram']> {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN
  const igUserId = process.env.META_IG_USER_ID || '17841478757082171'
  if (!token) {
    erros.push('instagram: INSTAGRAM_ACCESS_TOKEN ausente')
    return undefined
  }
  const quebra = async (breakdown: string) => {
    const u = new URL(`https://graph.facebook.com/v23.0/${igUserId}/insights`)
    u.searchParams.set('metric', 'follower_demographics')
    u.searchParams.set('period', 'lifetime')
    u.searchParams.set('metric_type', 'total_value')
    u.searchParams.set('breakdown', breakdown)
    u.searchParams.set('access_token', token)
    const r = await fetch(u.toString())
    if (!r.ok) throw new Error(`${breakdown} ${r.status}`)
    const j = await r.json()
    const res = (j?.data?.[0]?.total_value?.breakdowns?.[0]?.results || []) as Array<{ dimension_values: string[]; value: number }>
    return res.map((x) => [x.dimension_values[0], x.value] as [string, number])
  }
  try {
    const [idade, genero, paises, cidades] = await Promise.all([quebra('age'), quebra('gender'), quebra('country'), quebra('city')])
    return {
      idade: pct(idade, 10).sort((a, b) => a.rotulo.localeCompare(b.rotulo)),
      genero: pct(genero),
      paises: pct(paises, 5),
      cidades: pct(cidades, 6),
    }
  } catch (e) {
    erros.push(`instagram: ${e instanceof Error ? e.message : 'falhou'}`)
    return undefined
  }
}

export async function coletarPublico(): Promise<PublicoRedes> {
  const erros: string[] = []
  const [yt, ig] = await Promise.all([youtube(erros), instagram(erros)])
  return { atualizadoEm: new Date().toISOString(), youtube: yt, instagram: ig, erros }
}

/** Uma linha para o prompt do gerador — quem é o público, sem adjetivo. */
export function resumoPublico(p: PublicoRedes | null): string {
  if (!p) return ''
  const partes: string[] = []
  const faixaTop = (f: Fatia[]) => [...f].sort((a, b) => b.pct - a.pct).slice(0, 3).map((x) => `${x.rotulo} (${x.pct}%)`).join(', ')
  if (p.youtube) {
    const h = p.youtube.genero.find((g) => g.rotulo === 'male')?.pct
    partes.push(`YouTube: ${h != null ? `${h}% homens` : ''}, idades ${faixaTop(p.youtube.idade)}, ${p.youtube.paises[0]?.rotulo ?? '?'} ${p.youtube.paises[0]?.pct ?? ''}%`)
  }
  if (p.instagram) {
    const h = p.instagram.genero.find((g) => g.rotulo === 'M')?.pct
    partes.push(`Instagram (seguidores): ${h != null ? `${h}% homens` : ''}, idades ${faixaTop(p.instagram.idade)}`)
  }
  return partes.join(' · ')
}

