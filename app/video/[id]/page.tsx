'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Calendar, Check, Clapperboard, Copy, ExternalLink, FileText,
  Lightbulb, Mic, Send, TrendingUp,
} from 'lucide-react'
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'

import { useVideo, type VideoDetalhe } from '@/lib/hooks/use-video'
import { MEDIANA_FB_MEDIDA, PAPEL_NO_FACEBOOK } from '@/lib/decisor/temas'

/**
 * A FICHA DO VÍDEO — um endereço só para a vida inteira dele: ideia → roteiro → áudio → cenas →
 * legenda → agendamento → publicação por rede → desempenho.
 *
 * O pedido foi literal: "precisávamos ter um lugar onde teríamos tudo sobre o vídeo, desde a
 * ideia". Antes isso morava em quatro telas e ninguém respondia "o que aconteceu com o 118?" sem
 * abrir todas. Agora kanban, agenda, aderência, assets e o analytics apontam todos pra cá.
 *
 * Esta tela LÊ. Os botões "editar" levam para /ideias/[id] e /roteiros/[id], que continuam sendo
 * os editores — ler e escrever são atos diferentes.
 */

const n = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : String(v))
const NOME_REDE: Record<string, string> = {
  youtube: 'YouTube', instagram: 'Instagram', facebook: 'Facebook', tiktok: 'TikTok', kwai: 'Kwai',
}
const PADRAO_LABEL: Record<string, { txt: string; cor: string }> = {
  explosao: { txt: 'Explosão rápida — quase tudo nos primeiros dias', cor: 'text-amber-300' },
  evergreen: { txt: 'Evergreen — ainda ganhando views', cor: 'text-emerald-300' },
  desacelerando: { txt: 'Desacelerando — o ganho quase parou', cor: 'text-zinc-400' },
  estavel: { txt: 'Estável — cresce devagar', cor: 'text-sky-300' },
  poucos_dados: { txt: 'Poucos dados ainda', cor: 'text-zinc-500' },
}
const EIXO = { fill: '#6e6b7b', fontSize: 11 }
const FONTE_LABEL: Record<string, string> = {
  banco: 'banco de clips', ja_existia: 'já existia', pexels: 'Pexels', pixabay: 'Pixabay',
  wan: 'Wan', veo: 'Veo (pago)', stock: 'acervo', outro: 'outro',
}

const data_ = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : null

function Secao({ icone, titulo, acao, children }: {
  icone: React.ReactNode; titulo: string; acao?: React.ReactNode; children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-white/8 bg-[#1a1922] p-5">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-violet-400">{icone}</span>
        <h2 className="text-base font-semibold text-white">{titulo}</h2>
        {acao && <span className="ml-auto">{acao}</span>}
      </div>
      {children}
    </section>
  )
}

function LinkEditar({ href }: { href: string }) {
  return (
    <Link href={href} className="text-[11px] text-zinc-500 underline-offset-2 hover:text-violet-300 hover:underline">
      editar
    </Link>
  )
}

function Copiar({ texto }: { texto: string }) {
  const [ok, setOk] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(texto); setOk(true); setTimeout(() => setOk(false), 1500) }}
      className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-1 text-[11px] text-zinc-400 hover:bg-white/10 hover:text-zinc-200"
    >
      {ok ? <><Check className="h-3 w-3 text-emerald-400" /> copiado</> : <><Copy className="h-3 w-3" /> copiar</>}
    </button>
  )
}

