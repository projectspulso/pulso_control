'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowRight, CheckCircle2, Clapperboard, Hourglass, Layers, Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { BastidoresAbas } from '@/components/bastidores-abas'
import { supabase } from '@/lib/supabase/client'
import { useBastidores, type Assunto, type TipoAssunto } from '@/lib/hooks/use-bastidores'
import { TIPOS, dataLonga, mesAno } from '@/lib/bastidores/tipos'
import { Abas, Numero, Vazio } from '@/components/longos/ui'

/**
 * LINHA DO TEMPO DOS BASTIDORES (04/11/2026) — a história do PULSO por assunto, não por commit.
 * Cada card abre a página do assunto (o que aconteceu, números da época, imagens do app). É a fonte
 * que o Limelight lê para as fichas de episódio; nasce interna.
 */
export default function BastidoresPage() {
  const { data, isLoading, isError, error } = useBastidores()
  const [tipo, setTipo] = useState<TipoAssunto | 'todos'>('todos')
  // abre em "aguardando": é a fila de trabalho de quem aprova
  // sem nada aguardando, abre em "todos" (12/11: a aba vazia parecia tela quebrada)
  const [escolha, setSituacao] = useState<'todos' | Assunto['status'] | null>(null)
  const situacao = escolha ?? ((data || []).some((a) => a.status === 'rascunho') ? 'rascunho' : 'todos')

  const grupos = useMemo(() => {
    const m = new Map<string, NonNullable<typeof data>>()
    for (const a of (data || []).filter((x) => (tipo === 'todos' || x.tipo === tipo) && (situacao === 'todos' || x.status === situacao))) {
      const k = a.data.slice(0, 7)
      m.set(k, [...(m.get(k) || []), a])
    }
    return [...m.entries()]
  }, [data, tipo, situacao])

  const naSituacao = (data || []).filter((a) => situacao === 'todos' || a.status === situacao)
  const contagem = (t: TipoAssunto) => naSituacao.filter((a) => a.tipo === t).length
  const porStatus = (st: Assunto['status']) => (data || []).filter((a) => a.status === st).length

  return (
    <div className="space-y-5">
      <PageHeader titulo="Bastidores" subtitulo="A matéria-prima dos episódios: cada assunto com números e telas da época" />
      <BastidoresAbas />

      {data && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Numero icone={Hourglass} rotulo="Aguardando você" valor={porStatus('rascunho')} sub="para aprovar" tom="alerta" />
          <Numero icone={CheckCircle2} rotulo="Aprovados" valor={porStatus('aprovado')} sub="prontos para roteiro" tom="ok" />
          <Numero icone={Clapperboard} rotulo="Já em episódio" valor={data.filter((a) => a.episodio).length} sub="usados num roteiro" tom="vl" />
          <Numero icone={Layers} rotulo="Total" valor={data.length} sub="assuntos na linha do tempo" />
        </div>
      )}

      <Abas<'todos' | Assunto['status']> ativa={situacao} onChange={setSituacao} abas={[
        { id: 'rascunho', rotulo: 'Aguardando', icone: Hourglass, n: porStatus('rascunho') },
        { id: 'aprovado', rotulo: 'Aprovados', icone: CheckCircle2, n: porStatus('aprovado') },
        { id: 'todos', rotulo: 'Todos', icone: Layers, n: data?.length ?? 0 },
      ]} />

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filtrar por tipo">
        <Chip ativo={tipo === 'todos'} onClick={() => setTipo('todos')}>Todos os tipos ({naSituacao.length})</Chip>
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
      {data && grupos.length === 0 && <Vazio>Nenhum assunto neste filtro.</Vazio>}

      {grupos.map(([mes, assuntos]) => (
        <section key={mes}>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-(--pulso-text-subtle)">{mesAno(`${mes}-01`)}</h2>
          <ol className="relative grid gap-3 border-l border-(--pulso-border) pl-5 xl:grid-cols-2">
            {assuntos.map((a) => {
              const T = TIPOS[a.tipo]
              return (
                <li key={a.id} className="relative">
                  <span className={`absolute -left-[27px] top-5 flex h-3.5 w-3.5 items-center justify-center rounded-full ring-4 ring-(--background) ${T.fundo}`}>
                    <span className={`h-1.5 w-1.5 rounded-full bg-current ${T.cor}`} />
                  </span>
                  <CardAssunto a={a} />
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

/** Card da linha do tempo: aprova sem sair da lista; o título, a capa e "Ver detalhes" abrem o assunto. */
function CardAssunto({ a }: { a: Assunto & { capa: string | null } }) {
  const T = TIPOS[a.tipo]
  const qc = useQueryClient()
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function mudarStatus(status: Assunto['status']) {
    setOcupado(true); setErro(null)
    const { error } = await supabase.schema('pulso_content').from('bastidores_assuntos')
      .update({ status, atualizado_em: new Date().toISOString() }).eq('id', a.id)
    setOcupado(false)
    if (error) { setErro(error.message); return }
    await qc.invalidateQueries({ queryKey: ['bastidores'] })
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-(--pulso-border) bg-(--pulso-surface) shadow-sm sm:flex-row">
      <Link href={`/bastidores/${a.slug}`} tabIndex={-1} aria-hidden="true"
        className="relative h-32 shrink-0 bg-(--pulso-surface-raised) sm:h-auto sm:min-h-28 sm:w-40">
        {a.capa ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={a.capa} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <T.icone className={`h-8 w-8 opacity-40 ${T.cor}`} />
          </div>
        )}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col p-4">
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
          {a.status === 'aprovado' ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-(--pulso-ok)/12 px-2 py-0.5 text-(--pulso-ok)">
              <CheckCircle2 className="h-3 w-3" /> aprovado
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full border border-dashed border-(--pulso-warn)/40 px-2 py-0.5 text-(--pulso-warn)"><Hourglass className="h-3 w-3" /> aguardando</span>
          )}
        </div>
        <Link href={`/bastidores/${a.slug}`} className="text-base font-semibold leading-snug text-(--pulso-text) hover:text-(--pulso-action)">
          {a.titulo}
        </Link>
        <p className="mt-1 line-clamp-2 text-xs text-(--pulso-text-muted)">{a.resumo}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {a.status === 'rascunho' ? (
            <button type="button" disabled={ocupado} onClick={() => mudarStatus('aprovado')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-(--pulso-ok) px-3 py-1.5 text-xs font-medium text-(--pulso-on-action) disabled:opacity-50">
              {ocupado ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />} Aprovar
            </button>
          ) : (
            <button type="button" disabled={ocupado} onClick={() => mudarStatus('rascunho')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-(--pulso-border) px-3 py-1.5 text-xs text-(--pulso-text-muted) hover:text-(--pulso-text) disabled:opacity-50">
              {ocupado && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Desfazer aprovação
            </button>
          )}
          <Link href={`/bastidores/${a.slug}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-(--pulso-border) px-3 py-1.5 text-xs text-(--pulso-text-muted) hover:text-(--pulso-text)">
            Abrir <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          {erro && <span className="text-xs text-(--pulso-danger)">Não salvou: {erro}</span>}
        </div>
      </div>
    </div>
  )
}
