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
