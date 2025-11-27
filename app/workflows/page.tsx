'use client'

import { useWorkflows, useWorkflowExecucoes } from '@/lib/hooks/use-workflows'
import { useN8nWorkflows } from '@/lib/hooks/use-n8n'
import { formatDateTime } from '@/lib/utils'
import { Workflow, Play, Pause, Settings, CheckCircle2, XCircle, Clock, Loader2, Zap } from 'lucide-react'

const STATUS_CONFIG = {
  'SUCESSO': { label: 'Sucesso', color: 'text-green-400', bgColor: 'bg-green-500/10', icon: CheckCircle2 },
  'ERRO': { label: 'Erro', color: 'text-red-400', bgColor: 'bg-red-500/10', icon: XCircle },
  'EXECUTANDO': { label: 'Executando', color: 'text-yellow-400', bgColor: 'bg-yellow-500/10', icon: Loader2 },
  'PENDENTE': { label: 'Pendente', color: 'text-gray-400', bgColor: 'bg-gray-500/10', icon: Clock }
}

export default function WorkflowsPage() {
  const { data: workflows, isLoading: loadingWorkflows } = useWorkflows()
  const { data: execucoes, isLoading: loadingExecucoes } = useWorkflowExecucoes()
  const { data: n8nWorkflows, isLoading: loadingN8n } = useN8nWorkflows()

  // Stats das execuções
  const stats = execucoes?.reduce((acc: any, exec: any) => {
    acc[exec.status] = (acc[exec.status] || 0) + 1
    return acc
  }, {}) || {}

  if (loadingWorkflows || loadingExecucoes) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-zinc-800 rounded w-1/4"></div>
          <div className="h-64 bg-zinc-800 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Workflows</h1>
        <p className="text-zinc-400">Controle e monitore os workflows de automação</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <Workflow className="h-5 w-5 text-purple-500" />
            <span className="text-sm text-zinc-400">Total Workflows</span>
          </div>
          <p className="text-3xl font-bold text-white">{workflows?.length || 0}</p>
        </div>

        {Object.entries(STATUS_CONFIG).map(([status, config]) => {
          const Icon = config.icon
          return (
            <div key={status} className={`${config.bgColor} border border-zinc-800 rounded-lg p-6`}>
              <div className="flex items-center gap-3 mb-2">
                <Icon className={`h-5 w-5 ${config.color}`} />
                <span className="text-sm text-zinc-400">{config.label}</span>
              </div>
              <p className={`text-3xl font-bold ${config.color}`}>{stats[status] || 0}</p>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workflows n8n Ativos */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg">
          <div className="p-6 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-orange-500" />
              <h2 className="text-xl font-bold text-white">n8n Workflows</h2>
            </div>
            <p className="text-xs text-zinc-500 mt-1">Workflows na instância do n8n</p>
          </div>
          <div className="divide-y divide-zinc-800 max-h-[600px] overflow-y-auto">
            {loadingN8n ? (
              <div className="p-8 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-600" />
              </div>
            ) : (
              <>
                {n8nWorkflows?.map((workflow: any) => (
                  <div key={workflow.id} className="p-4 hover:bg-zinc-800/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <Zap className="h-4 w-4 text-orange-500" />
                          <h3 className="font-semibold text-white text-sm">{workflow.name}</h3>
                        </div>
                        {workflow.tags && workflow.tags.length > 0 && (
                          <div className="flex gap-1 ml-7 mt-1">
                            {workflow.tags.map((tag: string) => (
                              <span key={tag} className="text-xs px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${workflow.active ? 'bg-green-500/10 text-green-400' : 'bg-zinc-800 text-zinc-500'}`}>
                        {workflow.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  </div>
                ))}
                {(!n8nWorkflows || n8nWorkflows.length === 0) && (
                  <div className="p-8 text-center text-zinc-500">
                    Nenhum workflow no n8n
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Lista de Workflows do Banco */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg">
          <div className="p-6 border-b border-zinc-800">
            <h2 className="text-xl font-bold text-white">Workflows Registrados</h2>
            <p className="text-xs text-zinc-500 mt-1">Workflows configurados no sistema</p>
          </div>
          <div className="divide-y divide-zinc-800">
            {workflows?.map((workflow: any) => {
              const execucoesWorkflow = execucoes?.filter((e: any) => e.workflow_id === workflow.id) || []
              const ultimaExecucao = execucoesWorkflow[0]
              const statusInfo = ultimaExecucao ? STATUS_CONFIG[ultimaExecucao.status as keyof typeof STATUS_CONFIG] : null
              const StatusIcon = statusInfo?.icon

              return (
                <div key={workflow.id} className="p-4 hover:bg-zinc-800/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <Workflow className="h-4 w-4 text-purple-500" />
                        <h3 className="font-semibold text-white">{workflow.nome}</h3>
                      </div>
                      {workflow.descricao && (
                        <p className="text-xs text-zinc-500 ml-7">{workflow.descricao}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 ml-7 text-xs text-zinc-600">
                        <span>{execucoesWorkflow.length} execuções</span>
                        {ultimaExecucao && (
                          <span className="flex items-center gap-1">
                            {StatusIcon && <StatusIcon className={`h-3 w-3 ${statusInfo?.color}`} />}
                            Última: {formatDateTime(ultimaExecucao.inicio_em)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 text-zinc-400 hover:text-green-400 hover:bg-zinc-800 rounded transition-colors">
                        <Play className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors">
                        <Settings className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}

            {(!workflows || workflows.length === 0) && (
              <div className="p-8 text-center text-zinc-500">
                Nenhum workflow configurado
              </div>
            )}
          </div>
        </div>

        {/* Log de Execuções */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg">
          <div className="p-6 border-b border-zinc-800">
            <h2 className="text-xl font-bold text-white">Execuções Recentes</h2>
          </div>
          <div className="divide-y divide-zinc-800 max-h-[600px] overflow-y-auto">
            {execucoes?.slice(0, 20).map((exec: any) => {
              const statusConfig = STATUS_CONFIG[exec.status as keyof typeof STATUS_CONFIG]
              const StatusIcon = statusConfig.icon

              return (
                <div key={exec.id} className="p-4 hover:bg-zinc-800/50 transition-colors">
                  <div className="flex items-center gap-3 mb-1">
                    <StatusIcon className={`h-4 w-4 ${statusConfig.color} ${exec.status === 'EXECUTANDO' ? 'animate-spin' : ''}`} />
                    <span className="font-medium text-white text-sm">
                      {exec.workflow?.nome || 'Workflow'}
                    </span>
                    <span className={`${statusConfig.color} text-xs px-2 py-0.5 rounded-full ${statusConfig.bgColor}`}>
                      {statusConfig.label}
                    </span>
                  </div>
                  {exec.mensagem && (
                    <p className="text-xs text-zinc-500 ml-7 line-clamp-1 mb-1">
                      {exec.mensagem}
                    </p>
                  )}
                  <p className="text-xs text-zinc-600 ml-7">
                    {formatDateTime(exec.inicio_em)}
                  </p>
                </div>
              )
            })}

            {(!execucoes || execucoes.length === 0) && (
              <div className="p-8 text-center text-zinc-500">
                Nenhuma execução registrada
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}
