'use client'

import { use, useState, type ReactNode } from 'react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, CheckCircle2, Loader2, Scissors, Video } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useEpisodio } from '@/lib/hooks/use-longos'

const CARTAO = 'rounded-2xl border border-(--pulso-border) bg-(--pulso-surface)'

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

const STATUS: Record<string, string> = { planejado: 'aguardando aprovação do roteiro', roteiro_ok: 'roteiro aprovado' }

/** Ficha do episódio dos Longos (05/11/2026): ler o roteiro com as marcações e aprovar. */
export default function EpisodioPage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = use(params)
  const { data: e, isLoading, error } = useEpisodio(codigo)
  const qc = useQueryClient()
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function mudar(status: string) {
    setOcupado(true); setErro(null)
    const { error: x } = await supabase.schema('pulso_content').from('episodios')
      .update({ status, updated_at: new Date().toISOString() }).eq('codigo', codigo)
    setOcupado(false)
    if (x) { setErro(x.message); return }
    await qc.invalidateQueries({ queryKey: ['longos-episodio', codigo] })
    await qc.invalidateQueries({ queryKey: ['longos-episodios'] })
  }

  if (isLoading) return <div className={`h-[600px] animate-pulse ${CARTAO}`} />
  if (error) return <p className={`${CARTAO} p-6 text-sm text-(--pulso-danger)`}>Não deu para ler o episódio: {error.message}</p>
  if (!e) return <p className={`${CARTAO} p-6 text-sm text-(--pulso-text-muted)`}>Episódio não encontrado. <Link href="/longos" className="text-(--pulso-action) hover:underline">Voltar</Link></p>

  const md = e.roteiro_md || ''
  const cortes = (md.match(/✂ \*\*CORTE \d+/g) || []).length
  const voce = (md.match(/\*\*\[VOCÊ\]\*\*/g) || []).length

  return (
    <article className="mx-auto max-w-3xl space-y-4">
      <Link href="/longos" className="inline-flex items-center gap-1.5 text-xs text-(--pulso-text-subtle) hover:text-(--pulso-text)">
        <ArrowLeft className="h-3.5 w-3.5" /> Episódios
      </Link>

      <header className={`${CARTAO} p-6`}>
        <p className="font-mono text-xs text-(--pulso-text-subtle)">{e.codigo} · {STATUS[e.status] || e.status}</p>
        <h1 className="mt-1 text-2xl font-bold text-(--pulso-text)">{e.titulo}</h1>
        {e.gancho && <p className="mt-2 text-sm italic text-(--pulso-text-muted)">“{e.gancho}”</p>}
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-(--pulso-surface-raised) px-2.5 py-1 text-(--pulso-text-muted)"><Scissors className="mr-1 inline h-3 w-3" />{cortes} cortes</span>
          <span className="rounded-full bg-(--pulso-surface-raised) px-2.5 py-1 text-(--pulso-text-muted)"><Video className="mr-1 inline h-3 w-3" />{voce} trechos seus em vídeo</span>
          <span className="ml-auto" />
          {e.status === 'planejado' && (
            <button type="button" disabled={ocupado || !md} onClick={() => mudar('roteiro_ok')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-(--pulso-ok) px-3 py-1.5 font-medium text-(--pulso-on-action) disabled:opacity-50">
              {ocupado ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />} Aprovar roteiro
            </button>
          )}
          {e.status === 'roteiro_ok' && (
            <button type="button" disabled={ocupado} onClick={() => mudar('planejado')}
              className="rounded-lg border border-(--pulso-border) px-3 py-1.5 text-(--pulso-text-muted) hover:text-(--pulso-text) disabled:opacity-50">
              Desfazer aprovação
            </button>
          )}
        </div>
        {erro && <p className="mt-2 text-xs text-(--pulso-danger)">Não salvou: {erro}</p>}
      </header>

      <section className={`${CARTAO} p-6`}>
        {md ? <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD}>{md}</ReactMarkdown>
          : <p className="text-sm text-(--pulso-text-subtle)">Sem roteiro ainda.</p>}
      </section>
    </article>
  )
}
