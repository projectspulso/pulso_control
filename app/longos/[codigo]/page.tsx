'use client'

import { use, useState, type ReactNode } from 'react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, BookOpen, Calendar, Check, CheckCircle2, ChevronDown, Clapperboard, Copy, Download, Film, Loader2, Lock, Mic,
  Scissors, Send, ShieldCheck, Video, BarChart3, Image as ImagemIcone, TriangleAlert,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useCortes, useEpisodio, useUrlsAssinadas, type Corte, type Episodio } from '@/lib/hooks/use-longos'

const CARTAO = 'rounded-2xl border border-(--pulso-border) bg-(--pulso-surface)'
const minseg = (s?: number) => (s == null ? '—' : `${Math.floor(s / 60)} min ${String(Math.round(s % 60)).padStart(2, '0')} s`)

function texto(n: ReactNode): string {
  if (typeof n === 'string' || typeof n === 'number') return String(n)
  if (Array.isArray(n)) return n.map(texto).join('')
  if (n && typeof n === 'object' && 'props' in n) return texto((n as { props: { children?: ReactNode } }).props.children)
  return ''
}

// cada marcação do roteiro ganha cara própria: quem lê distingue fala, tela, avatar, você e corte
function Paragrafo({ children }: { children?: ReactNode }) {
  const t = texto(children).trim()
  if (t.startsWith('✂')) {
    const fim = t.startsWith('✂ fim')
    return (
      <p className={`my-3 flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium ${fim ? 'text-(--pulso-text-subtle)' : 'bg-(--pulso-action)/12 text-(--pulso-action)'}`}>
        <Scissors className="h-3.5 w-3.5 shrink-0" /> <span>{fim ? 'fim do corte' : children}</span>
      </p>
    )
  }
  if (t.startsWith('[VOCÊ]')) {
    return (
      <p className="my-2 flex gap-2 rounded-lg border border-dashed border-(--pulso-warn)/50 px-3 py-1.5 text-xs text-(--pulso-warn)">
        <Video className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>{children}</span>
      </p>
    )
  }
  if (/^\[(VINHETA|ENCERRAMENTO)\]/.test(t)) return <p className="my-3 rounded-lg bg-(--pulso-surface-raised) px-3 py-2 text-xs text-(--pulso-text-muted)">{children}</p>
  if (/^\[(TELA|AVATAR|CARTELA)\]/.test(t)) return <p className="my-2 text-xs text-(--pulso-text-subtle)">{children}</p>
  return <p className="mb-3 text-sm leading-relaxed text-(--pulso-text-muted)">{children}</p>
}

const MD = {
  h1: () => null,
  h2: (p: React.ComponentProps<'h2'>) => <h2 className="mb-2 mt-8 border-t border-(--pulso-border) pt-5 text-sm font-semibold uppercase tracking-wide text-(--pulso-text)" {...p} />,
  p: Paragrafo,
  blockquote: (p: React.ComponentProps<'blockquote'>) => <blockquote className="my-2 border-l-2 border-(--pulso-action) pl-4 [&_p]:mb-1.5 [&_p]:text-[15px] [&_p]:text-(--pulso-text)" {...p} />,
  ul: (p: React.ComponentProps<'ul'>) => <ul className="mb-3 list-disc space-y-1 pl-5 text-sm text-(--pulso-text-muted)" {...p} />,
  ol: (p: React.ComponentProps<'ol'>) => <ol className="mb-3 list-decimal space-y-1.5 pl-5 text-sm text-(--pulso-text-muted)" {...p} />,
  strong: (p: React.ComponentProps<'strong'>) => <strong className="font-semibold text-(--pulso-text)" {...p} />,
  code: (p: React.ComponentProps<'code'>) => <code className="rounded bg-(--pulso-surface-raised) px-1 py-0.5 text-xs text-(--pulso-text)" {...p} />,
  hr: () => null,
}

