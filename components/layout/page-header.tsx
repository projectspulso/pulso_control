'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'

import { areaFor } from '@/lib/config/areas'

/**
 * Cabeçalho padrão de página — pega a cor da área pela rota (cor por contexto),
 * caixa de ícone com gradiente da marca + brilho de fundo. Dá hierarquia e
 * identidade pra cada tela sem cada página reinventar o topo.
 */
export function PageHeader({
  titulo,
  subtitulo,
  acoes,
}: {
  titulo?: string
  subtitulo?: string
  acoes?: ReactNode
}) {
  const area = areaFor(usePathname())
  const Icon = area.icon
  return (
    <header className="relative overflow-hidden rounded-2xl border border-zinc-800/50 bg-zinc-900/30 p-6">
      <div className={`pointer-events-none absolute -left-12 -top-20 h-52 w-80 rounded-full bg-linear-to-br ${area.headerGlow} blur-3xl`} />
      <div className="relative flex flex-wrap items-center gap-4">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-br ${area.iconBox} shadow-lg`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-white">{titulo || area.nome}</h1>
          {subtitulo && <p className="mt-0.5 text-sm text-zinc-400">{subtitulo}</p>}
        </div>
        {acoes && <div className="flex shrink-0 items-center gap-2">{acoes}</div>}
      </div>
    </header>
  )
}
