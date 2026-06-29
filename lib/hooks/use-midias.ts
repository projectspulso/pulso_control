import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

export interface MidiaVideo {
  numero: number | null
  titulo: string
  videoUrl: string
  thumb: string | null
}
export interface MidiaAudio {
  id: string
  titulo: string
  url: string
  dur: number
}
export interface Midias {
  videos: MidiaVideo[]
  audios: MidiaAudio[]
}

// Mídia REAL do pipeline: vídeos finais (playáveis) + áudios. A view antiga
// (vw_pulso_pipeline_com_assets) vinha com asset_tipo nulo — por isso não mostrava nada.
export function useMidias() {
  return useQuery<Midias>({
    queryKey: ['midias'],
    refetchInterval: 5 * 60 * 1000,
    queryFn: async () => {
      const [pipeQ, audQ, ideQ] = await Promise.all([
        supabase.schema('pulso_content').from('pipeline_producao').select('ideia_id, metadata'),
        supabase.schema('pulso_content').from('audios').select('id, ideia_id, public_url, url, duracao_segundos, status'),
        supabase.schema('pulso_content').from('ideias').select('id, titulo'),
      ])
      const tit = new Map((ideQ.data || []).map((i) => [i.id, i.titulo as string]))

      const videos: MidiaVideo[] = []
      for (const p of pipeQ.data || []) {
        const md = (p.metadata || {}) as Record<string, unknown>
        if (md.video_url) {
          videos.push({
            numero: (md.numero as number) ?? null,
            titulo: tit.get(p.ideia_id) || 'PULSO',
            videoUrl: md.video_url as string,
            thumb: (md.thumb as string) || null,
          })
        }
      }
      videos.sort((a, b) => (b.numero ?? 0) - (a.numero ?? 0))

      const audios: MidiaAudio[] = []
      for (const a of audQ.data || []) {
        const url = (a.public_url as string) || (a.url as string)
        if (url) audios.push({ id: a.id, titulo: tit.get(a.ideia_id) || 'Áudio', url, dur: Number(a.duracao_segundos) || 0 })
      }

      return { videos, audios }
    },
  })
}
