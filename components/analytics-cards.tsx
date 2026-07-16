'use client'

import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts'
import type { BiPublicacao } from '@/lib/hooks/use-bi'
import { GATES_MONETIZACAO } from '@/lib/config/monetizacao'

/**
 * Cards do /analytics — o mock virou componente.
 *
 * Regras que vieram da skill de dataviz e NÃO são estética:
 *  · A FORMA segue a pergunta: nº-herói (headline), barra (comparar), lollipop (média), linha (tempo).
 *  · Cor CATEGÓRICA segue a ENTIDADE, nunca o ranking — Facebook é âmbar mesmo caindo pra 3º.
 *  · Paleta validada por script; o par verde↔amarelo ficou em ΔE 10,3 (faixa-piso de daltonismo),
 *    então TODA rede leva rótulo direto — cor sozinha não carrega identidade aqui.
 *  · Um eixo só. Barra de UMA cor quando o comprimento já carrega a magnitude.
 */

export const COR_REDE: Record<string, string> = {
  youtube: '#3987e5', instagram: '#199e70', facebook: '#c98500', tiktok: '#008300', kwai: '#9085e9',
}
const NOME_REDE: Record<string, string> = {
  youtube: 'YouTube', instagram: 'Instagram', facebook: 'Facebook', tiktok: 'TikTok', kwai: 'Kwai',
}
const BRAND = '#9085e9'
const NEUTRO = '#514b63'

