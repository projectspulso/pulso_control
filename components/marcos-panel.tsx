'use client'

import { useMemo, useState } from 'react'
import { Ban, Eye, Flag, Hammer, Heart, TrendingDown, TrendingUp, Users } from 'lucide-react'

import { useMarcos } from '@/lib/hooks/use-marcos'
import { calcularMarcos, type EscadaSerie, type GrupoEscada } from '@/lib/analytics/marcos'

/**
 * MARCOS — "a cada 100k views, a cada 100 seguidores, com a data" (pedido do dono), estendido a
 * toda série do banco que aguenta virar escada.
 *
 * A ESCOLHA VISUAL: o degrau é o quadrado, o INTERVALO é a linha que liga um ao outro. Fica
 * literal que o que importa é a distância entre eles, não o número em si — e a cor da linha diz
 * se aquela etapa foi mais rápida que a anterior. O último elo é tracejado: é a projeção.
 *
 * O degrau é regulável (½× · 1× · 2×) porque a régua certa muda com o tamanho do número: 100k
 * serve pra views hoje, mas quando forem 2 milhões o dono vai querer 250k.
 */

const ICONE: Record<GrupoEscada, React.ReactNode> = {
  alcance: <Eye className="h-4 w-4" />,
  audiencia: <Users className="h-4 w-4" />,
  engajamento: <Heart className="h-4 w-4" />,
  producao: <Hammer className="h-4 w-4" />,
}
const TITULO_GRUPO: Record<GrupoEscada, string> = {
  alcance: 'Alcance',
  audiencia: 'Audiência',
  engajamento: 'Engajamento',
  producao: 'Produção',
}
const SUBTITULO_GRUPO: Record<GrupoEscada, string> = {
  alcance: 'quanta gente o conteúdo atingiu',
  audiencia: 'quem ficou — o número que vira ativo',
  engajamento: 'quem reagiu ao que viu',
  producao: 'o que depende de nós, não do algoritmo',
}