const ETAPAS: { status: string; rotulo: string }[] = [
  { status: 'planejado', rotulo: 'Pauta' },
  { status: 'roteiro_ok', rotulo: 'Roteiro aprovado' },
  { status: 'em_revisao', rotulo: 'Montado, em revisão' },
  { status: 'pronto_publicacao', rotulo: 'Pronto para publicar' },
  { status: 'publicado', rotulo: 'Publicado' },
]
const ORDEM: Record<string, number> = { planejado: 0, roteiro_ok: 1, narracao_gerada: 1, capturas_coletadas: 1, montado: 2, em_revisao: 2, pronto_publicacao: 3, publicado: 4 }

function Secao({ icone, titulo, acao, children }: { icone: ReactNode; titulo: string; acao?: ReactNode; children: ReactNode }) {
  return (
    <section className={`${CARTAO} p-5`}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-(--pulso-text)"><span className="text-(--pulso-action)">{icone}</span>{titulo}</h2>
        {acao}
      </div>
      {children}
    </section>
  )
}

function Vazio({ children }: { children: ReactNode }) {
  return <p className="text-sm text-(--pulso-text-subtle)">{children}</p>
}

function Trilha({ status }: { status: string }) {
  const atual = ORDEM[status] ?? 0
  return (
    <ol className="mt-4 grid grid-cols-5 gap-1.5" aria-label="Etapas do episódio">
      {ETAPAS.map((e, i) => (
        <li key={e.status} className="space-y-1.5">
          <div className={`h-1.5 rounded-full ${i <= atual ? 'bg-(--pulso-action)' : 'bg-(--pulso-surface-raised)'}`} />
          <p className={`text-[11px] ${i === atual ? 'font-semibold text-(--pulso-text)' : 'text-(--pulso-text-subtle)'}`}>{e.rotulo}</p>
        </li>
      ))}
    </ol>
  )
}

