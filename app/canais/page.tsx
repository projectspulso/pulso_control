'use client'

import { useCanais } from '@/lib/hooks/use-core'
import { useIdeias } from '@/lib/hooks/use-ideias'
import Link from 'next/link'
import { Megaphone, Plus, TrendingUp, FileText, Video } from 'lucide-react'
import { ErrorState } from '@/components/ui/error-state'

export default function CanaisPage() {
  const { data: canais, isLoading: loadingCanais, isError, refetch } = useCanais()
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

  if (isError) {
    return (
      <div className="min-h-screen bg-zinc-950 p-8">
        <div className="max-w-7xl mx-auto">
          <ErrorState 
            title="Erro ao carregar canais" 
            message="Não foi possível listar os canais. Tente novamente."
            onRetry={() => refetch()}
          />
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
    <div className="min-h-screen bg-zinc-950 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse-glow" />
            <h1 className="text-4xl font-black bg-gradient-to-r from-pink-400 via-rose-400 to-pink-400 bg-clip-text text-transparent">
              📢 Canais
            </h1>
          </div>
          <p className="text-zinc-400">Gerencie seus canais de conteúdo</p>
        </div>

        {/* Stats gerais */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="glass border border-zinc-800/50 rounded-xl p-6 hover:border-purple-500/30 transition-all group relative overflow-hidden animate-fade-in">
            <div className="absolute inset-0 bg-purple-600/10 blur-xl opacity-0 group-hover:opacity-100 transition-all duration-300" />
            <div className="flex items-center gap-3 mb-2 relative z-10">
              <Megaphone className="h-5 w-5 text-purple-400" />
              <span className="text-sm text-zinc-400">Total de Canais</span>
            </div>
            <p className="text-3xl font-bold text-white relative z-10 tabular-nums">{canais?.length || 0}</p>
          </div>
          
          <div className="glass border border-zinc-800/50 rounded-xl p-6 hover:border-blue-500/30 transition-all group relative overflow-hidden animate-fade-in" style={{ animationDelay: "100ms" }}>
            <div className="absolute inset-0 bg-blue-600/10 blur-xl opacity-0 group-hover:opacity-100 transition-all duration-300" />
            <div className="flex items-center gap-3 mb-2 relative z-10">
              <FileText className="h-5 w-5 text-blue-400" />
              <span className="text-sm text-zinc-400">Total de Ideias</span>
            </div>
            <p className="text-3xl font-bold text-white relative z-10 tabular-nums">{ideias?.length || 0}</p>
          </div>

          <div className="glass border border-zinc-800/50 rounded-xl p-6 hover:border-green-500/30 transition-all group relative overflow-hidden animate-fade-in" style={{ animationDelay: "200ms" }}>
            <div className="absolute inset-0 bg-green-600/10 blur-xl opacity-0 group-hover:opacity-100 transition-all duration-300" />
            <div className="flex items-center gap-3 mb-2 relative z-10">
              <Video className="h-5 w-5 text-green-400" />
              <span className="text-sm text-zinc-400">Conteúdos Ativos</span>
            </div>
            <p className="text-3xl font-bold text-white relative z-10 tabular-nums">0</p>
          </div>

          <div className="glass border border-zinc-800/50 rounded-xl p-6 hover:border-yellow-500/30 transition-all group relative overflow-hidden animate-fade-in" style={{ animationDelay: "300ms" }}>
            <div className="absolute inset-0 bg-yellow-600/10 blur-xl opacity-0 group-hover:opacity-100 transition-all duration-300" />
            <div className="flex items-center gap-3 mb-2 relative z-10">
              <TrendingUp className="h-5 w-5 text-yellow-400" />
              <span className="text-sm text-zinc-400">Crescimento</span>
            </div>
            <p className="text-3xl font-bold text-white relative z-10 tabular-nums">+0%</p>
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
    </div>
  )
}
