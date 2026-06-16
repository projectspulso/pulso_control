'use client'

import { useMemo, useState } from 'react'
import {
  BadgeDollarSign,
  BarChart3,
  Eye,
  Filter,
  Flame,
  Grid3x3,
  Heart,
  Lightbulb,
  MessageCircle,
  Share2,
  TrendingUp,
  Trophy,
  Wallet,
} from 'lucide-react'

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useQuery } from '@tanstack/react-query'

import { ErrorState } from '@/components/ui/error-state'
import { ASSINATURAS_MENSAIS_BRL, CUSTO_POR_VIDEO } from '@/lib/config/custos'
import { GATES_MONETIZACAO } from '@/lib/config/monetizacao'
import { useBi, type BiFiltros } from '@/lib/hooks/use-bi'
import { useFinanceiro } from '@/lib/hooks/use-financeiro'

interface StatusContas {
  contas: Record<string, { seguidores: number | null; detalhe?: string }>
}

function useStatusContas() {
  return useQuery<StatusContas>({
    queryKey: ['status-contas'],
    refetchInterval: 60 * 60 * 1000,
    queryFn: () => fetch('/api/automation/status-contas').then((r) => r.json()),
  })
}

const PLATAFORMAS = [
  { value: 'todas', label: 'Todas as redes' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'tiktok', label: 'TikTok' },
]

const PERIODOS = [
  { value: 0, label: 'Desde o início' },
  { value: 7, label: 'Últimos 7 dias' },
  { value: 30, label: 'Últimos 30 dias' },
]

function n(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    notation: value >= 10000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(value)
}

