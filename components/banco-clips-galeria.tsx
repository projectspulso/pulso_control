'use client'

import { useMemo, useState } from 'react'
import { Search, Repeat } from 'lucide-react'

import { useBancoClipsCatalogo } from '@/lib/hooks/use-banco-clips'

export function BancoClipsGaleria() {
  const { data, isLoading } = useBancoClipsCatalogo()
  const [busca, setBusca] = useState('')
  const [tema, setTema] = useState('')

  const temas = useMemo(() => Array.from(new Set((data ?? []).map((c) => c.tema).filter(Boolean))).sort(), [data])

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return (data ?? []).filter((c) => {
      if (tema && c.tema !== tema) return false
      if (!q) return true
      return c.prompt.toLowerCase().includes(q) || c.tags.some((t) => t.includes(q)) || c.tema.toLowerCase().includes(q)
    })
  }, [data, busca, tema])

  if (isLoading || !data || !data.length) return null

  return (
    <div className="glass rounded-2xl border border-violet-500/20 p-5">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <h2 className="text-sm font-bold text-white">Galeria do banco de clips</h2>
        <span className="text-[11px] text-zinc-500">{filtrados.length}/{data.length} clips</span>
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="buscar (tag, tema, prompt)"
              className="w-48 rounded-lg border border-zinc-700 bg-zinc-950 py-1.5 pl-7 pr-2 text-xs text-zinc-200 focus:border-violet-500 focus:outline-none" />
          </div>
          <select value={tema} onChange={(e) => setTema(e.target.value)}
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-xs text-zinc-300 focus:border-violet-500 focus:outline-none">
            <option value="">todos os temas</option>
            {temas.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
        {filtrados.slice(0, 120).map((c) => (
          <div key={c.id} className="group relative overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900" title={c.prompt}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={c.thumb} alt={c.prompt} loading="lazy" className="aspect-9/16 w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/90 to-transparent p-1.5">
              <p className="truncate text-[9px] text-zinc-300">{c.tema}</p>
            </div>
            {c.usos > 0 && (
              <span className="absolute right-1 top-1 flex items-center gap-0.5 rounded bg-emerald-500/80 px-1 text-[9px] font-bold text-white">
                <Repeat className="h-2.5 w-2.5" />{c.usos}
              </span>
            )}
          </div>
        ))}
      </div>
      {filtrados.length > 120 && <p className="mt-2 text-[11px] text-zinc-500">mostrando 120 de {filtrados.length} — refine a busca.</p>}
    </div>
  )
}
