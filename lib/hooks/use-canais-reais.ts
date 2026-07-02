import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

export interface CanalReal {
  plataforma: string
  nome: string
  handle: string
  url: string
  posts: number
  views: number
  likes: number
  comentarios: number
  shares: number
  mediaViews: number
  engajamento: number // (likes+com+shares)/views em %
  melhor: { titulo: string; views: number } | null
}

// metadados das 4 contas reais (handles confirmados nas memórias do projeto)
const REDES: Record<string, { nome: string; handle: string; url: string }> = {
  youtube: { nome: 'YouTube', handle: '@pulsohistorias', url: 'https://youtube.com/@pulsohistorias' },
  tiktok: { nome: 'TikTok', handle: '@pulsohistorias', url: 'https://tiktok.com/@pulsohistorias' },
  instagram: { nome: 'Instagram', handle: '@pulsoprojects', url: 'https://instagram.com/pulsoprojects' },
  facebook: { nome: 'Facebook', handle: 'Pulso Projects', url: 'https://facebook.com/pulsoprojects' },
  kwai: { nome: 'Kwai', handle: 'Pulso Projects', url: 'https://www.kwai.com' },
}
const ORDEM = ['youtube', 'instagram', 'tiktok', 'facebook', 'kwai']

// Agrega a performance REAL por rede social (de metricas_publicacao) — é o que "reflete a real".
export function useCanaisReais() {
  return useQuery<CanalReal[]>({
    queryKey: ['canais-reais'],
    queryFn: async () => {
      const { data: mp, error } = await supabase
        .schema('pulso_content')
        .from('metricas_publicacao')
        .select('plataforma, views, likes, comentarios, shares, ideia_id')
      if (error) throw error

      const { data: ideias } = await supabase
        .schema('pulso_content')
        .from('ideias')
        .select('id, titulo')
      const tit = new Map((ideias || []).map((i: { id: string; titulo: string }) => [i.id, i.titulo]))

      const acc = new Map<string, CanalReal>()
      for (const p of ORDEM) {
        const r = REDES[p]
        acc.set(p, { plataforma: p, nome: r.nome, handle: r.handle, url: r.url, posts: 0, views: 0, likes: 0, comentarios: 0, shares: 0, mediaViews: 0, engajamento: 0, melhor: null })
      }
      for (const row of mp || []) {
        const c = acc.get(row.plataforma)
        if (!c) continue
        const v = Number(row.views || 0)
        c.posts += 1
        c.views += v
        c.likes += Number(row.likes || 0)
        c.comentarios += Number(row.comentarios || 0)
        c.shares += Number(row.shares || 0)
        if (!c.melhor || v > c.melhor.views) {
          c.melhor = { titulo: (tit.get(row.ideia_id) as string) || '—', views: v }
        }
      }
      for (const c of acc.values()) {
        c.mediaViews = c.posts ? Math.round(c.views / c.posts) : 0
        c.engajamento = c.views ? Number((((c.likes + c.comentarios + c.shares) / c.views) * 100).toFixed(1)) : 0
      }
      return ORDEM.map((p) => acc.get(p)!).filter(Boolean)
    },
  })
}
