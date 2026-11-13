'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Info, Loader2, RefreshCw } from 'lucide-react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { PageHeader } from '@/components/layout/page-header'
import { mediana, serieDiaria, ultimas, useAnalyticsLongos, type AnalyticsLongos, type Leitura } from '@/lib/hooks/use-analytics-longos'

/**
 * Analytics dos Longos (06/11/2026). Molde: o Analytics dos Curtos (abas, gráficos, ideias), com a régua
 * do longo: horas de exibição, retenção ao longo do vídeo e quanto cada corte trouxe de volta ao episódio.
 * Nada aqui soma nos Curtos. Sem leitura, cada card diz o que falta para ter número, nunca inventa.
 */
const CARTAO = 'rounded-xl border border-(--pulso-border) bg-(--pulso-surface) shadow-sm'
const COR = 'var(--pulso-vl)'
const n = (v: number) => (v >= 1e6 ? `${(v / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mi` : v >= 1e3 ? `${(v / 1e3).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil` : Math.round(v).toLocaleString('pt-BR'))
const pct = (v: number) => `${(v * 100).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}%`
const dia = (v: string) => v.slice(5).split('-').reverse().join('/')
const REDE: Record<string, string> = { youtube: 'YouTube', instagram: 'Instagram', facebook: 'Facebook', tiktok: 'TikTok', kwai: 'Kwai', linkedin: 'LinkedIn' }
const TIPO_CORTE: Record<string, string> = { gancho: 'Gancho', historia: 'História', licao: 'Lição', tecnico: 'Técnico' }
const ORIGEM: Record<string, string> = {
  SHORTS: 'Shorts do canal', YT_SEARCH: 'Busca do YouTube', RELATED_VIDEO: 'Vídeos sugeridos', SUBSCRIBER: 'Inscritos (início e feed)',
  YT_CHANNEL: 'Página do canal', EXT_URL: 'Sites e apps externos', BROWSE: 'Página inicial do YouTube', NOTIFICATION: 'Notificações',
  PLAYLIST: 'Playlists', YT_OTHER_PAGE: 'Outras páginas do YouTube', END_SCREEN: 'Tela final', NO_LINK_OTHER: 'Direto ou desconhecido',
  HASHTAGS: 'Hashtags', ANNOTATION: 'Cards',
}
const CANAL: Record<string, string> = {
  principal: 'PULSO Histórias (o longo)', cortes: 'Bastidores DIGIAI Cortes', cortes2: 'Bastidores DIGIAI', digiai: 'DIGIAI',
  pulso_cortes: 'Cortes PULSO Histórias', pulso_bastidores: 'Bastidores PULSO Histórias',
}

type LeituraOrigem = { canal: string; rede: string; tipo: string; post_id: string | null; origens: Record<string, number> | null; origens_detalhe: Record<string, Record<string, number>> | null }
const SITE = (d: string) => d.replace(/^www\./, '').replace(/^m\./, '').replace(/^l\./, '').replace(/^lm\./, '')
function deOnde(ls: LeituraOrigem[], todas: LeituraOrigem[]) {
  const tipos: Record<string, number> = {}
  const quem: Record<string, number> = {}
  const porVideo = new Map(todas.filter((l) => l.rede === 'youtube' && l.post_id).map((l) => [l.post_id as string, l]))
  for (const l of ls) {
    for (const [k, v] of Object.entries(l.origens || {})) tipos[k] = (tipos[k] || 0) + v
    for (const [t, det] of Object.entries(l.origens_detalhe || {})) for (const [d, v] of Object.entries(det)) {
      const vid = porVideo.get(d)
      const nome = t === 'EXT_URL' ? SITE(d) : vid ? `${vid.tipo === 'longo' ? 'o episódio' : 'corte'} · ${CANAL[vid.canal] || vid.canal}` : `${ORIGEM[t] || t}: ${d}`
      quem[nome] = (quem[nome] || 0) + v
    }
  }
  const lista = (o: Record<string, number>, rot?: Record<string, string>) => Object.entries(o).map(([k, v]) => ({ nome: rot?.[k] || k, valor: v })).sort((a, b) => b.valor - a.valor).slice(0, 10)
  return { tipos: lista(tipos, ORIGEM), quem: lista(quem) }
}

const ABAS = [
  { id: 'geral', label: 'Visão geral' }, { id: 'episodios', label: 'Episódios' }, { id: 'cortes', label: 'Cortes' },
  { id: 'qualidade', label: 'Retenção' }, { id: 'funil', label: 'Funil' }, { id: 'audiencia', label: 'Audiência' },
  { id: 'crescimento', label: 'Crescimento' }, { id: 'ideias', label: 'Ideias' }, { id: 'dados', label: 'Dados' },
] as const
type Aba = (typeof ABAS)[number]['id']

