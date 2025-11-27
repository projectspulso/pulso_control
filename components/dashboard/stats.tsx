'use client'

import { useIdeiasStats } from '@/lib/hooks/use-ideias'
import { useRoteirosStats } from '@/lib/hooks/use-roteiros'
import { useMetricasTotais } from '@/lib/hooks/use-metricas'
import { useWorkflowStats } from '@/lib/hooks/use-workflows'
import { formatNumber } from '@/lib/utils'
import { TrendingUp, FileText, Zap, Eye, ThumbsUp, CheckCircle2, Sparkles } from 'lucide-react'

export function DashboardStats() {
  const { data: ideiasStats, isLoading: loadingIdeias } = useIdeiasStats()
  const { data: roteirosStats, isLoading: loadingRoteiros } = useRoteirosStats()
  const { data: metricasTotais, isLoading: loadingMetricas } = useMetricasTotais()
  const { data: workflowStats, isLoading: loadingWorkflows } = useWorkflowStats()

  if (loadingIdeias || loadingRoteiros || loadingMetricas || loadingWorkflows) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass rounded-2xl p-6 space-y-3 animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
            <div className="skeleton h-4 w-24 rounded" />
            <div className="skeleton h-10 w-20 rounded" />
            <div className="skeleton h-3 w-32 rounded" />
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
      gradient: 'from-blue-500 to-cyan-500',
      bgGlow: 'bg-blue-500/20',
      iconBg: 'bg-blue-500/10',
      iconBorder: 'border-blue-500/20'
    },
    {
      label: 'Roteiros Criados',
      value: roteirosStats?.total || 0,
      detail: `${roteirosStats?.por_status?.APROVADO || 0} aprovados`,
      icon: CheckCircle2,
      gradient: 'from-purple-500 to-pink-500',
      bgGlow: 'bg-purple-500/20',
      iconBg: 'bg-purple-500/10',
      iconBorder: 'border-purple-500/20'
    },
    {
      label: 'Views Totais',
      value: formatNumber(metricasTotais?.views || 0),
      detail: `${formatNumber(metricasTotais?.likes || 0)} likes`,
      icon: Eye,
      gradient: 'from-green-500 to-emerald-500',
      bgGlow: 'bg-green-500/20',
      iconBg: 'bg-green-500/10',
      iconBorder: 'border-green-500/20'
    },
    {
      label: 'Workflows AI',
      value: workflowStats?.total || 0,
      detail: `${workflowStats?.sucesso || 0} sucesso`,
      icon: Sparkles,
      gradient: 'from-yellow-500 to-orange-500',
      bgGlow: 'bg-yellow-500/20',
      iconBg: 'bg-yellow-500/10',
      iconBorder: 'border-yellow-500/20'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <div 
            key={stat.label}
            className="group glass glass-hover rounded-2xl p-6 relative overflow-hidden cursor-pointer animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Glow effect on hover */}
            <div className={`absolute -right-8 -top-8 h-32 w-32 rounded-full ${stat.bgGlow} blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-500`} />
            
            <div className="relative z-10 space-y-4">
              <div className="flex items-start justify-between">
                <div className={`p-3 rounded-xl ${stat.iconBg} border ${stat.iconBorder} group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className={`h-6 w-6 bg-gradient-to-br ${stat.gradient} bg-clip-text text-transparent`} style={{ WebkitTextFillColor: 'transparent', backgroundClip: 'text' }} />
                </div>
                <TrendingUp className="h-4 w-4 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              
              <div>
                <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-2">
                  {stat.label}
                </p>
                <h3 className={`text-4xl font-black bg-gradient-to-br ${stat.gradient} bg-clip-text text-transparent tabular-nums mb-2`}>
                  {stat.value}
                </h3>
                <p className="text-xs text-zinc-600 font-medium flex items-center gap-1">
                  <div className="h-1 w-1 rounded-full bg-zinc-600" />
                  {stat.detail}
                </p>
              </div>
            </div>

            {/* Bottom gradient line */}
            <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
          </div>
        )
      })}
    </div>
  )
}
