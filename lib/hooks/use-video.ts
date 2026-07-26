'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { dedupePublicacoes } from '@/lib/analytics/dedupe'

/**
 * Detalhe de UM vídeo (ideia) para /analytics/videos/[id].
 *
 * Consolida: o snapshot por rede (metricas_publicacao, deduplicado por repost), a série temporal
 * (leituras_metricas — o dado forte, 47 dias sem buraco) e o percentil de retenção dentro da rede.
 * Marca "indisponível" o que a API da rede não entrega (retenção em TikTok/Kwai, alcance fora de
 * IG/FB) — nunca finge zero.
 */

export interface RedeDoVideo {
  plataforma: string
  url: string | null
  views: number
  reach: number | null
  likes: number
  comentarios: number
  shares: number
  saves: number
  taxaRetencao: number | null
  seguidores: number | null
  percentil: number | null // posição da retenção dentro da rede (0..100), null = sem base
  dataPublicacao: string | null
}

export interface PontoSerie {
  data: string
  views: number
}

export interface VideoDetalhe {
  ideiaId: string
  titulo: string
  canalNome: string
  numero: number | null
  notaHook: number | null
  duracaoSeg: number | null
  videoUrl: string | null
  // consolidado (soma/represália do que faz sentido somar)
  viewsTotal: number
  reachTotal: number | null // só onde há (IG+FB)
  seguidoresTotal: number | null // só FB
  redes: RedeDoVideo[]
  serie: PontoSerie[] // views totais do vídeo por dia (todas as redes somadas)
  padrao: 'explosao' | 'evergreen' | 'desacelerando' | 'estavel' | 'poucos_dados'
}

// mesmas regras da reconciliação: quais redes entregam cada métrica
const RET_REDES = new Set(['youtube', 'instagram', 'facebook'])
const REACH_REDES = new Set(['instagram', 'facebook'])

