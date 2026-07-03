'use client'

import { Flame, Target, TrendingUp, CalendarCheck, Trophy, Eye } from 'lucide-react'
import { useDesafio100 } from '@/lib/hooks/use-desafio-100'

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.0', '')}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace('.0', '')}k`
  return String(n)
}
function pct(x: number) {
  return `${Math.round(x * 100)}%`
}
function fmtBR(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

export function Desafio100Dias({ variante = 'full' }: { variante?: 'full' | 'faixa' }) {
  const { data: d, isLoading } = useDesafio100()

  if (isLoading || !d) {
    return <div className="h-40 animate-pulse rounded-2xl bg-zinc-900/50" />
  }

  const fimIso = new Date(new Date(d.inicio + 'T12:00:00').getTime() + (d.metaDias - 1) * 86_400_000)
  const fim = `${String(fimIso.getDate()).padStart(2, '0')}/${String(fimIso.getMonth() + 1).padStart(2, '0')}`
  const consistenciaCor = d.consistencia >= 0.85 ? 'text-emerald-400' : d.consistencia >= 0.6 ? 'text-amber-400' : 'text-red-400'
  const sequenciaCor = d.publicouHoje ? 'text-orange-400' : 'text-zinc-500'

  // trilha compacta: últimos 30 dias corridos
  const trilha = d.serie.slice(-30)

  return (
    <div className="overflow-hidden rounded-2xl border border-violet-500/20 bg-linear-to-br from-violet-950/40 via-zinc-900/60 to-zinc-900/60 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-violet-300">
            <Target className="h-3.5 w-3.5" /> Desafio dos 100 Dias
          </div>
          <div className="mt-1 flex items-end gap-2">
            <span className="bg-linear-to-r from-violet-300 to-fuchsia-300 bg-clip-text text-4xl sm:text-5xl font-black text-transparent tabular-nums">
              Dia {d.diaAtual}
            </span>
            <span className="mb-1 text-lg font-bold text-zinc-500">/ {d.metaDias}</span>
          </div>
          <p className="mt-0.5 text-xs text-zinc-400">
            {d.diasRestantes > 0 ? `faltam ${d.diasRestantes} dias · meta em ${fim}` : 'desafio concluído 🏁'} · começou {fmtBR(d.inicio)}
          </p>
        </div>

        {/* sequência em destaque */}
        <div className="flex items-center gap-2 rounded-xl border border-orange-500/20 bg-orange-500/5 px-4 py-2">
          <Flame className={`h-6 w-6 ${sequenciaCor}`} />
          <div>
            <div className={`text-2xl font-black tabular-nums ${sequenciaCor}`}>{d.sequenciaAtual}</div>
            <div className="text-[10px] uppercase tracking-wide text-zinc-500">
              {d.publicouHoje ? 'dias seguidos' : 'sequência (poste hoje!)'}
            </div>
          </div>
        </div>
      </div>

      {/* barra de progresso */}
      <div className="mt-4">
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-800">
          <div className="h-full rounded-full bg-linear-to-r from-violet-500 to-fuchsia-500 transition-all" style={{ width: pct(d.progresso) }} />
        </div>
      </div>

      {/* trilha dia-a-dia (últimos 30 dias corridos) */}
      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-[11px] text-zinc-500">
          <span>Trilha (últimos {trilha.length} dias)</span>
          <span>{d.diasComPublicacao}/{d.diasCorridos} dias com publicação</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {trilha.map((s) => (
            <div
              key={s.data}
              title={`${fmtBR(s.data)} · ${s.videos} vídeo${s.videos === 1 ? '' : 's'}`}
              className={`h-4 w-4 rounded-sm ${
                s.videos >= d.alvoDia
                  ? 'bg-emerald-500'
                  : s.videos >= 1
                    ? 'bg-emerald-500/40'
                    : 'bg-red-500/25 ring-1 ring-inset ring-red-500/40'
              }`}
            />
          ))}
        </div>
      </div>

      {variante === 'full' && (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat icon={<CalendarCheck className="h-3.5 w-3.5" />} label="Consistência" value={pct(d.consistencia)} cls={consistenciaCor} />
          <Stat icon={<Trophy className="h-3.5 w-3.5" />} label="Melhor sequência" value={`${d.melhorSequencia}d`} cls="text-amber-300" />
          <Stat icon={<TrendingUp className="h-3.5 w-3.5" />} label="Vídeos publicados" value={String(d.videosPublicados)} cls="text-white" sub={`~${d.projecaoVideos} até o dia 100`} />
          <Stat icon={<Eye className="h-3.5 w-3.5" />} label="Views acumuladas" value={fmt(d.viewsAcumuladas)} cls="text-white" sub={`~${fmt(d.projecaoViews)} até o dia 100`} />
        </div>
      )}
    </div>
  )
}

function Stat({ icon, label, value, cls, sub }: { icon: React.ReactNode; label: string; value: string; cls: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-3">
      <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">{icon} {label}</div>
      <div className={`mt-1 text-xl font-bold tabular-nums ${cls}`}>{value}</div>
      {sub && <div className="mt-0.5 text-[10px] text-zinc-600">{sub}</div>}
    </div>
  )
}
