'use client'

import { AlertTriangle, Coins, Film, Lock, PiggyBank, ShieldCheck, TrendingDown, Wallet } from 'lucide-react'

import { ErrorState } from '@/components/ui/error-state'
import { CUSTO_POR_VIDEO } from '@/lib/config/custos'
import { useFinanceiro } from '@/lib/hooks/use-financeiro'

function brl(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

const SERVICO_LABEL: Record<string, string> = {
  higgsfield: 'Higgsfield (cenas)',
  elevenlabs: 'ElevenLabs (voz)',
  openai: 'OpenAI (ideias/roteiros)',
  topup: 'Compra de créditos',
}

export default function FinanceiroPage() {
  const { data, isLoading, isError, refetch } = useFinanceiro()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="skeleton h-10 w-56" />
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass rounded-2xl border border-zinc-800/50 p-6">
                <div className="skeleton h-5 w-24" />
                <div className="mt-4 skeleton h-8 w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-zinc-950 p-8">
        <div className="mx-auto max-w-7xl">
          <ErrorState title="Erro ao carregar o financeiro" message="Tente novamente." onRetry={() => refetch()} />
        </div>
      </div>
    )
  }

  const t = data.travas
  const tetoDia = t?.teto_creditos_higgsfield_dia ?? 600
  const pctTetoDia = Math.min(100, (data.gastoHojeCreditos / tetoDia) * 100)
  const tetoMes = t?.teto_brl_mes ?? 5000
  const pctTetoMes = Math.min(100, (data.gastoMesBRL / tetoMes) * 100)
  const estourouDia = data.gastoHojeCreditos > tetoDia
  const estourouMes = data.gastoMesBRL > tetoMes

  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold text-white">
            <Wallet className="h-8 w-8 text-green-400" /> Financeiro
          </h1>
          <p className="mt-1 text-zinc-400">
            Controle completo de custos de produção — com travas duras nos orquestradores.
          </p>
        </div>

        {/* Cards principais */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="glass rounded-2xl border border-zinc-800/50 p-6">
            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">
              <TrendingDown className="h-4 w-4" /> Gasto hoje
            </p>
            <p className="mt-3 text-3xl font-bold text-white">{brl(data.gastoHojeBRL)}</p>
            <p className="mt-1 text-sm text-zinc-500">{data.gastoHojeCreditos} créditos Higgsfield</p>
          </div>
          <div className="glass rounded-2xl border border-zinc-800/50 p-6">
            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">
              <PiggyBank className="h-4 w-4" /> Gasto no mês
            </p>
            <p className="mt-3 text-3xl font-bold text-white">{brl(data.gastoMesBRL)}</p>
            <p className="mt-1 text-sm text-zinc-500">teto {brl(tetoMes)} · caixa (top-ups): {brl(data.caixaMesBRL)}</p>
          </div>
          <div className="glass rounded-2xl border border-zinc-800/50 p-6">
            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">
              <Coins className="h-4 w-4" /> Saldo Higgsfield
            </p>
            <p className="mt-3 text-3xl font-bold text-white">
              {data.saldoHiggsfield ? `${Math.round(data.saldoHiggsfield.creditos)} cr` : '—'}
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              ≈ {data.saldoHiggsfield ? brl(data.saldoHiggsfield.creditos * (t?.credito_brl ?? 1)) : '—'}
            </p>
          </div>
          <div className="glass rounded-2xl border border-zinc-800/50 p-6">
            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">
              <Film className="h-4 w-4" /> Banco de clips
            </p>
            <p className="mt-3 text-3xl font-bold text-white">{data.clipsNoBanco}</p>
            <p className="mt-1 text-sm text-zinc-500">
              cenas pagas reutilizáveis (≈ {brl(data.clipsNoBanco * 45 * (t?.credito_brl ?? 0.27))} já investidos)
            </p>
          </div>
        </div>

        {/* Travas */}
        <div className="glass rounded-2xl border border-zinc-800/50 p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <Lock className="h-5 w-5 text-amber-400" /> Travas de orçamento (guard ativo)
          </h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl bg-zinc-900/60 p-4">
              <div className="flex items-baseline justify-between">
                <p className="text-sm font-semibold text-zinc-200">Teto Higgsfield / dia</p>
                <p className={`text-sm font-bold ${estourouDia ? 'text-red-400' : 'text-white'}`}>
                  {data.gastoHojeCreditos} / {tetoDia} cr
                </p>
              </div>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className={`h-full rounded-full ${estourouDia ? 'bg-red-500' : 'bg-linear-to-r from-green-500 to-emerald-400'}`}
                  style={{ width: `${Math.max(2, pctTetoDia)}%` }}
                />
              </div>
              {estourouDia && (
                <p className="mt-2 flex items-center gap-1 text-xs text-red-400">
                  <AlertTriangle className="h-3.5 w-3.5" /> Teto estourado — orquestrador bloqueia novos lotes hoje.
                </p>
              )}
            </div>
            <div className="rounded-xl bg-zinc-900/60 p-4">
              <div className="flex items-baseline justify-between">
                <p className="text-sm font-semibold text-zinc-200">Teto R$ / mês</p>
                <p className={`text-sm font-bold ${estourouMes ? 'text-red-400' : 'text-white'}`}>
                  {brl(data.gastoMesBRL)} / {brl(tetoMes)}
                </p>
              </div>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className={`h-full rounded-full ${estourouMes ? 'bg-red-500' : 'bg-linear-to-r from-green-500 to-emerald-400'}`}
                  style={{ width: `${Math.max(2, pctTetoMes)}%` }}
                />
              </div>
            </div>
          </div>
          <div className="mt-4 grid gap-2 text-sm text-zinc-400 md:grid-cols-2">
            <p className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-green-400" /> Máx {t?.max_videos_dia ?? 3} vídeos/dia ·{' '}
              {t?.max_cenas_novas_por_video ?? 5} cenas novas/vídeo · ≥{t?.min_clips_banco_por_video ?? 1} clip do banco
            </p>
            <p className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-green-400" /> Acima do teto: geração ABORTA — só roda com
              autorização explícita do dono
            </p>
          </div>
          <p className="mt-3 text-xs text-zinc-500">
            Custo real/vídeo (receita antiga): {brl(CUSTO_POR_VIDEO.totalBRL)} · Meta receita enxuta:{' '}
            {brl(CUSTO_POR_VIDEO.metaBRL)} · Travas editáveis em pulso_core.configuracoes (orcamento_travas).
          </p>
        </div>

        {/* Por serviço + lançamentos */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="glass rounded-2xl border border-zinc-800/50 p-6">
            <h2 className="text-lg font-semibold text-white">Gasto do mês por serviço</h2>
            <div className="mt-4 space-y-3">
              {data.gastoPorServico.map((s) => {
                const max = data.gastoPorServico[0]?.brl || 1
                return (
                  <div key={s.servico} className="flex items-center gap-3">
                    <span className="w-44 truncate text-sm text-zinc-300">{SERVICO_LABEL[s.servico] || s.servico}</span>
                    <div className="h-4 flex-1 overflow-hidden rounded-full bg-zinc-800/80">
                      <div
                        className="h-full rounded-full bg-linear-to-r from-green-600 to-emerald-500"
                        style={{ width: `${Math.max(2, (s.brl / max) * 100)}%` }}
                      />
                    </div>
                    <span className="w-24 text-right text-sm font-semibold text-white">{brl(s.brl)}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="glass rounded-2xl border border-zinc-800/50 p-6">
            <h2 className="text-lg font-semibold text-white">Lançamentos</h2>
            <div className="mt-4 max-h-72 space-y-2 overflow-y-auto pr-1">
              {data.lancamentos.map((l) => (
                <div key={l.id} className="flex items-center gap-3 rounded-lg bg-zinc-900/50 px-3 py-2">
                  <span className="w-20 text-xs text-zinc-500">{l.data.slice(5).split('-').reverse().join('/')}</span>
                  <span className="flex-1 truncate text-sm text-zinc-300" title={l.descricao}>
                    {l.descricao}
                  </span>
                  {l.creditos != null && <span className="text-xs text-zinc-500">{l.creditos}cr</span>}
                  <span className="w-24 text-right text-sm font-semibold text-white">{brl(l.brl)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
