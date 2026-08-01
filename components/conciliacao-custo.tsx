'use client'

import { AlertTriangle, CheckCircle2, Receipt } from 'lucide-react'

import { useFinanceiro } from '@/lib/hooks/use-financeiro'

/**
 * CONCILIAÇÃO DE CUSTO — o razão que nós escrevemos × o extrato que a conta cobrou.
 *
 * Existe porque em 01/08/2026 os dois discordavam em 2,3×, e nada na tela deixava perceber: o app
 * dizia R$ 7.300 de produção, a Higgsfield tinha cobrado R$ 3.227. Dois erros somados —
 * `gen_scenes.py` gravava R$ 1,00/crédito (o real é R$ 0,27) e contava como Higgsfield toda cena
 * concluída, inclusive as que saíram de Wan, do acervo grátis e do banco de clips. Entre 22/07 e
 * 01/08 foram 1.964 créditos lançados com o saldo real da conta em 10,38.
 *
 * Os dois erros já estão corrigidos na origem. Este painel fica porque o razão volta a derrapar
 * silenciosamente na próxima vez que um motor novo entrar na cascata — e uma divergência que
 * aparece sozinha na tela é a única que se conserta antes de virar decisão errada.
 */

const brl = (n: number) => `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const fmtData = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })

export function ConciliacaoCusto() {
  const { data } = useFinanceiro()
  const c = data?.conciliacao

  if (!c) {
    return (
      <div className="rounded-2xl border border-white/8 bg-[#1a1922] p-5">
        <div className="flex items-center gap-2">
          <Receipt className="h-4 w-4 text-zinc-500" />
          <h2 className="text-base font-semibold text-zinc-300">Conciliação com a conta Higgsfield</h2>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-zinc-500">
          O extrato real ainda não foi sincronizado. Quem sobe é o worker de render local — o CLI da
          Higgsfield só está autenticado naquela máquina. Roda junto do próximo render (08h/16h/23h).
        </p>
      </div>
    )
  }

  const difBRL = c.brlRazao - c.brlReal
  const difCr = c.creditosRazao - c.creditosReais
  const bate = Math.abs(difCr) <= 1 && Math.abs(difBRL) < 1

  return (
    <div className="rounded-2xl border border-white/8 bg-[#1a1922] p-5">
      <div className="flex flex-wrap items-center gap-2">
        {bate ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <AlertTriangle className="h-4 w-4 text-amber-400" />}
        <h2 className="text-base font-semibold text-white">Conciliação com a conta Higgsfield</h2>
        <span className="ml-auto text-[10px] text-zinc-600">
          extrato de {c.periodo} · sincronizado {new Date(c.sincronizadoEm).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      <div className="mt-3.5 grid gap-2.5 sm:grid-cols-2">
        <div className="rounded-xl border border-white/8 bg-black/20 px-3.5 py-3">
          <p className="text-[10px] uppercase tracking-wide text-zinc-600">Razão do app (escrito por nós)</p>
          <p className="mt-0.5 text-lg font-semibold tabular-nums text-zinc-300">{brl(c.brlRazao)}</p>
          <p className="text-[11px] text-zinc-600">{c.creditosRazao.toLocaleString('pt-BR')} créditos lançados</p>
        </div>
        <div className="rounded-xl border border-violet-500/25 bg-violet-500/[0.05] px-3.5 py-3">
          <p className="text-[10px] uppercase tracking-wide text-violet-400/70">Extrato da conta (verdade)</p>
          <p className="mt-0.5 text-lg font-semibold tabular-nums text-violet-200">{brl(c.brlReal)}</p>
          <p className="text-[11px] text-zinc-500">
            {c.creditosReais.toLocaleString('pt-BR')} créditos, líquido de refund · {brl(c.creditoBRL)}/cr
          </p>
        </div>
      </div>

      {!bate && (
        <p className="mt-2.5 rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-3 py-2 text-xs leading-relaxed text-amber-200/90">
          O razão está <strong>{brl(Math.abs(difBRL))} {difBRL > 0 ? 'acima' : 'abaixo'}</strong> do
          que a conta cobrou ({difCr > 0 ? '+' : ''}{difCr.toLocaleString('pt-BR')} créditos).
          {c.diasDivergentes.length > 0 && <> Divergem {c.diasDivergentes.length} dia(s).</>}
        </p>
      )}

      {c.diasDivergentes.length > 0 && (
        <div className="mt-2.5 max-h-44 overflow-y-auto rounded-lg border border-white/8">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-[#232130] text-[10px] uppercase tracking-wide text-zinc-500">
              <tr><th className="px-3 py-1.5 text-left">Dia</th><th className="px-3 py-1.5 text-right">Razão</th><th className="px-3 py-1.5 text-right">Conta</th><th className="px-3 py-1.5 text-right">Dif.</th></tr>
            </thead>
            <tbody>
              {c.diasDivergentes.map((d) => (
                <tr key={d.data} className="border-t border-white/5">
                  <td className="px-3 py-1.5 text-zinc-400">{fmtData(d.data)}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums text-zinc-400">{d.razao.toLocaleString('pt-BR')}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums text-zinc-300">{d.real.toLocaleString('pt-BR')}</td>
                  <td className={`px-3 py-1.5 text-right tabular-nums ${d.razao > d.real ? 'text-amber-400' : 'text-sky-400'}`}>
                    {d.razao > d.real ? '+' : ''}{(d.razao - d.real).toLocaleString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data!.gastoPorModelo.length > 0 && (
        <>
          <p className="mt-4 mb-2 text-[10px] uppercase tracking-wide text-zinc-600">Onde o crédito foi, por modelo (extrato real)</p>
          <div className="space-y-1">
            {data!.gastoPorModelo.map((m) => {
              const maior = data!.gastoPorModelo[0].creditos || 1
              return (
                <div key={m.modelo} className="flex items-center gap-2.5">
                  <span className="w-40 shrink-0 truncate text-xs text-zinc-400" title={m.modelo}>{m.modelo}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
                    <div className="h-full rounded-full bg-violet-500/50" style={{ width: `${(m.creditos / maior) * 100}%` }} />
                  </div>
                  <span className="w-20 shrink-0 text-right text-[11px] tabular-nums text-zinc-500">{m.creditos.toLocaleString('pt-BR')} cr</span>
                  <span className="w-20 shrink-0 text-right text-[11px] tabular-nums text-zinc-400">{brl(m.brl)}</span>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
