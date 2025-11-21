'use client'

import { useRoteiros, useRoteirosStats } from '@/lib/hooks/use-roteiros'
import { useCanais } from '@/lib/hooks/use-core'
import Link from 'next/link'
import { useState } from 'react'

export default function RoteirosPage() {
  const { data: roteiros, isLoading } = useRoteiros()
  const { data: stats } = useRoteirosStats()
  const { data: canais } = useCanais()
  
  const [filtroStatus, setFiltroStatus] = useState<string>('TODOS')
  const [filtroCanal, setFiltroCanal] = useState<string>('TODOS')
  const [busca, setBusca] = useState('')

  const roteirosFiltrados = roteiros?.filter(roteiro => {
    const matchStatus = filtroStatus === 'TODOS' || roteiro.status === filtroStatus
    const matchCanal = filtroCanal === 'TODOS' || roteiro.canal_id === filtroCanal
    const matchBusca = !busca || 
      roteiro.roteiro_titulo?.toLowerCase().includes(busca.toLowerCase()) ||
      roteiro.conteudo_md?.toLowerCase().includes(busca.toLowerCase())
    
    return matchStatus && matchCanal && matchBusca
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-zinc-400">Carregando roteiros...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">📝 Roteiros</h1>
            <p className="text-zinc-400">
              {stats?.total || 0} roteiros gerados
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && stats.por_status && Object.keys(stats.por_status).length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
            {Object.entries(stats.por_status).map(([status, count]) => (
              <div
                key={status}
                className="bg-zinc-900 border border-zinc-800 rounded-lg p-4"
              >
                <div className="text-2xl font-bold text-white mb-1">{count}</div>
                <div className="text-xs text-zinc-400">{status}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filtros */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          </div>
        </div>

        {/* Grid de Roteiros */}
        {roteirosFiltrados && roteirosFiltrados.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-12 text-center">
            <p className="text-zinc-500 mb-4">Nenhum roteiro encontrado</p>
            <p className="text-sm text-zinc-600">
              Roteiros são gerados automaticamente a partir de ideias aprovadas
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roteirosFiltrados?.map((roteiro) => {
              const canal = canais?.find(c => c.id === roteiro.canal_id)
              
              return (
                <Link
                  key={roteiro.id}
                  href={`/roteiros/${roteiro.id}`}
                  className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-violet-500 transition-colors group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <StatusBadge status={roteiro.status} />
                    <span className="text-xs text-zinc-500">
                      v{roteiro.versao || 1}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-violet-400 transition-colors line-clamp-2">
                    {roteiro.roteiro_titulo || 'Sem título'}
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

  const config = status ? statusConfig[status] : { label: 'Indefinido', color: 'bg-zinc-600' }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${config.color}`}>
      {config.label}
    </span>
  )
}
