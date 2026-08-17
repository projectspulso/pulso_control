'use client'

import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'

/**
 * RELÓGIO FIXO EM BRASÍLIA — não no fuso da máquina.
 *
 * O PORQUÊ não é decoração. Datas do PULSO vivem em dois regimes e a diferença já custou caro:
 *  · `metricas_publicacao`, `leituras_metricas` e `logs_workflows` são `timestamptz` — corretos.
 *  · `pipeline_producao.data_publicacao_planejada` é `timestamp` SEM fuso, e o conteúdo é hora de
 *    Brasília por convenção. Quem lê decide o significado.
 *
 * Em 08-09/08/2026 essa ambiguidade tirou o dia 61 do desafio do ar: o teto diário contava o dia
 * em UTC, então um vídeo publicado às 23:30 BRT caía no dia seguinte e roubava a vaga. Nada na
 * tela dizia em que fuso os números estavam.
 *
 * Aqui o relógio é ancorado em America/Sao_Paulo SEMPRE, mesmo que o navegador esteja em outro
 * fuso — é a mesma âncora que `horaMarcada()` usa no cron. Se a máquina estiver fora do Brasil, o
 * componente avisa, porque aí datas de OUTRAS telas (as que usam o fuso local) aparecem
 * deslocadas e o dono precisa saber.
 *
 * Ver docs/20_BANCO/MIGRACAO_FUSO_HORARIO.md.
 */

const FUSO = 'America/Sao_Paulo'

function agoraBRT() {
  const d = new Date()
  return {
    hora: d.toLocaleTimeString('pt-BR', { timeZone: FUSO, hour12: false }),
    data: d.toLocaleDateString('pt-BR', {
      timeZone: FUSO, weekday: 'short', day: '2-digit', month: '2-digit',
    }),
  }
}

export function Relogio() {
  // `montado` evita descasamento de hidratação: o servidor renderiza um instante e o navegador
  // outro. Sem isso o React reclama e o primeiro segundo pisca errado.
  const [montado, setMontado] = useState(false)
  const [t, setT] = useState(() => ({ hora: '--:--:--', data: '' }))

  useEffect(() => {
    setMontado(true)
    setT(agoraBRT())
    const id = setInterval(() => setT(agoraBRT()), 1000)
    return () => clearInterval(id)
  }, [])

  const fusoLocal = montado ? Intl.DateTimeFormat().resolvedOptions().timeZone : FUSO
  const foraDoBrasil = montado && fusoLocal !== FUSO

  return (
    <div
      className="mb-2 flex items-center gap-2.5 rounded-xl bg-zinc-900/50 px-3 py-2"
      title={
        foraDoBrasil
          ? `Este computador está em ${fusoLocal}. O relógio segue Brasília porque é o fuso em que a agenda e os crons trabalham.`
          : 'Horário de Brasília — o mesmo fuso da agenda e dos crons'
      }
    >
      <Clock className={`h-3.5 w-3.5 shrink-0 ${foraDoBrasil ? 'text-amber-400' : 'text-zinc-500'}`} />
      <div className="min-w-0 flex-1 leading-tight">
        <p className="font-mono text-sm tabular-nums text-zinc-200">{t.hora}</p>
        <p className="truncate text-[10px] text-zinc-500">
          {t.data}
          {foraDoBrasil && <span className="ml-1 text-amber-400/90">· máquina em {fusoLocal}</span>}
        </p>
      </div>
      <span className="shrink-0 rounded bg-zinc-800/70 px-1.5 py-0.5 text-[9px] font-semibold tracking-wider text-zinc-400">
        BRT
      </span>
    </div>
  )
}
