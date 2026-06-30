import 'server-only'

/**
 * Coletor de assuntos em alta no Brasil (Trend Tops PULSO).
 * Fontes grátis/oficiais: Google Trends BR (RSS), Google News BR (RSS) e
 * YouTube em alta BR (Data API, se houver YOUTUBE_API_KEY). Meta/TikTok não
 * expõem tendência por API. Devolve a lista crua (a triagem PULSO é feita por IA na rota).
 */

export interface TrendBruto {
  fonte: 'google_trends' | 'google_news' | 'youtube'
  topico: string
}

async function fetchText(url: string): Promise<string> {
  const r = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (PULSO trends bot)' },
    next: { revalidate: 0 },
  })
  if (!r.ok) throw new Error(`${url} -> ${r.status}`)
  return r.text()
}

function titulosDeItens(xml: string, max: number): string[] {
  const itens = xml.match(/<item>[\s\S]*?<\/item>/g) || []
  const out: string[] = []
  for (const it of itens) {
    const m = it.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/)
    if (m && m[1]) out.push(m[1].trim())
    if (out.length >= max) break
  }
  return out
}

// "Manchete - Fonte" → "Manchete" (tira o sufixo do veículo)
const limparNews = (t: string) => t.replace(/\s+-\s+[^-]+$/, '').trim()

export async function coletarTrendsBR(): Promise<TrendBruto[]> {
  const out: TrendBruto[] = []

  // 1) Google Trends BR (buscas em alta)
  try {
    const xml = await fetchText('https://trends.google.com/trending/rss?geo=BR')
    for (const t of titulosDeItens(xml, 15)) out.push({ fonte: 'google_trends', topico: t })
  } catch {
    /* fonte opcional */
  }

  // 2) Google News BR (manchetes do momento)
  try {
    const xml = await fetchText('https://news.google.com/rss?hl=pt-BR&gl=BR&ceid=BR:pt-419')
    for (const t of titulosDeItens(xml, 12)) {
      const limpo = limparNews(t)
      if (limpo && !/google notícias/i.test(limpo)) out.push({ fonte: 'google_news', topico: limpo })
    }
  } catch {
    /* fonte opcional */
  }

  // 3) YouTube em alta BR (precisa da YOUTUBE_API_KEY)
  const key = process.env.YOUTUBE_API_KEY
  if (key) {
    try {
      const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&chart=mostPopular&regionCode=BR&maxResults=15&key=${key}`
      const r = await fetch(url, { next: { revalidate: 0 } })
      if (r.ok) {
        const d = await r.json()
        for (const it of d.items || []) {
          const t = it?.snippet?.title
          if (t) out.push({ fonte: 'youtube', topico: t.trim() })
        }
      }
    } catch {
      /* fonte opcional */
    }
  }

  // dedupe por similaridade simples (primeiras palavras normalizadas)
  const norm = (s: string) =>
    s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()
  const vistos = new Set<string>()
  const unico: TrendBruto[] = []
  for (const t of out) {
    const k = norm(t.topico).split(' ').slice(0, 4).join(' ')
    if (k.length > 2 && !vistos.has(k)) {
      vistos.add(k)
      unico.push(t)
    }
  }
  return unico
}
