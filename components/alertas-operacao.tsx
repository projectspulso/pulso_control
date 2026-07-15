'use client'

import Link from 'next/link'
import { useDesafio100 } from '@/lib/hooks/use-desafio-100'
import { useEstoquePipeline } from '@/lib/hooks/use-estoque'
import { useHiggsfieldSaldo } from '@/lib/hooks/use-higgsfield-saldo'

/**
 * O que trava a operação AGORA: crédito, estoque e a sequência do desafio.
 *
 * Vive no Dashboard porque a pergunta é "o que eu faço hoje?" — o /analytics responde
 * "o que eu aprendo?" e não deve competir por essa atenção. Nada aqui aparece quando
 * está tudo bem: alerta que vive sempre aceso vira paisagem e para de ser lido.
 */

function Faixa({ tom, icone, href, children }: {
  tom: 'crit' | 'warn'
  icone: string
  href: string
  children: React.ReactNode
}) {
  const cor = tom === 'crit' ? 'border-l-red-500' : 'border-l-amber-400'
  return (
    <Link
      href={href}
      className={`flex items-start gap-3 rounded-r-2xl border border-zinc-800/60 ${cor} border-l-[3px] bg-zinc-900/60 px-4 py-3.5 transition-colors hover:bg-zinc-900`}
    >
      <span className="text-[15px] leading-tight">{icone}</span>
      <p className="text-[13px] leading-snug text-zinc-400">{children}</p>
    </Link>
  )
}

const b = (t: React.ReactNode) => <b className="font-semibold text-white">{t}</b>

export function AlertasOperacao() {
  const { data: saldo } = useHiggsfieldSaldo()
  const { data: estoque } = useEstoquePipeline()
  const { data: desafio } = useDesafio100()

  const semCredito = saldo && saldo.nivel !== 'ok'
  const semEstoque = estoque && estoque.diasCobertura < 2
  const streakEmRisco = desafio && !desafio.publicouHoje && desafio.sequenciaAtual > 0

  if (!semCredito && !semEstoque && !streakEmRisco) return null

  return (
    <div className="flex flex-col gap-2.5">
      {semCredito && (
        <Faixa tom={saldo!.nivel === 'critico' ? 'crit' : 'warn'} icone="💳" href="/producao/higgsfield">
          <b className="font-semibold text-white">Crédito: </b>
          o saldo Higgsfield está em {b(`${Math.round(saldo!.creditos)} créditos`)}
          {saldo!.nivel === 'critico'
            ? ' — não dá nem uma cena. O render para sem top-up manual (auto-refill está desligado).'
            : ` — dá pra ~${saldo!.videosRestantes} vídeo(s).`}
        </Faixa>
      )}

      {semEstoque && estoque && (
        <Faixa tom="crit" icone="📦" href="/producao">
          <b className="font-semibold text-white">Estoque: </b>
          {b(`${estoque.prontos} vídeo(s)`)} prontos — {b(`${estoque.diasCobertura.toFixed(1)} dia(s)`)} de cobertura
          no ritmo de {estoque.ritmoDiario}/dia da grade. Sem render, a grade quebra.
        </Faixa>
      )}

      {streakEmRisco && desafio && (
        <Faixa tom="warn" icone="🔥" href="/publicar">
          <b className="font-semibold text-white">Sequência: </b>
          {b(`${desafio.sequenciaAtual} dias seguidos`)} em jogo — nada publicado hoje ainda (dia {desafio.diaAtual}/
          {desafio.metaDias}).
        </Faixa>
      )}
    </div>
  )
}
