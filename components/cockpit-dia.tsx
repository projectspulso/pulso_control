'use client'

import Link from 'next/link'
import { Send, CheckCircle2, AlertTriangle, Clapperboard, PackageOpen, ArrowRight } from 'lucide-react'

import { AvisoCreditoRender } from '@/components/aviso-credito-render'
import { ProduzirDia } from '@/components/produzir-dia'
import { useHoje } from '@/lib/hooks/use-hoje'
import { useAprendizados, REDE_LABEL, REDE_EMOJI, corNota5 } from '@/lib/hooks/use-aprendizados'

const REDE_ICON: Record<string, string> = { youtube: '▶️', instagram: '📸', facebook: '📘', tiktok: '🎵', kwai: '🧡' }

/**
 * COCKPIT DO DIA — o antigo "Hoje": plano de publicação × estoque × produzir o dia × já publicado.
 * Usado na Central de Publicação (topo) e serve de home da rotina diária.
 */
export function CockpitDia({ mostrarLinkPublicar = true }: { mostrarLinkPublicar?: boolean }) {
  const { data, isLoading } = useHoje()
  const apr = useAprendizados()

  const estoqueBaixo = (data?.prontos.length ?? 0) < 3
  const renderTravado = (data?.emRenderComCenas ?? 0) > 0

  return (
    <div className="space-y-6">
      <AvisoCreditoRender />

      {/* Resumo em uma frase */}
      {!isLoading && data && (
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4 text-sm text-amber-100">
          {data.prontos.length > 0 ? (
            <>
              {/* Antes listava os 12 números de uma vez — 12 opções não é uma decisão, é um menu.
                  Agora nomeia os N do dia (N = grade) e o resto vira "na fila". */}
              <b>Publicar hoje:</b>{' '}
              {data.prontos
                .filter((p) => p.recomendadoHoje)
                .map((p) => `#${p.numero ?? '?'} ${p.titulo}`)
                .join('  ·  ')}
              .{' '}
              {data.prontos.length > data.alvoDia && (
                <span className="text-amber-200/60">
                  (+{data.prontos.length - data.alvoDia} na fila){' '}
                </span>
              )}
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

      {/* Manhã — 1 repost no Kwai (backfill de cobertura, campeão primeiro) */}
      {data?.kwaiHoje && (
        <div className="rounded-2xl border border-fuchsia-500/25 bg-fuchsia-500/5 p-4">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="text-sm">☀️</span>
            <h3 className="text-sm font-bold text-white">Manhã · repost no Kwai</h3>
            <span className="rounded-full bg-fuchsia-500/15 px-2 py-0.5 text-[11px] font-semibold text-fuchsia-300">
              #{data.kwaiHoje.numero ?? '?'}
            </span>
            <span className="ml-auto text-[11px] text-zinc-500">faltam {data.kwaiHoje.restantes} no Kwai</span>
          </div>
          <p className="text-sm text-zinc-200">{data.kwaiHoje.titulo}</p>
          {data.kwaiHoje.caption && (
            <p className="mt-1 line-clamp-2 text-[11px] text-zinc-500" title={data.kwaiHoje.caption}>{data.kwaiHoje.caption}</p>
          )}
          {data.kwaiHoje.videoUrl && (
            <a
              href={data.kwaiHoje.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block rounded-lg bg-fuchsia-500/15 px-3 py-1.5 text-xs font-semibold text-fuchsia-200 ring-1 ring-fuchsia-500/30 hover:bg-fuchsia-500/25"
            >
              Abrir vídeo pra postar no celular ↗
            </a>
          )}
        </div>
      )}

      {/* Facebook — rede manual: o que estreou nas outras redes e nunca foi ao FB */}
      {!!data?.fbPendentes?.length && (
        <div className="rounded-2xl border border-blue-500/25 bg-blue-500/5 p-4">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="text-sm">📘</span>
            <h3 className="text-sm font-bold text-white">Falta no Facebook</h3>
            <span className="ml-auto text-[11px] text-zinc-500">
              {data.fbPendentes.length} vídeo(s) · postar no Business Suite
            </span>
          </div>
          <ul className="space-y-2">
            {data.fbPendentes.map((f) => (
              <li key={f.ideiaId} className="flex flex-wrap items-center gap-2 text-sm">
                <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-[11px] font-semibold text-blue-300">
                  #{f.numero ?? '?'}
                </span>
                <span className="text-zinc-200">{f.titulo}</span>
                <span className="text-[11px] text-zinc-500">há {f.diasAtras}d</span>
                {f.videoUrl && (
                  <a
                    href={f.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto rounded-lg bg-blue-500/15 px-3 py-1 text-xs font-semibold text-blue-200 ring-1 ring-blue-500/30 hover:bg-blue-500/25"
                  >
                    Abrir vídeo ↗
                  </a>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-zinc-600">
            Confira que o &quot;Postar em&quot; está em <strong>Pulso Projects</strong> — não na Óticas.
          </p>
        </div>
      )}

      {/* Plano de publicação */}
      <div className="glass rounded-2xl border border-zinc-800/50 p-5">
        <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold text-white">
          <Send className="h-5 w-5 text-violet-400" /> Plano de publicação
        </h2>
        <p className="mb-4 text-xs text-zinc-500">
          Grade: {data?.alvoDia ?? 2}/dia (perenes 18h/21h). A rede vem do que mais entrega pra cada canal.
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
                <li
                  key={p.pipelineId}
                  className={`flex flex-wrap items-center gap-2 rounded-xl p-3 ${
                    p.recomendadoHoje ? 'bg-violet-500/10 ring-1 ring-violet-500/30' : 'bg-zinc-900/50'
                  }`}
                >
                  <span className="w-5 shrink-0 text-center font-mono text-sm font-bold text-violet-400">{i + 1}</span>
                  {p.numero != null && <span className="text-[11px] font-bold text-zinc-600">#{p.numero}</span>}
                  <span className="min-w-0 flex-1 truncate text-sm text-zinc-100" title={p.titulo}>
                    {p.titulo}
                  </span>
                  <span className="shrink-0 rounded-md bg-zinc-800/70 px-1.5 py-0.5 text-[10px] text-zinc-400">
                    {p.canalNome.replace(/^PULSO\s*/i, '')}
                  </span>
                  {p.notaHook != null && (
                    <span
                      className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold ring-1 ${corNota5(p.notaHook)}`}
                      title="Nota do gancho do roteiro (1-5)"
                    >
                      ★{p.notaHook}
                    </span>
                  )}
                  <span
                    className="shrink-0 rounded-md bg-teal-500/10 px-2 py-0.5 text-[11px] font-semibold text-teal-300 ring-1 ring-teal-500/25"
                    title="Rede que mais entrega pra esse canal"
                  >
                    {REDE_EMOJI[rede]} priorizar {REDE_LABEL[rede]}
                  </span>
                  {p.videoUrl && (
                    <a
                      href={p.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 rounded-md bg-zinc-800 px-2 py-0.5 text-[11px] font-semibold text-zinc-300 ring-1 ring-zinc-700 hover:bg-zinc-700"
                      title="Baixar o vídeo pra postar as redes manuais (FB/Kwai) do celular"
                    >
                      ⬇ vídeo
                    </a>
                  )}
                  {/* o PORQUÊ desta posição — sem isso o ranking é caixa-preta e o dono
                      volta a perguntar "e daí, qual eu publico?" */}
                  {p.motivo && (
                    <p className="w-full text-[11px] text-zinc-500">
                      {p.recomendadoHoje && <span className="font-semibold text-violet-300">Hoje · </span>}
                      {p.motivo}
                    </p>
                  )}
                </li>
              )
            })}
          </ol>
        ) : (
          <p className="rounded-xl bg-zinc-900/40 py-8 text-center text-sm text-zinc-500">
            Nada pronto. Os vídeos aparecem aqui quando o render termina (worker 08/16/23h).
          </p>
        )}

        {mostrarLinkPublicar && data && data.prontos.length > 0 && (
          <a
            href="#fila-publicacao"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-violet-600 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-violet-500/20"
          >
            Ir para a fila <ArrowRight className="h-4 w-4" />
          </a>
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
                {p.videoUrl && !(p.plataformas.includes('facebook') && p.plataformas.includes('kwai')) && (
                  <a
                    href={p.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 rounded-md bg-zinc-800 px-2 py-0.5 text-[11px] font-semibold text-zinc-300 ring-1 ring-zinc-700 hover:bg-zinc-700"
                    title="Baixar o vídeo pra fechar as redes manuais que faltam (FB/Kwai) do celular"
                  >
                    ⬇ vídeo
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Produzir o dia — fecha o gap do render (1 clique autoriza) */}
      <ProduzirDia />

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
  )
}
