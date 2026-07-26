'use client'

import { BoxSelect } from 'lucide-react'

/**
 * BOXPLOT por vertical — responde "a vertical é consistente ou depende de um viral?".
 *
 * Recharts não tem boxplot; desenho em SVG puro. Por vertical: mínimo, Q1, mediana, Q3, máximo
 * (whiskers), com os vídeos como pontos. Uma caixa curta e apertada = consistente; uma caixa
 * pequena com um ponto lá longe = depende de um viral (a média mente, a mediana não).
 *
 * Escala em LOG porque views variam de dezenas a dezenas de milhares — linear achataria tudo.
 */

export interface VerticalBox {
  vertical: string
  valores: number[] // views por vídeo daquele vertical
}

function quartis(vals: number[]) {
  const a = [...vals].sort((x, y) => x - y)
  const q = (p: number) => {
    const idx = (a.length - 1) * p
    const lo = Math.floor(idx)
    const hi = Math.ceil(idx)
    return a[lo] + (a[hi] - a[lo]) * (idx - lo)
  }
  return { min: a[0], q1: q(0.25), mediana: q(0.5), q3: q(0.75), max: a[a.length - 1], n: a.length }
}

const AZUL = '#3987e5'

export function BoxplotVerticais({ dados }: { dados: VerticalBox[] }) {
  const linhas = dados
    .filter((d) => d.valores.length >= 3) // < 3 vídeos não faz caixa
    .map((d) => ({ vertical: d.vertical.replace(/^PULSO\s*/i, ''), ...quartis(d.valores) }))
    .sort((a, b) => b.mediana - a.mediana)

  if (linhas.length === 0) {
    return (
      <div className="rounded-2xl border border-white/8 bg-[#1a1922] p-6">
        <div className="flex items-center gap-2">
          <BoxSelect className="h-5 w-5 text-sky-400" />
          <h2 className="text-lg font-semibold text-white">Consistência por vertical</h2>
        </div>
        <p className="mt-3 text-sm text-zinc-500">Nenhuma vertical tem 3+ vídeos no filtro atual.</p>
      </div>
    )
  }

  // escala log comum a todas as linhas
  const todosMax = Math.max(...linhas.map((l) => l.max), 10)
  const logMin = 0
  const logMax = Math.log10(todosMax + 1)
  const x = (v: number) => ((Math.log10(v + 1) - logMin) / (logMax - logMin)) * 100 // 0..100 (%)
  const fmt = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : String(Math.round(v)))

  return (
    <div className="rounded-2xl border border-white/8 bg-[#1a1922] p-6">
      <div className="flex flex-wrap items-baseline gap-2">
        <BoxSelect className="h-5 w-5 self-center text-sky-400" />
        <h2 className="text-lg font-semibold text-white">Consistência por vertical</h2>
        <span className="ml-auto text-[11px] text-zinc-500">views/vídeo · escala log · caixa = metade do meio (Q1–Q3)</span>
      </div>
      <p className="mt-1 text-xs text-zinc-500">
        Caixa curta = a vertical entrega parecido sempre (consistente). Caixa pequena com um ponto
        longe à direita = <strong>depende de um viral</strong> — a média engana, a mediana (traço no meio) não.
      </p>

      <div className="mt-4 space-y-3">
        {linhas.map((l) => (
          <div key={l.vertical} className="grid grid-cols-[110px_1fr] items-center gap-2">
            <div className="min-w-0">
              <div className="truncate text-xs font-medium text-zinc-200" title={l.vertical}>{l.vertical}</div>
              <div className="text-[10px] text-zinc-600">n={l.n} · med {fmt(l.mediana)}</div>
            </div>
            <div className="relative h-7">
              {/* whisker min→max */}
              <div className="absolute top-1/2 h-px -translate-y-1/2 bg-zinc-700"
                style={{ left: `${x(l.min)}%`, width: `${Math.max(0, x(l.max) - x(l.min))}%` }} />
              {/* caixa Q1→Q3 */}
              <div className="absolute top-1/2 h-4 -translate-y-1/2 rounded-sm"
                style={{ left: `${x(l.q1)}%`, width: `${Math.max(1, x(l.q3) - x(l.q1))}%`, background: `${AZUL}33`, border: `1px solid ${AZUL}` }} />
              {/* mediana */}
              <div className="absolute top-1/2 h-4 w-[2px] -translate-y-1/2 bg-white"
                style={{ left: `${x(l.mediana)}%` }} title={`mediana ${fmt(l.mediana)}`} />
              {/* extremos como pontinhos */}
              <div className="absolute top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-500" style={{ left: `${x(l.max)}%` }} title={`máx ${fmt(l.max)}`} />
              <div className="absolute top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-600" style={{ left: `${x(l.min)}%` }} title={`mín ${fmt(l.min)}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