export function n(v: number) {
  return new Intl.NumberFormat('pt-BR', { notation: v >= 10000 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(v)
}
const brl = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

export function Card({ titulo, sub, children, rodape, className = '' }: {
  titulo: string; sub?: string; children: React.ReactNode; rodape?: React.ReactNode; className?: string
}) {
  return (
    <section className={`rounded-2xl border border-white/8 bg-[#1a1922] p-[18px] ${className}`}>
      <h2 className="text-[16px] font-medium tracking-[-0.01em] text-[#f5f4f8]">{titulo}</h2>
      {sub && <p className="mb-3 mt-0.5 text-xs text-[#6e6b7b]">{sub}</p>}
      {children}
      {rodape && <p className="mt-3 border-t border-white/8 pt-3 text-xs leading-snug text-[#6e6b7b]">{rodape}</p>}
    </section>
  )
}
const B = ({ children }: { children: React.ReactNode }) => <b className="font-medium text-[#f5f4f8]">{children}</b>

/* ── HERÓI: a única pergunta que decide dinheiro ─────────────────────────── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function HeroMonetizacao({ gatesCalc }: { gatesCalc: any[] }) {
  const yt = gatesCalc.find((c) => c.g.plataforma === 'youtube')
  if (!yt) return null
  const eta = yt.proj?.etaSemanas
  const ritmo = yt.proj?.porSemana
  return (
    <section className="rounded-2xl border-2 border-[#9085e9]/40 bg-linear-to-b from-[#1d1b2b] to-[#1a1922] p-[18px] sm:p-6">
      <div className="grid items-center gap-6 lg:grid-cols-[minmax(230px,330px)_1fr]">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#9085e9]">Rumo à monetização</div>
          <div className="mt-2 text-[clamp(48px,8vw,72px)] font-medium leading-[.95] tracking-[-0.04em] tabular-nums text-[#f5f4f8]">
            {yt.atual === null ? '—' : n(yt.atual)}
            <span className="text-[0.32em] font-normal tracking-normal text-[#6e6b7b]"> / {n(yt.metaEfetiva)} inscritos</span>
          </div>
          <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-[#2a2836]">
            <div className="h-full rounded-full bg-[#9085e9]" style={{ width: `${Math.max(1.5, yt.pct)}%` }} />
          </div>
          <div className="mt-2 flex justify-between text-xs">
            <span className="text-[#a3a0b0]">{yt.pct.toFixed(0)}% do 1º gate</span>
            <span className="tabular-nums text-[#fab219]">{yt.faltam !== null ? `faltam ${n(yt.faltam)}` : '—'}</span>
          </div>
        </div>
        <div>
          <p className="mb-3.5 max-w-[52ch] text-[13px] text-[#a3a0b0]">
            O YouTube é a única rede com porta de monetização própria — e <B>inscrito</B> é o gargalo, não view.
            {yt.conv != null && <> O canal converte <B>{yt.conv.toFixed(1)}%</B> das views em inscrito; faceless bom faz 1–3%.</>}
          </p>
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
            <Kpi valor={ritmo != null ? `${ritmo > 0 ? '+' : ''}${ritmo}` : 'medindo'} label="ritmo /semana" cor={ritmo != null ? 'text-[#0ca30c]' : 'text-[#6e6b7b]'} />
            <Kpi valor={eta != null ? (eta <= 8 ? `~${eta} sem` : `~${Math.round(eta / 4.3)} meses`) : '—'} label="ETA p/ o gate" />
            <Kpi valor={n(yt.pr?.views ?? 0)} label="views no YT" />
            <Kpi valor={`${n(yt.v90)} / ${n(yt.g.metaSecundariaNum ?? 0)}`} label="2º gate · 90d" cor="text-[#a3a0b0]" />
          </div>
          <p className="mt-3.5 rounded-lg bg-[#9085e9]/8 p-2 text-[11px] leading-snug text-[#c4b5fd]">⚡ <B>Alavanca:</B> {yt.g.alavanca}</p>
        </div>
      </div>
    </section>
  )
}
function Kpi({ valor, label, cor = 'text-[#f5f4f8]' }: { valor: string; label: string; cor?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <b className={`text-[19px] font-medium tabular-nums ${cor}`}>{valor}</b>
      <span className="text-[11px] text-[#6e6b7b]">{label}</span>
    </div>
  )
}

/* ── BARRAS CATEGÓRICAS: identidade (rede) ──────────────────────────────── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function CardAlcancePorRede({ porRede, totalViews }: { porRede: any[]; totalViews: number }) {
  const max = porRede[0]?.views || 1
  const kwai = porRede.find((r) => r.rede === 'kwai')
  return (
    <Card titulo="Onde o alcance nasce" sub={`Views por rede · ${n(totalViews)} no total`}
      rodape={kwai ? <>Kwai faz isso com <B>{kwai.posts} vídeos</B> — os outros com mais. Rende mais por post.</> : undefined}>
      {porRede.map((r) => (
        <div key={r.rede} className="grid grid-cols-[76px_1fr_58px] items-center gap-2.5 py-[5px]">
          <span className="text-xs text-[#a3a0b0]">{NOME_REDE[r.rede] ?? r.rede}</span>
          <div className="h-[9px] rounded-full" style={{ width: `${(r.views / max) * 100}%`, background: COR_REDE[r.rede] ?? NEUTRO }} />
          <span className="text-right text-xs tabular-nums text-[#f5f4f8]">{n(r.views)}</span>
        </div>
      ))}
    </Card>
  )
}

/* ── BARRAS DE UMA COR: o comprimento carrega a magnitude ───────────────── */
export function CardVerticais({ ranking }: { ranking: [string, { views: number }][] }) {
  const top = ranking.slice(0, 6)
  const resto = ranking.slice(6)
  const max = top[0]?.[1].views || 1
  return (
    <Card titulo="Que tema o público quer" sub="Views por vertical · o líder define a aposta">
      {top.map(([nome, v], i) => (
        <div key={nome} className={i ? 'mt-2' : ''}>
          <div className="grid grid-cols-[1fr_54px] items-center gap-2 py-[3px]">
            <span className="truncate text-[11.5px] text-[#a3a0b0]">{nome}</span>
            <span className="text-right text-[11.5px] tabular-nums text-[#a3a0b0]">{n(v.views)}</span>
          </div>
          <div className="h-[7px] rounded-full" style={{ width: `${(v.views / max) * 100}%`, background: i === 0 ? BRAND : NEUTRO }} />
        </div>
      ))}
      {resto.length > 0 && (
        <details className="mt-2.5">
          <summary className="cursor-pointer text-[11px] text-[#6e6b7b]">+ {resto.length} verticais menores</summary>
          <div className="mt-2 space-y-1">
            {resto.map(([nome, v]) => (
              <div key={nome} className="flex justify-between text-[11px] text-[#6e6b7b]"><span className="truncate">{nome}</span><span className="tabular-nums">{n(v.views)}</span></div>
            ))}
          </div>
        </details>
      )}
    </Card>
  )
}

/* ── BARRAS: melhor dia (a regra de quando publicar) ────────────────────── */
export function CardMelhorDia({ dias }: { dias: { dia: string; posts: number; media: number }[] }) {
  const com = dias.filter((d) => d.posts > 0).sort((a, b) => b.media - a.media)
  if (com.length < 2) return null
  const max = com[0].media || 1
  const vezes = com[com.length - 1].media ? com[0].media / com[com.length - 1].media : 0
  return (
    <Card titulo="Melhor dia pra publicar" sub="Média de views por vídeo, pelo dia da publicação"
      rodape={<><B>{com[0].dia}</B> rende <B>{vezes.toFixed(1)}×</B> o pior dia. A grade trata todo dia igual — deveria concentrar o melhor material aí.</>}>
      {com.map((d, i) => (
        <div key={d.dia} className={i ? 'mt-2' : ''}>
          <div className="grid grid-cols-[1fr_54px] items-center gap-2 py-[3px]">
            <span className="text-[11.5px] text-[#a3a0b0]">{d.dia} <span className="text-[#6e6b7b]">· {d.posts} vídeos</span></span>
            <span className="text-right text-[11.5px] tabular-nums text-[#a3a0b0]">{n(d.media)}</span>
          </div>
          <div className="h-[7px] rounded-full" style={{ width: `${(d.media / max) * 100}%`, background: i === 0 ? BRAND : NEUTRO }} />
        </div>
      ))}
    </Card>
  )
}

/* ── LINHA: tempo ───────────────────────────────────────────────────────── */
export function CardCrescimento({ serie, diaria, alto }: {
  serie: { data: string; views: number }[]
  diaria?: { data: string; views: number }[]
  alto?: boolean
}) {
  const pico = diaria?.length ? Math.max(...diaria.map((d) => d.views)) : 0
  const fmtDia = (v: string) => v.slice(5).split('-').reverse().join('/')
  return (
    <Card titulo="Crescimento acumulado" sub="Total de views somando tudo, dia a dia"
      rodape={<>A curva é <B>monotônica</B> e o último ponto é ancorado no total real. O miolo é aproximado porque a coleta ainda não cobre 100% dos posts todo dia. O ganho do dia abaixo <B>não</B> é o diff dessa curva — vem do delta real de cada post.</>}>
      <div className={alto ? 'h-72' : 'h-44'}>
        {serie.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-[#6e6b7b]">sem histórico no recorte</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={serie} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gCresc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3987e5" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#3987e5" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#2c2c2a" strokeDasharray="2 3" vertical={false} />
              <XAxis dataKey="data" tickFormatter={(v: string) => v.slice(5).split('-').reverse().join('/')}
                tick={{ fill: '#6e6b7b', fontSize: 10 }} tickLine={false} axisLine={{ stroke: '#383835' }} minTickGap={24} />
              <YAxis tickFormatter={(v: number) => n(v)} tick={{ fill: '#6e6b7b', fontSize: 10 }} tickLine={false} axisLine={false} width={44} />
              <Tooltip contentStyle={{ background: '#1a1922', border: '1px solid rgba(255,255,255,.14)', borderRadius: 10, fontSize: 12 }}
                labelStyle={{ color: '#a3a0b0' }}
                labelFormatter={(v: string) => new Date(v + 'T12:00:00').toLocaleDateString('pt-BR')}
                formatter={(v: number) => [n(v), 'views acumuladas']} />
              <Area type="monotone" dataKey="views" stroke="#3987e5" strokeWidth={2} fill="url(#gCresc)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Ganho do dia — painel PRÓPRIO embaixo, compartilhando o eixo do tempo.
          Não sobrepus no mesmo gráfico de propósito: acumulado (146 mil) e ganho (2-13 mil)
          vivem em escalas diferentes, e juntá-los exigiria 2 eixos Y — o truque clássico que
          deixa qualquer correlação parecer o que o autor quiser. Dois painéis empilhados
          respondem as duas perguntas sem que nenhum minta. */}
      {diaria && diaria.length > 1 && (
        <div className="mt-4 border-t border-white/8 pt-3">
          <div className="mb-1 flex items-baseline justify-between">
            <span className="text-[11px] uppercase tracking-wide text-[#6e6b7b]">Ganho do dia (só o dia, sem somar)</span>
            <span className="text-[11px] tabular-nums text-[#6e6b7b]">pico {n(pico)}</span>
          </div>
          <div className="h-28">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={diaria} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#2c2c2a" strokeDasharray="2 3" vertical={false} />
                <XAxis dataKey="data" tickFormatter={fmtDia} tick={{ fill: '#6e6b7b', fontSize: 10 }}
                  tickLine={false} axisLine={{ stroke: '#383835' }} minTickGap={24} />
                <YAxis tickFormatter={(v: number) => n(v)} tick={{ fill: '#6e6b7b', fontSize: 10 }}
                  tickLine={false} axisLine={false} width={44} />
                <Tooltip contentStyle={{ background: '#1a1922', border: '1px solid rgba(255,255,255,.14)', borderRadius: 10, fontSize: 12 }}
                  labelStyle={{ color: '#a3a0b0' }} cursor={{ fill: 'rgba(255,255,255,.04)' }}
                  labelFormatter={(v: string) => new Date(v + 'T12:00:00').toLocaleDateString('pt-BR')}
                  formatter={(v: number) => [n(v), 'views ganhas no dia']} />
                <Bar dataKey="views" fill="#514b63" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </Card>
  )
}

/* ── BULLET: distância até o gate ───────────────────────────────────────── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function CardGates({ gatesCalc }: { gatesCalc: any[] }) {
  const kwai = gatesCalc.find((c) => c.g.plataforma === 'kwai')
  return (
    <Card titulo="Distância até monetizar" sub="Seguidores vs. 1º gate de cada rede"
      rodape={kwai?.faltam != null ? <>O <B>Kwai está a {n(kwai.faltam)} seguidores</B> de liberar Lives (receita) — o gate mais perto. O YouTube é o mais valioso.</> : undefined}>
      {gatesCalc.map((c) => (
        <div key={c.g.plataforma} className="grid grid-cols-[76px_1fr_62px] items-center gap-2.5 py-[5px]">
          <span className="text-xs text-[#a3a0b0]">{c.g.label}{c.usaAtalho ? ' ⚡' : ''}</span>
          <div className="h-2.5 overflow-hidden rounded-full bg-[#2a2836]">
            <div className="h-full rounded-full" style={{ width: `${Math.max(1, c.pct)}%`, background: COR_REDE[c.g.plataforma] ?? NEUTRO }} />
          </div>
          <span className="text-right text-xs tabular-nums text-[#a3a0b0]">{c.atual === null ? '—' : n(c.atual)}/{n(c.metaEfetiva)}</span>
        </div>
      ))}
    </Card>
  )
}

/* ── DOT PLOT: ressonância (é razão, não total → forma diferente) ────────── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function CardRessonancia({ porRede }: { porRede: any[] }) {
  const ord = [...porRede].sort((a, b) => b.ressonancia - a.ressonancia)
  const max = Math.max(...ord.map((r) => r.ressonancia), 1) * 1.15
  return (
    <Card titulo="Quem realmente engaja" sub="Ressonância = likes ÷ views"
      rodape={<>A ordem <B>inverte</B> em relação ao alcance: quem mais entrega view não é quem mais engaja — e é do engajado que sai inscrito.</>}>
      <div className="space-y-3 pt-1">
        {ord.map((r) => (
          <div key={r.rede} className="grid grid-cols-[76px_1fr_40px] items-center gap-2">
            <span className="text-[11px] text-[#a3a0b0]">{NOME_REDE[r.rede] ?? r.rede}</span>
            <div className="relative h-3">
              <div className="absolute top-1/2 h-0.5 -translate-y-1/2 rounded" style={{ width: `${(r.ressonancia / max) * 100}%`, background: COR_REDE[r.rede] ?? NEUTRO }} />
              <div className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-[#1a1922]"
                style={{ left: `${(r.ressonancia / max) * 100}%`, background: COR_REDE[r.rede] ?? NEUTRO }} />
            </div>
            <span className="text-right text-[11px] tabular-nums text-[#a3a0b0]">{r.ressonancia.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </Card>
  )
}

/* ── TABELA: campeões ───────────────────────────────────────────────────── */
export function CardCampeoes({ tops, onDrill }: {
  tops: { titulo: string; vertical: string; views: number }[]; onDrill: (t: string) => void
}) {
  const top = tops.slice(0, 6)
  const total = tops.reduce((a, t) => a + t.views, 0) || 1
  return (
    <Card titulo="Os campeões" sub="Top 6 por alcance somado nas redes"
      rodape={top[0] ? <>O nº1 sozinho vale <B>{((top[0].views / total) * 100).toFixed(0)}%</B> de todo o alcance. Vale estudar o que ele fez diferente.</> : undefined}>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead><tr className="text-[11px] text-[#6e6b7b]">
            <th className="border-b border-white/8 py-1.5 text-left font-medium">Vídeo</th>
            <th className="border-b border-white/8 py-1.5 text-left font-medium">Vertical</th>
            <th className="border-b border-white/8 py-1.5 text-right font-medium">Views</th>
          </tr></thead>
          <tbody>
            {top.map((t) => (
              <tr key={t.titulo} onClick={() => onDrill(t.titulo)} className="cursor-pointer hover:bg-white/5">
                <td className="max-w-[220px] truncate border-b border-white/8 py-1.5 text-[#f5f4f8]" title={t.titulo}>{t.titulo}</td>
                <td className="border-b border-white/8 py-1.5 text-[#6e6b7b]">{t.vertical}</td>
                <td className="border-b border-white/8 py-1.5 text-right font-medium tabular-nums text-[#f5f4f8]">{n(t.views)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

/* ── MATRIZ vídeo × rede: onde CADA conteúdo performou ──────────────────── */
export function CardMatrizRedes({ matriz, onDrill }: {
  matriz: { redes: string[]; linhas: { titulo: string; total: number; porRede: Record<string, number> }[] }
  onDrill: (t: string) => void
}) {
  return (
    <Card titulo="Mesmo vídeo entre redes" sub="Onde cada conteúdo performou — clique pra abrir o detalhe">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead><tr className="text-[11px] text-[#6e6b7b]">
            <th className="border-b border-white/8 py-1.5 text-left font-medium">Vídeo</th>
            {matriz.redes.map((r) => <th key={r} className="border-b border-white/8 px-2 py-1.5 text-right font-medium capitalize">{NOME_REDE[r] ?? r}</th>)}
            <th className="border-b border-white/8 py-1.5 text-right font-medium">Total</th>
          </tr></thead>
          <tbody>
            {matriz.linhas.slice(0, 12).map((l, i) => (
              <tr key={l.titulo + i} onClick={() => onDrill(l.titulo)} className="cursor-pointer hover:bg-white/5">
                <td className="max-w-[220px] truncate border-b border-white/8 py-1.5 text-[#a3a0b0]" title={l.titulo}>{l.titulo}</td>
                {matriz.redes.map((r) => (
                  <td key={r} className="border-b border-white/8 px-2 py-1.5 text-right tabular-nums text-[#a3a0b0]">
                    {l.porRede[r] ? n(l.porRede[r]) : <span className="text-[#3a3846]">—</span>}
                  </td>
                ))}
                <td className="border-b border-white/8 py-1.5 text-right font-medium tabular-nums text-[#f5f4f8]">{n(l.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

/* ── FINANCEIRO ─────────────────────────────────────────────────────────── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function CardCustos({ resumo }: { resumo: any }) {
  if (!resumo) return null
  return (
    <Card titulo="Custo da operação" sub="No recorte selecionado"
      rodape={<>Cada vídeo custa <B>{brl(resumo.custoPorVideo)}</B> · <B>{brl(resumo.custoPorView)}</B> por view. Receita: <B>{brl(resumo.receita)}</B> — nenhum gate aberto ainda.</>}>
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <Kpi valor={brl(resumo.custoProducao)} label="produção no recorte" />
        <Kpi valor={brl(resumo.custoPorVideo)} label="custo por vídeo" cor="text-[#fab219]" />
        <Kpi valor={brl(resumo.assinaturas)} label="assinaturas /mês" />
        <Kpi valor={brl(resumo.receita)} label="receita" cor="text-[#6e6b7b]" />
      </div>
    </Card>
  )
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function CardQuandoPaga({ gatesCalc }: { gatesCalc: any[] }) {
  return (
    <Card titulo="Quando isso se paga" sub="Progresso até o 1º gate de cada rede · receita ainda é R$ 0"
      rodape={<>O <B>Kwai</B> é o gate mais perto; o <B>YouTube</B> é o que paga de verdade. Ver o plano em <span className="text-[#a3a0b0]">docs/40_PRODUTO/18_PLANO_MONETIZACAO.md</span>.</>}>
      {gatesCalc.map((c) => (
        <div key={c.g.plataforma} className="grid grid-cols-[76px_1fr_44px] items-center gap-2.5 py-[5px]">
          <span className="text-xs text-[#a3a0b0]">{c.g.label}{c.usaAtalho ? ' ⚡' : ''}</span>
          <div className="h-2.5 overflow-hidden rounded-full bg-[#2a2836]">
            <div className="h-full rounded-full" style={{ width: `${Math.max(1, c.pct)}%`, background: COR_REDE[c.g.plataforma] ?? NEUTRO }} />
          </div>
          <span className="text-right text-xs tabular-nums text-[#a3a0b0]">{c.pct.toFixed(0)}%</span>
        </div>
      ))}
    </Card>
  )
}

/* ── DECISÃO (o cérebro) ────────────────────────────────────────────────── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function CardDecisao({ decisao, filtros, setFiltros }: { decisao: any; filtros: any; setFiltros: any }) {
  const COR: Record<string, string> = { produzir: 'text-[#0ca30c]', manter: 'text-[#a3a0b0]', segurar: 'text-[#d03b3b]', testar: 'text-[#fab219]' }
  const LAB: Record<string, string> = { produzir: '🚀 produzir', manter: '➡️ manter', segurar: '🛑 segurar', testar: '🧪 testar' }
  return (
    <Card titulo="Decisão · onde investir" sub="Cruza o que foi criado × o que rende — clique numa linha pra filtrar a página"
      rodape={decisao.totalPublicados < 20 ? <>⚠ Base pequena ({decisao.totalPublicados} vídeos com métrica) — a recomendação firma conforme publicar mais.</> : undefined}>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead><tr className="text-[11px] text-[#6e6b7b]">
            <th className="border-b border-white/8 py-1.5 text-left font-medium">Canal</th>
            <th className="border-b border-white/8 px-1 py-1.5 text-right font-medium">Estq</th>
            <th className="border-b border-white/8 px-1 py-1.5 text-right font-medium">Pub</th>
            <th className="border-b border-white/8 px-1 py-1.5 text-right font-medium">Méd/vídeo</th>
            <th className="border-b border-white/8 px-1 py-1.5 text-right font-medium">Hook</th>
            <th className="border-b border-white/8 py-1.5 text-right font-medium">Ação</th>
          </tr></thead>
          <tbody>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {decisao.canais.map((c: any) => (
              <tr key={c.canalId}
                onClick={() => setFiltros((f: any) => ({ ...f, canalId: f.canalId === c.canalId ? 'todos' : c.canalId }))}
                className={`cursor-pointer ${filtros.canalId === c.canalId ? 'bg-[#9085e9]/10' : 'hover:bg-white/5'}`}>
                <td className="border-b border-white/8 py-1.5 text-[#f5f4f8]">{c.nome}</td>
                <td className="border-b border-white/8 px-1 py-1.5 text-right tabular-nums text-[#6e6b7b]">{c.roteirosProntos}</td>
                <td className="border-b border-white/8 px-1 py-1.5 text-right tabular-nums text-[#6e6b7b]">{c.publicados}</td>
                <td className="border-b border-white/8 px-1 py-1.5 text-right font-medium tabular-nums text-[#f5f4f8]">{c.publicados ? n(c.mediaViews) : '—'}</td>
                <td className="border-b border-white/8 px-1 py-1.5 text-right tabular-nums text-[#6e6b7b]">{c.notaHookMedia ?? '—'}</td>
                <td className={`border-b border-white/8 py-1.5 text-right font-medium ${COR[c.acao]}`}>{LAB[c.acao]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

/* ── MODAL drill-down ───────────────────────────────────────────────────── */
export function ModalDrill({ titulo, publicacoes, onClose }: {
  titulo: string; publicacoes: BiPublicacao[]; onClose: () => void
}) {
  const pubs = publicacoes.filter((p) => p.ideiaTitulo === titulo).sort((a, b) => b.views - a.views)
  const total = pubs.reduce((a, p) => a + p.views, 0)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-white/14 bg-[#1a1922] p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-[15px] font-medium text-[#f5f4f8]">{titulo}</h3>
          <button onClick={onClose} className="text-[#6e6b7b] hover:text-[#f5f4f8]" aria-label="Fechar">✕</button>
        </div>
        <p className="mt-1 text-xs text-[#6e6b7b]">{n(total)} views somando {pubs.length} rede(s)</p>
        <div className="mt-4 space-y-2">
          {pubs.map((p) => (
            <div key={p.id} className="grid grid-cols-[80px_1fr_60px] items-center gap-2">
              <span className="text-xs text-[#a3a0b0]">{NOME_REDE[p.plataforma] ?? p.plataforma}</span>
              <div className="h-2 overflow-hidden rounded-full bg-[#2a2836]">
                <div className="h-full rounded-full" style={{ width: `${total ? (p.views / (pubs[0]?.views || 1)) * 100 : 0}%`, background: COR_REDE[p.plataforma] ?? NEUTRO }} />
              </div>
              <span className="text-right text-xs tabular-nums text-[#f5f4f8]">{n(p.views)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export const ABAS = [
  { id: 'geral' as const, label: 'Visão geral' },
  { id: 'conteudo' as const, label: 'Conteúdo' },
  { id: 'audiencia' as const, label: 'Audiência' },
  { id: 'crescimento' as const, label: 'Crescimento' },
  { id: 'financeiro' as const, label: 'Financeiro' },
]
export { GATES_MONETIZACAO }
