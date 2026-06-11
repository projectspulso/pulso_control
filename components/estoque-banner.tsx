'use client'

import { AlertTriangle, CalendarClock, CheckCircle2, Package } from 'lucide-react'

import { useEstoquePipeline } from '@/lib/hooks/use-estoque'

const ESTILO: Record<string, { borda: string; fundo: string; texto: string }> = {
  CRITICO: { borda: 'border-red-500/30', fundo: 'bg-red-500/10', texto: 'text-red-200' },
  ABAIXO: { borda: 'border-amber-500/30', fundo: 'bg-amber-500/10', texto: 'text-amber-200' },
  SAUDAVEL: { borda: 'border-green-500/30', fundo: 'bg-green-500/10', texto: 'text-green-200' },
  CHEIO: { borda: 'border-cyan-500/30', fundo: 'bg-cyan-500/10', texto: 'text-cyan-200' },
}

const MENSAGEM: Record<string, string> = {
  CRITICO: 'Estoque crítico — produzir HOJE para não furar a agenda.',
  ABAIXO: 'Abaixo da meta de 7 dias — priorizar produção neste ciclo.',
  SAUDAVEL: 'Dentro da meta de antecipação (7–20 dias). Manter o ritmo.',
  CHEIO: 'Acima de 20 dias — folga boa; focar qualidade e validação.',
}

export function EstoqueBanner() {
  const { data, isLoading } = useEstoquePipeline()
  if (isLoading || !data) return null

  const estilo = ESTILO[data.situacao]
  const Icone = data.situacao === 'SAUDAVEL' || data.situacao === 'CHEIO' ? CheckCircle2 : AlertTriangle

  return (
    <div className={`rounded-xl border ${estilo.borda} ${estilo.fundo} p-4 ${estilo.texto}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Icone className="h-5 w-5 shrink-0" />
          <div>
            <p className="text-sm font-semibold">
              Antecipação: {data.diasCobertura} {data.diasCobertura === 1 ? 'dia' : 'dias'} de cobertura
              <span className="ml-2 font-normal opacity-75">(meta {data.metaMinDias}–{data.metaMaxDias} dias)</span>
            </p>
            <p className="mt-0.5 text-sm opacity-85">{MENSAGEM[data.situacao]}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-4 text-sm">
          <span className="flex items-center gap-1.5">
            <Package className="h-4 w-4" /> {data.prontos} prontos
          </span>
          <span className="flex items-center gap-1.5">
            <CalendarClock className="h-4 w-4" /> {data.agendados} agendados
          </span>
          <span className="opacity-75">{data.emProducao} em produção</span>
        </div>
      </div>
    </div>
  )
}
