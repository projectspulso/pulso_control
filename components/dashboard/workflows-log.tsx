'use client'

import { useWorkflowExecucoes } from '@/lib/hooks/use-workflows'
import { formatDateTime } from '@/lib/utils'
import { CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react'

type WorkflowStatus = 'SUCESSO' | 'ERRO' | 'EXECUTANDO' | 'PENDENTE'

const statusConfig: Record<WorkflowStatus, { label: string; color: string; icon: any }> = {
  'SUCESSO': { label: 'Sucesso', color: 'text-green-400', icon: CheckCircle2 },
  'ERRO': { label: 'Erro', color: 'text-red-400', icon: XCircle },
  'EXECUTANDO': { label: 'Executando', color: 'text-yellow-400', icon: Loader2 },
  'PENDENTE': { label: 'Pendente', color: 'text-gray-400', icon: Clock }
}

export function WorkflowsLog() {
  const { data: execucoes, isLoading } = useWorkflowExecucoes()

  if (isLoading) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-zinc-800 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-zinc-800 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!execucoes || !Array.isArray(execucoes)) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-2">Workflows Recentes</h2>
        <p className="text-zinc-400 text-center">Nenhuma execução encontrada</p>
      </div>
    )
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg">
      <div className="p-6 border-b border-zinc-800">
        <h2 className="text-xl font-bold text-white">Workflows Recentes</h2>
        <p className="text-sm text-zinc-400 mt-1">Últimas 20 execuções</p>
      </div>

      <div className="divide-y divide-zinc-800 max-h-96 overflow-y-auto">
        {execucoes.slice(0, 20).map((exec: any) => {
          const execStatus = (exec?.status || 'PENDENTE') as WorkflowStatus
          const status = statusConfig[execStatus]
          const StatusIcon = status.icon

          return (
            <div
              key={exec.id}
              className="p-4 hover:bg-zinc-800/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <StatusIcon className={`w-4 h-4 ${status.color} ${execStatus === 'EXECUTANDO' ? 'animate-spin' : ''}`} />
                    <span className="font-medium text-white">
                      {exec.workflow?.nome || 'Workflow'}
                    </span>
                  </div>
                  {exec.mensagem && (
                    <p className="text-xs text-zinc-400 mt-1 line-clamp-1">
                      {exec.mensagem}
                    </p>
                  )}
                </div>
                <div className="text-right ml-4">
                  <span className={`text-xs font-medium ${status.color}`}>
                    {status.label}
                  </span>
                  <p className="text-xs text-zinc-600 mt-1">
                    {formatDateTime(exec.inicio_em)}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
