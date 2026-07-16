import { useQuery } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase/client'

export interface RedeResumo {
  plataforma: string
  views: number
  likes: number
  publicacoes: number
}

export interface TopVideo {
  ideiaTitulo: string
  canalNome: string
  plataforma: string
  views: number
  url: string | null
}

export interface DashboardData {
  redes: RedeResumo[]
  viewsTotal: number
  likesTotal: number
  publicacoesTotal: number // posts (1 por rede) — 5 redes, então 1 vídeo pode virar até 5
  videosPublicados: number // vídeos DISTINTOS (ideia) que foram ao ar — o número "real"
  ultimaColeta: string | null
  pipeline: Record<string, number>
  estoqueIdeias: { rascunhos: number; aprovadasLivres: number }
  roteirosParaAprovar: number
  prontosParaPublicar: number
  topVideos: TopVideo[]
  ultimasPublicacoes: TopVideo[]
}

const REDES = ['youtube', 'instagram', 'facebook', 'tiktok', 'kwai']

export function useDashboard() {
  return useQuery<DashboardData>({
    queryKey: ['dashboard'],
    refetchInterval: 2 * 60 * 1000,
    queryFn: async () => {
      const [metricasQ, ideiasQ, canaisQ, pipesQ, roteirosQ] = await Promise.all([
        supabase
          .schema('pulso_content')
          .from('metricas_publicacao')
          .select('ideia_id, plataforma, url_publicacao, data_publicacao, views, likes, ultima_atualizacao'),
        supabase.schema('pulso_content').from('ideias').select('id, titulo, status, canal_id'),
        supabase.schema('pulso_core').from('canais').select('id, nome'),
        supabase.schema('pulso_content').from('pipeline_producao').select('ideia_id, status'),
        supabase.schema('pulso_content').from('roteiros').select('id, ideia_id, status'),
      ])
      for (const q of [metricasQ, ideiasQ, canaisQ, pipesQ, roteirosQ]) {
        if (q.error) throw q.error
      }

      const ideias = new Map((ideiasQ.data || []).map((i) => [i.id, i]))
      const canais = new Map((canaisQ.data || []).map((c) => [c.id, c.nome]))

      const redes: RedeResumo[] = REDES.map((p) => ({ plataforma: p, views: 0, likes: 0, publicacoes: 0 }))
      let ultimaColeta: string | null = null
      const videos: TopVideo[] = []
      const videosDistintos = new Set<string>()

      for (const m of metricasQ.data || []) {
        const rede = redes.find((r) => r.plataforma === m.plataforma)
        if (rede) {
          rede.views += m.views || 0
          rede.likes += m.likes || 0
          rede.publicacoes += 1
        }
        if (m.ideia_id) videosDistintos.add(m.ideia_id)
        if (m.ultima_atualizacao && (!ultimaColeta || m.ultima_atualizacao > ultimaColeta)) {
          ultimaColeta = m.ultima_atualizacao
        }
        const ideia = m.ideia_id ? ideias.get(m.ideia_id) : null
        videos.push({
          ideiaTitulo: ideia?.titulo || '—',
          canalNome: (canais.get(ideia?.canal_id) || '—').replace(/^PULSO\s*/i, ''),
          plataforma: m.plataforma,
          views: m.views || 0,
          url: m.url_publicacao,
        })
      }

      const pipeline: Record<string, number> = {}
      const ideiasComPipeline = new Set<string>()
      for (const p of pipesQ.data || []) {
        pipeline[p.status] = (pipeline[p.status] || 0) + 1
        if (p.ideia_id) ideiasComPipeline.add(p.ideia_id)
      }

      let rascunhos = 0
      let aprovadasLivres = 0
      for (const i of ideiasQ.data || []) {
        const st = (i.status || '').toUpperCase()
        if (st === 'RASCUNHO') rascunhos += 1
        else if (st.startsWith('APROVAD') && !ideiasComPipeline.has(i.id)) aprovadasLivres += 1
      }

      const roteirosParaAprovar = (roteirosQ.data || []).filter(
        (r) => (r.status || '').toUpperCase() === 'RASCUNHO'
      ).length

      // top por views (1 linha por publicação) e últimas publicações por data
      const ordenadoPorViews = [...videos].sort((a, b) => b.views - a.views).slice(0, 5)
      const ultimas = (metricasQ.data || [])
        .slice()
        .sort((a, b) => (b.data_publicacao || '').localeCompare(a.data_publicacao || ''))
        .slice(0, 6)
        .map((m) => {
          const ideia = m.ideia_id ? ideias.get(m.ideia_id) : null
          return {
            ideiaTitulo: ideia?.titulo || '—',
            canalNome: (canais.get(ideia?.canal_id) || '—').replace(/^PULSO\s*/i, ''),
            plataforma: m.plataforma,
            views: m.views || 0,
            url: m.url_publicacao,
          }
        })

      return {
        redes,
        viewsTotal: redes.reduce((a, r) => a + r.views, 0),
        likesTotal: redes.reduce((a, r) => a + r.likes, 0),
        publicacoesTotal: redes.reduce((a, r) => a + r.publicacoes, 0),
        videosPublicados: videosDistintos.size,
        ultimaColeta,
        pipeline,
        estoqueIdeias: { rascunhos, aprovadasLivres },
        roteirosParaAprovar,
        prontosParaPublicar: pipeline['PRONTO_PUBLICACAO'] || 0,
        topVideos: ordenadoPorViews,
        ultimasPublicacoes: ultimas,
      }
    },
  })
}
