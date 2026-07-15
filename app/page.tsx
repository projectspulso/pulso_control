'use client'

import Link from 'next/link'
import {
  ArrowUpRight,
  CheckCircle2,
  Clapperboard,
  Lightbulb,
  Rocket,
} from 'lucide-react'

import { ErrorState } from '@/components/ui/error-state'
import { PageHeader } from '@/components/layout/page-header'
import { AlertasOperacao } from '@/components/alertas-operacao'
import { useDashboard } from '@/lib/hooks/use-dashboard'

function n(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    notation: value >= 10000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(value)
}

const ETAPAS_PIPELINE = [
  { status: 'AGUARDANDO_ROTEIRO', label: 'Aguardando roteiro' },
  { status: 'ROTEIRO_PRONTO', label: 'Roteiro pronto' },
  { status: 'AUDIO_GERADO', label: 'Áudio gerado' },
  { status: 'EM_EDICAO', label: 'Em edição' },
  { status: 'PRONTO_PUBLICACAO', label: 'Pronto p/ publicar' },
  { status: 'PUBLICADO', label: 'Publicado' },
]

function tempoRelativo(iso: string | null): string {
  if (!iso) return 'nunca'
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 60) return `${min}min atrás`
  const hrs = Math.floor(min / 60)
  if (hrs < 24) return `${hrs}h atrás`
  return `${Math.floor(hrs / 24)}d atrás`
}

export default function Home() {
  const { data, isLoading, isError, refetch } = useDashboard()

  if (isError) {
    return (
      <div className="min-h-screen bg-zinc-950 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <ErrorState
            title="Erro ao carregar o Centro de Comando"
            message="Não foi possível carregar os dados reais. Verifique a conexão."
            onRetry={() => refetch()}
          />
        </div>
      </div>
    )
  }

  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-zinc-950 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="skeleton h-12 w-72" />
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass rounded-2xl border border-zinc-800/50 p-6">
                <div className="skeleton h-5 w-24" />
                <div className="mt-4 skeleton h-9 w-24" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const acoes: { label: string; detalhe: string; href: string; urgente: boolean }[] = []
  if (data.prontosParaPublicar > 0)
    acoes.push({
      label: `Publicar ${data.prontosParaPublicar} vídeo(s) pronto(s)`,
      detalhe: 'IG sai pela API; FB/TikTok/YouTube no fluxo assistido',
      href: '/publicar',
      urgente: true,
    })
  if (data.roteirosParaAprovar > 0)
    acoes.push({
      label: `Aprovar ${data.roteirosParaAprovar} roteiro(s)`,
      detalhe: 'Roteiros em rascunho aguardando seu OK',
      href: '/roteiros',
      urgente: false,
    })
  if (data.estoqueIdeias.aprovadasLivres === 0)
    acoes.push({
      label: 'Estoque de ideias aprovadas zerado',
      detalhe: `${data.estoqueIdeias.rascunhos} rascunhos aguardando curadoria`,
      href: '/ideias',
      urgente: false,
    })

  return (
    <main className="min-h-screen bg-zinc-950 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <PageHeader
          titulo="Centro de Comando"
          subtitulo={`${n(data.viewsTotal)} views · ${data.publicacoesTotal} publicações nas 4 redes`}
          acoes={
            <div className="glass rounded-2xl px-5 py-3 text-right">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Última coleta</p>
              <p className="text-lg font-bold text-green-400">{tempoRelativo(data.ultimaColeta)}</p>
            </div>
          }
        />

        <AlertasOperacao />

        {/* Esteira + Ações */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Esteira de produção */}
          <Link
            href="/producao"
            className="glass group rounded-2xl border border-zinc-800/50 p-6 transition-colors hover:border-violet-500/40 lg:col-span-2"
          >
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                <Clapperboard className="h-5 w-5 text-violet-400" /> Esteira de produção
              </h2>
              <ArrowUpRight className="h-5 w-5 text-zinc-600 group-hover:text-violet-400" />
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3 md:grid-cols-6">
              {ETAPAS_PIPELINE.map((e) => (
                <div key={e.status} className="rounded-xl bg-zinc-900/60 p-3 text-center">
                  <p className="text-2xl font-black tabular-nums text-white">{data.pipeline[e.status] || 0}</p>
                  <p className="mt-1 text-[11px] leading-tight text-zinc-500">{e.label}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-zinc-500">
              Estoque: <span className="text-zinc-300">{data.estoqueIdeias.aprovadasLivres} ideias aprovadas livres</span> ·{' '}
              <span className="text-zinc-400">{data.estoqueIdeias.rascunhos} rascunhos</span>
            </p>
          </Link>

          {/* Ações pendentes */}
          <div className="glass rounded-2xl border border-zinc-800/50 p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
              <Rocket className="h-5 w-5 text-amber-400" /> Precisa de você
            </h2>
            <div className="mt-4 space-y-3">
              {acoes.length === 0 && (
                <p className="flex items-center gap-2 text-sm text-green-400">
                  <CheckCircle2 className="h-4 w-4" /> Tudo em dia — esteira rodando.
                </p>
              )}
              {acoes.map((a) => (
                <Link
                  key={a.label}
                  href={a.href}
                  className={`block rounded-xl border p-3 transition-colors ${
                    a.urgente
                      ? 'border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20'
                      : 'border-zinc-700/60 bg-zinc-900/50 hover:bg-zinc-800/60'
                  }`}
                >
                  <p className="text-sm font-semibold text-white">{a.label}</p>
                  <p className="mt-0.5 text-xs text-zinc-400">{a.detalhe}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Últimas publicações — o que saiu hoje. Ranking e alcance por rede vivem no /analytics. */}
        <div className="grid gap-6">
          <div className="glass rounded-2xl border border-zinc-800/50 p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
              <Lightbulb className="h-5 w-5 text-violet-400" /> Últimas publicações
            </h2>
            <div className="mt-4 space-y-2">
              {data.ultimasPublicacoes.map((v, i) => (
                <a
                  key={`${v.url}-${i}`}
                  href={v.url || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-lg p-2 hover:bg-zinc-900/60"
                >
                  <span className="flex-1 truncate text-sm text-zinc-200">{v.ideiaTitulo}</span>
                  <span className="text-xs text-zinc-500">{v.canalNome}</span>
                  <span className="text-xs capitalize text-zinc-500">{v.plataforma}</span>
                  <span className="w-14 text-right text-sm text-zinc-300">{n(v.views)}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
