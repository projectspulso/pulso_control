'use client'

import { Award, Users, UserPlus, HelpCircle } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts'
import { useBi, type BiFiltros, type BiQualidade } from '@/lib/hooks/use-bi'

const n = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : String(v))

// Paleta validada contra o fundo #1a1922 (scripts/validate_palette.js, modo dark):
// todos os pares passam CVD e visão normal. A anterior (5 cores "de marca") REPROVAVA —
// TikTok/Kwai fora da banda de luminosidade e Facebook×Instagram a ΔE 5,7 no daltonismo.
const AZUL = '#3987e5'
const LARANJA = '#d95926'
const VERDE = '#199e70'
const COR_FACETA: Record<string, string> = { facebook: AZUL, instagram: LARANJA, youtube: VERDE }

const EIXO = { fill: '#6e6b7b', fontSize: 11 }
const GRID = '#2a2833'

const TOOLTIP_BASE = {
  background: '#12111a',
  border: '1px solid #2a2833',
  borderRadius: 10,
  fontSize: 12,
  color: '#e6e4ef',
} as const

/** Facetas por rede: a identidade vem da faceta + do título, nunca só da cor. */
function FacetaRede({ rede, itens }: { rede: string; itens: BiQualidade[] }) {
  const cor = COR_FACETA[rede] || AZUL
  const dados = itens.slice(0, 5).map((q) => ({
    nome: q.titulo.length > 26 ? `${q.titulo.slice(0, 26)}…` : q.titulo,
    percentil: q.percentil,
    retencao: q.taxaRetencao,
    views: q.views,
    rotulo: `p${q.percentil}`,
  }))
  if (dados.length === 0) return null
  return (
    <div className="min-w-0">
      <div className="mb-1 flex items-baseline gap-2">
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: cor }} />
        <span className="text-xs font-semibold capitalize text-zinc-300">{rede}</span>
        <span className="text-[10px] text-zinc-600">{itens.length} vídeos</span>
      </div>
      <ResponsiveContainer width="100%" height={dados.length * 34 + 16}>
        <BarChart data={dados} layout="vertical" margin={{ top: 0, right: 34, bottom: 0, left: 0 }}>
          <CartesianGrid horizontal={false} stroke={GRID} />
          <XAxis type="number" domain={[0, 100]} hide />
          <YAxis type="category" dataKey="nome" width={150} tick={EIXO} tickLine={false} axisLine={false} />
          <Tooltip
            cursor={{ fill: '#ffffff08' }}
            contentStyle={TOOLTIP_BASE}
            formatter={(v: number, _k, p) => [
              `percentil ${v} · retenção ${p.payload.retencao}% · ${n(p.payload.views)} views`,
              '',
            ]}
          />
          <Bar dataKey="percentil" fill={cor} radius={[0, 4, 4, 0]} barSize={14}>
            <LabelList dataKey="rotulo" position="right" fill="#8b8898" fontSize={10} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

