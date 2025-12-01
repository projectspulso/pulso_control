'use client'

import { useWorkflowQueue, useRetryWorkflow, useQueueStats } from '@/lib/hooks/use-workflow-queue'
import { RefreshCw, CheckCircle, XCircle, Clock, AlertCircle, Play } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const statusConfig = {
  pending: {
    icon: Clock,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/20',
    label: 'Pendente'
  },
  processing: {
    icon: RefreshCw,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    label: 'Processando'
  },
  completed: {
    icon: CheckCircle,
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
    label: 'Concluído'
  },
  failed: {
    icon: XCircle,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    label: 'Falhou'
  }
}

export function WorkflowQueueMonitor() {
  const { data: queue, isLoading, refetch } = useWorkflowQueue()
  const { data: stats } = useQueueStats()
  const { mutate: retry, isPending: isRetrying } = useRetryWorkflow()

  if (isLoading) {
    return (
      <div className="glass rounded-2xl p-8">
        <div className="flex items-center justify-center">
          <RefreshCw className="h-6 w-6 text-purple-400 animate-spin" />
          <span className="ml-2 text-zinc-400">Carregando fila...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="glass rounded-2xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <RefreshCw className="h-8 w-8 text-purple-400" />
            {stats && stats.processing > 0 && (
              <div className="absolute -top-1 -right-1 h-3 w-3 bg-blue-500 rounded-full animate-pulse" />
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Fila de Workflows</h2>
            <p className="text-sm text-zinc-400">Monitoramento e retry automático</p>
          </div>
        </div>
        
        <button
          onClick={() => refetch()}
          className="glass glass-hover rounded-lg px-4 py-2 flex items-center gap-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="glass rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <div className="text-xs text-zinc-400">Total</div>
          </div>
          <div className="glass rounded-lg p-3 text-center bg-yellow-500/5">
            <div className="text-2xl font-bold text-yellow-400">{stats.pending}</div>
            <div className="text-xs text-zinc-400">Pendentes</div>
          </div>
          <div className="glass rounded-lg p-3 text-center bg-blue-500/5">
            <div className="text-2xl font-bold text-blue-400">{stats.processing}</div>
            <div className="text-xs text-zinc-400">Processando</div>
          </div>
          <div className="glass rounded-lg p-3 text-center bg-green-500/5">
            <div className="text-2xl font-bold text-green-400">{stats.completed}</div>
            <div className="text-xs text-zinc-400">Concluídos</div>
          </div>
          <div className="glass rounded-lg p-3 text-center bg-red-500/5">
            <div className="text-2xl font-bold text-red-400">{stats.failed}</div>
            <div className="text-xs text-zinc-400">Falhos</div>
          </div>
        </div>
      )}

      {/* Queue Items */}
      <div className="space-y-2">
        {!queue || queue.length === 0 ? (
          <div className="glass rounded-lg p-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-3" />
            <p className="text-zinc-400">Fila vazia! Todos os workflows estão processados.</p>
          </div>
        ) : (
          queue.map((item) => {
            const config = statusConfig[item.status]
            const Icon = config.icon

            return (
              <div
                key={item.id}
                className={`glass rounded-lg p-4 border ${config.border} ${config.bg} hover:border-purple-500/30 transition-all group`}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left: Status Icon & Info */}
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`${config.color} mt-1`}>
                      <Icon className={`h-5 w-5 ${item.status === 'processing' ? 'animate-spin' : ''}`} />
                    </div>
                    
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white">{item.workflow_name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${config.bg} ${config.color} border ${config.border}`}>
                          {config.label}
                        </span>
                      </div>
                      
                      <div className="text-xs text-zinc-400 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          <span>
                            Criado {formatDistanceToNow(new Date(item.created_at), { 
                              addSuffix: true, 
                              locale: ptBR 
                            })}
                          </span>
                        </div>
                        
                        {item.retry_count > 0 && (
                          <div className="flex items-center gap-2 text-yellow-400">
                            <RefreshCw className="h-3 w-3" />
                            <span>
                              Tentativa {item.retry_count}/{item.max_retries}
                            </span>
                          </div>
                        )}
                        
                        {item.error_message && (
                          <div className="flex items-start gap-2 text-red-400 mt-1">
                            <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                            <span className="text-xs">{item.error_message}</span>
                          </div>
                        )}
                        
                        {item.next_retry_at && item.status === 'failed' && (
                          <div className="flex items-center gap-2 text-orange-400">
                            <Clock className="h-3 w-3" />
                            <span>
                              Próximo retry {formatDistanceToNow(new Date(item.next_retry_at), { 
                                addSuffix: true, 
                                locale: ptBR 
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  {(item.status === 'failed' || item.status === 'pending') && item.retry_count < item.max_retries && (
                    <button
                      onClick={() => retry(item.id)}
                      disabled={isRetrying}
                      className="glass glass-hover rounded-lg px-3 py-2 flex items-center gap-2 text-sm font-medium text-purple-300 hover:text-purple-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Play className="h-4 w-4" />
                      Retry Agora
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
