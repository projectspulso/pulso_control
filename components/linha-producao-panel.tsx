'use client'

import { Factory, Trophy } from 'lucide-react'

import { useLinhaProducao } from '@/lib/hooks/use-linha-producao'

/**
 * LINHA DE PRODUÇÃO — o painel de ritmo da fábrica no topo do kanban.
 * Responde três perguntas: (1) o dia está cumprido? (checklist), (2) algum buffer
 * está fora da faixa? (medidores), (3) o que renderiza a seguir? (fila 2×1 com a
 * trilha do concorrente marcada). Config vem de pulso_core:linha_producao.
 */

function Medidor({ label, atual, min, max, invertido }: { label: string; atual: number; min?: number; max?: number; invertido?: boolean }) {
  // invertido = buffer que NÃO pode encher (áudio); normal = buffer que não pode secar (prontos)
  let cor = 'text-emerald-300 bg-emerald-500/10 ring-emerald-500/25'
  if (invertido) {
    if (max != null && atual >= max) cor = 'text-amber-300 bg-amber-500/10 ring-amber-500/30'
  } else {
    if (min != null && atual < min) cor = 'text-red-300 bg-red-500/10 ring-red-500/35'
    else if (max != null && atual > max) cor = 'text-sky-300 bg-sky-500/10 ring-sky-500/25'
  }
  const faixa = min != null && max != null ? `${min}–${max}` : max != null ? `≤${max}` : ''
  return (
    <div className={`rounded-lg px-3 py-2 ring-1 ${cor}`}>
      <div className="text-[10px] uppercase tracking-wide opacity-70">{label}</div>
      <div className="text-lg font-bold leading-tight">
        {atual}
        {faixa && <span className="ml-1 text-[10px] font-normal opacity-60">alvo {faixa}</span>}
      </div>
    </div>
  )
}

function ChecklistItem({ label, feito, alvo, extra }: { label: string; feito: number; alvo: number; extra?: string }) {
  const ok = feito >= alvo
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${ok ? 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/25' : 'bg-zinc-800/70 text-zinc-300 ring-zinc-700'}`}>
      {ok ? '✓' : '·'} {label} {feito}/{alvo}
      {extra && <span className="font-normal text-zinc-500">{extra}</span>}
    </span>
  )
}

export function LinhaProducaoPanel() {
  const { data, isLoading } = useLinhaProducao()
  if (isLoading || !data) return null
  const { cfg } = data

  return (
    <div className="glass rounded-2xl border border-violet-500/20 p-5">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Factory className="h-4 w-4 text-violet-300" />
        <h2 className="text-sm font-bold text-white">Linha de Produção</h2>
        <span className="text-xs text-zinc-500">
          ritmo: {cfg.render_dia_max} renders/dia · {cfg.publicar_dia} publicações/dia · fila {cfg.intercalar.estoque}×{cfg.intercalar.concorrente} (estoque × concorrente)
        </span>
      </div>

      {/* checklist do dia */}
      <div className="mb-4 flex flex-wrap gap-2">
        <ChecklistItem label="publicados" feito={data.publicadosHoje} alvo={cfg.publicar_dia} />
        <ChecklistItem label="roteiros" feito={data.roteirosHoje} alvo={cfg.roteiros_dia_max} />
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${data.audioPausado ? 'bg-amber-500/10 text-amber-300 ring-amber-500/30' : 'bg-zinc-800/70 text-zinc-300 ring-zinc-700'}`}>
          áudios {data.audiosHoje} {data.audioPausado && '· pausado (buffer cheio)'}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-800/70 px-2.5 py-1 text-[11px] font-semibold text-zinc-300 ring-1 ring-zinc-700">
          fila de render {data.filaRender} <span className="font-normal text-zinc-500">worker 3×/dia</span>
        </span>
      </div>

      {/* buffers por etapa */}
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <Medidor label="Ideias aprovadas" atual={data.aprovadasSemRoteiro} min={10} />
        <Medidor label="Roteiro pronto" atual={data.roteiroPronto} min={2} />
        <Medidor label="Áudio gerado" atual={data.audioGerado} max={cfg.buffer_audio_max} invertido />
        <Medidor label="Autorizado (render)" atual={data.filaRender} max={cfg.render_dia_max} invertido />
        <Medidor label="Pronto p/ publicar" atual={data.prontos} min={cfg.buffer_pronto_min} max={cfg.buffer_pronto_max} />
      </div>

      {/* fila 2×1 — próximos renders */}
      {data.fila10.length > 0 && (
        <div>
          <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
            Próximos na fila ({cfg.intercalar.estoque} estoque × {cfg.intercalar.concorrente} concorrente)
            {data.concorrenteSemRoteiro > 0 && (
              <span className="ml-2 normal-case text-zinc-600">· {data.concorrenteSemRoteiro} do concorrente ainda sem roteiro (entram via auto-funil)</span>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {data.fila10.map((f, idx) => (
              <span
                key={f.id}
                className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] ring-1 ${f.concorrente ? 'bg-amber-500/10 text-amber-200 ring-amber-500/30' : 'bg-zinc-800/60 text-zinc-300 ring-zinc-700/60'}`}
                title={`${f.titulo} · ${f.canal}${f.notaHook != null ? ` · hook ${f.notaHook}` : ''}`}
              >
                <span className="font-bold text-zinc-500">{idx + 1}.</span>
                {f.concorrente && <Trophy className="h-3 w-3 text-amber-300" />}
                {f.numero != null && <span className="font-semibold">#{f.numero}</span>}
                <span className="max-w-[180px] truncate">{f.titulo}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