const fmt = (n: number) => Math.round(n).toLocaleString('pt-BR')
const fmtCurto = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}M`
  : n >= 1_000 ? `${(n / 1_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}k`
  : String(n)
const fmtData = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })

function Escada({ escada }: { escada: EscadaSerie }) {
  const [passo, setPasso] = useState(escada.passo)
  const r = useMemo(
    () => calcularMarcos(escada.serie, passo, { inicioReal: escada.inicioReal }),
    [escada.serie, passo, escada.inicioReal]
  )

  const faltamMarcosAntigos = !escada.inicioReal && r.pisoConhecido >= passo

  return (
    <div className="rounded-xl border border-white/8 bg-black/20 p-4">
      <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        <h3 className="text-sm font-semibold text-zinc-100">{escada.titulo}</h3>
        <span className="text-sm tabular-nums text-violet-300">{fmt(r.atual)}</span>
        <span className="text-[11px] text-zinc-600">{escada.unidade}</span>
        <div className="ml-auto flex items-center gap-1">
          <span className="text-[10px] text-zinc-600">degrau</span>
          {escada.passos.map((p) => (
            <button
              key={p}
              onClick={() => setPasso(p)}
              className={`rounded px-1.5 py-0.5 text-[10px] tabular-nums transition ${
                p === passo ? 'bg-violet-500/20 text-violet-200' : 'text-zinc-600 hover:text-zinc-400'
              }`}
            >
              {fmtCurto(p)}
            </button>
          ))}
        </div>
      </div>

      {/* A ESCADA: degrau — intervalo — degrau */}
      <div className="mt-3 overflow-x-auto">
        <div className="flex min-w-min items-stretch gap-0">
          {r.marcos.length === 0 && (
            <span className="py-3 text-xs text-zinc-600">
              nenhum degrau de {fmtCurto(passo)} foi cruzado dentro do registro
            </span>
          )}
          {r.marcos.map((m, i) => (
            <div key={m.alvo} className="flex items-stretch">
              {/* elo com o degrau anterior */}
              {i > 0 || m.diasDesdeAnterior != null ? (
                <div className="flex w-16 shrink-0 flex-col items-center justify-center px-1">
                  <span
                    className={`text-[10px] font-medium tabular-nums ${
                      m.aceleracao == null ? 'text-zinc-500' : m.aceleracao >= 1 ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {m.diasDesdeAnterior != null ? `${m.diasDesdeAnterior}d` : '—'}
                  </span>
                  <div
                    className={`mt-0.5 h-px w-full ${
                      m.aceleracao == null ? 'bg-white/12' : m.aceleracao >= 1 ? 'bg-emerald-500/40' : 'bg-amber-500/40'
                    }`}
                  />
                  {m.aceleracao != null && (
                    <span className={`mt-0.5 flex items-center gap-0.5 text-[9px] ${m.aceleracao >= 1 ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {m.aceleracao >= 1 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                      {m.aceleracao}×
                    </span>
                  )}
                </div>
              ) : (
                <div className="w-2 shrink-0" />
              )}

              <div className="flex min-w-[62px] flex-col items-center justify-center rounded-lg border border-white/10 bg-[#232130] px-2.5 py-2">
                <span className="text-sm font-semibold tabular-nums text-zinc-100">{fmtCurto(m.alvo)}</span>
                <span className="text-[10px] text-zinc-500">{fmtData(m.data)}</span>
              </div>
            </div>
          ))}

          {/* projeção do próximo degrau */}
          <div className="flex items-stretch">
            <div className="flex w-16 shrink-0 flex-col items-center justify-center px-1">
              <span className="text-[10px] tabular-nums text-zinc-500">
                {r.diasAteProximo != null ? `~${r.diasAteProximo}d` : '?'}
              </span>
              <div className="mt-0.5 h-px w-full border-t border-dashed border-white/20" />
            </div>
            <div className="flex min-w-[62px] flex-col items-center justify-center rounded-lg border border-dashed border-violet-500/30 bg-violet-500/[0.04] px-2.5 py-2">
              <span className="text-sm font-semibold tabular-nums text-violet-300/80">{fmtCurto(r.proximoAlvo)}</span>
              <span className="text-[10px] text-zinc-600">
                {r.dataProximo ? fmtData(r.dataProximo) : 'sem ritmo'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-2.5 text-[10px] leading-relaxed text-zinc-600">
        Ritmo dos últimos 7 dias: <span className="text-zinc-500">{fmt(r.ritmoRecente)} {escada.unidade}/dia</span>
        {r.diasAteProximo != null && <> · faltam {fmt(r.proximoAlvo - r.atual)} para {fmtCurto(r.proximoAlvo)}</>}
        {' · '}{escada.nota}
        {faltamMarcosAntigos && r.primeiroDiaDaSerie && (
          <> <span className="text-amber-500/80">
            O registro começa em {fmtData(r.primeiroDiaDaSerie)} já em {fmt(r.pisoConhecido)}; os degraus abaixo disso
            aconteceram antes de existir medição e não têm data.
          </span></>
        )}
      </p>
    </div>
  )
}

export function MarcosPanel() {
  const { data, isLoading } = useMarcos()

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => <div key={i} className="h-64 animate-pulse rounded-2xl bg-[#1a1922]" />)}
      </div>
    )
  }

  const grupos: GrupoEscada[] = ['alcance', 'audiencia', 'engajamento', 'producao']

  return (
    <div className="space-y-3.5">
      <div className="flex flex-wrap items-center gap-2.5 rounded-2xl border border-white/8 bg-[#1a1922] px-5 py-4">
        <Flag className="h-4 w-4 shrink-0 text-violet-400" />
        <p className="text-sm text-zinc-300">
          O quadrado é o degrau; a <strong className="text-zinc-100">linha entre eles é o tempo que levou</strong> —
          verde quando a etapa foi mais rápida que a anterior, âmbar quando foi mais lenta. O último elo, tracejado,
          é a projeção pelo ritmo dos últimos 7 dias.
        </p>
      </div>

      {grupos.map((g) => {
        const doGrupo = data.escadas.filter((e) => e.grupo === g)
        if (!doGrupo.length) return null
        return (
          <div key={g} className="rounded-2xl border border-white/8 bg-[#1a1922] p-5">
            <div className="mb-3.5 flex flex-wrap items-baseline gap-2">
              <span className="text-violet-400">{ICONE[g]}</span>
              <h2 className="text-base font-semibold text-white">{TITULO_GRUPO[g]}</h2>
              <span className="text-[11px] text-zinc-600">{SUBTITULO_GRUPO[g]}</span>
            </div>
            <div className="space-y-2.5">
              {doGrupo.map((e) => <Escada key={e.id} escada={e} />)}
            </div>
          </div>
        )
      })}

      {/* O que foi medido e mesmo assim não vira degrau — calar isso viraria "não temos o dado" */}
      <div className="rounded-2xl border border-white/8 bg-[#1a1922] p-5">
        <div className="mb-3 flex items-center gap-2">
          <Ban className="h-4 w-4 text-zinc-500" />
          <h2 className="text-base font-semibold text-zinc-300">Tem dado, mas não vira degrau</h2>
        </div>
        <div className="space-y-2">
          {data.reprovadas.map((r) => (
            <p key={r.titulo} className="text-xs leading-relaxed text-zinc-500">
              <strong className="text-zinc-400">{r.titulo}</strong> — {r.motivo}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}
