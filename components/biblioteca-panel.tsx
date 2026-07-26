'use client'

import { Library, Recycle, AlertTriangle, Layers } from 'lucide-react'
import { useBancoClipsCatalogo } from '@/lib/hooks/use-banco-clips'

/**
 * BIBLIOTECA como ATIVO — a economia dos clips reusáveis (o /assets navega a galeria; aqui é o
 * valor econômico). Responde: quanto a biblioteca economiza, quais clips estão saturados (fadiga),
 * e quais temas estão em escassez vs excesso.
 *
 * Custo evitado é ESTIMATIVA rotulada: cada reuso é uma geração que não aconteceu. Uso o custo do
 * tier que o reuso mais diretamente substitui (Veo ~8 créditos ≈ R$8). Não inventa dado de licença
 * (o campo não existe — são clips gerados por nós).
 */

const CUSTO_POR_REUSO_BRL = 8 // 1 reuso ≈ 1 geração Veo evitada (~8cr). Estimativa conservadora.
const FADIGA_LIMITE = 3 // usos a partir daí = risco de repetição visual

export function BibliotecaPanel() {
  const { data: catalogo, isLoading } = useBancoClipsCatalogo()

  if (isLoading) return <div className="h-72 animate-pulse rounded-2xl bg-[#1a1922]" />
  if (!catalogo || catalogo.length === 0) {
    return (
      <div className="rounded-2xl border border-white/8 bg-[#1a1922] p-6">
        <div className="flex items-center gap-2">
          <Library className="h-5 w-5 text-cyan-400" />
          <h2 className="text-lg font-semibold text-white">Biblioteca</h2>
        </div>
        <p className="mt-3 text-sm text-zinc-400">Catálogo indisponível.</p>
      </div>
    )
  }

  const total = catalogo.length
  const usados = catalogo.filter((c) => c.usos > 0)
  const usosTotal = catalogo.reduce((s, c) => s + c.usos, 0)
  const economia = usosTotal * CUSTO_POR_REUSO_BRL
  const fadiga = catalogo.filter((c) => c.usos >= FADIGA_LIMITE).sort((a, b) => b.usos - a.usos)

  // temas: contagem de clips por tema (escassez = poucos; excesso = muitos)
  const porTema = new Map<string, number>()
  for (const c of catalogo) porTema.set(c.tema || '(sem tema)', (porTema.get(c.tema || '(sem tema)') || 0) + 1)
  const temas = [...porTema.entries()].sort((a, b) => a[1] - b[1])
  const escassos = temas.filter(([, n]) => n <= 3).slice(0, 8)
  const fartos = [...temas].reverse().slice(0, 6)

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-4">
        <Kpi titulo="Clips no acervo" valor={String(total)} icon={<Layers className="h-4 w-4 text-sky-400" />} />
        <Kpi titulo="Já reusados" valor={`${usados.length}`} nota={`${Math.round((usados.length / total) * 100)}% do acervo`} icon={<Recycle className="h-4 w-4 text-emerald-400" />} />
        <Kpi titulo="Reusos totais" valor={String(usosTotal)} nota="1 reuso = 1 geração evitada" />
        <Kpi titulo="Economia estimada" valor={`~R$ ${economia}`} nota="≈ reusos × R$8 (Veo evitado)" />
      </div>

      {/* fadiga */}
      <div className="rounded-2xl border border-white/8 bg-[#1a1922] p-6">
        <div className="flex flex-wrap items-baseline gap-2">
          <AlertTriangle className="h-5 w-5 self-center text-amber-400" />
          <h2 className="text-lg font-semibold text-white">Fadiga — clips muito reusados</h2>
          <span className="ml-auto text-[11px] text-zinc-500">{fadiga.length} clips com {FADIGA_LIMITE}+ usos</span>
        </div>
        <p className="mt-1 text-xs text-zinc-500">
          Clip repetido demais cansa o olho de quem segue várias redes. A partir de {FADIGA_LIMITE} usos, vale poupar.
        </p>
        {fadiga.length === 0 ? (
          <p className="mt-4 text-sm text-emerald-300/80">Nenhum clip saturado — reuso ainda saudável.</p>
        ) : (
          <div className="mt-3 space-y-1.5">
            {fadiga.slice(0, 8).map((c) => (
              <div key={c.id} className="flex items-center gap-3 text-sm">
                <span className="w-8 shrink-0 text-right font-bold text-amber-300">{c.usos}×</span>
                <span className="min-w-0 flex-1 truncate text-zinc-300" title={c.prompt}>{c.prompt || c.id}</span>
                <span className="shrink-0 rounded bg-zinc-800/70 px-1.5 py-0.5 text-[10px] text-zinc-500">{c.tema}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* escassez vs excesso */}
      <div className="grid gap-3.5 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/8 bg-[#1a1922] p-6">
          <h3 className="mb-1 text-sm font-semibold text-zinc-200">Temas em escassez</h3>
          <p className="mb-3 text-xs text-zinc-500">Poucos clips — se produzir muito desse tema, o acervo não cobre e cai pra geração paga.</p>
          <div className="space-y-1.5">
            {escassos.map(([tema, n]) => (
              <div key={tema} className="flex items-center justify-between text-sm">
                <span className="truncate text-zinc-300">{tema}</span>
                <span className="tabular-nums text-amber-400">{n} clip{n > 1 ? 's' : ''}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-white/8 bg-[#1a1922] p-6">
          <h3 className="mb-1 text-sm font-semibold text-zinc-200">Temas com folga</h3>
          <p className="mb-3 text-xs text-zinc-500">Bastante acervo — dá pra produzir esses temas quase de graça.</p>
          <div className="space-y-1.5">
            {fartos.map(([tema, n]) => (
              <div key={tema} className="flex items-center justify-between text-sm">
                <span className="truncate text-zinc-300">{tema}</span>
                <span className="tabular-nums text-emerald-400">{n} clips</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function Kpi({ titulo, valor, nota, icon }: { titulo: string; valor: string; nota?: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-[#1a1922] p-4">
      <div className="flex items-center gap-1.5">{icon}<p className="text-[11px] text-zinc-500">{titulo}</p></div>
      <p className="mt-1 text-2xl font-semibold text-white">{valor}</p>
      {nota && <p className="text-[10px] text-zinc-600">{nota}</p>}
    </div>
  )
}
