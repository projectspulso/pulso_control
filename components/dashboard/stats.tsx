'use client'

import { useIdeiasStats } from '@/lib/hooks/use-ideias'
import { useRoteirosStats } from '@/lib/hooks/use-roteiros'
import { useMetricasTotais } from '@/lib/hooks/use-metricas'
import { useWorkflowStats } from '@/lib/hooks/use-workflows'
import { formatNumber } from '@/lib/utils'
import { TrendingUp, FileText, Zap } from 'lucide-react'

export function DashboardStats() {
  const { data: ideiasStats, isLoading: loadingIdeias } = useIdeiasStats()
  const { data: roteirosStats, isLoading: loadingRoteiros } = useRoteirosStats()
  const { data: metricasTotais, isLoading: loadingMetricas } = useMetricasTotais()
  const { data: workflowStats, isLoading: loadingWorkflows } = useWorkflowStats()

  if (loadingIdeias || loadingRoteiros || loadingMetricas || loadingWorkflows) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 animate-pulse">
            <div className="h-4 bg-zinc-800 rounded w-24 mb-2"></div>
            <div className="h-8 bg-zinc-800 rounded w-16 mb-2"></div>
            <div className="h-3 bg-zinc-800 rounded w-20"></div>
          </div>
        ))}
      </div>
    )
  }

  const stats = [
    {
      label: 'Total de Ideias',
      value: ideiasStats?.total || 0,
      detail: `${ideiasStats?.por_status?.APROVADA || 0} aprovadas`,
      icon: FileText,
      color: 'text-blue-500'
    },
    {
      label: 'Roteiros Criados',
      value: roteirosStats?.total || 0,
      detail: `${roteirosStats?.por_status?.APROVADO || 0} aprovados`,
      icon: FileText,
      color: 'text-purple-500'
    },
    {
      label: 'Views Totais',
      value: formatNumber(metricasTotais?.views || 0),
      detail: `${formatNumber(metricasTotais?.likes || 0)} likes`,
      icon: TrendingUp,
      color: 'text-green-500'
    },
    {
      label: 'Workflows Executados',
      value: workflowStats?.total || 0,
      detail: `${workflowStats?.sucesso || 0} sucesso`,
      icon: Zap,
      color: 'text-yellow-500'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <div 
            key={stat.label}
            className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-purple-500/50 transition-all"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-zinc-400 mb-1">{stat.label}</p>
                <h3 className="text-3xl font-bold text-white">{stat.value}</h3>
                <p className="text-xs text-zinc-500 mt-2">{stat.detail}</p>
              </div>
              <Icon className={`w-8 h-8 ${stat.color}`} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
