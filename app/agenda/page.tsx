'use client'

import { useMemo } from 'react'

import { ErrorState } from '@/components/ui/error-state'
import { PageHeader } from '@/components/layout/page-header'
import { AgendaEnxuta, BannerEstouro, ResumoTemas, type ItemAgenda } from '@/components/agenda-enxuta'
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
 * AGORA: publicar hoje · o que está travando · calendário. Cada item mostra o TEMA e o que ele
 * vale no Facebook, porque é o sinal que decide — história/arqueologia detém os 6 estouros de 48
 * dias; tecnologia/IA e produtividade nunca produziram um.
 *
 * UM CALENDÁRIO SÓ. A primeira versão tinha "próximos dias" (lista) MAIS o "calendário do mês"
 * logo abaixo — duas visões do mesmo plano. O dono cortou: "parece duplicidade e sem função,
 * emagrecer é ter um local só para ver as coisas". Ficou o calendário, com o link do arquivo em
 * cada slot, pra ir da data até o vídeo sem trocar de tela. A trilha do funil também saiu — é
 * assunto da /producao, e repetida aqui virava ruído.
 *
 * Quem escolhe o conteúdo de cada slot é lib/agenda/roteador.ts, via /api/agenda/popular.
 */
export default function AgendaPage() {
  const { data, isLoading, isError, refetch } = useAgenda(28)

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
          videoUrl: a?.videoUrl ?? null,
          numero: a?.numero ?? null,
          corpo: a?.corpo ?? null,
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
          <BannerEstouro />
          <ResumoTemas itens={itens} />
          <Desafio100Dias />
          <AgendaEnxuta itens={itens} hoje={hoje} />
        </>
      )}
    </div>
  )
}
