'use client'

import { useAutomationStats } from '@/lib/hooks/use-automation'
import { useWorkflowExecucoes } from '@/lib/hooks/use-workflows'
import { useIdeias } from '@/lib/hooks/use-ideias'
import { useRoteiros } from '@/lib/hooks/use-roteiros'
import { ErrorState } from '@/components/ui/error-state'
import { CheckCircle2, XCircle, Zap, Database, Lightbulb, FileText, Loader2, AlertCircle } from 'lucide-react'

export default function IntegrationsPage() {
  const { data: automationStats, isLoading: loadingAutomation, error: automationError, refetch: refetchAutomation } = useAutomationStats()
  const { data: execucoes } = useWorkflowExecucoes()
  const { data: ideias, isError: isIdeiasError, refetch: refetchIdeias } = useIdeias()
  const { data: roteiros, isError: isRoteirosError, refetch: refetchRoteiros } = useRoteiros()

  const handleRetry = () => {
    refetchAutomation()
    refetchIdeias()
    refetchRoteiros()
  }

  if (isIdeiasError || isRoteirosError) {
    return (
      <div className="min-h-screen bg-zinc-950 p-8">
        <div className="max-w-7xl mx-auto">
          <ErrorState
            title="Erro ao carregar integrações"
            message="Houve um problema ao carregar os dados das integrações. Verifique sua conexão."
            onRetry={handleRetry}
          />
        </div>
      </div>
    )
  }

  // Determinar status da automação
  const totalSucesso = automationStats?.reduce((acc: number, s: { sucesso: number }) => acc + s.sucesso, 0) || 0
  const totalErros = automationStats?.reduce((acc: number, s: { erros: number }) => acc + s.erros, 0) || 0
  const automationStatus: 'connected' | 'disconnected' | 'error' | 'loading' = automationError
    ? 'error'
    : loadingAutomation
    ? 'loading'
    : automationStats && automationStats.length > 0
    ? 'connected'
    : 'disconnected'

  const integrations = [
    {
      name: 'Supabase',
      description: 'Banco de dados PostgreSQL',
      icon: Database,
      status: 'connected' as const,
      details: [
        { label: 'Ideias', value: ideias?.length || 0 },
        { label: 'Roteiros', value: roteiros?.length || 0 }
      ]
    },
    {
      name: 'Automação AI-Native',
      description: 'Fila de automação via banco + pg_cron',
      icon: Zap,
      status: automationStatus,
      details: [
        { label: 'Tipos de Job', value: automationStats?.length || 0 },
        { label: 'Sucesso (7d)', value: totalSucesso },
        { label: 'Erros (7d)', value: totalErros }
      ],
      error: automationError
    }
  ]

  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse-glow" />
            <h1 className="text-4xl font-black bg-linear-to-r from-blue-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
              🔌 Integrações do Sistema
            </h1>
          </div>
          <p className="text-zinc-400">Status e configuração de todas as integrações</p>
        </div>

        {/* Status das Integrações */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {integrations.map((integration, idx) => {
            const Icon = integration.icon
            const statusConfig = {
              connected: { color: 'text-green-500', bg: 'bg-green-500/10', icon: CheckCircle2, label: 'Conectado' },
              disconnected: { color: 'text-gray-500', bg: 'bg-gray-500/10', icon: AlertCircle, label: 'Desconectado' },
              error: { color: 'text-red-500', bg: 'bg-red-500/10', icon: XCircle, label: 'Erro' },
              loading: { color: 'text-blue-500', bg: 'bg-blue-500/10', icon: Loader2, label: 'Conectando...' }
            }[integration.status]

            const StatusIcon = statusConfig.icon

            return (
              <div key={integration.name} className="glass border border-zinc-800/50 rounded-xl p-6 hover:border-blue-500/30 transition-all animate-fade-in" style={{ animationDelay: `${idx * 100}ms` }}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${statusConfig.bg}`}>
                    <Icon className={`h-6 w-6 ${statusConfig.color}`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{integration.name}</h3>
                    <p className="text-sm text-zinc-400">{integration.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusIcon className={`h-4 w-4 ${statusConfig.color} ${integration.status === 'loading' ? 'animate-spin' : ''}`} />
                  <span className={`text-xs px-2 py-1 rounded ${statusConfig.bg} ${statusConfig.color}`}>
                    {statusConfig.label}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                {integration.details.map((detail) => (
                  <div key={detail.label} className="text-center">
                    <p className="text-2xl font-bold text-white">{detail.value}</p>
                    <p className="text-xs text-zinc-500">{detail.label}</p>
                  </div>
                ))}
              </div>
              
              {integration.error && (
                <p className="mt-4 text-sm text-red-400">
                  ⚠️ Erro ao conectar com {integration.name}
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* Workflows Configurados */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg">
        <div className="p-6 border-b border-zinc-800">
          <h2 className="text-xl font-bold text-white">Workflows Configurados</h2>
          <p className="text-sm text-zinc-400 mt-1">Automações disponíveis no Centro de Comando</p>
        </div>
        <div className="p-6 space-y-4">
          {[
            { name: 'Gerar Roteiro', trigger: 'Botão na página de Ideia', webhook: 'gerar-roteiro', status: 'active' },
            { name: 'Gerar Áudio', trigger: 'Pipeline de Produção', webhook: 'gerar-audio', status: 'pending' },
            { name: 'Gerar Vídeo', trigger: 'Pipeline de Produção', webhook: 'gerar-video', status: 'pending' },
            { name: 'Publicar Conteúdo', trigger: 'Sistema de Publicação', webhook: 'publicar-conteudo', status: 'pending' }
          ].map((workflow) => (
            <div key={workflow.name} className="flex items-start gap-4 p-4 border border-zinc-800 rounded-lg">
              <Zap className="h-5 w-5 text-orange-500 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-white">{workflow.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded ${workflow.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-zinc-800 text-zinc-500'}`}>
                    {workflow.status === 'active' ? 'Ativo' : 'Pendente'}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-zinc-500">
                  <span><strong className="text-zinc-400">Trigger:</strong> {workflow.trigger}</span>
                  <span><strong className="text-zinc-400">Webhook:</strong> <code className="bg-zinc-800 px-1 py-0.5 rounded">{workflow.webhook}</code></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      </div>
    </div>
  )
}
