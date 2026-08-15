'use client'

import { FlaskConical } from 'lucide-react'

import { ROTULO_FORMA, type FormaHook } from '@/lib/automation/forma-hook.constantes'
import { useFormasHook } from '@/lib/hooks/use-formas-hook'

/**
 * EXPERIMENTO DO GANCHO — julgado por retenção aos 5 segundos.
 *
 * A régua antiga (`nota_hook`, 1 a 5) não separava nada: nota 4 rendia 2.456 views de mediana e
 * nota 5 rendia 2.426. Aqui a variável é a FORMA do gancho, sorteada por rodízio na geração, e o
 * critério é retenção — não views, que variam 74% e exigiriam 221 vídeos por forma.
 *
 * A coluna @5s é o árbitro. A @3s fica ao lado só como controle: ela quase não varia (todo mundo
 * assiste 3 segundos), então diferença ali é ruído. Views aparecem por último, como contexto.
 */

/** Abaixo disso a diferença ainda é sorte — não deixa a tela sugerir vencedor cedo demais. */
const N_MINIMO = 5

export function FormasHookPanel() {
  const { data, isLoading } = useFormasHook()

  if (isLoading) return <div className="skeleton h-48 w-full rounded-2xl" />
  if (!data) return null

  const comAmostra = data.formas.filter((f) => f.n > 0)
  const maduras = data.formas.filter((f) => f.n >= N_MINIMO)
  const melhor = maduras.length >= 2 ? maduras[0] : null

  return (
    <div className="glass rounded-2xl border border-zinc-800/50 p-6">
      <div className="flex flex-wrap items-center gap-2">
        <FlaskConical className="h-5 w-5 text-teal-400" />
        <h2 className="text-lg font-semibold text-white">Forma do gancho × retenção</h2>
        <span className="ml-auto text-[11px] text-zinc-500">
          medido só em YouTube e Facebook — TikTok e Kwai não entregam curva
        </span>
      </div>

      <p className="mt-1.5 text-xs text-zinc-400">
        O critério é a <strong className="text-zinc-200">retenção aos 5 segundos</strong>, não views:
        views variam 74% e exigiriam 221 vídeos por forma; a retenção @5s varia 11% e responde com 5.
      </p>

      {comAmostra.length === 0 ? (
        <p className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-sm text-zinc-400">
          Nenhum roteiro gerado com forma sorteada ainda. O rodízio começa no próximo roteiro — os
          {' '}{data.semForma} anteriores não registraram a forma e ficam de fora da comparação.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800/50 text-left text-xs uppercase tracking-wider text-zinc-500">
                <th className="py-2 pr-4">Forma</th>
                <th className="px-3 py-2 text-right">n</th>
                <th className="px-3 py-2 text-right">@3s</th>
                <th className="px-3 py-2 text-right text-teal-300">@5s</th>
                <th className="px-3 py-2 text-right">@8s</th>
                <th className="px-3 py-2 text-right text-zinc-600">views</th>
              </tr>
            </thead>
            <tbody>
              {data.formas.map((f) => {
                const madura = f.n >= N_MINIMO
                return (
                  <tr key={f.forma} className="border-b border-zinc-800/30">
                    <td className="py-2.5 pr-4 text-zinc-200">{ROTULO_FORMA[f.forma as FormaHook] || f.forma}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      <span className={madura ? 'text-zinc-300' : 'text-amber-300/80'} title={madura ? '' : `amostra pequena — precisa de ${N_MINIMO}`}>
                        {f.n}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-zinc-500">
                      {f.ret3 != null ? `${f.ret3.toFixed(0)}%` : '—'}
                    </td>
                    <td className={`px-3 py-2.5 text-right font-semibold tabular-nums ${madura ? 'text-teal-300' : 'text-zinc-600'}`}>
                      {f.ret5 != null ? `${f.ret5.toFixed(0)}%` : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-zinc-400">
                      {f.ret8 != null ? `${f.ret8.toFixed(0)}%` : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-zinc-600">
                      {f.medianaViews != null ? Math.round(f.medianaViews) : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-3 text-[11px] text-zinc-600">
        {melhor
          ? `Com ${N_MINIMO}+ vídeos, "${ROTULO_FORMA[melhor.forma as FormaHook]}" lidera aos 5s. Ainda assim, só vale trocar a régua depois que 3 formas amadurecerem.`
          : `Nenhuma forma alcançou ${N_MINIMO} vídeos — sem vencedor até lá, e a tela não vai sugerir um.`}
      </p>
    </div>
  )
}
