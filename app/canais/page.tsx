'use client'

import Link from 'next/link'
import { Eye, Heart, FileText, Layers, ExternalLink, TrendingUp, Film } from 'lucide-react'

import { ErrorState } from '@/components/ui/error-state'
import { useCanais } from '@/lib/hooks/use-core'
import { useIdeias } from '@/lib/hooks/use-ideias'
import { useCanaisReais } from '@/lib/hooks/use-canais-reais'
import type { Database } from '@/lib/supabase/database.types'

type Canal = Database['pulso_core']['Tables']['canais']['Row']
type Ideia = Database['pulso_content']['Tables']['ideias']['Row']

const COR: Record<string, string> = {
  youtube: 'from-red-500/20 to-red-600/5 border-red-500/30 text-red-400',
  instagram: 'from-pink-500/20 to-purple-600/5 border-pink-500/30 text-pink-400',
  tiktok: 'from-cyan-500/20 to-zinc-600/5 border-cyan-500/30 text-cyan-300',
  facebook: 'from-blue-500/20 to-blue-700/5 border-blue-500/30 text-blue-400',
}

function fmt(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace('.0', '')}k`
  return String(n)
}

export default function CanaisPage() {
  const { data: reais, isLoading: loadingReais, isError, refetch } = useCanaisReais()
  const { data: canais } = useCanais()
  const { data: ideias } = useIdeias()

  if (isError) {
    return (
      <div className="min-h-screen bg-zinc-950 p-8">
        <div className="mx-auto max-w-7xl">
          <ErrorState title="Erro ao carregar canais" message="Nao foi possivel listar os canais." onRetry={() => refetch()} />
        </div>
      </div>
    )
  }

  const totalViews = (reais ?? []).reduce((s, c) => s + c.views, 0)
  const totalPosts = (reais ?? []).reduce((s, c) => s + c.posts, 0)
  const totalLikes = (reais ?? []).reduce((s, c) => s + c.likes, 0)

  const ideiasPerCanal = (ideias ?? []).reduce((acc, ideia: Ideia) => {
    if (ideia.canal_id) acc[ideia.canal_id] = (acc[ideia.canal_id] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <div className="mb-2 flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-pink-500 animate-pulse" />
            <h1 className="bg-linear-to-r from-pink-400 via-rose-400 to-pink-400 bg-clip-text text-4xl font-black text-transparent">Canais</h1>
          </div>
          <p className="text-zinc-400">Desempenho real das 4 contas + verticais de conteúdo.</p>
        </div>

        {/* totais reais */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/40 p-5">
            <div className="flex items-center gap-2 text-xs text-zinc-500"><Eye className="h-3.5 w-3.5" /> Views totais</div>
            <p className="mt-1 text-3xl font-bold text-white tabular-nums">{fmt(totalViews)}</p>
          </div>
          <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/40 p-5">
            <div className="flex items-center gap-2 text-xs text-zinc-500"><Film className="h-3.5 w-3.5" /> Publicações</div>
            <p className="mt-1 text-3xl font-bold text-white tabular-nums">{totalPosts}</p>
          </div>
          <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/40 p-5">
            <div className="flex items-center gap-2 text-xs text-zinc-500"><Heart className="h-3.5 w-3.5" /> Likes totais</div>
            <p className="mt-1 text-3xl font-bold text-white tabular-nums">{fmt(totalLikes)}</p>
          </div>
        </div>

        {/* 4 contas reais */}
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-zinc-400">Contas (desempenho real)</h2>
        <div className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {loadingReais && [1, 2, 3, 4].map((i) => <div key={i} className="h-52 animate-pulse rounded-xl bg-zinc-900/50" />)}
          {(reais ?? []).map((c) => (
            <a key={c.plataforma} href={c.url} target="_blank" rel="noreferrer"
              className={`group rounded-xl border bg-linear-to-br p-5 transition-all hover:scale-[1.02] ${COR[c.plataforma] || 'border-zinc-700'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">{c.nome}</h3>
                  <p className="text-xs text-zinc-400">{c.handle}</p>
                </div>
                <ExternalLink className="h-4 w-4 text-zinc-500 transition-colors group-hover:text-white" />
              </div>
              <div className="mt-4 flex items-end gap-1">
                <span className="text-3xl font-black text-white tabular-nums">{fmt(c.views)}</span>
                <span className="mb-1 text-xs text-zinc-400">views</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/5 pt-3 text-xs">
                <div><span className="text-zinc-500">Posts</span> <b className="text-zinc-200">{c.posts}</b></div>
                <div><span className="text-zinc-500">Média</span> <b className="text-zinc-200">{fmt(c.mediaViews)}</b></div>
                <div><span className="text-zinc-500">Likes</span> <b className="text-zinc-200">{fmt(c.likes)}</b></div>
                <div><span className="text-zinc-500">Engaj.</span> <b className="text-zinc-200">{c.engajamento}%</b></div>
              </div>
              {c.melhor && (
                <div className="mt-3 flex items-center gap-1.5 border-t border-white/5 pt-3 text-[11px] text-zinc-400">
                  <TrendingUp className="h-3 w-3 shrink-0 text-emerald-400" />
                  <span className="truncate">{c.melhor.titulo}</span>
                  <span className="ml-auto shrink-0 font-bold text-emerald-400">{fmt(c.melhor.views)}</span>
                </div>
              )}
            </a>
          ))}
        </div>

        {/* verticais de conteúdo */}
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-zinc-400">
          <Layers className="h-4 w-4" /> Verticais de conteúdo <span className="font-normal normal-case text-zinc-600">— organização interna do funil</span>
        </h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {(canais ?? []).map((canal: Canal) => (
            <Link key={canal.id} href={`/canais/${canal.slug}`}
              className="group flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 transition-all hover:border-purple-600/50">
              <div className="min-w-0">
                <h3 className="truncate font-semibold text-white transition-colors group-hover:text-purple-400">{canal.nome}</h3>
                {canal.descricao && <p className="truncate text-xs text-zinc-500">{canal.descricao}</p>}
              </div>
              <div className="ml-3 shrink-0 text-right">
                <p className="text-lg font-bold text-white tabular-nums">{ideiasPerCanal[canal.id] || 0}</p>
                <p className="flex items-center gap-1 text-[10px] text-zinc-500"><FileText className="h-2.5 w-2.5" /> ideias</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
