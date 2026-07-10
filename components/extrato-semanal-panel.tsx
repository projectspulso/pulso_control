'use client'

import { CalendarClock, Wallet, Film, Coins } from 'lucide-react'
import { useFinanceiro } from '@/lib/hooks/use-financeiro'

const brl = (v: number) => `R$ ${(v || 0).toFixed(2).replace('.', ',')}`

/**
 * EXTRATO SEMANAL — a "folha de custos" dos agentes/serviços do PULSO.
 * Semana em curso (ao vivo) + histórico dos extratos gerados toda segunda (cron).
 * Quebra por agente: Higgsfield (vídeo), ElevenLabs (voz), OpenAI (roteiro).
 */
export function ExtratoSemanalPanel() {
  const { data, isLoading } = useFinanceiro()
  if (isLoading || !data) return <div className="h-40 animate-pulse rounded-2xl bg-zinc-900/50" />

  const { semanaAtual, extratoSemanal } = data
  const ultimo = extratoSemanal[0]

  return (
    <div className="glass rounded-2xl border border-zinc-800/50 p-6">
      <div className="flex items-center gap-2">
        <CalendarClock className="h-5 w-5 text-cyan-400" />
        <h2 className="text-lg font-semibold text-white">Extrato semanal de custos</h2>
        <span className="ml-auto text-xs text-zinc-500">gerado toda segunda · por agente</span>
      </div>

      {/* Semana em curso (ao vivo) */}
      <div className="mt-4 rounded-xl border border-cyan-500/20 bg-cyan-500/[0.04] p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-cyan-300">Semana em curso (parcial)</span>
          <span className="text-[11px] text-zinc-500">{semanaAtual.periodo}</span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-black tabular-nums text-white">{brl(semanaAtual.consumoBRL)}</span>
          <span className="text-xs text-zinc-400">consumido até agora</span>
        </div>
        {semanaAtual.porAgente.length > 0 ? (
          <div className="mt-2 space-y-1">
            {semanaAtual.porAgente.map((a) => (
              <div key={a.servico} className="flex items-center justify-between text-sm">
                <span className="text-zinc-300">{a.servico}</span>
                <span className="font-semibold text-zinc-100">{brl(a.brl)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-xs text-zinc-500">Sem gasto registrado esta semana ainda.</p>
        )}
      </div>

      {/* Último extrato fechado (segunda) */}
      {ultimo ? (
        <div className="mt-4">
          <div className="mb-2 flex items-center gap-2 text-sm text-zinc-400">
            <Wallet className="h-4 w-4" /> Última semana fechada · <b className="text-zinc-200">{ultimo.periodo}</b>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Mini icon={<Coins className="h-4 w-4" />} label="Consumo (AI)" valor={brl(ultimo.consumoTotalBRL)} />
            <Mini icon={<Film className="h-4 w-4" />} label="Vídeos" valor={String(ultimo.videosProduzidos)} />
            <Mini icon={<Coins className="h-4 w-4" />} label="Custo/vídeo" valor={brl(ultimo.custoMedioVideoBRL)} />
            <Mini icon={<Wallet className="h-4 w-4" />} label="Saldo Higgsfield" valor={ultimo.saldoHiggsfield ? `${ultimo.saldoHiggsfield.creditos} cr` : '—'} />
          </div>
          <div className="mt-3 space-y-1.5">
            {ultimo.porAgente.map((a) => (
              <div key={a.servico} className="flex items-center gap-3 rounded-lg bg-zinc-900/50 px-3 py-2 text-sm">
                <span className="min-w-0 flex-1 truncate text-zinc-200">{a.agente}</span>
                {a.creditos > 0 && <span className="shrink-0 text-[11px] text-zinc-500">{a.creditos} cr</span>}
                <span className="shrink-0 text-[11px] text-zinc-600">{a.lancamentos}×</span>
                <span className="w-20 shrink-0 text-right font-semibold text-zinc-100">{brl(a.brl)}</span>
              </div>
            ))}
          </div>
          {ultimo.recargasBRL > 0 && (
            <p className="mt-2 text-xs text-zinc-500">
              + {brl(ultimo.recargasBRL)} em recargas (caixa) · assinaturas fixas {brl(ultimo.assinaturasMensalBRL)}/mês
            </p>
          )}
        </div>
      ) : (
        <p className="mt-4 rounded-xl bg-zinc-900/40 py-6 text-center text-sm text-zinc-500">
          Nenhum extrato fechado ainda. O primeiro é gerado na próxima segunda (cron 8h15), ou rode a rota{' '}
          <code className="text-zinc-400">/api/automation/extrato-semanal</code> sob demanda.
        </p>
      )}

      {/* Histórico compacto */}
      {extratoSemanal.length > 1 && (
        <div className="mt-4 border-t border-zinc-800/50 pt-3">
          <div className="mb-1.5 text-[11px] uppercase tracking-wide text-zinc-500">Semanas anteriores</div>
          <div className="space-y-1">
            {extratoSemanal.slice(1, 8).map((s) => (
              <div key={s.semana} className="flex items-center justify-between text-xs text-zinc-400">
                <span>{s.periodo}</span>
                <span className="tabular-nums">{brl(s.consumoTotalBRL)} · {s.videosProduzidos} vídeos</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function Mini({ icon, label, valor }: { icon: React.ReactNode; label: string; valor: string }) {
  return (
    <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-3">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-zinc-500">{icon} {label}</div>
      <div className="mt-0.5 text-lg font-bold tabular-nums text-white">{valor}</div>
    </div>
  )
}
