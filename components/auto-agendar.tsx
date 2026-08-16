'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { CalendarClock, Check, Loader2 } from 'lucide-react'

/**
 * AUTO-AGENDAR — o plano do roteador vira data que o cron dispara.
 *
 * Antes o agendamento era digitado um a um, mesmo com o roteador já tendo escolhido o vídeo de
 * cada slot por desempenho de tema. O plano vivia em `agenda_atribuicoes` e o cron lia
 * `pipeline.data_publicacao_planejada` — duas tabelas que nunca se falavam.
 *
 * O botão NÃO decide nada: quem escolhe continua sendo lib/agenda/roteador.ts. Ele só comete o
 * que já estava planejado. E mostra a lista ANTES de gravar, porque pôr data em publicação é
 * decisão do dono (R-011) — o que muda é ela deixar de ser digitada, não deixar de ser dele.
 */

interface ItemPlano {
  numero: number | null
  titulo: string
  quando: string
}

interface Resposta {
  simulacao?: boolean
  agendaria?: number
  gravados?: number
  plano: ItemPlano[]
  pulados: number | Array<{ numero: number | null; titulo: string; motivo: string }>
  erros?: string[]
}

const fmt = (iso: string) =>
  new Date(`${iso}-03:00`).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo',
  })

export function AutoAgendar() {
  const qc = useQueryClient()
  const [estado, setEstado] = useState<'parado' | 'simulando' | 'previa' | 'gravando' | 'feito'>('parado')
  const [res, setRes] = useState<Resposta | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  async function chamar(confirmar: boolean) {
    setErro(null)
    setEstado(confirmar ? 'gravando' : 'simulando')
    try {
      const r = await fetch('/api/agenda/comprometer', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ confirmar }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`)
      setRes(d)
      setEstado(confirmar ? 'feito' : 'previa')
      if (confirmar) {
        qc.invalidateQueries({ queryKey: ['calendario'] })
        qc.invalidateQueries({ queryKey: ['agenda'] })
        qc.invalidateQueries({ queryKey: ['conteudos-prontos'] })
      }
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'falhou')
      setEstado('parado')
    }
  }

  const pulados = typeof res?.pulados === 'number' ? res.pulados : (res?.pulados?.length ?? 0)

  return (
    <div className="glass rounded-2xl border border-zinc-800/50 p-5">
      <div className="flex flex-wrap items-center gap-3">
        <CalendarClock className="h-5 w-5 text-violet-400" />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-white">Auto-agendar a fila</h3>
          <p className="text-xs text-zinc-400">
            Usa o plano que o roteador já montou por desempenho de tema. Mostra antes de gravar.
          </p>
        </div>
        {estado !== 'previa' && (
          <button
            type="button"
            onClick={() => chamar(false)}
            disabled={estado === 'simulando' || estado === 'gravando'}
            className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
          >
            {estado === 'simulando' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarClock className="h-4 w-4" />}
            {estado === 'feito' ? 'Rever plano' : 'Ver o que seria agendado'}
          </button>
        )}
      </div>

      {erro && <p className="mt-3 rounded-lg bg-red-500/10 p-3 text-sm text-red-300">{erro}</p>}

      {estado === 'feito' && res && (
        <p className="mt-3 flex items-center gap-2 text-sm text-emerald-400">
          <Check className="h-4 w-4" />
          {res.gravados} publicação(ões) agendada(s). O cron dispara na hora marcada.
        </p>
      )}

      {estado === 'previa' && res && (
        <div className="mt-4">
          {res.plano.length === 0 ? (
            <p className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3 text-sm text-zinc-400">
              Nada a agendar — {pulados} item(ns) do plano não estão prontos ou já têm data.
            </p>
          ) : (
            <>
              <div className="max-h-64 space-y-1.5 overflow-y-auto">
                {res.plano.map((i) => (
                  <div key={`${i.numero}-${i.quando}`} className="flex items-center gap-3 rounded-lg bg-zinc-900/50 px-3 py-2 text-sm">
                    <span className="w-14 shrink-0 text-xs tabular-nums text-zinc-500">#{i.numero ?? '—'}</span>
                    <span className="min-w-0 flex-1 truncate text-zinc-200">{i.titulo}</span>
                    <span className="shrink-0 text-xs tabular-nums text-violet-300">{fmt(i.quando)}</span>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-zinc-600">
                {pulados > 0 && `${pulados} do plano ficaram de fora (ainda em produção, sem vídeo ou já com data). `}
                O horário vem da grade; o vídeo de cada slot, do desempenho de tema.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => chamar(true)}
                  disabled={estado !== 'previa'}
                  className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
                >
                  <Check className="h-4 w-4" /> Confirmar {res.plano.length} agendamento(s)
                </button>
                <button
                  type="button"
                  onClick={() => { setEstado('parado'); setRes(null) }}
                  className="rounded-lg px-4 py-2 text-sm text-zinc-400 transition-colors hover:text-white"
                >
                  Cancelar
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
