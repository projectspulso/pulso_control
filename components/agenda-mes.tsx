'use client'

import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { useCalendario } from '@/lib/hooks/use-calendario'

/**
 * Visão de MÊS — todos os conteúdos do pipeline plotados na data prevista.
 * Herdada da antiga /calendario (consolidada na /agenda como 3º modo).
 */

const COR: Record<string, string> = {
  PUBLICADO: 'bg-emerald-500',
  PRONTO_PUBLICACAO: 'bg-green-500',
  EM_EDICAO: 'bg-yellow-500',
  AUDIO_GERADO: 'bg-purple-500',
  ROTEIRO_PRONTO: 'bg-blue-500',
  AGUARDANDO_ROTEIRO: 'bg-zinc-500',
}
const DIAS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function AgendaMes() {
  const { data, isLoading } = useCalendario()
  const [offset, setOffset] = useState(0)

  const { titulo, dias, mes } = useMemo(() => {
    const base = new Date()
    base.setHours(0, 0, 0, 0)
    base.setDate(1)
    base.setMonth(base.getMonth() + offset)
    const titulo = base.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    const dow = base.getDay() === 0 ? 7 : base.getDay()
    const ini = new Date(base)
    ini.setDate(1 - (dow - 1))
    const dias = Array.from({ length: 42 }, (_, i) => {
      const d = new Date(ini)
      d.setDate(ini.getDate() + i)
      return d
    })
    return { titulo, dias, mes: base.getMonth() }
  }, [offset])

  const porData = useMemo(() => {
    const m = new Map<string, { titulo: string; status: string }[]>()
    for (const c of data || []) {
      const dt = c.data_publicacao_planejada || c.data_prevista
      if (!dt) continue
      const k = String(dt).slice(0, 10)
      if (!m.has(k)) m.set(k, [])
      m.get(k)!.push({ titulo: c.ideia, status: c.pipeline_status })
    }
    return m
  }, [data])

  const hoje = ymd(new Date())

  if (isLoading) return <div className="skeleton h-96 w-full rounded-2xl" />

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-center gap-4">
        <button onClick={() => setOffset((o) => o - 1)} className="rounded-lg bg-zinc-800 p-2 text-white hover:bg-zinc-700"><ChevronLeft className="h-4 w-4" /></button>
        <span className="min-w-[180px] text-center text-sm font-semibold capitalize text-zinc-200">{titulo}</span>
        <button onClick={() => setOffset((o) => o + 1)} className="rounded-lg bg-zinc-800 p-2 text-white hover:bg-zinc-700"><ChevronRight className="h-4 w-4" /></button>
        {offset !== 0 && <button onClick={() => setOffset(0)} className="rounded-lg bg-zinc-800 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-700">hoje</button>}
      </div>

      <div className="overflow-x-auto">
        <div className="grid min-w-[760px] grid-cols-7 gap-1.5">
          {DIAS.map((d) => <div key={d} className="px-1 py-1 text-center text-[11px] font-semibold text-zinc-500">{d}</div>)}
          {dias.map((d) => {
            const k = ymd(d)
            const itens = porData.get(k) || []
            const foraDoMes = d.getMonth() !== mes
            const ehHoje = k === hoje
            return (
              <div key={k} className={`min-h-[92px] rounded-lg border p-1.5 ${ehHoje ? 'border-violet-500/50 bg-violet-500/10' : foraDoMes ? 'border-zinc-900/40 bg-zinc-900/10 opacity-40' : 'border-zinc-800/60 bg-zinc-900/40'}`}>
                <div className="mb-1 text-[10px] font-semibold text-zinc-500">{d.getDate()}</div>
                <div className="space-y-1">
                  {itens.slice(0, 3).map((it, i) => (
                    <div key={i} className="flex items-center gap-1" title={`${it.titulo} (${it.status})`}>
                      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${COR[it.status] || 'bg-zinc-600'}`} />
                      <span className="truncate text-[10px] text-zinc-300">{it.titulo}</span>
                    </div>
                  ))}
                  {itens.length > 3 && <div className="text-[9px] text-zinc-500">+{itens.length - 3}</div>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <div className="flex flex-wrap gap-3 text-[10px] text-zinc-500">
        {Object.entries(COR).map(([s, c]) => (
          <span key={s} className="flex items-center gap-1"><span className={`h-1.5 w-1.5 rounded-full ${c}`} /> {s.replace(/_/g, ' ').toLowerCase()}</span>
        ))}
      </div>
    </div>
  )
}
