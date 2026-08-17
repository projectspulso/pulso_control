'use client'

import { useEffect, useState } from 'react'

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
 * A âncora é `America/Sao_Paulo` SEMPRE — a mesma de `horaMarcada()` no cron e de `diaBRT()` no
 * teto diário. Se a máquina estiver em outro fuso, avisa em âmbar: aí as datas de OUTRAS telas
 * (que formatam no fuso local) aparecem deslocadas e o dono precisa saber.
 *
 * A FORMA segue a marca: o ponto pulsa (é o pulso do PULSO) e a hora usa o gradiente
 * roxo→rosa do logo. O relógio anterior era um ícone genérico cinza e destoava do resto.
 *
 * Ver docs/20_BANCO/MIGRACAO_FUSO_HORARIO.md.
 */

const FUSO = 'America/Sao_Paulo'

function agoraBRT() {
  const d = new Date()
  const hora = d.toLocaleTimeString('pt-BR', { timeZone: FUSO, hour12: false })
  return {
    // separa em partes para o ":" poder bater sozinho, sem piscar os números junto
    hh: hora.slice(0, 2),
    mm: hora.slice(3, 5),
    ss: hora.slice(6, 8),
    data: d.toLocaleDateString('pt-BR', {
      timeZone: FUSO, weekday: 'short', day: '2-digit', month: '2-digit',
    }),
  }
}

export function Relogio() {
  // `montado` evita descasamento de hidratação: o servidor renderiza um instante e o navegador
  // outro. Sem isso o React reclama e o primeiro segundo pisca errado.
  const [montado, setMontado] = useState(false)
  const [t, setT] = useState(() => ({ hh: '--', mm: '--', ss: '--', data: '' }))

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
      className={`group relative mb-2 overflow-hidden rounded-xl border p-3 transition-colors ${
        foraDoBrasil
          ? 'border-amber-500/30 bg-amber-500/[0.06]'
          : 'border-purple-500/20 bg-linear-to-r from-purple-600/10 via-pink-600/5 to-transparent'
      }`}
      title={
        foraDoBrasil
          ? `Este computador está em ${fusoLocal}. O relógio segue Brasília porque é o fuso em que a agenda e os crons trabalham.`
          : 'Horário de Brasília — o mesmo fuso da agenda e dos crons'
      }
    >
      <div className="flex items-center gap-2.5">
        {/* O pulso do PULSO: bate junto com o segundo que passa. */}
        <span className="relative flex h-2 w-2 shrink-0">
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${
              foraDoBrasil ? 'bg-amber-400' : 'bg-pink-400'
            }`}
          />
          <span
            className={`relative inline-flex h-2 w-2 rounded-full ${
              foraDoBrasil ? 'bg-amber-500' : 'bg-linear-to-br from-purple-500 to-pink-500'
            }`}
          />
        </span>

        <p className="font-mono text-base font-bold leading-none tabular-nums">
          <span className="bg-linear-to-r from-purple-300 via-pink-300 to-purple-300 bg-clip-text text-transparent">
            {t.hh}
          </span>
          <span className="animate-pulse text-pink-400/70">:</span>
          <span className="bg-linear-to-r from-pink-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
            {t.mm}
          </span>
          <span className="ml-0.5 text-[11px] font-semibold text-zinc-500">{t.ss}</span>
        </p>

        <span className="ml-auto shrink-0 rounded border border-purple-500/25 bg-purple-500/10 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-purple-300">
          BRT
        </span>
      </div>

      <p className="mt-1 truncate text-[10px] capitalize text-zinc-500">
        {t.data}
        {foraDoBrasil && (
          <span className="ml-1 normal-case text-amber-400/90">· máquina em {fusoLocal}</span>
        )}
      </p>
    </div>
  )
}
