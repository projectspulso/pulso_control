'use client'

import { useParams } from 'next/navigation'
import { useCanais } from '@/lib/hooks/use-core'
import { useIdeias } from '@/lib/hooks/use-ideias'
import { ArrowLeft, Plus, Filter } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

const STATUS_CONFIG = {
  RASCUNHO: { label: 'Rascunho', color: 'bg-zinc-500' },
  NOVA: { label: 'Nova', color: 'bg-blue-500' },
  EM_ANALISE: { label: 'Em Análise', color: 'bg-yellow-500' },
  APROVADA: { label: 'Aprovada', color: 'bg-green-500' },
  REJEITADA: { label: 'Rejeitada', color: 'bg-red-500' },
  EM_PRODUCAO: { label: 'Em Produção', color: 'bg-purple-500' },
  ARQUIVADA: { label: 'Arquivada', color: 'bg-gray-500' }
}

export default function CanalPage() {
  const params = useParams()
  const slug = params?.slug as string
  const { data: canais } = useCanais()
  const { data: allIdeias } = useIdeias()
  const [statusFilter, setStatusFilter] = useState<string>('TODAS')

  const canal = canais?.find((c: any) => c.slug === slug)
  const ideias = allIdeias?.filter((i: any) => i.canal_id === canal?.id)

  const ideiasFiltered = statusFilter === 'TODAS' 
    ? ideias 
    : ideias?.filter((i: any) => i.status === statusFilter)

  // Stats do canal
  const stats = ideias?.reduce((acc: any, ideia: any) => {
    acc[ideia.status] = (acc[ideia.status] || 0) + 1
    return acc
  }, {}) || {}

  if (!canal) {
    return (
      <div className="p-8">
        <p className="text-zinc-400">Canal não encontrado</p>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <Link 
          href="/canais"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para Canais
        </Link>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{canal.nome}</h1>
            {canal.descricao && (
              <p className="text-zinc-400">{canal.descricao}</p>
            )}
          </div>
          <button className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors">
            <Plus className="h-4 w-4" />
            Nova Ideia
          </button>
        </div>
      </div>

      {/* Stats do canal */}
      <div className="grid grid-cols-6 gap-4 mb-8">
        <button
          onClick={() => setStatusFilter('TODAS')}
          className={`bg-zinc-900 border ${statusFilter === 'TODAS' ? 'border-purple-600' : 'border-zinc-800'} rounded-lg p-4 hover:border-zinc-700 transition-colors`}
        >
          <p className="text-2xl font-bold text-white">{ideias?.length || 0}</p>
          <p className="text-xs text-zinc-500">Total</p>
        </button>

        {Object.entries(STATUS_CONFIG).map(([status, config]) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`bg-zinc-900 border ${statusFilter === status ? 'border-purple-600' : 'border-zinc-800'} rounded-lg p-4 hover:border-zinc-700 transition-colors`}
          >
            <p className="text-2xl font-bold text-white">{stats[status] || 0}</p>
            <p className="text-xs text-zinc-500">{config.label}</p>
          </button>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <Filter className="h-4 w-4" />
          <span>Filtros:</span>
        </div>
        <div className="flex gap-2">
          {statusFilter !== 'TODAS' && (
            <button
              onClick={() => setStatusFilter('TODAS')}
              className="text-xs bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1 rounded-full transition-colors"
            >
              Limpar filtro
            </button>
          )}
        </div>
      </div>

      {/* Pipeline de ideias */}
      <div className="space-y-3">
        {ideiasFiltered?.map((ideia: any) => {
          const statusConfig = STATUS_CONFIG[ideia.status as keyof typeof STATUS_CONFIG] || { 
            label: ideia.status, 
            color: 'bg-zinc-600' 
          }
          
          return (
            <div
              key={ideia.id}
              className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-white">{ideia.titulo}</h3>
                    <span className={`${statusConfig.color} text-white text-xs px-2 py-1 rounded-full`}>
                      {statusConfig.label}
                    </span>
                  </div>
                  
                  {ideia.descricao && (
                    <p className="text-sm text-zinc-400 mb-3 line-clamp-2">
                      {ideia.descricao}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-zinc-500">
                    {ideia.prioridade && (
                      <span>Prioridade: {ideia.prioridade}</span>
                    )}
                    {ideia.created_at && (
                      <span>Criada em {new Date(ideia.created_at).toLocaleDateString('pt-BR')}</span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button className="text-sm text-zinc-400 hover:text-white px-3 py-1 rounded border border-zinc-700 hover:border-zinc-600 transition-colors">
                    Ver detalhes
                  </button>
                  {ideia.status === 'APROVADA' && (
                    <button className="text-sm bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded transition-colors">
                      Criar Roteiro
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {(!ideiasFiltered || ideiasFiltered.length === 0) && (
          <div className="text-center py-12">
            <p className="text-zinc-500">Nenhuma ideia encontrada</p>
          </div>
        )}
      </div>
    </div>
  )
}
