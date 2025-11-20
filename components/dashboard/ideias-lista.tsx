'use client'

import { useIdeias } from '@/lib/hooks/use-ideias'
import { formatDate } from '@/lib/utils'
import { Clock, CheckCircle2, Circle, AlertCircle } from 'lucide-react'

const statusConfig = {
  'RASCUNHO': { label: 'Rascunho', color: 'text-gray-400', icon: Circle },
  'APROVADA': { label: 'Aprovada', color: 'text-green-400', icon: CheckCircle2 },
  'EM_PRODUCAO': { label: 'Em Produção', color: 'text-yellow-400', icon: Clock },
  'CONCLUIDA': { label: 'Concluída', color: 'text-blue-400', icon: CheckCircle2 },
  'ARQUIVADA': { label: 'Arquivada', color: 'text-gray-500', icon: AlertCircle }
}

export function IdeiasLista() {
  const { data: ideias, isLoading } = useIdeias()

  if (isLoading) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-zinc-800 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-zinc-800 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!ideias || !Array.isArray(ideias)) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
        <p className="text-zinc-400 text-center">Nenhuma ideia encontrada</p>
      </div>
    )
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg">
      <div className="p-6 border-b border-zinc-800">
        <h2 className="text-xl font-bold text-white">Ideias Recentes</h2>
        <p className="text-sm text-zinc-400 mt-1">{ideias.length} ideias no total</p>
      </div>
      
      <div className="divide-y divide-zinc-800">
        {ideias.slice(0, 10).map((ideia) => {
          const status = statusConfig[ideia.status as keyof typeof statusConfig] || statusConfig.RASCUNHO
          const StatusIcon = status.icon
          
          return (
            <div 
              key={ideia.id}
              className="p-4 hover:bg-zinc-800/50 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-white mb-1">{ideia.titulo}</h3>
                  <p className="text-sm text-zinc-400 line-clamp-2">
                    {ideia.descricao || 'Sem descrição'}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    {ideia.canal && (
                      <span className="text-xs text-zinc-500">
                        Canal: {ideia.canal.nome}
                      </span>
                    )}
                    {ideia.serie && (
                      <span className="text-xs text-zinc-500">
                        Série: {ideia.serie.nome}
                      </span>
                    )}
                    <span className="text-xs text-zinc-600">
                      {formatDate(ideia.created_at)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <StatusIcon className={`w-5 h-5 ${status.color}`} />
                  <span className={`text-xs font-medium ${status.color}`}>
                    {status.label}
                  </span>
                </div>
              </div>
              {ideia.tags && ideia.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {ideia.tags.map((tag) => (
                    <span 
                      key={tag}
                      className="text-xs px-2 py-1 bg-purple-500/10 text-purple-400 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
