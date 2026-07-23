'use client'

import { useEffect, useMemo, useState } from 'react'
import { Filter } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

import { ErrorState } from '@/components/ui/error-state'
import { Desafio100Dias } from '@/components/desafio-100-dias'
import { InsightDoDia } from '@/components/insight-do-dia'
import { HorariosPanel } from '@/components/horarios-panel'
import { NotaVsViewsPanel } from '@/components/nota-vs-views-panel'
import { QualidadePanel } from '@/components/qualidade-panel'
import { ExtratoSemanalPanel } from '@/components/extrato-semanal-panel'
import {
  ABAS,
  CardAlcancePorRede,
  CardCampeoes,
  CardCrescimento,
  CardCustos,
  CardExperimento,
  CardDecisao,
  CardGates,
  CardMatrizRedes,
  CardMelhorDia,
  CardQuandoPaga,
  CardRessonancia,
  CardVerticais,
  HeroMonetizacao,
  ModalDrill,
} from '@/components/analytics-cards'
import { ASSINATURAS_MENSAIS_BRL } from '@/lib/config/custos'
import { GATES_MONETIZACAO } from '@/lib/config/monetizacao'
import { useBi, type BiFiltros } from '@/lib/hooks/use-bi'
import { useDecisao } from '@/lib/hooks/use-decisao'
import { useFinanceiro } from '@/lib/hooks/use-financeiro'
import { useExperimento } from '@/lib/hooks/use-experimento'

