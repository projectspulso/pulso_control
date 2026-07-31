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

export interface ClipVisao {
  descricao?: string
  objetos?: string[]
  cenario?: string
  clima?: string[]
  paleta?: string[]
  busca?: string[]
}
export interface ClipCatalogo {
  id: string
  prompt: string
  tags: string[]
  tema: string
  dur: number
  usos: number
  thumb: string
  /** mp4 no storage durável — a galeria toca o clip ao clicar */
  video_url?: string
  visao?: ClipVisao
  vtags?: string[]
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

export interface LedgerRender {
  slug: string
  quando: string
  cenas: number
  fontes: Record<string, number>
  veo_cr: number
  economizado_cr: number
}

/**
 * LEDGER DOS RENDERS — de onde veio cada cena (banco/pexels/pixabay/wan/veo), por vídeo.
 * Gravado pelo motor local (gen_scenes → worker → metadata.ledger_render do pipeline) a partir
 * de 31/07/2026. É o instrumento da decisão de escala: só dá pra aumentar o volume com b-roll
 * grátis quando der pra comparar o desempenho dele com o do gerado — e até aqui ninguém
 * registrava a fonte.
 */
export function useLedgerRender() {
  return useQuery<LedgerRender[]>({
    queryKey: ['ledger-render'],
    refetchInterval: 10 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .schema('pulso_content')
        .from('pipeline_producao')
        .select('metadata')
        .not('metadata->ledger_render', 'is', null)
      if (error) throw error
      return ((data || []) as Array<{ metadata: { ledger_render?: LedgerRender } | null }>)
        .map((p) => p.metadata?.ledger_render)
        .filter((l): l is LedgerRender => !!l)
        .sort((a, b) => (a.quando < b.quando ? 1 : -1))
    },
  })
}
