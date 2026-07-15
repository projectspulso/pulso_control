'use client'

import { Sparkles, TrendingUp, TrendingDown, HelpCircle } from 'lucide-react'
import {
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts'
import { useNotaVsViews, type PontoNota } from '@/lib/hooks/use-nota-vs-views'

// Nota é ORDINAL (3 < 4 < 5): rampa de um matiz só, do fraco ao forte. Uma paleta
// categórica (laranja/amarelo/verde) sugeria três coisas diferentes, não três degraus —
// e ainda pintava ★5 de verde "bom", prejulgando justo o que o painel investiga.
const COR_NOTA: Record<number, string> = { 3: '#4a4463', 4: '#6d61b0', 5: '#9085e9' }
const n = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : String(v))

/**
 * A NOTA PREVÊ VIRAL? — dispersão nota_hook × views + média por nota + veredito +
 * as surpresas (viralizou com nota baixa) e decepções (nota alta que floppou).
 * Serve pro dono validar se vale seguir priorizando por nota — e alimenta o critério.
 */
export function NotaVsViewsPanel() {
  const { data, isLoading } = useNotaVsViews()

  if (isLoading) return <div className="h-72 animate-pulse rounded-2xl bg-[#1a1922]" />
  if (!data || data.amostra < 3) {
    return (
      <div className="rounded-2xl border border-white/8 bg-[#1a1922] p-6">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-cyan-400" />
          <h2 className="text-lg font-semibold text-white">A nota prevê o viral?</h2>
        </div>
        <p className="mt-3 text-sm text-zinc-400">
          Ainda faltam publicações com nota e views pra medir. O painel liga sozinho conforme os vídeos com nota vão sendo publicados e coletados.
        </p>
      </div>
    )
  }

  const { pontos, porNota, correlacao, amostra, surpresas, decepcoes, veredito } = data
  const maxMedia = Math.max(...porNota.map((p) => p.mediaViews), 1)
  const corForte = correlacao == null ? 'text-zinc-400' : correlacao >= 0.4 ? 'text-emerald-300' : correlacao >= 0.15 ? 'text-amber-300' : 'text-red-300'

  return (
    <div className="rounded-2xl border border-white/8 bg-[#1a1922] p-6">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-cyan-400" />
        <h2 className="text-lg font-semibold text-white">A nota prevê o viral?</h2>
        <span className="ml-auto text-xs text-zinc-500">{amostra} vídeos com nota × views</span>
      </div>

      {/* Veredito + correlação */}
      <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-white/8 bg-[#232231] p-3">
        <div className="text-center">
          <div className={`text-2xl font-black tabular-nums ${corForte}`}>{correlacao == null ? '—' : correlacao.toFixed(2)}</div>
          <div className="text-[10px] uppercase tracking-wide text-zinc-500">correlação</div>
        </div>
        <p className="min-w-0 flex-1 text-sm text-zinc-300">{veredito}</p>
      </div>

      <div className="mt-4 grid gap-5 lg:grid-cols-2">
        {/* Dispersão nota × views */}
        <div>
          <div className="mb-1 text-xs uppercase tracking-wide text-zinc-500">Cada ponto é um vídeo (nota × alcance)</div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 8, right: 12, left: 4, bottom: 8 }}>
                <CartesianGrid stroke="#2c2c2a" strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  dataKey="notaHook"
                  name="Nota"
                  domain={[2.5, 5.5]}
                  ticks={[3, 4, 5]}
                  tick={{ fill: '#6e6b7b', fontSize: 12 }}
                  label={{ value: 'nota do gancho', position: 'insideBottom', offset: -4, fill: '#6e6b7b', fontSize: 11 }}
                />
                <YAxis
                  type="number"
                  dataKey="views"
                  name="Views"
                  tick={{ fill: '#6e6b7b', fontSize: 11 }}
                  tickFormatter={n}
                  width={40}
                />
                <ZAxis range={[60, 60]} />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3', stroke: '#52525b' }}
                  contentStyle={{ background: '#1a1922', border: '1px solid rgba(255,255,255,.14)', borderRadius: 10, color: '#fff', fontSize: 12 }}
                  formatter={(value: number | string, name: string) => [name === 'Views' ? n(Number(value)) : value, name]}
                  labelFormatter={() => ''}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  content={({ payload }: any) => {
                    const p: PontoNota | undefined = payload?.[0]?.payload
                    if (!p) return null
                    return (
                      <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-2 text-xs text-white shadow-xl">
                        <div className="font-semibold">{p.numero != null ? `#${p.numero} · ` : ''}{p.titulo}</div>
                        <div className="text-zinc-400">{p.canal} · nota ★{p.notaHook} · {n(p.views)} views</div>
                      </div>
                    )
                  }}
                />
                <Scatter data={pontos} fillOpacity={0.85}>
                  {pontos.map((p, i) => (
                    <Cell key={i} fill={COR_NOTA[p.notaHook] || '#514b63'} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Média de views por nota */}
        <div>
          <div className="mb-1 text-xs uppercase tracking-wide text-zinc-500">Média de views por nota (mediana entre parênteses)</div>
          <div className="mt-4 space-y-3">
            {porNota.map((p) => (
              <div key={p.nota} className="flex items-center gap-3">
                {/* rótulo direto da barra: segue a rampa dela, não o corNota5 do kanban
                    (lá a cor é sinal de status; aqui é o mesmo degrau que a barra pinta) */}
                <span
                  className="w-9 shrink-0 rounded-md px-1.5 py-0.5 text-center text-xs font-bold text-white ring-1 ring-inset ring-white/10"
                  style={{ background: `${COR_NOTA[p.nota] || '#514b63'}40` }}
                >
                  ★{p.nota}
                </span>
                <div className="h-6 flex-1 overflow-hidden rounded-full bg-[#232231]">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.max(3, Math.round((p.mediaViews / maxMedia) * 100))}%`, background: COR_NOTA[p.nota] || '#514b63' }}
                  />
                </div>
                <span className="w-24 shrink-0 text-right text-sm text-zinc-200">
                  {n(p.mediaViews)} <span className="text-[11px] text-zinc-500">({n(p.medianaViews)})</span>
                </span>
                <span className="w-8 shrink-0 text-right text-[11px] text-zinc-600">n={p.n}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Surpresas e decepções — o coração da pergunta do dono */}
      {(surpresas.length > 0 || decepcoes.length > 0) && (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {surpresas.length > 0 && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-300">
                <TrendingUp className="h-4 w-4" /> Viralizou com nota baixa
              </div>
              <p className="mt-0.5 text-[11px] text-zinc-500">A nota não pegou o que funcionou — estudar o que deu certo aqui.</p>
              <ul className="mt-2 space-y-1.5">
                {surpresas.map((p) => (
                  <li key={p.ideiaId} className="flex items-center gap-2 text-xs">
                    <span className="shrink-0 rounded bg-white/5 px-1.5 py-0.5 font-bold text-[#a3a0b0]">★{p.notaHook}</span>
                    {p.numero != null && <span className="shrink-0 text-zinc-600">#{p.numero}</span>}
                    <span className="min-w-0 flex-1 truncate text-zinc-200" title={p.titulo}>{p.titulo}</span>
                    <span className="shrink-0 font-semibold text-emerald-300">{n(p.views)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {decepcoes.length > 0 && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/[0.04] p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-red-300">
                <TrendingDown className="h-4 w-4" /> Nota alta que floppou
              </div>
              <p className="mt-0.5 text-[11px] text-zinc-500">Nota 5 mas pouco alcance — o critério superestimou o gancho.</p>
              <ul className="mt-2 space-y-1.5">
                {decepcoes.map((p) => (
                  <li key={p.ideiaId} className="flex items-center gap-2 text-xs">
                    <span className="shrink-0 rounded bg-white/5 px-1.5 py-0.5 font-bold text-[#a3a0b0]">★{p.notaHook}</span>
                    {p.numero != null && <span className="shrink-0 text-zinc-600">#{p.numero}</span>}
                    <span className="min-w-0 flex-1 truncate text-zinc-200" title={p.titulo}>{p.titulo}</span>
                    <span className="shrink-0 font-semibold text-red-300">{n(p.views)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
