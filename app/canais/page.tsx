'use client'

import { useCanais } from '@/lib/hooks/use-core'
import { useIdeias } from '@/lib/hooks/use-ideias'
import Link from 'next/link'
import { Megaphone, Plus, TrendingUp, FileText, Video } from 'lucide-react'

export default function CanaisPage() {
  const { data: canais, isLoading: loadingCanais } = useCanais()
  const { data: ideias } = useIdeias()

  if (loadingCanais) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-zinc-800 rounded w-1/4"></div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-zinc-800 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Contar ideias por canal
  const ideiasPerCanal = ideias?.reduce((acc: any, ideia: any) => {
    const canalId = ideia.canal_id
    if (!acc[canalId]) acc[canalId] = 0
    acc[canalId]++
    return acc
  }, {}) || {}

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Canais</h1>
        <p className="text-zinc-400">Gerencie seus canais de conteúdo</p>
      </div>

      {/* Stats gerais */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <Megaphone className="h-5 w-5 text-purple-500" />
            <span className="text-sm text-zinc-400">Total de Canais</span>
          </div>
          <p className="text-3xl font-bold text-white">{canais?.length || 0}</p>
        </div>
        
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="h-5 w-5 text-blue-500" />
            <span className="text-sm text-zinc-400">Total de Ideias</span>
          </div>
          <p className="text-3xl font-bold text-white">{ideias?.length || 0}</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <Video className="h-5 w-5 text-green-500" />
            <span className="text-sm text-zinc-400">Conteúdos Ativos</span>
          </div>
          <p className="text-3xl font-bold text-white">0</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-5 w-5 text-yellow-500" />
            <span className="text-sm text-zinc-400">Crescimento</span>
          </div>
          <p className="text-3xl font-bold text-white">+0%</p>
        </div>
      </div>

      {/* Lista de canais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {canais?.map((canal: any) => {
          const totalIdeias = ideiasPerCanal[canal.id] || 0

          return (
            <Link
              key={canal.id}
              href={`/canais/${canal.slug}`}
              className="group bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-purple-600 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors">
                    {canal.nome}
                  </h3>
                  {canal.descricao && (
                    <p className="text-sm text-zinc-400 mt-1 line-clamp-2">
                      {canal.descricao}
                    </p>
                  )}
                </div>
                <Megaphone className="h-6 w-6 text-purple-500" />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-800">
                <div>
                  <p className="text-2xl font-bold text-white">{totalIdeias}</p>
                  <p className="text-xs text-zinc-500">Ideias</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">0</p>
                  <p className="text-xs text-zinc-500">Publicados</p>
                </div>
              </div>

              {canal.ativo && (
                <div className="mt-4 pt-4 border-t border-zinc-800">
                  <span className="inline-flex items-center gap-1 text-xs text-green-400">
                    <span className="h-2 w-2 rounded-full bg-green-400"></span>
                    Ativo
                  </span>
                </div>
              )}
            </Link>
          )
        })}

        {/* Card para adicionar novo canal */}
        <button className="bg-zinc-900 border-2 border-dashed border-zinc-700 rounded-lg p-6 hover:border-purple-600 transition-all flex flex-col items-center justify-center gap-3 min-h-[200px]">
          <Plus className="h-8 w-8 text-zinc-600" />
          <span className="text-sm text-zinc-500">Adicionar novo canal</span>
        </button>
      </div>
    </div>
  )
}
