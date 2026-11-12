'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, CalendarClock, CalendarDays, Check, CheckCircle2, Copy, Download, ExternalLink, Hand, Loader2, Power, Sun, X } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { supabase } from '@/lib/supabase/client'
import { useUrlsAssinadas } from '@/lib/hooks/use-longos'
import { useUsuario } from '@/lib/hooks/use-usuario'
import { Abas, CANAIS, CARTAO, estadoDaPeca, Legenda, Numero, ORDEM_CANAIS, REDES, redeBase, Vazio } from '@/components/longos/ui'

interface Publicacao {
  id: string
  destino: string
  rede: string
  modo: 'auto' | 'rascunho' | 'manual' | 'job'
  agendado_para: string | null
  video: string | null
  legenda: string
  status: 'planejado' | 'agendado' | 'publicado' | 'erro' | 'cancelado' | 'aguarda_conta'
  url: string | null
  erro: string | null
  episodio_cortes: { numero: number; titulo: string; video: string | null; episodios: { codigo: string; titulo: string } | null } | null
}

const diaBrt = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
const hora = (iso: string) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })
const somaDias = (d: string, n: number) => diaBrt(new Date(new Date(`${d}T12:00:00-03:00`).getTime() + n * 864e5))
const rotuloDia = (d: string, op: Intl.DateTimeFormatOptions) => new Date(`${d}T12:00:00-03:00`).toLocaleDateString('pt-BR', op)
const doCanal = (p: Publicacao, canal: string) => p.destino === canal || (canal === 'bastidores' && p.destino === 'bastidores_cortes')

function useAgenda() {
  return useQuery<Publicacao[]>({
    queryKey: ['longos-agenda'],
    queryFn: async () => {
      const de = new Date(Date.now() - 14 * 864e5).toISOString()
      const ate = new Date(Date.now() + 22 * 864e5).toISOString()
      const { data, error } = await supabase.schema('pulso_content').from('corte_publicacoes')
        .select('id, destino, rede, modo, agendado_para, video, legenda, status, url, erro, episodio_cortes(numero, titulo, video, episodios(codigo, titulo))')
        .gte('agendado_para', de).lte('agendado_para', ate).neq('status', 'cancelado')
        .order('agendado_para').order('destino').order('rede')
      if (error) throw error
      return (data || []) as unknown as Publicacao[]
    },
  })
}

type Aba = 'semana' | 'hoje' | 'atencao'