/**
 * QUALIDADE DO CRIATIVO — o que views não mostra.
 *
 * Aba própria: em Conteúdo se decide O QUE produzir; aqui se vê COMO o vídeo segura
 * quem assiste. Três perguntas, cada uma com a forma que responde a ela:
 *  - quem prende → barras por percentil, FACETADAS por rede (a retenção não é comparável
 *    entre plataformas: o YouTube passa de 100% em loop, IG/FB têm teto ~100);
 *  - prender converte? → dispersão retenção × seguidores, a pergunta do aprendizado;
 *  - alcance real → barras agrupadas: exibição não é pessoa.
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

  const porRede = new Map<string, BiQualidade[]>()
  for (const q of qualidade) {
    if (!porRede.has(q.plataforma)) porRede.set(q.plataforma, [])
    porRede.get(q.plataforma)!.push(q)
  }

  // Só o Facebook mede seguidor ganho — então é UMA série, cor única, sem legenda.
  const conversao = qualidade
    .filter((q) => q.seguidores != null && q.seguidores > 0)
    .map((q) => ({ x: q.taxaRetencao, y: q.seguidores as number, titulo: q.titulo, views: q.views }))

  const alcanceDados = alcance.map((a) => ({
    rede: a.plataforma,
    exibicoes: a.views,
    pessoas: a.reach,
    // rótulo pré-calculado: o formatter do LabelList não entrega o índice de forma confiável
    pctLabel: a.views > 0 ? `${Math.round((a.reach / a.views) * 100)}%` : '',
  }))

  return (
    <div className="space-y-3.5">
      {/* 1) QUEM PRENDE — facetado por rede */}
      <div className="rounded-2xl border border-white/8 bg-[#1a1922] p-6">
        <div className="flex flex-wrap items-baseline gap-2">
          <Award className="h-5 w-5 self-center text-amber-400" />
          <h2 className="text-lg font-semibold text-white">Quem prende</h2>
          <span className="ml-auto text-[11px] text-zinc-500">{qualidade.length} vídeos medidos</span>
        </div>
        <p className="mt-1 text-xs text-zinc-500">
          Cada vídeo comparado com os <strong>da própria rede</strong> — a retenção não é comparável
          entre plataformas. Mesmo critério que o cérebro usa pra escolher ganchos.
        </p>
        <div className="mt-4 grid gap-6 lg:grid-cols-3">
          {[...porRede.entries()]
            .sort((a, b) => b[1].length - a[1].length)
            .map(([rede, itens]) => (
              <FacetaRede key={rede} rede={rede} itens={itens} />
            ))}
        </div>
      </div>

      <div className="grid gap-3.5 lg:grid-cols-2">
        {/* 2) PRENDER CONVERTE? */}
        <div className="rounded-2xl border border-white/8 bg-[#1a1922] p-6">
          <div className="flex flex-wrap items-baseline gap-2">
            <UserPlus className="h-5 w-5 self-center text-emerald-400" />
            <h2 className="text-lg font-semibold text-white">Prender vira seguidor?</h2>
            <span className="ml-auto text-sm font-bold text-emerald-300">+{seguidoresTotal}</span>
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            Retenção × seguidores ganhos. Só o Facebook mede conversão hoje — {conversao.length} vídeos.
          </p>
          {conversao.length < 2 ? (
            <p className="mt-4 text-sm text-zinc-500">Poucos vídeos com conversão medida.</p>
          ) : (
            <ResponsiveContainer width="100%" height={230}>
              <ScatterChart margin={{ top: 12, right: 12, bottom: 24, left: 4 }}>
                <CartesianGrid stroke={GRID} />
                <XAxis
                  type="number"
                  dataKey="x"
                  name="retenção"
                  unit="%"
                  tick={EIXO}
                  tickLine={false}
                  axisLine={{ stroke: GRID }}
                  label={{ value: 'retenção (%)', position: 'insideBottom', offset: -14, fill: '#6e6b7b', fontSize: 11 }}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name="seguidores"
                  tick={EIXO}
                  tickLine={false}
                  axisLine={{ stroke: GRID }}
                  width={34}
                />
                <ZAxis type="number" dataKey="views" range={[60, 400]} />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3', stroke: '#3a3846' }}
                  contentStyle={TOOLTIP_BASE}
                  formatter={(v: number, k: string) => [k === 'seguidores' ? `+${v}` : `${v}%`, k]}
                  labelFormatter={() => ''}
                  content={({ payload }) => {
                    const p = payload?.[0]?.payload
                    if (!p) return null
                    return (
                      <div style={TOOLTIP_BASE} className="px-3 py-2">
                        <div className="font-semibold">{p.titulo}</div>
                        <div className="text-zinc-400">
                          {p.x}% de retenção · +{p.y} seguidores · {n(p.views)} views
                        </div>
                      </div>
                    )
                  }}
                />
                <Scatter data={conversao} fill={VERDE} stroke="#1a1922" strokeWidth={2} />
              </ScatterChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* 3) PESSOAS x EXIBIÇÕES */}
        <div className="rounded-2xl border border-white/8 bg-[#1a1922] p-6">
          <div className="flex flex-wrap items-baseline gap-2">
            <Users className="h-5 w-5 self-center text-sky-400" />
            <h2 className="text-lg font-semibold text-white">Pessoas × exibições</h2>
            <span className="ml-auto flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1 text-zinc-400">
                <span className="h-2 w-2 rounded-full" style={{ background: AZUL }} /> exibições
              </span>
              <span className="flex items-center gap-1 text-zinc-400">
                <span className="h-2 w-2 rounded-full" style={{ background: LARANJA }} /> pessoas
              </span>
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            A mesma pessoa reassistindo soma em <strong>exibições</strong>, não em{' '}
            <strong>pessoas</strong>. Só FB e IG entregam alcance.
          </p>
          {alcanceDados.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-500">Nenhuma rede do filtro entrega alcance.</p>
          ) : (
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={alcanceDados} margin={{ top: 16, right: 8, bottom: 4, left: 4 }} barGap={2}>
                <CartesianGrid vertical={false} stroke={GRID} />
                <XAxis dataKey="rede" tick={EIXO} tickLine={false} axisLine={{ stroke: GRID }} />
                <YAxis tick={EIXO} tickLine={false} axisLine={false} width={40} tickFormatter={n} />
                <Tooltip
                  cursor={{ fill: '#ffffff08' }}
                  contentStyle={TOOLTIP_BASE}
                  formatter={(v: number, k: string) => [n(v), k]}
                />
                <Bar dataKey="exibicoes" fill={AZUL} radius={[4, 4, 0, 0]} maxBarSize={38} />
                <Bar dataKey="pessoas" fill={LARANJA} radius={[4, 4, 0, 0]} maxBarSize={38}>
                  <LabelList dataKey="pctLabel" position="top" fill="#8b8898" fontSize={10} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* tabela — a via de acesso quando a cor/forma não serve (impressão, leitor de tela) */}
      <details className="rounded-2xl border border-white/8 bg-[#1a1922] p-6">
        <summary className="cursor-pointer text-sm font-semibold text-zinc-300">
          Ver os números em tabela
        </summary>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-xs">
            <thead className="text-zinc-500">
              <tr>
                <th className="pb-2 font-medium">Vídeo</th>
                <th className="pb-2 font-medium">Rede</th>
                <th className="pb-2 text-right font-medium">Percentil</th>
                <th className="pb-2 text-right font-medium">Retenção</th>
                <th className="pb-2 text-right font-medium">Views</th>
                <th className="pb-2 text-right font-medium">Pessoas</th>
                <th className="pb-2 text-right font-medium">Seguidores</th>
              </tr>
            </thead>
            <tbody className="text-zinc-300">
              {qualidade.slice(0, 25).map((q) => (
                <tr key={`${q.ideiaId}-${q.plataforma}`} className="border-t border-white/5">
                  <td className="max-w-[220px] truncate py-1.5" title={q.titulo}>{q.titulo}</td>
                  <td className="py-1.5 capitalize text-zinc-500">{q.plataforma}</td>
                  <td className="py-1.5 text-right">p{q.percentil}</td>
                  <td className="py-1.5 text-right">{q.taxaRetencao}%</td>
                  <td className="py-1.5 text-right text-zinc-500">{n(q.views)}</td>
                  <td className="py-1.5 text-right text-zinc-500">{q.reach != null ? n(q.reach) : '—'}</td>
                  <td className="py-1.5 text-right text-zinc-500">{q.seguidores != null ? `+${q.seguidores}` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  )
}
