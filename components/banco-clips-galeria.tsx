'use client'

import { useMemo, useState } from 'react'
import { Search, Repeat, Sparkles } from 'lucide-react'

import { useBancoClipsCatalogo, type ClipCatalogo } from '@/lib/hooks/use-banco-clips'

// mapa de cor (nome pt -> hex) pra desenhar a paleta como bolinhas (estética de museu)
const COR_HEX: Array<[RegExp, string]> = [
  [/dourad|ouro/, '#d4af37'], [/âmbar|ambar/, '#ffbf00'], [/amarel/, '#eab308'],
  [/laranj/, '#ea580c'], [/terracota|tijolo/, '#c66b3d'], [/ocre/, '#cc7722'],
  [/marrom|castanh|sépia|sepia/, '#6b4423'], [/areia|bege|creme/, '#d8c3a5'],
  [/verde.?musg|oliva/, '#556b2f'], [/verde/, '#2e7d32'], [/azul/, '#2563eb'],
  [/ciano|turques/, '#06b6d4'], [/roxo|violeta|púrpura|purpura/, '#7c3aed'],
  [/rosa|magenta/, '#ec4899'], [/vermelh|carmesim/, '#dc2626'],
  [/cinz|prata|chumbo/, '#6b7280'], [/pret|escur|negr/, '#1f2937'],
  [/branc|claro|gelo/, '#e5e7eb'],
]
function hex(nome: string): string {
  const n = nome.toLowerCase()
  for (const [re, h] of COR_HEX) if (re.test(n)) return h
  return '#71717a'
}

function texto(c: ClipCatalogo): string {
  return [c.prompt, c.tema, ...(c.tags || []), ...(c.vtags || []), c.visao?.descricao || '', c.visao?.cenario || '']
    .join(' ').toLowerCase()
}

export function BancoClipsGaleria() {
  const { data, isLoading } = useBancoClipsCatalogo()
  const [busca, setBusca] = useState('')
  const [tema, setTema] = useState('')

  const temas = useMemo(() => {
    const m = new Map<string, number>()
    for (const c of data ?? []) m.set(c.tema, (m.get(c.tema) || 0) + 1)
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1])
  }, [data])

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return (data ?? []).filter((c) => (tema ? c.tema === tema : true) && (q ? texto(c).includes(q) : true))
  }, [data, busca, tema])

  const comVisao = useMemo(() => (data ?? []).filter((c) => c.visao).length, [data])

  if (isLoading || !data || !data.length) return null

  return (
    <section id="galeria" className="scroll-mt-20">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Galeria do acervo</h2>
          <p className="text-xs text-zinc-500">
            {filtrados.length} de {data.length} clips
            {comVisao > 0 && <span className="ml-2 inline-flex items-center gap-1 text-violet-300"><Sparkles className="h-3 w-3" />{comVisao} com IA</span>}
          </p>
        </div>
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="buscar por ideia, cor, clima, objeto…"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900/60 py-2.5 pl-9 pr-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none" />
        </div>
      </div>

      {/* coleções (temas) como chips navegáveis */}
      <div className="mb-5 flex flex-wrap gap-2">
        <button onClick={() => setTema('')} className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${!tema ? 'bg-violet-600 text-white' : 'bg-zinc-800/60 text-zinc-300 hover:bg-zinc-800'}`}>
          tudo <span className="opacity-60">{data.length}</span>
        </button>
        {temas.map(([t, n]) => (
          <button key={t} onClick={() => setTema(t === tema ? '' : t)} className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${t === tema ? 'bg-violet-600 text-white' : 'bg-zinc-800/60 text-zinc-300 hover:bg-zinc-800'}`}>
            {t} <span className="opacity-60">{n}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {filtrados.slice(0, 150).map((c) => (
          <figure key={c.id} className="group relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 transition-all hover:border-violet-500/50 hover:shadow-lg hover:shadow-violet-500/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={c.thumb} alt={c.visao?.descricao || c.prompt} loading="lazy" className="aspect-9/16 w-full object-cover transition-transform duration-500 group-hover:scale-105" />

            {c.usos > 0 && (
              <span className="absolute left-2 top-2 flex items-center gap-0.5 rounded-md bg-emerald-500/90 px-1.5 py-0.5 text-[10px] font-bold text-white shadow">
                <Repeat className="h-2.5 w-2.5" />{c.usos}
              </span>
            )}
            {c.visao?.paleta && (
              <div className="absolute right-2 top-2 flex gap-1">
                {c.visao.paleta.slice(0, 4).map((p, i) => (
                  <span key={i} className="h-3 w-3 rounded-full ring-1 ring-black/40" style={{ background: hex(p) }} title={p} />
                ))}
              </div>
            )}

            {/* overlay no hover: descrição + clima */}
            <figcaption className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black via-black/80 to-transparent p-2.5">
              <p className="truncate text-[11px] font-medium text-zinc-200">{c.visao?.descricao || c.tema}</p>
              <div className="mt-1 hidden flex-wrap gap-1 group-hover:flex">
                {(c.visao?.clima || []).slice(0, 3).map((m) => (
                  <span key={m} className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] text-zinc-300">{m}</span>
                ))}
              </div>
              <p className="mt-0.5 text-[9px] text-zinc-500">{c.tema} · {c.dur}s</p>
            </figcaption>
          </figure>
        ))}
      </div>
      {filtrados.length > 150 && <p className="mt-3 text-xs text-zinc-500">mostrando 150 de {filtrados.length} — refine a busca.</p>}
    </section>
  )
}
