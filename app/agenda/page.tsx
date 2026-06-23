'use client'

import { useMemo, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, Sparkles, Filter, LayoutGrid, List, Send, FileEdit, Lightbulb } from 'lucide-react'

import { ErrorState } from '@/components/ui/error-state'
import { useAgenda, type AgendaSlot } from '@/lib/hooks/use-agenda'

const HORARIOS = ['12:00', '18:00', '21:00']
const DIAS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

const ESTAGIO: Record<string, { label: string; cls: string }> = {
  video: { label: '🎬 vídeo', cls: 'bg-violet-500/15 text-violet-300 ring-violet-500/30' },
  audio: { label: '🎙️ áudio', cls: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30' },
  roteiro: { label: '📝 roteiro', cls: 'bg-blue-500/15 text-blue-300 ring-blue-500/30' },
  ideia: { label: '💡 ideia', cls: 'bg-amber-500/15 text-amber-300 ring-amber-500/30' },
  vazio: { label: '— vazio', cls: 'bg-red-500/10 text-red-300 ring-red-500/30' },
}
type Camada = 'publicacao' | 'roteiro' | 'ideia'
const CAMADAS: { id: Camada; label: string; icon: typeof Send }[] = [
  { id: 'publicacao', label: 'Publicação', icon: Send },
  { id: 'roteiro', label: 'Roteiro', icon: FileEdit },
  { id: 'ideia', label: 'Ideia', icon: Lightbulb },
]

function isoLocal(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function fmtBR(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

export default function AgendaPage() {
  const [horizonte, setHorizonte] = useState(28)
  const { data, isLoading, isError, refetch } = useAgenda(horizonte)
  const [modo, setModo] = useState<'calendario' | 'lista'>('calendario')
  const [camada, setCamada] = useState<Camada>('publicacao')
  const [filtroCanal, setFiltroCanal] = useState('todos')
  const [filtroFaixa, setFiltroFaixa] = useState('todas')
  const [semana, setSemana] = useState(0)
  const [editando, setEditando] = useState<string | null>(null)
  const [populando, setPopulando] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const hojeIso = isoLocal(new Date())

  const diasSemana = useMemo(() => {
    const base = new Date()
    base.setHours(0, 0, 0, 0)
    const dow = base.getDay() === 0 ? 7 : base.getDay()
    const segunda = new Date(base)
    segunda.setDate(base.getDate() - (dow - 1) + semana * 7)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(segunda)
      d.setDate(segunda.getDate() + i)
      return d
    })
  }, [semana])

  const slotPorChave = useMemo(() => {
    const m = new Map<string, AgendaSlot>()
    for (const s of data?.slots || []) m.set(s.chave, s)
    return m
  }, [data])

  const passaFiltro = (s: { canalId: string | null; faixa: string }) =>
    (filtroCanal === 'todos' || s.canalId === filtroCanal) && (filtroFaixa === 'todas' || s.faixa === filtroFaixa)

  const dataDaCamada = (s: AgendaSlot) => (camada === 'publicacao' ? s.data : camada === 'roteiro' ? s.roteiroAte : s.ideiaAte)

  const gruposLista = useMemo(() => {
    if (!data) return []
    const filtrados = data.slots.filter((s) => passaFiltro(s) && dataDaCamada(s) >= hojeIso)
    const por = new Map<string, AgendaSlot[]>()
    for (const s of filtrados) {
      const k = dataDaCamada(s)
      if (!por.has(k)) por.set(k, [])
      por.get(k)!.push(s)
    }
    return [...por.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([d, itens]) => ({ data: d, itens: itens.sort((a, b) => a.horario.localeCompare(b.horario)) }))
  }, [data, camada, filtroCanal, filtroFaixa, hojeIso])

  async function popular() {
    setPopulando(true); setMsg(null)
    try {
      const r = await fetch('/api/agenda/popular', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ horizonte }) })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'falha')
      setMsg(`✅ ${d.preenchidos} slots encaixados, ${d.vazios} vazios (produzir).`)
      await refetch()
    } catch (e) { setMsg(`❌ ${e instanceof Error ? e.message : 'erro'}`) } finally { setPopulando(false) }
  }
  async function atribuir(dataIso: string, horario: string, canalId: string | null, ideiaId: string, estagio: string) {
    setEditando(null)
    await fetch('/api/agenda/atribuir', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data: dataIso, horario, canal_id: canalId, ideia_id: ideiaId || null, estagio }) })
    await refetch()
  }

  if (isLoading) return <div className="min-h-screen bg-zinc-950 p-8"><div className="mx-auto max-w-7xl space-y-4"><div className="skeleton h-10 w-48" /><div className="skeleton h-96 w-full" /></div></div>
  if (isError || !data) return <div className="min-h-screen bg-zinc-950 p-8"><div className="mx-auto max-w-7xl"><ErrorState title="Erro ao carregar a agenda" message="Não foi possível montar a agenda." onRetry={() => refetch()} /></div></div>

  const horariosVisiveis = filtroFaixa === 'sazonal' ? ['12:00'] : filtroFaixa === 'perene' ? ['18:00', '21:00'] : HORARIOS
  const intervalo = `${fmtBR(isoLocal(diasSemana[0]))} – ${fmtBR(isoLocal(diasSemana[6]))}`

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <CalendarDays className="h-7 w-7 text-violet-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">Agenda de publicação</h1>
            <p className="text-xs text-zinc-400">Calendário travado por canal · encaixado com o estoque · planejamento reverso (ideia D-7 → roteiro D-4 → produção D-2 → publica D).</p>
          </div>
          <button onClick={popular} disabled={populando} title="Auto-encaixe: preenche cada slot com o melhor ativo do canal (vídeo>áudio>roteiro>ideia), sem repetir nem sobrescrever o fixado. Slot sem estoque = vazio (produzir)." className="ml-auto flex items-center gap-2 rounded-lg bg-linear-to-r from-violet-600 to-purple-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-violet-500/20 disabled:opacity-50">
            <Sparkles className="h-4 w-4" /> {populando ? 'Encaixando…' : 'Popular com estoque'}
          </button>
        </div>
        {msg && <p className="text-sm text-zinc-300">{msg}</p>}

        {/* controles: modo + filtros */}
        <div className="glass flex flex-wrap items-center gap-3 rounded-2xl border border-zinc-800/50 p-4">
          <div className="flex gap-1 rounded-lg bg-zinc-900/60 p-1">
            <button onClick={() => setModo('calendario')} className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium ${modo === 'calendario' ? 'bg-violet-600 text-white' : 'text-zinc-400'}`}><LayoutGrid className="h-4 w-4" /> Calendário</button>
            <button onClick={() => setModo('lista')} className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium ${modo === 'lista' ? 'bg-violet-600 text-white' : 'text-zinc-400'}`}><List className="h-4 w-4" /> Lista</button>
          </div>
          <Filter className="ml-2 h-4 w-4 text-violet-400" />
          <select value={filtroCanal} onChange={(e) => setFiltroCanal(e.target.value)} className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none">
            <option value="todos">Todos os canais</option>
            {data.canais.map((c) => <option key={c.id} value={c.id}>{c.nome.replace(/^PULSO\s*/i, '')}</option>)}
          </select>
          <select value={filtroFaixa} onChange={(e) => setFiltroFaixa(e.target.value)} className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none">
            <option value="todas">Sazonal + Perene</option>
            <option value="sazonal">Só sazonal</option>
            <option value="perene">Só perene</option>
          </select>
          {modo === 'lista' && (
            <>
              <div className="flex gap-1 rounded-lg bg-zinc-900/60 p-1">
                {CAMADAS.map((c) => {
                  const Ic = c.icon
                  return <button key={c.id} onClick={() => setCamada(c.id)} className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium ${camada === c.id ? 'bg-zinc-700 text-white' : 'text-zinc-400'}`}><Ic className="h-3.5 w-3.5" /> {c.label}</button>
                })}
              </div>
              <select value={horizonte} onChange={(e) => setHorizonte(Number(e.target.value))} className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none">
                {[7, 14, 21, 28].map((n) => <option key={n} value={n}>Próximos {n} dias</option>)}
              </select>
            </>
          )}
        </div>

        {/* CALENDÁRIO */}
        {modo === 'calendario' && (
          <>
            <div className="flex items-center justify-center gap-4">
              <button onClick={() => setSemana((s) => Math.max(0, s - 1))} disabled={semana <= 0} className="rounded-lg bg-zinc-800 p-2 text-white hover:bg-zinc-700 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
              <span className="text-sm font-semibold text-zinc-200">{semana === 0 ? 'Esta semana' : `Semana +${semana}`} · {intervalo}</span>
              <button onClick={() => setSemana((s) => Math.min(3, s + 1))} disabled={semana >= 3} className="rounded-lg bg-zinc-800 p-2 text-white hover:bg-zinc-700 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
            </div>
            <div className="overflow-x-auto">
              <div className="grid min-w-[900px] grid-cols-[64px_repeat(7,1fr)] gap-1.5">
                <div />
                {diasSemana.map((d, i) => {
                  const iso = isoLocal(d); const ehHoje = iso === hojeIso
                  return <div key={iso} className={`rounded-lg px-2 py-1.5 text-center text-xs font-semibold ${ehHoje ? 'bg-violet-500/20 text-violet-200' : 'text-zinc-400'}`}>{DIAS[i]} <span className="font-normal text-zinc-500">{fmtBR(iso)}</span></div>
                })}
                {horariosVisiveis.map((h) => (
                  <div key={h} className="contents">
                    <div className="flex items-center justify-center rounded-lg bg-zinc-900/40 text-xs font-mono text-zinc-500">{h}</div>
                    {diasSemana.map((d) => {
                      const iso = isoLocal(d); const chave = `${iso}|${h}`; const slot = slotPorChave.get(chave)
                      const atrib = data.atribuicoes[chave]; const passado = iso < hojeIso
                      if (!slot) return <div key={chave} className="min-h-[78px] rounded-lg bg-zinc-900/20" />
                      const dim = !passaFiltro(slot)
                      const est = ESTAGIO[atrib?.estagio || 'vazio'] || ESTAGIO.vazio
                      const editavel = !passado && editando === chave
                      const estoque = (slot.canalId && data.estoqueDisponivel[slot.canalId]) || []
                      return (
                        <div key={chave} className={`min-h-[78px] rounded-lg border p-2 transition-opacity ${passado ? 'border-zinc-800/30 bg-zinc-900/20 opacity-50' : 'border-zinc-800/60 bg-zinc-900/50'} ${dim ? 'opacity-25' : ''}`}>
                          <div className="flex items-center justify-between">
                            <span className="truncate text-[11px] font-semibold text-zinc-300">{slot.canalNome}</span>
                            {slot.faixa === 'sazonal' && <span className="shrink-0 text-[9px] text-orange-400">SAZ</span>}
                          </div>
                          {editavel ? (
                            <select autoFocus defaultValue={atrib?.ideiaId || ''} onChange={(e) => { const it = estoque.find((x) => x.id === e.target.value); atribuir(iso, h, slot.canalId, e.target.value, it?.estagio || 'vazio') }} onBlur={() => setEditando(null)} className="mt-1 w-full rounded border border-violet-500 bg-zinc-800 px-1 py-1 text-[11px] text-white focus:outline-none">
                              <option value="">— vazio —</option>
                              {estoque.map((it) => <option key={it.id} value={it.id}>{it.estagio} · {it.titulo.slice(0, 40)}</option>)}
                            </select>
                          ) : (
                            <button onClick={() => !passado && setEditando(chave)} className="mt-1 w-full text-left" disabled={passado}>
                              <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold ring-1 ${est.cls}`}>{est.label}</span>
                              {atrib?.ideiaTitulo && <p className="mt-1 line-clamp-2 text-[11px] text-zinc-400">{atrib.ideiaTitulo}</p>}
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
            <p className="text-center text-xs text-zinc-500">Clique numa célula pra encaixar/trocar. 🎬 pronto · 🎙️/📝/💡 em produção · vazio = produzir.</p>
          </>
        )}

        {/* LISTA (planejamento reverso, filtrável) */}
        {modo === 'lista' && (
          <div className="space-y-3">
            <p className="text-xs text-zinc-500">Vendo datas de <b className="text-zinc-300">{CAMADAS.find((c) => c.id === camada)!.label}</b> — quando cada etapa precisa estar pronta.</p>
            {gruposLista.length === 0 ? <p className="text-sm text-zinc-500">Nada no recorte.</p> : gruposLista.map(({ data: dataG, itens }) => {
              const ehHoje = dataG === hojeIso
              return (
                <div key={dataG} className={`glass rounded-2xl border p-4 ${ehHoje ? 'border-violet-500/40 bg-violet-500/5' : 'border-zinc-800/50'}`}>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{fmtBR(dataG)}</span>
                    {ehHoje && <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] font-bold text-violet-300">HOJE</span>}
                    <span className="ml-auto text-xs text-zinc-600">{itens.length} item(ns)</span>
                  </div>
                  <div className="space-y-1.5">
                    {itens.map((s) => {
                      const atrib = data.atribuicoes[s.chave]
                      const est = ESTAGIO[atrib?.estagio || 'vazio'] || ESTAGIO.vazio
                      return (
                        <div key={s.chave} className="flex items-center gap-3 rounded-lg bg-zinc-900/50 px-3 py-2">
                          <span className="w-12 shrink-0 font-mono text-xs text-zinc-400">{s.horario}</span>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${s.faixa === 'sazonal' ? 'bg-orange-500/15 text-orange-300' : 'bg-zinc-700 text-zinc-300'}`}>{s.faixa === 'sazonal' ? 'SAZ' : 'PER'}</span>
                          <span className="w-40 shrink-0 truncate text-sm text-zinc-200">{s.canalNome}</span>
                          <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ring-1 ${est.cls}`}>{est.label}</span>
                          <span className="min-w-0 flex-1 truncate text-xs text-zinc-500">{atrib?.ideiaTitulo || '—'}</span>
                          {camada !== 'publicacao' && <span className="shrink-0 text-[11px] text-zinc-600">publica {fmtBR(s.data)}</span>}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Funil de produção */}
        <div className="glass rounded-2xl border border-zinc-800/50 p-5">
          <h2 className="mb-3 text-sm font-semibold text-zinc-300">Trilha de trabalho · funil de produção</h2>
          <div className="grid grid-cols-4 gap-2">
            {([
              { label: '💡 Ideias', v: data.totais.ideia, cor: 'text-amber-300' },
              { label: '📝 Roteiros', v: data.totais.roteiro, cor: 'text-blue-300' },
              { label: '🎙️ Áudios', v: data.totais.audio, cor: 'text-emerald-300' },
              { label: '🎬 Vídeos', v: data.totais.video, cor: 'text-violet-300' },
            ]).map((s) => (
              <div key={s.label} className="rounded-xl bg-zinc-900/60 p-3 text-center">
                <div className={`text-2xl font-black tabular-nums ${s.cor}`}>{s.v}</div>
                <div className="text-[10px] uppercase tracking-wider text-zinc-500">{s.label}</div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-zinc-500">Gargalo = onde os números caem (normalmente render 🎙️→🎬). Meta: estoque de 20 dias, enchendo em rampa.</p>
        </div>
      </div>
    </div>
  )
}
