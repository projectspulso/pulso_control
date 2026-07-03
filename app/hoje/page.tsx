'use client'

import { Sun } from 'lucide-react'

import { CockpitDia } from '@/components/cockpit-dia'

export default function HojePage() {
  const hojeLabel = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })

  return (
    <div className="min-h-screen bg-zinc-950 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <div className="mb-1 flex items-center gap-3">
            <Sun className="h-7 w-7 text-amber-400" />
            <h1 className="bg-linear-to-r from-amber-400 to-orange-400 bg-clip-text text-3xl font-black text-transparent sm:text-4xl">
              Hoje
            </h1>
          </div>
          <p className="capitalize text-zinc-400">{hojeLabel}</p>
        </div>

        <CockpitDia />
      </div>
    </div>
  )
}
