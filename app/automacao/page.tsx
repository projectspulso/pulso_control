'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import {
  useAutomationQueue,
  useAutomationStats,
  useCancelarAutomation,
  useRetryAutomation,
} from '@/lib/hooks/use-automation'
import { type AutomationTipo, type AutomationStatus } from '@/lib/api/automation'
import { ErrorState } from '@/components/ui/error-state'
import {
  Zap,
  Lightbulb,
  ListChecks,
  BarChart3,
  FileText,
  RefreshCw,
  XCircle,
  Loader2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Ban,
} from 'lucide-react'

// ── Helpers ──────────────────────────────────────────────────

function tempoRelativo(iso: string): string {
  const agora = Date.now()
  const data = new Date(iso).getTime()
  const diff = agora - data
  const seg = Math.floor(diff / 1000)
  if (seg < 60) return `${seg}s atrás`
  const min = Math.floor(seg / 60)
  if (min < 60) return `${min}min atrás`
  const hrs = Math.floor(min / 60)
  if (hrs < 24) return `${hrs}h atrás`
  const dias = Math.floor(hrs / 24)
  return `${dias}d atrás`
}

function formatarDuracao(seg: number | null): string {
  if (seg == null) return '-'
  if (seg < 60) return `${seg.toFixed(1)}s`
  const min = Math.floor(seg / 60)
  const rest = Math.round(seg % 60)
  return `${min}m ${rest}s`
}

// ── Badge configs ────────────────────────────────────────────

const statusConfig: Record<AutomationStatus, { label: string; bg: string; text: string; icon: typeof Clock }> = {
  PENDENTE:     { label: 'Pendente',     bg: 'bg-blue-500/15',   text: 'text-blue-400',   icon: Clock },
  PROCESSANDO:  { label: 'Processando',  bg: 'bg-yellow-500/15', text: 'text-yellow-400', icon: Loader2 },
  SUCESSO:      { label: 'Sucesso',      bg: 'bg-green-500/15',  text: 'text-green-400',  icon: CheckCircle2 },
  ERRO:         { label: 'Erro',         bg: 'bg-red-500/15',    text: 'text-red-400',    icon: AlertTriangle },
  RETRY:        { label: 'Retry',        bg: 'bg-orange-500/15', text: 'text-orange-400', icon: RotateCcw },
  CANCELADO:    { label: 'Cancelado',    bg: 'bg-zinc-500/15',   text: 'text-zinc-400',   icon: Ban },
}

const tipoLabels: Record<AutomationTipo, string> = {
  GERAR_IDEIAS:      'Gerar Ideias',
  GERAR_ROTEIRO:     'Gerar Roteiro',
  GERAR_AUDIO:       'Gerar Áudio',
  PREPARAR_VIDEO:    'Preparar Vídeo',
  PUBLICAR:          'Publicar',
  COLETAR_METRICAS:  'Coletar Métricas',
  RELATORIO_SEMANAL: 'Relatório Semanal',
  PROCESSAR_FILA:    'Processar Fila',
  CUSTOM:            'Custom',
}

const tipoColors: Record<AutomationTipo, string> = {
  GERAR_IDEIAS:      'bg-violet-500/15 text-violet-400',
  GERAR_ROTEIRO:     'bg-indigo-500/15 text-indigo-400',
  GERAR_AUDIO:       'bg-cyan-500/15 text-cyan-400',
  PREPARAR_VIDEO:    'bg-pink-500/15 text-pink-400',
  PUBLICAR:          'bg-green-500/15 text-green-400',
  COLETAR_METRICAS:  'bg-amber-500/15 text-amber-400',
  RELATORIO_SEMANAL: 'bg-teal-500/15 text-teal-400',
  PROCESSAR_FILA:    'bg-blue-500/15 text-blue-400',
  CUSTOM:            'bg-zinc-500/15 text-zinc-400',
}

// ── Main Page ────────────────────────────────────────────────

