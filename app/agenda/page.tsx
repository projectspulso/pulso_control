'use client'

import { useMemo, useState } from 'react'
import { CalendarRange } from 'lucide-react'

import { ErrorState } from '@/components/ui/error-state'
import { PageHeader } from '@/components/layout/page-header'
import { AgendaEnxuta, ResumoTemas, type ItemAgenda } from '@/components/agenda-enxuta'
import { AgendaMes } from '@/components/agenda-mes'
import { Desafio100Dias } from '@/components/desafio-100-dias'
import { useAgenda } from '@/lib/hooks/use-agenda'

/**
 * AGENDA — três blocos, não uma grade.
 *
 * ANTES: 28 dias em grade, com filtros de canal e faixa, alternância calendário/lista/mês, camadas
 * (publicação/roteiro/ideia) e a trilha do funil — 336 linhas. Parecia completa e escondia a única
 * coisa que importa: o que publicar hoje e o que vai furar. Grade grande dá sensação de controle
 * sem entregar decisão.
 *
 * AGORA: publicar hoje · o que está travando · próximos dias. Cada item mostra o TEMA e o que ele
 * vale no Facebook, porque é o sinal que decide — história/arqueologia tem mediana 2.919 e
 * monopoliza os estouros; tecnologia/IA e produtividade ficam em ~260, com zero.
 *
 * O calendário do mês continua disponível, mas como CONSULTA no fim da página: quem precisa de
 * visão ampla abre; quem precisa decidir não paga o pedágio de procurar. A trilha do funil saiu —
 * é o assunto da /producao, e repetida aqui virava ruído.
 *
 * Quem escolhe o conteúdo de cada slot é lib/agenda/roteador.ts, via /api/agenda/popular.
 */
export default function AgendaPage() {
  const { data, isLoading, isError, refetch } = useAgenda(28)
  const [verCalendario, setVerCalendario] = useState(false)

  const hoje = new Date().toISOString().slice(0, 10)

  const itens: ItemAgenda[] = useMemo(() => {
    if (!data) return []
    return data.slots
      .map((s) => {
        const a = data.atribuicoes[s.chave]
        return {
          data: s.data,
          horario: s.horario,
          faixa: s.faixa,
          ideiaId: a?.ideiaId ?? null,
          titulo: a?.ideiaTitulo ?? null,
          estagio: a?.estagio ?? 'vazio',
        }
      })
      .filter((i) => i.data >= hoje)
      .sort((a, b) => (a.data === b.data ? a.horario.localeCompare(b.horario) : a.data < b.data ? -1 : 1))
  }, [data, hoje])

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader titulo="Agenda" subtitulo="O que publicar, e por quê" />
        <ErrorState title="Não deu pra carregar a agenda" onRetry={() => refetch()} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <PageHeader titulo="Agenda" subtitulo="O que publicar hoje, o que vem, e o que está travando" />

      {isLoading || !data ? (
        <div className="space-y-4">
          <div className="h-20 animate-pulse rounded-2xl bg-[#1a1922]" />
          <div className="h-48 animate-pulse rounded-2xl bg-[#1a1922]" />
          <div className="h-64 animate-pulse rounded-2xl bg-[#1a1922]" />
        </div>
      ) : (
        <>
          <ResumoTemas itens={itens} />
          <Desafio100Dias />
          <AgendaEnxuta itens={itens} hoje={hoje} />

          {/* CALENDÁRIO — consulta, não decisão. Fechado por padrão, de propósito. */}
          <div className="rounded-2xl border border-white/8 bg-[#1a1922] p-6">
            <button
              type="button"
              onClick={() => setVerCalendario((v) => !v)}
              className="flex w-full items-center gap-2.5 text-left"
            >
              <span className="rounded-lg bg-zinc-500/10 p-2">
                <CalendarRange className="h-5 w-5 text-zinc-400" />
              </span>
              <span className="text-lg font-semibold text-white">Calendário do mês</span>
              <span className="ml-auto text-[11px] text-zinc-500">{verCalendario ? 'esconder' : 'abrir'}</span>
            </button>
            {verCalendario && (
              <div className="mt-4">
                <AgendaMes />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
