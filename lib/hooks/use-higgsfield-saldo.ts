'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

/**
 * Saldo de créditos do Higgsfield (gravado pelo worker local a cada rodada).
 * Serve o aviso proativo de "vai faltar crédito pro render" no app.
 *
 * Custo por vídeo ≈ 9 cenas × 8 créditos (Veo) = ~72 créditos, menos o que o
 * banco de clips reusa. Por isso o alerta dispara bem antes do zero.
 */

const CUSTO_VIDEO_APROX = 72 // ~9 cenas Veo × 8cr
const CUSTO_CENA = 8

export interface HiggsfieldSaldo {
  creditos: number
  plano: string | null
  quando: string | null
  /** 'ok' | 'atencao' (< ~1 vídeo) | 'critico' (< 1 cena) */
  nivel: 'ok' | 'atencao' | 'critico'
  /** vídeos completos que ainda dá pra renderizar via Veo */
  videosRestantes: number
}

export function useHiggsfieldSaldo() {
  return useQuery<HiggsfieldSaldo | null>({
    queryKey: ['higgsfield-saldo'],
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 5, // pega as atualizações do worker sem recarregar a página
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const { data } = await supabase
        .schema('pulso_core')
        .from('configuracoes')
        .select('valor')
        .eq('chave', 'higgsfield_saldo')
        .maybeSingle()
      if (!data?.valor) return null
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const v = data.valor as any
      const creditos = Number(v.creditos) || 0
      const nivel: HiggsfieldSaldo['nivel'] =
        creditos < CUSTO_CENA ? 'critico' : creditos < CUSTO_VIDEO_APROX ? 'atencao' : 'ok'
      return {
        creditos,
        plano: v.plano ?? null,
        quando: v.quando ?? null,
        nivel,
        videosRestantes: Math.floor(creditos / CUSTO_VIDEO_APROX),
      }
    },
  })
}