interface Projecao {
  porSemana: number | null
  etaSemanas: number | null
  gate: number
}
interface StatusContas {
  contas: Record<string, { seguidores: number | null; detalhe?: string }>
  projecao?: Record<string, Projecao>
  historico?: Array<{ data: string; [k: string]: number | string | null }>
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

/**
 * Avisa quando um painel NÃO obedece o filtro ativo. Alguns não têm como: custo é por vídeo
 * produzido (não por rede), e o Desafio conta "publiquei hoje" em qualquer rede. Filtro que
 * não aplica em silêncio é pior que filtro nenhum — o leitor acha que está vendo um recorte.
 */
function NaoSegueFiltro({ filtros, motivo }: { filtros: BiFiltros; motivo: string }) {
  const ativo = filtros.plataforma !== 'todas' || filtros.canalId !== 'todos' || filtros.periodoDias > 0
  if (!ativo) return null
  return (
    <p className="flex items-center gap-1.5 px-1 text-[11px] text-[#6e6b7b]">
      <Filter className="h-3 w-3" />
      Ignora o filtro ativo — {motivo}.
    </p>
  )
}


export default function AnalyticsPage() {
  const [filtros, setFiltros] = useState<BiFiltros>({ plataforma: 'todas', canalId: 'todos', periodoDias: 0 })
  const [aba, setAba] = useState<'geral' | 'conteudo' | 'qualidade' | 'audiencia' | 'crescimento' | 'financeiro'>('geral')
  const [drill, setDrill] = useState<string | null>(null)
  const { data, isLoading, isError, refetch } = useBi(filtros)
  const { data: decisao } = useDecisao()
  const { data: statusContas } = useStatusContas()
  const { data: fin } = useFinanceiro()
  const { data: experimento } = useExperimento()

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

  // views dos posts publicados nos últimos 90 dias, por rede (proxy do 2º gate — ex.: YT 3M/90d)
  const views90dPorRede = useMemo(() => {
    const m = new Map<string, number>()
    if (!data) return m
    const limite = Date.now() - 90 * 864e5
    for (const p of data.publicacoes) {
      if (!p.dataPublicacao || new Date(p.dataPublicacao).getTime() < limite) continue
      m.set(p.plataforma, (m.get(p.plataforma) || 0) + p.views)
    }
    return m
  }, [data])

  const gatesCalc = useMemo(() => {
    return GATES_MONETIZACAO.map((g) => {
      const atual = statusContas?.contas?.[g.plataforma]?.seguidores ?? null
      const proj = statusContas?.projecao?.[g.plataforma]
      const pr = porRede.find((x) => x.rede === g.plataforma)
      const media = pr && pr.posts ? Math.round(pr.views / pr.posts) : null
      const usaAtalho = !!g.gateRapido && atual !== null && atual < g.gateRapido.meta
      const metaEfetiva = usaAtalho ? g.gateRapido!.meta : g.metaSeguidores
      const pct = atual === null ? 0 : Math.min(100, (atual / metaEfetiva) * 100)
      const faltam = atual === null ? null : Math.max(0, metaEfetiva - atual)
      const v90 = views90dPorRede.get(g.plataforma) || 0
      const pctSec = g.metaSecundariaNum ? Math.min(100, (v90 / g.metaSecundariaNum) * 100) : null
      const conv = pr && pr.views && atual ? (atual / pr.views) * 100 : null
      return { g, atual, proj, pr, media, usaAtalho, metaEfetiva, pct, faltam, v90, pctSec, conv }
    })
  }, [statusContas, porRede, views90dPorRede])

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
    <div className="min-h-screen bg-[#100f16] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-3.5">

        {/* ── cabeçalho ── */}
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#6e6b7b]">PULSO · Analytics</div>
            <div className="mt-0.5 text-[13px] text-[#6e6b7b]">
              {data.videosProduzidos} vídeos · {n(resumo?.views ?? 0)} views acumuladas
            </div>
          </div>
          <span className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-[#a3a0b0]">
            {data.ultimaColeta
              ? `dados de ${new Date(data.ultimaColeta).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}`
              : 'sem coleta'}
          </span>
        </div>

        {/* ── filtros ── */}
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/8 bg-[#1a1922] p-2.5">
          <Filter className="ml-1 h-3.5 w-3.5 text-[#6e6b7b]" />
          <select value={filtros.plataforma} onChange={(e) => setFiltros((f) => ({ ...f, plataforma: e.target.value }))}
            className="rounded-lg border border-white/10 bg-[#232231] px-2.5 py-1.5 text-xs text-[#f5f4f8] focus:border-[#9085e9] focus:outline-none">
            {PLATAFORMAS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          <select value={filtros.canalId} onChange={(e) => setFiltros((f) => ({ ...f, canalId: e.target.value }))}
            className="rounded-lg border border-white/10 bg-[#232231] px-2.5 py-1.5 text-xs text-[#f5f4f8] focus:border-[#9085e9] focus:outline-none">
            <option value="todos">Todas as verticais</option>
            {data.canais.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
          <select value={filtros.periodoDias} onChange={(e) => setFiltros((f) => ({ ...f, periodoDias: Number(e.target.value) }))}
            className="rounded-lg border border-white/10 bg-[#232231] px-2.5 py-1.5 text-xs text-[#f5f4f8] focus:border-[#9085e9] focus:outline-none">
            {PERIODOS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          <span className="ml-auto pr-1 text-[11px] text-[#6e6b7b]">{data.publicacoes.length} publicações no recorte</span>
        </div>

        {/* ── abas ── */}
        <div className="flex gap-1 overflow-x-auto rounded-full border border-white/8 bg-[#1a1922] p-1">
          {ABAS.map((t) => (
            <button key={t.id} type="button" onClick={() => setAba(t.id)}
              aria-selected={aba === t.id} role="tab"
              className={`shrink-0 rounded-full px-4 py-2 text-[13px] transition-colors ${
                aba === t.id ? 'bg-[#9085e9] font-medium text-[#0f0e16]' : 'text-[#6e6b7b] hover:text-[#a3a0b0]'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ══════ VISÃO GERAL ══════ */}
        {aba === 'geral' && (
          <div className="space-y-3.5">
            <InsightDoDia
              topRede={porRede[0] ? { rede: porRede[0].rede, share: porRede[0].share } : undefined}
              topVertical={rankingVertical[0] && resumo?.views
                ? { nome: rankingVertical[0][0], share: (rankingVertical[0][1].views / resumo.views) * 100 } : undefined}
              melhorDia={(() => {
                const c = porDiaSemana.filter((d) => d.posts > 0)
                if (c.length < 2) return undefined
                const mel = c.reduce((a, b) => (b.media > a.media ? b : a))
                const pio = c.reduce((a, b) => (b.media < a.media ? b : a))
                return pio.media > 0 ? { dia: mel.dia, media: mel.media, vezes: mel.media / pio.media } : undefined
              })()}
              conversaoYt={gatesCalc.find((c) => c.g.plataforma === 'youtube')?.conv ?? null}
            />
            <HeroMonetizacao gatesCalc={gatesCalc} />
            <div className="grid gap-3.5 lg:grid-cols-2">
              <CardAlcancePorRede porRede={porRede} totalViews={resumo?.views ?? 0} />
              <CardCrescimento serie={data.serieCumulativa} />
            </div>
          </div>
        )}

        {/* ══════ CONTEÚDO ══════ */}
        {aba === 'conteudo' && (
          <div className="space-y-3.5">
            <div className="grid gap-3.5 lg:grid-cols-2">
              <CardVerticais ranking={rankingVertical} />
              <NotaVsViewsPanel filtros={filtros} />
            </div>
            <div className="grid gap-3.5 lg:grid-cols-2">
              <CardMelhorDia dias={porDiaSemana} />
              <CardCampeoes tops={topConteudos} onDrill={setDrill} />
            </div>
            <CardMatrizRedes matriz={matrizRedes} onDrill={setDrill} />
            {decisao && <CardDecisao decisao={decisao} filtros={filtros} setFiltros={setFiltros} />}
          </div>
        )}

        {/* ══════ QUALIDADE ══════ */}
        {aba === 'qualidade' && <QualidadePanel filtros={filtros} />}

        {/* ══════ AUDIÊNCIA ══════ */}
        {aba === 'audiencia' && (
          <div className="space-y-3.5">
            <div className="grid gap-3.5 lg:grid-cols-2">
              <CardGates gatesCalc={gatesCalc} />
              <CardRessonancia porRede={porRede} />
            </div>
            <HorariosPanel filtros={filtros} />
          </div>
        )}

        {/* ══════ CRESCIMENTO ══════ */}
        {aba === 'crescimento' && (
          <div className="space-y-3.5">
            <NaoSegueFiltro filtros={filtros} motivo="a meta é publicar em qualquer rede, todo dia" />
            <Desafio100Dias />
            <CardExperimento exp={experimento} />
            <CardCrescimento serie={data.serieCumulativa} diaria={data.serieDiaria} alto />
          </div>
        )}

        {/* ══════ FINANCEIRO ══════ */}
        {aba === 'financeiro' && (
          <div className="space-y-3.5">
            <CardCustos resumo={resumo} />
            <NaoSegueFiltro filtros={filtros} motivo="custo é por vídeo produzido, não por rede — só o período aplica" />
            <ExtratoSemanalPanel />
            <CardQuandoPaga gatesCalc={gatesCalc} />
          </div>
        )}

        {/* drill-down cross-rede (vale em qualquer aba) */}
        {drill !== null && <ModalDrill titulo={drill} publicacoes={data.publicacoes} onClose={() => setDrill(null)} />}
      </div>
    </div>
  )
}
