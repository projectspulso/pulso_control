'use client'

import { use } from 'react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ArrowLeft, ArrowRight, Clapperboard, FileText, PlayCircle } from 'lucide-react'
import { useAssunto } from '@/lib/hooks/use-bastidores'
import { TIPOS, dataLonga } from '@/lib/bastidores/tipos'
import { BastidoresEditor } from '@/components/bastidores-editor'

// o markdown do assunto com os tokens do app (o projeto não usa o plugin de tipografia do Tailwind)
const MD = {
  h2: (p: React.ComponentProps<'h2'>) => <h2 className="mb-2 mt-6 text-base font-semibold text-(--pulso-text) first:mt-0" {...p} />,
  h3: (p: React.ComponentProps<'h3'>) => <h3 className="mb-1.5 mt-4 text-sm font-semibold text-(--pulso-text)" {...p} />,
  p: (p: React.ComponentProps<'p'>) => <p className="mb-3 text-sm leading-relaxed text-(--pulso-text-muted)" {...p} />,
  ul: (p: React.ComponentProps<'ul'>) => <ul className="mb-3 list-disc space-y-1 pl-5 text-sm text-(--pulso-text-muted)" {...p} />,
  ol: (p: React.ComponentProps<'ol'>) => <ol className="mb-3 list-decimal space-y-1 pl-5 text-sm text-(--pulso-text-muted)" {...p} />,
  strong: (p: React.ComponentProps<'strong'>) => <strong className="font-semibold text-(--pulso-text)" {...p} />,
  a: (p: React.ComponentProps<'a'>) => <a className="text-(--pulso-action) hover:underline" target="_blank" rel="noopener noreferrer" {...p} />,
  code: (p: React.ComponentProps<'code'>) => <code className="rounded bg-(--pulso-surface-raised) px-1 py-0.5 text-xs text-(--pulso-text)" {...p} />,
  blockquote: (p: React.ComponentProps<'blockquote'>) => <blockquote className="mb-3 border-l-2 border-(--pulso-action) pl-3 text-sm italic text-(--pulso-text-muted)" {...p} />,
}

