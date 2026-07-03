'use client'

import { GraduationCap, FlaskConical, Target as TargetIcon, Ruler, Trophy } from 'lucide-react'

import { ErrorState } from '@/components/ui/error-state'
import { useTrilha, COLUNAS, type Experimento, type StatusExp } from '@/lib/hooks/use-trilha'

const CAT_COR: Record<string, string> = {
  Conversão: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
  Monetização: 'bg-amber-500/15 text-amber-300 ring-amber-500/30',
  Distribuição: 'bg-sky-500/15 text-sky-300 ring-sky-500/30',
  Esteira: 'bg-violet-500/15 text-violet-300 ring-violet-500/30',
  Qualidade: 'bg-pink-500/15 text-pink-300 ring-pink-500/30',
}
const COL_ACCENT: Record<StatusExp, string> = {
  proximo: 'border-amber-500/25',
  rodando: 'border-sky-500/25',
  aprendido: 'border-emerald-500/25',
}

function Card({ e }: { e: Experimento }) {
  return (
    <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-zinc-100">{e.titulo}</h3>
        <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ring-1 ${CAT_COR[e.cat] || 'bg-zinc-700/40 text-zinc-300'}`}>{e.cat}</span>
      </div>

      <div className="mt-2.5 space-y-1.5 text-xs">
        <p className="flex gap-1.5 text-zinc-400">
          <FlaskConical className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-600" />
          <span><b className="text-zinc-500">Hipótese:</b> {e.hipotese}</span>
        </p>
        <p className="flex gap-1.5 text-zinc-400">
          <TargetIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-600" />
          <span><b className="text-zinc-500">Muda:</b> {e.muda}</span>
        </p>
        <p className="flex gap-1.5 text-zinc-400">
          <Ruler className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-600" />
          <span><b className="text-zinc-500">Métrica:</b> {e.metrica}</span>
        </p>
      </div>

      {e.resultado && (
        <p className="mt-2.5 flex gap-1.5 rounded-lg bg-emerald-500/5 p-2 text-xs text-emerald-200/90">
          <Trophy className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
          <span><b>Aprendizado:</b> {e.resultado}</span>
        </p>
      )}
    </div>
  )
}

export default function AprendizadoPage() {
  const { data, isLoading, isError, refetch } = useTrilha()

  if (isError) {
    return (
      <div className="min-h-screen bg-zinc-950 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <ErrorState title="Erro ao carregar a trilha" message="Tente novamente." onRetry={() => refetch()} />
        </div>
      </div>
    )
  }

  const porStatus = (s: StatusExp) => (data ?? []).filter((e) => e.status === s)

  return (
    <div className="min-h-screen bg-zinc-950 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <div className="mb-1 flex items-center gap-3">
            <GraduationCap className="h-7 w-7 text-violet-400" />
            <h1 className="bg-linear-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-3xl font-black text-transparent sm:text-4xl">
              Aprendizado
            </h1>
          </div>
          <p className="text-zinc-400">
            Cada melhoria é um experimento: hipótese → o que muda → métrica → resultado. O diário de bordo dos 100 dias.
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-3">
            {[0, 1, 2].map((i) => <div key={i} className="h-64 animate-pulse rounded-2xl bg-zinc-900/50" />)}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {COLUNAS.map((col) => {
              const itens = porStatus(col.status)
              return (
                <div key={col.status} className={`rounded-2xl border ${COL_ACCENT[col.status]} bg-zinc-900/20 p-3`}>
                  <div className="mb-3 flex items-center justify-between px-1">
                    <h2 className="text-sm font-bold text-white">{col.emoji} {col.label}</h2>
                    <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs font-bold text-zinc-400">{itens.length}</span>
                  </div>
                  <div className="space-y-3">
                    {itens.length > 0 ? itens.map((e) => <Card key={e.id} e={e} />) : (
                      <p className="rounded-xl bg-zinc-900/40 py-8 text-center text-xs text-zinc-600">vazio</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
