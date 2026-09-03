'use client'

import Link from 'next/link'
import { useDesafio100 } from '@/lib/hooks/use-desafio-100'
import { useEstoquePipeline } from '@/lib/hooks/use-estoque'
import { useHiggsfieldSaldo } from '@/lib/hooks/use-higgsfield-saldo'
import { useCadencia } from '@/lib/hooks/use-cadencia'
import { useDuplicidade } from '@/lib/hooks/use-duplicidade'

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
  const { data: cadencia } = useCadencia()
  const { data: dup } = useDuplicidade()

  const semCredito = saldo && saldo.nivel !== 'ok'
  const semEstoque = estoque && estoque.diasCobertura < 2
  const streakEmRisco = desafio && !desafio.publicouHoje && desafio.sequenciaAtual > 0
  // CADÊNCIA: dia fechado abaixo da meta na última semana, ou hoje já sem tempo de recuperar.
  // Publicar 1 em vez de 2 derrubou o canal de ~2.500 para 766 views/dia em 30/08 — este alerta
  // existe para isso nunca mais passar despercebido.
  const cadenciaEmRisco =
    !!cadencia && (cadencia.diasAbaixo > 0 || (cadencia.hoje < cadencia.meta && !cadencia.aindaDaTempo))

  // REPETIÇÃO: só entra quando ainda dá pra impedir. Par de dois já publicados é história —
  // aparecer todo dia transformaria o alerta em paisagem, que é o oposto do que ele serve.
  const repetindo = !!dup && dup.evitaveis.length > 0

  if (!semCredito && !semEstoque && !streakEmRisco && !cadenciaEmRisco && !repetindo) return null

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

      {cadenciaEmRisco && cadencia && (
        <Faixa tom={cadencia.diasAbaixo > 1 ? 'crit' : 'warn'} icone="📉" href="/publicar">
          <b className="font-semibold text-white">Cadência: </b>
          {cadencia.diasAbaixo > 0 ? (
            <>
              {b(`${cadencia.diasAbaixo} dia(s)`)} da última semana saíram abaixo de {cadencia.meta}/dia
              {cadencia.deficit > 0 && <> — {b(`${cadencia.deficit} vídeo(s)`)} deixaram de sair</>}.
              Publicar 1 em vez de 2 já derrubou o canal de ~2.500 para 766 views/dia.
            </>
          ) : (
            <>hoje saiu {b(`${cadencia.hoje} de ${cadencia.meta}`)} e o dia já passou da grade.</>
          )}
          {' '}Últimos 7 dias: {cadencia.ultimos.map((u) => u.n).join(' · ')}
        </Faixa>
      )}

      {repetindo && dup && (
        <Faixa tom="crit" icone="👯" href="/producao">
          <b className="font-semibold text-white">Repetição: </b>
          {b(`${dup.evitaveis.length} par(es)`)} contam a mesma história com títulos diferentes e
          {' '}pelo menos um lado ainda NÃO publicou.
          {dup.evitaveis.slice(0, 2).map((par) => (
            <span key={`${par.a.id}-${par.b.id}`} className="mt-1.5 block text-[12px] text-zinc-500">
              {par.a.numero != null && `#${par.a.numero} `}
              {par.a.titulo.slice(0, 46)} ↔ {par.b.numero != null && `#${par.b.numero} `}
              {par.b.titulo.slice(0, 46)}
              <span className="text-zinc-600"> · em comum: {par.termosComuns.slice(0, 4).join(', ')}</span>
            </span>
          ))}
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
