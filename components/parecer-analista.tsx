'use client'

import { Compass } from 'lucide-react'
import Link from 'next/link'

import { useDecisor } from '@/lib/hooks/use-decisor'

/**
 * A LEITURA DO ANALISTA junto dos gráficos — a crítica do dono que originou tudo isto:
 * "precisamos de dados com facilitadores para o humano, não para uma AI". O /analytics tinha
 * todos os números e nenhuma frase; a conclusão ("caiu porque X") morava na cabeça de quem
 * analisava. Agora a frase mora na tela.
 *
 * Zero custo por visita: lê o parecer CACHEADO (gerado 1×/dia pelo cron /api/decisor/analisar,
 * guardado em pulso_core.configuracoes). A tela nunca dispara LLM — quem quiser reanalisar
 * agora usa o botão no /decisor.
 */
export function ParecerAnalista() {
  const { data } = useDecisor()
  const p = data?.parecer
  if (!p || !p.leitura) return null

  const quando = new Date(p.geradoEm).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.05] p-5">
      <div className="flex flex-wrap items-start gap-3">
        <span className="rounded-lg bg-indigo-500/10 p-2">
          <Compass className="h-5 w-5 text-indigo-400" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-relaxed text-zinc-200">{p.leitura}</p>
          {p.faca.length > 0 && (
            <p className="mt-2 text-[12px] text-zinc-400">
              <span className="font-semibold text-emerald-300">Faça:</span> {p.faca.join(' · ')}
            </p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <Link href="/" className="text-[11px] text-zinc-500 hover:text-zinc-300">
            ver no Decisor →
          </Link>
          <p className="mt-1 text-[10px] text-zinc-600">analisado {quando}</p>
        </div>
      </div>
    </div>
  )
}
