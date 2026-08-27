'use client'

import { useQuery } from '@tanstack/react-query'
import { getSupabaseBrowser } from '@/lib/supabase/browser'

/**
 * Série do censo manual do Pinterest (rede ESPELHO — republicação automática do Instagram).
 * Fora das medianas de decisão e da cobertura da Aderência: não é publicação editorial nossa,
 * é alcance de bônus. Vira leitura por espelho quando o coletor do digiai_mkt existir.
 */

export interface LeituraPinterest {
  data: string
  janela_dias: number
  impressoes: number
  engajamentos: number
  cliques_saida: number
  pins_salvos: number
  publico_total: number
  publico_engajado: number
  pins_criados?: number
  nota?: string
}

export function usePinterest() {
  const supabase = getSupabaseBrowser()
  return useQuery({
    queryKey: ['pinterest-censo'],
    refetchInterval: 30 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .schema('pulso_core').from('configuracoes').select('valor').eq('chave', 'pinterest_censo').maybeSingle()
      let serie: LeituraPinterest[] = []
      try {
        const v = typeof data?.valor === 'string' ? JSON.parse(data.valor) : data?.valor
        if (Array.isArray(v)) serie = v
      } catch { /* sem censo ainda */ }
      if (serie.length === 0) return null
      const ultima = serie[serie.length - 1]
      const anterior = serie.length > 1 ? serie[serie.length - 2] : null
      const delta = (campo: keyof LeituraPinterest) =>
        anterior ? Number(ultima[campo] ?? 0) - Number(anterior[campo] ?? 0) : null
      return {
        serie,
        ultima,
        anterior,
        variacao: {
          impressoes: delta('impressoes'),
          engajamentos: delta('engajamentos'),
          cliques_saida: delta('cliques_saida'),
          pins_salvos: delta('pins_salvos'),
        },
      }
    },
  })
}
