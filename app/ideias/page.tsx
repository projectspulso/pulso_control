'use client'

import { useIdeias, useIdeiasStats } from '@/lib/hooks/use-ideias'
import { useCanais } from '@/lib/hooks/use-core'
import { ErrorState } from '@/components/ui/error-state'
import { ModoFocoBanner } from '@/components/modo-foco-banner'
import { PageHeader } from '@/components/layout/page-header'
import Link from 'next/link'
import { useState } from 'react'

export default function IdeiasPage() {
  const { data: ideias, isLoading, isError, refetch } = useIdeias()
  const { data: stats } = useIdeiasStats()
  const { data: canais } = useCanais()
  
  const [filtroStatus, setFiltroStatus] = useState<string>('TODOS')
  const [filtroCanal, setFiltroCanal] = useState<string>('TODOS')
  const [busca, setBusca] = useState('')

  const [canalGerar, setCanalGerar] = useState<string>('')
  const [qtdGerar, setQtdGerar] = useState<number>(5)
  const [gerando, setGerando] = useState(false)
  const [gerarMsg, setGerarMsg] = useState<string | null>(null)

  const handleGerarIdeias = async () => {
    setGerando(true)
    setGerarMsg(null)
    try {
      const body: { quantidade: number; canal_id?: string } = { quantidade: qtdGerar }
      if (canalGerar) body.canal_id = canalGerar
      const res = await fetch('/api/automation/gerar-ideias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Erro ${res.status}`)
      const ign = data.ignoradas_duplicidade?.length || 0
      setGerarMsg(`✅ ${data.quantidade_gerada} ideia(s) gerada(s) em "${data.canal}"${ign ? ` · ${ign} ignorada(s) por duplicidade` : ''}.`)
      await refetch()
    } catch (e) {
      setGerarMsg(`❌ ${e instanceof Error ? e.message : 'erro ao gerar'}`)
    } finally {
      setGerando(false)
    }
  }

  const ideiasFiltradas = ideias?.filter(ideia => {
    const matchStatus = filtroStatus === 'TODOS' || ideia.status === filtroStatus
    const matchCanal = filtroCanal === 'TODOS' || ideia.canal_id === filtroCanal
    const matchBusca = !busca || 
      ideia.titulo?.toLowerCase().includes(busca.toLowerCase()) ||
      ideia.descricao?.toLowerCase().includes(busca.toLowerCase())
    
    return matchStatus && matchCanal && matchBusca
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="glass rounded-2xl p-8 text-center">
            <div className="skeleton h-8 w-32 mx-auto mb-2" />
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
            title="Erro ao carregar ideias" 
            message="Não foi possível conectar ao banco de dados. Verifique sua conexão e tente novamente."
            onRetry={() => refetch()}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <PageHeader
          titulo="Ideias"
          subtitulo={`${stats?.total || 0} ideias cadastradas`}
          acoes={
            <Link
              href={`/ideias/nova`}
              className="group glass glass-hover rounded-xl px-6 py-3 font-semibold bg-linear-to-r from-violet-600 to-purple-600 text-white border-violet-500/50 hover:shadow-lg hover:shadow-violet-500/20 transition-all"
            >
              <span className="flex items-center gap-2">
                <span className="text-xl group-hover:scale-110 transition-transform">+</span>
                Nova Ideia
              </span>
            </Link>
          }
        />

        <ModoFocoBanner detail="Ideias fora do canal foco ficam fora da operacao diaria ate o gate do MVP." />

        {/* Gerar ideias com IA — escolhe o canal (travas de hook + gatilho embutidas) */}
        <div className="glass flex flex-wrap items-end gap-3 rounded-2xl border border-violet-500/30 bg-violet-500/5 p-4 animate-fade-in">
          <span className="text-xl">✨</span>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Gerar ideias para o canal</label>
            <select
              value={canalGerar}
              onChange={(e) => setCanalGerar(e.target.value)}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
            >
              <option value="">🔄 Rotação automática (canal com menos ideias)</option>
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
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
            >
              {[3, 5, 8, 10].map((nn) => (
                <option key={nn} value={nn}>{nn}</option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={handleGerarIdeias}
            disabled={gerando}
            className="rounded-lg bg-linear-to-r from-violet-600 to-purple-600 px-5 py-2 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-violet-500/20 disabled:opacity-50"
          >
            {gerando ? '✨ Gerando…' : '✨ Gerar ideias com IA'}
          </button>
          {gerarMsg && <span className="w-full text-sm text-zinc-300">{gerarMsg}</span>}
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 animate-fade-in" style={{ animationDelay: '100ms' }}>
            {Object.entries(stats.por_status).map(([status, count], idx) => (
              <div
                key={status}
                className="glass glass-hover rounded-xl p-4 group cursor-pointer animate-fade-in"
                style={{ animationDelay: `${(idx + 1) * 50}ms` }}
              >
                <div className="text-3xl font-black bg-linear-to-br from-purple-400 to-pink-400 bg-clip-text text-transparent mb-1 tabular-nums">{count}</div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">{status.replace('_', ' ')}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filtros */}
        <div className="glass rounded-2xl p-6 animate-fade-in" style={{ animationDelay: '200ms' }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Busca */}
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Buscar</label>
              <input
                type="text"
                placeholder="Título ou descrição..."
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
                <option value="NOVA">NOVA</option>
                <option value="EM_ANALISE">EM_ANALISE</option>
                <option value="APROVADA">APROVADA</option>
                <option value="REJEITADA">REJEITADA</option>
                <option value="EM_PRODUCAO">EM_PRODUCAO</option>
                <option value="ARQUIVADA">ARQUIVADA</option>
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
          </div>
        </div>

        {/* Tabela de Ideias */}
        <div className="glass rounded-2xl overflow-hidden animate-fade-in" style={{ animationDelay: '300ms' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-800 border-b border-zinc-700">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-zinc-300">
                    Título
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-zinc-300">
                    Canal
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-zinc-300">
                    Status
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-zinc-300">
                    Prioridade
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-zinc-300">
                    Criado em
                  </th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-zinc-300">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {ideiasFiltradas?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                      Nenhuma ideia encontrada
                    </td>
                  </tr>
                ) : (
                  ideiasFiltradas?.map((ideia) => {
                    const canal = canais?.find(c => c.id === ideia.canal_id)
                    
                    return (
                      <tr
                        key={ideia.id}
                        className="hover:bg-zinc-800/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="text-white font-medium">{ideia.metadata?.numero != null ? `#${String(ideia.metadata.numero).padStart(3, '0')} — ` : ''}{ideia.titulo}</div>
                          <div className="text-sm text-zinc-500 line-clamp-1">
                            {ideia.descricao}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-zinc-400">
                            {canal?.nome || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={ideia.status} />
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-zinc-400">
                            {ideia.prioridade || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-zinc-400">
                            {ideia.created_at 
                              ? new Date(ideia.created_at).toLocaleDateString('pt-BR')
                              : '-'
                            }
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/ideias/${ideia.id}`}
                            className="text-violet-400 hover:text-violet-300 text-sm font-medium"
                          >
                            Ver detalhes →
                          </Link>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-zinc-500">
          Mostrando {ideiasFiltradas?.length || 0} de {ideias?.length || 0} ideias
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string | null }) {
  const statusConfig: Record<string, { label: string; color: string }> = {
    RASCUNHO: { label: 'Rascunho', color: 'bg-zinc-600' },
    NOVA: { label: 'Nova', color: 'bg-blue-600' },
    EM_ANALISE: { label: 'Em Análise', color: 'bg-yellow-600' },
    APROVADA: { label: 'Aprovada', color: 'bg-green-600' },
    REJEITADA: { label: 'Rejeitada', color: 'bg-red-600' },
    EM_PRODUCAO: { label: 'Em Produção', color: 'bg-purple-600' },
    ARQUIVADA: { label: 'Arquivada', color: 'bg-gray-600' },
  }

  const config = status ? (statusConfig[status] || { label: status || 'Indefinido', color: 'bg-zinc-600' }) : { label: status || 'Indefinido', color: 'bg-zinc-600' }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${config.color}`}>
      {config.label}
    </span>
  )
}
