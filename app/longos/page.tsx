'use client'

import Link from 'next/link'
import { CheckCircle2, Circle, CircleDashed, Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { useEpisodios, useFabrica, type EstadoFabrica } from '@/lib/hooks/use-longos'

const CARTAO = 'rounded-2xl border border-(--pulso-border) bg-(--pulso-surface)'

const ESTADO: Record<EstadoFabrica, { rotulo: string; Icone: typeof Circle; cor: string }> = {
  pronto: { rotulo: 'pronto', Icone: CheckCircle2, cor: 'text-(--pulso-ok)' },
  em_andamento: { rotulo: 'em andamento', Icone: Loader2, cor: 'text-(--pulso-action)' },
  falta: { rotulo: 'falta', Icone: CircleDashed, cor: 'text-(--pulso-warn)' },
  a_fazer: { rotulo: 'a fazer', Icone: Circle, cor: 'text-(--pulso-text-subtle)' },
}

const STATUS_EP: Record<string, string> = {
  planejado: 'planejado', roteiro_ok: 'roteiro aprovado', narracao_gerada: 'narrado',
  capturas_coletadas: 'com imagens', montado: 'montado', em_revisao: 'em revisão', publicado: 'publicado',
}

// ~150 palavras por minuto de narração em tom de conversa
const minutos = (md: string | null) => {
  const p = (md || '').trim().split(/\s+/).filter(Boolean).length
  return p ? Math.max(1, Math.round(p / 150)) : 0
}

/** A home dos Longos (05/11/2026): o que falta na fábrica e a lista de episódios dos Bastidores. */
export default function LongosPage() {
  const fab = useFabrica()
  const eps = useEpisodios()

  return (
    <div className="space-y-5">
      <PageHeader titulo="Episódios" subtitulo="Bastidores DIGIAI: vídeos longos no YouTube e a fábrica de cortes que sai de cada um" />

      <section className={`${CARTAO} p-5`}>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold text-(--pulso-text)">A fábrica: o que falta para o primeiro episódio</h2>
          {fab.data?.atualizadoEm && <span className="text-[11px] text-(--pulso-text-subtle)">atualizado em {new Date(`${fab.data.atualizadoEm}T12:00:00Z`).toLocaleDateString('pt-BR')}</span>}
        </div>
        {fab.isLoading && <div className="mt-3 h-24 animate-pulse rounded-xl bg-(--pulso-surface-raised)" />}
        {fab.error && <p className="mt-3 text-sm text-(--pulso-danger)">Não deu para ler o checklist: {fab.error.message}</p>}
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {fab.data?.itens.map((i) => {
            const E = ESTADO[i.estado] || ESTADO.a_fazer
            return (
              <li key={i.id} className="flex gap-2.5 rounded-xl bg-(--pulso-surface-raised) px-3 py-2.5">
                <E.Icone className={`mt-0.5 h-4 w-4 shrink-0 ${E.cor}`} aria-hidden />
                <div className="min-w-0">
                  <p className="text-sm text-(--pulso-text)">{i.nome} <span className={`text-[11px] ${E.cor}`}>· {E.rotulo}</span></p>
                  <p className="text-xs text-(--pulso-text-subtle)">{i.nota}</p>
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      <section className={`${CARTAO} overflow-hidden`}>
        <div className="flex flex-wrap items-baseline justify-between gap-2 px-5 pt-5">
          <h2 className="text-sm font-semibold text-(--pulso-text)">Temporada 1</h2>
          <Link href="/bastidores" className="text-xs text-(--pulso-action) hover:underline">matéria-prima: linha do tempo e livro →</Link>
        </div>
        {eps.isLoading && <div className="m-5 h-40 animate-pulse rounded-xl bg-(--pulso-surface-raised)" />}
        {eps.error && <p className="p-5 text-sm text-(--pulso-danger)">Não deu para ler os episódios: {eps.error.message}</p>}
        <ul className="mt-3 divide-y divide-(--pulso-border)">
          {eps.data?.map((e) => {
            const min = minutos(e.roteiro_md)
            return (
              <li key={e.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3">
                <span className="w-14 shrink-0 font-mono text-xs text-(--pulso-text-subtle)">{e.codigo}</span>
                <Link href={`/longos/${e.codigo}`} className="min-w-0 flex-1 text-sm text-(--pulso-text) hover:text-(--pulso-action)">{e.titulo}</Link>
                <span className="text-xs text-(--pulso-text-muted)">{min ? `roteiro ≈ ${min} min` : 'sem roteiro'}</span>
                <span className="rounded-full bg-(--pulso-surface-raised) px-2 py-0.5 text-[11px] text-(--pulso-text-muted)">{STATUS_EP[e.status] || e.status}</span>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
