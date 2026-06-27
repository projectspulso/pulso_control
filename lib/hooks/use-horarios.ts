import { useQuery } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase/client'

/**
 * HORÁRIOS — onde os views nascem por HORA DE PUBLICAÇÃO (real, horário de Brasília).
 * Lê metricas_publicacao.hora_publicacao (carimbada na publicação / backfill das APIs).
 * Serve pra virar "acertador": qual hora rende mais → travar na agenda.
 * Honesto: só conta linhas COM hora real; mostra a cobertura.
 */

export interface HoraStat {
  hora: number // 0-23
  posts: number
  views: number
  media: number
}

export function useHorarios() {
  return useQuery<{ porHora: HoraStat[]; comHora: number; total: number; melhores: HoraStat[] }>({
    queryKey: ['horarios-publicacao'],
    refetchInterval: 10 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .schema('pulso_content')
        .from('metricas_publicacao')
        .select('hora_publicacao, views')
      if (error) throw error
      const rows = data || []
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
