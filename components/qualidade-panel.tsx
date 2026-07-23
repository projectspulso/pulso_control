'use client'

import { Award, Users, UserPlus, HelpCircle } from 'lucide-react'
import { useBi, type BiFiltros } from '@/lib/hooks/use-bi'

const n = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : String(v))

const COR_REDE: Record<string, string> = {
  youtube: '#e0526b',
  instagram: '#c265d6',
  facebook: '#5b8def',
  tiktok: '#3fd0c9',
  kwai: '#f0a53f',
}

/**
 * QUALIDADE DO CRIATIVO — o que views não mostra.
 *
 * Três leituras que o app não tinha: (1) quem PRENDE, por percentil de retenção dentro
 * da própria rede; (2) alcance × views, porque views conta exibição e reach conta pessoa;
 * (3) quem vira SEGUIDOR, que é o objetivo real e só o Facebook mede hoje.
 *
 * O ranking usa o MESMO critério do /api/automation/aprender — o dono vê na tela a
 * mesma lista que o cérebro usa pra escolher os ganchos a imitar.
 */
export function QualidadePanel({ filtros }: { filtros: BiFiltros }) {
  const { data, isLoading } = useBi(filtros)

  if (isLoading) return <div className="h-96 animate-pulse rounded-2xl bg-[#1a1922]" />

  const qualidade = data?.qualidade || []
  const alcance = data?.alcancePorRede || []
  const seguidoresTotal = data?.seguidoresTotal || 0

  if (qualidade.length === 0) {
    return (
      <div className="rounded-2xl border border-white/8 bg-[#1a1922] p-6">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-cyan-400" />
          <h2 className="text-lg font-semibold text-white">Qualidade do criativo</h2>
        </div>
        <p className="mt-3 text-sm text-zinc-400">
          Sem retenção medida no filtro atual. Instagram, Facebook e YouTube entregam tempo médio
          pela API; TikTok e Kwai não — nesses dois só temos views.
        </p>
      </div>
    )
  }

  // Só quem converteu: ordenado em ABSOLUTO de propósito. A taxa por mil views infla em vídeo
  // pequeno (1 seguidor em 170 views vira 5,9/mil e lidera), então o pódio viraria ruído.
  const conversores = qualidade
    .filter((q) => (q.seguidores || 0) > 0)
    .sort((a, b) => (b.seguidores || 0) - (a.seguidores || 0))
    .slice(0, 6)

  return (
    <div className="space-y-4">
      {/* 1) QUEM PRENDE */}
      <div className="rounded-2xl border border-white/8 bg-[#1a1922] p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Award className="h-5 w-5 text-amber-400" />
          <h2 className="text-lg font-semibold text-white">Quem prende — retenção por rede</h2>
          <span className="ml-auto text-[11px] text-zinc-500">{qualidade.length} vídeos medidos</span>
        </div>
        <p className="mt-1 text-xs text-zinc-500">
          A retenção não é comparável entre plataformas — o YouTube passa de 100% quando o Short
          entra em loop. Por isso cada vídeo é medido contra os <strong>da própria rede</strong>.
        </p>
        <div className="mt-4 space-y-2">
          {qualidade.slice(0, 8).map((q) => (
            <div key={`${q.ideiaId}-${q.plataforma}`} className="flex items-center gap-3 text-sm">
              <span
                className="w-11 shrink-0 rounded-md px-1.5 py-0.5 text-center text-[11px] font-bold"
                style={{ background: `${COR_REDE[q.plataforma] || '#666'}22`, color: COR_REDE[q.plataforma] || '#999' }}
              >
                p{q.percentil}
              </span>
              <span className="min-w-0 flex-1 truncate text-zinc-200" title={q.titulo}>
                {q.titulo}
              </span>
              <span className="shrink-0 text-[11px] text-zinc-500">{q.plataforma}</span>
              <span className="w-14 shrink-0 text-right text-zinc-400">{q.taxaRetencao}%</span>
              <span className="w-12 shrink-0 text-right text-[11px] text-zinc-600">{n(q.views)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* 2) ALCANCE × VIEWS */}
        <div className="rounded-2xl border border-white/8 bg-[#1a1922] p-6">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-sky-400" />
            <h2 className="text-lg font-semibold text-white">Pessoas × exibições</h2>
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            <strong>views</strong> conta exibição (a mesma pessoa reassistindo soma);{' '}
            <strong>alcance</strong> conta pessoa distinta.
          </p>
          {alcance.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-500">Nenhuma rede do filtro entrega alcance.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {alcance.map((a) => {
                const pct = a.views > 0 ? Math.round((a.reach / a.views) * 100) : 0
                return (
                  <div key={a.plataforma}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="capitalize text-zinc-300">{a.plataforma}</span>
                      <span className="text-zinc-400">
                        {n(a.reach)} <span className="text-zinc-600">de {n(a.views)}</span>
                      </span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${Math.min(100, pct)}%`, background: COR_REDE[a.plataforma] || '#666' }}
                      />
                    </div>
                    <span className="text-[11px] text-zinc-600">{pct}% das exibições foram pessoas distintas</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* 3) QUEM VIRA SEGUIDOR */}
        <div className="rounded-2xl border border-white/8 bg-[#1a1922] p-6">
          <div className="flex flex-wrap items-center gap-2">
            <UserPlus className="h-5 w-5 text-emerald-400" />
            <h2 className="text-lg font-semibold text-white">Quem vira seguidor</h2>
            <span className="ml-auto text-sm font-bold text-emerald-300">+{seguidoresTotal}</span>
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            Seguidores ganhos por vídeo. Só o Facebook mede isso hoje — em número absoluto, não em
            taxa, que infla em vídeo pequeno.
          </p>
          {conversores.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-500">Nenhum vídeo com conversão medida no filtro.</p>
          ) : (
            <div className="mt-4 space-y-2">
              {conversores.map((q) => (
                <div key={`${q.ideiaId}-conv`} className="flex items-center gap-3 text-sm">
                  <span className="w-10 shrink-0 text-right font-bold text-emerald-300">+{q.seguidores}</span>
                  <span className="min-w-0 flex-1 truncate text-zinc-200" title={q.titulo}>
                    {q.titulo}
                  </span>
                  <span className="w-12 shrink-0 text-right text-[11px] text-zinc-600">{n(q.views)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
