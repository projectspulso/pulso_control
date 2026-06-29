'use client'

import { Database, Coins, Layers, Film } from 'lucide-react'

import { useBancoClips } from '@/lib/hooks/use-banco-clips'

export function BancoClipsPanel() {
  const { data, isLoading } = useBancoClips()
  if (isLoading || !data) return null

  const temas = Object.entries(data.por_tema || {}).sort((a, b) => b[1] - a[1])
  const economiaBrl = data.creditos_economizados * 1 // ~R$1/cr

  return (
    <div className="glass rounded-2xl border border-violet-500/20 p-5">
      <div className="mb-4 flex items-center gap-2">
        <Database className="h-4 w-4 text-violet-300" />
        <h2 className="text-sm font-bold text-white">Banco de clips reusáveis</h2>
        <span className="ml-auto text-[11px] text-zinc-500">atualizado {data.atualizado}</span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-zinc-900/50 p-3">
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-500"><Film className="h-3 w-3" /> clips no banco</div>
          <div className="mt-1 text-2xl font-bold text-white">{data.clips}</div>
        </div>
        <div className="rounded-xl bg-zinc-900/50 p-3">
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-500"><Layers className="h-3 w-3" /> temas</div>
          <div className="mt-1 text-2xl font-bold text-white">{data.temas}</div>
        </div>
        <div className="rounded-xl bg-zinc-900/50 p-3">
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-500"><Film className="h-3 w-3" /> reusos</div>
          <div className="mt-1 text-2xl font-bold text-white">{data.usos_total}</div>
        </div>
        <div className="rounded-xl bg-emerald-500/10 p-3 ring-1 ring-emerald-500/20">
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400"><Coins className="h-3 w-3" /> economizado</div>
          <div className="mt-1 text-2xl font-bold text-emerald-300">{data.creditos_economizados}<span className="text-sm font-medium text-emerald-400/70">cr</span></div>
          <div className="text-[10px] text-emerald-400/60">~R$ {economiaBrl}</div>
        </div>
      </div>

      {temas.length > 0 && (
        <div className="mt-4">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Acervo por tema</div>
          <div className="flex flex-wrap gap-1.5">
            {temas.map(([tema, n]) => (
              <span key={tema} className="rounded-full bg-zinc-800/60 px-2.5 py-1 text-[11px] text-zinc-300">
                {tema} <b className="text-violet-300">{n}</b>
              </span>
            ))}
          </div>
        </div>
      )}

      <p className="mt-4 text-[11px] text-zinc-500">
        Antes de gerar no Veo, o render busca aqui um clip parecido (palavra-chave do prompt, estrito p/ qualidade) — casou,
        reusa de graça; não casou, gera e <b className="text-zinc-300">adiciona ao banco</b>. Cresce a cada vídeo. Clips ficam no PC (render é local); aqui é o resumo.
      </p>
    </div>
  )
}
