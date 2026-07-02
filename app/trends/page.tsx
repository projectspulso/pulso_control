'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useQuery, useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import {
  TrendingUp,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Plus,
  Search,
} from 'lucide-react'
import { ErrorState } from '@/components/ui/error-state'

interface Trend {
  topico: string
  encaixe: number
  angulo: string
  sensivel: boolean
  fonte: string
}

interface GerarResultado {
  success?: boolean
  ideia?: { id: string; titulo: string }
  precisa_revisao?: boolean
  motivo_revisao?: string
  descartado?: boolean
  motivo?: string
  duplicada?: boolean
  error?: string
}

const FONTE_LABEL: Record<string, string> = {
  google_trends: 'Google Trends',
  google_news: 'Google News',
  youtube: 'YouTube em alta',
  ia: 'IA',
}

type NivelEncaixe = 'todos' | 'alto' | 'medio' | 'baixo'

function nivelDe(n: number): Exclude<NivelEncaixe, 'todos'> {
  if (n >= 7) return 'alto'
  if (n >= 4) return 'medio'
  return 'baixo'
}

const norm = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

// acento por nível de encaixe (borda + badge)
const ACENTO = {
  alto: { borda: 'border-l-emerald-500', badge: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30', rotulo: 'Alto encaixe' },
  medio: { borda: 'border-l-amber-500', badge: 'bg-amber-500/15 text-amber-300 ring-amber-500/30', rotulo: 'Médio' },
  baixo: { borda: 'border-l-zinc-600', badge: 'bg-zinc-500/15 text-zinc-400 ring-zinc-500/30', rotulo: 'Baixo' },
}

export default function TrendsPage() {
  const [assuntoManual, setAssuntoManual] = useState('')
  const [resultados, setResultados] = useState<Record<string, GerarResultado>>({})
  const [nivel, setNivel] = useState<NivelEncaixe>('todos')
  const [fonte, setFonte] = useState<string>('todas')
  const [ocultarSensiveis, setOcultarSensiveis] = useState(false)
  const [busca, setBusca] = useState('')

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['trends'],
    queryFn: async (): Promise<Trend[]> => {
      const r = await fetch('/api/automation/trends')
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Falha ao coletar trends')
      return d.trends || []
    },
    staleTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  })

  const gerar = useMutation({
    mutationFn: async (assunto: string): Promise<GerarResultado> => {
      const r = await fetch('/api/automation/do-momento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assunto }),
      })
      return r.json()
    },
    onSuccess: (res, assunto) => setResultados((p) => ({ ...p, [assunto]: res })),
    onError: (e: unknown, assunto) =>
      setResultados((p) => ({ ...p, [assunto]: { error: e instanceof Error ? e.message : 'Erro' } })),
  })

  // #1 — assuntos que JÁ viraram ideia do-momento (pra não regenerar)
  const { data: usados } = useQuery({
    queryKey: ['do-momento-usados'],
    queryFn: async (): Promise<string[]> => {
      const { data: ideias } = await supabase
        .schema('pulso_content')
        .from('ideias')
        .select('metadata')
        .eq('origem', 'IA_DO_MOMENTO')
      const set = new Set<string>()
      for (const i of ideias || []) {
        const a = (i.metadata as { assunto_origem?: string } | null)?.assunto_origem
        if (a) set.add(norm(a))
      }
      return [...set]
    },
    staleTime: 1000 * 60 * 5,
  })
  const usadosSet = useMemo(() => new Set(usados || []), [usados])

  const trends = useMemo(() => data || [], [data])
  const fontes = useMemo(() => Array.from(new Set(trends.map((t) => t.fonte))), [trends])

  // #2 — ao carregar, abre já filtrado em "Alto 7+" (se houver algum); senão fica em Todos
  const autoNivel = useRef(false)
  useEffect(() => {
    if (!autoNivel.current && trends.length) {
      autoNivel.current = true
      if (trends.some((t) => t.encaixe >= 7)) setNivel('alto')
    }
  }, [trends])

  const contagem = useMemo(
    () => ({
      alto: trends.filter((t) => t.encaixe >= 7).length,
      medio: trends.filter((t) => t.encaixe >= 4 && t.encaixe < 7).length,
      baixo: trends.filter((t) => t.encaixe < 4).length,
      sensiveis: trends.filter((t) => t.sensivel).length,
    }),
    [trends],
  )

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return trends.filter((t) => {
      if (nivel !== 'todos' && nivelDe(t.encaixe) !== nivel) return false
      if (fonte !== 'todas' && t.fonte !== fonte) return false
      if (ocultarSensiveis && t.sensivel) return false
      if (q && !`${t.topico} ${t.angulo}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [trends, nivel, fonte, ocultarSensiveis, busca])

  if (isError) {
    return (
      <div className="min-h-screen bg-zinc-950 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-6xl">
          <ErrorState
            title="Erro ao carregar o Trend Tops"
            message="Não foi possível coletar as tendências agora."
            onRetry={() => refetch()}
          />
        </div>
      </div>
    )
  }

  function ResultadoBox({ res }: { res: GerarResultado }) {
    if (res.error) return <p className="mt-2 text-sm text-red-300">Erro: {res.error}</p>
    if (res.descartado) return <p className="mt-2 text-sm text-zinc-400">Descartado: {res.motivo}</p>
    if (res.duplicada) return <p className="mt-2 text-sm text-amber-300">Ideia parecida já existe.</p>
    if (res.ideia)
      return (
        <div className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm">
          <div className="flex items-center gap-2 font-semibold text-emerald-300">
            <CheckCircle2 className="h-4 w-4" /> Ideia criada
          </div>
          <p className="mt-1 text-zinc-200">{res.ideia.titulo}</p>
          {res.precisa_revisao && (
            <p className="mt-1 flex items-center gap-1 text-amber-300">
              <AlertTriangle className="h-3.5 w-3.5" /> Revisão humana: {res.motivo_revisao}
            </p>
          )}
          <Link
            href={`/ideias/${res.ideia.id}`}
            className="mt-2 inline-flex items-center gap-1 text-rose-300 hover:text-rose-200"
          >
            Abrir ideia <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )
    return null
  }

  const ChipNivel = ({ v, label, count }: { v: NivelEncaixe; label: string; count?: number }) => (
    <button
      onClick={() => setNivel(v)}
      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
        nivel === v ? 'bg-rose-600 text-white' : 'bg-zinc-900/60 text-zinc-400 ring-1 ring-zinc-700/50 hover:text-white'
      }`}
    >
      {label} {count !== undefined && <span className="opacity-70">({count})</span>}
    </button>
  )

  return (
    <div className="min-h-screen bg-zinc-950 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">
        {/* header */}
        <div className="mb-6">
          <div className="mb-2 flex items-center gap-3">
            <TrendingUp className="h-7 w-7 text-rose-400" />
            <h1 className="bg-linear-to-r from-rose-400 to-red-400 bg-clip-text text-4xl font-black text-transparent">
              Trend Tops
            </h1>
          </div>
          <p className="text-zinc-400">
            Assuntos em alta no Brasil (Google Trends + News + YouTube), triados pelo encaixe PULSO. Filtre, escolha o
            que tem ângulo educativo e vire em ideia — tema sensível entra com revisão humana.
          </p>
        </div>

        {/* assunto manual */}
        <div className="mb-5 rounded-2xl border border-zinc-800/50 bg-zinc-900/40 p-4">
          <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-zinc-500">
            Gerar ideia de um assunto manual
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={assuntoManual}
              onChange={(e) => setAssuntoManual(e.target.value)}
              placeholder="Ex.: eclipse lunar dessa semana"
              className="flex-1 rounded-lg border border-zinc-700/60 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-rose-500/50 focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && assuntoManual.trim()) gerar.mutate(assuntoManual.trim())
              }}
            />
            <button
              onClick={() => assuntoManual.trim() && gerar.mutate(assuntoManual.trim())}
              disabled={gerar.isPending || !assuntoManual.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-linear-to-r from-rose-600 to-red-600 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {gerar.isPending && gerar.variables === assuntoManual.trim() ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Gerar ideia
            </button>
          </div>
          {assuntoManual.trim() && resultados[assuntoManual.trim()] && (
            <ResultadoBox res={resultados[assuntoManual.trim()]} />
          )}
        </div>

        {/* FILTROS */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <ChipNivel v="todos" label="Todos" count={trends.length} />
          <ChipNivel v="alto" label="🟢 Alto 7+" count={contagem.alto} />
          <ChipNivel v="medio" label="🟡 Médio" count={contagem.medio} />
          <ChipNivel v="baixo" label="⚪ Baixo" count={contagem.baixo} />
          <span className="mx-1 h-5 w-px bg-zinc-700/50" />
          <select
            value={fonte}
            onChange={(e) => setFonte(e.target.value)}
            className="rounded-full bg-zinc-900/60 px-3 py-1.5 text-xs font-medium text-zinc-300 ring-1 ring-zinc-700/50 focus:outline-none"
          >
            <option value="todas">Todas as fontes</option>
            {fontes.map((f) => (
              <option key={f} value={f}>
                {FONTE_LABEL[f] || f}
              </option>
            ))}
          </select>
          <button
            onClick={() => setOcultarSensiveis((v) => !v)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              ocultarSensiveis ? 'bg-amber-600 text-white' : 'bg-zinc-900/60 text-zinc-400 ring-1 ring-zinc-700/50 hover:text-white'
            }`}
          >
            ⚠️ Ocultar sensíveis {contagem.sensiveis > 0 && <span className="opacity-70">({contagem.sensiveis})</span>}
          </button>
          <div className="relative ml-auto">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-600" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar assunto…"
              className="w-44 rounded-full border border-zinc-700/50 bg-zinc-900/60 py-1.5 pl-8 pr-3 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-rose-500/50 focus:outline-none"
            />
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700/50 bg-zinc-900/60 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-800 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} /> Atualizar
          </button>
        </div>

        {/* GRID DE CARDS */}
        {isLoading ? (
          <div className="flex items-center justify-center gap-3 rounded-2xl border border-zinc-800/50 bg-zinc-900/40 py-20 text-zinc-400">
            <Loader2 className="h-5 w-5 animate-spin" /> Coletando tendências e triando por encaixe…
          </div>
        ) : filtrados.length === 0 ? (
          <p className="rounded-2xl border border-zinc-800/50 bg-zinc-900/40 py-16 text-center text-zinc-500">
            Nada com esses filtros. Afrouxe os filtros ou clique em Atualizar.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {filtrados.map((t) => {
              const res = resultados[t.topico]
              const gerandoEste = gerar.isPending && gerar.variables === t.topico
              const jaUsado = !!res?.ideia || usadosSet.has(norm(t.topico))
              const nv = nivelDe(t.encaixe)
              const ac = ACENTO[nv]
              return (
                <div
                  key={t.topico}
                  className={`flex flex-col rounded-2xl border border-zinc-800/50 border-l-4 ${ac.borda} bg-zinc-900/40 p-4 transition-colors hover:border-zinc-700/60`}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <span className={`rounded-md px-2 py-0.5 text-xs font-bold ring-1 ${ac.badge}`}>{t.encaixe}/10</span>
                    <span className="text-[11px] font-medium text-zinc-500">{ac.rotulo}</span>
                    {t.sensivel && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-300 ring-1 ring-amber-500/30">
                        <AlertTriangle className="h-3 w-3" /> revisão
                      </span>
                    )}
                    {jaUsado && !res?.ideia && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300 ring-1 ring-emerald-500/30">
                        <CheckCircle2 className="h-3 w-3" /> já virou ideia
                      </span>
                    )}
                    <span className="ml-auto text-[10px] uppercase tracking-wider text-zinc-600">
                      {FONTE_LABEL[t.fonte] || t.fonte}
                    </span>
                  </div>
                  <p className="font-semibold leading-snug text-zinc-100">{t.topico}</p>
                  {t.angulo && <p className="mt-1 text-sm italic text-zinc-400">→ {t.angulo}</p>}
                  {res && <ResultadoBox res={res} />}
                  <button
                    onClick={() => gerar.mutate(t.topico)}
                    disabled={gerar.isPending || jaUsado}
                    className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-sm font-medium text-rose-300 transition-colors hover:bg-rose-500/20 disabled:opacity-50"
                  >
                    {gerandoEste ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    {jaUsado ? 'Ideia criada' : 'Gerar ideia'}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
