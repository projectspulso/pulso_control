'use client'

import { useQuery } from '@tanstack/react-query'
import { getSupabaseBrowser } from '@/lib/supabase/browser'

/**
 * Horas de exibição acumuladas dos vídeos longos — a métrica-norte do formato.
 * Views não fecham gate nenhum aqui: o YPP pede 3.000h/365d. Devolve null enquanto
 * nenhum episódio publicado tem métrica — o card correspondente nem renderiza
 * (dashboard de dado zero é ruído).
 */
export const META_HORAS_YPP = 3000

export function useHorasLongos() {
  const supabase = getSupabaseBrowser()
  return useQuery({
    queryKey: ['horas-longos'],
    refetchInterval: 10 * 60 * 1000,
    queryFn: async () => {
      const { data: longos } = await supabase
        .schema('pulso_content').from('ideias').select('id, titulo').eq('formato', 'longo')
      if (!longos || longos.length === 0) return null
      const ids = longos.map((i) => i.id)
      const { data: mets } = await supabase
        .schema('pulso_content').from('metricas_publicacao')
        .select('ideia_id, views, view_time_ms, taxa_retencao')
        .eq('plataforma', 'youtube')
        .in('ideia_id', ids)
      if (!mets || mets.length === 0) return null
      const titulo = new Map(longos.map((i) => [i.id, i.titulo]))
      const eps = mets.map((m) => ({
        titulo: titulo.get(m.ideia_id) || '?',
        views: m.views ?? 0,
        horas: m.view_time_ms ? m.view_time_ms / 3_600_000 : null,
        retencao: m.taxa_retencao ?? null,
      }))
      const horasTotal = eps.reduce((s, e) => s + (e.horas ?? 0), 0)
      const comHoras = eps.some((e) => e.horas !== null)
      return { eps, horasTotal, comHoras }
    },
  })
}
