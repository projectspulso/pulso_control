'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Check, Copy, Eye, Link2, Loader2, Lock, Send, Snowflake } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { KitMidiaView } from '@/components/kit-midia-view'
import { supabase } from '@/lib/supabase/client'
import { useEnviosKit, useKitAoVivo, type EnvioKit } from '@/lib/hooks/use-kit-midia'
import { Abas, Numero, Vazio } from '@/components/longos/ui'

const CARTAO = 'rounded-xl border border-(--pulso-border) bg-(--pulso-surface) shadow-sm'
const CAMPO = 'min-h-11 w-full rounded-lg border border-(--pulso-border) bg-(--pulso-surface-raised) px-3 py-2 text-sm text-(--pulso-text) placeholder:text-(--pulso-text-subtle) focus:border-(--pulso-action) focus:outline-none'
const quando = (iso: string) => new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })

/**
 * KIT DE MÍDIA (05/11/2026) — prévia com os números de agora; "Congelar" grava a foto num envio com
 * link secreto (migration 082). O link quem manda é o dono: o app não envia nada a ninguém.
 */
export default function KitMidiaPage() {
  const qc = useQueryClient()
  const { montar, pronto, isLoading, error } = useKitAoVivo()
  const envios = useEnviosKit()
  const [agora] = useState(() => Date.now())
  const [destinatario, setDestinatario] = useState('')
  const [nota, setNota] = useState('')
  const [dias, setDias] = useState(30)
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [aba, setAba] = useState<'previa' | 'novo' | 'envios'>('previa')

  const previa = pronto ? montar(agora) : null

  async function congelar() {
    const kit = montar(Date.now())
    if (!kit || !destinatario.trim()) return
    setOcupado(true); setErro(null)
    const { error: e } = await supabase.schema('pulso_analytics').from('kit_midia_envios').insert({
      destinatario: destinatario.trim(), nota: nota.trim(), dados: kit, medido_em: kit.medidoEm,
      expira_em: new Date(Date.now() + dias * 864e5).toISOString(),
    })
    setOcupado(false)
    if (e) { setErro(e.message); return }
    setDestinatario(''); setNota('')
    await qc.invalidateQueries({ queryKey: ['kit-envios'] })
    setAba('envios')
  }

  const lista = envios.data || []
  const ativos = lista.filter((e) => !e.revogado_em && new Date(e.expira_em).getTime() >= agora)

  return (
    <div className="space-y-5">
      <Link href="/analytics" className="inline-flex items-center gap-1.5 text-xs text-(--pulso-text-subtle) hover:text-(--pulso-text)">
        <ArrowLeft className="h-3.5 w-3.5" /> Analytics
      </Link>
      <PageHeader titulo="Kit de mídia" subtitulo="Os números do PULSO para patrocinador, por link secreto" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Numero icone={Link2} rotulo="Links ativos" valor={ativos.length} sub="abrem sem login" tom="vl" />
        <Numero icone={Eye} rotulo="Aberturas" valor={lista.reduce((s, e) => s + (e.acessos || 0), 0)} sub="somando todos os envios" tom="ok" />
        <Numero icone={Send} rotulo="Envios" valor={lista.length} sub="já congelados" />
        <Numero icone={Snowflake} rotulo="Prévia de" valor={previa ? new Date(previa.medidoEm).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '—'} sub="números de agora" />
      </div>

      <Abas<'previa' | 'novo' | 'envios'> ativa={aba} onChange={setAba} abas={[
        { id: 'previa', rotulo: 'Prévia', icone: Eye }, { id: 'novo', rotulo: 'Novo envio', icone: Snowflake },
        { id: 'envios', rotulo: 'Envios', icone: Send, n: lista.length },
      ]} />

      {aba === 'novo' && (
        <section className={`${CARTAO} space-y-3 p-5`}>
          <p className="text-xs text-(--pulso-text-subtle)">Os números ficam gravados como estão agora. Quem manda o link é você, e dá para cancelar depois.</p>
          <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
            <label className="space-y-1">
              <span className="text-[11px] uppercase tracking-wide text-(--pulso-text-subtle)">Para quem (só você vê)</span>
              <input value={destinatario} onChange={(e) => setDestinatario(e.target.value)} placeholder="nome da empresa" className={CAMPO} />
            </label>
            <label className="space-y-1">
              <span className="text-[11px] uppercase tracking-wide text-(--pulso-text-subtle)">Vale por</span>
              <select value={dias} onChange={(e) => setDias(Number(e.target.value))} className={CAMPO}>
                {[7, 15, 30, 60].map((d) => <option key={d} value={d}>{d} dias</option>)}
              </select>
            </label>
          </div>
          <label className="block space-y-1">
            <span className="text-[11px] uppercase tracking-wide text-(--pulso-text-subtle)">Recado no topo (o patrocinador vê)</span>
            <textarea value={nota} onChange={(e) => setNota(e.target.value)} rows={3} placeholder="ex.: proposta de formatos e valores para conversarmos" className={CAMPO} />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={congelar} disabled={ocupado || !pronto || !destinatario.trim()}
              className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-lg bg-(--pulso-action) px-4 text-sm font-medium text-(--pulso-on-action) disabled:opacity-50">
              {ocupado ? <Loader2 className="h-4 w-4 animate-spin" /> : <Snowflake className="h-4 w-4" />} Congelar e gerar link
            </button>
            {erro && <span className="text-xs text-(--pulso-danger)">Não gravou: {erro}</span>}
          </div>
        </section>
      )}

      {aba === 'envios' && (envios.isLoading ? <div className={`h-24 animate-pulse ${CARTAO}`} /> : lista.length ? <Envios lista={lista} carregando={false} /> : <Vazio>Nenhum envio ainda. Crie o primeiro na aba Novo envio.</Vazio>)}

      {(aba === 'previa' || aba === 'novo') && (
        <section className="space-y-2">
          <p className="flex items-center gap-1.5 text-[11px] text-(--pulso-text-subtle)"><Lock className="h-3.5 w-3.5" /> É assim que o patrocinador vê. Tema por rede e receita nunca entram.</p>
          {isLoading && <div className={`h-96 animate-pulse ${CARTAO}`} />}
          {error && <p className={`${CARTAO} p-6 text-sm text-(--pulso-danger)`}>Não deu para montar o kit: {error instanceof Error ? error.message : 'erro'}</p>}
          {previa && <div className="rounded-2xl border border-dashed border-(--pulso-border) p-3 sm:p-5"><KitMidiaView kit={previa} nota={nota} /></div>}
        </section>
      )}
    </div>
  )
}

