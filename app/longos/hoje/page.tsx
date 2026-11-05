'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, CheckCircle2, Clock, Copy, Download, Loader2, Send, Smartphone, Zap } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { supabase } from '@/lib/supabase/client'
import { useUrlsAssinadas } from '@/lib/hooks/use-longos'

const CARTAO = 'rounded-2xl border border-(--pulso-border) bg-(--pulso-surface)'

interface Publicacao {
  id: string
  destino: string
  rede: string
  modo: 'auto' | 'rascunho' | 'manual' | 'job'
  agendado_para: string | null
  video: string | null
  legenda: string
  status: 'planejado' | 'publicado' | 'erro' | 'cancelado' | 'aguarda_conta'
  url: string | null
  episodio_cortes: { numero: number; titulo: string; video: string | null; episodios: { codigo: string; titulo: string } | null } | null
}

const REDE: Record<string, string> = {
  youtube: 'YouTube Shorts', instagram: 'Instagram Reels', facebook: 'Facebook Reels', tiktok: 'TikTok', kwai: 'Kwai',
  instagram_story: 'Story do Instagram', facebook_story: 'Story do Facebook', whatsapp_status: 'Status do WhatsApp', fila_mkt: 'Fila do digiai_mkt',
}
const DESTINO: Record<string, string> = { bastidores_digiai: 'Bastidores DIGIAI', digiai: 'DIGIAI', pessoal: 'Pessoal do dono' }
const MODO: Record<Publicacao['modo'], { rotulo: string; Icone: typeof Zap }> = {
  auto: { rotulo: 'sai sozinho', Icone: Zap },
  rascunho: { rotulo: 'chega no seu celular como rascunho', Icone: Smartphone },
  manual: { rotulo: 'você posta', Icone: Send },
  job: { rotulo: 'vai para a fila do digiai_mkt', Icone: Send },
}

const diaBrt = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })

function useAgenda() {
  return useQuery<Publicacao[]>({
    queryKey: ['longos-agenda'],
    queryFn: async () => {
      const ate = new Date(Date.now() + 8 * 864e5).toISOString()
      const { data, error } = await supabase.schema('pulso_content').from('corte_publicacoes')
        .select('id, destino, rede, modo, agendado_para, video, legenda, status, url, episodio_cortes(numero, titulo, video, episodios(codigo, titulo))')
        .lte('agendado_para', ate).neq('status', 'cancelado')
        .order('agendado_para').order('destino').order('rede')
      if (error) throw error
      return (data || []) as unknown as Publicacao[]
    },
  })
}

/** "Hoje" dos Longos (05/11/2026), igual ao dos Shorts: o que sai hoje, o atrasado e a semana. */
export default function HojeLongosPage() {
  const { data, isLoading, error } = useAgenda()
  const [agora] = useState(() => Date.now())
  const hoje = diaBrt(new Date(agora))
  const lista = data || []
  const urls = useUrlsAssinadas(lista.map((p) => p.video || p.episodio_cortes?.video))
  const deHoje = lista.filter((p) => p.agendado_para && diaBrt(new Date(p.agendado_para)) === hoje)
  const atrasadas = lista.filter((p) => p.agendado_para && diaBrt(new Date(p.agendado_para)) < hoje && p.status === 'planejado')
  const proximas = lista.filter((p) => p.agendado_para && diaBrt(new Date(p.agendado_para)) > hoje)
  const porDia = proximas.reduce<Record<string, Publicacao[]>>((acc, p) => {
    const k = diaBrt(new Date(p.agendado_para!)); (acc[k] ||= []).push(p); return acc
  }, {})

  return (
    <div className="space-y-5">
      <PageHeader titulo="Hoje nos Longos" subtitulo="Os cortes de cada episódio: o que sai hoje, onde, com qual arquivo e qual legenda" />
      {isLoading && <div className={`h-60 animate-pulse ${CARTAO}`} />}
      {error && <p className={`${CARTAO} p-6 text-sm text-(--pulso-danger)`}>Não deu para ler a agenda: {error.message}</p>}
      {data && lista.length === 0 && (
        <p className={`${CARTAO} p-6 text-sm text-(--pulso-text-muted)`}>
          Nada agendado. A agenda de um episódio nasce quando ele ganha data de estreia (<code>planejar_cortes.py</code>). <Link href="/longos" className="text-(--pulso-action) hover:underline">Ver episódios</Link>
        </p>
      )}

      {atrasadas.length > 0 && <Bloco titulo={`Atrasadas (${atrasadas.length})`} itens={atrasadas} urls={urls.data} alerta />}
      {data && <Bloco titulo={`Hoje, ${new Date(agora).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Sao_Paulo' })}`} itens={deHoje} urls={urls.data} vazio="Nada sai hoje." />}

      {Object.entries(porDia).map(([dia, itens]) => (
        <Bloco key={dia} titulo={new Date(`${dia}T12:00:00-03:00`).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })} itens={itens} urls={urls.data} compacto />
      ))}
    </div>
  )
}

