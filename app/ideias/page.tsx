'use client'

import { useIdeias, useIdeiasStats } from '@/lib/hooks/use-ideias'
import { useCanais } from '@/lib/hooks/use-core'
import Link from 'next/link'
import { useState } from 'react'

export default function IdeiasPage() {
  const { data: ideias, isLoading } = useIdeias()
  const { data: stats } = useIdeiasStats()
  const { data: canais } = useCanais()
  
  const [filtroStatus, setFiltroStatus] = useState<string>('TODOS')
  const [filtroCanal, setFiltroCanal] = useState<string>('TODOS')
  const [busca, setBusca] = useState('')

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
          <div className="text-zinc-400">Carregando ideias...</div>
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
            <h1 className="text-3xl font-bold text-white mb-2">💡 Ideias</h1>
            <p className="text-zinc-400">
              {stats?.total || 0} ideias cadastradas
            </p>
          </div>
          
          <Link
            href="/ideias/nova"
            className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            + Nova Ideia
          </Link>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
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
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
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
                          <div className="text-white font-medium">{ideia.titulo}</div>
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

  const config = status ? statusConfig[status] : { label: status || 'Indefinido', color: 'bg-zinc-600' }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${config.color}`}>
      {config.label}
    </span>
  )
}
