'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

export interface Episodio {
  id: string
  codigo: string
  titulo: string
  gancho: string | null
  status: string
  roteiro_md: string | null
  data_prevista: string | null
  audio_url: string | null
  video_url: string | null
}

export type EstadoFabrica = 'pronto' | 'em_andamento' | 'falta' | 'a_fazer'
export interface ItemFabrica { id: string; nome: string; estado: EstadoFabrica; nota: string }

export function useEpisodios() {
  return useQuery<Episodio[]>({
    queryKey: ['longos-episodios'],
    queryFn: async () => {
      const { data, error } = await supabase.schema('pulso_content').from('episodios')
        .select('id, codigo, titulo, gancho, status, roteiro_md, data_prevista, audio_url, video_url')
        .order('codigo')
      if (error) throw error
      return (data || []) as Episodio[]
    },
  })
}

export function useEpisodio(codigo: string) {
  return useQuery<Episodio | null>({
    queryKey: ['longos-episodio', codigo],
    queryFn: async () => {
      const { data, error } = await supabase.schema('pulso_content').from('episodios')
        .select('id, codigo, titulo, gancho, status, roteiro_md, data_prevista, audio_url, video_url')
        .eq('codigo', codigo).maybeSingle()
      if (error) throw error
      return (data as Episodio) || null
    },
  })
}

/** Checklist da fábrica (configuracoes.longos_fabrica): o que falta para o primeiro episódio sair. */
export function useFabrica() {
  return useQuery<{ atualizadoEm: string | null; itens: ItemFabrica[] }>({
    queryKey: ['longos-fabrica'],
    queryFn: async () => {
      const { data, error } = await supabase.schema('pulso_core').from('configuracoes')
        .select('valor').eq('chave', 'longos_fabrica').maybeSingle()
      if (error) throw error
      try {
        const v = JSON.parse(data?.valor || '{}')
        return { atualizadoEm: v.atualizadoEm || null, itens: Array.isArray(v.itens) ? v.itens : [] }
      } catch {
        return { atualizadoEm: null, itens: [] }
      }
    },
  })
}

/** Vídeos longos já publicados (ideias formato=longo com publicação medida). */
export function useLongosPublicados() {
  return useQuery<{ titulo: string; plataforma: string; views: number; data: string | null }[]>({
    queryKey: ['longos-publicados'],
    queryFn: async () => {
      const ide = await supabase.schema('pulso_content').from('ideias').select('id, titulo').eq('formato', 'longo')
      if (ide.error) throw ide.error
      const ids = (ide.data || []).map((i) => i.id)
      if (!ids.length) return []
      const met = await supabase.schema('pulso_content').from('metricas_publicacao')
        .select('ideia_id, plataforma, views, data_publicacao').in('ideia_id', ids)
      if (met.error) throw met.error
      const titulo = new Map((ide.data || []).map((i) => [i.id, i.titulo as string]))
      return (met.data || []).map((m) => ({
        titulo: titulo.get(m.ideia_id) || '—', plataforma: m.plataforma, views: Number(m.views) || 0, data: m.data_publicacao,
      }))
    },
  })
}
