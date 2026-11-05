'use client'

import { use } from 'react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ArrowLeft, Lock } from 'lucide-react'
import { useProblema } from '@/lib/hooks/use-livro'
import { AREAS_PROBLEMA, GRAVIDADE } from '@/lib/bastidores/areas'
import { dataLonga } from '@/lib/bastidores/tipos'

const MD = {
  h2: (p: React.ComponentProps<'h2'>) => <h2 className="mb-2 mt-5 text-sm font-semibold text-(--pulso-text) first:mt-0" {...p} />,
  h3: (p: React.ComponentProps<'h3'>) => <h3 className="mb-1.5 mt-4 text-sm font-semibold text-(--pulso-text)" {...p} />,
  p: (p: React.ComponentProps<'p'>) => <p className="mb-3 text-sm leading-relaxed text-(--pulso-text-muted)" {...p} />,
  ul: (p: React.ComponentProps<'ul'>) => <ul className="mb-3 list-disc space-y-1 pl-5 text-sm text-(--pulso-text-muted)" {...p} />,
  ol: (p: React.ComponentProps<'ol'>) => <ol className="mb-3 list-decimal space-y-1 pl-5 text-sm text-(--pulso-text-muted)" {...p} />,
  strong: (p: React.ComponentProps<'strong'>) => <strong className="font-semibold text-(--pulso-text)" {...p} />,
  code: (p: React.ComponentProps<'code'>) => <code className="rounded bg-(--pulso-surface-raised) px-1 py-0.5 text-xs text-(--pulso-text)" {...p} />,
}

const ETAPAS: { campo: 'sintoma' | 'causa' | 'conserto' | 'prova' | 'trava'; rotulo: string }[] = [
  { campo: 'sintoma', rotulo: 'Como percebemos' },
  { campo: 'causa', rotulo: 'Causa raiz' },
  { campo: 'conserto', rotulo: 'O conserto' },
  { campo: 'prova', rotulo: 'A prova de que resolveu' },
  { campo: 'trava', rotulo: 'A trava que impede de voltar' },
]

export default function ProblemaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const { data, isLoading, isError, error } = useProblema(slug)

  if (isLoading) return <div className="h-[600px] animate-pulse rounded-2xl bg-(--pulso-surface)" />
  if (isError) return <Aviso>Não deu para ler o caso: {error instanceof Error ? error.message : 'erro'}</Aviso>
  if (!data) return <Aviso>Caso não encontrado. <Link href="/bastidores/livro" className="text-(--pulso-action) hover:underline">Voltar ao livro</Link></Aviso>

  const { problema: p, receita } = data
  const G = GRAVIDADE[p.gravidade]

  return (
    <article className="mx-auto max-w-4xl space-y-4">
      <Link href="/bastidores/livro" className="inline-flex items-center gap-1.5 text-xs text-(--pulso-text-subtle) hover:text-(--pulso-text)">
        <ArrowLeft className="h-3.5 w-3.5" /> Livro de problemas
      </Link>

      <header className="rounded-2xl border border-(--pulso-border) bg-(--pulso-surface) p-6">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
          <span className={`rounded-full px-2 py-0.5 font-medium ${G.classe}`}>{G.rotulo}</span>
          <span className="rounded-full bg-(--pulso-surface-raised) px-2 py-0.5 text-(--pulso-text-muted)">{AREAS_PROBLEMA[p.area]}</span>
          <span className="text-(--pulso-text-subtle)">{dataLonga(p.inicio)}{p.fim ? (p.fim !== p.inicio ? ` → ${dataLonga(p.fim)}` : '') : ' → em aberto'}</span>
          {p.status === 'rascunho' && <span className="rounded-full border border-dashed border-(--pulso-border) px-2 py-0.5 text-(--pulso-text-subtle)">aguardando aprovação</span>}
        </div>
        <h1 className="text-2xl font-bold leading-tight text-(--pulso-text)">{p.titulo}</h1>
      </header>

      <section className="grid gap-3 sm:grid-cols-2">
        {ETAPAS.filter((e) => p[e.campo]).map((e) => (
          <div key={e.campo} className={`rounded-2xl border border-(--pulso-border) bg-(--pulso-surface) p-4 ${e.campo === 'sintoma' ? 'sm:col-span-2' : ''}`}>
            <h2 className="mb-1 text-[11px] uppercase tracking-wide text-(--pulso-text-subtle)">{e.rotulo}</h2>
            <p className="text-sm leading-relaxed text-(--pulso-text-muted)">{p[e.campo]}</p>
          </div>
        ))}
      </section>

      {p.impacto.length > 0 && (
        <section aria-label="Impacto" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {p.impacto.map((n, i) => (
            <div key={i} className="rounded-2xl border border-(--pulso-border) bg-(--pulso-surface) p-4">
              <p className="text-[11px] uppercase tracking-wide text-(--pulso-text-subtle)">{n.rotulo}</p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-(--pulso-text)">{n.valor}</p>
              {n.data && <p className="mt-0.5 text-[11px] text-(--pulso-text-subtle)">medido em {dataLonga(n.data)}</p>}
            </div>
          ))}
        </section>
      )}

      {p.historia_md && (
        <section className="rounded-2xl border border-(--pulso-border) bg-(--pulso-surface) p-6">
          <h2 className="mb-3 text-sm font-semibold text-(--pulso-text)">A história</h2>
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD}>{p.historia_md}</ReactMarkdown>
          {p.assunto_slug && (
            <Link href={`/bastidores/${p.assunto_slug}`} className="text-xs text-(--pulso-action) hover:underline">Ver o assunto na linha do tempo →</Link>
          )}
        </section>
      )}

      {receita !== null && (
        <section className="rounded-2xl border border-(--pulso-warn)/40 bg-(--pulso-warn)/5 p-6">
          <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-(--pulso-warn)"><Lock className="h-4 w-4" /> A receita</h2>
          <p className="mb-3 text-[11px] text-(--pulso-text-subtle)">Só admin. Não copiar para episódio, peça ou outro app.</p>
          {receita ? <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD}>{receita}</ReactMarkdown>
            : <p className="text-sm text-(--pulso-text-subtle)">Sem receita registrada.</p>}
        </section>
      )}

      {(p.commits.length > 0 || p.memorias.length > 0) && (
        <section className="rounded-2xl border border-(--pulso-border) bg-(--pulso-surface) p-4 text-xs text-(--pulso-text-subtle)">
          {p.commits.length > 0 && <p><span className="text-(--pulso-text-muted)">Commits:</span> {p.commits.join(' · ')}</p>}
          {p.memorias.length > 0 && <p className="mt-1"><span className="text-(--pulso-text-muted)">Notas:</span> {p.memorias.join(' · ')}</p>}
        </section>
      )}
    </article>
  )
}

function Aviso({ children }: { children: React.ReactNode }) {
  return <p className="rounded-2xl border border-(--pulso-border) bg-(--pulso-surface) p-6 text-sm text-(--pulso-text-muted)">{children}</p>
}
