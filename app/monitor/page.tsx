'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { Zap, CheckCircle2, XCircle, Clock, Activity, TrendingUp } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import { useGerarIdeias } from '@/lib/hooks/use-n8n'
import PipelineMonitor from '@/components/pipeline-monitor'
import { WorkflowQueueMonitor } from '@/components/workflow-queue-monitor'

interface WorkflowLog {
  id: string
  workflow_name: string
  status: string
  detalhes: any
  created_at: string
}

async function getWorkflowLogs(): Promise<WorkflowLog[]> {
  const { data, error } = await supabase
    .from('logs_workflows')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw error
  return data
}

export default function MonitorPage() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['workflow-logs'],
    queryFn: getWorkflowLogs,
    refetchInterval: 5000 // Atualiza a cada 5s
  })

  const gerarIdeias = useGerarIdeias()

  // Stats por workflow
  const stats = logs?.reduce((acc, log) => {
    const wf = log.workflow_name
    if (!acc[wf]) {
      acc[wf] = { total: 0, sucesso: 0, erro: 0 }
    }
    acc[wf].total++
    if (log.status === 'sucesso') acc[wf].sucesso++
    if (log.status === 'erro') acc[wf].erro++
    return acc
  }, {} as Record<string, { total: number; sucesso: number; erro: number }>) || {}

  const workflows = [
    {
      id: 'WF00',
      name: 'WF00 - Gerar Ideias',
      description: 'CRON diário às 3h - Gera 5 ideias por canal',
      trigger: 'CRON',
      active: true,
      color: 'yellow'
    },
    {
      id: 'WF01',
      name: 'WF01 - Gerar Roteiro',
      description: 'Webhook - Disparado ao aprovar ideia',
      trigger: 'Webhook',
      active: true,
      color: 'purple'
    },
    {
      id: 'WF02',
      name: 'WF02 - Gerar Áudio',
      description: 'Webhook - Disparado ao aprovar roteiro',
      trigger: 'Webhook',
      active: true,
      color: 'blue'
    },
    {
      id: 'WF03',
      name: 'WF03 - Preparar Vídeo',
      description: 'CRON a cada 30min - Cria metadata de vídeo',
      trigger: 'CRON',
      active: true,
      color: 'green'
    },
    {
      id: 'WF04',
      name: 'WF04 - Publicar',
      description: 'CRON 3x/dia (6h, 12h, 18h) - Cria variantes',
      trigger: 'CRON',
      active: true,
      color: 'orange'
    }
  ]

  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black bg-linear-to-r from-purple-400 via-violet-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-3">
              <Zap className="h-10 w-10 text-purple-500" />
              Monitor de Workflows
            </h1>
            <p className="text-zinc-400 mt-2">
              Acompanhe em tempo real a execução dos workflows n8n
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-zinc-500">
              Atualização automática
            </span>
          </div>
        </div>

        {/* Pipeline Monitor */}
        <PipelineMonitor />

        {/* Workflows Status */}
        <div className="glass rounded-xl border border-zinc-800">
          <div className="p-6 border-b border-zinc-800">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-500" />
              Workflows Ativos
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            {workflows.map((wf) => {
              const wfStats = stats[wf.name] || { total: 0, sucesso: 0, erro: 0 }
              const successRate = wfStats.total > 0 
                ? ((wfStats.sucesso / wfStats.total) * 100).toFixed(0) 
                : 0

              return (
                <div
                  key={wf.id}
                  className="glass border border-zinc-800 rounded-lg p-4 hover:border-purple-500/30 transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Zap className={`h-5 w-5 text-${wf.color}-500`} />
                      <h3 className="font-bold text-white text-sm">{wf.id}</h3>
                    </div>
                    <span className="text-xs px-2 py-1 bg-green-500/10 text-green-400 rounded">
                      {wf.trigger}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-400 mb-4 line-clamp-2">
                    {wf.description}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-4">
                      <span className="text-zinc-500">
                        {wfStats.total} exec
                      </span>
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                        <span className="text-green-400">{wfStats.sucesso}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <XCircle className="h-3 w-3 text-red-500" />
                        <span className="text-red-400">{wfStats.erro}</span>
                      </div>
                    </div>
                    
                    {wfStats.total > 0 && (
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3 text-purple-500" />
                        <span className="text-purple-400 font-bold">{successRate}%</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Logs de Execução */}
        <div className="glass rounded-xl border border-zinc-800">
          <div className="p-6 border-b border-zinc-800">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Clock className="h-5 w-5 text-purple-500" />
              Logs de Execução
              <span className="text-xs text-zinc-500 font-normal ml-auto">
                {logs?.length || 0} registros
              </span>
            </h2>
          </div>

          <div className="divide-y divide-zinc-800 max-h-[500px] overflow-y-auto">
            {logs?.map((log) => (
              <div
                key={log.id}
                className="p-4 hover:bg-zinc-800/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      {log.status === 'sucesso' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="font-semibold text-white text-sm">
                        {log.workflow_name}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        log.status === 'sucesso' 
                          ? 'bg-green-500/10 text-green-400' 
                          : 'bg-red-500/10 text-red-400'
                      }`}>
                        {log.status}
                      </span>
                    </div>

                    {log.detalhes && (
                      <div className="text-xs text-zinc-500 ml-7 space-y-1">
                        {Object.entries(log.detalhes).map(([key, value]) => (
                          <div key={key} className="flex gap-2">
                            <span className="text-zinc-600">{key}:</span>
                            <span>{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <span className="text-xs text-zinc-600 whitespace-nowrap">
                    {formatDateTime(log.created_at)}
                  </span>
                </div>
              </div>
            ))}

            {(!logs || logs.length === 0) && (
              <div className="p-12 text-center text-zinc-500">
                <Clock className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>Nenhum log registrado</p>
              </div>
            )}
          </div>
        </div>

        {/* Workflow Queue Monitor */}
        <WorkflowQueueMonitor />
      </div>
    </div>
  )
}
