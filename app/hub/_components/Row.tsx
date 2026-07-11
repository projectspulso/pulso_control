'use client'

import Link from 'next/link'
import { useRef } from 'react'
import { ChevronLeft, ChevronRight, Play } from 'lucide-react'

import type { HubItem } from '@/lib/hub/data'

export default function Row({ titulo, itens }: { titulo: string; itens: HubItem[] }) {
  const ref = useRef<HTMLDivElement>(null)

  if (!itens.length) return null

  const scroll = (dir: 1 | -1) => {
    const el = ref.current
    if (!el) return
    el.scrollBy({ left: dir * (el.clientWidth * 0.85), behavior: 'smooth' })
  }

  return (
    <section className="group/row relative">
      <h3 className="mb-2 px-4 text-lg font-bold text-zinc-100 sm:px-10">{titulo}</h3>

      <button
        aria-label="Anterior"
        onClick={() => scroll(-1)}
        className="absolute left-0 top-9 z-20 hidden h-[calc(100%-2.5rem)] w-10 items-center justify-center bg-linear-to-r from-black/70 to-transparent text-white opacity-0 transition group-hover/row:opacity-100 sm:flex"
      >
        <ChevronLeft className="h-8 w-8" />
      </button>

      <div
        ref={ref}
        className="no-scrollbar flex gap-2.5 overflow-x-auto scroll-px-4 px-4 pb-2 sm:scroll-px-10 sm:px-10"
      >
        {itens.map((v) => (
          <Link
            key={v.numero}
            href={`/v/${v.numero}`}
            className="group/card relative w-[140px] shrink-0 overflow-hidden rounded-lg bg-zinc-900 ring-1 ring-white/5 transition-all duration-300 hover:z-10 hover:scale-105 hover:ring-purple-500/60 sm:w-[168px]"
          >
            {v.thumb ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={v.thumb}
                alt={v.titulo}
                loading="lazy"
                className="aspect-9/16 w-full object-cover"
              />
            ) : (
              <div className="flex aspect-9/16 w-full items-center justify-center p-3 text-center text-xs text-zinc-500">
                {v.titulo}
              </div>
            )}

            <div className="absolute inset-0 flex flex-col justify-end bg-linear-to-t from-black/90 via-black/10 to-transparent p-2.5 opacity-0 transition group-hover/card:opacity-100">
              <span className="mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-white text-black">
                <Play className="h-4 w-4 fill-black" />
              </span>
              <p className="line-clamp-2 text-[11px] font-semibold leading-tight text-white">{v.titulo}</p>
            </div>

            <span className="absolute left-1.5 top-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-purple-300 backdrop-blur">
              #{v.numero}
            </span>
          </Link>
        ))}
      </div>

      <button
        aria-label="Próximo"
        onClick={() => scroll(1)}
        className="absolute right-0 top-9 z-20 hidden h-[calc(100%-2.5rem)] w-10 items-center justify-center bg-linear-to-l from-black/70 to-transparent text-white opacity-0 transition group-hover/row:opacity-100 sm:flex"
      >
        <ChevronRight className="h-8 w-8" />
      </button>
    </section>
  )
}
