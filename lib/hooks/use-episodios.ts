'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getSupabaseBrowser } from '@/lib/supabase/browser'

/**
 * Trilha de vídeos longos (série Bastidores) — SEPARADA da esteira de Shorts.
 * Episódio é entidade de primeira classe (estilo limelight): a produção dele é
 * capturas + montagem manual, não cenas Veo, então a máquina de estados é outra.
 */

export interface ItemChecklist {
  item: string
  feito: boolean
}

export interface Episodio {
  id: string
  temporada: number
  numero: number
  codigo: string
  titulo: string
  gancho: string | null
  material: string | null
  roteiro_md: string | null
  checklist: ItemChecklist[]
  status: StatusEpisodio
  ordem_producao: number | null
  ideia_id: string | null
  audio_url: string | null
  video_url: string | null
  data_prevista: string | null
  notas: string | null
}

export type StatusEpisodio =
  | 'planejado'
  | 'roteiro_ok'
  | 'narracao_gerada'
  | 'capturas_coletadas'
  | 'montado'
  | 'em_revisao'
  | 'pronto_publicacao'
  | 'publicado'

/** A esteira do longo, na ordem. Avançar = próximo índice; a promoção a pronto_publicacao
 *  passa pela API (cria ideia+pipeline), e publicado é carimbado pela Central. */
export const ETAPAS_EPISODIO: { status: StatusEpisodio; label: string }[] = [
  { status: 'planejado', label: 'Planejado' },
  { status: 'roteiro_ok', label: 'Roteiro OK' },
  { status: 'narracao_gerada', label: 'Narração gerada' },
  { status: 'capturas_coletadas', label: 'Capturas coletadas' },
  { status: 'montado', label: 'Montado' },
  { status: 'em_revisao', label: 'Em revisão' },
  { status: 'pronto_publicacao', label: 'Pronto p/ publicar' },
  { status: 'publicado', label: 'Publicado' },
]

export function useEpisodios() {
  const supabase = getSupabaseBrowser()
  return useQuery({
    queryKey: ['episodios-longos'],
    refetchInterval: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .schema('pulso_content')
        .from('episodios')
        .select('*')
        .order('numero')
      if (error) throw error
      return (data || []) as Episodio[]
    },
  })
}

export function useAtualizarEpisodio() {
  const supabase = getSupabaseBrowser()
  const qc = useQueryClient()
  return async (id: string, patch: Partial<Pick<Episodio, 'status' | 'checklist' | 'audio_url' | 'video_url' | 'roteiro_md' | 'notas' | 'data_prevista'>>) => {
    const { error } = await supabase
      .schema('pulso_content')
      .from('episodios')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
    qc.invalidateQueries({ queryKey: ['episodios-longos'] })
  }
}
