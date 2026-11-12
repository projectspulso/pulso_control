'use client'

import Link from 'next/link'
import { CheckCircle2, Circle, CircleDashed, Clapperboard, Clock, Film, Loader2, Mic, PenLine, Radio } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { useEpisodios, useFabrica, type EstadoFabrica } from '@/lib/hooks/use-longos'
import { CARTAO, Numero } from '@/components/longos/ui'

const ESTADO: Record<EstadoFabrica, { rotulo: string; Icone: typeof Circle; classe: string }> = {
  pronto: { rotulo: 'pronto', Icone: CheckCircle2, classe: 'text-(--pulso-ok) border-(--pulso-ok)/30 bg-(--pulso-ok)/10' },
  em_andamento: { rotulo: 'em andamento', Icone: Loader2, classe: 'text-(--pulso-vl) border-(--pulso-vl)/30 bg-(--pulso-vl)/10' },
  falta: { rotulo: 'falta', Icone: CircleDashed, classe: 'text-(--pulso-warn) border-(--pulso-warn)/30 bg-(--pulso-warn)/10' },
  a_fazer: { rotulo: 'a fazer', Icone: Circle, classe: 'text-(--pulso-text-subtle) border-(--pulso-border) bg-(--pulso-surface-raised)' },
}

// as etapas do kanban: cada status do episódio cai numa coluna
const COLUNAS = [
  { id: 'roteiro', titulo: 'Roteiro', Icone: PenLine, status: ['planejado'] },
  { id: 'aprovado', titulo: 'Roteiro aprovado', Icone: CheckCircle2, status: ['roteiro_ok'] },
  { id: 'producao', titulo: 'Narração e imagens', Icone: Mic, status: ['narracao_gerada', 'capturas_coletadas'] },
  { id: 'montagem', titulo: 'Montagem e revisão', Icone: Film, status: ['montado', 'em_revisao', 'pronto_publicacao'] },
  { id: 'no_ar', titulo: 'No ar', Icone: Radio, status: ['publicado'] },
] as const

const minutos = (md: string | null) => {
  const p = (md || '').trim().split(/\s+/).filter(Boolean).length
  return p ? Math.max(1, Math.round(p / 150)) : 0  // ~150 palavras por minuto de narração em tom de conversa
}
const cortesMarcados = (md: string | null) => (md?.match(/✂ \*\*CORTE \d+/g) || []).length

/** Episódios dos Longos (redesenho de 12/11/2026): a fábrica em barra e a temporada em kanban por etapa. */
export default function LongosPage() {
  const fab = useFabrica()
  const eps = useEpisodios()
  const itens = fab.data?.itens || []
  const prontos = itens.filter((i) => i.estado === 'pronto').length
  const lista = eps.data || []

  return (
    <div className="space-y-5">
      <PageHeader titulo="Episódios" subtitulo="Os vídeos longos, etapa por etapa" />

      {lista.length > 0 && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Numero icone={Radio} rotulo="No ar" valor={lista.filter((e) => e.status === 'publicado').length} sub="episódios publicados" tom="ok" />
          <Numero icone={Film} rotulo="Em produção" valor={lista.filter((e) => !['planejado', 'publicado'].includes(e.status)).length} sub="aprovados até a revisão" tom="vl" />
          <Numero icone={PenLine} rotulo="No roteiro" valor={lista.filter((e) => e.status === 'planejado').length} sub="ainda a escrever" />
          <Numero icone={Clapperboard} rotulo="Cortes marcados" valor={lista.reduce((s, e) => s + cortesMarcados(e.roteiro_md), 0)} sub="em todos os roteiros" />
        </div>
      )}

      <section className={`${CARTAO} p-4`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-(--pulso-text)">A fábrica</h2>
          <span className="text-xs tabular-nums text-(--pulso-text-muted)">{prontos} de {itens.length} prontos</span>
        </div>
        {fab.isLoading && <div className="mt-3 h-16 animate-pulse rounded-lg bg-(--pulso-surface-raised)" />}
        {fab.error && <p className="mt-3 text-sm text-(--pulso-danger)">Não deu para ler o checklist: {fab.error.message}</p>}
        {itens.length > 0 && (
          <>
            <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-(--pulso-surface-raised)" role="img" aria-label={`${prontos} de ${itens.length} itens da fábrica prontos`}>
              <div className="h-full bg-(--pulso-ok)" style={{ width: `${(prontos / itens.length) * 100}%` }} />
              <div className="h-full bg-(--pulso-vl)" style={{ width: `${(itens.filter((i) => i.estado === 'em_andamento').length / itens.length) * 100}%` }} />
            </div>
            <ul className="mt-3 flex flex-wrap gap-2">
              {itens.map((i) => {
                const E = ESTADO[i.estado] || ESTADO.a_fazer
                return (
                  <li key={i.id} title={i.nota} className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${E.classe}`}>
                    <E.Icone className="h-3.5 w-3.5" aria-hidden /> {i.nome} <span className="sr-only">: {E.rotulo}</span>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </section>

      <section>
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold text-(--pulso-text)">Temporada 1</h2>
          <Link href="/bastidores" className="text-xs text-(--pulso-action) hover:underline">matéria-prima: linha do tempo e livro →</Link>
        </div>
        {eps.isLoading && <div className={`h-60 animate-pulse ${CARTAO}`} />}
        {eps.error && <p className={`${CARTAO} p-5 text-sm text-(--pulso-danger)`}>Não deu para ler os episódios: {eps.error.message}</p>}
        {lista.length > 0 && (
          <div className="grid gap-3 overflow-x-auto pb-2 md:grid-cols-5">
            {COLUNAS.map((col) => {
              const daColuna = lista.filter((e) => (col.status as readonly string[]).includes(e.status))
              return (
                <div key={col.id} className="min-w-56 rounded-xl bg-(--pulso-surface-raised) p-2">
                  <div className="mb-2 flex items-center gap-1.5 px-1">
                    <col.Icone className="h-4 w-4 text-(--pulso-text-muted)" aria-hidden />
                    <span className="text-xs font-semibold text-(--pulso-text)">{col.titulo}</span>
                    <span className="ml-auto rounded-full bg-(--pulso-surface) px-1.5 text-[11px] tabular-nums text-(--pulso-text-muted)">{daColuna.length}</span>
                  </div>
                  <ul className="space-y-2">
                    {daColuna.map((e) => {
                      const min = minutos(e.roteiro_md)
                      const nc = cortesMarcados(e.roteiro_md)
                      return (
                        <li key={e.id}>
                          <Link href={`/longos/${e.codigo}`} className={`${CARTAO} block p-3 transition-shadow hover:shadow-md`}>
                            <span className="font-mono text-[11px] text-(--pulso-text-subtle)">{e.codigo}</span>
                            <p className="mt-0.5 line-clamp-3 text-sm font-medium text-(--pulso-text)">{e.titulo}</p>
                            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-(--pulso-text-muted)">
                              <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" aria-hidden />{min ? `≈ ${min} min` : 'sem roteiro'}</span>
                              {nc > 0 && <span className="inline-flex items-center gap-1"><Clapperboard className="h-3 w-3" aria-hidden />{nc} cortes</span>}
                            </div>
                          </Link>
                        </li>
                      )
                    })}
                    {daColuna.length === 0 && <li className="px-1 py-3 text-center text-[11px] text-(--pulso-text-subtle)">nenhum</li>}
                  </ul>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