export default function AutomacaoPage() {
  const { data: queue, isLoading: queueLoading, isError: queueError, refetch: refetchQueue } = useAutomationQueue({ limit: 50 })
  const { data: stats, isLoading: statsLoading, isError: statsError } = useAutomationStats()
  const cancelar = useCancelarAutomation()
  const retry = useRetryAutomation()

  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [filtroStatus, setFiltroStatus] = useState<string>('TODOS')
  const [filtroTipo, setFiltroTipo] = useState<string>('TODOS')

  // Aggregate stats across all types
  const totais = stats?.reduce(
    (acc, s) => ({
      pendentes: acc.pendentes + s.pendentes,
      processando: acc.processando + s.processando,
      sucesso: acc.sucesso + s.sucesso,
      erros: acc.erros + s.erros,
      retry: acc.retry + s.retry,
      total: acc.total + s.total,
    }),
    { pendentes: 0, processando: 0, sucesso: 0, erros: 0, retry: 0, total: 0 }
  ) ?? { pendentes: 0, processando: 0, sucesso: 0, erros: 0, retry: 0, total: 0 }

  // Quick actions — call API endpoint directly
  async function handleQuickAction(tipo: AutomationTipo) {
    setActionLoading(tipo)
    try {
      // Map tipo to the correct endpoint
      const endpointMap: Partial<Record<AutomationTipo, string>> = {
        GERAR_IDEIAS: '/api/automation/gerar-ideias',
        PROCESSAR_FILA: '/api/automation/orchestrator',
        COLETAR_METRICAS: '/api/automation/coletar-metricas',
        RELATORIO_SEMANAL: '/api/automation/relatorio',
      }
      const endpoint = endpointMap[tipo]
      if (!endpoint) throw new Error(`Ação não suportada: ${tipo}`)

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Erro ${res.status}`)

      // Show success feedback
      const msgs: Partial<Record<AutomationTipo, string>> = {
        GERAR_IDEIAS: `✅ Ideias geradas com sucesso!`,
        PROCESSAR_FILA: `✅ Fila processada: ${data.processed ?? 0} itens`,
        COLETAR_METRICAS: `✅ Coleta de métricas iniciada`,
        RELATORIO_SEMANAL: `✅ Relatório semanal gerado`,
      }
      toast.success(msgs[tipo] ?? '✅ Ação executada com sucesso!')
      refetchQueue()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido'
      toast.error(`❌ ${msg}`)
    } finally {
      setActionLoading(null)
    }
  }

  // Filter queue items
  const queueFiltrada = queue?.filter(item => {
    const matchStatus = filtroStatus === 'TODOS' || item.status === filtroStatus
    const matchTipo = filtroTipo === 'TODOS' || item.tipo === filtroTipo
    return matchStatus && matchTipo
  })

  // ── Loading state ──
  if (queueLoading && statsLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="glass rounded-2xl p-8 text-center">
            <div className="skeleton h-8 w-48 mx-auto mb-2" />
            <div className="skeleton h-4 w-64 mx-auto" />
          </div>
        </div>
      </div>
    )
  }

  // ── Error state ──
  if (queueError && statsError) {
    return (
      <div className="min-h-screen bg-zinc-950 p-8">
        <div className="max-w-7xl mx-auto">
          <ErrorState
            title="Erro ao carregar automação"
            message="Não foi possível conectar ao sistema de automação. Verifique sua conexão e tente novamente."
            onRetry={() => refetchQueue()}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* ── Header ── */}
        <div className="animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-linear-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black bg-linear-to-r from-emerald-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                Automação AI-Native
              </h1>
            </div>
          </div>
          <p className="text-zinc-400 mt-1 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            Sistema nativo de automação — substitui n8n por banco + Edge Functions
          </p>
        </div>

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <StatCard label="Pendentes" value={totais.pendentes} color="blue" icon={Clock} />
          <StatCard label="Processando" value={totais.processando} color="yellow" icon={Loader2} />
          <StatCard label="Sucesso" value={totais.sucesso} color="green" icon={CheckCircle2} />
          <StatCard label="Erros" value={totais.erros} color="red" icon={AlertTriangle} />
          <StatCard label="Retry" value={totais.retry} color="orange" icon={RotateCcw} />
          <StatCard label="Total (7d)" value={totais.total} color="zinc" icon={BarChart3} />
        </div>

        {/* ── Quick Actions ── */}
        <div className="glass rounded-2xl p-6 animate-fade-in" style={{ animationDelay: '200ms' }}>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Ações Rápidas</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <QuickActionButton
              label="Gerar Ideias"
              icon={Lightbulb}
              color="from-violet-600 to-purple-600"
              loading={actionLoading === 'GERAR_IDEIAS'}
              onClick={() => handleQuickAction('GERAR_IDEIAS')}
            />
            <QuickActionButton
              label="Processar Fila"
              icon={ListChecks}
              color="from-blue-600 to-cyan-600"
              loading={actionLoading === 'PROCESSAR_FILA'}
              onClick={() => handleQuickAction('PROCESSAR_FILA')}
            />
            <QuickActionButton
              label="Coletar Métricas"
              icon={BarChart3}
              color="from-amber-600 to-orange-600"
              loading={actionLoading === 'COLETAR_METRICAS'}
              onClick={() => handleQuickAction('COLETAR_METRICAS')}
            />
            <QuickActionButton
              label="Gerar Relatório"
              icon={FileText}
              color="from-teal-600 to-emerald-600"
              loading={actionLoading === 'RELATORIO_SEMANAL'}
              onClick={() => handleQuickAction('RELATORIO_SEMANAL')}
            />
          </div>
        </div>

        {/* ── Filters ── */}
        <div className="glass rounded-2xl p-6 animate-fade-in" style={{ animationDelay: '300ms' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Status</label>
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="TODOS">Todos os status</option>
                <option value="PENDENTE">Pendente</option>
                <option value="PROCESSANDO">Processando</option>
                <option value="SUCESSO">Sucesso</option>
                <option value="ERRO">Erro</option>
                <option value="RETRY">Retry</option>
                <option value="CANCELADO">Cancelado</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Tipo</label>
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="TODOS">Todos os tipos</option>
                {Object.entries(tipoLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ── Queue Table ── */}
        <div className="glass rounded-2xl overflow-hidden animate-fade-in" style={{ animationDelay: '400ms' }}>
          <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
              Fila de Automação
            </h2>
            <span className="text-xs text-zinc-500">
              Auto-refresh a cada 10s
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-800 border-b border-zinc-700">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">Tipo</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">Origem</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">Tentativas</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">Duração</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">Criado</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {!queueFiltrada || queueFiltrada.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                      Nenhum item na fila
                    </td>
                  </tr>
                ) : (
                  queueFiltrada.map((item) => {
                    const sc = statusConfig[item.status]
                    const StatusIcon = sc.icon

                    return (
                      <tr key={item.id} className="hover:bg-zinc-800/50 transition-colors">
                        {/* Tipo */}
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${tipoColors[item.tipo]}`}>
                            {tipoLabels[item.tipo] || item.tipo}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${sc.bg} ${sc.text}`}>
                            <StatusIcon className={`h-3 w-3 ${item.status === 'PROCESSANDO' ? 'animate-spin' : ''}`} />
                            {sc.label}
                          </span>
                        </td>

                        {/* Origem */}
                        <td className="px-6 py-4">
                          <span className="text-sm text-zinc-400 capitalize">{item.origem}</span>
                        </td>

                        {/* Tentativas */}
                        <td className="px-6 py-4">
                          <span className="text-sm text-zinc-400 tabular-nums">
                            {item.tentativas}/{item.max_tentativas}
                          </span>
                        </td>

                        {/* Duração */}
                        <td className="px-6 py-4">
                          <span className="text-sm text-zinc-400 tabular-nums">
                            {formatarDuracao(item.duracao_segundos)}
                          </span>
                        </td>

                        {/* Criado */}
                        <td className="px-6 py-4">
                          <span className="text-sm text-zinc-500" title={new Date(item.created_at).toLocaleString('pt-BR')}>
                            {tempoRelativo(item.created_at)}
                          </span>
                        </td>

                        {/* Ações */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {(item.status === 'ERRO' || item.status === 'RETRY') && (
                              <button
                                onClick={() => retry.mutate(item.id)}
                                disabled={retry.isPending}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 transition-colors disabled:opacity-50"
                                title="Tentar novamente"
                              >
                                <RefreshCw className={`h-3 w-3 ${retry.isPending ? 'animate-spin' : ''}`} />
                                Retry
                              </button>
                            )}
                            {item.status === 'PENDENTE' && (
                              <button
                                onClick={() => cancelar.mutate(item.id)}
                                disabled={cancelar.isPending}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                                title="Cancelar"
                              >
                                <XCircle className="h-3 w-3" />
                                Cancelar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Per-type Stats ── */}
        {stats && stats.length > 0 && (
          <div className="glass rounded-2xl p-6 animate-fade-in" style={{ animationDelay: '500ms' }}>
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Desempenho por Tipo (7 dias)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.map((s) => (
                <div key={s.tipo} className="glass rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${tipoColors[s.tipo]}`}>
                      {tipoLabels[s.tipo] || s.tipo}
                    </span>
                    <span className="text-xs text-zinc-500 tabular-nums">
                      {s.total} total
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-lg font-bold text-green-400 tabular-nums">{s.sucesso}</div>
                      <div className="text-[10px] text-zinc-500 uppercase">ok</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-red-400 tabular-nums">{s.erros}</div>
                      <div className="text-[10px] text-zinc-500 uppercase">erros</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-zinc-400 tabular-nums">
                        {s.duracao_media_seg != null ? `${s.duracao_media_seg.toFixed(1)}s` : '-'}
                      </div>
                      <div className="text-[10px] text-zinc-500 uppercase">média</div>
                    </div>
                  </div>
                  {s.ultima_execucao_ok && (
                    <div className="mt-2 text-[10px] text-zinc-600 text-right">
                      Último sucesso: {tempoRelativo(s.ultima_execucao_ok)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-zinc-500">
          Mostrando {queueFiltrada?.length || 0} de {queue?.length || 0} itens na fila
        </div>
      </div>
    </div>
  )
}

// ── Subcomponents ────────────────────────────────────────────

function StatCard({
  label,
  value,
  color,
  icon: Icon,
}: {
  label: string
  value: number
  color: 'blue' | 'yellow' | 'green' | 'red' | 'orange' | 'zinc'
  icon: typeof Clock
}) {
  const colorMap: Record<string, { gradient: string; glow: string }> = {
    blue:   { gradient: 'from-blue-400 to-blue-500',     glow: 'group-hover:shadow-blue-500/20' },
    yellow: { gradient: 'from-yellow-400 to-yellow-500', glow: 'group-hover:shadow-yellow-500/20' },
    green:  { gradient: 'from-green-400 to-green-500',   glow: 'group-hover:shadow-green-500/20' },
    red:    { gradient: 'from-red-400 to-red-500',       glow: 'group-hover:shadow-red-500/20' },
    orange: { gradient: 'from-orange-400 to-orange-500', glow: 'group-hover:shadow-orange-500/20' },
    zinc:   { gradient: 'from-zinc-400 to-zinc-500',     glow: 'group-hover:shadow-zinc-500/20' },
  }

  const c = colorMap[color]

  return (
    <div className={`glass glass-hover rounded-xl p-4 group cursor-default transition-shadow hover:shadow-lg ${c.glow}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`h-4 w-4 bg-linear-to-br ${c.gradient} bg-clip-text text-transparent opacity-60`} />
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">{label}</span>
      </div>
      <div className={`text-3xl font-black bg-linear-to-br ${c.gradient} bg-clip-text text-transparent tabular-nums`}>
        {value}
      </div>
    </div>
  )
}

function QuickActionButton({
  label,
  icon: Icon,
  color,
  loading,
  onClick,
}: {
  label: string
  icon: typeof Lightbulb
  color: string
  loading: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`
        group glass glass-hover rounded-xl px-5 py-3.5 font-semibold text-white
        bg-linear-to-r ${color} border border-white/10
        hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]
        transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
        flex items-center justify-center gap-2
      `}
    >
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <Icon className="h-5 w-5 group-hover:scale-110 transition-transform" />
      )}
      <span className="text-sm">{label}</span>
    </button>
  )
}