/** Ficha completa do episódio dos Longos (05/11/2026), no padrão da ficha única dos Shorts (/video/[id]). */
export default function EpisodioPage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = use(params)
  const { data: e, isLoading, error } = useEpisodio(codigo)
  const cortes = useCortes(e?.id)
  const m = e?.metadata || {}
  const urls = useUrlsAssinadas([m.montagem?.video, m.montagem?.legenda, m.montagem?.capa, ...(m.montagem?.capas || []), ...(cortes.data || []).map((c) => c.video)])
  const qc = useQueryClient()
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function mudar(campos: Partial<Episodio>) {
    setOcupado(true); setErro(null)
    const { error: x } = await supabase.schema('pulso_content').from('episodios')
      .update({ ...campos, updated_at: new Date().toISOString() }).eq('codigo', codigo)
    setOcupado(false)
    if (x) { setErro(x.message); return }
    await qc.invalidateQueries({ queryKey: ['longos-episodio', codigo] })
    await qc.invalidateQueries({ queryKey: ['longos-episodios'] })
  }

  if (isLoading) return <div className={`h-[600px] animate-pulse ${CARTAO}`} />
  if (error) return <p className={`${CARTAO} p-6 text-sm text-(--pulso-danger)`}>Não deu para ler o episódio: {error.message}</p>
  if (!e) return <p className={`${CARTAO} p-6 text-sm text-(--pulso-text-muted)`}>Episódio não encontrado. <Link href="/longos" className="text-(--pulso-action) hover:underline">Voltar</Link></p>

  const md = e.roteiro_md || ''
  const nCortes = (md.match(/✂ \*\*CORTE \d+/g) || []).length
  const botao = 'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-50'

  return (
    <article className="mx-auto max-w-4xl space-y-4">
      <Link href="/longos" className="inline-flex items-center gap-1.5 text-xs text-(--pulso-text-subtle) hover:text-(--pulso-text)">
        <ArrowLeft className="h-3.5 w-3.5" /> Episódios
      </Link>

      <header className={`${CARTAO} p-6`}>
        <p className="font-mono text-xs text-(--pulso-text-subtle)">{e.codigo}</p>
        <h1 className="mt-1 text-2xl font-bold text-(--pulso-text)">{e.titulo}</h1>
        {e.gancho && <p className="mt-2 text-sm italic text-(--pulso-text-muted)">“{e.gancho}”</p>}
        <Trilha status={e.status} />
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {e.status === 'planejado' && (
            <button type="button" disabled={ocupado || !md} onClick={() => mudar({ status: 'roteiro_ok' })} className={`${botao} bg-(--pulso-ok) text-(--pulso-on-action)`}>
              {ocupado ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />} Aprovar roteiro
            </button>
          )}
          {e.status === 'em_revisao' && (
            <button type="button" disabled={ocupado} onClick={() => mudar({ status: 'pronto_publicacao' })} className={`${botao} bg-(--pulso-ok) text-(--pulso-on-action)`}>
              {ocupado ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />} Aprovar a montagem
            </button>
          )}
          {e.status === 'pronto_publicacao' && (
            <button type="button" disabled={ocupado} onClick={() => mudar({ status: 'em_revisao' })} className={`${botao} border border-(--pulso-border) text-(--pulso-text-muted)`}>
              Voltar para revisão
            </button>
          )}
          {erro && <span className="text-xs text-(--pulso-danger)">Não salvou: {erro}</span>}
        </div>
      </header>

      <Secao icone={<Film className="h-4 w-4" />} titulo="O episódio"
        acao={m.montagem?.legenda && urls.data?.[m.montagem.legenda] ? (
          <a href={urls.data[m.montagem.legenda]} download="legenda.srt" className="inline-flex items-center gap-1 text-xs text-(--pulso-action) hover:underline"><Download className="h-3.5 w-3.5" /> legenda .srt</a>
        ) : null}>
        {m.montagem ? (
          <div className="space-y-3">
            {urls.data?.[m.montagem.video]
              ? <video src={urls.data[m.montagem.video]} controls preload="metadata" className="w-full rounded-xl bg-black" />
              : <div className="aspect-video animate-pulse rounded-xl bg-(--pulso-surface-raised)" />}
            <dl className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
              <Dado rot="Duração" val={minseg(m.montagem.duracao_s)} />
              <Dado rot="Versão da montagem" val={`v${m.montagem.versao}`} />
              <Dado rot="Montado em" val={new Date(m.montagem.em).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })} />
              <Dado rot="Cortes" val={`${cortes.data?.length ?? 0} de ${nCortes}`} />
            </dl>
            <p className="text-[11px] text-(--pulso-text-subtle)">Este é o arquivo final em 1080p{m.montagem.final_mb ? ` (${m.montagem.final_mb} MB)` : ''}: dá para baixar e publicar direto do celular.</p>
          </div>
        ) : <Vazio>Ainda não montado. A montagem sai depois do roteiro aprovado e da narração.</Vazio>}
      </Secao>

      <Secao icone={<Send className="h-4 w-4" />} titulo="Pronto para publicar no YouTube">
        {m.textos?.youtube?.titulo ? (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {m.montagem?.video && urls.data?.[m.montagem.video] && <Baixar href={urls.data[m.montagem.video]} nome={`${e.codigo}_final_1080p.mp4`} rotulo="vídeo final 1080p" icone={<Film className="h-3.5 w-3.5" />} />}
              {m.montagem?.capa && urls.data?.[m.montagem.capa] && <Baixar href={urls.data[m.montagem.capa]} nome={`${e.codigo}_capa.jpg`} rotulo="capa" icone={<ImagemIcone className="h-3.5 w-3.5" />} />}
              {m.montagem?.legenda && urls.data?.[m.montagem.legenda] && <Baixar href={urls.data[m.montagem.legenda]} nome={`${e.codigo}_legenda.srt`} rotulo="legenda .srt" icone={<Download className="h-3.5 w-3.5" />} />}
            </div>
            {(m.montagem?.capas?.length ?? 0) > 0 ? (
              <div className="space-y-2">
                <p className="text-[11px] text-(--pulso-text-subtle)">3 capas para o teste do YouTube: no Studio, em <strong>Testar e comparar</strong> na miniatura, suba as três; o YouTube mostra cada uma a uma parte do público e fica com a que mais segura o clique.</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {m.montagem!.capas!.map((c, i) => urls.data?.[c] && (
                    <div key={c} className="space-y-1.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={urls.data[c]} alt={`Capa ${'ABC'[i]}`} className="w-full rounded-xl" />
                      <Baixar href={urls.data[c]} nome={`${e.codigo}_capa_${'ABC'[i]}.jpg`} rotulo={`capa ${'ABC'[i]}`} icone={<ImagemIcone className="h-3.5 w-3.5" />} />
                    </div>
                  ))}
                </div>
              </div>
            ) : m.montagem?.capa && urls.data?.[m.montagem.capa] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={urls.data[m.montagem.capa]} alt="Capa do episódio" className="w-full max-w-md rounded-xl" />
            ) : null}
            <Copiavel rotulo="Título" texto={m.textos.youtube.titulo} />
            <Copiavel rotulo="Descrição (com capítulos)" texto={m.textos.youtube.descricao} longo />
            <Copiavel rotulo="Tags" texto={m.textos.youtube.tags.join(', ')} />
            {m.textos.youtube.aviso && (
              <p className="flex items-start gap-2 rounded-xl border border-(--pulso-warn)/40 bg-(--pulso-warn)/5 px-3 py-2 text-xs text-(--pulso-warn)">
                <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {m.textos.youtube.aviso}
              </p>
            )}
            <p className="text-[11px] text-(--pulso-text-subtle)">Tela final: os últimos 5 s do vídeo já têm os espaços desenhados. No YouTube Studio, coloque o elemento de vídeo no retângulo e o de inscrição no círculo.</p>
          </div>
        ) : <Vazio>Os textos de publicação entram quando a ficha é fechada pelo motor.</Vazio>}
      </Secao>

      <Secao icone={<Scissors className="h-4 w-4" />} titulo="Cortes verticais (Reels, Shorts, TikTok, stories, status)">
        {cortes.data?.length ? (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {cortes.data.map((c) => <CardCorte key={c.id} c={c} url={c.video ? urls.data?.[c.video] : undefined} legenda={m.textos?.cortes?.[String(c.numero)]?.legenda} />)}
          </ul>
        ) : <Vazio>{nCortes ? `${nCortes} trechos marcados no roteiro; os cortes saem depois da montagem.` : 'Nenhum corte marcado no roteiro.'}</Vazio>}
      </Secao>

      <Secao icone={<BookOpen className="h-4 w-4" />} titulo="Pauta e fontes">
        {m.fontes ? (
          <div className="space-y-3 text-sm">
            {m.fontes.casos.length > 0 && (
              <div><p className="mb-1 text-[11px] uppercase tracking-wide text-(--pulso-text-subtle)">Livro de problemas</p>
                <ul className="flex flex-wrap gap-2">{m.fontes.casos.map((s) => <li key={s}><Link href={`/bastidores/livro/${s}`} className="rounded-full bg-(--pulso-surface-raised) px-2.5 py-1 text-xs text-(--pulso-text-muted) hover:text-(--pulso-text)">{s}</Link></li>)}</ul></div>
            )}
            {m.fontes.assuntos.length > 0 && (
              <div><p className="mb-1 text-[11px] uppercase tracking-wide text-(--pulso-text-subtle)">Linha do tempo</p>
                <ul className="flex flex-wrap gap-2">{m.fontes.assuntos.map((s) => <li key={s}><Link href={`/bastidores/${s}`} className="rounded-full bg-(--pulso-surface-raised) px-2.5 py-1 text-xs text-(--pulso-text-muted) hover:text-(--pulso-text)">{s}</Link></li>)}</ul></div>
            )}
            {m.fontes.banco.length > 0 && (
              <div><p className="mb-1 text-[11px] uppercase tracking-wide text-(--pulso-text-subtle)">Conferido no banco</p>
                <ul className="list-disc space-y-1 pl-5 text-xs text-(--pulso-text-muted)">{m.fontes.banco.map((b) => <li key={b}>{b}</li>)}</ul></div>
            )}
          </div>
        ) : <Vazio>As fontes entram quando a ficha é fechada pelo motor.</Vazio>}
      </Secao>

      <Secao icone={<ShieldCheck className="h-4 w-4" />} titulo="Trava do segredo (interno)">
        {m.trava ? (
          <p className={`flex items-start gap-2 text-sm ${m.trava.passou ? 'text-(--pulso-ok)' : 'text-(--pulso-danger)'}`}>
            {m.trava.passou ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <Lock className="mt-0.5 h-4 w-4 shrink-0" />}
            <span>
              {m.trava.passou ? 'Passou.' : 'Barrou.'} Roteiro comparado com as {m.trava.receitas} receitas do livro: {m.trava.trechos_comuns} com trecho de 5 palavras em comum
              {m.trava.termos_proibidos.length ? `; termos proibidos: ${m.trava.termos_proibidos.join(', ')}` : '; nenhum termo proibido'}. Conferido em {new Date(`${m.trava.em}T12:00:00Z`).toLocaleDateString('pt-BR')}.
            </span>
          </p>
        ) : <Vazio>A trava roda antes de subir a montagem.</Vazio>}
      </Secao>

      <Secao icone={<Mic className="h-4 w-4" />} titulo="Narração">
        {m.narracao ? (
          <div className="space-y-3">
            <dl className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
              <Dado rot="Voz" val={m.narracao.voz || '—'} />
              <Dado rot="Voz aprovada em" val={m.narracao.voz_aprovada_em ? new Date(`${m.narracao.voz_aprovada_em}T12:00:00Z`).toLocaleDateString('pt-BR') : '—'} />
              <Dado rot="Tempo de voz" val={minseg(m.narracao.total_s)} />
              <Dado rot="Caracteres narrados" val={m.narracao.caracteres.toLocaleString('pt-BR')} />
            </dl>
            <ul className="grid grid-cols-3 gap-1.5 text-[11px] sm:grid-cols-5">
              {m.narracao.blocos.map((b) => (
                <li key={b.bloco} className="rounded-lg bg-(--pulso-surface-raised) px-2 py-1.5 text-(--pulso-text-muted)">bloco {b.bloco} · {Math.round(b.duracao_s)} s</li>
              ))}
            </ul>
          </div>
        ) : <Vazio>Sem narração ainda.</Vazio>}
      </Secao>

      <Secao icone={<Clapperboard className="h-4 w-4" />} titulo="Roteiro">
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center gap-1.5 text-xs text-(--pulso-action)">
            <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" /> ver o roteiro completo com as marcações
          </summary>
          <div className="mt-4">
            {md ? <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD}>{md}</ReactMarkdown> : <Vazio>Sem roteiro ainda.</Vazio>}
          </div>
        </details>
      </Secao>

      <Secao icone={<Calendar className="h-4 w-4" />} titulo="Publicação">
        <dl className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-3">
          <Dado rot="Canal do YouTube" val={m.publicacao?.canal || 'a decidir pelo dono'} />
          <Dado rot="Data" val={m.publicacao?.data ? new Date(m.publicacao.data).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : 'não marcada'} />
          <Dado rot="Endereço" val={m.publicacao?.url || '—'} />
        </dl>
        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-(--pulso-text-subtle)"><Send className="h-3.5 w-3.5" /> Quem publica é o dono (R-011). Depois de publicado, o endereço entra aqui e a medição começa.</p>
      </Secao>

      <Secao icone={<BarChart3 className="h-4 w-4" />} titulo="Números">
        {e.status === 'publicado' ? <Vazio>A medição do longo (horas de exibição e retenção) entra com a coleta do YouTube.</Vazio>
          : <Vazio>Quando o episódio for ao ar: horas de exibição, retenção minuto a minuto, de onde veio o público e quanto cada corte trouxe de volta.</Vazio>}
      </Secao>
    </article>
  )
}