/** Agenda dos Longos (redesenho de 12/11/2026): calendário canal × dia, hoje e o que pede atenção. */
export default function AgendaLongosPage() {
  const { data, isLoading, error } = useAgenda()
  const [agora] = useState(() => Date.now())
  const hoje = diaBrt(new Date(agora))
  const [aba, setAba] = useState<Aba>('semana')
  const [inicio, setInicio] = useState(hoje)
  const [aberta, setAberta] = useState<string | null>(null)
  const lista = useMemo(() => data || [], [data])
  const urls = useUrlsAssinadas(lista.map((p) => p.video || p.episodio_cortes?.video))

  const dia = (p: Publicacao) => (p.agendado_para ? diaBrt(new Date(p.agendado_para)) : '')
  const deHoje = lista.filter((p) => dia(p) === hoje)
  const atencao = lista.filter((p) => p.status === 'erro' || (p.status === 'planejado' && p.modo !== 'job' && (dia(p) < hoje || (dia(p) === hoje && p.modo === 'manual'))))
  const atrasadasMkt = lista.filter((p) => p.status === 'planejado' && dia(p) < hoje && p.modo === 'job').length
  const noAr7 = lista.filter((p) => p.status === 'publicado' && dia(p) >= somaDias(hoje, -7)).length
  const selecionada = lista.find((p) => p.id === aberta) || null

  return (
    <div className="space-y-5">
      <PageHeader titulo="Agenda dos cortes" subtitulo="O que sai, em qual canal e em qual rede" />

      {isLoading && <div className={`h-60 animate-pulse ${CARTAO}`} />}
      {error && <p className={`${CARTAO} p-6 text-sm text-(--pulso-danger)`}>Não deu para ler a agenda: {error.message}</p>}

      {data && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Numero icone={Sun} rotulo="Saem hoje" valor={deHoje.length} sub={`${deHoje.filter((p) => p.status === 'publicado').length} já no ar`} tom="vl" />
            <Numero icone={Hand} rotulo="Você posta" valor={lista.filter((p) => p.modo === 'manual' && p.status === 'planejado' && dia(p) <= hoje).length} sub="TikTok, até o app ser aprovado" tom="alerta" />
            <Numero icone={CalendarClock} rotulo="Agendados na Meta" valor={lista.filter((p) => p.status === 'agendado').length} sub="Facebook, travados" tom="ok" />
            <Numero icone={CheckCircle2} rotulo="No ar em 7 dias" valor={noAr7} sub={atrasadasMkt ? `${atrasadasMkt} do MKT atrasados` : 'todos os canais'} tom={atrasadasMkt ? 'alerta' : 'ok'} />
          </div>

          <PainelAutomatico />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Abas<Aba> ativa={aba} onChange={setAba} abas={[
              { id: 'semana', rotulo: 'Semana', icone: CalendarDays },
              { id: 'hoje', rotulo: 'Hoje', icone: Sun, n: deHoje.length },
              { id: 'atencao', rotulo: 'Atenção', icone: AlertTriangle, n: atencao.length },
            ]} />
            <Legenda />
          </div>

          {aba === 'semana' && <Semana lista={lista} inicio={inicio} hoje={hoje} setInicio={setInicio} aberta={aberta} abrir={setAberta} dia={dia} />}
          {aba === 'hoje' && <Lista itens={deHoje} vazio="Nada sai hoje." abrir={setAberta} aberta={aberta} />}
          {aba === 'atencao' && <Lista itens={atencao} vazio="Nada pedindo atenção." abrir={setAberta} aberta={aberta} mostraDia />}

          {selecionada && <Detalhe p={selecionada} url={urls.data?.[selecionada.video || selecionada.episodio_cortes?.video || '']} fechar={() => setAberta(null)} />}

          {lista.length === 0 && (
            <Vazio>Nada na agenda. Ela nasce quando um episódio ganha data de estreia. <Link href="/longos" className="ml-1 text-(--pulso-action) hover:underline">Ver episódios</Link></Vazio>
          )}
        </>
      )}
    </div>
  )
}

const BOTAO_NAV = 'min-h-11 cursor-pointer rounded-lg border border-(--pulso-border) px-3 text-xs text-(--pulso-text-muted) hover:text-(--pulso-text)'

