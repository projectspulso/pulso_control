import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

// Conteúdo de publicação por rede, salvo em pipeline_producao.metadata.publicacao
export interface PubRede {
  titulo?: string
  legenda?: string
}
export interface VideoPub {
  pipelineId: string
  ideiaId: string
  numero: number | null
  titulo: string
  videoUrl: string | null
  captionBase: string
  tituloCurto: string
  publicadoEm: string[] // redes que já subiram (de metricas_publicacao)
  publicacao: Record<string, PubRede> // overrides salvos por rede
}

export const REDES_PADRAO = ['youtube', 'instagram', 'tiktok', 'facebook'] as const

function tituloCurto(caption: string, fallback: string): string {
  let t = (caption || '').split('\n')[0].trim() || fallback
  if (t.length > 70) {
    const corte = t.slice(0, 70)
    const fim = Math.max(corte.lastIndexOf('. '), corte.lastIndexOf('! '), corte.lastIndexOf('? '))
    t = (fim > 30 ? corte.slice(0, fim + 1) : corte).trim()
  }
  if (!/#shorts/i.test(t)) t = `${t} #shorts`
  return t
}

export function useCentralPublicacao() {
  return useQuery<VideoPub[]>({
    queryKey: ['central-publicacao'],
    refetchInterval: 5 * 60 * 1000,
    queryFn: async () => {
      const [pipeQ, ideiasQ, mpQ] = await Promise.all([
        supabase.schema('pulso_content').from('pipeline_producao').select('id, ideia_id, status, metadata').in('status', ['PRONTO_PUBLICACAO', 'PUBLICADO']),
        supabase.schema('pulso_content').from('ideias').select('id, titulo'),
        supabase.schema('pulso_content').from('metricas_publicacao').select('ideia_id, plataforma'),
      ])
      if (pipeQ.error) throw pipeQ.error
      const tit = new Map((ideiasQ.data || []).map((i) => [i.id, i.titulo as string]))
      const pubPorIdeia = new Map<string, Set<string>>()
      for (const m of mpQ.data || []) {
        if (!pubPorIdeia.has(m.ideia_id)) pubPorIdeia.set(m.ideia_id, new Set())
        pubPorIdeia.get(m.ideia_id)!.add(m.plataforma)
      }
      return (pipeQ.data || []).map((p) => {
        const md = p.metadata || {}
        const caption = (md.caption as string) || ''
        const numero = (md.numero as number) ?? null
        return {
          pipelineId: p.id,
          ideiaId: p.ideia_id,
          numero,
          titulo: tit.get(p.ideia_id) || 'PULSO',
          videoUrl: (md.video_url as string) || null,
          captionBase: caption,
          tituloCurto: tituloCurto(caption, tit.get(p.ideia_id) || 'PULSO'),
          publicadoEm: Array.from(pubPorIdeia.get(p.ideia_id) || []),
          publicacao: (md.publicacao as Record<string, PubRede>) || {},
        }
      }).sort((a, b) => (b.numero ?? 0) - (a.numero ?? 0))
    },
  })
}

// Salva o conteúdo de publicação por rede dentro de metadata.publicacao (merge, sem perder o resto).
export function useSalvarPublicacao() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ pipelineId, publicacao }: { pipelineId: string; publicacao: Record<string, PubRede> }) => {
      const { data: atual, error: e1 } = await supabase.schema('pulso_content').from('pipeline_producao').select('metadata').eq('id', pipelineId).single()
      if (e1) throw e1
      const md = { ...(atual?.metadata || {}), publicacao }
      const { error: e2 } = await supabase.schema('pulso_content').from('pipeline_producao').update({ metadata: md }).eq('id', pipelineId)
      if (e2) throw e2
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['central-publicacao'] }),
  })
}
