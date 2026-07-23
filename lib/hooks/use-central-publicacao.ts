import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { withPulsoCodigo } from '@/lib/pulso-codigo'

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
  status: string
  pronto: boolean // PRONTO_PUBLICACAO ou PUBLICADO (tem vídeo + caption); senão está "a montar"
  thumb: string | null
  videoUrl: string | null
  captionBase: string
  tituloCurto: string
  publicadoEm: string[] // redes que já subiram (de metricas_publicacao)
  publicadoDatas: Record<string, string> // rede -> data (DD/MM) da 1ª publicação
  publicacao: Record<string, PubRede> // overrides salvos por rede
}

export const REDES_PADRAO = ['youtube', 'instagram', 'tiktok', 'facebook', 'kwai'] as const

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
        supabase.schema('pulso_content').from('pipeline_producao').select('id, ideia_id, status, metadata'),
        supabase.schema('pulso_content').from('ideias').select('id, titulo'),
        supabase.schema('pulso_content').from('metricas_publicacao').select('ideia_id, plataforma, data_publicacao'),
      ])
      if (pipeQ.error) throw pipeQ.error
      const tit = new Map((ideiasQ.data || []).map((i) => [i.id, i.titulo as string]))
      const pubPorIdeia = new Map<string, Set<string>>()
      const rawDatas = new Map<string, Record<string, string>>() // ideia -> rede -> ISO mais antigo
      for (const m of mpQ.data || []) {
        if (!pubPorIdeia.has(m.ideia_id)) pubPorIdeia.set(m.ideia_id, new Set())
        pubPorIdeia.get(m.ideia_id)!.add(m.plataforma)
        if (m.data_publicacao) {
          if (!rawDatas.has(m.ideia_id)) rawDatas.set(m.ideia_id, {})
          const d = rawDatas.get(m.ideia_id)!
          if (!d[m.plataforma] || m.data_publicacao < d[m.plataforma]) d[m.plataforma] = m.data_publicacao
        }
      }
      const fmtData = (iso: string) => {
        const dt = new Date(iso)
        return `${String(dt.getUTCDate()).padStart(2, '0')}/${String(dt.getUTCMonth() + 1).padStart(2, '0')}`
      }
      return (pipeQ.data || []).map((p) => {
        const md = p.metadata || {}
        const numero = (md.numero as number) ?? null
        // #pulsoNNN no fim da legenda-base: o código de ligação entre redes segue pra toda
        // cópia manual (Kwai/IG/FB/TikTok) montada a partir daqui. Idempotente.
        const caption = withPulsoCodigo((md.caption as string) || '', numero)
        const pronto = p.status === 'PRONTO_PUBLICACAO' || p.status === 'PUBLICADO'
        return {
          pipelineId: p.id,
          ideiaId: p.ideia_id,
          numero,
          titulo: tit.get(p.ideia_id) || 'PULSO',
          status: p.status,
          pronto,
          thumb: (md.thumb as string) || null,
          videoUrl: (md.video_url as string) || null,
          captionBase: caption,
          tituloCurto: tituloCurto(caption, tit.get(p.ideia_id) || 'PULSO'),
          publicadoEm: Array.from(pubPorIdeia.get(p.ideia_id) || []),
          publicadoDatas: Object.fromEntries(
            Object.entries(rawDatas.get(p.ideia_id) || {}).map(([rede, iso]) => [rede, fmtData(iso)]),
          ),
          publicacao: (md.publicacao as Record<string, PubRede>) || {},
        }
      }).sort((a, b) => Number(b.pronto) - Number(a.pronto) || (b.numero ?? 0) - (a.numero ?? 0))
    },
  })
}

// Perfil da conta (seguidores/curtidas) de uma rede manual — ex.: Kwai.
export interface PerfilRede { seguidores: number; curtidas: number; quando: string | null }
export function usePerfilRede(rede: string) {
  return useQuery<PerfilRede>({
    queryKey: ['perfil-rede', rede],
    queryFn: async () => {
      const r = await fetch(`/api/metricas/manual?perfil=${rede}`)
      const d = await r.json()
      return d.perfil as PerfilRede
    },
  })
}
export function useSalvarPerfilRede() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ rede, seguidores, curtidas }: { rede: string; seguidores: number; curtidas: number }) => {
      const r = await fetch('/api/metricas/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ perfilRede: rede, seguidores, curtidas }),
      })
      if (!r.ok) throw new Error('falha ao salvar perfil')
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['perfil-rede', v.rede] }),
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
