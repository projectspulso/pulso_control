'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Factory, AlertTriangle, CheckCircle2, Loader2, Clapperboard } from 'lucide-react'

interface Item {
  id: string
  ideiaId: string
  numero: number | null
  titulo: string
  canal: string
  tier: number
  cenas: number
}
interface Preview {
  alvo: number
  jaAutorizados: number
  prontosEstoque: number
  autorizaveis: number
  semCenas: number
  loteSugerido: Item[]
  itensSemCenas: Item[]
  custoEstimadoCr: number
  custoEstimadoBrl: number
}

export function ProduzirDia() {
  const qc = useQueryClient()
  const [enviando, setEnviando] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const { data, isLoading, refetch } = useQuery<Preview>({
    queryKey: ['produzir-dia'],
    refetchInterval: 5 * 60 * 1000,
    queryFn: () => fetch('/api/producao/produzir-dia').then((r) => r.json()),
  })

  async function produzir() {
    if (!data) return
    setEnviando(true)
    setMsg(null)
    try {
      const r = await fetch('/api/producao/produzir-dia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alvo: data.alvo }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'falha')
      setMsg(
        d.autorizados > 0
          ? `✅ ${d.autorizados} vídeo(s) autorizado(s) (~${d.custoEstimadoCr}cr / ~R$${d.custoEstimadoBrl}). O worker renderiza às 16h/23h.`
          : `ℹ️ ${d.motivo}`,
      )
      await Promise.all([refetch(), qc.invalidateQueries({ queryKey: ['hoje'] })])
    } catch (e) {
      setMsg(`❌ ${e instanceof Error ? e.message : 'erro'}`)
    } finally {
      setEnviando(false)
    }
  }

  if (isLoading || !data) {
    return <div className="h-32 animate-pulse rounded-2xl bg-zinc-900/50" />
  }

  const estoqueCritico = data.prontosEstoque <= 1
  const semAutorizados = data.jaAutorizados === 0
  const faltam = Math.max(0, data.alvo - data.jaAutorizados)
  const podeProduzir = data.loteSugerido.length > 0 && faltam > 0

  // alarme: estoque baixo E nada autorizado pra render = a esteira vai parar
  const alarme = estoqueCritico && semAutorizados

  return (
    <div className={`rounded-2xl border p-5 ${alarme ? 'border-red-500/40 bg-red-950/20' : 'border-zinc-800/60 bg-zinc-900/40'}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            <Factory className="h-3.5 w-3.5" /> Produzir o dia
          </div>
          <p className="mt-1 text-sm text-zinc-400">
            Um clique autoriza os melhores áudios (tier-1, com cenas) pra render. Sem arrastar card a card.
          </p>
        </div>
        <button
          onClick={produzir}
          disabled={enviando || !podeProduzir}
          title={podeProduzir ? `Autoriza ${data.loteSugerido.length} vídeo(s) pra render` : 'Nada novo pra autorizar agora'}
          className="flex items-center gap-2 rounded-lg bg-linear-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-violet-500/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clapperboard className="h-4 w-4" />}
          {enviando ? 'Autorizando…' : podeProduzir ? `Produzir ${data.loteSugerido.length} (~${data.custoEstimadoCr}cr)` : 'Nada a produzir'}
        </button>
      </div>

      {alarme && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            <b>Esteira vai parar.</b> Só {data.prontosEstoque} vídeo pronto e nada autorizado pra render — amanhã o streak quebra. Clique em Produzir o dia.
          </span>
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Mini label="Prontos (estoque)" valor={data.prontosEstoque} cls={estoqueCritico ? 'text-red-400' : 'text-emerald-300'} />
        <Mini label="Autorizados p/ render" valor={data.jaAutorizados} cls={semAutorizados ? 'text-amber-400' : 'text-violet-300'} />
        <Mini label="Áudios c/ cenas" valor={data.autorizaveis} cls="text-zinc-200" />
        <Mini label="Sem cenas (bloqueados)" valor={data.semCenas} cls={data.semCenas ? 'text-amber-400' : 'text-zinc-500'} />
      </div>

      {data.loteSugerido.length > 0 && (
        <div className="mt-4">
          <div className="mb-1.5 text-[11px] uppercase tracking-wide text-zinc-500">Próximo lote (o que vai ser autorizado)</div>
          <div className="space-y-1">
            {data.loteSugerido.map((c) => (
              <div key={c.id} className="flex items-center gap-2 rounded-lg bg-zinc-900/60 px-3 py-1.5 text-sm">
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${c.tier === 1 ? 'bg-emerald-500/15 text-emerald-300' : c.tier === 3 ? 'bg-zinc-700/40 text-zinc-400' : 'bg-blue-500/15 text-blue-300'}`}>T{c.tier}</span>
                <span className="shrink-0 text-xs text-zinc-500">{c.canal}</span>
                <span className="truncate text-zinc-200">{c.titulo}</span>
                <span className="ml-auto shrink-0 text-[11px] text-zinc-600">{c.cenas} cenas</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.itensSemCenas.length > 0 && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-2.5 text-xs text-amber-200/90">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            {data.itensSemCenas.length} áudio(s) sem cenas — não entram na fila até gerar as cenas (evita travar o worker): {data.itensSemCenas.slice(0, 4).map((i) => `#${i.numero ?? '?'}`).join(', ')}
            {data.itensSemCenas.length > 4 ? '…' : ''}
          </span>
        </div>
      )}

      {msg && (
        <p className="mt-3 flex items-center gap-1.5 text-sm text-zinc-300">
          {msg.startsWith('✅') && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
          {msg}
        </p>
      )}
    </div>
  )
}

function Mini({ label, valor, cls }: { label: string; valor: number; cls: string }) {
  return (
    <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-3">
      <div className="text-[10px] uppercase tracking-wide text-zinc-500">{label}</div>
      <div className={`mt-0.5 text-2xl font-bold tabular-nums ${cls}`}>{valor}</div>
    </div>
  )
}
