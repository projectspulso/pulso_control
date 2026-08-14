'use client'

import { useState } from 'react'
import { FileEdit, AudioLines, Lightbulb } from 'lucide-react'

import { EsteiraIdeias } from '@/components/esteira-ideias'
import { EsteiraRoteiros } from '@/components/esteira-roteiros'
import { EsteiraAudios } from '@/components/esteira-audios'

/**
 * A ESTEIRA — ideia → roteiro → áudio numa tela só.
 *
 * Eram três rotas (/ideias, /roteiros, /audios) para três estágios do MESMO pipeline, e o
 * caminho natural é sempre percorrê-los em sequência. Trocar de tela a cada etapa cobrava
 * navegação por algo que é um fluxo contínuo — e as três eram, no fundo, a mesma lista com
 * filtros diferentes.
 *
 * O que a auditoria de 14/08/2026 mostrou e justificou a fusão:
 *  · as 229 ideias têm `criado_por` NULO — nenhuma nasceu de humano no app. Origem é IA (159),
 *    benchmark (36) e do-momento (25). Estas telas nunca foram de criação; são de conferência.
 *  · as únicas ações delas eram os botões "gerar", que o auto-funil e o auto-audio já disparam
 *    sozinhos todo dia por cron. O botão é o atalho para quando se quer antecipar, não o caminho.
 *
 * Por isso viraram abas, não sumiram: conferir o que a máquina produziu continua sendo trabalho
 * real — só não merecia três entradas no menu.
 */

type Aba = 'ideias' | 'roteiros' | 'audios'

const ABAS: Array<{ id: Aba; rotulo: string; icone: typeof Lightbulb }> = [
  { id: 'ideias', rotulo: 'Ideias', icone: Lightbulb },
  { id: 'roteiros', rotulo: 'Roteiros', icone: FileEdit },
  { id: 'audios', rotulo: 'Áudios', icone: AudioLines },
]

export default function EsteiraPage() {
  const [aba, setAba] = useState<Aba>('ideias')

  return (
    <div>
      <div className="space-y-6">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <div className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
            <h1 className="bg-linear-to-r from-amber-400 to-orange-400 bg-clip-text text-3xl font-black text-transparent sm:text-4xl">
              Esteira
            </h1>
          </div>
          <p className="text-zinc-400">Ideia → roteiro → áudio. O caminho até o vídeo ficar pronto pra render.</p>
        </div>

        <div className="flex w-fit gap-1 rounded-xl bg-zinc-900/60 p-1">
          {ABAS.map((t) => {
            const Icone = t.icone
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setAba(t.id)}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                  aba === t.id ? 'bg-amber-600 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Icone className="h-4 w-4" />
                {t.rotulo}
              </button>
            )
          })}
        </div>

        {aba === 'ideias' && <EsteiraIdeias />}
        {aba === 'roteiros' && <EsteiraRoteiros />}
        {aba === 'audios' && <EsteiraAudios />}
      </div>
    </div>
  )
}
