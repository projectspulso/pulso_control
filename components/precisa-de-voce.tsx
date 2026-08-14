'use client'

import Link from 'next/link'
import { CheckCircle2, Clapperboard, Rocket } from 'lucide-react'

import { useDashboard } from '@/lib/hooks/use-dashboard'

/**
 * O QUE O PIPELINE PEDE DE VOCÊ — a metade operacional da pergunta "o que faço agora".
 *
 * Vivia no Dashboard, tela separada do Decisor. As duas respondiam a MESMA pergunta por caminhos
 * diferentes: esta lê o estado da esteira (tem vídeo pronto? roteiro esperando OK? estoque
 * zerado?), o Briefing do Decisor lê o desempenho (faça isto, evite aquilo). Não eram duplicatas
 * — eram as duas metades da resposta, e quem quisesse saber o que fazer tinha que abrir as duas.
 *
 * Fundidas em 14/08/2026: o Decisor virou a home e este bloco entrou no topo dele. Some daqui só
 * a grade de contagem por etapa do pipeline, que é o assunto da /producao e continua a um clique.
 */
export function PrecisaDeVoce() {
  const { data } = useDashboard()
  if (!data) return null

  const acoes: { label: string; detalhe: string; href: string; urgente: boolean }[] = []
  if (data.prontosParaPublicar > 0)
    acoes.push({
      label: `Publicar ${data.prontosParaPublicar} vídeo(s) pronto(s)`,
      detalhe: 'YouTube, Instagram e TikTok saem pela API; Facebook e Kwai são manuais',
      href: '/publicar',
      urgente: true,
    })
  if (data.roteirosParaAprovar > 0)
    acoes.push({
      label: `Aprovar ${data.roteirosParaAprovar} roteiro(s)`,
      detalhe: 'Roteiros em rascunho aguardando seu OK',
      href: '/esteira',
      urgente: false,
    })
  if (data.estoqueIdeias.aprovadasLivres === 0)
    acoes.push({
      label: 'Estoque de ideias aprovadas zerado',
      detalhe: `${data.estoqueIdeias.rascunhos} rascunhos aguardando curadoria`,
      href: '/esteira',
      urgente: false,
    })

  return (
    <div className="glass rounded-2xl border border-zinc-800/50 p-6">
      <div className="flex flex-wrap items-center gap-2">
        <Rocket className="h-5 w-5 text-amber-400" />
        <h2 className="text-lg font-semibold text-white">Precisa de você</h2>
        <Link
          href="/producao"
          className="ml-auto flex items-center gap-1 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
        >
          <Clapperboard className="h-3.5 w-3.5" /> ver a esteira
        </Link>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {acoes.length === 0 && (
          <p className="flex items-center gap-2 text-sm text-green-400">
            <CheckCircle2 className="h-4 w-4" /> Tudo em dia — esteira rodando.
          </p>
        )}
        {acoes.map((a) => (
          <Link
            key={a.label}
            href={a.href}
            className={`block rounded-xl border p-3 transition-colors ${
              a.urgente
                ? 'border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20'
                : 'border-zinc-700/60 bg-zinc-900/50 hover:bg-zinc-800/60'
            }`}
          >
            <p className="text-sm font-semibold text-white">{a.label}</p>
            <p className="mt-0.5 text-xs text-zinc-400">{a.detalhe}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