function Copiavel({ rotulo, texto, longo, pequeno }: { rotulo: string; texto: string; longo?: boolean; pequeno?: boolean }) {
  const [ok, setOk] = useState(false)
  async function copiar() {
    await navigator.clipboard.writeText(texto)
    setOk(true); setTimeout(() => setOk(false), 1800)
  }
  return (
    <div className="rounded-xl bg-(--pulso-surface-raised) p-3">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-[10px] uppercase tracking-wide text-(--pulso-text-subtle)">{rotulo}</span>
        <button type="button" onClick={copiar} className="inline-flex items-center gap-1 text-[11px] text-(--pulso-action) hover:underline">
          {ok ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {ok ? 'copiado' : 'copiar'}
        </button>
      </div>
      <p className={`whitespace-pre-line text-(--pulso-text) ${pequeno ? 'line-clamp-3 text-[11px]' : 'text-xs'} ${longo ? 'max-h-48 overflow-y-auto' : ''}`}>{texto}</p>
    </div>
  )
}

function Baixar({ href, nome, rotulo, icone }: { href: string; nome: string; rotulo: string; icone: ReactNode }) {
  return (
    <a href={href} download={nome} className="inline-flex items-center gap-1.5 rounded-lg border border-(--pulso-border) px-3 py-1.5 text-xs text-(--pulso-text-muted) hover:text-(--pulso-text)">
      {icone} {rotulo}
    </a>
  )
}

function Dado({ rot, val }: { rot: string; val: string }) {
  return (
    <div className="rounded-xl bg-(--pulso-surface-raised) px-3 py-2">
      <dt className="text-[10px] uppercase tracking-wide text-(--pulso-text-subtle)">{rot}</dt>
      <dd className="mt-0.5 break-words text-sm text-(--pulso-text)">{val}</dd>
    </div>
  )
}

function CardCorte({ c, url, legenda }: { c: Corte; url?: string; legenda?: string }) {
  const qc = useQueryClient()
  const [ocupado, setOcupado] = useState(false)
  async function status(s: Corte['status']) {
    setOcupado(true)
    await supabase.schema('pulso_content').from('episodio_cortes').update({ status: s, atualizado_em: new Date().toISOString() }).eq('id', c.id)
    setOcupado(false)
    await qc.invalidateQueries({ queryKey: ['longos-cortes'] })
  }
  return (
    <li className="space-y-2">
      {url ? <video src={url} controls preload="metadata" className="aspect-[9/16] w-full rounded-xl bg-black object-cover" />
        : <div className="aspect-[9/16] animate-pulse rounded-xl bg-(--pulso-surface-raised)" />}
      <p className="text-xs font-semibold text-(--pulso-text)">{c.numero}. {c.titulo}</p>
      <p className="text-[11px] text-(--pulso-text-subtle)">{Math.round(c.duracao_s)} s · {c.status}</p>
      {legenda && <Copiavel rotulo="Legenda" texto={legenda} pequeno />}
      {url && <Baixar href={url} nome={`corte_${c.numero}.mp4`} rotulo="baixar" icone={<Download className="h-3.5 w-3.5" />} />}
      <div className="flex gap-2">
        {c.status === 'pronto' && <button type="button" disabled={ocupado} onClick={() => status('aprovado')} className="rounded-lg bg-(--pulso-ok) px-2.5 py-1 text-[11px] font-medium text-(--pulso-on-action) disabled:opacity-50">Aprovar</button>}
        {c.status === 'aprovado' && <button type="button" disabled={ocupado} onClick={() => status('pronto')} className="rounded-lg border border-(--pulso-border) px-2.5 py-1 text-[11px] text-(--pulso-text-muted) disabled:opacity-50">Desfazer</button>}
        {c.status !== 'descartado' && c.status !== 'publicado' && <button type="button" disabled={ocupado} onClick={() => status('descartado')} className="text-[11px] text-(--pulso-text-subtle) hover:text-(--pulso-danger) disabled:opacity-50">descartar</button>}
      </div>
    </li>
  )
}
