import { useQuery } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase/client'

export interface BiFiltros {
  plataforma: string // 'todas' | youtube | instagram | facebook | tiktok
  canalId: string // 'todos' | uuid
  periodoDias: number // 0 = desde o início
}

export interface BiPublicacao {
  id: string
  ideia_id: string | null
  ideiaTitulo: string
  canalId: string
  canalNome: string
  plataforma: string
  url: string | null
  dataPublicacao: string
  views: number
  likes: number
  comentarios: number
  shares: number
  saves: number
}

export interface BiSerieDia {
  data: string
  views: number
  likes: number
}

export interface BiSnapshot {
  publicacoes: BiPublicacao[]
  serieDiaria: BiSerieDia[]
  canais: { id: string; nome: string }[]
  videosProduzidos: number
}

export function useBi(filtros: BiFiltros) {
  return useQuery<BiSnapshot>({
    queryKey: ['bi', filtros],
    refetchInterval: 5 * 60 * 1000,
    queryFn: async () => {
      const [metricasQ, ideiasQ, canaisQ, diariasQ] = await Promise.all([
        supabase.schema('pulso_content').from('metricas_publicacao').select('*'),
        supabase.schema('pulso_content').from('ideias').select('id, titulo, canal_id'),
        supabase.schema('pulso_core').from('canais').select('id, nome').order('nome'),
        supabase
          .schema('pulso_analytics')
          .from('metricas_diarias')
          .select('data_ref, views, likes, metadata')
          // 16/06 = primeiro dia com foto completa das 65 publicações (todos os vídeos × redes).
          // Antes disso só ~20 tinham espelho em posts → série parcial gerava salto falso. Corta o bruto/dia aqui.
          .gte('data_ref', '2026-06-16'),
      ])
      if (metricasQ.error) throw metricasQ.error
      if (ideiasQ.error) throw ideiasQ.error
      if (canaisQ.error) throw canaisQ.error
      if (diariasQ.error) throw diariasQ.error

      const ideias = new Map((ideiasQ.data || []).map((i) => [i.id, i]))
      const canais = new Map((canaisQ.data || []).map((c) => [c.id, c.nome]))
      const limite = filtros.periodoDias > 0 ? Date.now() - filtros.periodoDias * 864e5 : 0

      const publicacoes: BiPublicacao[] = []
      for (const m of metricasQ.data || []) {
        const ideia = m.ideia_id ? ideias.get(m.ideia_id) : null
        if (!ideia) continue
        if (filtros.plataforma !== 'todas' && m.plataforma !== filtros.plataforma) continue
        if (filtros.canalId !== 'todos' && ideia.canal_id !== filtros.canalId) continue
        if (limite && new Date(m.data_publicacao).getTime() < limite) continue
        publicacoes.push({
          id: m.id,
          ideia_id: m.ideia_id,
          ideiaTitulo: ideia.titulo,
          canalId: ideia.canal_id,
          canalNome: canais.get(ideia.canal_id) || '—',
          plataforma: m.plataforma,
          url: m.url_publicacao,
          dataPublicacao: m.data_publicacao,
          views: m.views || 0,
          likes: m.likes || 0,
          comentarios: m.comentarios || 0,
          shares: m.shares || 0,
          saves: m.saves || 0,
        })
      }

      // série diária respeitando filtros (metadata tem plataforma + ideia_id)
      const porDia = new Map<string, BiSerieDia>()
      for (const d of diariasQ.data || []) {
        const meta = (d.metadata || {}) as { plataforma?: string; ideia_id?: string }
        if (filtros.plataforma !== 'todas' && meta.plataforma !== filtros.plataforma) continue
        if (filtros.canalId !== 'todos') {
          const ideia = meta.ideia_id ? ideias.get(meta.ideia_id) : null
          if (!ideia || ideia.canal_id !== filtros.canalId) continue
        }
        const acc = porDia.get(d.data_ref) || { data: d.data_ref, views: 0, likes: 0 }
        acc.views += d.views || 0
        acc.likes += d.likes || 0
        porDia.set(d.data_ref, acc)
      }
      const serieDiaria = [...porDia.values()].sort((a, b) => a.data.localeCompare(b.data)).slice(-14)

      const videosProduzidos = new Set(publicacoes.map((p) => p.ideia_id)).size

      return {
        publicacoes: publicacoes.sort((a, b) => b.views - a.views),
        serieDiaria,
        canais: canaisQ.data || [],
        videosProduzidos,
      }
    },
  })
}
