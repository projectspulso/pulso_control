'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Clapperboard } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { useBastidores, type TipoAssunto } from '@/lib/hooks/use-bastidores'
import { TIPOS, dataLonga, mesAno } from '@/lib/bastidores/tipos'

/**
 * LINHA DO TEMPO DOS BASTIDORES (04/11/2026) — a história do PULSO por assunto, não por commit.
 * Cada card abre a página do assunto (o que aconteceu, números da época, imagens do app). É a fonte
 * que o Limelight lê para as fichas de episódio; nasce interna.
 */
export default function BastidoresPage() {
  const { data, isLoading, isError, error } = useBastidores()
  const [tipo, setTipo] = useState<TipoAssunto | 'todos'>('todos')

  const grupos = useMemo(() => {
    const m = new Map<string, NonNullable<typeof data>>()
    for (const a of (data || []).filter((x) => tipo === 'todos' || x.tipo === tipo)) {
      const k = a.data.slice(0, 7)
      m.set(k, [...(m.get(k) || []), a])
    }
    return [...m.entries()]
  }, [data, tipo])

  const contagem = (t: TipoAssunto) => (data || []).filter((a) => a.tipo === t).length

  return (
    <div className="space-y-5">
      <PageHeader titulo="Bastidores" subtitulo="A história do PULSO por assunto: o que aconteceu, com os números e as telas da época" />

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filtrar por tipo">
        <Chip ativo={tipo === 'todos'} onClick={() => setTipo('todos')}>Todos ({data?.length ?? 0})</Chip>
        {(Object.keys(TIPOS) as TipoAssunto[]).map((t) => {
          const T = TIPOS[t]
          return (
            <Chip key={t} ativo={tipo === t} onClick={() => setTipo(t)}>
              <T.icone className={`h-3.5 w-3.5 ${T.cor}`} /> {T.rotulo} ({contagem(t)})
            </Chip>
          )
        })}
      </div>

      {isLoading && <div className="h-96 animate-pulse rounded-2xl bg-(--pulso-surface)" />}
      {isError && (
        <p className="rounded-2xl border border-(--pulso-border) bg-(--pulso-surface) p-6 text-sm text-(--pulso-danger)">
          Não deu para ler os bastidores: {error instanceof Error ? error.message : 'erro'}
        </p>
      )}
      {data && grupos.length === 0 && (
        <p className="rounded-2xl border border-(--pulso-border) bg-(--pulso-surface) p-10 text-center text-sm text-(--pulso-text-subtle)">
          Nenhum assunto neste filtro.
        </p>
      )}

      {grupos.map(([mes, assuntos]) => (
        <section key={mes}>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-(--pulso-text-subtle)">{mesAno(`${mes}-01`)}</h2>
          <ol className="relative space-y-3 border-l border-(--pulso-border) pl-5">
            {assuntos.map((a) => {
              const T = TIPOS[a.tipo]
              return (
                <li key={a.id} className="relative">
                  <span className={`absolute -left-[27px] top-5 flex h-3.5 w-3.5 items-center justify-center rounded-full ring-4 ring-(--background) ${T.fundo}`}>
                    <span className={`h-1.5 w-1.5 rounded-full bg-current ${T.cor}`} />
                  </span>
                  <Link href={`/bastidores/${a.slug}`}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-(--pulso-border) bg-(--pulso-surface) transition-colors hover:border-(--pulso-action)/50 sm:flex-row">
                    <div className="aspect-video shrink-0 bg-(--pulso-surface-raised) sm:aspect-auto sm:w-56">
                      {a.capa ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={a.capa} alt="" className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <div className="flex h-full min-h-28 items-center justify-center">
                          <T.icone className={`h-8 w-8 opacity-40 ${T.cor}`} />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 p-4">
                      <div className="mb-1.5 flex flex-wrap items-center gap-2 text-[11px]">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${T.fundo} ${T.cor}`}>
                          <T.icone className="h-3 w-3" /> {T.rotulo}
                        </span>
                        <span className="text-(--pulso-text-subtle)">{dataLonga(a.data)}</span>
                        {a.episodio && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-(--pulso-surface-raised) px-2 py-0.5 text-(--pulso-text-muted)">
                            <Clapperboard className="h-3 w-3" /> {a.episodio}
                          </span>
                        )}
                        {a.status === 'rascunho' && <span className="rounded-full border border-dashed border-(--pulso-border) px-2 py-0.5 text-(--pulso-text-subtle)">rascunho</span>}
                      </div>
                      <h3 className="text-base font-semibold leading-snug text-(--pulso-text) group-hover:text-(--pulso-action)">{a.titulo}</h3>
                      <p className="mt-1 line-clamp-2 text-sm text-(--pulso-text-muted)">{a.resumo}</p>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ol>
        </section>
      ))}
    </div>
  )
}

function Chip({ ativo, onClick, children }: { ativo: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" role="tab" aria-selected={ativo} onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-colors ${ativo
        ? 'bg-(--pulso-action) font-medium text-(--pulso-on-action)'
        : 'border border-(--pulso-border) bg-(--pulso-surface) text-(--pulso-text-muted) hover:text-(--pulso-text)'}`}>
      {children}
    </button>
  )
}
