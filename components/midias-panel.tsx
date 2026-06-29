'use client'

import { useState } from 'react'
import { Film, Music, Download, Play } from 'lucide-react'

import { useMidias } from '@/lib/hooks/use-midias'

function dur(s: number) {
  const m = Math.floor(s / 60)
  const r = Math.floor(s % 60)
  return `${m}:${r.toString().padStart(2, '0')}`
}

export function MidiasPanel() {
  const { data, isLoading } = useMidias()
  const [sub, setSub] = useState<'videos' | 'audios'>('videos')

  if (isLoading) return <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{[1, 2, 3, 4].map((i) => <div key={i} className="aspect-9/16 animate-pulse rounded-xl bg-zinc-900/50" />)}</div>
  if (!data) return null

  return (
    <div>
      <div className="mb-4 flex gap-2">
        {([
          { id: 'videos', label: `Vídeos (${data.videos.length})`, icon: Film },
          { id: 'audios', label: `Áudios (${data.audios.length})`, icon: Music },
        ] as const).map((t) => (
          <button key={t.id} onClick={() => setSub(t.id)}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${sub === t.id ? 'bg-pink-500/15 text-pink-300 ring-1 ring-pink-500/30' : 'text-zinc-400 hover:text-white'}`}>
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {sub === 'videos' && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {data.videos.map((v) => (
            <div key={v.videoUrl} className="group relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
              <a href={v.videoUrl} target="_blank" rel="noreferrer" className="block">
                {v.thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={v.thumb} alt={v.titulo} loading="lazy" className="aspect-9/16 w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="flex aspect-9/16 w-full items-center justify-center bg-zinc-950"><Film className="h-8 w-8 text-zinc-700" /></div>
                )}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                  <Play className="h-10 w-10 text-white drop-shadow-lg" fill="white" />
                </div>
              </a>
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-1 bg-linear-to-t from-black/90 to-transparent p-2">
                <span className="truncate text-[11px] text-zinc-200">{v.numero != null && <b className="text-zinc-400">#{v.numero} </b>}{v.titulo}</span>
                <a href={v.videoUrl} download className="shrink-0 text-zinc-300 hover:text-white" title="baixar"><Download className="h-3.5 w-3.5" /></a>
              </div>
            </div>
          ))}
          {!data.videos.length && <p className="col-span-full text-sm text-zinc-500">Nenhum vídeo final ainda.</p>}
        </div>
      )}

      {sub === 'audios' && (
        <div className="space-y-2">
          {data.audios.map((a) => (
            <div key={a.id} className="flex items-center gap-3 rounded-lg border border-zinc-800/50 bg-zinc-900/40 p-3">
              <Music className="h-4 w-4 shrink-0 text-purple-400" />
              <span className="w-48 shrink-0 truncate text-sm text-zinc-200">{a.titulo}</span>
              <audio controls preload="none" className="h-8 flex-1"><source src={a.url} type="audio/mpeg" /></audio>
              {a.dur > 0 && <span className="shrink-0 text-xs text-zinc-500">{dur(a.dur)}</span>}
            </div>
          ))}
          {!data.audios.length && <p className="text-sm text-zinc-500">Nenhum áudio ainda.</p>}
        </div>
      )}
    </div>
  )
}
