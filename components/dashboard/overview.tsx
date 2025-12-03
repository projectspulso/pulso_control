'use client'

import { useIdeiasStats } from '@/lib/hooks/use-ideias'
import { useRoteirosStats } from '@/lib/hooks/use-roteiros'
import { useAudiosStats } from '@/lib/hooks/use-audios'
import { useMetricasTotais } from '@/lib/hooks/use-metricas'
import { useWorkflowStats } from '@/lib/hooks/use-workflows'
import { formatNumber } from '@/lib/utils'
import { 
  FileText, 
  Mic, 
  Eye, 
  Sparkles, 
  CheckCircle2, 
  Clock,
  TrendingUp,
  AlertCircle,
  Play,
  Pause
} from 'lucide-react'

export function DashboardOverview() {
  const { data: ideiasStats, isLoading: loadingIdeias } = useIdeiasStats()
  const { data: roteirosStats, isLoading: loadingRoteiros } = useRoteirosStats()
  const { data: audiosStats, isLoading: loadingAudios } = useAudiosStats()
  const { data: metricasTotais, isLoading: loadingMetricas } = useMetricasTotais()
  const { data: workflowStats, isLoading: loadingWorkflows } = useWorkflowStats()

  const isLoading = loadingIdeias || loadingRoteiros || loadingAudios || loadingMetricas || loadingWorkflows

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(9)].map((_, i) => (
          <div key={i} className="glass rounded-2xl p-6 space-y-3 animate-pulse">
            <div className="h-4 bg-zinc-800 rounded w-24" />
            <div className="h-10 bg-zinc-800 rounded w-20" />
            <div className="h-3 bg-zinc-800 rounded w-32" />
          </div>
        ))}
      </div>
    )
  }

  const sections = [
    {
      title: 'Conteúdo',
      stats: [
        {
          label: 'Total de Ideias',
          value: ideiasStats?.total || 0,
          detail: `${ideiasStats?.por_status?.APROVADA || 0} aprovadas, ${ideiasStats?.por_status?.RASCUNHO || 0} rascunhos`,
          icon: FileText,
          gradient: 'from-blue-500 to-cyan-500',
          bgGlow: 'bg-blue-500/20',
          iconBg: 'bg-blue-500/10',
          iconBorder: 'border-blue-500/20'
        },
        {
          label: 'Roteiros',
          value: roteirosStats?.total || 0,
          detail: `${roteirosStats?.por_status?.APROVADO || 0} aprovados, ${roteirosStats?.por_status?.EM_REVISAO || 0} em revisão`,
          icon: CheckCircle2,
          gradient: 'from-purple-500 to-pink-500',
          bgGlow: 'bg-purple-500/20',
          iconBg: 'bg-purple-500/10',
          iconBorder: 'border-purple-500/20'
        },
        {
          label: 'Áudios Gerados',
          value: audiosStats?.total || 0,
          detail: `${Math.floor((audiosStats?.duracao_total_segundos || 0) / 60)} min total`,
          icon: Mic,
          gradient: 'from-green-500 to-emerald-500',
          bgGlow: 'bg-green-500/20',
          iconBg: 'bg-green-500/10',
          iconBorder: 'border-green-500/20'
        }
      ]
    },
    {
      title: 'Performance',
      stats: [
        {
          label: 'Views Totais',
          value: formatNumber(metricasTotais?.views || 0),
          detail: `${formatNumber(metricasTotais?.likes || 0)} likes`,
          icon: Eye,
          gradient: 'from-yellow-500 to-orange-500',
          bgGlow: 'bg-yellow-500/20',
          iconBg: 'bg-yellow-500/10',
          iconBorder: 'border-yellow-500/20'
        },
        {
          label: 'Comentários',
          value: formatNumber(metricasTotais?.comentarios || 0),
          detail: `${formatNumber(metricasTotais?.compartilhamentos || 0)} compartilhamentos`,
          icon: TrendingUp,
          gradient: 'from-pink-500 to-rose-500',
          bgGlow: 'bg-pink-500/20',
          iconBg: 'bg-pink-500/10',
          iconBorder: 'border-pink-500/20'
        }
      ]
    },
    {
      title: 'Automação',
      stats: [
        {
          label: 'Workflows',
          value: workflowStats?.total || 0,
          detail: `${workflowStats?.sucesso || 0} sucesso, ${workflowStats?.erro || 0} erro`,
          icon: Sparkles,
          gradient: 'from-violet-500 to-purple-500',
          bgGlow: 'bg-violet-500/20',
          iconBg: 'bg-violet-500/10',
          iconBorder: 'border-violet-500/20'
        },
        {
          label: 'Em Execução',
          value: workflowStats?.executando || 0,
          detail: 'Workflows ativos agora',
          icon: Play,
          gradient: 'from-cyan-500 to-blue-500',
          bgGlow: 'bg-cyan-500/20',
          iconBg: 'bg-cyan-500/10',
          iconBorder: 'border-cyan-500/20',
          pulse: (workflowStats?.executando || 0) > 0
        }
      ]
    },
    {
      title: 'Status de Áudio',
      stats: [
        {
          label: 'Áudios OK',
          value: audiosStats?.por_status?.OK || 0,
          detail: `${audiosStats?.por_status?.AGUARDANDO_MERGE || 0} aguardando merge`,
          icon: CheckCircle2,
          gradient: 'from-green-500 to-teal-500',
          bgGlow: 'bg-green-500/20',
          iconBg: 'bg-green-500/10',
          iconBorder: 'border-green-500/20'
        },
        {
          label: 'TTS vs Voice Clone',
          value: `${audiosStats?.por_tipo?.AUDIO_TTS || 0} / ${audiosStats?.por_tipo?.AUDIO_VOICE_CLONE || 0}`,
          detail: 'TTS / Voice Clone',
          icon: Mic,
          gradient: 'from-indigo-500 to-purple-500',
          bgGlow: 'bg-indigo-500/20',
          iconBg: 'bg-indigo-500/10',
          iconBorder: 'border-indigo-500/20'
        }
      ]
    }
  ]

  return (
    <div className="space-y-8">
      {sections.map((section, sectionIndex) => (
        <div key={section.title} className="space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <div className="h-1 w-1 rounded-full bg-violet-500" />
            {section.title}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {section.stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <div
                  key={stat.label}
                  className="group glass glass-hover rounded-2xl p-6 relative overflow-hidden cursor-pointer animate-fade-in"
                  style={{ animationDelay: `${(sectionIndex * 100) + (index * 50)}ms` }}
                >
                  <div className={`absolute -right-8 -top-8 h-32 w-32 rounded-full ${stat.bgGlow} blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-500`} />
                  
                  <div className="relative z-10 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className={`p-3 rounded-xl ${stat.iconBg} border ${stat.iconBorder} group-hover:scale-110 transition-transform duration-300 ${(stat as any).pulse ? 'animate-pulse' : ''}`}>
                        <Icon className={`h-6 w-6 text-white`} />
                      </div>
                      {(stat as any).pulse && (
                        <div className="flex items-center gap-1 text-green-500 text-xs font-medium">
                          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                          Ativo
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-2">
                        {stat.label}
                      </p>
                      <h3 className={`text-4xl font-black bg-linear-to-br ${stat.gradient} bg-clip-text text-transparent tabular-nums mb-2`}>
                        {stat.value}
                      </h3>
                      <p className="text-xs text-zinc-600 font-medium flex items-center gap-1">
                        <div className="h-1 w-1 rounded-full bg-zinc-600" />
                        {stat.detail}
                      </p>
                    </div>
                  </div>

                  <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-linear-to-r ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
