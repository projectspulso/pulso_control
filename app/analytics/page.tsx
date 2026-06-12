'use client'

import { useMemo, useState } from 'react'
import {
  BadgeDollarSign,
  BarChart3,
  Eye,
  Filter,
  Heart,
  MessageCircle,
  Share2,
  TrendingUp,
  Trophy,
  Wallet,
} from 'lucide-react'

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { ErrorState } from '@/components/ui/error-state'
import { ASSINATURAS_MENSAIS_BRL, CUSTO_POR_VIDEO } from '@/lib/config/custos'
import { useBi, type BiFiltros } from '@/lib/hooks/use-bi'

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

  const resumo = useMemo(() => {
    if (!data) return null
    const views = data.publicacoes.reduce((a, p) => a + p.views, 0)
    const likes = data.publicacoes.reduce((a, p) => a + p.likes, 0)
    const comentarios = data.publicacoes.reduce((a, p) => a + p.comentarios, 0)
    const shares = data.publicacoes.reduce((a, p) => a + p.shares + p.saves, 0)
    const custoProducao = data.videosProduzidos * CUSTO_POR_VIDEO.totalBRL
    const assinaturas = Object.values<number>({ ...ASSINATURAS_MENSAIS_BRL }).reduce((a, b) => a + b, 0)
    return {
      views,
      likes,
      comentarios,
      shares,
      ressonancia: views > 0 ? (likes / views) * 100 : 0,
      custoProducao,
      assinaturas,
      custoPorView: views > 0 ? custoProducao / views : 0,
      receita: 0, // gate de monetização (CNPJ/AdSense) ainda não aberto — ver CONFIG_REDES §3.3
    }
  }, [data])

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
      .map(([rede, v]) => ({ rede, ...v, share: (v.views / total) * 100 }))
      .sort((a, b) => b.views - a.views)
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

        {/* Share por rede */}
        <div className="glass rounded-2xl border border-zinc-800/50 p-6">
          <h2 className="text-lg font-semibold text-white">Onde os views estão nascendo</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {porRede.map((r) => (
              <div key={r.rede} className="rounded-xl bg-zinc-900/60 p-4">
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
                <p className="mt-1 text-xs text-zinc-500">
                  {r.share.toFixed(1)}% do alcance · {n(r.likes)} likes
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Curva diária */}
        <div className="glass rounded-2xl border border-zinc-800/50 p-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-400" />
            <h2 className="text-lg font-semibold text-white">Views por dia (coleta diária)</h2>
          </div>
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
                  Custo médio por vídeo (Higgsfield {CUSTO_POR_VIDEO.higgsfieldCreditos}cr + ElevenLabs + GPT)
                </dt>
                <dd className="font-semibold text-white">{brl(CUSTO_POR_VIDEO.totalBRL)}</dd>
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