function brl(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

const PUBS_POR_PAGINA = 15

export default function AnalyticsPage() {
  const [filtros, setFiltros] = useState<BiFiltros>({ plataforma: 'todas', canalId: 'todos', periodoDias: 0 })
  const [paginaPubs, setPaginaPubs] = useState(1)
  const { data, isLoading, isError, refetch } = useBi(filtros)
  const { data: statusContas } = useStatusContas()
  const { data: fin } = useFinanceiro()

  const resumo = useMemo(() => {
    if (!data) return null
    const views = data.publicacoes.reduce((a, p) => a + p.views, 0)
    const likes = data.publicacoes.reduce((a, p) => a + p.likes, 0)
    const comentarios = data.publicacoes.reduce((a, p) => a + p.comentarios, 0)
    const shares = data.publicacoes.reduce((a, p) => a + p.shares + p.saves, 0)
    // custo REAL vindo do ledger (mesma fonte do /financeiro), respeitando o período do filtro
    const limite = filtros.periodoDias > 0 ? Date.now() - filtros.periodoDias * 864e5 : 0
    const lancProducao = (fin?.lancamentos || []).filter(
      (l) => l.servico !== 'topup' && l.servico !== 'assinatura' && (!limite || new Date(l.data).getTime() >= limite)
    )
    const custoProducao = lancProducao.reduce((a, l) => a + l.brl, 0)
    const custoPorVideo = data.videosProduzidos > 0 ? custoProducao / data.videosProduzidos : 0
    const assinaturas = Object.values<number>({ ...ASSINATURAS_MENSAIS_BRL }).reduce((a, b) => a + b, 0)
    return {
      views,
      likes,
      comentarios,
      shares,
      ressonancia: views > 0 ? (likes / views) * 100 : 0,
      custoProducao,
      custoPorVideo,
      assinaturas,
      custoPorView: views > 0 ? custoProducao / views : 0,
      receita: 0, // gate de monetização (CNPJ/AdSense) ainda não aberto — ver CONFIG_REDES §3.3
    }
  }, [data, fin, filtros.periodoDias])

  const rankingVertical = useMemo(() => {
    if (!data) return []
    const acc = new Map<string, { views: number; likes: number }>()
    for (const p of data.publicacoes) {
      const key = p.canalNome.replace(/^PULSO\s*/i, '')
      const v = acc.get(key) || { views: 0, likes: 0 }
      v.views += p.views
      v.likes += p.likes
      acc.set(key, v)
    }
    return [...acc.entries()].sort((a, b) => b[1].views - a[1].views)
  }, [data])

  const porRede = useMemo(() => {
    if (!data) return []
    const acc = new Map<string, { views: number; likes: number; posts: number }>()
    for (const p of data.publicacoes) {
      const v = acc.get(p.plataforma) || { views: 0, likes: 0, posts: 0 }
      v.views += p.views
      v.likes += p.likes
      v.posts += 1
      acc.set(p.plataforma, v)
    }
    const total = [...acc.values()].reduce((a, v) => a + v.views, 0) || 1
    return [...acc.entries()]
      .map(([rede, v]) => ({ rede, ...v, share: (v.views / total) * 100, ressonancia: v.views ? (v.likes / v.views) * 100 : 0 }))
      .sort((a, b) => b.views - a.views)
  }, [data])

  // 1) Top conteúdos somando TODAS as redes (qual vídeo viralizou)
  const topConteudos = useMemo(() => {
    if (!data) return []
    const acc = new Map<string, { titulo: string; vertical: string; views: number; likes: number; redes: Set<string> }>()
    for (const p of data.publicacoes) {
      const key = p.ideia_id || p.ideiaTitulo
      const v = acc.get(key) || { titulo: p.ideiaTitulo, vertical: p.canalNome.replace(/^PULSO\s*/i, ''), views: 0, likes: 0, redes: new Set<string>() }
      v.views += p.views
      v.likes += p.likes
      v.redes.add(p.plataforma)
      acc.set(key, v)
    }
    return [...acc.values()].sort((a, b) => b.views - a.views)
  }, [data])

  // 3) Recomendação de produção: views/vídeo por vertical
  const recomendacao = useMemo(() => {
    if (!data) return []
    const acc = new Map<string, { views: number; videos: Set<string> }>()
    for (const p of data.publicacoes) {
      const key = p.canalNome.replace(/^PULSO\s*/i, '')
      const v = acc.get(key) || { views: 0, videos: new Set<string>() }
      v.views += p.views
      v.videos.add(p.ideia_id || p.ideiaTitulo)
      acc.set(key, v)
    }
    const linhas = [...acc.entries()]
      .map(([vertical, v]) => ({ vertical, mediaPorVideo: Math.round(v.views / Math.max(1, v.videos.size)), videos: v.videos.size }))
      .sort((a, b) => b.mediaPorVideo - a.mediaPorVideo)
    const max = linhas[0]?.mediaPorVideo || 1
    return linhas.map((l) => ({
      ...l,
      acao: l.mediaPorVideo >= max * 0.6 ? 'produzir' : l.mediaPorVideo >= max * 0.3 ? 'manter' : 'segurar',
    }))
  }, [data])

  // 4) Matriz mesmo vídeo × rede
  const matrizRedes = useMemo(() => {
    if (!data) return { redes: [] as string[], linhas: [] as { titulo: string; total: number; porRede: Record<string, number> }[] }
    const redes = [...new Set(data.publicacoes.map((p) => p.plataforma))].sort()
    const acc = new Map<string, { titulo: string; total: number; porRede: Record<string, number> }>()
    for (const p of data.publicacoes) {
      const key = p.ideia_id || p.ideiaTitulo
      const v = acc.get(key) || { titulo: p.ideiaTitulo, total: 0, porRede: {} }
      v.porRede[p.plataforma] = (v.porRede[p.plataforma] || 0) + p.views
      v.total += p.views
      acc.set(key, v)
    }
    return { redes, linhas: [...acc.values()].sort((a, b) => b.total - a.total) }
  }, [data])

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

  if (isError || !data || !resumo) {
    return (
      <div className="min-h-screen bg-zinc-950 p-8">
        <div className="mx-auto max-w-7xl">
          <ErrorState
            title="Erro ao carregar o BI"
            message="Não foi possível montar o painel. Tente novamente."
            onRetry={() => refetch()}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header + filtros */}
        <div>
          <h1 className="text-3xl font-bold text-white">Analytics · BI</h1>
          <p className="mt-1 text-zinc-400">Decisões rápidas: alcance, ressonância, custo e curso por vertical.</p>
        </div>

        <div className="glass flex flex-wrap items-center gap-3 rounded-2xl border border-zinc-800/50 p-4">
          <Filter className="h-4 w-4 text-violet-400" />
          <select
            value={filtros.plataforma}
            onChange={(e) => { setFiltros((f) => ({ ...f, plataforma: e.target.value })); setPaginaPubs(1) }}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
          >
            {PLATAFORMAS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
          <select
            value={filtros.canalId}
            onChange={(e) => { setFiltros((f) => ({ ...f, canalId: e.target.value })); setPaginaPubs(1) }}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
          >
            <option value="todos">Todas as verticais</option>
            {data.canais.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
          <select
            value={filtros.periodoDias}
            onChange={(e) => { setFiltros((f) => ({ ...f, periodoDias: Number(e.target.value) })); setPaginaPubs(1) }}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
          >
            {PERIODOS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
          <span className="ml-auto text-xs text-zinc-500">
            {data.publicacoes.length} publicações · {data.videosProduzidos} vídeos no recorte
          </span>
        </div>

        {/* Cards */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="glass rounded-2xl border border-zinc-800/50 p-6">
            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">
              <Eye className="h-4 w-4" /> Views
            </p>
            <p className="mt-3 text-3xl font-bold text-white">{n(resumo.views)}</p>
          </div>
          <div className="glass rounded-2xl border border-zinc-800/50 p-6">
            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">
              <Heart className="h-4 w-4" /> Ressonância
            </p>
            <p className="mt-3 text-3xl font-bold text-white">{resumo.ressonancia.toFixed(1)}%</p>
            <p className="mt-1 text-sm text-zinc-500">{n(resumo.likes)} likes</p>
          </div>
          <div className="glass rounded-2xl border border-zinc-800/50 p-6">
            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">
              <MessageCircle className="h-4 w-4" /> Conversa
            </p>
            <p className="mt-3 text-3xl font-bold text-white">{n(resumo.comentarios)}</p>
            <p className="mt-1 flex items-center gap-1 text-sm text-zinc-500">
              <Share2 className="h-3.5 w-3.5" /> {n(resumo.shares)} shares+saves
            </p>
          </div>
          <div className="glass rounded-2xl border border-zinc-800/50 p-6">
            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">
              <Wallet className="h-4 w-4" /> Custo AI
            </p>
            <p className="mt-3 text-3xl font-bold text-white">{brl(resumo.custoProducao)}</p>
            <p className="mt-1 text-sm text-zinc-500">
              {resumo.views > 0 ? `${brl(resumo.custoPorView)} por view` : 'estimativa por vídeo'}
            </p>
          </div>
        </div>

        {/* Rumo à monetização */}
        <div className="glass rounded-2xl border border-zinc-800/50 p-6">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-semibold text-white">🎯 Rumo à monetização</h2>
            <span className="text-xs text-zinc-500">
              alvo inicial = 1º gate de cada rede · plano em docs/40_PRODUTO/18_PLANO_MONETIZACAO.md
            </span>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {GATES_MONETIZACAO.map((g) => {
              const atual = statusContas?.contas?.[g.plataforma]?.seguidores ?? null
              const pct = atual === null ? 0 : Math.min(100, (atual / g.metaSeguidores) * 100)
              return (
                <div key={g.plataforma} className="rounded-xl bg-zinc-900/60 p-4">
                  <div className="flex items-baseline justify-between">
                    <p className="text-sm font-semibold text-zinc-200">
                      {g.label} <span className="font-normal text-zinc-500">· {g.programa}</span>
                    </p>
                    <p className="text-sm font-bold tabular-nums text-white">
                      {atual === null ? '—' : n(atual)}
                      <span className="font-normal text-zinc-500"> / {n(g.metaSeguidores)}</span>
                    </p>
                  </div>
                  <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className={`h-full rounded-full ${pct >= 100 ? 'bg-linear-to-r from-green-500 to-emerald-400' : 'bg-linear-to-r from-amber-500 to-orange-500'}`}
                      style={{ width: `${Math.max(1.5, pct)}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-zinc-500">
                    {pct >= 100 ? '✅ gate de seguidores batido! ' : `${pct.toFixed(1)}% · `}
                    {g.metaSecundaria} · <span className="text-zinc-400">{g.recompensa}</span>
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Share + ressonância por rede */}
        <div className="glass rounded-2xl border border-zinc-800/50 p-6">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-semibold text-white">Onde os views nascem · onde a galera engaja</h2>
            <span className="text-xs text-zinc-500">barra = % do alcance · ressonância = likes/views</span>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {porRede.map((r) => {
              const melhorEngajamento = Math.max(...porRede.map((x) => x.ressonancia))
              const ehTopEngaja = r.ressonancia === melhorEngajamento && r.ressonancia > 0
              return (
                <div key={r.rede} className={`rounded-xl p-4 ${ehTopEngaja ? 'bg-emerald-500/10 ring-1 ring-emerald-500/30' : 'bg-zinc-900/60'}`}>
                  <div className="flex items-baseline justify-between">
                    <p className="text-sm font-semibold capitalize text-zinc-300">{r.rede}</p>
                    <p className="text-xs text-zinc-500">{r.posts} posts</p>
                  </div>
                  <p className="mt-2 text-2xl font-black tabular-nums text-white">{n(r.views)}</p>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-linear-to-r from-violet-600 to-pink-500"
                      style={{ width: `${Math.max(2, r.share)}%` }}
                    />
                  </div>
                  <p className="mt-1 flex items-center justify-between text-xs">
                    <span className="text-zinc-500">{r.share.toFixed(1)}% alcance</span>
                    <span className={ehTopEngaja ? 'font-bold text-emerald-400' : 'text-zinc-400'}>
                      {ehTopEngaja && '🔥 '}
                      {r.ressonancia.toFixed(1)}% engaja
                    </span>
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* 1) Top conteúdos (soma das redes) */}
        <div className="glass rounded-2xl border border-zinc-800/50 p-6">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-400" />
            <h2 className="text-lg font-semibold text-white">Top conteúdos — soma de todas as redes</h2>
          </div>
          <p className="mt-1 text-xs text-zinc-500">Qual vídeo viralizou no total. Replique a fórmula dos campeões.</p>
          <div className="mt-4 space-y-2">
            {topConteudos.slice(0, 8).map((c, i) => {
              const max = topConteudos[0]?.views || 1
              return (
                <div key={c.titulo + i} className="flex items-center gap-3">
                  <span className="w-5 text-right font-mono text-sm text-zinc-500">{i + 1}º</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-zinc-200">{c.titulo}</p>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className={`h-full rounded-full ${i === 0 ? 'bg-linear-to-r from-orange-500 to-amber-400' : 'bg-violet-600/70'}`}
                        style={{ width: `${Math.max(3, (c.views / max) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <span className="w-14 shrink-0 text-xs text-zinc-500">{c.vertical}</span>
                  <span className="w-12 shrink-0 text-center text-xs text-zinc-600">{c.redes.size} redes</span>
                  <span className="w-16 shrink-0 text-right text-sm font-bold text-white">{n(c.views)}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* 3) Recomendação de produção por vertical */}
        <div className="glass rounded-2xl border border-zinc-800/50 p-6">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-400" />
            <h2 className="text-lg font-semibold text-white">Recomendação de produção</h2>
          </div>
          <p className="mt-1 text-xs text-zinc-500">Baseado em views por vídeo. O guia do próximo lote.</p>
          <div className="mt-4 grid gap-2 md:grid-cols-3">
            {(['produzir', 'manter', 'segurar'] as const).map((acao) => {
              const itens = recomendacao.filter((r) => r.acao === acao)
              const cfg = {
                produzir: { label: '🚀 Produzir mais', cor: 'border-emerald-500/30 bg-emerald-500/5', txt: 'text-emerald-400' },
                manter: { label: '➡️ Manter', cor: 'border-zinc-700/60 bg-zinc-900/40', txt: 'text-zinc-300' },
                segurar: { label: '🛑 Segurar', cor: 'border-red-500/30 bg-red-500/5', txt: 'text-red-300' },
              }[acao]
              return (
                <div key={acao} className={`rounded-xl border ${cfg.cor} p-3`}>
                  <p className={`text-sm font-bold ${cfg.txt}`}>{cfg.label}</p>
                  <div className="mt-2 space-y-1.5">
                    {itens.map((r) => (
                      <div key={r.vertical} className="flex items-baseline justify-between text-sm">
                        <span className="truncate text-zinc-200">{r.vertical}</span>
                        <span className="ml-2 shrink-0 text-xs text-zinc-500">{n(r.mediaPorVideo)}/v</span>
                      </div>
                    ))}
                    {itens.length === 0 && <p className="text-xs text-zinc-600">—</p>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 4) Mesmo vídeo entre redes */}
        <div className="glass overflow-hidden rounded-2xl border border-zinc-800/50">
          <div className="flex items-center gap-2 p-6 pb-4">
            <Grid3x3 className="h-5 w-5 text-cyan-400" />
            <h2 className="text-lg font-semibold text-white">Mesmo vídeo entre redes</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800/50 text-left text-xs uppercase tracking-wider text-zinc-500">
                  <th className="px-6 py-3">Vídeo</th>
                  {matrizRedes.redes.map((r) => (
                    <th key={r} className="px-3 py-3 text-right capitalize">{r}</th>
                  ))}
                  <th className="px-6 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {matrizRedes.linhas.slice(0, 12).map((l, i) => (
                  <tr key={l.titulo + i} className="border-b border-zinc-800/30 hover:bg-zinc-900/40">
                    <td className="max-w-xs truncate px-6 py-3 text-zinc-200" title={l.titulo}>{l.titulo}</td>
                    {matrizRedes.redes.map((r) => (
                      <td key={r} className="px-3 py-3 text-right tabular-nums text-zinc-400">
                        {l.porRede[r] ? n(l.porRede[r]) : <span className="text-zinc-700">—</span>}
                      </td>
                    ))}
                    <td className="px-6 py-3 text-right font-bold text-white">{n(l.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Curva diária */}
        <div className="glass rounded-2xl border border-zinc-800/50 p-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-400" />
            <h2 className="text-lg font-semibold text-white">Views ganhos por dia</h2>
          </div>
          <p className="mt-1 text-xs text-zinc-500">Quanto de audiência entrou em cada dia (ganho = hoje − ontem) — pra ver se sobe ou cai.</p>
          {data.serieDiaria.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-500">
              Ainda sem histórico no recorte — a curva nasce com as coletas diárias do cron (8h BRT).
            </p>
          ) : (
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.serieDiaria} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="gradLikes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ec4899" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#ec4899" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis
                    dataKey="data"
                    tickFormatter={(v: string) => v.slice(5).split('-').reverse().join('/')}
                    tick={{ fill: '#71717a', fontSize: 11 }}
                    axisLine={{ stroke: '#3f3f46' }}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v: number) => n(v)}
                    tick={{ fill: '#71717a', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={48}
                  />
                  <Tooltip
                    contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 12, color: '#fff' }}
                    labelFormatter={(v: string) => new Date(v + 'T12:00:00').toLocaleDateString('pt-BR')}
                    formatter={(value: number, name: string) => [n(value), name === 'views' ? 'Views' : 'Likes']}
                  />
                  <Area type="monotone" dataKey="views" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#gradViews)" />
                  <Area type="monotone" dataKey="likes" stroke="#ec4899" strokeWidth={2} fill="url(#gradLikes)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Ranking vertical + financeiro */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="glass rounded-2xl border border-zinc-800/50 p-6">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-400" />
              <h2 className="text-lg font-semibold text-white">Aderência por vertical</h2>
            </div>
            <div className="mt-4 space-y-3">
              {rankingVertical.map(([vertical, stats], idx) => {
                const max = rankingVertical[0]?.[1].views || 1
                return (
                  <div key={vertical} className="flex items-center gap-3">
                    <span className="w-5 text-right font-mono text-sm text-zinc-500">{idx + 1}º</span>
                    <span className="w-40 truncate text-sm text-zinc-200">{vertical}</span>
                    <div className="h-5 flex-1 overflow-hidden rounded-full bg-zinc-800/80">
                      <div
                        className={`h-full rounded-full ${idx === 0 ? 'bg-linear-to-r from-amber-500 to-orange-500' : 'bg-violet-600/70'}`}
                        style={{ width: `${Math.max(2, Math.round((stats.views / max) * 100))}%` }}
                      />
                    </div>
                    <span className="w-16 text-right text-sm text-zinc-300">{n(stats.views)}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="glass rounded-2xl border border-zinc-800/50 p-6">
            <div className="flex items-center gap-2">
              <BadgeDollarSign className="h-5 w-5 text-green-400" />
              <h2 className="text-lg font-semibold text-white">Financeiro</h2>
            </div>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-zinc-400">Custo de produção (AI) no recorte</dt>
                <dd className="font-semibold text-white">{brl(resumo.custoProducao)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-400">
                  Custo médio por vídeo no recorte (ledger real ÷ vídeos produzidos)
                </dt>
                <dd className="font-semibold text-white">{brl(resumo.custoPorVideo)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500">Meta enxuta (mascote R$0 + 2 cenas Veo + banco de clips)</dt>
                <dd className="font-semibold text-zinc-400">{brl(CUSTO_POR_VIDEO.metaBRL)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-400">Assinaturas mensais (configurar em lib/config/custos.ts)</dt>
                <dd className="font-semibold text-white">{brl(resumo.assinaturas)}</dd>
              </div>
              <div className="flex justify-between border-t border-zinc-800/50 pt-3">
                <dt className="text-zinc-400">Receita dos canais</dt>
                <dd className="font-semibold text-zinc-500">
                  {brl(resumo.receita)} · aguardando gate de monetização (CNPJ/AdSense)
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Tabela de publicações */}
        <div className="glass overflow-hidden rounded-2xl border border-zinc-800/50">
          <div className="flex items-center gap-2 border-b border-zinc-800/50 p-6 pb-4">
            <BarChart3 className="h-5 w-5 text-violet-400" />
            <h2 className="text-lg font-semibold text-white">Publicações no recorte</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800/50 text-left text-xs uppercase tracking-wider text-zinc-500">
                  <th className="px-6 py-3">Vídeo</th>
                  <th className="px-3 py-3">Vertical</th>
                  <th className="px-3 py-3">Rede</th>
                  <th className="px-3 py-3">Publicado</th>
                  <th className="px-3 py-3 text-right">Views</th>
                  <th className="px-3 py-3 text-right">Likes</th>
                  <th className="px-3 py-3 text-right">Coment.</th>
                  <th className="px-6 py-3 text-right">Shares+Saves</th>
                </tr>
              </thead>
              <tbody>
                {data.publicacoes
                  .slice((Math.min(paginaPubs, Math.ceil(data.publicacoes.length / PUBS_POR_PAGINA) || 1) - 1) * PUBS_POR_PAGINA,
                    Math.min(paginaPubs, Math.ceil(data.publicacoes.length / PUBS_POR_PAGINA) || 1) * PUBS_POR_PAGINA)
                  .map((p) => (
                  <tr key={p.id} className="border-b border-zinc-800/30 hover:bg-zinc-900/40">
                    <td className="max-w-xs truncate px-6 py-3 text-zinc-200" title={p.ideiaTitulo}>
                      {p.url ? (
                        <a
                          href={p.url}
                          target="_blank"
                          rel="noreferrer"
                          className="underline-offset-2 hover:text-violet-300 hover:underline"
                        >
                          {p.ideiaTitulo}
                        </a>
                      ) : (
                        p.ideiaTitulo
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-zinc-400">
                      {p.canalNome.replace(/^PULSO\s*/i, '')}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 capitalize text-zinc-400">{p.plataforma}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-zinc-500">
                      {p.dataPublicacao ? new Date(p.dataPublicacao).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '—'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-right font-semibold text-white">{n(p.views)}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-right text-zinc-300">{n(p.likes)}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-right text-zinc-300">{n(p.comentarios)}</td>
                    <td className="whitespace-nowrap px-6 py-3 text-right text-zinc-300">{n(p.shares + p.saves)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.publicacoes.length > PUBS_POR_PAGINA && (
            <div className="flex items-center justify-between border-t border-zinc-800/50 px-6 py-3">
              <span className="text-xs text-zinc-500">
                {data.publicacoes.length} publicações · página{' '}
                {Math.min(paginaPubs, Math.ceil(data.publicacoes.length / PUBS_POR_PAGINA))} de{' '}
                {Math.ceil(data.publicacoes.length / PUBS_POR_PAGINA)}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPaginaPubs((p) => Math.max(1, p - 1))}
                  disabled={paginaPubs <= 1}
                  className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-40"
                >
                  ← Anterior
                </button>
                <button
                  onClick={() => setPaginaPubs((p) => Math.min(Math.ceil(data.publicacoes.length / PUBS_POR_PAGINA), p + 1))}
                  disabled={paginaPubs >= Math.ceil(data.publicacoes.length / PUBS_POR_PAGINA)}
                  className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-40"
                >
                  Próxima →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
