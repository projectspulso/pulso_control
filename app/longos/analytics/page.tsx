'use client'

import { PageHeader } from '@/components/layout/page-header'
import { usePainelLongos, type PainelEpisodio } from '@/lib/hooks/use-longos'

const CARTAO = 'rounded-2xl border border-(--pulso-border) bg-(--pulso-surface)'
const ESTADOS = ['planejado', 'agendado', 'publicado', 'recusado'] as const
const ROTULO: Record<string, string> = { planejado: 'na fila', agendado: 'agendadas', publicado: 'no ar', recusado: 'recusadas' }
const quando = (d: string | null) => (d ? new Date(d).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' }) : 'sem data')

/**
 * Analytics dos Longos. Separado do dos Curtos de propósito: o longo mede horas de exibição e retenção,
 * e os cortes não podem inflar os Shorts. Hoje mostra o que já é fato (estreia e o estado de cada peça
 * devolvido pelo digiai_mkt); as views entram quando os canais dos Bastidores existirem e forem coletados.
 */
function Episodio({ e }: { e: PainelEpisodio }) {
  const conta = (s: string) => e.pecas.filter((p) => p.status === s).length
  const noAr = e.pecas.filter((p) => p.status === 'publicado')
  const recusadas = e.pecas.filter((p) => p.status === 'recusado')
  const porRede = noAr.reduce<Record<string, number>>((m, p) => ({ ...m, [p.rede.split('_')[0]]: (m[p.rede.split('_')[0]] || 0) + 1 }), {})
  return (
    <section className={`${CARTAO} p-5`}>
      <div className="flex flex-wrap items-baseline gap-x-3">
        <h2 className="text-sm font-semibold text-(--pulso-text)">{e.codigo} · {e.titulo}</h2>
        <span className="text-xs text-(--pulso-text-muted)">{e.status.replace('_', ' ')} · estreia {quando(e.estreia)}</span>
        {e.url && <a href={e.url} target="_blank" rel="noreferrer" className="text-xs text-(--pulso-action) hover:underline">ver no YouTube</a>}
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {ESTADOS.map((s) => (
          <div key={s} className="rounded-xl border border-(--pulso-border) bg-(--pulso-bg) px-3 py-2">
            <dt className="text-xs text-(--pulso-text-muted)">Peças {ROTULO[s]}</dt>
            <dd className="text-xl font-semibold tabular-nums text-(--pulso-text)">{conta(s)}</dd>
          </div>
        ))}
      </dl>
      {Object.keys(porRede).length > 0 && (
        <p className="mt-3 text-xs text-(--pulso-text-muted)">No ar por rede: {Object.entries(porRede).map(([r, n]) => `${r} ${n}`).join(' · ')}</p>
      )}
      {recusadas.length > 0 && (
        <ul className="mt-3 space-y-1 text-xs text-(--pulso-warn)">
          {recusadas.map((p, i) => <li key={i}>{p.rede} ({p.tipo}) recusada: {p.motivo || 'sem motivo informado'}</li>)}
        </ul>
      )}
    </section>
  )
}

export default function LongosAnalyticsPage() {
  const { data, isLoading, error } = usePainelLongos()

  return (
    <div className="space-y-5">
      <PageHeader titulo="Analytics dos Longos" subtitulo="Estreia de cada episódio, o que o digiai_mkt já publicou dos cortes e, depois, horas de exibição e retenção" />
      {isLoading && <div className={`h-40 animate-pulse ${CARTAO}`} />}
      {error && <p className={`${CARTAO} p-6 text-sm text-(--pulso-danger)`}>Não deu para ler: {error.message}</p>}
      {data?.filter((e) => e.estreia || e.pecas.length > 0 || e.status !== 'planejado').map((e) => <Episodio key={e.codigo} e={e} />)}
      {data && (
        <p className="text-xs text-(--pulso-text-muted)">
          {data.filter((e) => !(e.estreia || e.pecas.length > 0 || e.status !== 'planejado')).length} episódios ainda sem estreia marcada nem peças: aparecem aqui quando entrarem na agenda.
        </p>
      )}
      <section className={`${CARTAO} p-5`}>
        <h2 className="text-sm font-semibold text-(--pulso-text)">Quando entram as views</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-(--pulso-text-muted)">
          As peças acima já são reais: o digiai_mkt devolve cada uma como agendada, no ar (com o link) ou recusada (com o motivo).
          Views, horas de exibição e retenção do episódio entram quando o canal principal e os canais de cortes dos Bastidores
          existirem: o Pulso passa a ler o canal principal pelo YouTube e os cortes pela medição do digiai_mkt, uma vez por dia,
          junto com a coleta dos Curtos. Os números dos Longos nunca somam nos Curtos.
        </p>
      </section>
    </div>
  )
}
