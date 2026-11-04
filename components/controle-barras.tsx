'use client'

import { useMemo, useState } from 'react'
import { BarChart3 } from 'lucide-react'
import { useGanhoDiario } from '@/lib/hooks/use-controle-videos'
import { agruparGanho, NOME_REDE, REDES, type Barra, type Escala, type VideoControle } from '@/lib/analytics/controle'
import { hojeBRT } from '@/lib/datas'

const compacto = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 })
const inteiro = new Intl.NumberFormat('pt-BR')
const ESCALAS: { id: Escala; rotulo: string; titulo: string }[] = [
  { id: 'dia', rotulo: 'Dia', titulo: 'últimos 30 dias' },
  { id: 'semana', rotulo: 'Semana', titulo: 'últimas 26 semanas' },
  { id: 'mes', rotulo: 'Mês', titulo: 'últimos 12 meses' },
  { id: 'ano', rotulo: 'Ano', titulo: 'por ano' },
]
const ALTURA = 180

function periodo(b: Barra, escala: Escala) {
  if (escala === 'dia') return new Date(`${b.inicio}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })
  if (escala === 'semana') return `semana de ${b.rotulo}`
  return b.rotulo
}

/** Views GANHAS por período, com o mesmo filtro de rede e vertical. Uma série: sem legenda, o título a nomeia. */
export function ControleBarras({ videos }: { videos: VideoControle[] }) {
  const { data, isLoading } = useGanhoDiario()
  const [escala, setEscala] = useState<Escala>('dia')
  const [rede, setRede] = useState('todas')
  const [canalId, setCanalId] = useState('todos')
  const [foco, setFoco] = useState<number | null>(null)

  const barras = useMemo(
    () => (data ? agruparGanho(data.ganhos, videos, escala, { rede, canalId }, hojeBRT()) : []),
    [data, videos, escala, rede, canalId],
  )
  const max = Math.max(1, ...barras.map((b) => b.views))
  const total = barras.reduce((s, b) => s + b.views, 0)
  const pico = barras.reduce((m, b, i) => (b.views > (barras[m]?.views ?? -1) ? i : m), 0)
  // rótulo do eixo X a cada N barras para não encavalar (30 dias = 1 a cada 5)
  const cadaN = Math.max(1, Math.ceil(barras.length / 8))
  const grade = [max, max / 2].map((v) => Math.round(v))
  const ativa = foco != null ? barras[foco] : null

  const seletor = 'rounded-lg border border-(--pulso-border) bg-(--pulso-surface-raised) px-2.5 py-1.5 text-xs text-(--pulso-text) focus:border-(--pulso-action) focus:outline-none'

  return (
    <div className="rounded-2xl border border-(--pulso-border) bg-(--pulso-surface) p-4">
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <h3 className="mr-auto flex items-center gap-2 text-sm font-semibold text-(--pulso-text)">
          <BarChart3 className="h-4 w-4 text-(--pulso-action)" /> Views ganhas por período
        </h3>
        <select value={rede} onChange={(e) => setRede(e.target.value)} aria-label="Rede do gráfico" className={seletor}>
          <option value="todas">Todas as redes</option>
          {REDES.map((r) => <option key={r} value={r}>{NOME_REDE[r]}</option>)}
        </select>
        <select value={canalId} onChange={(e) => setCanalId(e.target.value)} aria-label="Vertical do gráfico" className={seletor}>
          <option value="todos">Todas as verticais</option>
          {(data?.canais || []).map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
        <div role="tablist" aria-label="Escala do gráfico" className="flex rounded-lg border border-(--pulso-border) bg-(--pulso-surface-raised) p-0.5">
          {ESCALAS.map((e) => (
            <button key={e.id} type="button" role="tab" aria-selected={escala === e.id} onClick={() => { setEscala(e.id); setFoco(null) }}
              className={`rounded-md px-2.5 py-1 text-xs transition-colors ${escala === e.id
                ? 'bg-(--pulso-action) font-medium text-(--pulso-on-action)' : 'text-(--pulso-text-subtle) hover:text-(--pulso-text-muted)'}`}>
              {e.rotulo}
            </button>
          ))}
        </div>
      </div>
      <p className="mb-4 text-[11px] text-(--pulso-text-subtle)">
        {ESCALAS.find((e) => e.id === escala)!.titulo} · {inteiro.format(total)} views no recorte · ganho entre leituras, desde 19/06
        (dia sem coleta joga o ganho no dia da leitura seguinte)
      </p>

      {isLoading ? (
        <div className="h-[200px] animate-pulse rounded-xl bg-(--pulso-surface-raised)" />
      ) : barras.length === 0 ? (
        <p className="py-16 text-center text-sm text-(--pulso-text-subtle)">Sem leitura neste recorte.</p>
      ) : (
        <div className="relative">
          {/* dica do período em foco: fica no topo para não cobrir a barra */}
          <div className="mb-2 h-9 text-xs" aria-live="polite">
            {ativa ? (
              <div className="inline-flex flex-wrap items-baseline gap-x-3 rounded-lg bg-(--pulso-surface-raised) px-3 py-1.5">
                <span className="text-(--pulso-text-muted)">{periodo(ativa, escala)}</span>
                <span className="font-semibold tabular-nums text-(--pulso-text)">{inteiro.format(ativa.views)} views</span>
                <span className="text-(--pulso-text-subtle)">{ativa.videos} vídeo{ativa.videos === 1 ? '' : 's'} estreado{ativa.videos === 1 ? '' : 's'}</span>
              </div>
            ) : (
              <span className="text-(--pulso-text-subtle)">Passe o mouse ou toque numa barra.</span>
            )}
          </div>

          <div className="relative" style={{ height: ALTURA }}>
            {grade.map((g) => (
              <div key={g} className="pointer-events-none absolute inset-x-0 border-t border-dashed border-(--pulso-border)"
                style={{ bottom: `${(g / max) * 100}%` }}>
                <span className="absolute -top-2 left-0 bg-(--pulso-surface) pr-1 text-[10px] tabular-nums text-(--pulso-text-subtle)">{compacto.format(g)}</span>
              </div>
            ))}
            <div className="absolute inset-0 flex items-end gap-[2px] pl-9" onMouseLeave={() => setFoco(null)}>
              {barras.map((b, i) => {
                const h = b.views ? Math.max(2, (b.views / max) * 100) : 0
                return (
                  <button key={b.chave} type="button" aria-label={`${periodo(b, escala)}: ${inteiro.format(b.views)} views, ${b.videos} vídeos`}
                    onMouseEnter={() => setFoco(i)} onFocus={() => setFoco(i)} onClick={() => setFoco(i)}
                    className="group relative flex h-full flex-1 items-end focus:outline-none">
                    {i === pico && b.views > 0 && (
                      <span className="pointer-events-none absolute inset-x-0 text-center text-[10px] tabular-nums text-(--pulso-text-muted)"
                        style={{ bottom: `calc(${h}% + 4px)` }}>
                        {compacto.format(b.views)}
                      </span>
                    )}
                    <span className={`block w-full rounded-t-[4px] bg-(--pulso-action) transition-opacity ${foco != null && foco !== i ? 'opacity-40' : ''} group-focus-visible:ring-2 group-focus-visible:ring-(--pulso-text)`}
                      style={{ height: `${h}%` }} />
                  </button>
                )
              })}
            </div>
          </div>
          <div className="mt-1.5 flex gap-[2px] pl-9">
            {barras.map((b, i) => (
              <span key={b.chave} className="flex-1 truncate text-center text-[10px] text-(--pulso-text-subtle)">
                {i % cadaN === 0 || i === barras.length - 1 ? b.rotulo : ''}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