function Envios({ lista, carregando }: { lista?: EnvioKit[]; carregando: boolean }) {
  if (carregando) return <div className={`h-24 animate-pulse ${CARTAO}`} />
  if (!lista?.length) return null
  return (
    <section className={`${CARTAO} overflow-hidden`}>
      <ul className="divide-y divide-(--pulso-border)">
        {lista.map((e) => <LinhaEnvio key={e.id} e={e} />)}
      </ul>
    </section>
  )
}

function LinhaEnvio({ e }: { e: EnvioKit }) {
  const qc = useQueryClient()
  const [copiado, setCopiado] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const [agora] = useState(() => Date.now())
  const vencido = new Date(e.expira_em).getTime() < agora
  const ativo = !e.revogado_em && !vencido
  const link = typeof window === 'undefined' ? `/kit/${e.token}` : `${window.location.origin}/kit/${e.token}`

  async function copiar() {
    await navigator.clipboard.writeText(link)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  async function cancelar() {
    setOcupado(true)
    await supabase.schema('pulso_analytics').from('kit_midia_envios').update({ revogado_em: new Date().toISOString() }).eq('id', e.id)
    setOcupado(false)
    await qc.invalidateQueries({ queryKey: ['kit-envios'] })
  }

  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3 text-sm">
      <div className="min-w-0 flex-1">
        <p className="text-(--pulso-text)">{e.destinatario}</p>
        <p className="text-[11px] text-(--pulso-text-subtle)">
          números de {quando(e.medido_em)} · {e.acessos === 0 ? 'ainda não aberto' : `aberto ${e.acessos}× (último ${quando(e.ultimo_acesso!)})`}
          {' · '}{e.revogado_em ? `cancelado em ${quando(e.revogado_em)}` : vencido ? 'vencido' : `vale até ${quando(e.expira_em)}`}
        </p>
      </div>
      {ativo && (
        <>
          <a href={link} target="_blank" rel="noreferrer" className="text-xs text-(--pulso-action) hover:underline" title="abrir também conta como acesso">abrir</a>
          <button type="button" onClick={copiar} className="inline-flex items-center gap-1 rounded-lg border border-(--pulso-border) px-2.5 py-1 text-xs text-(--pulso-text-muted) hover:text-(--pulso-text)">
            {copiado ? <Check className="h-3.5 w-3.5 text-(--pulso-ok)" /> : <Copy className="h-3.5 w-3.5" />} {copiado ? 'copiado' : 'copiar link'}
          </button>
          <button type="button" onClick={cancelar} disabled={ocupado} className="text-xs text-(--pulso-text-subtle) hover:text-(--pulso-danger) disabled:opacity-50">cancelar link</button>
        </>
      )}
    </li>
  )
}
