'use client'

import { Layers } from 'lucide-react'

import { useLedgerRender } from '@/lib/hooks/use-banco-clips'

const NOME_FONTE: Record<string, string> = {
  banco: 'banco (reuso)',
  ja_existia: 'já existia',
  pexels: 'Pexels',
  pixabay: 'Pixabay',
  wan: 'Wan',
  veo: 'Veo (pago)',
  outro: 'outro',
}

/**
 * RESUMO DO LEDGER — de onde vieram as cenas dos últimos renders.
 *
 * É o instrumento da decisão de escala: o dono quer aumentar o volume usando b-roll grátis
 * (Pexels/Pixabay/Wan), mas só dá pra autorizar isso comparando o desempenho do grátis com o do
 * pago — e até 31/07/2026 ninguém registrava a fonte de cada cena. O motor grava por render
 * (metadata.ledger_render); aqui soma. Quando houver amostra, cruzar com retenção por vídeo.
 */
export function LedgerRenderResumo() {
  const { data: ledgers, isLoading } = useLedgerRender()

  if (isLoading) return null
  if (!ledgers || ledgers.length === 0) {
    return (
      <div className="rounded-2xl border border-white/8 bg-[#1a1922] p-5">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-zinc-500" />
          <h3 className="text-sm font-semibold text-zinc-300">Ledger dos renders</h3>
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          Ainda sem registro — o motor grava a fonte de cada cena (banco / Pexels / Wan / Veo) a
          partir do próximo render. É o dado que autoriza escalar o volume com b-roll grátis.
        </p>
      </div>
    )
  }

  const fontes: Record<string, number> = {}
  let veoCr = 0
  let ecoCr = 0
  let cenas = 0
  for (const l of ledgers) {
    for (const [f, n] of Object.entries(l.fontes || {})) fontes[f] = (fontes[f] || 0) + n
    veoCr += l.veo_cr || 0
    ecoCr += l.economizado_cr || 0
    cenas += l.cenas || 0
  }
  const pagas = fontes.veo || 0
  const pctGratis = cenas > 0 ? Math.round(((cenas - pagas) / cenas) * 100) : 0

  return (
    <div className="rounded-2xl border border-white/8 bg-[#1a1922] p-5">
      <div className="flex flex-wrap items-baseline gap-2">
        <Layers className="h-4 w-4 self-center text-emerald-400" />
        <h3 className="text-sm font-semibold text-zinc-200">Ledger dos renders</h3>
        <span className="ml-auto text-[11px] text-zinc-500">
          {ledgers.length} render(s) · {cenas} cenas
        </span>
      </div>
      <p className="mt-2 text-sm text-zinc-300">
        <strong className="text-emerald-300">{pctGratis}% das cenas saíram de graça</strong>
        {veoCr > 0 && <> · Veo gastou {veoCr} cr</>}
        {ecoCr > 0 && <> · banco economizou ~{ecoCr} cr</>}
      </p>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {Object.entries(fontes)
          .sort((a, b) => b[1] - a[1])
          .map(([f, n]) => (
            <span
              key={f}
              className={`rounded px-2 py-0.5 text-[11px] ${f === 'veo' ? 'bg-amber-500/10 text-amber-300' : 'bg-emerald-500/10 text-emerald-300'}`}
            >
              {NOME_FONTE[f] || f} · {n}
            </span>
          ))}
      </div>
      <p className="mt-2 text-[10px] text-zinc-600">
        Próximo passo do instrumento: cruzar fonte × retenção por vídeo — se o grátis segurar igual,
        o volume pode subir sem subir o custo.
      </p>
    </div>
  )
}
