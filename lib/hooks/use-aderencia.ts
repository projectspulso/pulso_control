import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase/client'

export interface PublicacaoMetrica {
  id: string
  ideia_id: string | null
  plataforma: string
  post_id: string | null
  url_publicacao: string | null
  data_publicacao: string
  views: number | null
  likes: number | null
  comentarios: number | null
  shares: number | null
  saves: number | null
  ultima_atualizacao?: string | null
  updated_at?: string | null
}

export interface VideoAderencia {
  ideiaId: string
  titulo: string
  canalNome: string
  plataformas: Record<string, PublicacaoMetrica>
  totalViews: number
  totalLikes: number
  ressonancia: number // likes/views
}

export interface AderenciaSnapshot {
  videos: VideoAderencia[]
  porPlataforma: Record<string, { views: number; likes: number; automatica: boolean }>
  totalViews: number
  ultimaColeta: string | null
}

const PLATAFORMAS_AUTO = new Set(['youtube', 'instagram', 'facebook', 'tiktok'])

export function useAderencia() {
  return useQuery<AderenciaSnapshot>({
    queryKey: ['aderencia'],
    refetchInterval: 5 * 60 * 1000, // quase-real-time: revalida a cada 5 min
    queryFn: async () => {
      const [{ data: metricas, error: e1 }, { data: ideias, error: e2 }] = await Promise.all([
        supabase
          .schema('pulso_content')
          .from('metricas_publicacao')
          .select('*')
          .order('data_publicacao', { ascending: true }),
        supabase.schema('pulso_content').from('ideias').select('id, titulo, canal_id'),
      ])
      if (e1) throw e1
      if (e2) throw e2

      const { data: canais, error: e3 } = await supabase
        .schema('pulso_core')
        .from('canais')
        .select('id, nome')
      if (e3) throw e3

      const canalNome = new Map((canais || []).map((c) => [c.id, c.nome]))
      const ideiaInfo = new Map(
        (ideias || []).map((i) => [i.id, { titulo: i.titulo, canal: canalNome.get(i.canal_id) || '—' }])
      )

      const porVideo = new Map<string, VideoAderencia>()
      const porPlataforma: AderenciaSnapshot['porPlataforma'] = {}
      let ultimaColeta: string | null = null

      for (const m of (metricas || []) as PublicacaoMetrica[]) {
        if (!m.ideia_id) continue
        const info = ideiaInfo.get(m.ideia_id)
        if (!info) continue
        if (!porVideo.has(m.ideia_id)) {
          porVideo.set(m.ideia_id, {
            ideiaId: m.ideia_id,
            titulo: info.titulo,
            canalNome: info.canal,
            plataformas: {},
            totalViews: 0,
            totalLikes: 0,
            ressonancia: 0,
          })
        }
        const v = porVideo.get(m.ideia_id) as VideoAderencia
        v.plataformas[m.plataforma] = m
        v.totalViews += m.views || 0
        v.totalLikes += m.likes || 0

        if (!porPlataforma[m.plataforma]) {
          porPlataforma[m.plataforma] = { views: 0, likes: 0, automatica: PLATAFORMAS_AUTO.has(m.plataforma) }
        }
        porPlataforma[m.plataforma].views += m.views || 0
        porPlataforma[m.plataforma].likes += m.likes || 0

        // ultima_atualizacao = hora real da coleta (o que o coletar-metricas grava).
        // updated_at muda em qualquer alteração da linha — não é a coleta.
        const col = m.ultima_atualizacao || m.updated_at
        if (col && (!ultimaColeta || col > ultimaColeta)) ultimaColeta = col
      }

      const videos = [...porVideo.values()]
        .map((v) => ({ ...v, ressonancia: v.totalViews > 0 ? (v.totalLikes / v.totalViews) * 100 : 0 }))
        .sort((a, b) => b.totalViews - a.totalViews)

      return {
        videos,
        porPlataforma,
        totalViews: videos.reduce((acc, v) => acc + v.totalViews, 0),
        ultimaColeta,
      }
    },
  })
}

export function useColetarAgora() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const resp = await fetch('/api/automation/coletar-metricas', { method: 'POST', body: '{}' })
      if (!resp.ok) throw new Error(`Coleta falhou (${resp.status})`)
      return resp.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aderencia'] })
    },
  })
}
