import { format, subDays } from 'date-fns'
import { useQuery } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase/client'
import { selectWorkflowLogs } from '@/lib/supabase/runtime-access'

interface MetricasRow {
  post_id: string
  data_ref: string
  views: number | null
  likes: number | null
  comentarios: number | null
  compartilhamentos: number | null
  watch_time_segundos: number | null
}

interface StatusRow {
  status: string | null
}

interface PipelineRow {
  pipeline_id: string
  pipeline_status: string | null
  data_publicacao_planejada: string | null
}

interface WorkflowLogRow {
  workflow_name: string
  status: string
  created_at: string
  erro_mensagem: string | null
}

interface DailyMetric {
  label: string
  views: number
  interactions: number
}

export interface AnalyticsMvpSnapshot {
  cards: {
    totalViews: number
    engagementRate: number
    trackedPosts: number
    workflowSuccessRate: number
  }
  editorial: {
    ideiasTotal: number
    ideiasAprovadas: number
    ideiasTaxaAprovacao: number
    roteirosTotal: number
    roteirosAprovados: number
    roteirosTaxaAprovacao: number
  }
  pipeline: {
    totalItens: number
    prontosPublicacao: number
    publicados: number
    agendados: number
  }
  workflows: {
    total: number
    sucesso: number
    erro: number
    emAndamento: number
    recentes: WorkflowLogRow[]
  }
  metricas7d: DailyMetric[]
}

async function selectOrEmpty<T>(
  label: string,
  promise: PromiseLike<{
    data: unknown[] | null
    error: { message: string } | null
  }>,
) {
  const { data, error } = await promise

  if (error) {
    console.warn(`Analytics MVP: fallback vazio para ${label}:`, error.message)
    return [] as T[]
  }

  return ((data ?? []) as unknown) as T[]
}

function toPositiveNumber(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function buildMetricas7d(metricasRows: MetricasRow[]) {
  const dias = Array.from({ length: 7 }, (_, index) => {
    const date = subDays(new Date(), 6 - index)

    return {
      key: format(date, 'yyyy-MM-dd'),
      label: format(date, 'dd/MM'),
      views: 0,
      interactions: 0,
    }
  })

  const diasMap = new Map(dias.map((dia) => [dia.key, dia]))

  metricasRows.forEach((row) => {
    const bucket = diasMap.get(row.data_ref)

    if (!bucket) {
      return
    }

    bucket.views += toPositiveNumber(row.views)
    bucket.interactions +=
      toPositiveNumber(row.likes) +
      toPositiveNumber(row.comentarios) +
      toPositiveNumber(row.compartilhamentos)
  })

  return dias.map((dia) => ({
    label: dia.label,
    views: dia.views,
    interactions: dia.interactions,
  }))
}

export function useAnalyticsMvp() {
  return useQuery({
    queryKey: ['analytics', 'mvp'],
    queryFn: async (): Promise<AnalyticsMvpSnapshot> => {
      const dataInicio = format(subDays(new Date(), 6), 'yyyy-MM-dd')

      const [
        metricasRows,
        ideiasRows,
        roteirosRows,
        pipelineRows,
        workflowRows,
      ] = await Promise.all([
        selectOrEmpty<MetricasRow>(
          'metricas_diarias',
          supabase
            .from('metricas_diarias')
            .select(
              'post_id, data_ref, views, likes, comentarios, compartilhamentos, watch_time_segundos',
            )
            .gte('data_ref', dataInicio)
            .order('data_ref', { ascending: true }),
        ),
        selectOrEmpty<StatusRow>('ideias', supabase.from('ideias').select('status')),
        selectOrEmpty<StatusRow>('roteiros', supabase.from('roteiros').select('status')),
        selectOrEmpty<PipelineRow>(
          'vw_pulso_calendario_publicacao_v2',
          supabase
            .from('vw_pulso_calendario_publicacao_v2')
            .select('pipeline_id, pipeline_status, data_publicacao_planejada'),
        ),
        selectWorkflowLogs<WorkflowLogRow>(
          'workflow_name, status, created_at, erro_mensagem',
          { limit: 8, ascending: false },
        ),
      ])

      const totalViews = metricasRows.reduce(
        (acc, row) => acc + toPositiveNumber(row.views),
        0,
      )
      const totalInteractions = metricasRows.reduce(
        (acc, row) =>
          acc +
          toPositiveNumber(row.likes) +
          toPositiveNumber(row.comentarios) +
          toPositiveNumber(row.compartilhamentos),
        0,
      )
      const trackedPosts = new Set(metricasRows.map((row) => row.post_id)).size
      const engagementRate =
        totalViews > 0 ? (totalInteractions / totalViews) * 100 : 0

      const ideiasAprovadas = ideiasRows.filter(
        (row) => row.status === 'APROVADA',
      ).length
      const roteirosAprovados = roteirosRows.filter(
        (row) => row.status === 'APROVADO',
      ).length

      const pipelineUnico = new Map<string, PipelineRow>()
      pipelineRows.forEach((row) => {
        pipelineUnico.set(row.pipeline_id, row)
      })
      const pipelineItems = Array.from(pipelineUnico.values())

      const workflowsTotal = workflowRows.length
      const workflowsSucesso = workflowRows.filter(
        (row) => row.status === 'sucesso',
      ).length
      const workflowSuccessRate =
        workflowsTotal > 0 ? (workflowsSucesso / workflowsTotal) * 100 : 0

      return {
        cards: {
          totalViews,
          engagementRate,
          trackedPosts,
          workflowSuccessRate,
        },
        editorial: {
          ideiasTotal: ideiasRows.length,
          ideiasAprovadas,
          ideiasTaxaAprovacao:
            ideiasRows.length > 0 ? (ideiasAprovadas / ideiasRows.length) * 100 : 0,
          roteirosTotal: roteirosRows.length,
          roteirosAprovados,
          roteirosTaxaAprovacao:
            roteirosRows.length > 0
              ? (roteirosAprovados / roteirosRows.length) * 100
              : 0,
        },
        pipeline: {
          totalItens: pipelineItems.length,
          prontosPublicacao: pipelineItems.filter(
            (row) => row.pipeline_status === 'PRONTO_PUBLICACAO',
          ).length,
          publicados: pipelineItems.filter(
            (row) => row.pipeline_status === 'PUBLICADO',
          ).length,
          agendados: pipelineItems.filter(
            (row) => Boolean(row.data_publicacao_planejada),
          ).length,
        },
        workflows: {
          total: workflowsTotal,
          sucesso: workflowsSucesso,
          erro: workflowRows.filter((row) => row.status === 'erro').length,
          emAndamento: workflowRows.filter(
            (row) => row.status === 'em_andamento',
          ).length,
          recentes: workflowRows,
        },
        metricas7d: buildMetricas7d(metricasRows),
      }
    },
    staleTime: 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  })
}
