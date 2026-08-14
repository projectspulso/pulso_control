'use client'

import {
  Activity,
  Bot,
  RefreshCw,
  UserRound,
} from 'lucide-react'

import { AuditPanel } from '@/components/audit-panel'
import { TabelaAderencia } from '@/components/tabela-aderencia'
import { ErrorState } from '@/components/ui/error-state'
import { PageHeader } from '@/components/layout/page-header'
import { useAderencia, useColetarAgora } from '@/lib/hooks/use-aderencia'

const PLATAFORMA_LABEL: Record<string, string> = {
  youtube: 'YouTube',
  instagram: 'Instagram',
  facebook: 'Facebook',
  tiktok: 'TikTok',
  kwai: 'Kwai',
}
const ORDEM_PLATAFORMAS = ['youtube', 'instagram', 'facebook', 'tiktok', 'kwai']

export default function ValidacaoPage() {
  const { data, isLoading, isError, refetch } = useAderencia()
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

        <TabelaAderencia videos={data.videos} totalViews={data.totalViews} />

        <p className="flex items-center gap-2 text-xs text-zinc-600">
          <Activity className="h-3.5 w-3.5" />
          Atualização automática a cada 5 minutos · cron diário no Vercel (8h BRT) · 4 redes via APIs oficiais
        </p>
      </div>
    </div>
  )
}
