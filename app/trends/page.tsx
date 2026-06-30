'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  TrendingUp,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Plus,
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
  angulo?: string
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

function corEncaixe(n: number): string {
  if (n >= 7) return 'text-emerald-300 bg-emerald-500/10 ring-emerald-500/30'
  if (n >= 4) return 'text-amber-300 bg-amber-500/10 ring-amber-500/30'
  return 'text-zinc-400 bg-zinc-500/10 ring-zinc-500/30'
}

export default function TrendsPage() {
  const [assuntoManual, setAssuntoManual] = useState('')
  const [resultados, setResultados] = useState<Record<string, GerarResultado>>({})

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

  if (isError) {
    return (
      <div className="min-h-screen bg-zinc-950 p-8">
        <div className="mx-auto max-w-5xl">
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
    if (res.error)
      return <p className="mt-2 text-sm text-red-300">Erro: {res.error}</p>
    if (res.descartado)
      return <p className="mt-2 text-sm text-zinc-400">Descartado: {res.motivo}</p>
    if (res.duplicada)
      return <p className="mt-2 text-sm text-amber-300">Ideia parecida já existe.</p>
    if (res.ideia)
      return (
        <div className="mt-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm">
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

  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <div className="mx-auto max-w-5xl">
        {/* header */}
        <div className="mb-6">
          <div className="mb-2 flex items-center gap-3">
            <TrendingUp className="h-7 w-7 text-rose-400" />
            <h1 className="bg-linear-to-r from-rose-400 to-red-400 bg-clip-text text-4xl font-black text-transparent">
              Trend Tops
            </h1>
          </div>
          <p className="text-zinc-400">
            Assuntos em alta no Brasil (Google Trends + News + YouTube), triados pelo encaixe PULSO. Vire o que tem
            ângulo educativo em ideia nova — tema sensível entra com revisão humana.
          </p>
        </div>

        {/* assunto manual */}
        <div className="mb-6 rounded-2xl border border-zinc-800/50 bg-zinc-900/40 p-4">
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

        {/* barra de ações da lista */}
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
            Em alta agora {data ? `(${data.length})` : ''}
          </h2>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-700/60 bg-zinc-900/60 px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:bg-zinc-800 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} /> Atualizar
          </button>
        </div>

        {/* lista */}
        {isLoading ? (
          <div className="flex items-center justify-center gap-3 rounded-2xl border border-zinc-800/50 bg-zinc-900/40 py-16 text-zinc-400">
            <Loader2 className="h-5 w-5 animate-spin" /> Coletando tendências e triando por encaixe…
          </div>
        ) : (
          <div className="space-y-2">
            {(data || []).map((t) => {
              const res = resultados[t.topico]
              const gerandoEste = gerar.isPending && gerar.variables === t.topico
              return (
                <div
                  key={t.topico}
                  className="rounded-2xl border border-zinc-800/50 bg-zinc-900/40 p-4 transition-colors hover:border-zinc-700/60"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span className={`rounded-md px-2 py-0.5 text-xs font-bold ring-1 ${corEncaixe(t.encaixe)}`}>
                          {t.encaixe}/10
                        </span>
                        {t.sensivel && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-300 ring-1 ring-amber-500/30">
                            <AlertTriangle className="h-3 w-3" /> revisão
                          </span>
                        )}
                        <span className="text-[11px] uppercase tracking-wider text-zinc-600">
                          {FONTE_LABEL[t.fonte] || t.fonte}
                        </span>
                      </div>
                      <p className="font-medium text-zinc-100">{t.topico}</p>
                      {t.angulo && <p className="mt-0.5 text-sm italic text-zinc-400">→ {t.angulo}</p>}
                      {res && <ResultadoBox res={res} />}
                    </div>
                    <button
                      onClick={() => gerar.mutate(t.topico)}
                      disabled={gerar.isPending || !!res?.ideia}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-sm font-medium text-rose-300 transition-colors hover:bg-rose-500/20 disabled:opacity-50"
                    >
                      {gerandoEste ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      {res?.ideia ? 'Criada' : 'Gerar ideia'}
                    </button>
                  </div>
                </div>
              )
            })}
            {data && data.length === 0 && (
              <p className="rounded-2xl border border-zinc-800/50 bg-zinc-900/40 py-12 text-center text-zinc-500">
                Nenhuma tendência retornada agora. Tente atualizar.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
