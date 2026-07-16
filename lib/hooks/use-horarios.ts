import { useQuery } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase/client'
import type { BiFiltros } from '@/lib/hooks/use-bi'

/**
 * HORÁRIOS — onde os views nascem por HORA DE PUBLICAÇÃO (real, horário de Brasília).
 * Lê metricas_publicacao.hora_publicacao (carimbada na publicação / backfill das APIs).
 * Serve pra virar "acertador": qual hora rende mais → travar na agenda.
 * Honesto: só conta linhas COM hora real; mostra a cobertura.
 *
 * Respeita os filtros do /analytics: a melhor hora MUDA por rede e por vertical — mostrar a
 * média global com o filtro em "YouTube" seria responder outra pergunta sem avisar.
 */

export interface HoraStat {
  hora: number // 0-23
  posts: number
  views: number
  media: number
}

export function useHorarios(filtros?: BiFiltros) {
  const f = filtros ?? { plataforma: 'todas', canalId: 'todos', periodoDias: 0 }
  return useQuery<{ porHora: HoraStat[]; comHora: number; total: number; melhores: HoraStat[] }>({
    queryKey: ['horarios-publicacao', f.plataforma, f.canalId, f.periodoDias],
    refetchInterval: 10 * 60 * 1000,
    queryFn: async () => {
      let q = supabase
        .schema('pulso_content')
        .from('metricas_publicacao')
        .select('hora_publicacao, views, plataforma, ideia_id, data_publicacao')
      if (f.plataforma !== 'todas') q = q.eq('plataforma', f.plataforma)
      if (f.periodoDias > 0) q = q.gte('data_publicacao', new Date(Date.now() - f.periodoDias * 864e5).toISOString())
      const { data, error } = await q
      if (error) throw error
      let rows = data || []

      // canal não está em metricas_publicacao — vem pela ideia
      if (f.canalId !== 'todos') {
        const { data: ideias } = await supabase
          .schema('pulso_content').from('ideias').select('id').eq('canal_id', f.canalId)
        const doCanal = new Set((ideias || []).map((i) => i.id))
        rows = rows.filter((r) => r.ideia_id && doCanal.has(r.ideia_id))
      }
      const acc = new Map<number, { posts: number; views: number }>()
      let comHora = 0
      for (const r of rows) {
        if (!r.hora_publicacao) continue
        comHora++
        const h = parseInt(String(r.hora_publicacao).slice(0, 2), 10)
        if (Number.isNaN(h)) continue
        const v = acc.get(h) || { posts: 0, views: 0 }
        v.posts++; v.views += r.views || 0
        acc.set(h, v)
      }
      const porHora: HoraStat[] = [...acc.entries()]
        .map(([hora, v]) => ({ hora, posts: v.posts, views: v.views, media: Math.round(v.views / Math.max(1, v.posts)) }))
        .sort((a, b) => a.hora - b.hora)
      // melhores horas com amostra mínima (≥2 posts) pra não confiar em outlier
      const melhores = [...porHora].filter((h) => h.posts >= 2).sort((a, b) => b.media - a.media).slice(0, 3)
      return { porHora, comHora, total: rows.length, melhores }
    },
  })
}
