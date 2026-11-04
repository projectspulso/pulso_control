'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, CheckCircle2, Download, Search, ShieldCheck } from 'lucide-react'
import { useControleVideos } from '@/lib/hooks/use-controle-videos'
import { ControleBarras } from '@/components/controle-barras'
import { controleCsv, NOME_REDE, REDES, type Rede, type RedeControle, type VideoControle } from '@/lib/analytics/controle'

const compacto = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 })
const inteiro = new Intl.NumberFormat('pt-BR')
const quando = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'
const dia = (iso: string) => (iso ? new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '—')

const CARTAO = 'rounded-2xl border border-(--pulso-border) bg-(--pulso-surface)'
const PASSO = 60

type Filtro = 'todos' | 'alerta' | Rede
type Ordem = 'recentes' | 'views'

export function ControleVideosPanel() {
  const { data, isLoading, isError, error } = useControleVideos()
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [ordem, setOrdem] = useState<Ordem>('recentes')
  const [limite, setLimite] = useState(PASSO)

  const lista = useMemo(() => {
    if (!data) return []
    const q = busca.trim().toLowerCase()
    return data.videos
      .filter((v) => !q || v.titulo.toLowerCase().includes(q) || String(v.numero ?? '').includes(q.replace('#', '')))
      .filter((v) => filtro === 'todos' || (filtro === 'alerta' ? v.alertas.length > 0 : v.alertas.some((a) => a.rede === filtro)))
      .sort((a, b) => (ordem === 'views' ? b.totalViews - a.totalViews : b.publicadoEm.localeCompare(a.publicadoEm)))
  }, [data, busca, filtro, ordem])

  if (isLoading) return <div className={`h-96 animate-pulse ${CARTAO}`} />
  if (isError || !data) {
    return (
      <div className={`${CARTAO} p-6 text-sm text-(--pulso-danger)`}>
        Não deu para ler os dados do controle: {error instanceof Error ? error.message : 'erro desconhecido'}
      </div>
    )
  }

  const comAlerta = data.videos.filter((v) => v.alertas.length).length
  const abertos = data.gerais.length + comAlerta

  function exportar() {
    const blob = new Blob([controleCsv(data!)], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `pulso-videos-publicados-${new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="space-y-3.5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Indicador rotulo="Vídeos publicados" valor={inteiro.format(data.videos.length)} />
        <Indicador rotulo="Views somadas" valor={inteiro.format(data.totalViews)} nota="5 redes, republicação contada uma vez" />
        <Indicador rotulo="Interações" valor={inteiro.format(data.totalInteracoes)} nota="curtidas, comentários, compartilhamentos e salvos" />
        <Indicador rotulo="Alertas abertos" valor={String(abertos)} tom={abertos ? 'warn' : 'ok'}
          nota={abertos ? `${data.gerais.length} gerais · ${comAlerta} vídeos` : 'tudo conferido'} />
      </div>

      {data.gerais.length > 0 && (
        <div className={`${CARTAO} p-4`}>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-(--pulso-text)">
            <AlertTriangle className="h-4 w-4 text-(--pulso-danger)" /> Precisa de ação
          </h3>
          <ul className="space-y-1.5">
            {data.gerais.map((g, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-(--pulso-text-muted)">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-(--pulso-danger)" />
                {g.texto}
              </li>
            ))}
          </ul>
        </div>
      )}

      <ControleBarras videos={data.videos} />

      <SaudeColeta redes={data.redes} />

      <div className={`${CARTAO} p-4`}>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h3 className="mr-auto text-sm font-semibold text-(--pulso-text)">Vídeo a vídeo</h3>
          <label className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-(--pulso-text-subtle)" />
            <input value={busca} onChange={(e) => { setBusca(e.target.value); setLimite(PASSO) }} placeholder="título ou #número"
              aria-label="Buscar vídeo"
              className="w-44 rounded-lg border border-(--pulso-border) bg-(--pulso-surface-raised) py-1.5 pl-8 pr-2.5 text-xs text-(--pulso-text) placeholder:text-(--pulso-text-subtle) focus:border-(--pulso-action) focus:outline-none" />
          </label>
          <select value={filtro} onChange={(e) => { setFiltro(e.target.value as Filtro); setLimite(PASSO) }} aria-label="Filtrar vídeos"
            className="rounded-lg border border-(--pulso-border) bg-(--pulso-surface-raised) px-2.5 py-1.5 text-xs text-(--pulso-text) focus:border-(--pulso-action) focus:outline-none">
            <option value="todos">Todos ({data.videos.length})</option>
            <option value="alerta">Com alerta ({comAlerta})</option>
            {REDES.map((r) => <option key={r} value={r}>Alerta no {NOME_REDE[r]}</option>)}
          </select>
          <select value={ordem} onChange={(e) => setOrdem(e.target.value as Ordem)} aria-label="Ordenar vídeos"
            className="rounded-lg border border-(--pulso-border) bg-(--pulso-surface-raised) px-2.5 py-1.5 text-xs text-(--pulso-text) focus:border-(--pulso-action) focus:outline-none">
            <option value="recentes">Mais recentes</option>
            <option value="views">Mais views</option>
          </select>
          <button type="button" onClick={exportar}
            className="inline-flex items-center gap-1.5 rounded-lg bg-(--pulso-action) px-3 py-1.5 text-xs font-medium text-(--pulso-on-action) hover:opacity-90">
            <Download className="h-3.5 w-3.5" /> Exportar CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-xs">
            <thead className="text-[11px] uppercase tracking-wide text-(--pulso-text-subtle)">
              <tr className="border-b border-(--pulso-border)">
                <th className="py-2 pr-2 font-medium">#</th>
                <th className="py-2 pr-3 font-medium">Vídeo</th>
                {REDES.map((r) => <th key={r} className="py-2 pr-3 text-right font-medium">{NOME_REDE[r]}</th>)}
                <th className="py-2 pr-3 text-right font-medium">Total</th>
                <th className="py-2 font-medium">Conferência</th>
              </tr>
            </thead>
            <tbody>
              {lista.slice(0, limite).map((v) => <LinhaVideo key={v.ideiaId} v={v} />)}
            </tbody>
          </table>
          {lista.length === 0 && <p className="py-8 text-center text-sm text-(--pulso-text-subtle)">Nenhum vídeo neste filtro.</p>}
        </div>
        {lista.length > limite && (
          <button type="button" onClick={() => setLimite((l) => l + PASSO)}
            className="mt-3 w-full rounded-lg border border-(--pulso-border) py-2 text-xs text-(--pulso-text-muted) hover:text-(--pulso-text)">
            Mostrar mais ({lista.length - limite} restantes)
          </button>
        )}
      </div>
    </div>
  )
}

function Indicador({ rotulo, valor, nota, tom }: { rotulo: string; valor: string; nota?: string; tom?: 'ok' | 'warn' }) {
  const cor = tom === 'warn' ? 'text-(--pulso-warn)' : tom === 'ok' ? 'text-(--pulso-ok)' : 'text-(--pulso-text)'
  return (
    <div className={`${CARTAO} p-4`}>
      <p className="text-[11px] uppercase tracking-wide text-(--pulso-text-subtle)">{rotulo}</p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${cor}`}>{valor}</p>
      {nota && <p className="mt-0.5 text-[11px] text-(--pulso-text-subtle)">{nota}</p>}
    </div>
  )
}

