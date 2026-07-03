'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

/**
 * DESAFIO DOS 100 DIAS — a disciplina que constrói audiência e autoridade.
 * Publicar todos os dias por 100 dias e medir o que aprendemos e onde chegamos.
 *
 * Fonte da verdade: metricas_publicacao (1 vídeo conta 1 dia, independente de quantas redes).
 * Config editável em pulso_core.configuracoes chave='desafio_100' (início / meta / alvo por dia).
 */

export interface Desafio100 {
  inicio: string // ISO da largada (dia 1)
  metaDias: number // 100
  alvoDia: number // publicações/dia da grade
  diaAtual: number // dia X de 100 (1-based, cap na meta)
  diasRestantes: number
  progresso: number // 0..1 (dia/meta)
  diasCorridos: number // dias desde a largada até hoje
  diasComPublicacao: number // dias distintos com ≥1 vídeo
  consistencia: number // 0..1 (diasComPub / diasCorridos)
  sequenciaAtual: number // streak de dias consecutivos até hoje
  melhorSequencia: number
  publicouHoje: boolean
  videosPublicados: number // vídeos únicos no período
  viewsAcumuladas: number
  projecaoVideos: number // no ritmo atual, quantos vídeos até o dia 100
  projecaoViews: number
  serie: { data: string; videos: number; publicou: boolean }[] // por dia corrido (heatmap/trilha)
}

function isoLocal(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function addDias(iso: string, n: number) {
  const d = new Date(iso + 'T12:00:00')
  d.setDate(d.getDate() + n)
  return isoLocal(d)
}
function diffDias(a: string, b: string) {
  const da = new Date(a + 'T12:00:00').getTime()
  const db = new Date(b + 'T12:00:00').getTime()
  return Math.round((db - da) / 86_400_000)
}

const DEFAULT = { inicio: '2026-06-10', meta_dias: 100, publicacoes_dia_alvo: 3 }

export function useDesafio100() {
  return useQuery<Desafio100>({
    queryKey: ['desafio-100'],
    refetchInterval: 5 * 60 * 1000,
    queryFn: async () => {
      const [cfgRes, mpRes] = await Promise.all([
        supabase.schema('pulso_core').from('configuracoes').select('valor').eq('chave', 'desafio_100').maybeSingle(),
        supabase.schema('pulso_content').from('metricas_publicacao').select('ideia_id, plataforma, views, data_publicacao'),
      ])

      let cfg = DEFAULT
      try {
        const raw = cfgRes.data?.valor
        if (raw) cfg = { ...DEFAULT, ...(typeof raw === 'string' ? JSON.parse(raw) : raw) }
      } catch {
        /* usa default */
      }

      const inicio = cfg.inicio
      const metaDias = cfg.meta_dias ?? 100
      const alvoDia = cfg.publicacoes_dia_alvo ?? 3
      const hoje = isoLocal(new Date())

      // vídeos únicos por dia (dentro da janela do desafio)
      const videosPorDia = new Map<string, Set<string>>()
      let viewsAcumuladas = 0
      const videosUnicos = new Set<string>()
      for (const m of mpRes.data || []) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mm = m as any
        const d = (mm.data_publicacao || '').slice(0, 10)
        if (!d || d < inicio || d > hoje) continue
        if (!videosPorDia.has(d)) videosPorDia.set(d, new Set())
        if (mm.ideia_id) {
          videosPorDia.get(d)!.add(mm.ideia_id)
          videosUnicos.add(mm.ideia_id)
        }
        viewsAcumuladas += Number(mm.views || 0)
      }

      const diasCorridos = Math.max(1, diffDias(inicio, hoje) + 1)
      const diaAtual = Math.min(diasCorridos, metaDias)
      const diasRestantes = Math.max(0, metaDias - diaAtual)

      // trilha dia-a-dia (só até hoje)
      const serie: { data: string; videos: number; publicou: boolean }[] = []
      for (let i = 0; i < diasCorridos; i++) {
        const d = addDias(inicio, i)
        const n = videosPorDia.get(d)?.size ?? 0
        serie.push({ data: d, videos: n, publicou: n > 0 })
      }

      const diasComPublicacao = serie.filter((s) => s.publicou).length
      const consistencia = diasCorridos ? diasComPublicacao / diasCorridos : 0

      // sequência atual (a partir de hoje pra trás)
      let sequenciaAtual = 0
      for (let i = serie.length - 1; i >= 0; i--) {
        if (serie[i].publicou) sequenciaAtual++
        else break
      }
      // melhor sequência
      let melhorSequencia = 0
      let run = 0
      for (const s of serie) {
        if (s.publicou) {
          run++
          if (run > melhorSequencia) melhorSequencia = run
        } else run = 0
      }

      const publicouHoje = videosPorDia.get(hoje) ? videosPorDia.get(hoje)!.size > 0 : false
      const videosPublicados = videosUnicos.size
      const ritmoVideos = videosPublicados / diaAtual
      const ritmoViews = viewsAcumuladas / diaAtual

      return {
        inicio,
        metaDias,
        alvoDia,
        diaAtual,
        diasRestantes,
        progresso: diaAtual / metaDias,
        diasCorridos,
        diasComPublicacao,
        consistencia,
        sequenciaAtual,
        melhorSequencia,
        publicouHoje,
        videosPublicados,
        viewsAcumuladas,
        projecaoVideos: Math.round(ritmoVideos * metaDias),
        projecaoViews: Math.round(ritmoViews * metaDias),
        serie,
      }
    },
  })
}
