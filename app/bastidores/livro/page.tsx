'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowRight, CheckCircle2, Loader2, Search } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { BastidoresAbas } from '@/components/bastidores-abas'
import { supabase } from '@/lib/supabase/client'
import { useLivro, type AreaProblema, type Problema } from '@/lib/hooks/use-livro'
import { AREAS_PROBLEMA, GRAVIDADE } from '@/lib/bastidores/areas'
import { dataLonga } from '@/lib/bastidores/tipos'

/**
 * LIVRO DE PROBLEMAS (04/11/2026) — tudo o que deu errado, por que, como foi resolvido e o que
 * impede de voltar. É segredo da casa: a receita (o como exato) fica em tabela só de admin e nunca
 * aparece nesta lista; outros apps leem só v_livro_historia.
 */
export default function LivroPage() {
  const { data, isLoading, isError, error } = useLivro()
  const [situacao, setSituacao] = useState<'todos' | Problema['status']>('rascunho')
  const [area, setArea] = useState<AreaProblema | 'todas'>('todas')
  const [busca, setBusca] = useState('')

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return (data || []).filter((p) =>
      (situacao === 'todos' || p.status === situacao) && (area === 'todas' || p.area === area)
      && (!q || `${p.titulo} ${p.sintoma} ${p.causa}`.toLowerCase().includes(q)))
  }, [data, situacao, area, busca])

  const porStatus = (st: Problema['status']) => (data || []).filter((p) => p.status === st).length
  const abertos = (data || []).filter((p) => !p.fim).length

  return (
    <div className="space-y-5">
      <PageHeader titulo="Bastidores" subtitulo="Livro de problemas: o que deu errado, a causa, o conserto e a trava que impede de voltar" />
      <BastidoresAbas />

      <p className="rounded-xl border border-(--pulso-border) bg-(--pulso-surface) px-4 py-2.5 text-xs text-(--pulso-text-muted)">
        Segredo da casa. A história de cada caso pode virar episódio; a receita (o como exato) só abre para admin na página do caso e não sai do livro.
        {abertos > 0 && <span className="ml-1 text-(--pulso-warn)">{abertos} caso{abertos === 1 ? '' : 's'} ainda aberto{abertos === 1 ? '' : 's'}.</span>}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <Chip ativo={situacao === 'rascunho'} onClick={() => setSituacao('rascunho')}>Aguardando aprovação ({porStatus('rascunho')})</Chip>
        <Chip ativo={situacao === 'aprovado'} onClick={() => setSituacao('aprovado')}>
          <CheckCircle2 className="h-3.5 w-3.5 text-(--pulso-ok)" /> Aprovados ({porStatus('aprovado')})
        </Chip>
        <Chip ativo={situacao === 'todos'} onClick={() => setSituacao('todos')}>Todos ({data?.length ?? 0})</Chip>
        <select value={area} onChange={(e) => setArea(e.target.value as AreaProblema | 'todas')} aria-label="Filtrar por área"
          className="rounded-lg border border-(--pulso-border) bg-(--pulso-surface-raised) px-2.5 py-1.5 text-xs text-(--pulso-text) focus:border-(--pulso-action) focus:outline-none">
          <option value="todas">Todas as áreas</option>
          {(Object.keys(AREAS_PROBLEMA) as AreaProblema[]).map((a) => <option key={a} value={a}>{AREAS_PROBLEMA[a]}</option>)}
        </select>
        <label className="relative ml-auto">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-(--pulso-text-subtle)" />
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="buscar no livro" aria-label="Buscar caso"
            className="w-48 rounded-lg border border-(--pulso-border) bg-(--pulso-surface-raised) py-1.5 pl-8 pr-2.5 text-xs text-(--pulso-text) placeholder:text-(--pulso-text-subtle) focus:border-(--pulso-action) focus:outline-none" />
        </label>
      </div>

      {isLoading && <div className="h-96 animate-pulse rounded-2xl bg-(--pulso-surface)" />}
      {isError && <p className="rounded-2xl border border-(--pulso-border) bg-(--pulso-surface) p-6 text-sm text-(--pulso-danger)">Não deu para ler o livro: {error instanceof Error ? error.message : 'erro'}</p>}
      {data && lista.length === 0 && (
        <p className="rounded-2xl border border-(--pulso-border) bg-(--pulso-surface) p-10 text-center text-sm text-(--pulso-text-subtle)">Nenhum caso neste filtro.</p>
      )}

      <ul className="space-y-2">
        {lista.map((p) => <CardProblema key={p.id} p={p} />)}
      </ul>
    </div>
  )
}

function CardProblema({ p }: { p: Problema }) {
  const qc = useQueryClient()
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const G = GRAVIDADE[p.gravidade]

  async function mudarStatus(status: Problema['status']) {
    setOcupado(true); setErro(null)
    const { error } = await supabase.schema('pulso_content').from('livro_problemas')
      .update({ status, atualizado_em: new Date().toISOString() }).eq('id', p.id)
    setOcupado(false)
    if (error) { setErro(error.message); return }
    await qc.invalidateQueries({ queryKey: ['livro'] })
  }

  return (
    <li className="rounded-2xl border border-(--pulso-border) bg-(--pulso-surface) p-4">
      <div className="mb-1.5 flex flex-wrap items-center gap-2 text-[11px]">
        <span className={`rounded-full px-2 py-0.5 font-medium ${G.classe}`}>{G.rotulo}</span>
        <span className="rounded-full bg-(--pulso-surface-raised) px-2 py-0.5 text-(--pulso-text-muted)">{AREAS_PROBLEMA[p.area]}</span>
        <span className="text-(--pulso-text-subtle)">
          {dataLonga(p.inicio)}{p.fim ? (p.fim !== p.inicio ? ` → ${dataLonga(p.fim)}` : '') : ' → em aberto'}
        </span>
        {p.status === 'aprovado'
          ? <span className="inline-flex items-center gap-1 rounded-full bg-(--pulso-ok)/12 px-2 py-0.5 text-(--pulso-ok)"><CheckCircle2 className="h-3 w-3" /> aprovado</span>
          : <span className="rounded-full border border-dashed border-(--pulso-border) px-2 py-0.5 text-(--pulso-text-subtle)">aguardando aprovação</span>}
      </div>
      <Link href={`/bastidores/livro/${p.slug}`} className="text-base font-semibold leading-snug text-(--pulso-text) hover:text-(--pulso-action)">{p.titulo}</Link>
      {p.sintoma && <p className="mt-1 line-clamp-2 text-sm text-(--pulso-text-muted)">{p.sintoma}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {p.status === 'rascunho' ? (
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
        <Link href={`/bastidores/livro/${p.slug}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-(--pulso-border) px-3 py-1.5 text-xs text-(--pulso-text-muted) hover:text-(--pulso-text)">
          Ver detalhes <ArrowRight className="h-3.5 w-3.5" />
        </Link>
        {erro && <span className="text-xs text-(--pulso-danger)">Não salvou: {erro}</span>}
      </div>
    </li>
  )
}

function Chip({ ativo, onClick, children }: { ativo: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-pressed={ativo} onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-colors ${ativo
        ? 'bg-(--pulso-action) font-medium text-(--pulso-on-action)'
        : 'border border-(--pulso-border) bg-(--pulso-surface) text-(--pulso-text-muted) hover:text-(--pulso-text)'}`}>
      {children}
    </button>
  )
}