function Card({ titulo, sub, children, rodape }: { titulo: string; sub?: string; children: ReactNode; rodape?: ReactNode }) {
  return (
    <section className={`${CARTAO} p-5`}>
      <h2 className="text-sm font-semibold text-(--pulso-text)">{titulo}</h2>
      {sub && <p className="mt-0.5 text-xs text-(--pulso-text-muted)">{sub}</p>}
      <div className="mt-4">{children}</div>
      {rodape && (
        // o texto explicativo fica recolhido (dono 12/11: muito texto na tela)
        <details className="group mt-3 border-t border-(--pulso-border) pt-2">
          <summary className="inline-flex min-h-8 cursor-pointer list-none items-center gap-1 text-[11px] text-(--pulso-text-subtle) hover:text-(--pulso-text-muted)">
            <Info className="h-3.5 w-3.5" aria-hidden /> como ler
          </summary>
          <p className="mt-1 text-xs leading-relaxed text-(--pulso-text-muted)">{rodape}</p>
        </details>
      )}
    </section>
  )
}
const Vazio = ({ children }: { children: ReactNode }) => (
  <div className="flex min-h-24 items-center justify-center rounded-xl border border-dashed border-(--pulso-border) px-4 text-center text-xs leading-relaxed text-(--pulso-text-muted)">{children}</div>
)
function Kpi({ rotulo, valor, sub }: { rotulo: string; valor: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-(--pulso-border) bg-(--pulso-bg) px-4 py-3">
      <p className="text-xs text-(--pulso-text-muted)">{rotulo}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-(--pulso-text)">{valor}</p>
      {sub && <p className="text-xs text-(--pulso-text-muted)">{sub}</p>}
    </div>
  )
}
const eixo = { tick: { fill: 'var(--pulso-text-muted)', fontSize: 10 }, tickLine: false }
const dica = { contentStyle: { background: 'var(--pulso-surface)', border: '1px solid var(--pulso-border)', borderRadius: 10, fontSize: 12 }, labelStyle: { color: 'var(--pulso-text-muted)' } }

