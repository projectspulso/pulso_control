'use client'

import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Clock3,
  Eye,
  TrendingUp,
  Users,
} from 'lucide-react'

import { ErrorState } from '@/components/ui/error-state'
import { useAnalyticsMvp } from '@/lib/hooks/use-analytics-mvp'

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    notation: 'compact',
    maximumFractionDigits: value < 1000 ? 0 : 1,
  }).format(value)
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`
}

function getWorkflowBadgeClasses(status: string) {
  if (status === 'sucesso') {
    return 'bg-green-500/15 text-green-300'
  }

  if (status === 'erro') {
    return 'bg-red-500/15 text-red-300'
  }

  return 'bg-yellow-500/15 text-yellow-300'
}

export default function AnalyticsPage() {
  const { data, isLoading, isError, refetch } = useAnalyticsMvp()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="space-y-3">
            <div className="skeleton h-10 w-56" />
            <div className="skeleton h-4 w-80" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="glass rounded-2xl border border-zinc-800/50 p-6"
              >
                <div className="skeleton h-5 w-24" />
                <div className="mt-4 skeleton h-8 w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-zinc-950 p-8">
        <div className="mx-auto max-w-7xl">
          <ErrorState
            title="Erro ao carregar analytics"
            message="Nao foi possivel montar o painel minimo de validacao. Tente novamente."
            onRetry={() => refetch()}
          />
        </div>
      </div>
    )
  }

  const maxViews = Math.max(...data.metricas7d.map((dia) => dia.views), 1)
  const hasRealMetrics =
    data.cards.totalViews > 0 ||
    data.cards.trackedPosts > 0 ||
    data.workflows.total > 0

  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="animate-fade-in">
          <div className="mb-2 flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse-glow" />
            <h1 className="bg-linear-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-4xl font-black text-transparent">
              Analytics de Validacao
            </h1>
          </div>
          <p className="text-zinc-400">
            Painel minimo para enxergar saude operacional, editorial e sinais de performance do MVP.
          </p>
        </div>

        {!hasRealMetrics && (
          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4 text-blue-100">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 text-blue-300" />
              <div>
                <h2 className="text-sm font-semibold">Leitura honesta do momento</h2>
                <p className="mt-1 text-sm text-blue-100/85">
                  O painel ja esta ligado. Se as metricas externas ainda nao chegaram, ele continua mostrando a saude do processo e zera apenas os sinais que ainda nao existem.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="glass group relative overflow-hidden rounded-2xl border border-zinc-800/50 p-6">
            <div className="absolute inset-0 bg-blue-600/10 opacity-0 blur-xl transition-all duration-300 group-hover:opacity-100" />
            <div className="relative z-10 mb-2 flex items-center gap-3">
              <Eye className="h-5 w-5 text-blue-400" />
              <span className="text-sm text-zinc-400">Views (7 dias)</span>
            </div>
            <p className="relative z-10 text-3xl font-bold text-white tabular-nums">
              {formatCompactNumber(data.cards.totalViews)}
            </p>
          </div>

          <div className="glass group relative overflow-hidden rounded-2xl border border-zinc-800/50 p-6">
            <div className="absolute inset-0 bg-green-600/10 opacity-0 blur-xl transition-all duration-300 group-hover:opacity-100" />
            <div className="relative z-10 mb-2 flex items-center gap-3">
              <Users className="h-5 w-5 text-green-400" />
              <span className="text-sm text-zinc-400">Engajamento</span>
            </div>
            <p className="relative z-10 text-3xl font-bold text-white tabular-nums">
              {formatPercent(data.cards.engagementRate)}
            </p>
          </div>

          <div className="glass group relative overflow-hidden rounded-2xl border border-zinc-800/50 p-6">
            <div className="absolute inset-0 bg-purple-600/10 opacity-0 blur-xl transition-all duration-300 group-hover:opacity-100" />
            <div className="relative z-10 mb-2 flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-purple-400" />
              <span className="text-sm text-zinc-400">Posts medidos</span>
            </div>
            <p className="relative z-10 text-3xl font-bold text-white tabular-nums">
              {data.cards.trackedPosts}
            </p>
          </div>

          <div className="glass group relative overflow-hidden rounded-2xl border border-zinc-800/50 p-6">
            <div className="absolute inset-0 bg-yellow-600/10 opacity-0 blur-xl transition-all duration-300 group-hover:opacity-100" />
            <div className="relative z-10 mb-2 flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-yellow-400" />
              <span className="text-sm text-zinc-400">Sucesso de workflow</span>
            </div>
            <p className="relative z-10 text-3xl font-bold text-white tabular-nums">
              {formatPercent(data.cards.workflowSuccessRate)}
            </p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
            <div className="mb-6 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">Views e interacoes</h2>
                <p className="text-sm text-zinc-500">
                  Soma diaria dos ultimos 7 dias a partir de `metricas_diarias`.
                </p>
              </div>
              <Clock3 className="h-5 w-5 text-zinc-500" />
            </div>

            <div className="flex h-56 items-end gap-3">
              {data.metricas7d.map((dia) => {
                const heightPercent = Math.max((dia.views / maxViews) * 100, dia.views > 0 ? 12 : 4)

                return (
                  <div key={dia.label} className="flex flex-1 flex-col items-center gap-3">
                    <div className="text-xs text-zinc-500">{formatCompactNumber(dia.views)}</div>
                    <div className="flex h-40 w-full items-end rounded-xl bg-zinc-800/70 p-2">
                      <div
                        className="w-full rounded-lg bg-linear-to-t from-cyan-500 to-blue-400"
                        style={{ height: `${heightPercent}%` }}
                        title={`${dia.label}: ${dia.views} views`}
                      />
                    </div>
                    <div className="text-xs text-zinc-400">{dia.label}</div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
              <div className="mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-400" />
                <h2 className="text-lg font-semibold text-white">Editorial</h2>
              </div>
              <div className="space-y-4">
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-zinc-400">Ideias aprovadas</span>
                    <span className="text-sm font-semibold text-white">
                      {data.editorial.ideiasAprovadas}/{data.editorial.ideiasTotal}
                    </span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-zinc-800">
                    <div
                      className="h-2 rounded-full bg-green-500"
                      style={{ width: `${data.editorial.ideiasTaxaAprovacao}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-zinc-500">
                    Taxa: {formatPercent(data.editorial.ideiasTaxaAprovacao)}
                  </p>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-zinc-400">Roteiros aprovados</span>
                    <span className="text-sm font-semibold text-white">
                      {data.editorial.roteirosAprovados}/{data.editorial.roteirosTotal}
                    </span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-zinc-800">
                    <div
                      className="h-2 rounded-full bg-cyan-500"
                      style={{ width: `${data.editorial.roteirosTaxaAprovacao}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-zinc-500">
                    Taxa: {formatPercent(data.editorial.roteirosTaxaAprovacao)}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
              <div className="mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-violet-400" />
                <h2 className="text-lg font-semibold text-white">Pipeline</h2>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4">
                  <p className="text-xs uppercase tracking-wide text-zinc-500">Prontos</p>
                  <p className="mt-2 text-2xl font-bold text-white">
                    {data.pipeline.prontosPublicacao}
                  </p>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4">
                  <p className="text-xs uppercase tracking-wide text-zinc-500">Agendados</p>
                  <p className="mt-2 text-2xl font-bold text-white">
                    {data.pipeline.agendados}
                  </p>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4">
                  <p className="text-xs uppercase tracking-wide text-zinc-500">Publicados</p>
                  <p className="mt-2 text-2xl font-bold text-white">
                    {data.pipeline.publicados}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
          <div className="mb-4 flex items-center gap-2">
            <Clock3 className="h-5 w-5 text-amber-400" />
            <h2 className="text-lg font-semibold text-white">Workflows recentes</h2>
          </div>

          <div className="mb-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Total</p>
              <p className="mt-2 text-2xl font-bold text-white">{data.workflows.total}</p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Sucesso</p>
              <p className="mt-2 text-2xl font-bold text-green-300">
                {data.workflows.sucesso}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Erro</p>
              <p className="mt-2 text-2xl font-bold text-red-300">{data.workflows.erro}</p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Em andamento</p>
              <p className="mt-2 text-2xl font-bold text-yellow-300">
                {data.workflows.emAndamento}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {data.workflows.recentes.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-700 p-4 text-sm text-zinc-500">
                Nenhum log de workflow encontrado ainda.
              </div>
            ) : (
              data.workflows.recentes.map((workflow) => (
                <div
                  key={`${workflow.workflow_name}-${workflow.created_at}`}
                  className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-950/70 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-medium text-white">{workflow.workflow_name}</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {format(new Date(workflow.created_at), "dd/MM/yyyy 'as' HH:mm", {
                        locale: ptBR,
                      })}
                    </p>
                    {workflow.erro_mensagem && (
                      <p className="mt-2 text-xs text-red-300">{workflow.erro_mensagem}</p>
                    )}
                  </div>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getWorkflowBadgeClasses(
                      workflow.status,
                    )}`}
                  >
                    {workflow.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
