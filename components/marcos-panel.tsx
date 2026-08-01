'use client'

import { Eye, Flag, TrendingDown, TrendingUp, Users, Video } from 'lucide-react'

import { useMarcos } from '@/lib/hooks/use-marcos'
import type { ResumoMarcos } from '@/lib/analytics/marcos'

/**
 * MARCOS — "a cada 100k views, a cada 100 seguidores, com a data" (pedido do dono).
 *
 * O marco sozinho é troféu; o que decide é o INTERVALO. Por isso a linha destaca quantos dias
 * levou desde o marco anterior e se isso acelerou ou desacelerou — 0→100k em 26 dias e
 * 100k→200k em 16 significa 1,6× mais rápido, e é ISSO que responde "estamos indo bem?".
 *
 * O que a série não sabe, a tela diz. Seguidores só têm registro desde 13/07 (já com 529
 * acumulados): os marcos anteriores não têm data e aparecem como tal, em vez de sumir em
 * silêncio ou ganhar data inventada.
 */

const fmt = (n: number) => n.toLocaleString('pt-BR')
const fmtCurto = (n: number) => (n >= 1000 ? `${n / 1000}k` : String(n))
const fmtData = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })

function Bloco({
  titulo,
  icone,
  unidade,
  resumo,
  nota,
}: {
  titulo: string
  icone: React.ReactNode
  unidade: string
  resumo: ResumoMarcos
  nota?: string
}) {
  const temMarcos = resumo.marcos.length > 0

  return (
    <div className="rounded-2xl border border-white/8 bg-[#1a1922] p-6">
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="rounded-lg bg-violet-500/10 p-2">{icone}</span>
        <h2 className="text-lg font-semibold text-white">{titulo}</h2>
        <span className="ml-auto text-[11px] text-zinc-500">
          {fmt(resumo.atual)} {unidade} agora
        </span>
      </div>

      {/* PRÓXIMO — o que está em jogo agora */}
      <div className="mt-4 rounded-xl border border-violet-500/20 bg-violet-500/[0.05] px-3.5 py-3">
        <p className="text-sm text-zinc-200">
          Próximo marco: <strong className="text-violet-300">{fmtCurto(resumo.proximoAlvo)}</strong>
          {resumo.diasAteProximo != null ? (
            <>
              {' '}— faltam <strong className="text-zinc-100">{fmt(resumo.proximoAlvo - resumo.atual)}</strong>, cerca de{' '}
              <strong className="text-zinc-100">{resumo.diasAteProximo} dia(s)</strong> no ritmo atual
              {resumo.dataProximo && <span className="text-zinc-500"> (≈ {fmtData(resumo.dataProximo)})</span>}
            </>
          ) : (
            <span className="text-zinc-500"> — sem ritmo positivo na janela recente, não dá pra projetar</span>
          )}
        </p>
        <p className="mt-0.5 text-[10px] text-zinc-600">
          ritmo dos últimos 7 dias: {fmt(resumo.ritmoRecente)} {unidade}/dia
        </p>
      </div>

      {/* MARCOS — intervalo como protagonista */}
      {!temMarcos ? (
        <p className="mt-4 text-sm text-zinc-500">Nenhum marco atingido dentro da série registrada.</p>
      ) : (
        <div className="mt-4 space-y-1.5">
          {resumo.marcos
            .slice()
            .reverse()
            .map((m) => (
              <div key={m.alvo} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-white/8 bg-black/20 px-3.5 py-2.5">
                <span className="w-16 shrink-0 text-sm font-semibold tabular-nums text-zinc-100">{fmtCurto(m.alvo)}</span>
                <span className="shrink-0 text-xs text-zinc-400">{fmtData(m.data)}</span>
                {m.diasDesdeAnterior != null ? (
                  <span className="text-xs text-zinc-400">
                    <strong className="text-zinc-200">{m.diasDesdeAnterior} dias</strong>{' '}
                    {m.ancoradoNoInicio ? 'desde o começo' : 'desde o anterior'}
                    {m.porDia != null && <span className="text-zinc-600"> · {fmt(m.porDia)}/dia</span>}
                  </span>
                ) : (
                  <span className="text-xs text-zinc-600">etapa começou antes do registro</span>
                )}
                {m.aceleracao != null && (
                  <span
                    className={`ml-auto flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[11px] ${
                      m.aceleracao >= 1 ? 'bg-emerald-500/10 text-emerald-300' : 'bg-amber-500/10 text-amber-300'
                    }`}
                    title="ritmo desta etapa dividido pelo da etapa anterior"
                  >
                    {m.aceleracao >= 1 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {m.aceleracao}×
                  </span>
                )}
              </div>
            ))}
        </div>
      )}

      {nota && <p className="mt-3 text-[10px] leading-relaxed text-zinc-600">{nota}</p>}
    </div>
  )
}

export function MarcosPanel() {
  const { data, isLoading } = useMarcos()

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-56 animate-pulse rounded-2xl bg-[#1a1922]" />
        ))}
      </div>
    )
  }

  const notaSeg =
    data.seguidores.pisoConhecido > 0
      ? `O contador diário de seguidores começou em ${data.seguidores.primeiroDiaDaSerie ? fmtData(data.seguidores.primeiroDiaDaSerie) : '—'}, já com ${fmt(data.seguidores.pisoConhecido)} acumulados. Os marcos anteriores a esse número aconteceram antes de existir registro e não têm data — preferimos deixar o buraco visível a inventar uma.`
      : undefined

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2.5 rounded-2xl border border-white/8 bg-[#1a1922] px-5 py-4">
        <Flag className="h-4 w-4 shrink-0 text-violet-400" />
        <p className="text-sm text-zinc-300">
          O marco diz onde chegamos; o <strong className="text-zinc-100">intervalo entre marcos</strong> diz se
          estamos acelerando. O selo <span className="rounded bg-emerald-500/10 px-1 text-[11px] text-emerald-300">1,6×</span>{' '}
          compara o ritmo da etapa com o da anterior.
        </p>
      </div>

      <Bloco
        titulo="Views"
        unidade="views"
        icone={<Eye className="h-5 w-5 text-violet-400" />}
        resumo={data.views}
        nota="Reconstruído da série diária por post (pulso_analytics.leituras_metricas), desde a primeira publicação em 10/06 — sem buracos."
      />
      <Bloco
        titulo="Seguidores (soma das 5 redes)"
        unidade="seguidores"
        icone={<Users className="h-5 w-5 text-violet-400" />}
        resumo={data.seguidores}
        nota={notaSeg}
      />
      <Bloco
        titulo="Vídeos publicados"
        unidade="vídeos"
        icone={<Video className="h-5 w-5 text-violet-400" />}
        resumo={data.videos}
        nota="Um vídeo conta uma vez, na data da primeira publicação — republicação em outra rede não duplica o marco."
      />
    </div>
  )
}