function Bloco({ titulo, itens, urls, alerta, compacto, vazio }: { titulo: string; itens: Publicacao[]; urls?: Record<string, string>; alerta?: boolean; compacto?: boolean; vazio?: string }) {
  return (
    <section className={`${CARTAO} p-5`}>
      <h2 className={`mb-3 text-sm font-semibold capitalize ${alerta ? 'text-(--pulso-danger)' : 'text-(--pulso-text)'}`}>{titulo}</h2>
      {itens.length === 0 ? <p className="text-sm text-(--pulso-text-subtle)">{vazio}</p> : (
        <ul className="space-y-2">{itens.map((p) => <Linha key={p.id} p={p} url={urls?.[p.video || p.episodio_cortes?.video || '']} compacto={compacto} />)}</ul>
      )}
    </section>
  )
}

function Linha({ p, url, compacto }: { p: Publicacao; url?: string; compacto?: boolean }) {
  const qc = useQueryClient()
  const [aberto, setAberto] = useState(!compacto)
  const [copiado, setCopiado] = useState(false)
  const [link, setLink] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const M = MODO[p.modo]
  const c = p.episodio_cortes

  async function marcar() {
    setOcupado(true)
    await supabase.schema('pulso_content').from('corte_publicacoes')
      .update({ status: 'publicado', publicado_em: new Date().toISOString(), url: link.trim() || null, atualizado_em: new Date().toISOString() }).eq('id', p.id)
    setOcupado(false)
    await qc.invalidateQueries({ queryKey: ['longos-agenda'] })
  }

  return (
    <li className="rounded-xl bg-(--pulso-surface-raised) p-3">
      <button type="button" onClick={() => setAberto(!aberto)} className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 text-left">
        <span className="text-xs font-semibold text-(--pulso-text)">{REDE[p.rede] || p.rede}</span>
        <span className="text-[11px] text-(--pulso-text-muted)">{DESTINO[p.destino] || p.destino}</span>
        <span className="min-w-0 flex-1 truncate text-[11px] text-(--pulso-text-subtle)">{c?.episodios?.codigo} · corte {c?.numero} · {c?.titulo}</span>
        {p.agendado_para && <span className="inline-flex items-center gap-1 text-[11px] text-(--pulso-text-subtle)"><Clock className="h-3 w-3" />{new Date(p.agendado_para).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })}</span>}
        {p.status === 'publicado' ? <span className="inline-flex items-center gap-1 text-[11px] text-(--pulso-ok)"><CheckCircle2 className="h-3 w-3" /> publicado</span>
          : p.status === 'aguarda_conta' ? <span className="text-[11px] text-(--pulso-warn)">conta ainda não criada</span>
          : <span className="inline-flex items-center gap-1 text-[11px] text-(--pulso-text-muted)"><M.Icone className="h-3 w-3" /> {M.rotulo}</span>}
      </button>
      {aberto && (
        <div className="mt-3 space-y-2">
          {p.legenda && (
            <div className="rounded-lg bg-(--pulso-surface) p-2.5">
              <div className="mb-1 flex justify-end">
                <button type="button" onClick={async () => { await navigator.clipboard.writeText(p.legenda); setCopiado(true); setTimeout(() => setCopiado(false), 1800) }}
                  className="inline-flex items-center gap-1 text-[11px] text-(--pulso-action) hover:underline">
                  {copiado ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copiado ? 'copiado' : 'copiar legenda'}
                </button>
              </div>
              <p className="whitespace-pre-line text-xs text-(--pulso-text)">{p.legenda}</p>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2">
            {url && <a href={url} download className="inline-flex items-center gap-1.5 rounded-lg border border-(--pulso-border) px-3 py-1.5 text-xs text-(--pulso-text-muted) hover:text-(--pulso-text)"><Download className="h-3.5 w-3.5" /> baixar o vídeo</a>}
            {p.status === 'planejado' && (p.modo === 'manual' || p.modo === 'rascunho') && (
              <>
                <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="link do post (opcional)" aria-label="Link do post"
                  className="min-w-40 flex-1 rounded-lg border border-(--pulso-border) bg-(--pulso-surface) px-2.5 py-1.5 text-xs text-(--pulso-text) placeholder:text-(--pulso-text-subtle) focus:border-(--pulso-action) focus:outline-none" />
                <button type="button" disabled={ocupado} onClick={marcar}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-(--pulso-ok) px-3 py-1.5 text-xs font-medium text-(--pulso-on-action) disabled:opacity-50">
                  {ocupado ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />} Postei
                </button>
              </>
            )}
            {p.url && <a href={p.url} target="_blank" rel="noreferrer" className="text-xs text-(--pulso-action) hover:underline">ver o post</a>}
          </div>
        </div>
      )}
    </li>
  )
}
