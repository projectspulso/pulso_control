'use client'

import Link from 'next/link'
import { FileText, Megaphone, Plus, TrendingUp, Video } from 'lucide-react'

import { ErrorState } from '@/components/ui/error-state'
import { useCanais } from '@/lib/hooks/use-core'
import { useIdeias } from '@/lib/hooks/use-ideias'
import type { Database } from '@/lib/supabase/database.types'

type Canal = Database['pulso_core']['Tables']['canais']['Row']
type Ideia = Database['pulso_content']['Tables']['ideias']['Row']

export default function CanaisPage() {
  const { data: canais, isLoading: loadingCanais, isError, refetch } = useCanais()
  const { data: ideias } = useIdeias()

  if (loadingCanais) {
    return (
      <div className="p-8">
        <div className="space-y-4 animate-pulse">
          <div className="h-8 w-1/4 rounded bg-zinc-800" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-48 rounded bg-zinc-800" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-zinc-950 p-8">
        <div className="mx-auto max-w-7xl">
          <ErrorState
            title="Erro ao carregar canais"
            message="Nao foi possivel listar os canais. Tente novamente."
            onRetry={() => refetch()}
          />
        </div>
      </div>
    )
  }

  const ideiasPerCanal = (ideias ?? []).reduce((acc, ideia: Ideia) => {
    if (!ideia.canal_id) {
      return acc
    }

    if (!acc[ideia.canal_id]) {
      acc[ideia.canal_id] = 0
    }

    acc[ideia.canal_id] += 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 animate-fade-in">
          <div className="mb-2 flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-pink-500 animate-pulse-glow" />
            <h1 className="text-4xl font-black bg-linear-to-r from-pink-400 via-rose-400 to-pink-400 bg-clip-text text-transparent">
              Canais
            </h1>
          </div>
          <p className="text-zinc-400">Gerencie seus canais de conteudo.</p>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="group relative overflow-hidden rounded-xl border border-zinc-800/50 p-6 transition-all hover:border-purple-500/30">
            <div className="absolute inset-0 bg-purple-600/10 opacity-0 blur-xl transition-all duration-300 group-hover:opacity-100" />
            <div className="relative z-10 mb-2 flex items-center gap-3">
              <Megaphone className="h-5 w-5 text-purple-400" />
              <span className="text-sm text-zinc-400">Total de canais</span>
            </div>
            <p className="relative z-10 text-3xl font-bold text-white tabular-nums">
              {canais?.length || 0}
            </p>
          </div>

          <div className="group relative overflow-hidden rounded-xl border border-zinc-800/50 p-6 transition-all hover:border-blue-500/30">
            <div className="absolute inset-0 bg-blue-600/10 opacity-0 blur-xl transition-all duration-300 group-hover:opacity-100" />
            <div className="relative z-10 mb-2 flex items-center gap-3">
              <FileText className="h-5 w-5 text-blue-400" />
              <span className="text-sm text-zinc-400">Total de ideias</span>
            </div>
            <p className="relative z-10 text-3xl font-bold text-white tabular-nums">
              {ideias?.length || 0}
            </p>
          </div>

          <div className="group relative overflow-hidden rounded-xl border border-zinc-800/50 p-6 transition-all hover:border-green-500/30">
            <div className="absolute inset-0 bg-green-600/10 opacity-0 blur-xl transition-all duration-300 group-hover:opacity-100" />
            <div className="relative z-10 mb-2 flex items-center gap-3">
              <Video className="h-5 w-5 text-green-400" />
              <span className="text-sm text-zinc-400">Conteudos ativos</span>
            </div>
            <p className="relative z-10 text-3xl font-bold text-white tabular-nums">
              0
            </p>
          </div>

          <div className="group relative overflow-hidden rounded-xl border border-zinc-800/50 p-6 transition-all hover:border-yellow-500/30">
            <div className="absolute inset-0 bg-yellow-600/10 opacity-0 blur-xl transition-all duration-300 group-hover:opacity-100" />
            <div className="relative z-10 mb-2 flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-yellow-400" />
              <span className="text-sm text-zinc-400">Crescimento</span>
            </div>
            <p className="relative z-10 text-3xl font-bold text-white tabular-nums">
              +0%
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {canais?.map((canal: Canal) => {
            const totalIdeias = ideiasPerCanal[canal.id] || 0

            return (
              <Link
                key={canal.id}
                href={`/canais/${canal.slug}`}
                className="group rounded-lg border border-zinc-800 bg-zinc-900 p-6 transition-all hover:border-purple-600"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white transition-colors group-hover:text-purple-400">
                      {canal.nome}
                    </h3>
                    {canal.descricao && (
                      <p className="mt-1 line-clamp-2 text-sm text-zinc-400">
                        {canal.descricao}
                      </p>
                    )}
                  </div>
                  <Megaphone className="h-6 w-6 text-purple-500" />
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-zinc-800 pt-4">
                  <div>
                    <p className="text-2xl font-bold text-white">{totalIdeias}</p>
                    <p className="text-xs text-zinc-500">Ideias</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">0</p>
                    <p className="text-xs text-zinc-500">Publicados</p>
                  </div>
                </div>

                {canal.status === 'ATIVO' && (
                  <div className="mt-4 border-t border-zinc-800 pt-4">
                    <span className="inline-flex items-center gap-1 text-xs text-green-400">
                      <span className="h-2 w-2 rounded-full bg-green-400" />
                      Ativo
                    </span>
                  </div>
                )}
              </Link>
            )
          })}

          <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-900 p-6">
            <Plus className="h-8 w-8 text-zinc-600" />
            <span className="text-sm text-zinc-500">
              Cadastro de novo canal em breve
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
