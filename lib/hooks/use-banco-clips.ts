import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

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
      const { data, error } = await supabase
        .schema('pulso_core')
        .from('configuracoes')
        .select('valor')
        .eq('chave', 'banco_clips_catalogo')
        .maybeSingle()
      if (error) throw error
      if (!data?.valor) return []
      try {
        const arr = JSON.parse(data.valor) as ClipCatalogo[]
        return arr.map((c) => ({ ...c, dur: Number(c.dur) || 0, usos: Number(c.usos) || 0, tags: c.tags || [] }))
      } catch {
        return []
      }
    },
  })
}

// Lê o resumo do banco de clips reusáveis (gravado pelo render local em configuracoes).
export function useBancoClips() {
  return useQuery<BancoClipsStats | null>({
    queryKey: ['banco-clips-stats'],
    refetchInterval: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .schema('pulso_core')
        .from('configuracoes')
        .select('valor')
        .eq('chave', 'banco_clips_stats')
        .maybeSingle()
      if (error) throw error
      if (!data?.valor) return null
      try {
        return JSON.parse(data.valor) as BancoClipsStats
      } catch {
        return null
      }
    },
  })
}