/** A trilha: cada etapa acesa com a data em que aconteceu. É o "desde a ideia" numa linha. */
function Trilha({ d }: { d: VideoDetalhe }) {
  const hoje = new Date().toISOString().slice(0, 10)
  const publicadoEm = d.redes
    .map((r) => r.dataPublicacao)
    .filter(Boolean)
    .sort()[0] as string | undefined

  const etapas = [
    { rot: 'ideia', em: d.criadaEm },
    { rot: 'roteiro', em: d.roteiroEm },
    { rot: 'áudio', em: d.audioEm },
    { rot: 'cenas', em: d.cenasGeradasEm },
    { rot: 'vídeo', em: d.videoUrl ? (d.cenasGeradasEm ?? null) : null },
    { rot: 'agendado', em: d.previsto && d.previsto.data >= hoje ? `${d.previsto.data}T${d.previsto.horario}` : null },
    { rot: 'publicado', em: publicadoEm ?? null },
  ]

  return (
    <div className="flex flex-wrap items-stretch gap-1 overflow-x-auto">
      {etapas.map((e, i) => {
        const feito = !!e.em
        return (
          <div key={e.rot} className="flex items-stretch">
            {i > 0 && <div className={`my-auto h-px w-4 ${feito ? 'bg-violet-500/40' : 'bg-white/10'}`} />}
            <div
              className={`flex min-w-[74px] flex-col items-center rounded-lg border px-2.5 py-1.5 ${
                feito ? 'border-violet-500/25 bg-violet-500/[0.07]' : 'border-white/8 bg-black/20'
              }`}
            >
              <span className={`text-[11px] font-medium ${feito ? 'text-violet-200' : 'text-zinc-600'}`}>{e.rot}</span>
              <span className="text-[10px] text-zinc-500">{data_(e.em) ?? '—'}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function FichaDoVideo({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: d, isLoading } = useVideo(id)

  if (isLoading) return <div className="mx-auto max-w-4xl p-6"><div className="h-96 animate-pulse rounded-2xl bg-[#1a1922]" /></div>
  if (!d) return (
    <div className="mx-auto max-w-4xl p-6 text-center text-zinc-400">
      Vídeo não encontrado. <Link href="/analytics" className="text-violet-400 hover:underline">Voltar</Link>
    </div>
  )

  const serieChart = d.serie.map((p) => ({ ...p, label: p.data.slice(5) }))
  const padrao = PADRAO_LABEL[d.padrao]
  const papel = PAPEL_NO_FACEBOOK[d.tema]
  const corTema = papel === 'sorteia' ? 'bg-emerald-500/12 text-emerald-300'
    : papel === 'morto' ? 'bg-red-500/12 text-red-300' : 'bg-zinc-700/40 text-zinc-400'
  const jaPublicou = d.redes.some((r) => r.dataPublicacao)
  const hojeISO = new Date().toISOString().slice(0, 10)

  return (
    <div className="mx-auto max-w-4xl space-y-3.5 p-6">
      <Link href="/analytics" className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>

      {/* ── cabeçalho ── */}
      <div className="rounded-2xl border border-white/8 bg-[#1a1922] p-6">
        <div className="flex flex-wrap items-center gap-2">
          {d.numero != null && <span className="rounded-md bg-violet-500/15 px-2 py-0.5 text-xs font-bold text-violet-300">#{d.numero}</span>}
          <span className="rounded-md bg-zinc-800/70 px-2 py-0.5 text-[11px] text-zinc-400">{d.canalNome.replace(/^PULSO\s*/i, '')}</span>
          <span className={`rounded-md px-2 py-0.5 text-[11px] ${corTema}`} title={`mediana ${MEDIANA_FB_MEDIDA[d.tema]} no Facebook`}>
            {d.tema}
          </span>
          {d.statusPipeline && <span className="rounded-md bg-zinc-800/70 px-2 py-0.5 text-[11px] text-zinc-400">{d.statusPipeline.toLowerCase().replace(/_/g, ' ')}</span>}
          {d.notaHook != null && <span className="rounded-md bg-amber-500/12 px-2 py-0.5 text-[11px] font-bold text-amber-300">gancho ★{d.notaHook}</span>}
          {d.duracaoSeg != null && <span className="text-[11px] text-zinc-500">{d.duracaoSeg}s</span>}
        </div>
        <h1 className="mt-2.5 text-xl font-semibold text-white">{d.titulo}</h1>
        {d.descricao && <p className="mt-1 text-sm text-zinc-400">{d.descricao}</p>}

        <div className="mt-4">
          <Trilha d={d} />
        </div>
      </div>

      {/* ── o vídeo ── */}
      {d.videoUrl && (
        <Secao
          icone={<Clapperboard className="h-4 w-4" />}
          titulo="O vídeo"
          acao={<a href={d.videoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-300">abrir <ExternalLink className="h-3 w-3" /></a>}
        >
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video src={d.videoUrl} poster={d.thumbUrl ?? undefined} controls preload="metadata" className="max-h-[420px] w-full rounded-xl bg-black object-contain" />
        </Secao>
      )}

      {/* ── ideia ── */}
      <Secao icone={<Lightbulb className="h-4 w-4" />} titulo="Ideia" acao={<LinkEditar href={`/ideias/${d.ideiaId}`} />}>
        <dl className="grid gap-x-6 gap-y-2 text-xs sm:grid-cols-2">
          <Campo rot="Criada em" val={data_(d.criadaEm)} />
          <Campo rot="Status" val={d.statusIdeia} />
          <Campo rot="Origem" val={d.origem?.toLowerCase().replace(/_/g, ' ')} />
          <Campo rot="Gatilho psicológico" val={d.gatilho} />
          <Campo rot="Potencial viral (IA)" val={d.potencialViralIA != null ? String(d.potencialViralIA) : null} />
          <Campo rot="Tags" val={d.tags.length ? d.tags.join(', ') : null} />
        </dl>
      </Secao>

      {/* ── roteiro ── */}
      <Secao
        icone={<FileText className="h-4 w-4" />}
        titulo="Roteiro"
        acao={d.roteiroId ? <div className="flex items-center gap-2"><Copiar texto={d.roteiroTexto || ''} /><LinkEditar href={`/roteiros/${d.roteiroId}`} /></div> : undefined}
      >
        {d.roteiroTexto ? (
          <>
            <p className="mb-2 text-[11px] text-zinc-600">
              escrito em {data_(d.roteiroEm)}
              {d.duracaoEstimadaSeg != null && <> · previsto {d.duracaoEstimadaSeg}s</>}
              {d.duracaoSeg != null && d.duracaoEstimadaSeg != null && <> · saiu com {d.duracaoSeg}s</>}
            </p>
            <p className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded-xl border border-white/8 bg-black/20 p-3.5 text-sm leading-relaxed text-zinc-300">
              {d.roteiroTexto}
            </p>
          </>
        ) : <Vazio>Ainda não tem roteiro.</Vazio>}
      </Secao>

      {/* ── áudio ── */}
      <Secao icone={<Mic className="h-4 w-4" />} titulo="Áudio">
        {d.audioUrl ? (
          <>
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <audio src={d.audioUrl} controls preload="none" className="w-full" />
            <p className="mt-2 text-[11px] text-zinc-600">
              gerado em {data_(d.audioEm)}{d.duracaoSeg != null && <> · {d.duracaoSeg}s</>}
              {d.vozId && <> · voz {d.vozId}</>}
            </p>
          </>
        ) : <Vazio>Ainda não tem áudio.</Vazio>}
      </Secao>

      {/* ── produção: cenas e custo real ── */}
      <Secao icone={<Clapperboard className="h-4 w-4" />} titulo="Produção do b-roll">
        {d.ledger ? (
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
            {Object.entries(d.ledger.fontes).map(([f, q]) => (
              <span key={f} className={`rounded-md px-2 py-0.5 ${f === 'veo' ? 'bg-amber-500/12 text-amber-300' : 'bg-emerald-500/10 text-emerald-300'}`}>
                {q}× {FONTE_LABEL[f] || f}
              </span>
            ))}
            <span className="ml-auto text-[11px] text-zinc-500">
              {d.ledger.veoCr > 0
                ? <>custou <b className="text-zinc-300">{d.ledger.veoCr} cr</b> de Veo</>
                : <b className="text-emerald-300">sem gastar crédito</b>}
              {d.ledger.economizadoCr > 0 && <> · {d.ledger.economizadoCr} cr economizados por reuso</>}
            </span>
          </div>
        ) : (
          <p className="mb-3 text-[11px] text-zinc-600">
            Sem ledger de render — os vídeos anteriores a 31/07 não registravam de onde veio cada cena.
          </p>
        )}
        {d.cenas.length ? (
          <ol className="space-y-1">
            {d.cenas.map((c, i) => (
              <li key={c.nome || i} className="flex gap-2.5 rounded-lg border border-white/8 bg-black/20 px-3 py-1.5">
                <span className="w-6 shrink-0 text-[11px] tabular-nums text-zinc-600">{i + 1}</span>
                <span className="text-[11px] leading-relaxed text-zinc-400">{c.prompt}</span>
              </li>
            ))}
          </ol>
        ) : <Vazio>Cenas ainda não geradas.</Vazio>}
      </Secao>

      {/* ── copy ── */}
      <Secao icone={<Send className="h-4 w-4" />} titulo="Legenda para as redes" acao={d.caption ? <Copiar texto={d.caption} /> : undefined}>
        {d.caption
          ? <p className="whitespace-pre-wrap rounded-xl border border-white/8 bg-black/20 p-3.5 text-sm leading-relaxed text-zinc-300">{d.caption}</p>
          : <Vazio>Legenda ainda não escrita.</Vazio>}
      </Secao>

      {/* ── agenda ── */}
      <Secao icone={<Calendar className="h-4 w-4" />} titulo="Quando vai (ou foi) ao ar">
        {d.previsto && !jaPublicou && d.previsto.data < hojeISO ? (
          /* Slot no passado e nada publicado = data perdida, não plano. Chamar isso de "previsto"
             faz o dono achar que está agendado quando na verdade o vídeo ficou parado. */
          <p className="text-sm text-amber-300">
            Slot vencido — estava marcado para {data_(d.previsto.data)} às {d.previsto.horario.slice(0, 5)} e não foi ao ar.
          </p>
        ) : d.previsto ? (
          <p className="text-sm text-zinc-300">
            Previsto para <b className="text-violet-300">{data_(d.previsto.data)} às {d.previsto.horario.slice(0, 5)}</b>
            {d.previsto.fixado && <span className="ml-1.5 rounded bg-sky-500/12 px-1.5 py-0.5 text-[10px] text-sky-300">fixado</span>}
          </p>
        ) : jaPublicou ? (
          <p className="text-sm text-zinc-400">Já publicado — sem slot futuro na agenda.</p>
        ) : <Vazio>Ainda não agendado.</Vazio>}

        {jaPublicou && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {d.redes.filter((r) => r.dataPublicacao).map((r) => (
              <span key={r.plataforma} className="rounded-md border border-white/8 bg-black/20 px-2 py-1 text-[11px] text-zinc-400">
                {NOME_REDE[r.plataforma] || r.plataforma} · {data_(r.dataPublicacao)}
              </span>
            ))}
          </div>
        )}
      </Secao>

      {/* ── desempenho ── */}
      {jaPublicou && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Kpi titulo="Views (todas as redes)" valor={n(d.viewsTotal)} />
            <Kpi titulo="Alcance (pessoas)" valor={d.reachTotal != null ? n(d.reachTotal) : '—'} nota={d.reachTotal == null ? 'só IG+FB medem' : 'IG+FB'} />
            <Kpi titulo="Seguidores ganhos" valor={d.seguidoresTotal != null ? `+${d.seguidoresTotal}` : '—'} nota={d.seguidoresTotal == null ? 'só FB mede' : 'FB'} />
          </div>

          <Secao
            icone={<TrendingUp className="h-4 w-4" />}
            titulo="Linha do tempo das views"
            acao={padrao ? <span className={`text-[11px] ${padrao.cor}`}>{padrao.txt}</span> : undefined}
          >
            {serieChart.length < 2 ? (
              <p className="text-sm text-zinc-500">Sem série suficiente (o vídeo é recente ou pouco coletado).</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={serieChart} margin={{ top: 12, right: 12, bottom: 4, left: 4 }}>
                  <defs>
                    <linearGradient id="gv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#2a2833" />
                  <XAxis dataKey="label" tick={EIXO} tickLine={false} axisLine={{ stroke: '#2a2833' }} minTickGap={24} />
                  <YAxis tick={EIXO} tickLine={false} axisLine={false} width={40} tickFormatter={n} />
                  <Tooltip
                    contentStyle={{ background: '#12111a', border: '1px solid #2a2833', borderRadius: 10, fontSize: 12 }}
                    formatter={(v: number) => [n(v) + ' views', 'acumulado']}
                  />
                  <Area type="monotone" dataKey="views" stroke="#8b5cf6" strokeWidth={2} fill="url(#gv)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Secao>

          <Secao icone={<Send className="h-4 w-4" />} titulo="Por rede">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-xs">
                <thead className="text-zinc-500">
                  <tr>
                    <th className="pb-2 font-medium">Rede</th>
                    <th className="pb-2 text-right font-medium">Views</th>
                    <th className="pb-2 text-right font-medium">Alcance</th>
                    <th className="pb-2 text-right font-medium">Retenção</th>
                    <th className="pb-2 text-right font-medium">Percentil</th>
                    <th className="pb-2 text-right font-medium">Eng.</th>
                    <th className="pb-2 text-right font-medium">Seg.</th>
                    <th className="pb-2"></th>
                  </tr>
                </thead>
                <tbody className="text-zinc-300">
                  {d.redes.map((r) => (
                    <tr key={r.plataforma} className="border-t border-white/5">
                      <td className="py-2 font-medium text-zinc-100">{NOME_REDE[r.plataforma] || r.plataforma}</td>
                      <td className="py-2 text-right tabular-nums">
                        {n(r.views)}
                        {/* O painel do Instagram exibe views(IG) + facebook_views(crosspost) num número
                            só — em 30/07 mostrava 1.405 onde o app dizia 248, e parecia coleta parada. */}
                        {r.plataforma === 'instagram' && r.igTotalViews != null && r.igTotalViews > r.views && (
                          <span className="block text-[10px] font-normal text-zinc-600">
                            app do IG mostra {n(r.igTotalViews)} (+{n(r.igFacebookViews || 0)} do crosspost no FB)
                          </span>
                        )}
                      </td>
                      <td className="py-2 text-right tabular-nums text-zinc-400">{r.reach != null ? n(r.reach) : <span className="text-zinc-700">ind.</span>}</td>
                      <td className="py-2 text-right tabular-nums text-zinc-400">{r.taxaRetencao != null ? `${r.taxaRetencao}%` : <span className="text-zinc-700">ind.</span>}</td>
                      <td className="py-2 text-right tabular-nums">{r.percentil != null ? <span className={r.percentil >= 60 ? 'text-emerald-400' : r.percentil <= 40 ? 'text-amber-400' : 'text-zinc-400'}>p{r.percentil}</span> : <span className="text-zinc-700">—</span>}</td>
                      <td className="py-2 text-right tabular-nums text-zinc-500">{n(r.likes + r.comentarios + r.shares + r.saves)}</td>
                      <td className="py-2 text-right tabular-nums text-zinc-500">{r.seguidores != null ? `+${r.seguidores}` : <span className="text-zinc-700">—</span>}</td>
                      <td className="py-2 text-right">{r.url && <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-zinc-300"><ExternalLink className="ml-auto h-3.5 w-3.5" /></a>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-[11px] text-zinc-600">
              <b className="text-zinc-500">Percentil</b> = posição da retenção deste vídeo entre os da mesma rede.
              {' '}<b className="text-zinc-500">ind.</b> = a API da rede não entrega a métrica (retenção só YouTube/Instagram/Facebook; alcance só Instagram/Facebook).
            </p>
          </Secao>
        </>
      )}
    </div>
  )
}

function Campo({ rot, val }: { rot: string; val: string | null | undefined }) {
  return (
    <div className="flex gap-2">
      <dt className="w-40 shrink-0 text-zinc-600">{rot}</dt>
      <dd className={val ? 'text-zinc-300' : 'text-zinc-700'}>{val || '—'}</dd>
    </div>
  )
}

function Vazio({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-zinc-600">{children}</p>
}

function Kpi({ titulo, valor, nota }: { titulo: string; valor: string; nota?: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-[#1a1922] p-4">
      <p className="text-[11px] text-zinc-500">{titulo}</p>
      <p className="mt-1 text-2xl font-semibold text-white">{valor}</p>
      {nota && <p className="text-[10px] text-zinc-600">{nota}</p>}
    </div>
  )
}
