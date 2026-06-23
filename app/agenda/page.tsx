'use client'

import { useMemo, useState } from 'react'
import { CalendarDays, Filter, Lightbulb, FileEdit, Send } from 'lucide-react'

import { ErrorState } from '@/components/ui/error-state'
import { useAgenda, type AgendaSlot } from '@/lib/hooks/use-agenda'

type Camada = 'publicacao' | 'roteiro' | 'ideia'

const CAMADAS: { id: Camada; label: string; icon: typeof Send; cor: string }[] = [
  { id: 'publicacao', label: 'Publicação', icon: Send, cor: 'text-violet-300' },
  { id: 'roteiro', label: 'Roteiro', icon: FileEdit, cor: 'text-blue-300' },
  { id: 'ideia', label: 'Ideia', icon: Lightbulb, cor: 'text-amber-300' },
]

const DIAS = ['', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

function fmt(dataIso: string) {
  const d = new Date(dataIso + 'T12:00:00')
  const wd = d.getDay() === 0 ? 7 : d.getDay()
  return { label: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), dia: DIAS[wd] }
}

export default function AgendaPage() {
  const [horizonte, setHorizonte] = useState(21)
  const { data, isLoading, isError, refetch } = useAgenda(horizonte)
  const [camada, setCamada] = useState<Camada>('publicacao')
  const [filtroCanal, setFiltroCanal] = useState('todos')
  const [filtroFaixa, setFiltroFaixa] = useState('todas')

  const dataDaCamada = (s: AgendaSlot) =>
    camada === 'publicacao' ? s.data : camada === 'roteiro' ? s.roteiroAte : s.ideiaAte

  const hojeIso = new Date().toISOString().slice(0, 10)

  const grupos = useMemo(() => {
    if (!data) return []
    const filtrados = data.slots.filter((s) => {
      if (filtroCanal !== 'todos' && s.canalId !== filtroCanal) return false
      if (filtroFaixa !== 'todas' && s.faixa !== filtroFaixa) return false
      if (dataDaCamada(s) < hojeIso) return false // a camada (ex.: ideia) pode cair no passado
      return true
    })
    const porData = new Map<string, AgendaSlot[]>()
    for (const s of filtrados) {
      const k = dataDaCamada(s)
      if (!porData.has(k)) porData.set(k, [])
      porData.get(k)!.push(s)
    }
    return [...porData.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([data_, itens]) => ({ data: data_, itens: itens.sort((a, b) => a.horario.localeCompare(b.horario)) }))
  }, [data, camada, filtroCanal, filtroFaixa, hojeIso])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 p-8">
        <div className="mx-auto max-w-6xl space-y-4">
          <div className="skeleton h-10 w-48" />
          <div className="skeleton h-64 w-full" />
        </div>
      </div>
    )
  }
  if (isError || !data) {
    return (
      <div className="min-h-screen bg-zinc-950 p-8">
        <div className="mx-auto max-w-6xl">
          <ErrorState title="Erro ao carregar a agenda" message="Não foi possível montar a agenda." onRetry={() => refetch()} />
        </div>
      </div>
    )
  }

  const camadaInfo = CAMADAS.find((c) => c.id === camada)!

  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center gap-3">
          <CalendarDays className="h-7 w-7 text-violet-400" />
          <div>
            <h1 className="text-3xl font-bold text-white">Agenda</h1>
            <p className="text-sm text-zinc-400">Planejamento reverso: ideia (D-7) → roteiro (D-4) → produção (D-2) → publica (D).</p>
          </div>
        </div>

        {/* Seletor de camada */}
        <div className="flex flex-wrap gap-2">
          {CAMADAS.map((c) => {
            const Ic = c.icon
            const ativo = camada === c.id
            return (
              <button
                key={c.id}
                onClick={() => setCamada(c.id)}
                className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors ${
                  ativo ? 'border-violet-500/50 bg-violet-500/15 text-white' : 'border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-white'
                }`}
              >
                <Ic className={`h-4 w-4 ${ativo ? c.cor : ''}`} /> {c.label}
              </button>
            )
          })}
        </div>

        {/* Filtros */}
        <div className="glass flex flex-wrap items-center gap-3 rounded-2xl border border-zinc-800/50 p-4">
          <Filter className="h-4 w-4 text-violet-400" />
          <select value={filtroCanal} onChange={(e) => setFiltroCanal(e.target.value)} className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none">
            <option value="todos">Todos os canais</option>
            {data.canais.map((c) => (
              <option key={c.id} value={c.id}>{c.nome.replace(/^PULSO\s*/i, '')}</option>
            ))}
          </select>
          <select value={filtroFaixa} onChange={(e) => setFiltroFaixa(e.target.value)} className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none">
            <option value="todas">Sazonal + Perene</option>
            <option value="sazonal">Só sazonal</option>
            <option value="perene">Só perene</option>
          </select>
          <select value={horizonte} onChange={(e) => setHorizonte(Number(e.target.value))} className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none">
            {[7, 14, 21, 30].map((n) => (
              <option key={n} value={n}>Próximos {n} dias</option>
            ))}
          </select>
          <span className="ml-auto flex items-center gap-2 text-xs text-zinc-500">
            <camadaInfo.icon className={`h-3.5 w-3.5 ${camadaInfo.cor}`} /> vendo datas de <b className="text-zinc-300">{camadaInfo.label}</b>
          </span>
        </div>

        {/* Calendário por data */}
        {grupos.length === 0 ? (
          <p className="text-sm text-zinc-500">Nada no recorte.</p>
        ) : (
          <div className="space-y-3">
            {grupos.map(({ data: dataG, itens }) => {
              const f = fmt(dataG)
              const ehHoje = dataG === hojeIso
              return (
                <div key={dataG} className={`glass rounded-2xl border p-4 ${ehHoje ? 'border-violet-500/40 bg-violet-500/5' : 'border-zinc-800/50'}`}>
                  <div className="mb-3 flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{f.dia}</span>
                    <span className="text-sm text-zinc-400">{f.label}</span>
                    {ehHoje && <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] font-bold text-violet-300">HOJE</span>}
                    <span className="ml-auto text-xs text-zinc-600">{itens.length} item(ns)</span>
                  </div>
                  <div className="space-y-1.5">
                    {itens.map((s) => (
                      <div key={s.chave} className="flex items-center gap-3 rounded-lg bg-zinc-900/50 px-3 py-2">
                        <span className="w-12 shrink-0 font-mono text-xs text-zinc-400">{s.horario}</span>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${s.faixa === 'sazonal' ? 'bg-orange-500/15 text-orange-300' : 'bg-zinc-700 text-zinc-300'}`}>
                          {s.faixa === 'sazonal' ? 'SAZONAL' : 'PERENE'}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm text-zinc-200">{s.canalNome}</span>
                        {camada !== 'publicacao' && (
                          <span className="shrink-0 text-[11px] text-zinc-500">→ publica {fmt(s.data).label}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Estoque por canal (proxy de prontidão) */}
        <div className="glass rounded-2xl border border-zinc-800/50 p-5">
          <h2 className="mb-3 text-sm font-semibold text-zinc-300">Estoque por canal (pronto pra encaixar)</h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {data.estoque.sort((a, b) => b.roteiros - a.roteiros).map((e) => (
              <div key={e.canalId} className="flex items-center justify-between rounded-lg bg-zinc-900/50 px-3 py-2 text-sm">
                <span className="truncate text-zinc-300">{e.nome}</span>
                <span className="shrink-0 text-xs text-zinc-500">💡{e.ideias} · 📝{e.roteiros}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-zinc-500">💡 ideias aprovadas · 📝 roteiros aprovados. Meta: estoque de 20 dias, enchendo em rampa (sempre o do dia + 2 dias/semana à frente).</p>
        </div>
      </div>
    </div>
  )
}
