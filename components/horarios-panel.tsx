'use client'

import { Clock } from 'lucide-react'

import { useHorarios } from '@/lib/hooks/use-horarios'

export function HorariosPanel() {
  const { data, isLoading } = useHorarios()
  if (isLoading || !data) return null

  const maxMedia = Math.max(1, ...data.porHora.map((h) => h.media))
  const cobertura = data.total ? Math.round((data.comHora / data.total) * 100) : 0

  return (
    <div className="glass rounded-2xl border border-zinc-800/50 p-5">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Clock className="h-4 w-4 text-cyan-300" />
        <h2 className="text-sm font-bold text-white">Onde os views nascem — por hora de publicação</h2>
        <span className="ml-auto text-[11px] text-zinc-500">{data.comHora}/{data.total} posts com hora real ({cobertura}%)</span>
      </div>

      {data.melhores.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold text-cyan-300">Melhores horas:</span>
          {data.melhores.map((h) => (
            <span key={h.hora} className="rounded-full bg-cyan-500/15 px-2 py-0.5 text-[10px] font-semibold text-cyan-200">
              {String(h.hora).padStart(2, '0')}h · <b>{h.media}</b> média ({h.posts}p)
            </span>
          ))}
        </div>
      )}

      {data.porHora.length === 0 ? (
        <p className="text-sm text-zinc-500">Sem hora real ainda — as próximas publicações vão carimbar a hora e isso enche.</p>
      ) : (
        <div className="space-y-1">
          {data.porHora.map((h) => (
            <div key={h.hora} className="flex items-center gap-2">
              <span className="w-9 shrink-0 text-right font-mono text-[11px] text-zinc-400">{String(h.hora).padStart(2, '0')}h</span>
              <div className="h-4 flex-1 overflow-hidden rounded bg-zinc-900/60">
                <div className="h-full rounded bg-linear-to-r from-cyan-600 to-cyan-400" style={{ width: `${(h.media / maxMedia) * 100}%` }} />
              </div>
              <span className="w-28 shrink-0 text-right text-[11px] tabular-nums text-zinc-300">{h.media} <span className="text-zinc-600">média · {h.posts}p</span></span>
            </div>
          ))}
        </div>
      )}
      <p className="mt-3 text-[11px] text-zinc-500">Hora real de publicação (Brasília), das APIs das redes. Vira insumo da agenda inteligente — publicar nas horas que mais rendem.</p>
    </div>
  )
}