function SaudeColeta({ redes }: { redes: RedeControle[] }) {
  return (
    <div className={`${CARTAO} p-4`}>
      <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold text-(--pulso-text)">
        <ShieldCheck className="h-4 w-4 text-(--pulso-action)" /> Saúde da coleta
      </h3>
      <p className="mb-3 text-[11px] text-(--pulso-text-subtle)">
        Por vídeo: republicação conta uma vez. Kwai é manual (rotina das 21h por foto) e as views congelam em 3 dias.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-xs">
          <thead className="text-[11px] uppercase tracking-wide text-(--pulso-text-subtle)">
            <tr className="border-b border-(--pulso-border)">
              <th className="py-2 pr-3 font-medium">Rede</th>
              <th className="py-2 pr-3 text-right font-medium">Vídeos</th>
              <th className="py-2 pr-3 font-medium">Lidos em 24h</th>
              <th className="py-2 pr-3 text-right font-medium">Sem leitura 72h</th>
              <th className="py-2 pr-3 text-right font-medium">0 views (3d+)</th>
              <th className="py-2 font-medium">Última leitura · rodada</th>
            </tr>
          </thead>
          <tbody>
            {redes.map((r) => {
              const pct = r.publicacoes ? Math.round((r.lidas24h / r.publicacoes) * 100) : 0
              const cor = r.manual ? 'bg-(--pulso-text-subtle)' : pct >= 90 ? 'bg-(--pulso-ok)' : pct >= 50 ? 'bg-(--pulso-warn)' : 'bg-(--pulso-danger)'
              return (
                <tr key={r.rede} className="border-b border-(--pulso-border) last:border-0">
                  <td className="py-2 pr-3 text-(--pulso-text)">
                    {NOME_REDE[r.rede]}
                    {r.republicacoes > 0 && <span className="ml-1.5 text-[10px] text-(--pulso-text-subtle)">+{r.republicacoes} republicações</span>}
                  </td>
                  <td className="py-2 pr-3 text-right tabular-nums text-(--pulso-text-muted)">{r.publicacoes}</td>
                  <td className="py-2 pr-3">
                    {r.manual ? (
                      <span className="text-(--pulso-text-subtle)">manual</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-(--pulso-surface-raised)">
                          <div className={`h-full ${cor}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="tabular-nums text-(--pulso-text-muted)">{pct}%</span>
                      </div>
                    )}
                  </td>
                  <td className={`py-2 pr-3 text-right tabular-nums ${!r.manual && r.paradas ? 'text-(--pulso-warn)' : 'text-(--pulso-text-muted)'}`}>
                    {r.manual ? '—' : r.paradas}
                  </td>
                  <td className={`py-2 pr-3 text-right tabular-nums ${r.zeradas ? 'text-(--pulso-warn)' : 'text-(--pulso-text-muted)'}`}>{r.zeradas}</td>
                  <td className="py-2 text-(--pulso-text-muted)">
                    {quando(r.ultimaLeitura)}
                    {r.ultimaRodada && (
                      <span className="ml-1.5 text-[11px] text-(--pulso-text-subtle)">
                        · rodada {quando(r.ultimaRodada.quando)} {r.ultimaRodada.status}
                        {r.ultimaRodada.pulados > 0 && ` (${r.ultimaRodada.pulados} no rodízio)`}
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function LinhaVideo({ v }: { v: VideoControle }) {
  const alertaDa = (r: Rede) => v.alertas.find((a) => a.rede === r)
  return (
    <tr className="border-b border-(--pulso-border) align-top last:border-0 hover:bg-(--pulso-surface-raised)/50">
      <td className="py-2 pr-2 tabular-nums text-(--pulso-text-subtle)">{v.numero ?? '—'}</td>
      <td className="max-w-[260px] py-2 pr-3">
        <Link href={`/video/${v.ideiaId}`} className="line-clamp-1 text-(--pulso-text) hover:text-(--pulso-action)">{v.titulo}</Link>
        <p className="text-[11px] text-(--pulso-text-subtle)">{v.canal} · {dia(v.publicadoEm)}</p>
      </td>
      {REDES.map((r) => {
        const c = v.redes[r]
        const a = alertaDa(r)
        if (!c) {
          return (
            <td key={r} className={`py-2 pr-3 text-right ${a ? 'text-(--pulso-danger)' : 'text-(--pulso-text-subtle)'}`} title={a?.texto}>
              {a ? 'falta' : '—'}
            </td>
          )
        }
        const titulo = [`${inteiro.format(c.views)} views`, `lido ${quando(c.ultimaLeitura)}`, c.posts > 1 ? `${c.posts} posts (republicação)` : '', a?.texto || '']
          .filter(Boolean).join(' · ')
        const conteudo = <span className={`tabular-nums ${a ? 'text-(--pulso-warn)' : 'text-(--pulso-text-muted)'}`}>{compacto.format(c.views)}</span>
        return (
          <td key={r} className="py-2 pr-3 text-right" title={titulo}>
            {c.url ? <a href={c.url} target="_blank" rel="noopener noreferrer" className="hover:underline">{conteudo}</a> : conteudo}
          </td>
        )
      })}
      <td className="py-2 pr-3 text-right font-medium tabular-nums text-(--pulso-text)">{compacto.format(v.totalViews)}</td>
      <td className="py-2">
        {v.alertas.length === 0 ? (
          <span className="inline-flex items-center gap-1 text-(--pulso-ok)"><CheckCircle2 className="h-3.5 w-3.5" /> ok</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {v.alertas.map((a, i) => (
              <span key={i} className={`rounded-full px-2 py-0.5 text-[10px] ${a.gravidade === 'alta'
                ? 'bg-(--pulso-danger)/15 text-(--pulso-danger)' : 'bg-(--pulso-warn)/15 text-(--pulso-warn)'}`}>
                {a.texto}
              </span>
            ))}
          </div>
        )}
      </td>
    </tr>
  )
}
