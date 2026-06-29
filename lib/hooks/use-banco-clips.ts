import { useQuery } from '@tanstack/react-query'

export interface BancoClipsStats {
  clips: number
  usos_total: number
  creditos_economizados: number
  temas: number
  por_tema: Record<string, number>
  atualizado: string
}

export interface ClipCatalogo {
  id: string
  prompt: string
  tags: string[]
  tema: string
  dur: number
  usos: number
  thumb: string
}

// Catálogo navegável (1 thumb por clip) pra galeria buscável no Assets.
export function useBancoClipsCatalogo() {
  return useQuery<ClipCatalogo[]>({
    queryKey: ['banco-clips-catalogo'],
    refetchInterval: 5 * 60 * 1000,
    queryFn: async () => {
      const r = await fetch('/api/banco-clips')
      if (!r.ok) return []
      const { catalogo } = (await r.json()) as { catalogo: ClipCatalogo[] }
      return (catalogo || []).map((c) => ({ ...c, dur: Number(c.dur) || 0, usos: Number(c.usos) || 0, tags: c.tags || [] }))
    },
  })
}

// Lê o resumo do banco de clips reusáveis (gravado pelo render local em configuracoes).
export function useBancoClips() {
  return useQuery<BancoClipsStats | null>({
    queryKey: ['banco-clips-stats'],
    refetchInterval: 5 * 60 * 1000,
    queryFn: async () => {
      const r = await fetch('/api/banco-clips')
      if (!r.ok) return null
      const { stats } = (await r.json()) as { stats: BancoClipsStats | null }
      return stats
    },
  })
}