function Semana({ lista, inicio, hoje, setInicio, aberta, abrir, dia }: {
  lista: Publicacao[]; inicio: string; hoje: string; setInicio: (d: string) => void; aberta: string | null; abrir: (id: string | null) => void; dia: (p: Publicacao) => string
}) {
  const dias = Array.from({ length: 7 }, (_, i) => somaDias(inicio, i))
  const canais = ORDEM_CANAIS.filter((c) => lista.some((p) => doCanal(p, c)))
  const celula = (canal: string, d: string) => {
    const porCorte = new Map<number, Publicacao[]>()
    for (const p of lista.filter((x) => dia(x) === d && doCanal(x, canal))) {
      const n = p.episodio_cortes?.numero ?? 0
      porCorte.set(n, [...(porCorte.get(n) || []), p])
    }
    return [...porCorte.entries()].sort((a, b) => a[0] - b[0])
  }
  return (
    <section className={`${CARTAO} p-4`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <button type="button" onClick={() => setInicio(somaDias(inicio, -7))} className={BOTAO_NAV}>← anterior</button>
        <span className="text-sm font-semibold text-(--pulso-text)">{rotuloDia(dias[0], { day: '2-digit', month: 'short' })} a {rotuloDia(dias[6], { day: '2-digit', month: 'short' })}</span>
        <div className="flex gap-2">
          {inicio !== hoje && <button type="button" onClick={() => setInicio(hoje)} className={BOTAO_NAV}>hoje</button>}
          <button type="button" onClick={() => setInicio(somaDias(inicio, 7))} className={BOTAO_NAV}>próxima →</button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] table-fixed border-separate border-spacing-1">
          <thead>
            <tr>
              <th className="w-28 text-left text-[11px] font-medium text-(--pulso-text-subtle)">Canal</th>
              {dias.map((d) => (
                <th key={d} className={`rounded-lg px-1 py-1.5 text-center text-[11px] font-medium capitalize ${d === hoje ? 'bg-(--pulso-vl)/15 text-(--pulso-vl)' : 'text-(--pulso-text-muted)'}`}>
                  {rotuloDia(d, { weekday: 'short' })} <span className="tabular-nums">{rotuloDia(d, { day: '2-digit' })}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {canais.map((c) => (
              <tr key={c}>
                <th className="pr-2 text-left align-top text-xs font-semibold text-(--pulso-text)">{CANAIS[c]?.curto || c}</th>
                {dias.map((d) => (
                  <td key={d} className={`h-20 rounded-lg p-1.5 align-top ${d === hoje ? 'bg-(--pulso-vl)/5' : 'bg-(--pulso-surface-raised)'}`}>
                    <div className="space-y-1.5">
                      {celula(c, d).map(([n, pecas]) => (
                        <div key={n} className="rounded-md bg-(--pulso-surface) p-1.5">
                          <p className="truncate text-[11px] text-(--pulso-text)" title={pecas[0].episodio_cortes?.titulo}>
                            <span className="font-semibold">C{n}</span>{' '}
                            {pecas[0].agendado_para && <span className="tabular-nums text-(--pulso-text-subtle)">{hora(pecas[0].agendado_para)}</span>}
                          </p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {pecas.map((p) => {
                              const e = estadoDaPeca(p)
                              const R = REDES[redeBase(p.rede)]
                              const Ic = R?.Icone || e.Icone
                              const nome = `${R?.nome || p.rede}${p.rede.includes('story') ? ' (story)' : ''}`
                              return (
                                <button key={p.id} type="button" onClick={() => abrir(aberta === p.id ? null : p.id)} aria-label={`${nome}: ${e.rotulo}`} title={`${nome} · ${e.rotulo}`}
                                  className={`inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border ${e.classe} ${aberta === p.id ? 'ring-2 ring-(--pulso-vl)' : ''} ${p.rede.includes('story') ? 'border-dashed' : ''}`}>
                                  <Ic className="h-3.5 w-3.5" aria-hidden />
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[11px] text-(--pulso-text-subtle)">Cada bloco é um corte (C1, C2…) com as redes em que sai. Toque num ícone para ver o vídeo, a legenda e o que fazer. Borda tracejada = story.</p>
    </section>
  )
}

function Lista({ itens, vazio, abrir, aberta, mostraDia }: { itens: Publicacao[]; vazio: string; abrir: (id: string | null) => void; aberta: string | null; mostraDia?: boolean }) {
  if (!itens.length) return <Vazio>{vazio}</Vazio>
  return (
    <ul className={`${CARTAO} divide-y divide-(--pulso-border)`}>
      {itens.map((p) => {
        const e = estadoDaPeca(p)
        const R = REDES[redeBase(p.rede)]
        const Ic = R?.Icone || e.Icone
        return (
          <li key={p.id}>
            <button type="button" onClick={() => abrir(aberta === p.id ? null : p.id)} className="flex min-h-12 w-full cursor-pointer items-center gap-3 px-4 py-2 text-left hover:bg-(--pulso-surface-raised)">
              <Ic className="h-4 w-4 shrink-0 text-(--pulso-text-muted)" aria-label={R?.nome || p.rede} />
              <span className="w-24 shrink-0 truncate text-xs text-(--pulso-text-muted)">{CANAIS[p.destino]?.curto || p.destino}</span>
              <span className="min-w-0 flex-1 truncate text-sm text-(--pulso-text)">C{p.episodio_cortes?.numero} · {p.episodio_cortes?.titulo}</span>
              {p.agendado_para && <span className="shrink-0 text-xs tabular-nums text-(--pulso-text-subtle)">{mostraDia ? `${rotuloDia(diaBrt(new Date(p.agendado_para)), { day: '2-digit', month: '2-digit' })} ` : ''}{hora(p.agendado_para)}</span>}
              <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] ${e.classe}`}><e.Icone className="h-3 w-3" aria-hidden />{e.rotulo}</span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

function Detalhe({ p, url, fechar }: { p: Publicacao; url?: string; fechar: () => void }) {
  const qc = useQueryClient()
  const [copiado, setCopiado] = useState(false)
  const [link, setLink] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const e = estadoDaPeca(p)
  const R = REDES[redeBase(p.rede)]

  async function marcar() {
    setOcupado(true)
    await supabase.schema('pulso_content').from('corte_publicacoes')
      .update({ status: 'publicado', publicado_em: new Date().toISOString(), url: link.trim() || null, atualizado_em: new Date().toISOString() }).eq('id', p.id)
    setOcupado(false)
    await qc.invalidateQueries({ queryKey: ['longos-agenda'] })
  }

  return (
    <section className={`${CARTAO} p-4`} aria-label="Detalhe da peça">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-(--pulso-text)">{p.episodio_cortes?.episodios?.codigo} · C{p.episodio_cortes?.numero}: {p.episodio_cortes?.titulo}</p>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-(--pulso-text-muted)">
            <span>{CANAIS[p.destino]?.nome || p.destino}</span><span aria-hidden>·</span>
            <span>{R?.nome || p.rede}{p.rede.includes('story') ? ' (story)' : ''}</span>
            {p.agendado_para && <><span aria-hidden>·</span><span className="tabular-nums">{new Date(p.agendado_para).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' })}</span></>}
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] ${e.classe}`}><e.Icone className="h-3 w-3" aria-hidden />{e.rotulo}</span>
          </p>
        </div>
        <button type="button" onClick={fechar} aria-label="Fechar" className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg text-(--pulso-text-muted) hover:text-(--pulso-text)"><X className="h-4 w-4" /></button>
      </div>
      {p.status === 'erro' && p.erro && <p className="mt-3 rounded-lg bg-(--pulso-danger)/10 p-2.5 text-xs text-(--pulso-danger)">{p.erro}</p>}
      <div className="mt-3 grid gap-3 md:grid-cols-[180px_1fr]">
        {url ? <video src={url} controls preload="metadata" className="aspect-[9/16] w-full rounded-lg bg-black object-cover" /> : <div className="aspect-[9/16] rounded-lg bg-(--pulso-surface-raised)" />}
        <div className="space-y-3">
          {p.legenda && (
            <div className="rounded-lg bg-(--pulso-surface-raised) p-3">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wide text-(--pulso-text-subtle)">Legenda</span>
                <button type="button" onClick={async () => { await navigator.clipboard.writeText(p.legenda); setCopiado(true); setTimeout(() => setCopiado(false), 1800) }}
                  className="inline-flex min-h-8 cursor-pointer items-center gap-1 text-[11px] text-(--pulso-action) hover:underline">
                  {copiado ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copiado ? 'copiado' : 'copiar'}
                </button>
              </div>
              <p className="whitespace-pre-line text-xs text-(--pulso-text)">{p.legenda}</p>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2">
            {url && <a href={url} download className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-(--pulso-border) px-3 text-xs text-(--pulso-text-muted) hover:text-(--pulso-text)"><Download className="h-3.5 w-3.5" /> baixar o vídeo</a>}
            {p.url && <a href={p.url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-(--pulso-border) px-3 text-xs text-(--pulso-action)"><ExternalLink className="h-3.5 w-3.5" /> ver o post</a>}
          </div>
          {p.status === 'planejado' && (p.modo === 'manual' || p.modo === 'rascunho') && (
            <div className="flex flex-wrap items-end gap-2">
              <label className="min-w-48 flex-1 text-[11px] text-(--pulso-text-muted)">Link do post (opcional)
                <input value={link} onChange={(ev) => setLink(ev.target.value)} type="url"
                  className="mt-1 block min-h-11 w-full rounded-lg border border-(--pulso-border) bg-(--pulso-surface) px-2.5 text-sm text-(--pulso-text) focus:border-(--pulso-action) focus:outline-none" />
              </label>
              <button type="button" disabled={ocupado} onClick={marcar}
                className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-lg bg-(--pulso-ok) px-4 text-xs font-medium text-(--pulso-on-action) disabled:opacity-50">
                {ocupado ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />} Postei
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

// liga/desliga da publicação dos canais do PULSO e se cada canal tem conta e acesso (só o admin troca)
const CANAIS_PULSO = [
  { id: 'pulso_cortes', yt: 'youtube_oauth:cortes', tt: 'tiktok_oauth:cortes' },
  { id: 'pulso_bastidores', yt: 'youtube_oauth:bastidores', tt: 'tiktok_oauth:bastidores' },
]

function usePainel() {
  return useQuery({
    queryKey: ['longos-painel-auto'],
    queryFn: async () => {
      const cfg = () => supabase.schema('pulso_core').from('configuracoes')
      const [gate, destinos, chaves] = await Promise.all([
        cfg().select('valor').eq('chave', 'cortes_pulso').maybeSingle(),
        cfg().select('valor').eq('chave', 'cortes_destinos').maybeSingle(),
        cfg().select('chave').or('chave.like.youtube_oauth:%,chave.like.tiktok_oauth:%'),
      ])
      const ler = (v: unknown) => { try { return typeof v === 'string' ? JSON.parse(v) : v } catch { return null } }
      const lista = (ler(destinos.data?.valor)?.destinos || []) as Array<{ id: string; instagram_id?: string; facebook_page_id?: string }>
      return {
        ligado: ler(gate.data?.valor)?.publicar === true,
        destinos: Object.fromEntries(lista.map((d) => [d.id, d])) as Record<string, { instagram_id?: string; facebook_page_id?: string }>,
        tokens: new Set(((chaves.data || []) as Array<{ chave: string }>).map((c) => c.chave)),
      }
    },
  })
}

function PainelAutomatico() {
  const qc = useQueryClient()
  const { papel } = useUsuario()
  const { data } = usePainel()
  const [ocupado, setOcupado] = useState(false)
  if (!data) return null

  async function alternar() {
    if (!data) return
    setOcupado(true)
    await supabase.schema('pulso_core').from('configuracoes')
      .update({ valor: JSON.stringify({ publicar: !data.ligado, mudado_em: new Date().toISOString(), mudado_por: 'app (Agenda dos cortes)' }) })
      .eq('chave', 'cortes_pulso')
    setOcupado(false)
    await qc.invalidateQueries({ queryKey: ['longos-painel-auto'] })
  }

  return (
    <section className={`${CARTAO} flex flex-wrap items-center gap-x-8 gap-y-3 p-4`}>
      <div className="flex items-center gap-3">
        <span className={`rounded-lg p-2 ${data.ligado ? 'bg-(--pulso-ok)/10 text-(--pulso-ok)' : 'bg-(--pulso-warn)/10 text-(--pulso-warn)'}`}><Power className="h-4 w-4" aria-hidden /></span>
        <div>
          <p className="text-sm font-semibold text-(--pulso-text)">Automático {data.ligado ? 'ligado' : 'desligado'}</p>
          <p className="text-[11px] text-(--pulso-text-subtle)">canais do PULSO</p>
        </div>
        {papel === 'admin' && (
          <button type="button" disabled={ocupado} onClick={alternar}
            className={`inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-lg px-3 text-xs font-medium disabled:opacity-50 ${data.ligado ? 'border border-(--pulso-border) text-(--pulso-text-muted)' : 'bg-(--pulso-ok) text-(--pulso-on-action)'}`}>
            {ocupado ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Power className="h-3.5 w-3.5" />} {data.ligado ? 'Desligar' : 'Ligar'}
          </button>
        )}
      </div>
      {CANAIS_PULSO.map((c) => {
        const d = data.destinos[c.id]
        const redes = [
          { r: 'youtube', ok: data.tokens.has(c.yt) }, { r: 'instagram', ok: !!d?.instagram_id },
          { r: 'facebook', ok: !!d?.facebook_page_id }, { r: 'tiktok', ok: data.tokens.has(c.tt) },
        ]
        return (
          <div key={c.id} className="flex items-center gap-2">
            <span className="text-xs font-medium text-(--pulso-text)">{CANAIS[c.id].curto}</span>
            {redes.map(({ r, ok }) => {
              const R = REDES[r]
              const txt = `${R.nome}: ${ok ? 'ligado' : r === 'tiktok' ? 'você posta (app em revisão)' : 'sem acesso'}`
              return (
                <span key={r} title={txt} aria-label={txt}
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-md border ${ok ? 'border-(--pulso-ok)/30 bg-(--pulso-ok)/10 text-(--pulso-ok)' : 'border-(--pulso-warn)/30 bg-(--pulso-warn)/10 text-(--pulso-warn)'}`}>
                  <R.Icone className="h-3.5 w-3.5" aria-hidden />
                </span>
              )
            })}
          </div>
        )
      })}
    </section>
  )
}
