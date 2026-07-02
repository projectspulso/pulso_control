'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BadgeDollarSign,
  BarChart3,
  CalendarDays,
  Clock,
  Eye,
  Filter,
  Flame,
  Grid3x3,
  Heart,
  Lightbulb,
  Minus,
  TrendingUp,
  Trophy,
  Wallet,
  X,
} from 'lucide-react'

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useQuery } from '@tanstack/react-query'

import { ErrorState } from '@/components/ui/error-state'
import { PageHeader } from '@/components/layout/page-header'
import { AuditPanel } from '@/components/audit-panel'
import { HorariosPanel } from '@/components/horarios-panel'
import { ASSINATURAS_MENSAIS_BRL, CUSTO_POR_VIDEO } from '@/lib/config/custos'
import { GATES_MONETIZACAO } from '@/lib/config/monetizacao'
import { useBi, type BiFiltros } from '@/lib/hooks/use-bi'
import { useDecisao } from '@/lib/hooks/use-decisao'
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
  { value: 'kwai', label: 'Kwai' },
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
  const [aba, setAba] = useState<'geral' | 'conteudo' | 'audiencia' | 'crescimento' | 'financeiro'>('geral')
  const [paginaPubs, setPaginaPubs] = useState(1)
  const [drill, setDrill] = useState<string | null>(null)
  const { data, isLoading, isError, refetch } = useBi(filtros)
  const { data: decisao } = useDecisao()
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
    // posts = VÍDEOS DISTINTOS por rede (re-publicação do mesmo vídeo não conta 2×);
    // views/likes somam todas as linhas (view real de cada post conta).
    const acc = new Map<string, { views: number; likes: number; videos: Set<string> }>()
    for (const p of data.publicacoes) {
      const v = acc.get(p.plataforma) || { views: 0, likes: 0, videos: new Set<string>() }
      v.views += p.views
      v.likes += p.likes
      v.videos.add(p.ideia_id || p.id)
      acc.set(p.plataforma, v)
    }
    const total = [...acc.values()].reduce((a, v) => a + v.views, 0) || 1
    return [...acc.entries()]
      .map(([rede, v]) => ({ rede, views: v.views, likes: v.likes, posts: v.videos.size, share: (v.views / total) * 100, ressonancia: v.views ? (v.likes / v.views) * 100 : 0 }))
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

  // 2) Desempenho por dia da semana (de publicação) — qual dia rende mais views/post
  const porDiaSemana = useMemo(() => {
    if (!data) return [] as { dia: string; views: number; posts: number; media: number }[]
    const nomes = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    const acc = new Map<number, { views: number; posts: number }>()
    for (const p of data.publicacoes) {
      if (!p.dataPublicacao) continue
      const wd = new Date(p.dataPublicacao).getDay()
      const v = acc.get(wd) || { views: 0, posts: 0 }
      v.views += p.views
      v.posts += 1
      acc.set(wd, v)
    }
    const ordem = [1, 2, 3, 4, 5, 6, 0] // Seg → Dom
    return ordem.map((wd) => {
      const v = acc.get(wd) || { views: 0, posts: 0 }
      return { dia: nomes[wd], views: v.views, posts: v.posts, media: v.posts ? Math.round(v.views / v.posts) : 0 }
    })
  }, [data])

  const melhorDia = useMemo(() => {
    const comDados = porDiaSemana.filter((d) => d.posts > 0)
    if (!comDados.length) return null
    return comDados.reduce((a, b) => (b.media > a.media ? b : a))
  }, [porDiaSemana])

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

  // Sinais de atenção: distribuição quebrada (rede morta) + alcance inflado.
  // Tudo derivado das publicações já carregadas — respeita o recorte dos filtros.
  const alertas = useMemo(() => {
    if (!data) return []
    const agora = Date.now()
    const idadeDias = (d: string) => (agora - new Date(d).getTime()) / 864e5

    // mediana de views por rede (posts com ≥3 dias) = a "curva normal" daquela rede
    const amostras = new Map<string, number[]>()
    for (const p of data.publicacoes) {
      if (idadeDias(p.dataPublicacao) < 3) continue
      const arr = amostras.get(p.plataforma) || []
      arr.push(p.views)
      amostras.set(p.plataforma, arr)
    }
    const mediana = new Map<string, number>()
    for (const [rede, arr] of amostras) {
      const s = [...arr].sort((a, b) => a - b)
      mediana.set(rede, s.length ? s[Math.floor(s.length / 2)] : 0)
    }

    type Alerta = {
      id: string
      severidade: 'alta' | 'media'
      plataforma: string
      titulo: string
      vertical: string
      views: number
      dias: number
      detalhe: string
    }
    const out: Alerta[] = []
    for (const p of data.publicacoes) {
      const dias = Math.floor(idadeDias(p.dataPublicacao))
      if (dias < 2) continue // dá um respiro de 48h pra rede distribuir
      const med = mediana.get(p.plataforma) || 0
      const base = {
        id: p.id,
        plataforma: p.plataforma,
        titulo: p.ideiaTitulo,
        vertical: p.canalNome.replace(/^PULSO\s*/i, ''),
        views: p.views,
        dias,
      }
      if (p.views < 10) {
        out.push({ ...base, severidade: 'alta', detalhe: `${p.views} views em ${dias}d — provável privado/"Somente eu" ou não distribuído` })
      } else if (med >= 50 && p.views < med * 0.2) {
        out.push({ ...base, severidade: 'media', detalhe: `${n(p.views)} views vs mediana ~${n(med)} da rede — fora da curva, conferir o upload` })
      }
    }
    return out.sort((a, b) =>
      a.severidade === b.severidade ? a.views - b.views : a.severidade === 'alta' ? -1 : 1
    )
  }, [data])

  // redes que inflam alcance: muito share, mas ressonância quase nula (ex.: FB Reels plays)
  const redesInfladas = useMemo(() => porRede.filter((r) => r.share >= 20 && r.ressonancia < 1), [porRede])

  // Tempo médio assistido por rede (segundos) — proxy de retenção cross-rede até o YouTube OAuth.
  // FB e IG entregam avg_watch; YouTube (precisa OAuth) e TikTok (sem API) ficam sem dado.
  const tempoMedioPorRede = useMemo(() => {
    if (!data) return [] as { rede: string; segundos: number; posts: number }[]
    const acc = new Map<string, { soma: number; n: number }>()
    for (const p of data.publicacoes) {
      if (p.avgWatchMs == null || p.avgWatchMs <= 0) continue
      const v = acc.get(p.plataforma) || { soma: 0, n: 0 }
      v.soma += p.avgWatchMs
      v.n += 1
      acc.set(p.plataforma, v)
    }
    return ['facebook', 'instagram', 'youtube', 'tiktok', 'kwai'].map((rede) => {
      const v = acc.get(rede)
      return { rede, segundos: v ? Math.round((v.soma / v.n / 1000) * 10) / 10 : 0, posts: v?.n || 0 }
    })
  }, [data])

  // % médio assistido por rede = avg watch ÷ duração do vídeo (proxy de retenção onde não há curva)
  const pctAssistidoPorRede = useMemo(() => {
    if (!data) return [] as { rede: string; pct: number; posts: number }[]
    const acc = new Map<string, { soma: number; n: number }>()
    for (const p of data.publicacoes) {
      if (p.avgWatchMs == null || p.avgWatchMs <= 0) continue
      if (p.duracaoSeg == null || p.duracaoSeg <= 0) continue
      const pct = (p.avgWatchMs / (p.duracaoSeg * 1000)) * 100
      const v = acc.get(p.plataforma) || { soma: 0, n: 0 }
      v.soma += pct
      v.n += 1
      acc.set(p.plataforma, v)
    }
    return ['facebook', 'instagram', 'youtube', 'tiktok', 'kwai'].map((rede) => {
      const v = acc.get(rede)
      return { rede, pct: v ? Math.round((v.soma / v.n) * 10) / 10 : 0, posts: v?.n || 0 }
    })
  }, [data])

  // Engajamento por rede = (likes+coment+shares+saves) / views × 100 (interações por 100 views)
  const engajamentoPorRede = useMemo(() => {
    if (!data) return [] as { rede: string; pct: number; posts: number }[]
    const acc = new Map<string, { soma: number; n: number }>()
    for (const p of data.publicacoes) {
      if (p.views <= 0) continue
      const pct = ((p.likes + p.comentarios + p.shares + p.saves) / p.views) * 100
      const v = acc.get(p.plataforma) || { soma: 0, n: 0 }
      v.soma += pct
      v.n += 1
      acc.set(p.plataforma, v)
    }
    return ['facebook', 'instagram', 'youtube', 'tiktok', 'kwai'].map((rede) => {
      const v = acc.get(rede)
      return { rede, pct: v ? Math.round((v.soma / v.n) * 10) / 10 : 0, posts: v?.n || 0 }
    })
  }, [data])

  // ── FAIXA EXECUTIVA (BI) ──
  // tendência de views: ganho dos últimos 7 dias vs os 7 anteriores (da série diária)
  const tendenciaViews = useMemo(() => {
    const s = data?.serieDiaria || []
    if (s.length < 8) return null
    const ult = s.slice(-7).reduce((a, d) => a + d.views, 0)
    const ant = s.slice(-14, -7).reduce((a, d) => a + d.views, 0)
    if (ant <= 0) return null
    return ((ult - ant) / ant) * 100
  }, [data])

  const sparkViews = useMemo(() => (data?.serieDiaria || []).map((d) => ({ v: d.views })), [data])

  // Destaques automáticos — o "na cara": campeão, melhor dia, mais retém, atenção
  const destaques = useMemo(() => {
    const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
    const out: { icon: typeof Trophy; cor: string; soft: string; rotulo: string; valor: string; detalhe: string }[] = []
    const camp = [...recomendacao].sort((a, b) => b.mediaPorVideo - a.mediaPorVideo)[0]
    if (camp) out.push({ icon: Trophy, cor: 'text-amber-300', soft: 'bg-amber-500/10', rotulo: 'Canal campeão', valor: camp.vertical, detalhe: `${n(camp.mediaPorVideo)} views/vídeo` })
    if (melhorDia && melhorDia.media > 0) out.push({ icon: CalendarDays, cor: 'text-emerald-300', soft: 'bg-emerald-500/10', rotulo: 'Melhor dia', valor: melhorDia.dia, detalhe: `${n(melhorDia.media)} views/post` })
    const ret = [...tempoMedioPorRede].filter((r) => r.posts > 0).sort((a, b) => b.segundos - a.segundos)[0]
    if (ret) out.push({ icon: Clock, cor: 'text-sky-300', soft: 'bg-sky-500/10', rotulo: 'Rede que mais retém', valor: cap(ret.rede), detalhe: `${ret.segundos}s assistidos` })
    out.push({ icon: AlertTriangle, cor: alertas.length ? 'text-red-300' : 'text-zinc-400', soft: alertas.length ? 'bg-red-500/10' : 'bg-zinc-800/40', rotulo: 'Sinais de atenção', valor: String(alertas.length), detalhe: alertas.length ? 'fora da curva' : 'tudo na curva' })
    return out
  }, [recomendacao, melhorDia, tempoMedioPorRede, alertas])

  useEffect(() => {
    if (drill === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrill(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [drill])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 p-4 sm:p-6 lg:p-8">
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
      <div className="min-h-screen bg-zinc-950 p-4 sm:p-6 lg:p-8">
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
    <div className="min-h-screen bg-zinc-950 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header + filtros */}
        <PageHeader titulo="Analytics · BI" subtitulo="Decisões rápidas: alcance, ressonância, custo e curva por vertical." />

        {/* Saúde dos dados (audit de coerência) — rede de segurança sempre visível */}
        <AuditPanel />

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
            {data.ultimaColeta && (
              <> · dados de {new Date(data.ultimaColeta).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</>
            )}
          </span>
        </div>

        {/* Filtros ativos (chips) — assinatura cross-filter */}
        {(filtros.plataforma !== 'todas' || filtros.canalId !== 'todos' || filtros.periodoDias !== 0) && (
          <div className="flex flex-wrap items-center gap-2 -mt-4">
            <span className="text-xs text-zinc-500">Filtrando por:</span>
            {filtros.plataforma !== 'todas' && (
              <button
                onClick={() => { setFiltros((f) => ({ ...f, plataforma: 'todas' })); setPaginaPubs(1) }}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-200 transition-colors hover:bg-zinc-700"
              >
                {filtros.plataforma.charAt(0).toUpperCase() + filtros.plataforma.slice(1)}
                <X className="h-3 w-3 text-zinc-400" />
              </button>
            )}
            {filtros.canalId !== 'todos' && (
              <button
                onClick={() => { setFiltros((f) => ({ ...f, canalId: 'todos' })); setPaginaPubs(1) }}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-200 transition-colors hover:bg-zinc-700"
              >
                {data.canais.find((c) => c.id === filtros.canalId)?.nome ?? 'Vertical'}
                <X className="h-3 w-3 text-zinc-400" />
              </button>
            )}
            {filtros.periodoDias !== 0 && (
              <button
                onClick={() => { setFiltros((f) => ({ ...f, periodoDias: 0 })); setPaginaPubs(1) }}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-200 transition-colors hover:bg-zinc-700"
              >
                Últimos {filtros.periodoDias} dias
                <X className="h-3 w-3 text-zinc-400" />
              </button>
            )}
            <button
              onClick={() => { setFiltros({ plataforma: 'todas', canalId: 'todos', periodoDias: 0 }); setPaginaPubs(1) }}
              className="cursor-pointer text-xs font-medium text-cyan-400 transition-colors hover:text-cyan-300"
            >
              Limpar tudo
            </button>
          </div>
        )}

        {/* BARRA DE ABAS */}
        <div className="flex flex-wrap gap-2">
          {([
            { id: 'geral', label: 'Visão Geral', icon: BarChart3 },
            { id: 'conteudo', label: 'Conteúdo', icon: Flame },
            { id: 'audiencia', label: 'Audiência', icon: Clock },
            { id: 'crescimento', label: 'Crescimento', icon: TrendingUp },
            { id: 'financeiro', label: 'Financeiro', icon: Wallet },
          ] as const).map((t) => {
            const Icon = t.icon
            const ativo = aba === t.id
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setAba(t.id)}
                className={`inline-flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                  ativo ? 'bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-500/30' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            )
          })}
        </div>

        {/* ABA: VISÃO GERAL */}
        {aba === 'geral' && (<>
        {/* FAIXA EXECUTIVA — KPIs hero (resultado na cara) */}
        <div className="grid gap-4 lg:grid-cols-4">
          {/* Views — hero (2 col) com Δ vs 7 dias + sparkline */}
          <div className="glass relative overflow-hidden rounded-2xl border border-cyan-500/25 bg-cyan-500/[0.04] p-6 lg:col-span-2">
            <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-48 rounded-full bg-cyan-500/10 blur-2xl" />
            <div className="relative flex items-start justify-between gap-3">
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-300">
                  <Eye className="h-4 w-4 text-cyan-300" /> Views totais
                </p>
                <p className="mt-2 text-3xl sm:text-5xl font-black tabular-nums text-white">{n(resumo.views)}</p>
                {tendenciaViews != null ? (
                  <span className={`mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${tendenciaViews >= 0 ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300'}`}>
                    {tendenciaViews >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                    {Math.abs(tendenciaViews).toFixed(0)}% vs 7 dias antes
                  </span>
                ) : (
                  <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-zinc-800/60 px-2.5 py-1 text-xs font-medium text-zinc-500">
                    <Minus className="h-3.5 w-3.5" /> sem base p/ tendência ainda
                  </span>
                )}
              </div>
            </div>
            {sparkViews.length > 1 && (
              <div className="relative mt-3 h-16">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sparkViews} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="sparkViews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.45} />
                        <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Tooltip
                      contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 10, color: '#fff', fontSize: 12 }}
                      labelFormatter={() => ''}
                      formatter={(value: number) => [n(value), 'Views no dia']}
                    />
                    <Area type="monotone" dataKey="v" stroke="#22d3ee" strokeWidth={2} fill="url(#sparkViews)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
          {/* Ressonância */}
          <div className="glass rounded-2xl border border-zinc-800/50 p-6">
            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">
              <Heart className="h-4 w-4 text-pink-400" /> Ressonância
            </p>
            <p className="mt-3 text-3xl font-bold text-white">{resumo.ressonancia.toFixed(1)}%</p>
            <p className="mt-1 text-sm text-zinc-500">{n(resumo.likes)} likes · {n(resumo.comentarios)} coment.</p>
          </div>
          {/* Custo AI */}
          <div className="glass rounded-2xl border border-zinc-800/50 p-6">
            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">
              <Wallet className="h-4 w-4 text-green-400" /> Custo AI
            </p>
            <p className="mt-3 text-3xl font-bold text-white">{brl(resumo.custoProducao)}</p>
            <p className="mt-1 text-sm text-zinc-500">
              {resumo.views > 0 ? `${brl(resumo.custoPorView)} por view` : 'estimativa por vídeo'}
            </p>
          </div>
        </div>

        {/* DESTAQUES — insights automáticos na cara */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {destaques.map((d) => {
            const Icon = d.icon
            return (
              <div key={d.rotulo} className="glass rounded-2xl border border-zinc-800/50 p-5">
                <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg ${d.soft}`}>
                  <Icon className={`h-5 w-5 ${d.cor}`} />
                </div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">{d.rotulo}</p>
                <p className="mt-0.5 truncate text-lg font-bold text-white" title={d.valor}>{d.valor}</p>
                <p className="text-xs text-zinc-500">{d.detalhe}</p>
              </div>
            )
          })}
        </div>

        </>)}

        {/* ABA: CONTEÚDO — Decisão */}
        {aba === 'conteudo' && (<>
        {/* CAMADA DE DECISÃO — produção × desempenho (onde investir + o que publicar) */}
        {decisao && (
          <div className="glass rounded-2xl border border-violet-500/30 bg-violet-500/5 p-6">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-violet-300" />
              <h2 className="text-lg font-semibold text-white">Decisão · onde investir e o que publicar</h2>
              <span className="ml-auto text-xs text-zinc-500">cruza o que foi criado × o que rende</span>
            </div>
            {decisao.totalPublicados < 20 && (
              <p className="mt-2 text-xs text-amber-300/80">
                ⚠ Base ainda pequena ({decisao.totalPublicados} vídeos com métrica) — as recomendações ficam mais confiáveis conforme publicar mais.
              </p>
            )}

            <div className="mt-4 grid gap-6 lg:grid-cols-2">
              {/* Matriz por canal */}
              <div className="overflow-x-auto">
                <p className="mb-2 text-sm font-semibold text-zinc-300">Qual canal traz resultado</p>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800/50 text-left text-[11px] uppercase tracking-wider text-zinc-500">
                      <th className="py-2 pr-2">Canal</th>
                      <th className="px-1 py-2 text-right" title="Ideias criadas">Crd</th>
                      <th className="px-1 py-2 text-right" title="Roteiros prontos não publicados">Estq</th>
                      <th className="px-1 py-2 text-right" title="Vídeos publicados">Pub</th>
                      <th className="px-1 py-2 text-right">Méd/vídeo</th>
                      <th className="px-1 py-2 text-right" title="Nota de hook média">Hook</th>
                      <th className="py-2 pl-2 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {decisao.canais.map((c) => {
                      const cor = { produzir: 'text-emerald-400', manter: 'text-zinc-300', segurar: 'text-red-300', testar: 'text-amber-300' }[c.acao]
                      const label = { produzir: '🚀 produzir', manter: '➡️ manter', segurar: '🛑 segurar', testar: '🧪 testar' }[c.acao]
                      const ativo = filtros.canalId === c.canalId
                      return (
                        <tr
                          key={c.canalId}
                          onClick={() => { setFiltros((f) => ({ ...f, canalId: f.canalId === c.canalId ? 'todos' : c.canalId })); setPaginaPubs(1) }}
                          className={`cursor-pointer border-b border-zinc-800/30 transition-colors ${ativo ? 'bg-cyan-500/10' : 'hover:bg-zinc-900/40'}`}
                        >
                          <td className="py-2 pr-2 text-zinc-200">{c.nome}</td>
                          <td className="px-1 py-2 text-right tabular-nums text-zinc-400">{c.ideias}</td>
                          <td className="px-1 py-2 text-right tabular-nums text-zinc-400">{c.roteirosProntos}</td>
                          <td className="px-1 py-2 text-right tabular-nums text-zinc-400">{c.publicados}</td>
                          <td className="px-1 py-2 text-right font-semibold tabular-nums text-white">{c.publicados ? n(c.mediaViews) : '—'}</td>
                          <td className="px-1 py-2 text-right tabular-nums text-zinc-400">{c.notaHookMedia ?? '—'}</td>
                          <td className={`py-2 pl-2 text-right text-xs font-semibold ${cor}`}>{label}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Fila: o que publicar a seguir */}
              <div>
                <p className="mb-2 text-sm font-semibold text-zinc-300">O que publicar a seguir <span className="font-normal text-zinc-500">(estoque por potencial)</span></p>
                {decisao.fila.length === 0 ? (
                  <p className="text-sm text-zinc-500">Sem roteiros aprovados em estoque — gere/aprove mais.</p>
                ) : (
                  <div className="space-y-1.5">
                    {decisao.fila.slice(0, 10).map((f, i) => (
                      <div key={f.roteiroId} className="flex items-center gap-2 rounded-lg bg-zinc-900/50 px-3 py-2">
                        <span className="w-4 text-right font-mono text-xs text-zinc-600">{i + 1}</span>
                        <span
                          className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                            f.notaHook == null ? 'bg-zinc-700 text-zinc-300' : f.notaHook <= 2 ? 'bg-red-500/15 text-red-300' : f.notaHook === 3 ? 'bg-amber-500/15 text-amber-300' : 'bg-emerald-500/15 text-emerald-300'
                          }`}
                        >
                          H{f.notaHook ?? '?'}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm text-zinc-200" title={f.titulo}>{f.titulo}</span>
                        <span className="shrink-0 text-[11px] text-zinc-500">{f.canalNome}</span>
                      </div>
                    ))}
                    {decisao.fila.length > 10 && (
                      <p className="text-xs text-zinc-500">+{decisao.fila.length - 10} roteiros em estoque.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        </>)}

        {/* ABA: VISÃO GERAL — Sinais de atenção */}
        {aba === 'geral' && (<>
        {/* Sinais de atenção — distribuição quebrada + alcance inflado */}
        {(alertas.length > 0 || redesInfladas.length > 0) && (
          <div className="glass rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              <h2 className="text-lg font-semibold text-white">Sinais de atenção</h2>
              <span className="ml-auto text-xs text-zinc-500">distribuição quebrada · alcance inflado</span>
            </div>

            {redesInfladas.length > 0 && (
              <p className="mt-3 text-sm text-amber-200/90">
                ⚠️ Alcance inflado em{' '}
                <span className="font-semibold capitalize">
                  {redesInfladas.map((r) => r.rede).join(', ')}
                </span>
                : muito play, engajamento quase nulo ({redesInfladas.map((r) => `${r.ressonancia.toFixed(1)}%`).join(' / ')}).
                Pese YouTube + Instagram como sinal de qualidade.
              </p>
            )}

            {alertas.length > 0 && (
              <div className="mt-4 space-y-2">
                {alertas.slice(0, 8).map((a) => (
                  <div key={a.id} className="flex items-center gap-3 rounded-xl bg-zinc-900/50 px-3 py-2">
                    <span
                      className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                        a.severidade === 'alta' ? 'bg-red-500/15 text-red-300' : 'bg-amber-500/15 text-amber-300'
                      }`}
                    >
                      {a.plataforma}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-zinc-200" title={a.titulo}>{a.titulo}</p>
                      <p className="truncate text-xs text-zinc-500">
                        {a.vertical} · {a.detalhe}
                      </p>
                    </div>
                    <span className="shrink-0 text-right text-sm font-bold tabular-nums text-white">{n(a.views)}</span>
                  </div>
                ))}
                {alertas.length > 8 && (
                  <p className="text-xs text-zinc-500">+{alertas.length - 8} outras publicações fora da curva no recorte.</p>
                )}
              </div>
            )}
          </div>
        )}

        </>)}

        {/* ABA: FINANCEIRO — Rumo à monetização */}
        {aba === 'financeiro' && (<>
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

        </>)}

        {/* ABA: VISÃO GERAL — Onde os views nascem */}
        {aba === 'geral' && (<>
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
              const ativo = filtros.plataforma === r.rede
              return (
                <button
                  key={r.rede}
                  type="button"
                  onClick={() => { setFiltros((f) => ({ ...f, plataforma: f.plataforma === r.rede ? 'todas' : r.rede })); setPaginaPubs(1) }}
                  className={`cursor-pointer rounded-xl p-4 text-left transition-all hover:brightness-125 ${ativo ? 'ring-2 ring-cyan-500/40' : ''} ${ehTopEngaja ? 'bg-emerald-500/10 ring-1 ring-emerald-500/30' : 'bg-zinc-900/60'}`}
                >
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
                </button>
              )
            })}
          </div>
        </div>

        </>)}

        {/* ABA: CONTEÚDO — Top conteúdos + recomendação + matriz */}
        {aba === 'conteudo' && (<>
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
                <div
                  key={c.titulo + i}
                  onClick={() => setDrill(c.titulo)}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-1 py-1 transition-colors hover:bg-zinc-900/50"
                >
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
          <p className="mt-1 text-xs text-zinc-500">
            Views por vídeo em cada vertical — o guia do próximo lote.{' '}
            <span className="text-emerald-400">verde = produzir mais</span> ·{' '}
            <span className="text-violet-300">violeta = manter</span> ·{' '}
            <span className="text-red-300">vermelho = segurar</span>.
          </p>
          {recomendacao.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-500">Sem dados no recorte.</p>
          ) : (
            <div className="mt-4" style={{ height: Math.max(160, recomendacao.length * 44) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={recomendacao} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                  <XAxis type="number" tickFormatter={(v: number) => n(v)} tick={{ fill: '#71717a', fontSize: 11 }} axisLine={{ stroke: '#3f3f46' }} tickLine={false} />
                  <YAxis
                    type="category"
                    dataKey="vertical"
                    width={120}
                    tick={{ fill: '#a1a1aa', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: '#ffffff08' }}
                    contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 12, color: '#fff' }}
                    formatter={(value: number, _n: string, item: { payload?: { vertical?: string; videos?: number } }) => [
                      `${n(value)} views/vídeo · ${item?.payload?.videos ?? 0} vídeos`,
                      item?.payload?.vertical ?? 'Vertical',
                    ]}
                  />
                  <Bar dataKey="mediaPorVideo" radius={[0, 4, 4, 0]} maxBarSize={28}>
                    {recomendacao.map((r) => (
                      <Cell
                        key={r.vertical}
                        fill={r.acao === 'produzir' ? '#34d399' : r.acao === 'segurar' ? '#f87171' : '#a78bfa'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
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
                  <tr
                    key={l.titulo + i}
                    onClick={() => setDrill(l.titulo)}
                    className="cursor-pointer border-b border-zinc-800/30 transition-colors hover:bg-zinc-900/40"
                  >
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

        </>)}

        {/* ABA: CRESCIMENTO */}
        {aba === 'crescimento' && (<>
        {/* 1) Ganho por dia (barras) — sua ideia: sobe ou cai? */}
        <div className="glass rounded-2xl border border-zinc-800/50 p-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-400" />
            <h2 className="text-lg font-semibold text-white">Views ganhos por dia</h2>
          </div>
          <p className="mt-1 text-xs text-zinc-500">Quanta audiência entrou em cada dia (ganho = hoje − ontem) — pra ver se sobe ou cai. Real a partir de 17/06 (2 coletas seguidas).</p>
          {data.serieDiaria.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-500">
              Ainda sem histórico no recorte — nasce com as coletas diárias do cron (8h BRT).
            </p>
          ) : (
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.serieDiaria} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
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
                    cursor={{ fill: '#ffffff08' }}
                    contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 12, color: '#fff' }}
                    labelFormatter={(v: string) => new Date(v + 'T12:00:00').toLocaleDateString('pt-BR')}
                    formatter={(value: number, name: string) => [n(value), name === 'views' ? 'Views no dia' : 'Likes no dia']}
                  />
                  <Bar dataKey="views" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* 2) Crescimento total (área) — a ideia inicial: acumulado */}
        <div className="glass rounded-2xl border border-zinc-800/50 p-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-violet-400" />
            <h2 className="text-lg font-semibold text-white">Crescimento total (acumulado)</h2>
          </div>
          <p className="mt-1 text-xs text-zinc-500">O total de views somando tudo, dia a dia — a trajetória completa do canal (só sobe).</p>
          {data.serieCumulativa.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-500">Sem histórico ainda.</p>
          ) : (
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.serieCumulativa} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradCumul" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a855f7" stopOpacity={0.55} />
                      <stop offset="100%" stopColor="#a855f7" stopOpacity={0.04} />
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
                    formatter={(value: number) => [n(value), 'Views acumulados']}
                  />
                  <Area type="monotone" dataKey="views" stroke="#a855f7" strokeWidth={2.5} fill="url(#gradCumul)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        </>)}

        {/* ABA: AUDIÊNCIA */}
        {aba === 'audiencia' && (<>
        {/* Onde os views nascem — por hora de publicação (real) */}
        <HorariosPanel />
        {/* Curva de retenção — Facebook + YouTube */}
        <div className="glass rounded-2xl border border-zinc-800/50 p-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-rose-400" />
            <h2 className="text-lg font-semibold text-white">Curva de retenção · onde o público abandona</h2>
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            Quanto da audiência que <span className="text-zinc-300">começou</span> o vídeo ainda está assistindo em cada trecho, do <span className="text-zinc-300">início (0%)</span> ao <span className="text-zinc-300">fim (100%)</span>. Queda forte logo no comecinho = <span className="text-rose-300">hook fraco</span>; o ponto onde a linha despenca é onde você perde o público. Média de {data.retencaoVideos} vídeo(s) com dados de <span className="text-zinc-300">Facebook + YouTube</span> — são as redes que entregam a curva (Instagram e TikTok não dão).
            {data.retencao3s != null && (
              <> Lá pelos <span className="font-semibold text-rose-300">3s</span> ainda restam <span className="font-semibold text-rose-300">{data.retencao3s.toFixed(0)}%</span> — é nesse trecho que o hook se decide.</>
            )}
          </p>
          {data.retencaoVideos === 0 ? (
            <p className="mt-4 text-sm text-zinc-500">Sem curva ainda — nasce na coleta (Facebook + YouTube; só vídeos com views suficientes).</p>
          ) : (
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.retencaoMedia} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradRet" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fb7185" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#fb7185" stopOpacity={0.04} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis
                    dataKey="t"
                    tickFormatter={(v: number) => `${Math.round((v / 40) * 100)}%`}
                    tick={{ fill: '#71717a', fontSize: 11 }}
                    axisLine={{ stroke: '#3f3f46' }}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v: number) => `${Math.round(v)}%`}
                    domain={[0, 100]}
                    tick={{ fill: '#71717a', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                  />
                  <Tooltip
                    contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 12, color: '#fff' }}
                    labelFormatter={(v: number) => `${Math.round((v / 40) * 100)}% do vídeo`}
                    formatter={(value: number) => [`${value.toFixed(0)}%`, 'Retenção']}
                  />
                  <Area type="monotone" dataKey="pct" stroke="#fb7185" strokeWidth={2.5} fill="url(#gradRet)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Tempo médio assistido por rede (cross-rede, stopgap até o YouTube OAuth) */}
        <div className="glass rounded-2xl border border-zinc-800/50 p-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-sky-400" />
            <h2 className="text-lg font-semibold text-white">Tempo médio assistido por rede</h2>
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            Quantos segundos, em média, cada vídeo segura o público — comparável entre redes (proxy de retenção).
            <span className="text-zinc-400"> Facebook</span> e <span className="text-zinc-400">Instagram</span> entregam esse dado;{' '}
            <span className="text-zinc-400">YouTube</span> entra quando ligarmos o OAuth e <span className="text-zinc-400">TikTok</span> não expõe na API atual.
          </p>
          {tempoMedioPorRede.every((r) => r.posts === 0) ? (
            <p className="mt-4 text-sm text-zinc-500">Sem tempo médio coletado ainda — nasce na próxima coleta (FB/IG).</p>
          ) : (
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tempoMedioPorRede} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis
                    dataKey="rede"
                    tickFormatter={(v: string) => v.charAt(0).toUpperCase() + v.slice(1)}
                    tick={{ fill: '#71717a', fontSize: 12 }}
                    axisLine={{ stroke: '#3f3f46' }}
                    tickLine={false}
                  />
                  <YAxis tickFormatter={(v: number) => `${v}s`} tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip
                    cursor={{ fill: '#ffffff08' }}
                    contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 12, color: '#fff' }}
                    formatter={(value: number, _n: string, item: { payload?: { posts?: number } }) => [
                      item?.payload?.posts ? `${value}s · ${item.payload.posts} posts` : 'sem dado na API',
                      'Tempo médio',
                    ]}
                  />
                  <Bar dataKey="segundos" fill="#38bdf8" radius={[4, 4, 0, 0]} maxBarSize={64} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* % médio assistido por rede (proxy de retenção onde não há curva) */}
        <div className="glass rounded-2xl border border-zinc-800/50 p-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-teal-400" />
            <h2 className="text-lg font-semibold text-white">% médio assistido por rede</h2>
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            Quanto do vídeo, em média, o público assiste — <span className="text-zinc-400">tempo médio assistido ÷ duração</span>.
            Proxy de retenção onde a curva não existe (Instagram/TikTok). Redes sem dado aparecem zeradas.
          </p>
          {pctAssistidoPorRede.every((r) => r.posts === 0) ? (
            <p className="mt-4 text-sm text-zinc-500">Sem dado ainda — depende de tempo médio (FB/IG) e duração do áudio.</p>
          ) : (
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pctAssistidoPorRede} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis
                    dataKey="rede"
                    tickFormatter={(v: string) => v.charAt(0).toUpperCase() + v.slice(1)}
                    tick={{ fill: '#71717a', fontSize: 12 }}
                    axisLine={{ stroke: '#3f3f46' }}
                    tickLine={false}
                  />
                  <YAxis tickFormatter={(v: number) => `${v}%`} tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} width={44} />
                  <Tooltip
                    cursor={{ fill: '#ffffff08' }}
                    contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 12, color: '#fff' }}
                    formatter={(value: number, _n: string, item: { payload?: { posts?: number } }) => [
                      item?.payload?.posts ? `${value}% · ${item.payload.posts} posts` : 'sem dado',
                      '% assistido',
                    ]}
                  />
                  <Bar dataKey="pct" fill="#2dd4bf" radius={[4, 4, 0, 0]} maxBarSize={64} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Engajamento por rede (interações por 100 views) */}
        <div className="glass rounded-2xl border border-zinc-800/50 p-6">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-400" />
            <h2 className="text-lg font-semibold text-white">Engajamento por rede</h2>
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            Interações por 100 views — média de <span className="text-zinc-400">(likes + comentários + shares + saves) ÷ views</span> por post.
          </p>
          {engajamentoPorRede.every((r) => r.posts === 0) ? (
            <p className="mt-4 text-sm text-zinc-500">Sem publicações com views no recorte.</p>
          ) : (
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={engajamentoPorRede} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis
                    dataKey="rede"
                    tickFormatter={(v: string) => v.charAt(0).toUpperCase() + v.slice(1)}
                    tick={{ fill: '#71717a', fontSize: 12 }}
                    axisLine={{ stroke: '#3f3f46' }}
                    tickLine={false}
                  />
                  <YAxis tickFormatter={(v: number) => `${v}%`} tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} width={44} />
                  <Tooltip
                    cursor={{ fill: '#ffffff08' }}
                    contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 12, color: '#fff' }}
                    formatter={(value: number, _n: string, item: { payload?: { posts?: number } }) => [
                      item?.payload?.posts ? `${value}% · ${item.payload.posts} posts` : 'sem dado',
                      'Engajamento',
                    ]}
                  />
                  <Bar dataKey="pct" fill="#ec4899" radius={[4, 4, 0, 0]} maxBarSize={64} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Desempenho por dia da semana */}
        <div className="glass rounded-2xl border border-zinc-800/50 p-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-cyan-400" />
            <h2 className="text-lg font-semibold text-white">Desempenho por dia da semana</h2>
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            Média de views por post, pelo dia da publicação — qual dia rende mais.
            {melhorDia && melhorDia.media > 0 && (
              <> Hoje o campeão é <span className="font-semibold text-cyan-400">{melhorDia.dia}</span> ({n(melhorDia.media)}/post).</>
            )}
          </p>
          {porDiaSemana.every((d) => d.posts === 0) ? (
            <p className="mt-4 text-sm text-zinc-500">Sem publicações no recorte.</p>
          ) : (
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={porDiaSemana} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="dia" tick={{ fill: '#71717a', fontSize: 12 }} axisLine={{ stroke: '#3f3f46' }} tickLine={false} />
                  <YAxis tickFormatter={(v: number) => n(v)} tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} width={48} />
                  <Tooltip
                    cursor={{ fill: '#ffffff08' }}
                    contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 12, color: '#fff' }}
                    formatter={(value: number, _n: string, item: { payload?: { posts?: number } }) => [`${n(value)}/post · ${item?.payload?.posts ?? 0} posts`, 'Média']}
                  />
                  <Bar dataKey="media" fill="#22d3ee" radius={[4, 4, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        </>)}

        {/* ABA: CONTEÚDO — Aderência por vertical */}
        {aba === 'conteudo' && (
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
        )}

        {/* ABA: FINANCEIRO — detalhamento de custos */}
        {aba === 'financeiro' && (
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
        )}

        {/* ABA: CONTEÚDO — Publicações no recorte */}
        {aba === 'conteudo' && (
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
        )}

        {/* Drill-down por vídeo — modal cross-rede (global, vale em qualquer aba) */}
        {drill !== null && (() => {
          const pubs = data.publicacoes
            .filter((p) => p.ideiaTitulo === drill)
            .sort((a, b) => b.views - a.views)
            .map((p) => ({
              rede: p.plataforma,
              views: p.views,
              likes: p.likes,
              comentarios: p.comentarios,
              engaja: p.shares + p.saves,
              tempo: p.avgWatchMs ? `${(p.avgWatchMs / 1000).toFixed(1)}s` : '—',
            }))
          const total = pubs.reduce(
            (a, p) => ({
              views: a.views + p.views,
              likes: a.likes + p.likes,
              comentarios: a.comentarios + p.comentarios,
              engaja: a.engaja + p.engaja,
            }),
            { views: 0, likes: 0, comentarios: 0, engaja: 0 }
          )
          return (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
              onClick={() => setDrill(null)}
            >
              <div
                className="glass relative w-full max-w-lg rounded-2xl border border-zinc-700/60 p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setDrill(null)}
                  className="absolute right-4 top-4 cursor-pointer rounded-lg p-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
                  aria-label="Fechar"
                >
                  <X className="h-5 w-5" />
                </button>
                <div className="flex items-center gap-2 pr-8">
                  <Grid3x3 className="h-5 w-5 shrink-0 text-cyan-400" />
                  <h3 className="text-base font-semibold text-white" title={drill}>{drill}</h3>
                </div>
                <p className="mt-1 text-xs text-zinc-500">Desempenho do mesmo vídeo em cada rede.</p>

                {pubs.length === 0 ? (
                  <p className="mt-6 text-sm text-zinc-500">Sem dados para este vídeo.</p>
                ) : (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-zinc-800/50 text-left text-[11px] uppercase tracking-wider text-zinc-500">
                          <th className="py-2 pr-2">Rede</th>
                          <th className="px-1 py-2 text-right">Views</th>
                          <th className="px-1 py-2 text-right">Likes</th>
                          <th className="px-1 py-2 text-right">Coment.</th>
                          <th className="px-1 py-2 text-right">Sh+Sv</th>
                          <th className="py-2 pl-1 text-right">Tempo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pubs.map((p, i) => (
                          <tr key={p.rede + i} className="border-b border-zinc-800/30">
                            <td className="py-2 pr-2 capitalize text-zinc-200">{p.rede}</td>
                            <td className="px-1 py-2 text-right font-semibold tabular-nums text-white">{n(p.views)}</td>
                            <td className="px-1 py-2 text-right tabular-nums text-zinc-400">{n(p.likes)}</td>
                            <td className="px-1 py-2 text-right tabular-nums text-zinc-400">{n(p.comentarios)}</td>
                            <td className="px-1 py-2 text-right tabular-nums text-zinc-400">{n(p.engaja)}</td>
                            <td className="py-2 pl-1 text-right tabular-nums text-zinc-400">{p.tempo}</td>
                          </tr>
                        ))}
                        <tr className="border-t border-zinc-700/60 font-semibold">
                          <td className="py-2 pr-2 text-zinc-300">Total</td>
                          <td className="px-1 py-2 text-right tabular-nums text-white">{n(total.views)}</td>
                          <td className="px-1 py-2 text-right tabular-nums text-white">{n(total.likes)}</td>
                          <td className="px-1 py-2 text-right tabular-nums text-white">{n(total.comentarios)}</td>
                          <td className="px-1 py-2 text-right tabular-nums text-white">{n(total.engaja)}</td>
                          <td className="py-2 pl-1 text-right text-zinc-600">—</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )
        })()}
      </div>
    </div>
  )
}
