'use client'

import { PageHeader } from '@/components/layout/page-header'
import { useLongosPublicados } from '@/lib/hooks/use-longos'

const CARTAO = 'rounded-2xl border border-(--pulso-border) bg-(--pulso-surface)'
const inteiro = new Intl.NumberFormat('pt-BR')

/**
 * Analytics dos Longos (05/11/2026). Fica separado do Analytics dos Curtos de propósito: o longo
 * mede horas de exibição e retenção ao longo do vídeo, e os cortes não podem inflar os Shorts.
 */
export default function LongosAnalyticsPage() {
  const { data, isLoading, error } = useLongosPublicados()

  return (
    <div className="space-y-5">
      <PageHeader titulo="Analytics dos Longos" subtitulo="Horas de exibição, retenção e o que cada corte trouxe de volta para o episódio" />
      {isLoading && <div className={`h-40 animate-pulse ${CARTAO}`} />}
      {error && <p className={`${CARTAO} p-6 text-sm text-(--pulso-danger)`}>Não deu para ler: {error.message}</p>}
      {data && data.length === 0 && (
        <section className={`${CARTAO} p-6`}>
          <h2 className="text-sm font-semibold text-(--pulso-text)">Nenhum vídeo longo publicado ainda</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-(--pulso-text-muted)">
            Quando o primeiro episódio sair, esta tela mostra, por episódio: horas de exibição (o que conta para a
            monetização do YouTube), retenção minuto a minuto, de onde veio o público e quantas views cada corte gerou
            nas 5 redes e quantas pessoas ele levou ao episódio.
          </p>
        </section>
      )}
      {data && data.length > 0 && (
        <section className={`${CARTAO} overflow-hidden`}>
          <ul className="divide-y divide-(--pulso-border)">
            {data.map((v, i) => (
              <li key={i} className="flex flex-wrap items-center gap-x-4 px-5 py-3 text-sm">
                <span className="min-w-0 flex-1 text-(--pulso-text)">{v.titulo}</span>
                <span className="text-xs text-(--pulso-text-muted)">{v.plataforma}</span>
                <span className="tabular-nums text-(--pulso-text-muted)">{inteiro.format(v.views)} views</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
