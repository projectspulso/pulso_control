'use client'

import { useState } from 'react'
import { Layers, Film, Music } from 'lucide-react'

import { BancoClipsPanel } from '@/components/banco-clips-panel'
import { BancoClipsGaleria } from '@/components/banco-clips-galeria'
import { CentralPublicacao } from '@/components/central-publicacao'
import { MidiasPanel } from '@/components/midias-panel'

export default function AssetsPage() {
  const [aba, setAba] = useState<'videos' | 'acervo' | 'midias'>('videos')

  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div>
          <h1 className="flex items-center gap-3 bg-linear-to-r from-pink-400 via-purple-400 to-pink-400 bg-clip-text text-4xl font-black text-transparent">
            <Layers className="h-9 w-9 text-pink-400" />
            Biblioteca de Assets
          </h1>
          <p className="mt-2 flex items-center gap-2 text-zinc-400">
            <span className="h-2 w-2 rounded-full bg-pink-500 animate-pulse" />
            Vídeos com descrição por rede, acervo de clips curado por IA e mídias do pipeline
          </p>
        </div>

        {/* ABAS (como no Analytics) */}
        <div className="flex gap-2 overflow-x-auto border-b border-zinc-800/50 pb-2">
          {([
            { id: 'videos', label: 'Vídeos', icon: Film },
            { id: 'acervo', label: 'Acervo de clips', icon: Layers },
            { id: 'midias', label: 'Mídias', icon: Music },
          ] as const).map((t) => {
            const Icon = t.icon
            const ativo = aba === t.id
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setAba(t.id)}
                className={`inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                  ativo ? 'bg-pink-500/15 text-pink-300 ring-1 ring-pink-500/30' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" /> {t.label}
              </button>
            )
          })}
        </div>

        {aba === 'videos' && <CentralPublicacao />}

        {aba === 'acervo' && (
          <>
            <BancoClipsPanel />
            <BancoClipsGaleria />
          </>
        )}

        {aba === 'midias' && <MidiasPanel />}
      </div>
    </div>
  )
}
