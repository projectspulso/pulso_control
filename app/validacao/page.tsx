'use client'

import {
  Activity,
  BarChart3,
  Bot,
  Eye,
  RefreshCw,
  UserRound,
} from 'lucide-react'

import { AuditPanel } from '@/components/audit-panel'
import { ErrorState } from '@/components/ui/error-state'
import { PageHeader } from '@/components/layout/page-header'
import { useAderencia, useColetarAgora, type VideoAderencia } from '@/lib/hooks/use-aderencia'
import { useAprendizados, REDE_LABEL, REDE_EMOJI } from '@/lib/hooks/use-aprendizados'

const PLATAFORMA_LABEL: Record<string, string> = {
  youtube: 'YouTube',
  instagram: 'Instagram',
  facebook: 'Facebook',
  tiktok: 'TikTok',
  kwai: 'Kwai',
}
const ORDEM_PLATAFORMAS = ['youtube', 'instagram', 'facebook', 'tiktok', 'kwai']

function n(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    notation: value >= 10000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(value)
}

function verticalCurta(canalNome: string) {
  return canalNome.replace(/^PULSO\s*/i, '')
}

export default function ValidacaoPage() {
  const { data, isLoading, isError, refetch } = useAderencia()
  const apr = useAprendizados()
  const coletar = useColetarAgora()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="skeleton h-10 w-64" />
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass rounded-2xl border border-zinc-800/50 p-6">
                <div className="skeleton h-5 w-24" />
                <div className="mt-4 skeleton h-8 w-20" />
              </div>
            ))}
          </div>
          <div className="glass rounded-2xl border border-zinc-800/50 p-6">
            <div className="skeleton h-64 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-zinc-950 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <ErrorState
            title="Erro ao carregar a validação"
            message="Não foi possível ler as métricas de publicação. Tente novamente."
            onRetry={() => refetch()}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <PageHeader
          titulo="Aderência"
          subtitulo={`Números reais das redes — coletados automaticamente (YouTube, Instagram, Facebook e TikTok via APIs oficiais).${
            data.ultimaColeta ? ` Última coleta: ${new Date(data.ultimaColeta).toLocaleString('pt-BR')}` : ''
          }`}
          acoes={
            <button
              type="button"
              onClick={() => coletar.mutate()}
              disabled={coletar.isPending}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-violet-500/50 bg-linear-to-r from-violet-600 to-purple-600 px-5 py-2.5 font-semibold text-white transition-all hover:shadow-lg hover:shadow-violet-500/20 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${coletar.isPending ? 'animate-spin' : ''}`} />
              {coletar.isPending ? 'Coletando…' : 'Coletar agora'}
            </button>
          }
        />

        {/* Cobertura por plataforma — a pergunta desta página é "o que está no ar?", não
            "quanto rendeu?". Alcance por rede vive no /analytics; aqui medimos presença e
            se o link existe (sem link a coleta nunca acha o post). */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {ORDEM_PLATAFORMAS.map((plat) => {
            const stats = data.porPlataforma[plat]
            const posts = stats?.posts || 0
            const pct = data.totalVideos > 0 ? (posts / data.totalVideos) * 100 : 0
            return (
              <div key={plat} className="glass rounded-2xl border border-zinc-800/50 p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
                    {PLATAFORMA_LABEL[plat] || plat}
                  </p>
                  {stats?.automatica ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-semibold text-green-300">
                      <Bot className="h-3 w-3" /> auto
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/15 px-2 py-0.5 text-xs font-semibold text-yellow-300">
                      <UserRound className="h-3 w-3" /> cowork
                    </span>
                  )}
                </div>
                <p className="mt-3 text-3xl font-bold text-white tabular-nums">
                  {posts}
                  <span className="text-lg font-medium text-zinc-600">/{data.totalVideos}</span>
                </p>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className={`h-full rounded-full ${pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-400' : 'bg-red-500/70'}`}
                    style={{ width: `${Math.max(2, pct)}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-zinc-500">
                  {Math.round(pct)}% dos vídeos
                  {stats?.semLink ? (
                    <span className="ml-1.5 font-semibold text-red-300">· {stats.semLink} sem link</span>
                  ) : null}
                </p>
              </div>
            )
          })}
        </div>

        {/* Saúde dos dados — veio do /analytics (14/07). Coerência entre pipeline e publicações
            é operacional: pertence a "o que está no ar agora", junto do Coletar agora. */}
        <AuditPanel />

        {/* Tabela vídeo × plataforma */}
        <div className="glass overflow-hidden rounded-2xl border border-zinc-800/50">
          <div className="flex items-center gap-2 border-b border-zinc-800/50 p-6 pb-4">
            <BarChart3 className="h-5 w-5 text-violet-400" />
            <h2 className="text-lg font-semibold text-white">Vídeos publicados × plataformas</h2>
            <span className="ml-auto flex items-center gap-1 text-sm text-zinc-500">
              <Eye className="h-4 w-4" /> {n(data.totalViews)} views totais
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800/50 text-left text-xs uppercase tracking-wider text-zinc-500">
                  <th className="px-6 py-3">Vídeo</th>
                  <th className="px-3 py-3">Vertical</th>
                  {ORDEM_PLATAFORMAS.map((p) => (
                    <th key={p} className="px-3 py-3 text-right">
                      {PLATAFORMA_LABEL[p]}
                    </th>
                  ))}
                  <th className="px-3 py-3 text-right">Total</th>
                  <th className="px-6 py-3 text-right">Cobertura</th>
                </tr>
              </thead>
              <tbody>
                {data.videos.map((v: VideoAderencia) => (
                  <tr key={v.ideiaId} className="border-b border-zinc-800/30 hover:bg-zinc-900/40">
                    <td className="max-w-xs truncate px-6 py-3 text-zinc-200" title={v.titulo}>
                      {v.titulo}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-zinc-400">
                      <div className="flex items-center gap-1.5">
                        <span>{verticalCurta(v.canalNome)}</span>
                        {(() => {
                          const r = apr.data?.redeRecomendadaNome(v.canalNome)
                          return r ? (
                            <span
                              className="rounded bg-teal-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-teal-300 ring-1 ring-teal-500/25"
                              title="Rede que mais entrega pra esse canal"
                            >
                              {REDE_EMOJI[r]} {REDE_LABEL[r]}
                            </span>
                          ) : null
                        })()}
                      </div>
                    </td>
                    {ORDEM_PLATAFORMAS.map((p) => {
                      const m = v.plataformas[p]
                      return (
                        <td key={p} className="whitespace-nowrap px-3 py-3 text-right">
                          {m ? (
                            m.url_publicacao ? (
                              <a
                                href={m.url_publicacao}
                                target="_blank"
                                rel="noreferrer"
                                className="text-zinc-200 underline-offset-2 hover:text-violet-300 hover:underline"
                              >
                                {n(m.views || 0)}
                              </a>
                            ) : (
                              <span className="text-zinc-200">{n(m.views || 0)}</span>
                            )
                          ) : (
                            <span className="text-zinc-600">—</span>
                          )}
                        </td>
                      )
                    })}
                    <td className="whitespace-nowrap px-3 py-3 text-right font-semibold text-white">
                      {n(v.totalViews)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-3 text-right">
                      {(() => {
                        const faltam = ORDEM_PLATAFORMAS.filter((p) => !v.plataformas[p])
                        if (faltam.length === 0)
                          return <span className="text-xs font-semibold text-emerald-400">5/5</span>
                        return (
                          <span className="text-xs text-amber-300/90" title={`Ainda não está em: ${faltam.map((p) => PLATAFORMA_LABEL[p]).join(', ')}`}>
                            {ORDEM_PLATAFORMAS.length - faltam.length}/5 · falta {faltam.map((p) => PLATAFORMA_LABEL[p].slice(0, 2)).join(', ')}
                          </span>
                        )
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="flex items-center gap-2 text-xs text-zinc-600">
          <Activity className="h-3.5 w-3.5" />
          Atualização automática a cada 5 minutos · cron diário no Vercel (8h BRT) · 4 redes via APIs oficiais
        </p>
      </div>
    </div>
  )
}
