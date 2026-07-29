'use client'

import { PageHeader } from '@/components/layout/page-header'
import { ErrorState } from '@/components/ui/error-state'
import {
  BlocoBriefing,
  BlocoFila,
  BlocoRadar,
  BlocoRedes,
  BlocoTemas,
  BlocoTendencia,
} from '@/components/decisor-blocos'
import { useDecisor, useReanalisar } from '@/lib/hooks/use-decisor'

/**
 * DECISOR — a primeira tela da sidebar, de propósito.
 *
 * As outras 12 áreas do app são a biblioteca de consulta: elas respondem "quanto foi?". Esta
 * responde a pergunta que se faz ao abrir o app e que nenhuma outra tela respondia: "o que eu
 * faço agora, e por quê?".
 *
 * A ordem dos blocos é a ordem da urgência:
 *   1. o que está estourando AGORA (só aparece se houver — reagir vale mais que analisar)
 *   2. a leitura do dia em português (faça / evite / observe)
 *   3. o número com contexto (tendência + concentração)
 *   4. que tema sorteia · o que vem na fila · papel de cada rede
 *
 * Não repete o Dashboard (que mostra a esteira travada) nem o /analytics (que é a biblioteca).
 */
export default function DecisorPage() {
  const { data, isLoading, error, refetch } = useDecisor()
  const reanalisar = useReanalisar()

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader titulo="Decisor" subtitulo="O que fazer agora, e por quê" />
        <ErrorState title="Não deu pra calcular os fatos" message={String(error)} onRetry={() => refetch()} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <PageHeader
        titulo="Decisor"
        subtitulo="O que fazer agora, e por quê — a decisão, não o gráfico"
      />

      {isLoading || !data ? (
        <div className="space-y-4">
          <div className="h-32 animate-pulse rounded-2xl bg-[#1a1922]" />
          <div className="h-64 animate-pulse rounded-2xl bg-[#1a1922]" />
          <div className="h-48 animate-pulse rounded-2xl bg-[#1a1922]" />
        </div>
      ) : (
        <>
          <BlocoRadar radar={data.fatos.radar} />

          <BlocoBriefing
            parecer={data.parecer}
            onReanalisar={() => reanalisar.mutate()}
            reanalisando={reanalisar.isPending}
          />

          {reanalisar.isError && (
            <p className="text-xs text-red-400">
              Falhou ao reanalisar: {String(reanalisar.error)}
            </p>
          )}

          <BlocoTendencia tendencia={data.fatos.tendencia} dependencia={data.fatos.dependencia} />

          <div className="grid gap-3.5 lg:grid-cols-2">
            <BlocoTemas temas={data.fatos.temasFacebook} />
            <BlocoFila fila={data.fatos.fila} />
          </div>

          <BlocoRedes redes={data.fatos.redes} />

          <p className="pt-1 text-center text-[10px] text-zinc-600">
            Fatos calculados em código sobre {data.janelaDias} dias de série · atualizado{' '}
            {new Date(data.geradoEm).toLocaleString('pt-BR')}
          </p>
        </>
      )}
    </div>
  )
}
