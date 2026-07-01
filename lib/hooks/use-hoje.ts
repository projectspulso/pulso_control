'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

/**
 * Plano do dia do PULSO — junta agenda × estoque pronto × o que já saiu × saúde da esteira.
 * A rede recomendada por vídeo vem do useAprendizados (a página cruza pelo canalId).
 */

export interface ItemPronto {
  ideiaId: string
  numero: number | null
  titulo: string
  canalId: string | null
  canalNome: string
  videoUrl: string | null
  pipelineId: string
  caption: string | null
}

export interface PublicadoHoje {
  ideiaId: string
  numero: number | null
  titulo: string
  plataformas: string[]
}

export interface Hoje {
  prontos: ItemPronto[]
  publicadosHoje: PublicadoHoje[]
  emRenderComCenas: number
  emRenderSemCenas: number
  aguardandoRoteiroOuAudio: number
  /** dias de estoque (prontos ÷ 3 publicações/dia da grade) */
  estoqueDias: number
}

const HOJE_ISO = () => new Date().toISOString().slice(0, 10)

export function useHoje() {
  return useQuery<Hoje>({
    queryKey: ['hoje'],
    refetchInterval: 5 * 60 * 1000,
    queryFn: async () => {
      const [ppRes, ideiasRes, canaisRes, metRes] = await Promise.all([
        supabase.schema('pulso_content').from('pipeline_producao').select('id, ideia_id, status, metadata'),
        supabase.schema('pulso_content').from('ideias').select('id, titulo, canal_id'),
        supabase.schema('pulso_core').from('canais').select('id, nome'),
        supabase
          .schema('pulso_content')
          .from('metricas_publicacao')
          .select('ideia_id, plataforma, data_publicacao')
          .gte('data_publicacao', HOJE_ISO()),
      ])

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ideiaMap = new Map<string, any>((ideiasRes.data || []).map((i: any) => [i.id, i]))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const canalNome = new Map<string, string>((canaisRes.data || []).map((c: any) => [c.id, c.nome]))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pp = (ppRes.data || []) as any[]

      const prontos: ItemPronto[] = pp
        .filter((p) => p.status === 'PRONTO_PUBLICACAO' && p.metadata?.video_url)
        .map((p) => {
          const ideia = ideiaMap.get(p.ideia_id)
          return {
            ideiaId: p.ideia_id,
            numero: p.metadata?.numero ?? null,
            titulo: ideia?.titulo || '(sem título)',
            canalId: ideia?.canal_id ?? null,
            canalNome: (ideia?.canal_id && canalNome.get(ideia.canal_id)) || '—',
            videoUrl: p.metadata?.video_url ?? null,
            pipelineId: p.id,
            caption: p.metadata?.caption ?? null,
          }
        })
        .sort((a, b) => (a.numero ?? 999) - (b.numero ?? 999))

      // já publicado hoje (agrupado por ideia)
      const porIdeia = new Map<string, Set<string>>()
      for (const m of metRes.data || []) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mm = m as any
        if (!mm.ideia_id) continue
        if (!porIdeia.has(mm.ideia_id)) porIdeia.set(mm.ideia_id, new Set())
        porIdeia.get(mm.ideia_id)!.add(mm.plataforma)
      }
      const publicadosHoje: PublicadoHoje[] = [...porIdeia.entries()].map(([ideiaId, plats]) => {
        const ideia = ideiaMap.get(ideiaId)
        const p = pp.find((x) => x.ideia_id === ideiaId)
        return {
          ideiaId,
          numero: p?.metadata?.numero ?? null,
          titulo: ideia?.titulo || '(sem título)',
          plataformas: [...plats],
        }
      })

      const emRenderComCenas = pp.filter((p) => p.status === 'EM_EDICAO' && p.metadata?.cenas).length
      const emRenderSemCenas = pp.filter((p) => p.status === 'EM_EDICAO' && !p.metadata?.cenas).length
      const aguardandoRoteiroOuAudio = pp.filter((p) =>
        ['AGUARDANDO_ROTEIRO', 'ROTEIRO_PRONTO', 'AUDIO_GERADO'].includes(p.status),
      ).length

      return {
        prontos,
        publicadosHoje,
        emRenderComCenas,
        emRenderSemCenas,
        aguardandoRoteiroOuAudio,
        estoqueDias: Math.round((prontos.length / 3) * 10) / 10,
      }
    },
  })
}