function Barras({ dados, chave, rotulo }: { dados: { nome: string; valor: number }[]; chave?: string; rotulo: string }) {
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dados} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--pulso-border)" strokeDasharray="2 3" horizontal={false} />
          <XAxis type="number" tickFormatter={n} {...eixo} axisLine={false} />
          <YAxis type="category" dataKey="nome" width={120} {...eixo} axisLine={false} />
          <Tooltip {...dica} formatter={(v: number) => [n(v), rotulo]} />
          <Bar dataKey={chave || 'valor'} fill={COR} radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function Serie({ dados, campo, rotulo }: { dados: { data: string; acumulado: number; ganho: number }[]; campo: 'acumulado' | 'ganho'; rotulo: string }) {
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        {campo === 'acumulado' ? (
          <AreaChart data={dados} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs><linearGradient id="gVl" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={COR} stopOpacity={0.4} /><stop offset="100%" stopColor={COR} stopOpacity={0.03} /></linearGradient></defs>
            <CartesianGrid stroke="var(--pulso-border)" strokeDasharray="2 3" vertical={false} />
            <XAxis dataKey="data" tickFormatter={dia} {...eixo} minTickGap={24} />
            <YAxis tickFormatter={n} {...eixo} axisLine={false} width={44} />
            <Tooltip {...dica} labelFormatter={dia} formatter={(v: number) => [n(v), rotulo]} />
            <Area type="monotone" dataKey="acumulado" stroke={COR} strokeWidth={2} fill="url(#gVl)" />
          </AreaChart>
        ) : (
          <BarChart data={dados} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="var(--pulso-border)" strokeDasharray="2 3" vertical={false} />
            <XAxis dataKey="data" tickFormatter={dia} {...eixo} minTickGap={24} />
            <YAxis tickFormatter={n} {...eixo} axisLine={false} width={44} />
            <Tooltip {...dica} labelFormatter={dia} formatter={(v: number) => [n(v), rotulo]} />
            <Bar dataKey="ganho" fill={COR} radius={[4, 4, 0, 0]} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}

function calcular(d: AnalyticsLongos) {
  const ult = ultimas(d.leituras)
  const longos = ult.filter((l) => l.tipo === 'longo')
  const pecasLidas = ult.filter((l) => l.tipo !== 'longo')
  const pecaPorId = new Map(d.pecas.map((p) => [p.id, p]))
  const epPorId = new Map(d.episodios.map((e) => [e.id, e]))
  const soma = (xs: Leitura[], f: (l: Leitura) => number) => xs.reduce((s, l) => s + f(l), 0)
  const horas = soma(longos, (l) => Number(l.horas_exibicao || 0))
  const agrupa = (xs: Leitura[], k: (l: Leitura) => string) => {
    const m = new Map<string, number[]>()
    for (const l of xs) m.set(k(l), [...(m.get(k(l)) || []), l.views])
    return [...m.entries()].map(([nome, vs]) => ({ nome, valor: vs.reduce((a, b) => a + b, 0), mediana: mediana(vs), n: vs.length })).sort((a, b) => b.valor - a.valor)
  }
  const porRede = agrupa(pecasLidas, (l) => REDE[l.rede] || l.rede)
  const porCanal = agrupa(ult, (l) => CANAL[l.canal] || l.canal)
  const porCanalCortes = agrupa(pecasLidas, (l) => CANAL[l.canal] || l.canal)
  const corteACorte = [...pecasLidas].sort((a, b) => b.views - a.views).map((l) => {
    const p = pecaPorId.get(l.peca_id || '')
    return { l, p, ep: p ? epPorId.get(p.episodio_id)?.codigo || '' : '' }
  })
  const porTipoCorte = agrupa(pecasLidas.filter((l) => l.tipo === 'corte'), (l) => TIPO_CORTE[pecaPorId.get(l.peca_id || '')?.corte_tipo || ''] || 'sem tipo')
  const campeoes = [...pecasLidas].sort((a, b) => b.views - a.views).slice(0, 8).map((l) => {
    const p = pecaPorId.get(l.peca_id || '')
    return { l, titulo: p ? `${epPorId.get(p.episodio_id)?.codigo || ''} · corte ${p.corte_numero}: ${p.corte_titulo}` : '—' }
  })
  const porEpisodio = d.episodios.map((e) => {
    const lo = longos.find((l) => l.episodio_id === e.id)
    const pc = pecasLidas.filter((l) => l.episodio_id === e.id)
    const agenda = d.pecas.filter((p) => p.episodio_id === e.id)
    return { e, longo: lo, viewsCortes: soma(pc, (l) => l.views), cliques: soma(pc, (l) => Number(l.cliques_episodio || 0)), agenda }
  })
  const seguidoresAtual = (() => {
    const m = new Map<string, { canal: string; rede: string; seguidores: number; data_ref: string }>()
    for (const s of d.seguidores) m.set(`${s.canal}|${s.rede}`, s)
    return [...m.values()]
  })()
  const inscritosPrincipal = seguidoresAtual.find((s) => s.canal === 'principal' && s.rede === 'youtube')?.seguidores ?? null
  return { ult, longos, pecasLidas, horas, porRede, porCanal, porCanalCortes, corteACorte, porTipoCorte, campeoes, porEpisodio, seguidoresAtual, inscritosPrincipal,
    views: soma(ult, (l) => l.views), viewsLongo: soma(longos, (l) => l.views), viewsPecas: soma(pecasLidas, (l) => l.views),
    cliques: soma(pecasLidas, (l) => Number(l.cliques_episodio || 0)),
    serie: serieDiaria(d.leituras), serieHoras: serieDiaria(d.leituras.filter((l) => l.tipo === 'longo'), 'horas_exibicao') }
}

/** Parecer e ideias por regra fixa sobre o dado medido; sem leitura, não opina. */
function ideias(d: AnalyticsLongos, c: ReturnType<typeof calcular>) {
  const out: { titulo: string; texto: string; base: string }[] = []
  const tipos = c.porTipoCorte.filter((t) => t.n >= 2)
  if (tipos.length >= 2) {
    const [a, b] = [tipos.reduce((x, y) => (y.mediana > x.mediana ? y : x)), tipos.reduce((x, y) => (y.mediana < x.mediana ? y : x))]
    if (b.mediana > 0) out.push({ titulo: `Mais cortes do tipo ${a.nome}`, texto: `O corte de ${a.nome.toLowerCase()} rende ${(a.mediana / b.mediana).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}× o de ${b.nome.toLowerCase()} na mediana. No próximo roteiro, marque mais trechos desse tipo.`, base: `${a.n} e ${b.n} cortes medidos` })
  }
  const redes = c.porRede.filter((r) => r.n >= 2)
  if (redes.length >= 2) out.push({ titulo: `${redes[0].nome} puxa os cortes`, texto: `${redes[0].nome} soma ${n(redes[0].valor)} views dos cortes, ${pct(redes[0].valor / (c.viewsPecas || 1))} do total. Vale o digiai_mkt priorizar o horário dessa rede.`, base: `${redes[0].n} peças medidas` })
  if (c.cliques > 0 && c.viewsPecas > 0) out.push({ titulo: 'Quanto o corte leva ao episódio', texto: `A cada mil views de corte, ${((c.cliques / c.viewsPecas) * 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} pessoas foram ao episódio. É a régua do cartão final e da 1ª linha da legenda.`, base: `${n(c.cliques)} cliques informados` })
  const curva = c.longos.find((l) => l.retencao_curva?.length)?.retencao_curva
  if (curva && curva.length > 3) {
    const queda = curva.slice(1).map((p, i) => ({ p: p.p, d: curva[i].ret - p.ret })).reduce((a, b) => (b.d > a.d ? b : a))
    out.push({ titulo: 'Onde o episódio perde gente', texto: `A maior queda de audiência está perto de ${pct(queda.p)} do vídeo (${pct(queda.d)} saem ali). Revise esse trecho do roteiro e use o momento como gancho de corte.`, base: 'curva de retenção do YouTube' })
  }
  const semEstreia = d.episodios.filter((e) => e.status === 'pronto_publicacao' && !e.estreia)
  if (semEstreia.length) out.push({ titulo: `${semEstreia.length} episódio pronto sem estreia`, texto: `${semEstreia.map((e) => e.codigo).join(', ')} está aprovado e sem data. Sem estreia não há cortes na agenda nem números.`, base: 'agenda' })
  return out
}

export default function LongosAnalyticsPage() {
  const { data, isLoading, error } = useAnalyticsLongos()
  const [aba, setAba] = useState<Aba>('geral')
  const qc = useQueryClient()
  const [atualizando, setAtualizando] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)
  async function atualizar() {
    setAtualizando(true); setAviso(null)
    try {
      const r = await fetch('/api/automation/coletar-longos', { method: 'POST' })
      const j = await r.json().catch(() => ({}))
      setAviso(r.ok ? `Coleta feita: ${j.gravadas ?? 0} leituras gravadas${j.falhas?.length ? ` · ${j.falhas.length} aviso(s): ${j.falhas.slice(0, 2).join('; ')}` : ''}` : `A coleta falhou: ${j.erro || j.error || r.status}`)
      await qc.invalidateQueries({ queryKey: ['analytics-longos'] })
    } catch (e) {
      setAviso(`A coleta falhou: ${(e as Error).message}`)
    } finally {
      setAtualizando(false)
    }
  }
  const c = useMemo(() => (data ? calcular(data) : null), [data])
  const lista = useMemo(() => (data && c ? ideias(data, c) : []), [data, c])
  const semLeitura = data && data.leituras.length === 0

  return (
    <div className="space-y-5">
      <PageHeader titulo="Analytics dos Longos" subtitulo="Episódios, cortes e canais em números" />
      {isLoading && <div className={`h-40 animate-pulse ${CARTAO}`} />}
      {error && <p className={`${CARTAO} p-6 text-sm text-(--pulso-danger)`}>Não deu para ler: {(error as Error).message}</p>}
      {data && c && (
        <>
          {semLeitura && (
            <p className={`${CARTAO} p-4 text-sm text-(--pulso-text-muted)`}>Ainda sem leitura: os números começam na estreia do primeiro episódio.</p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={atualizar} disabled={atualizando}
              className="inline-flex items-center gap-2 rounded-lg border border-(--pulso-vl) px-3 py-1.5 text-xs font-semibold text-(--pulso-vl) hover:bg-(--pulso-vl)/10 disabled:opacity-60">
              {atualizando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              {atualizando ? 'Atualizando…' : 'Atualizar dados'}
            </button>
            <span className="text-xs text-(--pulso-text-muted)">
              {aviso || (data.ultimaColeta ? `Última coleta: ${new Date(data.ultimaColeta.criado).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' })} · todo dia às 06h45` : 'Ainda sem coleta')}
            </span>
          </div>
          <div role="tablist" className="flex gap-1 overflow-x-auto rounded-full border border-(--pulso-border) bg-(--pulso-surface) p-1">
            {ABAS.map((t) => (
              <button key={t.id} type="button" role="tab" aria-selected={aba === t.id} onClick={() => setAba(t.id)}
                className={`shrink-0 rounded-full px-4 py-2 text-[13px] transition-colors ${aba === t.id ? 'bg-(--pulso-vl) font-medium text-[#1a1206]' : 'text-(--pulso-text-muted) hover:text-(--pulso-text)'}`}>
                {t.label}
              </button>
            ))}
          </div>

          {aba === 'geral' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Kpi rotulo="Views no total" valor={n(c.views)} sub="longo + todas as peças" />
                <Kpi rotulo="Views do longo" valor={n(c.viewsLongo)} sub="canal principal" />
                <Kpi rotulo="Horas de exibição" valor={c.horas ? n(c.horas) : '—'} sub={c.horas ? 'do longo' : 'pede o acesso ao canal principal'} />
                <Kpi rotulo="Levados ao episódio" valor={c.cliques ? n(c.cliques) : '—'} sub="pelos cortes" />
              </div>
              <Card titulo="Monetização do canal principal" sub={data.notaMetas || undefined}
                rodape="Regras do Programa de Parcerias do YouTube conferidas em 06/11/2026, guardadas na config longos_metas.">
                {data.gates.length === 0 ? <Vazio>Metas não configuradas.</Vazio> : (
                  <div className="space-y-4">
                    {data.gates.map((g) => (
                      <div key={g.id}>
                        <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                          <span className="font-semibold text-(--pulso-text)">{g.nome}</span>
                          <span className="text-xs text-(--pulso-text-muted)">{g.recompensa}</span>
                        </div>
                        {[{ r: 'Inscritos', v: c.inscritosPrincipal, m: g.inscritos }, { r: 'Horas de exibição (12 meses)', v: c.horas || null, m: g.horas_12m }].map((x) => (
                          <div key={x.r} className="mt-2">
                            <div className="flex justify-between text-xs text-(--pulso-text-muted)"><span>{x.r}</span><span className="tabular-nums">{x.v === null ? 'sem leitura' : `${n(x.v)} de ${n(x.m)}`}</span></div>
                            <div className="mt-1 h-2 overflow-hidden rounded-full bg-(--pulso-bg)"><div className="h-full rounded-full bg-(--pulso-vl)" style={{ width: `${Math.min(100, ((x.v || 0) / x.m) * 100)}%` }} /></div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
              <div className="grid gap-4 lg:grid-cols-2">
                <Card titulo="Views por canal" sub="principal, canal de cortes e DIGIAI">
                  {c.porCanal.length ? <Barras dados={c.porCanal} rotulo="views" /> : <Vazio>Aparece quando houver a primeira leitura.</Vazio>}
                </Card>
                <Card titulo="Crescimento acumulado" sub="views somando o longo e as peças">
                  {c.serie.length > 1 ? <Serie dados={c.serie} campo="acumulado" rotulo="views acumuladas" /> : <Vazio>A curva começa a partir de duas leituras diárias.</Vazio>}
                </Card>
              </div>
              {lista[0] && (
                <Card titulo="A ideia mais forte agora" sub={lista[0].base}><p className="text-sm text-(--pulso-text)"><b>{lista[0].titulo}.</b> {lista[0].texto}</p></Card>
              )}
            </div>
          )}

          {aba === 'episodios' && (
            <Card titulo="Episódio a episódio" sub="estreia, views do longo, views dos cortes, levados ao episódio e a agenda devolvida pelo digiai_mkt">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead><tr className="text-left text-xs text-(--pulso-text-muted)">
                    <th className="py-2 pr-3 font-medium">Episódio</th><th className="pr-3 font-medium">Estreia</th><th className="pr-3 text-right font-medium">Longo</th>
                    <th className="pr-3 text-right font-medium">Horas</th><th className="pr-3 text-right font-medium">Retenção</th><th className="pr-3 text-right font-medium">Cortes</th>
                    <th className="pr-3 text-right font-medium">Levados</th><th className="font-medium">Peças (fila · agendadas · no ar · recusadas)</th>
                  </tr></thead>
                  <tbody className="divide-y divide-(--pulso-border)">
                    {c.porEpisodio.filter((x) => x.e.status !== 'planejado' || x.agenda.length || x.longo).map((x) => {
                      const k = (s: string) => x.agenda.filter((p) => p.status === s).length
                      return (
                        <tr key={x.e.id} className="text-(--pulso-text)">
                          <td className="py-2 pr-3">{x.e.codigo} · {x.e.titulo}{x.e.url && <a href={x.e.url} target="_blank" rel="noreferrer" className="ml-2 text-xs text-(--pulso-action) hover:underline">abrir</a>}</td>
                          <td className="pr-3 text-xs text-(--pulso-text-muted)">{x.e.estreia ? new Date(x.e.estreia).toLocaleDateString('pt-BR') : x.e.status.replace('_', ' ')}</td>
                          <td className="pr-3 text-right tabular-nums">{x.longo ? n(x.longo.views) : '—'}</td>
                          <td className="pr-3 text-right tabular-nums">{x.longo?.horas_exibicao ? n(x.longo.horas_exibicao) : '—'}</td>
                          <td className="pr-3 text-right tabular-nums">{x.longo?.retencao_media_pct != null ? `${Math.round(x.longo.retencao_media_pct)}%` : '—'}</td>
                          <td className="pr-3 text-right tabular-nums">{x.viewsCortes ? n(x.viewsCortes) : '—'}</td>
                          <td className="pr-3 text-right tabular-nums">{x.cliques ? n(x.cliques) : '—'}</td>
                          <td className="tabular-nums text-xs text-(--pulso-text-muted)">{k('planejado')} · {k('agendado')} · {k('publicado')} · {k('recusado')}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              {(() => {
                const rec = data.pecas.filter((p) => p.status === 'recusado')
                return rec.length ? <ul className="mt-3 space-y-1 text-xs text-(--pulso-warn)">{rec.map((p) => <li key={p.id}>{REDE[p.rede.split('_')[0]] || p.rede} ({p.tipo}) do corte {p.corte_numero} recusada: {p.motivo || 'sem motivo'}</li>)}</ul> : null
              })()}
              <p className="mt-2 text-xs text-(--pulso-text-muted)">{c.porEpisodio.filter((x) => x.e.status === 'planejado' && !x.agenda.length && !x.longo).length} episódios ainda no roteiro, sem agenda: entram aqui quando forem marcados.</p>
            </Card>
          )}

          {aba === 'cortes' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Kpi rotulo="Views dos cortes" valor={n(c.viewsPecas)} sub="todos os canais e redes" />
                <Kpi rotulo="Cortes no ar" valor={String(data.pecas.filter((p) => p.status === 'publicado' && p.tipo === 'corte').length)} sub="publicações" />
                <Kpi rotulo="Com leitura" valor={String(c.pecasLidas.length)} sub="coleta diária" />
                <Kpi rotulo="Levados ao episódio" valor={c.cliques ? n(c.cliques) : '—'} sub="quando a rede informa" />
              </div>
              {(() => {
                const o = deOnde(c.ult.filter((l) => l.tipo !== 'longo' && l.rede === 'youtube'), c.ult)
                return (
                  <Card titulo="De onde vêm as views dos cortes" sub="YouTube Analytics dos canais do PULSO"
                    rodape="Só o YouTube informa a origem. Instagram, Facebook e TikTok não abrem esse dado pela API. Os cortes do canal da DIGIAI entram quando o MKT mandar a origem junto com as views.">
                    {o.tipos.length ? <Barras dados={o.tipos} rotulo="views" /> : <Vazio>O YouTube leva cerca de 48 h para mostrar a origem de um vídeo novo.</Vazio>}
                  </Card>
                )
              })()}
              <Card titulo="Por canal de cortes" sub="os 2 canais do PULSO e os 2 da DIGIAI">
                {c.porCanalCortes.length ? <Barras dados={c.porCanalCortes} rotulo="views" /> : <Vazio>Aparece quando os cortes publicados tiverem leitura.</Vazio>}
              </Card>
              {(() => {
                const canais = ['pulso_cortes', 'pulso_bastidores', 'cortes', 'cortes2']
                const redes = ['youtube', 'tiktok', 'instagram', 'facebook']
                const cel = (cn: string, r: string) => {
                  const ls = c.pecasLidas.filter((l) => l.canal === cn && l.rede === r)
                  return ls.length ? { views: ls.reduce((s, l) => s + l.views, 0), n: ls.length } : null
                }
                return (
                  <Card titulo="Canal × rede" sub="views da última leitura de cada corte, separadas por canal e por rede"
                    rodape="Canais do PULSO: o Pulso lê. Canais da DIGIAI: o MKT lê e manda pela leitura_peca_bastidores. Traço = ainda nada publicado ali.">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[560px] text-sm">
                        <thead><tr className="text-left text-xs text-(--pulso-text-muted)">
                          <th className="py-2 pr-3 font-medium">Canal</th>
                          {redes.map((r) => <th key={r} className="pr-3 text-right font-medium">{REDE[r]}</th>)}
                          <th className="text-right font-medium">Total</th>
                        </tr></thead>
                        <tbody className="divide-y divide-(--pulso-border)">
                          {canais.map((cn) => {
                            const linha = redes.map((r) => cel(cn, r))
                            const total = linha.reduce((s, x) => s + (x?.views || 0), 0)
                            return (
                              <tr key={cn} className="text-(--pulso-text)">
                                <td className="py-2 pr-3">{CANAL[cn] || cn}</td>
                                {linha.map((x, i) => (
                                  <td key={redes[i]} className="pr-3 text-right tabular-nums">
                                    {x ? <>{n(x.views)}<span className="ml-1 text-xs text-(--pulso-text-muted)">· {x.n}</span></> : <span className="text-(--pulso-text-muted)">—</span>}
                                  </td>
                                ))}
                                <td className="text-right font-semibold tabular-nums">{total ? n(total) : '—'}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                )
              })()}
              <div className="grid gap-4 lg:grid-cols-2">
                <Card titulo="Por tipo de corte" sub="gancho, história, lição e técnico: views somadas" rodape="O tipo vem da marcação no roteiro (CORTE). É o dado que decide o que marcar no próximo episódio.">
                  {c.porTipoCorte.length ? <Barras dados={c.porTipoCorte} rotulo="views" /> : <Vazio>Aparece quando os cortes publicados tiverem leitura.</Vazio>}
                </Card>
                <Card titulo="Por rede" sub="onde os cortes rendem">
                  {c.porRede.length ? <Barras dados={c.porRede} rotulo="views" /> : <Vazio>Aparece quando os cortes publicados tiverem leitura.</Vazio>}
                </Card>
              </div>
              <Card titulo="Campeões" sub="as peças com mais views">
                {c.campeoes.length ? (
                  <ol className="space-y-2 text-sm">
                    {c.campeoes.map(({ l, titulo }, i) => (
                      <li key={i} className="flex items-baseline gap-3">
                        <span className="w-5 text-xs text-(--pulso-text-muted)">{i + 1}</span>
                        <span className="min-w-0 flex-1 text-(--pulso-text)">{titulo}</span>
                        <span className="text-xs text-(--pulso-text-muted)">{REDE[l.rede] || l.rede}</span>
                        <span className="tabular-nums text-(--pulso-text)">{n(l.views)}</span>
                      </li>
                    ))}
                  </ol>
                ) : <Vazio>Os campeões aparecem depois da primeira semana de cortes no ar.</Vazio>}
              </Card>
              <Card titulo="Corte a corte" sub="cada corte em cada canal e rede, pela última leitura"
                rodape="O PULSO lê YouTube, Instagram e Facebook dos canais dele; o canal de cortes da DIGIAI vem pelo YouTube e pelo que o digiai_mkt devolver. TikTok entra quando o app for aprovado.">
                {c.corteACorte.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[680px] text-sm">
                      <thead><tr className="text-left text-xs text-(--pulso-text-muted)">
                        <th className="py-2 pr-3 font-medium">Corte</th><th className="pr-3 font-medium">Canal</th><th className="pr-3 font-medium">Rede</th>
                        <th className="pr-3 text-right font-medium">Views</th><th className="pr-3 text-right font-medium">Curtidas</th>
                        <th className="pr-3 text-right font-medium">Coment.</th><th className="font-medium">Lido em</th>
                      </tr></thead>
                      <tbody className="divide-y divide-(--pulso-border)">
                        {c.corteACorte.map(({ l, p, ep }) => (
                          <tr key={`${l.peca_id}|${l.rede}`} className="text-(--pulso-text)">
                            <td className="py-2 pr-3">{p ? <>{ep} · corte {p.corte_numero}: {p.corte_titulo}</> : '—'}{p?.url && <a href={p.url} target="_blank" rel="noreferrer" className="ml-2 text-xs text-(--pulso-action) hover:underline">abrir</a>}</td>
                            <td className="pr-3 text-xs text-(--pulso-text-muted)">{CANAL[l.canal] || l.canal}</td>
                            <td className="pr-3 text-xs text-(--pulso-text-muted)">{REDE[l.rede] || l.rede}</td>
                            <td className="pr-3 text-right tabular-nums">{n(l.views)}</td>
                            <td className="pr-3 text-right tabular-nums">{n(l.likes || 0)}</td>
                            <td className="pr-3 text-right tabular-nums">{n(l.comentarios || 0)}</td>
                            <td className="text-xs text-(--pulso-text-muted)">{dia(l.data_ref)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : <Vazio>Aparece depois da primeira coleta com cortes no ar. Use “Atualizar dados” no topo.</Vazio>}
              </Card>
              <Card titulo="Seguidores dos canais de cortes" sub="última leitura de cada canal em cada rede">
                {(() => {
                  const linhas = c.seguidoresAtual.filter((x) => x.canal !== 'principal')
                  return linhas.length ? (
                    <ul className="grid gap-2 sm:grid-cols-2">
                      {linhas.map((x) => (
                        <li key={`${x.canal}|${x.rede}`} className="flex items-baseline justify-between rounded-xl bg-(--pulso-bg) px-3 py-2 text-sm">
                          <span className="text-(--pulso-text)">{CANAL[x.canal] || x.canal} · <span className="text-(--pulso-text-muted)">{REDE[x.rede] || x.rede}</span></span>
                          <span className="tabular-nums text-(--pulso-text)">{n(x.seguidores)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : <Vazio>Aparece depois da primeira coleta.</Vazio>
                })()}
              </Card>
            </div>
          )}

          {aba === 'qualidade' && (
            <div className="space-y-4">
              <Card titulo="Curva de retenção do episódio" sub="quanto do público ainda assiste em cada ponto do vídeo"
                rodape="Vem do YouTube Analytics do canal principal. Precisa do acesso ao canal (OAuth), que se faz quando o canal nascer.">
                {(() => {
                  const lo = c.longos.find((l) => l.retencao_curva?.length)
                  return lo?.retencao_curva ? (
                    <div className="h-60">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={lo.retencao_curva} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                          <CartesianGrid stroke="var(--pulso-border)" strokeDasharray="2 3" vertical={false} />
                          <XAxis dataKey="p" tickFormatter={pct} {...eixo} />
                          <YAxis tickFormatter={pct} {...eixo} axisLine={false} width={44} domain={[0, 1]} />
                          <Tooltip {...dica} labelFormatter={(v: number) => `${pct(v)} do vídeo`} formatter={(v: number) => [pct(v), 'ainda assistindo']} />
                          <Line type="monotone" dataKey="ret" stroke={COR} strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : <Vazio>Sem curva ainda.</Vazio>
                })()}
              </Card>
              <Card titulo="Retenção média por peça" sub="% médio assistido, quando a rede informa">
                {c.ult.some((l) => l.retencao_media_pct != null) ? (
                  <Barras dados={c.ult.filter((l) => l.retencao_media_pct != null).map((l) => ({ nome: `${REDE[l.rede] || l.rede} · ${l.tipo}`, valor: Number(l.retencao_media_pct) }))} rotulo="% assistido" />
                ) : <Vazio>O digiai_mkt devolve a retenção de cada corte junto com as views.</Vazio>}
              </Card>
            </div>
          )}

          {aba === 'funil' && (
            <Card titulo="Do corte ao episódio" sub="views dos cortes → pessoas que foram ao episódio → views do longo"
              rodape="Toda peça aponta para o principal (cartão final e 1ª linha da legenda). Nenhuma rede informa clique por post (digiai_mkt, 06/11): a chegada ao episódio vem do Analytics do canal principal (tráfego dos Shorts e de sites externos como Instagram e TikTok). Kwai e LinkedIn da empresa não têm API: os números deles só entram à mão.">
              <div className="grid gap-3 sm:grid-cols-3">
                <Kpi rotulo="Views dos cortes" valor={c.viewsPecas ? n(c.viewsPecas) : '—'} />
                <Kpi rotulo="Levados ao episódio" valor={c.cliques ? n(c.cliques) : '—'} sub={c.cliques && c.viewsPecas ? `${((c.cliques / c.viewsPecas) * 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} a cada mil views` : undefined} />
                <Kpi rotulo="Views do longo" valor={c.viewsLongo ? n(c.viewsLongo) : '—'} />
              </div>
              {(() => {
                const o = deOnde(c.longos, c.ult)
                return (
                  <div className="mt-5 grid gap-4 lg:grid-cols-2">
                    <div>
                      <h3 className="text-xs font-semibold text-(--pulso-text)">De onde vieram as views do episódio</h3>
                      {o.tipos.length ? <Barras dados={o.tipos} rotulo="views" /> : <div className="mt-2"><Vazio>O YouTube Analytics leva cerca de 48 h para mostrar as origens de um vídeo novo.</Vazio></div>}
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-(--pulso-text)">Quem trouxe</h3>
                      {o.quem.length ? <Barras dados={o.quem} rotulo="views" /> : <div className="mt-2"><Vazio>Ainda nenhum site ou corte trouxe gente ao episódio.</Vazio></div>}
                    </div>
                  </div>
                )
              })()}
            </Card>
          )}

          {aba === 'audiencia' && (
            <Card titulo="Seguidores dos canais" sub="última contagem por canal e rede"
              rodape="O Pulso lê os inscritos do YouTube quando o id do canal estiver na config; as outras redes chegam pelo digiai_mkt.">
              {c.seguidoresAtual.length ? (
                <ul className="divide-y divide-(--pulso-border) text-sm">
                  {c.seguidoresAtual.map((s) => (
                    <li key={`${s.canal}${s.rede}`} className="flex justify-between py-2">
                      <span className="text-(--pulso-text)">{CANAL[s.canal] || s.canal} · {REDE[s.rede] || s.rede}</span>
                      <span className="tabular-nums text-(--pulso-text)">{n(s.seguidores)} <span className="text-xs text-(--pulso-text-muted)">em {dia(s.data_ref)}</span></span>
                    </li>
                  ))}
                </ul>
              ) : <Vazio>Os canais do Bastidores DIGIAI ainda não existem.</Vazio>}
            </Card>
          )}

          {aba === 'crescimento' && (
            <div className="space-y-4">
              <Card titulo="Ganho de views por dia" sub="soma dos deltas de cada post (igual aos Curtos)">
                {c.serie.length > 1 ? <Serie dados={c.serie} campo="ganho" rotulo="views no dia" /> : <Vazio>Aparece a partir de duas leituras diárias.</Vazio>}
              </Card>
              <Card titulo="Horas de exibição acumuladas" sub="só o longo, a régua da monetização">
                {c.serieHoras.some((s) => s.acumulado > 0) ? <Serie dados={c.serieHoras} campo="acumulado" rotulo="horas" /> : <Vazio>Precisa do acesso ao Analytics do canal principal.</Vazio>}
              </Card>
            </div>
          )}

          {aba === 'ideias' && (
            <div className="space-y-4">
              <Card titulo="O que os números dizem" sub="regras fixas sobre o que foi medido; sem dado, não há palpite">
                {lista.length ? (
                  <ul className="space-y-3 text-sm">
                    {lista.map((i) => <li key={i.titulo}><b className="text-(--pulso-text)">{i.titulo}.</b> <span className="text-(--pulso-text-muted)">{i.texto}</span> <span className="text-xs text-(--pulso-text-muted)">({i.base})</span></li>)}
                  </ul>
                ) : <Vazio>As ideias por dado nascem com a primeira semana de leituras.</Vazio>}
              </Card>
              <Card titulo="Próximos episódios: assuntos aprovados sem episódio" sub={`${data.backlog.length} casos do Livro de Problemas e dos Bastidores ainda não viraram episódio`}
                rodape="A pauta sai daqui. O roteiro passa pela trava do segredo antes de qualquer gravação.">
                {data.backlog.length ? (
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {data.backlog.slice(0, 12).map((a) => (
                      <li key={a.slug} className="rounded-xl border border-(--pulso-border) bg-(--pulso-bg) px-3 py-2 text-sm">
                        <span className="text-(--pulso-text)">{a.titulo}</span>
                        <span className="block text-xs text-(--pulso-text-muted)">{a.tipo}{a.data ? ` · ${new Date(a.data).toLocaleDateString('pt-BR')}` : ''}</span>
                      </li>
                    ))}
                  </ul>
                ) : <Vazio>Sem assunto aprovado à espera.</Vazio>}
              </Card>
            </div>
          )}

          {aba === 'dados' && (
            <Card titulo="Saúde da coleta" sub="de onde vem cada número e quando foi a última leitura">
              <dl className="grid gap-3 sm:grid-cols-3">
                <Kpi rotulo="Última rodada da coleta" valor={data.ultimaColeta ? data.ultimaColeta.status : 'nunca rodou'}
                  sub={data.ultimaColeta ? new Date(data.ultimaColeta.criado).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : 'liga no pg_cron diário'} />
                <Kpi rotulo="Leituras do Pulso (YouTube)" valor={n(data.leituras.filter((l) => l.fonte === 'pulso').length)} />
                <Kpi rotulo="Leituras do digiai_mkt" valor={n(data.leituras.filter((l) => l.fonte === 'digiai_mkt').length)} />
              </dl>
              {(() => {
                const noAr = data.pecas.filter((p) => p.status === 'publicado')
                const lidas = new Set(c.pecasLidas.map((l) => l.peca_id))
                const sem = noAr.filter((p) => !lidas.has(p.id))
                return (
                  <p className="mt-3 text-xs text-(--pulso-text-muted)">
                    {noAr.length} peças no ar; {sem.length ? `${sem.length} ainda sem nenhuma leitura (${[...new Set(sem.map((p) => REDE[p.rede.split('_')[0]] || p.rede))].join(', ')})` : 'todas com leitura'}.
                    {data.ultimaColeta?.detalhes && Array.isArray(data.ultimaColeta.detalhes.falhas) && (data.ultimaColeta.detalhes.falhas as string[]).length > 0 && ` Falhas da última rodada: ${(data.ultimaColeta.detalhes.falhas as string[]).slice(0, 3).join('; ')}.`}
                  </p>
                )
              })()}
            </Card>
          )}
        </>
      )}
    </div>
  )
}