export default function AssuntoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const { data, isLoading, isError, error } = useAssunto(slug)

  if (isLoading) return <div className="h-[600px] animate-pulse rounded-2xl bg-(--pulso-surface)" />
  if (isError) return <Aviso>Não deu para ler o assunto: {error instanceof Error ? error.message : 'erro'}</Aviso>
  if (!data) return <Aviso>Assunto não encontrado. <Link href="/bastidores" className="text-(--pulso-action) hover:underline">Voltar para a linha do tempo</Link></Aviso>

  const { assunto: a, imagens, videos, vizinhos } = data
  const T = TIPOS[a.tipo]

  return (
    <article className="mx-auto max-w-4xl space-y-5">
      <Link href="/bastidores" className="inline-flex items-center gap-1.5 text-xs text-(--pulso-text-subtle) hover:text-(--pulso-text)">
        <ArrowLeft className="h-3.5 w-3.5" /> Linha do tempo
      </Link>

      <header className="rounded-2xl border border-(--pulso-border) bg-(--pulso-surface) p-6">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${T.fundo} ${T.cor}`}>
            <T.icone className="h-3.5 w-3.5" /> {T.rotulo}
          </span>
          <span className="text-(--pulso-text-subtle)">{dataLonga(a.data)}</span>
          {a.status === 'rascunho' && <span className="rounded-full border border-dashed border-(--pulso-border) px-2 py-0.5 text-(--pulso-text-subtle)">rascunho: falta aprovação</span>}
        </div>
        <h1 className="text-2xl font-bold leading-tight text-(--pulso-text)">{a.titulo}</h1>
        <p className="mt-2 text-sm text-(--pulso-text-muted)">{a.resumo}</p>
      </header>

      {a.numeros.length > 0 && (
        <section aria-label="Números da época" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {a.numeros.map((n, i) => (
            <div key={i} className="rounded-2xl border border-(--pulso-border) bg-(--pulso-surface) p-4">
              <p className="text-[11px] uppercase tracking-wide text-(--pulso-text-subtle)">{n.rotulo}</p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-(--pulso-text)">{n.valor}</p>
              {n.data && <p className="mt-0.5 text-[11px] text-(--pulso-text-subtle)">medido em {dataLonga(n.data)}</p>}
            </div>
          ))}
        </section>
      )}

      {imagens.length > 0 && (
        <section aria-label="Imagens" className="grid gap-3 sm:grid-cols-2">
          {imagens.map((img, i) => (
            <figure key={i} className="overflow-hidden rounded-2xl border border-(--pulso-border) bg-(--pulso-surface)">
              <a href={img.url} target="_blank" rel="noopener noreferrer" title="Abrir em tamanho real">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt={img.legenda || ''} className="w-full object-cover" loading="lazy" />
              </a>
              {img.legenda && <figcaption className="px-3 py-2 text-xs text-(--pulso-text-muted)">{img.legenda}</figcaption>}
            </figure>
          ))}
        </section>
      )}

      {a.corpo_md && (
        <section className="rounded-2xl border border-(--pulso-border) bg-(--pulso-surface) p-6">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD}>{a.corpo_md}</ReactMarkdown>
        </section>
      )}

      {videos.length > 0 && (
        <section className="rounded-2xl border border-(--pulso-border) bg-(--pulso-surface) p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-(--pulso-text)"><PlayCircle className="h-4 w-4 text-(--pulso-action)" /> Vídeos citados</h2>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {videos.map((v) => (
              <Link key={v.numero} href={`/video/${v.ideiaId}`} className="group">
                <div className="aspect-9/16 overflow-hidden rounded-xl bg-(--pulso-surface-raised)">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {v.thumb && <img src={v.thumb} alt="" className="h-full w-full object-cover" loading="lazy" />}
                </div>
                <p className="mt-1.5 line-clamp-2 text-xs text-(--pulso-text-muted) group-hover:text-(--pulso-text)">#{v.numero} {v.titulo}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-(--pulso-border) bg-(--pulso-surface) p-4">
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-(--pulso-text)"><Clapperboard className="h-4 w-4 text-(--pulso-action)" /> Episódio</h2>
          <p className="text-sm text-(--pulso-text-muted)">{a.episodio ? `Coberto pela ficha ${a.episodio}.` : 'Ainda não virou episódio.'}</p>
        </div>
        <div className="rounded-2xl border border-(--pulso-border) bg-(--pulso-surface) p-4">
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-(--pulso-text)"><FileText className="h-4 w-4 text-(--pulso-action)" /> Fontes</h2>
          {a.fontes.length ? (
            <ul className="space-y-1 text-xs text-(--pulso-text-subtle)">{a.fontes.map((f, i) => <li key={i} className="break-all">{f}</li>)}</ul>
          ) : <p className="text-sm text-(--pulso-text-subtle)">Sem fonte registrada.</p>}
        </div>
      </section>

      <BastidoresEditor key={`${a.id}-${a.titulo}-${a.status}-${a.imagens.length}`} assunto={a} />

      <nav className="flex justify-between gap-3 text-xs">
        {vizinhos.antes ? (
          <Link href={`/bastidores/${vizinhos.antes.slug}`} className="inline-flex max-w-[45%] items-center gap-1.5 text-(--pulso-text-muted) hover:text-(--pulso-text)">
            <ArrowLeft className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{vizinhos.antes.titulo}</span>
          </Link>
        ) : <span />}
        {vizinhos.depois && (
          <Link href={`/bastidores/${vizinhos.depois.slug}`} className="inline-flex max-w-[45%] items-center gap-1.5 text-right text-(--pulso-text-muted) hover:text-(--pulso-text)">
            <span className="truncate">{vizinhos.depois.titulo}</span> <ArrowRight className="h-3.5 w-3.5 shrink-0" />
          </Link>
        )}
      </nav>
    </article>
  )
}

function Aviso({ children }: { children: React.ReactNode }) {
  return <p className="rounded-2xl border border-(--pulso-border) bg-(--pulso-surface) p-6 text-sm text-(--pulso-text-muted)">{children}</p>
}
