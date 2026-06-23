'use client'

import { useMemo, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'

import { ErrorState } from '@/components/ui/error-state'
import { useAgenda } from '@/lib/hooks/use-agenda'

const HORARIOS = ['12:00', '18:00', '21:00']
const DIAS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

const ESTAGIO: Record<string, { label: string; cls: string }> = {
  video: { label: '🎬 vídeo', cls: 'bg-violet-500/15 text-violet-300 ring-violet-500/30' },
  audio: { label: '🎙️ áudio', cls: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30' },
  roteiro: { label: '📝 roteiro', cls: 'bg-blue-500/15 text-blue-300 ring-blue-500/30' },
  ideia: { label: '💡 ideia', cls: 'bg-amber-500/15 text-amber-300 ring-amber-500/30' },
  vazio: { label: '— vazio', cls: 'bg-red-500/10 text-red-300 ring-red-500/30' },
}

function isoLocal(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function AgendaPage() {
  const { data, isLoading, isError, refetch } = useAgenda(28)
  const [semana, setSemana] = useState(0)
  const [editando, setEditando] = useState<string | null>(null) // 'data|horario'
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
    const m = new Map<string, { canalId: string | null; canalNome: string; faixa: string }>()
    for (const s of data?.slots || []) m.set(s.chave, { canalId: s.canalId, canalNome: s.canalNome, faixa: s.faixa })
    return m
  }, [data])

  async function popular() {
    setPopulando(true)
    setMsg(null)
    try {
      const r = await fetch('/api/agenda/popular', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ horizonte: 28 }) })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'falha')
      setMsg(`✅ ${d.preenchidos} slots encaixados, ${d.vazios} vazios (produzir).`)
      await refetch()
    } catch (e) {
      setMsg(`❌ ${e instanceof Error ? e.message : 'erro'}`)
    } finally {
      setPopulando(false)
    }
  }

  async function atribuir(dataIso: string, horario: string, canalId: string | null, ideiaId: string, estagio: string) {
    setEditando(null)
    await fetch('/api/agenda/atribuir', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: dataIso, horario, canal_id: canalId, ideia_id: ideiaId || null, estagio }),
    })
    await refetch()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 p-8"><div className="mx-auto max-w-7xl space-y-4"><div className="skeleton h-10 w-48" /><div className="skeleton h-96 w-full" /></div></div>
    )
  }
  if (isError || !data) {
    return (
      <div className="min-h-screen bg-zinc-950 p-8"><div className="mx-auto max-w-7xl"><ErrorState title="Erro ao carregar a agenda" message="Não foi possível montar a agenda." onRetry={() => refetch()} /></div></div>
    )
  }

  const intervalo = `${diasSemana[0].toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} – ${diasSemana[6].toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <CalendarDays className="h-7 w-7 text-violet-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">Agenda de publicação</h1>
            <p className="text-xs text-zinc-400">Calendário travado por canal · encaixado com o estoque · planejamento reverso (ideia D-7 → roteiro D-4 → produção D-2 → publica D).</p>
          </div>
          <button onClick={popular} disabled={populando} className="ml-auto flex items-center gap-2 rounded-lg bg-linear-to-r from-violet-600 to-purple-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-violet-500/20 disabled:opacity-50">
            <Sparkles className="h-4 w-4" /> {populando ? 'Encaixando…' : 'Popular com estoque'}
          </button>
        </div>
        {msg && <p className="text-sm text-zinc-300">{msg}</p>}

        {/* navegação de semana */}
        <div className="flex items-center justify-center gap-4">
          <button onClick={() => setSemana((s) => Math.max(0, s - 1))} disabled={semana <= 0} className="rounded-lg bg-zinc-800 p-2 text-white hover:bg-zinc-700 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
          <span className="text-sm font-semibold text-zinc-200">{semana === 0 ? 'Esta semana' : `Semana +${semana}`} · {intervalo}</span>
          <button onClick={() => setSemana((s) => Math.min(3, s + 1))} disabled={semana >= 3} className="rounded-lg bg-zinc-800 p-2 text-white hover:bg-zinc-700 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
        </div>

        {/* grade do calendário */}
        <div className="overflow-x-auto">
          <div className="grid min-w-[900px] grid-cols-[64px_repeat(7,1fr)] gap-1.5">
            {/* cabeçalho dos dias */}
            <div />
            {diasSemana.map((d, i) => {
              const iso = isoLocal(d)
              const ehHoje = iso === hojeIso
              return (
                <div key={iso} className={`rounded-lg px-2 py-1.5 text-center text-xs font-semibold ${ehHoje ? 'bg-violet-500/20 text-violet-200' : 'text-zinc-400'}`}>
                  {DIAS[i]} <span className="font-normal text-zinc-500">{d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
                </div>
              )
            })}

            {/* linhas por horário */}
            {HORARIOS.map((h) => (
              <div key={h} className="contents">
                <div className="flex items-center justify-center rounded-lg bg-zinc-900/40 text-xs font-mono text-zinc-500">{h}</div>
                {diasSemana.map((d) => {
                  const iso = isoLocal(d)
                  const chave = `${iso}|${h}`
                  const slot = slotPorChave.get(chave)
                  const atrib = data.atribuicoes[chave]
                  const passado = iso < hojeIso
                  if (!slot) return <div key={chave} className="min-h-[78px] rounded-lg bg-zinc-900/20" />
                  const est = ESTAGIO[atrib?.estagio || 'vazio'] || ESTAGIO.vazio
                  const editavel = !passado && editando === chave
                  const estoque = (slot.canalId && data.estoqueDisponivel[slot.canalId]) || []
                  return (
                    <div key={chave} className={`min-h-[78px] rounded-lg border p-2 ${passado ? 'border-zinc-800/30 bg-zinc-900/20 opacity-50' : 'border-zinc-800/60 bg-zinc-900/50'}`}>
                      <div className="flex items-center justify-between">
                        <span className="truncate text-[11px] font-semibold text-zinc-300">{slot.canalNome}</span>
                        {slot.faixa === 'sazonal' && <span className="shrink-0 text-[9px] text-orange-400">SAZ</span>}
                      </div>
                      {editavel ? (
                        <select
                          autoFocus
                          defaultValue={atrib?.ideiaId || ''}
                          onChange={(e) => {
                            const it = estoque.find((x) => x.id === e.target.value)
                            atribuir(iso, h, slot.canalId, e.target.value, it?.estagio || 'vazio')
                          }}
                          onBlur={() => setEditando(null)}
                          className="mt-1 w-full rounded border border-violet-500 bg-zinc-800 px-1 py-1 text-[11px] text-white focus:outline-none"
                        >
                          <option value="">— vazio —</option>
                          {estoque.map((it) => (
                            <option key={it.id} value={it.id}>{it.estagio} · {it.titulo.slice(0, 40)}</option>
                          ))}
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

        <p className="text-center text-xs text-zinc-500">Clique numa célula pra encaixar/trocar o conteúdo. 🎬 pronto pra publicar · 🎙️/📝/💡 ainda em produção · vazio = produzir.</p>

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
