'use client'

import { useState } from 'react'
import { ListOrdered, Film, Mic, FileText, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react'

import { useFilaProducao, type EtapaProducao } from '@/lib/hooks/use-fila-producao'

const ETAPA: Record<EtapaProducao, { icon: typeof Film; cls: string }> = {
  render: { icon: Film, cls: 'bg-violet-500/15 text-violet-300 ring-violet-500/30' },
  audio: { icon: Mic, cls: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30' },
  roteiro: { icon: FileText, cls: 'bg-blue-500/15 text-blue-300 ring-blue-500/30' },
}
const TIER_DOT: Record<number, string> = { 1: 'bg-amber-400', 2: 'bg-zinc-500', 3: 'bg-zinc-700' }

export function FilaProducao() {
  const { data, isLoading } = useFilaProducao()
  const [aberto, setAberto] = useState(true)

  if (isLoading || !data) return null
  const top = aberto ? data.fila.slice(0, 12) : data.fila.slice(0, 4)
  const deficitando = data.deficits.filter((d) => d.deficit > 0)

  return (
    <div className="glass rounded-2xl border border-violet-500/20 p-5">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <ListOrdered className="h-4 w-4 text-violet-300" />
          <h2 className="text-sm font-bold text-white">Produzir na sequência</h2>
        </div>
        <span className="text-xs text-zinc-500">o que a agenda precisa primeiro · próximos {data.horizonteDias} dias</span>
        <div className="ml-auto flex items-center gap-2 text-[11px]">
          <span className="rounded-full bg-violet-500/15 px-2 py-0.5 font-semibold text-violet-300">{data.porEtapa.render} renderizar</span>
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 font-semibold text-emerald-300">{data.porEtapa.audio} áudio</span>
          <span className="rounded-full bg-blue-500/15 px-2 py-0.5 font-semibold text-blue-300">{data.porEtapa.roteiro} roteiro</span>
          <span className="rounded-full bg-green-500/15 px-2 py-0.5 font-semibold text-green-300">{data.prontos} prontos</span>
        </div>
      </div>

      {/* DEMANDA DA AGENDA: déficit por canal (o que vai furar) */}
      {deficitando.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-1.5 rounded-xl border border-amber-500/25 bg-amber-500/5 p-2.5">
          <span className="mr-1 text-[11px] font-semibold text-amber-300">Agenda precisa:</span>
          {deficitando.map((d) => (
            <span key={d.canal} className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-200" title={`demanda ${d.demanda} · estoque ${d.estoque}`}>
              {d.canal} <b>+{d.deficit}</b>
            </span>
          ))}
        </div>
      )}

      {data.fila.length === 0 ? (
        <p className="text-sm text-zinc-500">Nada na fila — pipeline vazio ou tudo pronto. 🎉</p>
      ) : (
        <ol className="space-y-1.5">
          {top.map((item, i) => {
            const e = ETAPA[item.etapa]
            const Ic = e.icon
            return (
              <li key={item.pipelineId} className="flex items-center gap-3 rounded-lg bg-zinc-900/50 px-3 py-2">
                <span className="w-5 shrink-0 text-center text-xs font-bold tabular-nums text-zinc-500">{i + 1}</span>
                <span className={`h-2 w-2 shrink-0 rounded-full ${TIER_DOT[item.tier] || TIER_DOT[2]}`} title={item.tier === 1 ? 'canal vencedor' : item.tier === 3 ? 'rebaixado' : 'neutro'} />
                <span className={`inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold ring-1 ${e.cls}`}>
                  <Ic className="h-3 w-3" /> {item.acaoLabel}
                </span>
                <span className="flex w-44 shrink-0 items-center gap-1 truncate text-xs text-zinc-400">
                  {item.canal}
                  {item.deficit > 0 && <span className="rounded bg-amber-500/15 px-1 text-[9px] font-bold text-amber-300">+{item.deficit}</span>}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-zinc-200">
                  {item.numero != null && <span className="text-zinc-500">#{item.numero} </span>}
                  {item.titulo}
                </span>
                {item.semCenas && (
                  <span className="flex shrink-0 items-center gap-1 rounded bg-red-500/15 px-1.5 py-0.5 text-[10px] font-bold text-red-300" title="sem cenas — gere o áudio no app pra criar as cenas, senão o worker trava">
                    <AlertTriangle className="h-3 w-3" /> sem cenas
                  </span>
                )}
              </li>
            )
          })}
        </ol>
      )}

      {data.fila.length > 4 && (
        <button onClick={() => setAberto((v) => !v)} className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-violet-300 hover:text-violet-200">
          {aberto ? <><ChevronUp className="h-3 w-3" /> ver menos</> : <><ChevronDown className="h-3 w-3" /> ver os {Math.min(data.fila.length, 12)} próximos ({data.fila.length} na fila)</>}
        </button>
      )}
      <p className="mt-2 text-[11px] text-zinc-500">Ordem = <b className="text-amber-300">déficit da agenda</b> → mais perto de pronto → vencedor. 🟡 vencedor · ⚪ neutro · ⬛ rebaixado · <span className="text-red-300">sem cenas</span> = gerar áudio no app primeiro.</p>
    </div>
  )
}
