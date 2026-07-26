'use client'

import { use } from 'react'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, TrendingUp } from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useVideo } from '@/lib/hooks/use-video'

const n = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : String(v))
const NOME_REDE: Record<string, string> = {
  youtube: 'YouTube', instagram: 'Instagram', facebook: 'Facebook', tiktok: 'TikTok', kwai: 'Kwai',
}
const PADRAO_LABEL: Record<string, { txt: string; cor: string }> = {
  explosao: { txt: 'Explosão rápida — quase tudo nos primeiros dias', cor: 'text-amber-300' },
  evergreen: { txt: 'Evergreen — ainda ganhando views', cor: 'text-emerald-300' },
  desacelerando: { txt: 'Desacelerando — o ganho quase parou', cor: 'text-zinc-400' },
  estavel: { txt: 'Estável — cresce devagar', cor: 'text-sky-300' },
  poucos_dados: { txt: 'Poucos dados ainda', cor: 'text-zinc-500' },
}
const EIXO = { fill: '#6e6b7b', fontSize: 11 }

export default function VideoDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data, isLoading } = useVideo(id)

  if (isLoading) return <div className="mx-auto max-w-4xl p-6"><div className="h-96 animate-pulse rounded-2xl bg-[#1a1922]" /></div>
  if (!data) return (
    <div className="mx-auto max-w-4xl p-6 text-center text-zinc-400">
      Vídeo não encontrado. <Link href="/analytics" className="text-violet-400 hover:underline">Voltar</Link>
    </div>
  )

  const serieChart = data.serie.map((p) => ({ ...p, label: p.data.slice(5) }))
  const padrao = PADRAO_LABEL[data.padrao]

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-6">
      <Link href="/analytics" className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200">
        <ArrowLeft className="h-4 w-4" /> Analytics
      </Link>

      {/* cabeçalho */}
      <div className="rounded-2xl border border-white/8 bg-[#1a1922] p-6">
        <div className="flex flex-wrap items-center gap-2">
          {data.numero != null && <span className="text-xs font-bold text-zinc-600">#{data.numero}</span>}
          <span className="rounded-md bg-zinc-800/70 px-2 py-0.5 text-[11px] text-zinc-400">{data.canalNome.replace(/^PULSO\s*/i, '')}</span>
          {data.notaHook != null && <span className="rounded-md bg-violet-500/15 px-2 py-0.5 text-[11px] font-bold text-violet-300">gancho ★{data.notaHook}</span>}
          {data.duracaoSeg != null && <span className="text-[11px] text-zinc-500">{data.duracaoSeg}s</span>}
        </div>
        <h1 className="mt-2 text-xl font-semibold text-white">{data.titulo}</h1>
        {data.videoUrl && (
          <a href={data.videoUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-300">
            ver o vídeo <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      {/* consolidado */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi titulo="Views (todas as redes)" valor={n(data.viewsTotal)} />
        <Kpi titulo="Alcance (pessoas)" valor={data.reachTotal != null ? n(data.reachTotal) : '—'} nota={data.reachTotal == null ? 'só IG+FB medem' : 'IG+FB'} />
        <Kpi titulo="Seguidores ganhos" valor={data.seguidoresTotal != null ? `+${data.seguidoresTotal}` : '—'} nota={data.seguidoresTotal == null ? 'só FB mede' : 'FB'} />
      </div>

      {/* linha do tempo */}
      <div className="rounded-2xl border border-white/8 bg-[#1a1922] p-6">
        <div className="flex flex-wrap items-center gap-2">
          <TrendingUp className="h-5 w-5 text-violet-400" />
          <h2 className="text-lg font-semibold text-white">Linha do tempo</h2>
          {padrao && <span className={`ml-auto text-[11px] ${padrao.cor}`}>{padrao.txt}</span>}
        </div>
        {serieChart.length < 2 ? (
          <p className="mt-4 text-sm text-zinc-500">Sem série suficiente (o vídeo é recente ou pouco coletado).</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={serieChart} margin={{ top: 12, right: 12, bottom: 4, left: 4 }}>
              <defs>
                <linearGradient id="gv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#2a2833" />
              <XAxis dataKey="label" tick={EIXO} tickLine={false} axisLine={{ stroke: '#2a2833' }} minTickGap={24} />
              <YAxis tick={EIXO} tickLine={false} axisLine={false} width={40} tickFormatter={n} />
              <Tooltip
                contentStyle={{ background: '#12111a', border: '1px solid #2a2833', borderRadius: 10, fontSize: 12 }}
                formatter={(v: number) => [n(v) + ' views', 'acumulado']}
              />
              <Area type="monotone" dataKey="views" stroke="#8b5cf6" strokeWidth={2} fill="url(#gv)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* por plataforma */}
      <div className="rounded-2xl border border-white/8 bg-[#1a1922] p-6">
        <h2 className="mb-3 text-lg font-semibold text-white">Por rede</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-xs">
            <thead className="text-zinc-500">
              <tr>
                <th className="pb-2 font-medium">Rede</th>
                <th className="pb-2 text-right font-medium">Views</th>
                <th className="pb-2 text-right font-medium">Alcance</th>
                <th className="pb-2 text-right font-medium">Retenção</th>
                <th className="pb-2 text-right font-medium">Percentil</th>
                <th className="pb-2 text-right font-medium">Eng.</th>
                <th className="pb-2 text-right font-medium">Seg.</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody className="text-zinc-300">
              {data.redes.map((r) => (
                <tr key={r.plataforma} className="border-t border-white/5">
                  <td className="py-2 font-medium text-zinc-100">{NOME_REDE[r.plataforma] || r.plataforma}</td>
                  <td className="py-2 text-right tabular-nums">{n(r.views)}</td>
                  <td className="py-2 text-right tabular-nums text-zinc-400">{r.reach != null ? n(r.reach) : <span className="text-zinc-700">ind.</span>}</td>
                  <td className="py-2 text-right tabular-nums text-zinc-400">{r.taxaRetencao != null ? `${r.taxaRetencao}%` : <span className="text-zinc-700">ind.</span>}</td>
                  <td className="py-2 text-right tabular-nums">{r.percentil != null ? <span className={r.percentil >= 60 ? 'text-emerald-400' : r.percentil <= 40 ? 'text-amber-400' : 'text-zinc-400'}>p{r.percentil}</span> : <span className="text-zinc-700">—</span>}</td>
                  <td className="py-2 text-right tabular-nums text-zinc-500">{n(r.likes + r.comentarios + r.shares + r.saves)}</td>
                  <td className="py-2 text-right tabular-nums text-zinc-500">{r.seguidores != null ? `+${r.seguidores}` : <span className="text-zinc-700">—</span>}</td>
                  <td className="py-2 text-right">{r.url && <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-zinc-300"><ExternalLink className="ml-auto h-3.5 w-3.5" /></a>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[11px] text-zinc-600">
          <b className="text-zinc-500">Percentil</b> = posição da retenção deste vídeo entre os da mesma rede. <b className="text-zinc-500">ind.</b> = a API da rede não entrega a métrica (retenção só YouTube/Instagram/Facebook; alcance só Instagram/Facebook). Clipes usados: não rastreados por vídeo hoje.
        </p>
      </div>
    </div>
  )
}

function Kpi({ titulo, valor, nota }: { titulo: string; valor: string; nota?: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-[#1a1922] p-4">
      <p className="text-[11px] text-zinc-500">{titulo}</p>
      <p className="mt-1 text-2xl font-semibold text-white">{valor}</p>
      {nota && <p className="text-[10px] text-zinc-600">{nota}</p>}
    </div>
  )
}