export function useVideo(ideiaId: string) {
  return useQuery<VideoDetalhe | null>({
    queryKey: ['video', ideiaId],
    enabled: !!ideiaId,
    queryFn: async () => {
      const [ideiaQ, metQ, todasMetQ, pipeQ, audioQ, canaisQ, roteiroQ, leiturasQ] = await Promise.all([
        supabase.schema('pulso_content').from('ideias').select('id, titulo, canal_id').eq('id', ideiaId).maybeSingle(),
        supabase.schema('pulso_content').from('metricas_publicacao')
          .select('plataforma, url_publicacao, views, reach, likes, comentarios, shares, saves, taxa_retencao, taxa_conversao, data_publicacao')
          .eq('ideia_id', ideiaId),
        // retenção de TODOS os vídeos, por rede, pra calcular o percentil deste dentro da rede
        supabase.schema('pulso_content').from('metricas_publicacao').select('plataforma, taxa_retencao'),
        supabase.schema('pulso_content').from('pipeline_producao').select('metadata').eq('ideia_id', ideiaId).maybeSingle(),
        supabase.schema('pulso_content').from('audios').select('duracao_segundos').eq('ideia_id', ideiaId).limit(1),
        supabase.schema('pulso_core').from('canais').select('id, nome'),
        supabase.schema('pulso_content').from('roteiros').select('nota_hook').eq('ideia_id', ideiaId).limit(1),
        supabase.schema('pulso_analytics').from('leituras_metricas')
          .select('data_ref, views, plataforma').eq('ideia_id', ideiaId).eq('estimado', false).order('data_ref'),
      ])
      if (!ideiaQ.data) return null

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const canalNome = new Map<string, string>(((canaisQ.data || []) as any[]).map((c) => [c.id, c.nome]))

      // percentil de retenção dentro de cada rede (mesma lógica do cérebro/agenda)
      const retPorRede = new Map<string, number[]>()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const m of (todasMetQ.data || []) as any[]) {
        if (m.taxa_retencao == null) continue
        if (!retPorRede.has(m.plataforma)) retPorRede.set(m.plataforma, [])
        retPorRede.get(m.plataforma)!.push(m.taxa_retencao)
      }
      for (const arr of retPorRede.values()) arr.sort((a, b) => a - b)
      const percentil = (plataforma: string, valor: number | null): number | null => {
        if (valor == null) return null
        const arr = retPorRede.get(plataforma)
        if (!arr || arr.length < 2) return null
        let abaixo = 0
        for (const v of arr) if (v < valor) abaixo++
        return Math.round((abaixo / (arr.length - 1)) * 100)
      }

      // dedup de repost na linha por rede
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { unicas } = dedupePublicacoes(((metQ.data || []) as any[]).map((m) => ({ ...m, ideia_id: ideiaId })))
      const redes: RedeDoVideo[] = unicas
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((m: any) => ({
          plataforma: m.plataforma,
          url: m.url_publicacao,
          views: m.views || 0,
          reach: REACH_REDES.has(m.plataforma) ? (m.reach ?? null) : null,
          likes: m.likes || 0,
          comentarios: m.comentarios || 0,
          shares: m.shares || 0,
          saves: m.saves || 0,
          taxaRetencao: RET_REDES.has(m.plataforma) ? (m.taxa_retencao ?? null) : null,
          seguidores: m.plataforma === 'facebook' && m.taxa_conversao != null && m.views
            ? Math.round((m.taxa_conversao * m.views) / 1000) : null,
          percentil: percentil(m.plataforma, RET_REDES.has(m.plataforma) ? m.taxa_retencao : null),
          dataPublicacao: m.data_publicacao,
        }))
        .sort((a, b) => b.views - a.views)

      // série temporal: views totais do vídeo por dia (soma das redes naquele dia)
      const porDia = new Map<string, number>()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const l of (leiturasQ.data || []) as any[]) {
        porDia.set(l.data_ref, (porDia.get(l.data_ref) || 0) + (l.views || 0))
      }
      const serie: PontoSerie[] = [...porDia.entries()].sort().map(([data, views]) => ({ data, views }))

      // classifica o padrão: onde a maior parte das views chegou
      let padrao: VideoDetalhe['padrao'] = 'poucos_dados'
      if (serie.length >= 3) {
        const total = serie[serie.length - 1].views
        const dia3 = serie[Math.min(2, serie.length - 1)].views
        const frac3 = total > 0 ? dia3 / total : 0
        const ganhoRecente = serie.length >= 2 ? serie[serie.length - 1].views - serie[serie.length - 2].views : 0
        if (frac3 >= 0.7) padrao = 'explosao'
        else if (ganhoRecente > total * 0.03) padrao = 'evergreen'
        else if (ganhoRecente <= total * 0.005) padrao = 'desacelerando'
        else padrao = 'estavel'
      }

      const viewsTotal = redes.reduce((s, r) => s + r.views, 0)
      const reachRedes = redes.filter((r) => r.reach != null)
      const seguidoresRedes = redes.filter((r) => r.seguidores != null)

      return {
        ideiaId,
        titulo: ideiaQ.data.titulo || '(sem título)',
        canalNome: (ideiaQ.data.canal_id && canalNome.get(ideiaQ.data.canal_id)) || '—',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        numero: (pipeQ.data as any)?.metadata?.numero ?? null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        notaHook: (roteiroQ.data as any[])?.[0]?.nota_hook ?? null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        duracaoSeg: (audioQ.data as any[])?.[0]?.duracao_segundos ?? null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        videoUrl: (pipeQ.data as any)?.metadata?.video_url ?? null,
        viewsTotal,
        reachTotal: reachRedes.length ? reachRedes.reduce((s, r) => s + (r.reach || 0), 0) : null,
        seguidoresTotal: seguidoresRedes.length ? seguidoresRedes.reduce((s, r) => s + (r.seguidores || 0), 0) : null,
        redes,
        serie,
        padrao,
      }
    },
  })
}
