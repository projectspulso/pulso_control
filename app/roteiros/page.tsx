'use client'

import { useRoteiros, useRoteirosStats } from '@/lib/hooks/use-roteiros'
import { useCanais } from '@/lib/hooks/use-core'
import { ErrorState } from '@/components/ui/error-state'
import { ModoFocoBanner } from '@/components/modo-foco-banner'
import Link from 'next/link'
import { useState } from 'react'

export default function RoteirosPage() {
  const { data: roteiros, isLoading, isError, refetch } = useRoteiros()
  const { data: stats } = useRoteirosStats()
  const { data: canais } = useCanais()
  
  const [filtroStatus, setFiltroStatus] = useState<string>('TODOS')
  const [filtroCanal, setFiltroCanal] = useState<string>('TODOS')
  const [filtroHook, setFiltroHook] = useState<string>('TODOS')
  const [busca, setBusca] = useState('')
  const [refazendoLote, setRefazendoLote] = useState(false)
  const [loteMsg, setLoteMsg] = useState<string | null>(null)
  const [canalGerar, setCanalGerar] = useState<string>('')
  const [qtdGerar, setQtdGerar] = useState<number>(3)
  const [gerandoRot, setGerandoRot] = useState(false)
  const [gerarRotMsg, setGerarRotMsg] = useState<string | null>(null)

  const handleGerarRoteiros = async () => {
    setGerandoRot(true)
    setGerarRotMsg(null)
    try {
      const reqBody: { quantidade: number; canal_id?: string } = { quantidade: qtdGerar }
      if (canalGerar) reqBody.canal_id = canalGerar
      const resp = await fetch('/api/roteiros/gerar-lote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reqBody),
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.error || 'Falha ao gerar roteiros')
      if (data.elegiveis_total === 0) {
        setGerarRotMsg('Nenhuma ideia aprovada sem roteiro nesse filtro — aprove ideias primeiro.')
      } else {
        setGerarRotMsg(`✅ ${data.processados} roteiro(s) gerado(s)${data.falhas ? ` · ${data.falhas} falha(s)` : ''}. Restam ${Math.max(0, data.elegiveis_total - data.processados)} ideia(s) aprovada(s) sem roteiro.`)
      }
      await refetch()
    } catch (e) {
      setGerarRotMsg(`❌ ${e instanceof Error ? e.message : 'erro'}`)
    } finally {
      setGerandoRot(false)
    }
  }

  const handleRefazerLote = async () => {
    if (!confirm('Refazer o hook de TODOS os roteiros fracos (≤2)? Cada um tem a 1ª frase reescrita pela IA.')) return
    setRefazendoLote(true)
    setLoteMsg(null)
    try {
      const resp = await fetch('/api/roteiros/refazer-hooks-fracos', { method: 'POST' })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.error || 'Falha no lote')
      setLoteMsg(`✅ ${data.melhorados}/${data.total} hooks melhorados (${data.falhas} falhas).`)
      await refetch()
    } catch (e) {
      setLoteMsg(`❌ ${e instanceof Error ? e.message : 'erro'}`)
    } finally {
      setRefazendoLote(false)
    }
  }

  const roteirosFiltrados = roteiros?.filter(roteiro => {
    const matchStatus = filtroStatus === 'TODOS' || roteiro.status === filtroStatus
    const matchCanal = filtroCanal === 'TODOS' || roteiro.canal_id === filtroCanal
    const nh = (roteiro as { nota_hook?: number | null }).nota_hook ?? null
    const matchHook =
      filtroHook === 'TODOS' ||
      (filtroHook === 'FRACO' && nh != null && nh <= 2) ||
      (filtroHook === 'FORTE' && nh != null && nh >= 4)
    const matchBusca = !busca ||
      roteiro.titulo?.toLowerCase().includes(busca.toLowerCase()) ||
      roteiro.conteudo_md?.toLowerCase().includes(busca.toLowerCase())

    return matchStatus && matchCanal && matchHook && matchBusca
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="glass rounded-2xl p-8 text-center space-y-4">
            <div className="skeleton h-8 w-32 mx-auto" />
            <div className="skeleton h-4 w-48 mx-auto" />
          </div>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-zinc-950 p-8">
        <div className="max-w-7xl mx-auto">
          <ErrorState
            title="Erro ao carregar roteiros"
            message="Não foi possível carregar a lista de roteiros. Tente novamente."
            onRetry={() => refetch()}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-4xl font-black bg-linear-to-r from-blue-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent flex items-center gap-3">
              📝 Roteiros
            </h1>
            <p className="text-zinc-400 mt-2 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
              {stats?.total || 0} roteiros gerados
            </p>
          </div>
        </div>

        <ModoFocoBanner detail="Roteiros fora do canal foco podem ser auditados, mas nao entram no lote atual." />

        {/* Gerar roteiros — pra ideias aprovadas sem roteiro (trava de hook embutida) */}
        <div className="glass flex flex-wrap items-end gap-3 rounded-2xl border border-blue-500/30 bg-blue-500/5 p-4 animate-fade-in">
          <span className="text-xl">📝</span>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Gerar roteiros (ideias aprovadas sem roteiro)</label>
            <select
              value={canalGerar}
              onChange={(e) => setCanalGerar(e.target.value)}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="">Todos os canais</option>
              {canais?.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Qtd</label>
            <select
              value={qtdGerar}
              onChange={(e) => setQtdGerar(Number(e.target.value))}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
            >
              {[1, 3, 5].map((nn) => (
                <option key={nn} value={nn}>{nn}</option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={handleGerarRoteiros}
            disabled={gerandoRot}
            className="rounded-lg bg-linear-to-r from-blue-600 to-cyan-600 px-5 py-2 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-blue-500/20 disabled:opacity-50"
          >
            {gerandoRot ? '📝 Gerando…' : '📝 Gerar roteiros'}
          </button>
          {gerarRotMsg && <span className="w-full text-sm text-zinc-300">{gerarRotMsg}</span>}
        </div>

        {/* Stats Cards */}
        {stats && stats.por_status && Object.keys(stats.por_status).length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 animate-fade-in" style={{ animationDelay: '100ms' }}>
            {Object.entries(stats.por_status).map(([status, count], idx) => (
              <div
                key={status}
                className="glass glass-hover rounded-xl p-4 group cursor-pointer animate-fade-in"
                style={{ animationDelay: `${(idx + 1) * 50}ms` }}
              >
                <div className="text-3xl font-black bg-linear-to-br from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-1 tabular-nums">{count}</div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">{status.replace('_', ' ')}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filtros */}
        <div className="glass rounded-2xl p-6 animate-fade-in" style={{ animationDelay: '200ms' }}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Busca */}
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Buscar</label>
              <input
                type="text"
                placeholder="Título ou conteúdo..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500"
              />
            </div>

            {/* Filtro Status */}
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Status</label>
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-violet-500"
              >
                <option value="TODOS">Todos os status</option>
                <option value="RASCUNHO">RASCUNHO</option>
                <option value="EM_REVISAO">EM_REVISAO</option>
                <option value="APROVADO">APROVADO</option>
                <option value="REJEITADO">REJEITADO</option>
                <option value="EM_PRODUCAO">EM_PRODUCAO</option>
              </select>
            </div>

            {/* Filtro Canal */}
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Canal</label>
              <select
                value={filtroCanal}
                onChange={(e) => setFiltroCanal(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-violet-500"
              >
                <option value="TODOS">Todos os canais</option>
                {canais?.map(canal => (
                  <option key={canal.id} value={canal.id}>
                    {canal.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro Hook */}
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Hook (3s)</label>
              <select
                value={filtroHook}
                onChange={(e) => setFiltroHook(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-violet-500"
              >
                <option value="TODOS">Todos os hooks</option>
                <option value="FRACO">⚠ Fraco (≤2) — refazer</option>
                <option value="FORTE">Forte (≥4)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Ação em lote — refazer hooks fracos */}
        {filtroHook === 'FRACO' && roteirosFiltrados && roteirosFiltrados.length > 0 && (
          <div className="glass flex flex-wrap items-center gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/5 p-4">
            <span className="text-sm text-rose-200">
              {roteirosFiltrados.length} roteiros com hook fraco (≤2). Refaça a 1ª frase de todos de uma vez.
            </span>
            <button
              type="button"
              onClick={handleRefazerLote}
              disabled={refazendoLote}
              className="ml-auto rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-rose-500 disabled:opacity-50"
            >
              {refazendoLote ? 'Refazendo todos…' : `🪝 Refazer todos os hooks fracos (${roteirosFiltrados.length})`}
            </button>
            {loteMsg && <span className="w-full text-xs text-zinc-300">{loteMsg}</span>}
          </div>
        )}

        {/* Grid de Roteiros */}
        {roteirosFiltrados && roteirosFiltrados.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center animate-fade-in" style={{ animationDelay: '300ms' }}>
            <div className="text-6xl mb-4">📝</div>
            <p className="text-zinc-400 mb-2 font-semibold">Nenhum roteiro encontrado</p>
            <p className="text-sm text-zinc-600">
              Roteiros são gerados automaticamente a partir de ideias aprovadas
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roteirosFiltrados?.map((roteiro, idx) => {
              const canal = canais?.find(c => c.id === roteiro.canal_id)
              const nh = (roteiro as { nota_hook?: number | null }).nota_hook ?? null

              return (
                <Link
                  key={roteiro.id}
                  href={`/roteiros/${roteiro.id}`}
                  className={`glass glass-hover rounded-2xl p-6 group cursor-pointer relative overflow-hidden animate-fade-in ${nh != null && nh <= 2 ? 'ring-1 ring-red-500/50' : ''}`}
                  style={{ animationDelay: `${300 + idx * 50}ms` }}
                >
                  <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-blue-600/20 blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-500" />
                  <div className="flex items-start justify-between mb-4">
                    <StatusBadge status={roteiro.status} />
                    <div className="flex items-center gap-2">
                      <HookBadge nota={nh} />
                      <span className="text-xs text-zinc-500">v{roteiro.versao || 1}</span>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-violet-400 transition-colors line-clamp-2">
                    {roteiro.metadata?.numero != null ? `#${String(roteiro.metadata.numero).padStart(3, '0')} — ` : ''}{roteiro.titulo || 'Sem título'}
                  </h3>

                  <p className="text-sm text-zinc-400 mb-4 line-clamp-3">
                    {roteiro.conteudo_md?.substring(0, 150) || 'Sem conteúdo'}...
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                    <span className="text-xs text-zinc-500">
                      {canal?.nome || 'Sem canal'}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {roteiro.duracao_segundos ? `${roteiro.duracao_segundos}s` : '-'}
                    </span>
                  </div>

                  <div className="mt-2 text-xs text-zinc-600">
                    {roteiro.created_at 
                      ? new Date(roteiro.created_at).toLocaleDateString('pt-BR')
                      : '-'
                    }
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-zinc-500">
          Mostrando {roteirosFiltrados?.length || 0} de {roteiros?.length || 0} roteiros
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string | null }) {
  const statusConfig: Record<string, { label: string; color: string }> = {
    RASCUNHO: { label: 'Rascunho', color: 'bg-zinc-600' },
    EM_REVISAO: { label: 'Em Revisão', color: 'bg-yellow-600' },
    APROVADO: { label: 'Aprovado', color: 'bg-green-600' },
    REJEITADO: { label: 'Rejeitado', color: 'bg-red-600' },
    EM_PRODUCAO: { label: 'Em Produção', color: 'bg-purple-600' },
  }

  const config = status ? (statusConfig[status] || { label: status || 'Indefinido', color: 'bg-zinc-600' }) : { label: 'Indefinido', color: 'bg-zinc-600' }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${config.color}`}>
      {config.label}
    </span>
  )
}

function HookBadge({ nota }: { nota: number | null }) {
  if (nota == null) return null
  const cfg =
    nota <= 2
      ? { cor: 'bg-red-500/15 text-red-300 ring-1 ring-red-500/40', alerta: true }
      : nota === 3
        ? { cor: 'bg-amber-500/15 text-amber-300', alerta: false }
        : { cor: 'bg-emerald-500/15 text-emerald-300', alerta: false }
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.cor}`}
      title="Nota do hook (1-5) — trava dos 3 segundos. ≤2 = refazer a primeira frase."
    >
      {cfg.alerta ? '⚠ ' : ''}Hook {nota}
    </span>
  )
}
