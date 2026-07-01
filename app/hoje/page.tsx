'use client'

import Link from 'next/link'
import { Sun, Send, CheckCircle2, AlertTriangle, Clapperboard, PackageOpen, ArrowRight } from 'lucide-react'

import { ErrorState } from '@/components/ui/error-state'
import { AvisoCreditoRender } from '@/components/aviso-credito-render'
import { useHoje } from '@/lib/hooks/use-hoje'
import { useAprendizados, REDE_LABEL, REDE_EMOJI } from '@/lib/hooks/use-aprendizados'

const REDE_ICON: Record<string, string> = { youtube: '▶️', instagram: '📸', facebook: '📘', tiktok: '🎵' }

export default function HojePage() {
  const { data, isLoading, isError, refetch } = useHoje()
  const apr = useAprendizados()

  const hojeLabel = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })

  if (isError) {
    return (
      <div className="min-h-screen bg-zinc-950 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-4xl">
          <ErrorState title="Erro ao montar o plano de hoje" message="Tente novamente." onRetry={() => refetch()} />
        </div>
      </div>
    )
  }

  const estoqueBaixo = (data?.prontos.length ?? 0) < 3
  const renderTravado = (data?.emRenderComCenas ?? 0) > 0

  return (
    <div className="min-h-screen bg-zinc-950 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* header */}
        <div>
          <div className="mb-1 flex items-center gap-3">
            <Sun className="h-7 w-7 text-amber-400" />
            <h1 className="bg-linear-to-r from-amber-400 to-orange-400 bg-clip-text text-3xl font-black text-transparent sm:text-4xl">
              Hoje
            </h1>
          </div>
          <p className="capitalize text-zinc-400">{hojeLabel}</p>
        </div>

        <AvisoCreditoRender />

        {/* Resumo em uma frase */}
        {!isLoading && data && (
          <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4 text-sm text-amber-100">
            {data.prontos.length > 0 ? (
              <>
                <b>Publicar hoje:</b> {data.prontos.length} vídeo{data.prontos.length > 1 ? 's' : ''} pronto
                {data.prontos.length > 1 ? 's' : ''} — {data.prontos.map((p) => `#${p.numero ?? '?'}`).join(', ')}.{' '}
                {data.publicadosHoje.length > 0 && (
                  <span className="text-amber-200/70">Já saíram {data.publicadosHoje.length} hoje. </span>
                )}
                {estoqueBaixo && <span className="text-red-300">Estoque baixo ({data.estoqueDias} dia de grade).</span>}
              </>
            ) : (
              <span className="text-red-300">
                Sem vídeos prontos pra publicar hoje. {renderTravado && `${data.emRenderComCenas} travado(s) no render.`}
              </span>
            )}
          </div>
        )}

        {/* Plano de publicação */}
        <div className="glass rounded-2xl border border-zinc-800/50 p-5">
          <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold text-white">
            <Send className="h-5 w-5 text-violet-400" /> Plano de publicação
          </h2>
          <p className="mb-4 text-xs text-zinc-500">
            Grade: 3/dia (sazonal 12h · perenes 18h/21h). A rede vem do que mais entrega pra cada canal.
          </p>

          {isLoading ? (
            <div className="space-y-2">
              {[0, 1].map((i) => (
                <div key={i} className="skeleton h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : data && data.prontos.length > 0 ? (
            <ol className="space-y-2">
              {data.prontos.map((p, i) => {
                const rede = apr.data?.redeRecomendada(p.canalId) || 'youtube'
                return (
                  <li key={p.pipelineId} className="flex flex-wrap items-center gap-2 rounded-xl bg-zinc-900/50 p-3">
                    <span className="w-5 shrink-0 text-center font-mono text-sm font-bold text-violet-400">{i + 1}</span>
                    {p.numero != null && <span className="text-[11px] font-bold text-zinc-600">#{p.numero}</span>}
                    <span className="min-w-0 flex-1 truncate text-sm text-zinc-100" title={p.titulo}>
                      {p.titulo}
                    </span>
                    <span className="shrink-0 rounded-md bg-zinc-800/70 px-1.5 py-0.5 text-[10px] text-zinc-400">
                      {p.canalNome.replace(/^PULSO\s*/i, '')}
                    </span>
                    <span
                      className="shrink-0 rounded-md bg-teal-500/10 px-2 py-0.5 text-[11px] font-semibold text-teal-300 ring-1 ring-teal-500/25"
                      title="Rede que mais entrega pra esse canal"
                    >
                      {REDE_EMOJI[rede]} priorizar {REDE_LABEL[rede]}
                    </span>
                  </li>
                )
              })}
            </ol>
          ) : (
            <p className="rounded-xl bg-zinc-900/40 py-8 text-center text-sm text-zinc-500">
              Nada pronto. Os vídeos aparecem aqui quando o render termina (worker 08/16/23h).
            </p>
          )}

          {data && data.prontos.length > 0 && (
            <Link
              href="/publicar"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-violet-600 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-violet-500/20"
            >
              Ir publicar <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>

        {/* Já publicado hoje */}
        {data && data.publicadosHoje.length > 0 && (
          <div className="glass rounded-2xl border border-zinc-800/50 p-5">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white">
              <CheckCircle2 className="h-5 w-5 text-green-400" /> Já publicado hoje
            </h2>
            <ul className="space-y-2">
              {data.publicadosHoje.map((p) => (
                <li key={p.ideiaId} className="flex flex-wrap items-center gap-2 text-sm">
                  {p.numero != null && <span className="text-[11px] font-bold text-zinc-600">#{p.numero}</span>}
                  <span className="min-w-0 flex-1 truncate text-zinc-200" title={p.titulo}>
                    {p.titulo}
                  </span>
                  <span className="shrink-0 text-xs text-zinc-500">
                    {p.plataformas.map((r) => REDE_ICON[r] || r).join(' ')}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Saúde da esteira */}
        {data && (
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="glass rounded-2xl border border-zinc-800/50 p-4">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                <PackageOpen className="h-4 w-4" /> Estoque pronto
              </p>
              <p className={`mt-2 text-2xl font-bold ${estoqueBaixo ? 'text-red-300' : 'text-white'}`}>
                {data.prontos.length}
              </p>
              <p className="text-xs text-zinc-500">≈ {data.estoqueDias} dia(s) de grade</p>
            </div>
            <div className="glass rounded-2xl border border-zinc-800/50 p-4">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                <Clapperboard className="h-4 w-4" /> No render
              </p>
              <p className="mt-2 text-2xl font-bold text-white">{data.emRenderComCenas}</p>
              <p className="text-xs text-zinc-500">
                {data.emRenderSemCenas > 0 ? `+${data.emRenderSemCenas} sem cenas` : 'com cenas, na fila'}
              </p>
            </div>
            <div className="glass rounded-2xl border border-zinc-800/50 p-4">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                <AlertTriangle className="h-4 w-4" /> Em produção
              </p>
              <p className="mt-2 text-2xl font-bold text-white">{data.aguardandoRoteiroOuAudio}</p>
              <p className="text-xs text-zinc-500">roteiro/áudio a caminho</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
