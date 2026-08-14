'use client'

import { useState } from 'react'

import { PageHeader } from '@/components/layout/page-header'
import { ErrorState } from '@/components/ui/error-state'
import {
  BlocoBriefing,
  BlocoCobertura,
  BlocoFila,
  BlocoRadar,
  BlocoRedes,
  BlocoTemas,
  BlocoTendencia,
} from '@/components/decisor-blocos'
import { useDecisor, useReanalisar } from '@/lib/hooks/use-decisor'
import { AlertasOperacao } from '@/components/alertas-operacao'
import { PrecisaDeVoce } from '@/components/precisa-de-voce'

/**
 * DECISOR — a HOME do app desde 14/08/2026.
 *
 * As outras áreas são a biblioteca de consulta: respondem "quanto foi?". Esta responde a pergunta
 * que se faz ao abrir o app: "o que eu faço agora, e por quê?".
 *
 * ANTES eram DUAS telas. O Dashboard listava o que o pipeline pede (publicar N prontos, aprovar N
 * roteiros, estoque zerado) e o Decisor, o que o desempenho pede (Faça / Evite / Observe). Não
 * eram duplicatas — eram as duas METADES da mesma resposta, e quem quisesse saber o que fazer
 * tinha que abrir as duas. Agora a metade operacional (AlertasOperacao + PrecisaDeVoce) abre a
 * tela, e a leitura editorial vem logo abaixo. A contagem por etapa do pipeline não veio junto:
 * é assunto da /producao, a um clique daqui.
 *
 * POR QUE NEM TUDO É ABA (diferente do /analytics): o analytics é biblioteca — você vai lá
 * procurar uma coisa e aba é o certo. Este é briefing: a graça é ver de relance. Se o radar de
 * estouro estiver atrás de uma aba não clicada, o viral passa — que é exatamente o que ele existe
 * pra impedir. Então a CABEÇA (radar + leitura do dia) fica sempre visível, e só a evidência de
 * apoio vai pra abas, agrupada por responsabilidade:
 *   Assunto      — o que produzir (tema que sorteia + o que vem na fila)
 *   Distribuição — pra onde mandar (papel de cada rede)
 *   Ritmo        — como estamos (tendência + concentração)
 */

const ABAS = [
  { id: 'assunto' as const, label: 'Assunto' },
  { id: 'distribuicao' as const, label: 'Distribuição' },
  { id: 'ritmo' as const, label: 'Ritmo' },
  // A honestidade do módulo: de onde vem cada número, o que a API não entrega e o que é
  // digitado à mão. Pedido do dono — conclusão sobre Kwai não pode parecer medida por API.
  { id: 'cobertura' as const, label: 'Cobertura' },
]

type AbaId = (typeof ABAS)[number]['id']

export default function Home() {
  const { data, isLoading, error, refetch } = useDecisor()
  const reanalisar = useReanalisar()
  const [aba, setAba] = useState<AbaId>('assunto')

  // Alerta por aba: o que, DENTRO dela, pede ação. Vira ponto no botão + uma linha acima do
  // conteúdo — é o que impede a aba de virar esconderijo.
  const fila = data?.fatos.fila
  const tend = data?.fatos.tendencia
  const dep = data?.fatos.dependencia
  const filaSorteia = fila && fila.total > 0 ? Math.round((fila.emTemaQueSorteia / fila.total) * 100) : 100
  const alertas: Record<AbaId, string | null> = {
    assunto:
      fila && fila.total >= 5 && filaSorteia < 20
        ? `Só ${fila.emTemaQueSorteia} de ${fila.total} na fila estão no tema que sorteia no Facebook.`
        : null,
    distribuicao: null,
    cobertura: (() => {
      const c = data?.fatos.cobertura || []
      const atras = c.filter((x) => (x.atrasoDias ?? 0) >= 2)
      if (atras.length) return `${atras.map((x) => x.plataforma).join(', ')} sem atualizar há 2+ dias.`
      return null
    })(),
    ritmo:
      tend && tend.variacao <= -20
        ? `Novas views caíram ${Math.abs(tend.variacao)}% vs a semana anterior.`
        : dep?.dependente
          ? `${dep.concentracaoTop2}% do crescimento vem de 2 vídeos — cai quando eles saturam.`
          : null,
  }

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
      <PageHeader titulo="Decisor" subtitulo="O que fazer agora, e por quê — a decisão, não o gráfico" />

      {/* A METADE OPERACIONAL, primeiro: o que a esteira pede não espera análise. Só depois vem a
          leitura de desempenho. Antes isso morava numa segunda tela, e saber o que fazer exigia
          abrir as duas. */}
      <AlertasOperacao />
      <PrecisaDeVoce />

      {isLoading || !data ? (
        <div className="space-y-4">
          <div className="h-32 animate-pulse rounded-2xl bg-[#1a1922]" />
          <div className="h-64 animate-pulse rounded-2xl bg-[#1a1922]" />
          <div className="h-48 animate-pulse rounded-2xl bg-[#1a1922]" />
        </div>
      ) : (
        <>
          {/* ══════ CABEÇA — nunca em aba: é alerta e decisão ══════ */}
          <BlocoRadar radar={data.fatos.radar} />

          <BlocoBriefing
            parecer={data.parecer}
            onReanalisar={() => reanalisar.mutate()}
            reanalisando={reanalisar.isPending}
          />

          {reanalisar.isError && (
            <p className="text-xs text-red-400">Falhou ao reanalisar: {String(reanalisar.error)}</p>
          )}

          {/* ══════ ABAS — a evidência de apoio, por responsabilidade ══════
              Cada aba carrega um ponto quando o que está DENTRO dela pede ação: sem isso, uma
              fila sem tema vencedor ficaria invisível pra quem está na aba de Distribuição, e a
              aba viraria esconderijo em vez de organização. */}
          <div className="flex gap-1 overflow-x-auto rounded-full border border-white/8 bg-[#1a1922] p-1">
            {ABAS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setAba(t.id)}
                aria-selected={aba === t.id}
                role="tab"
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-[13px] transition-colors ${
                  aba === t.id ? 'bg-[#9085e9] font-medium text-[#0f0e16]' : 'text-[#6e6b7b] hover:text-[#a3a0b0]'
                }`}
              >
                {t.label}
                {alertas[t.id] && (
                  <span
                    title={alertas[t.id]!}
                    className={`h-1.5 w-1.5 rounded-full ${aba === t.id ? 'bg-[#0f0e16]' : 'bg-amber-400'}`}
                  />
                )}
              </button>
            ))}
          </div>

          {alertas[aba] && (
            <p className="-mt-1 px-1 text-[11px] text-amber-300/80">{alertas[aba]}</p>
          )}

          {aba === 'assunto' && (
            <div className="grid gap-3.5 lg:grid-cols-2">
              <BlocoTemas temas={data.fatos.temasFacebook} />
              <BlocoFila fila={data.fatos.fila} />
            </div>
          )}

          {aba === 'distribuicao' && <BlocoRedes redes={data.fatos.redes} />}

          {aba === 'ritmo' && (
            <BlocoTendencia tendencia={data.fatos.tendencia} dependencia={data.fatos.dependencia} />
          )}

          {aba === 'cobertura' && <BlocoCobertura cobertura={data.fatos.cobertura} />}

          <p className="pt-1 text-center text-[10px] text-zinc-600">
            Fatos calculados em código sobre {data.janelaDias} dias de série · atualizado{' '}
            {new Date(data.geradoEm).toLocaleString('pt-BR')}
          </p>
        </>
      )}
    </div>
  )
}
