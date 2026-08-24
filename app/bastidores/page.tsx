'use client'

import { useMemo, useState } from 'react'
import { Film, Check, ChevronDown, ChevronRight, Loader2, ArrowRight, Lock, Plus } from 'lucide-react'

import { useEpisodios, useAtualizarEpisodio, ETAPAS_EPISODIO, type Episodio, type ItemChecklist } from '@/lib/hooks/use-episodios'

/**
 * TRILHA DE VÍDEOS LONGOS — série "Como se constrói um canal sozinho" (Bastidores).
 *
 * SEPARADA da esteira de Shorts de propósito: aqui a produção é roteiro manual → narração →
 * capturas reais → montagem 16:9 → revisão. Nada é automático e nada entra na grade 2/dia.
 * A única ponte com o encanamento comum é a promoção (cria ideia formato=longo, que as cercas
 * do formato mantêm fora do roteador/auto-agendar/cron). Publicação: deliberada, na Central.
 *
 * Por quê a série existe: YPP exige 500 inscritos E (3M views Shorts/90d OU 3.000h de exibição).
 * O canal tem 0 horas — Short não gera hora qualificada. 44 vídeos de ~10min a 40% de retenção
 * fecham as 3.000h. Ver docs/40_PRODUTO/19_SERIE_BASTIDORES.md (roteiros e critério de morte).
 */

const COR_STATUS: Record<string, string> = {
  planejado: 'bg-zinc-700 text-zinc-300',
  roteiro_ok: 'bg-sky-600/30 text-sky-300',
  narracao_gerada: 'bg-violet-600/30 text-violet-300',
  capturas_coletadas: 'bg-fuchsia-600/30 text-fuchsia-300',
  montado: 'bg-amber-600/30 text-amber-300',
  em_revisao: 'bg-orange-600/30 text-orange-300',
  pronto_publicacao: 'bg-emerald-600/30 text-emerald-300',
  publicado: 'bg-emerald-600 text-white',
}

export default function BastidoresPage() {
  const { data: episodios, isLoading } = useEpisodios()
  const ordenados = useMemo(
    () => [...(episodios || [])].sort((a, b) => (a.ordem_producao ?? 99) - (b.ordem_producao ?? 99)),
    [episodios]
  )
  const publicados = (episodios || []).filter((e) => e.status === 'publicado').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-3 text-2xl font-bold text-white">
          <Film className="h-7 w-7 text-violet-400" /> Bastidores — vídeos longos
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Temporada 1 · {publicados}/10 publicados · produção manual (roteiro → narração → capturas → montagem) ·
          rumo às 3.000h do YPP. Fora da grade automática por design.
        </p>
      </div>

      <div className="glass rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-4 text-xs leading-relaxed text-amber-200/90">
        <b>Regra dura da série:</b> todo número dito em voz alta aparece na tela, lido do painel real —
        o checklist de capturas trava a promoção enquanto houver item aberto. Critério de morte:
        4 episódios abaixo de 30% de retenção = formato errado, a trilha morre barata.
      </div>

      {isLoading && <p className="text-sm text-zinc-500">Carregando episódios…</p>}

      <div className="space-y-3">
        {ordenados.map((ep, idx) => (
          <CardEpisodio key={ep.id} ep={ep} posicao={idx + 1} />
        ))}
      </div>
    </div>
  )
}

function CardEpisodio({ ep, posicao }: { ep: Episodio; posicao: number }) {
  const atualizar = useAtualizarEpisodio()
  const [aberto, setAberto] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [novoItem, setNovoItem] = useState('')

  const etapaIdx = ETAPAS_EPISODIO.findIndex((e) => e.status === ep.status)
  const proxima = ETAPAS_EPISODIO[etapaIdx + 1]
  const travado = (ep.notas || '').startsWith('TRAVADO')
  const pendentes = (ep.checklist || []).filter((c) => !c.feito).length

  async function avancar() {
    if (!proxima) return
    setErro(null)
    setOcupado(true)
    try {
      if (proxima.status === 'pronto_publicacao') {
        // a promoção passa pela API: cria ideia formato=longo + pipeline (cercados)
        const r = await fetch('/api/bastidores/promover', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ episodio_id: ep.id }),
        })
        const d = await r.json()
        if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`)
        window.location.reload()
      } else if (proxima.status === 'publicado') {
        throw new Error('Publicação é pela Central de Publicação (bloco Longos), não por aqui.')
      } else {
        await atualizar(ep.id, { status: proxima.status })
      }
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'falhou')
    } finally {
      setOcupado(false)
    }
  }

  async function alternarItem(i: number) {
    const lista = [...(ep.checklist || [])]
    lista[i] = { ...lista[i], feito: !lista[i].feito }
    await atualizar(ep.id, { checklist: lista })
  }

  async function addItem() {
    if (!novoItem.trim()) return
    const lista: ItemChecklist[] = [...(ep.checklist || []), { item: novoItem.trim(), feito: false }]
    setNovoItem('')
    await atualizar(ep.id, { checklist: lista })
  }

  return (
    <div className="glass rounded-2xl border border-zinc-800/50">
      <button type="button" onClick={() => setAberto(!aberto)} className="flex w-full items-center gap-3 p-4 text-left">
        {aberto ? <ChevronDown className="h-4 w-4 shrink-0 text-zinc-500" /> : <ChevronRight className="h-4 w-4 shrink-0 text-zinc-500" />}
        <span className="w-8 shrink-0 text-xs tabular-nums text-zinc-500">{posicao}º</span>
        <span className="w-16 shrink-0 font-mono text-xs text-violet-300">{ep.codigo}</span>
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-white">{ep.titulo}</span>
        {travado && <Lock className="h-3.5 w-3.5 shrink-0 text-amber-400" />}
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${COR_STATUS[ep.status]}`}>
          {ETAPAS_EPISODIO[etapaIdx]?.label ?? ep.status}
        </span>
      </button>

      {aberto && (
        <div className="space-y-4 border-t border-zinc-800/50 p-4 pl-11">
          {ep.gancho && <p className="text-sm text-zinc-300"><b className="text-zinc-500">Gancho:</b> {ep.gancho}</p>}
          {ep.material && <p className="text-xs text-zinc-400"><b className="text-zinc-500">Prova real:</b> {ep.material}</p>}
          {ep.notas && (
            <p className={`rounded-lg p-2 text-xs ${travado ? 'bg-amber-500/10 text-amber-300' : 'bg-zinc-800/40 text-zinc-400'}`}>{ep.notas}</p>
          )}

          {/* esteira do episódio */}
          <div className="flex flex-wrap items-center gap-1.5">
            {ETAPAS_EPISODIO.map((e, i) => (
              <span key={e.status} className={`rounded px-2 py-0.5 text-[10px] ${i <= etapaIdx ? 'bg-violet-600/30 text-violet-200' : 'bg-zinc-800/60 text-zinc-600'}`}>
                {e.label}
              </span>
            ))}
          </div>

          {/* checklist de capturas — número falado = tela coletada */}
          <div>
            <p className="mb-1.5 text-xs font-semibold text-zinc-400">
              Checklist de capturas {pendentes > 0 && <span className="text-amber-400">· {pendentes} aberto(s)</span>}
            </p>
            <div className="space-y-1">
              {(ep.checklist || []).map((c, i) => (
                <button key={`${c.item}-${i}`} type="button" onClick={() => alternarItem(i)}
                  className="flex w-full items-center gap-2 rounded-lg bg-zinc-900/50 px-3 py-1.5 text-left text-xs text-zinc-300 hover:bg-zinc-900">
                  <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${c.feito ? 'border-emerald-500 bg-emerald-600 text-white' : 'border-zinc-600'}`}>
                    {c.feito && <Check className="h-3 w-3" />}
                  </span>
                  <span className={c.feito ? 'line-through opacity-60' : ''}>{c.item}</span>
                </button>
              ))}
            </div>
            <div className="mt-1.5 flex gap-2">
              <input value={novoItem} onChange={(e) => setNovoItem(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addItem()}
                placeholder="ex.: [TELA] fila com 403 itens em PENDENTE"
                className="min-w-0 flex-1 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600" />
              <button type="button" onClick={addItem} className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-700"><Plus className="h-3.5 w-3.5" /></button>
            </div>
          </div>

          {/* urls dos artefatos */}
          <div className="grid gap-2 sm:grid-cols-2">
            <CampoUrl rotulo="Áudio (narração)" valor={ep.audio_url} onSalvar={(v) => atualizar(ep.id, { audio_url: v })} />
            <CampoUrl rotulo="Vídeo montado" valor={ep.video_url} onSalvar={(v) => atualizar(ep.id, { video_url: v })} />
          </div>

          {erro && <p className="rounded-lg bg-red-500/10 p-2 text-xs text-red-300">{erro}</p>}

          {proxima && proxima.status !== 'publicado' && (
            <button type="button" onClick={avancar} disabled={ocupado || travado}
              className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-500 disabled:opacity-40">
              {ocupado ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              {proxima.status === 'pronto_publicacao' ? 'Promover p/ publicação (cria ideia + pipeline)' : `Avançar para: ${proxima.label}`}
            </button>
          )}
          {ep.status === 'pronto_publicacao' && (
            <p className="text-xs text-emerald-300">✅ Pronto — publique pela Central de Publicação (bloco Longos).</p>
          )}
        </div>
      )}
    </div>
  )
}

function CampoUrl({ rotulo, valor, onSalvar }: { rotulo: string; valor: string | null; onSalvar: (v: string) => Promise<void> }) {
  const [v, setV] = useState(valor || '')
  const mudou = v !== (valor || '')
  return (
    <div>
      <p className="mb-1 text-[11px] text-zinc-500">{rotulo}</p>
      <div className="flex gap-1.5">
        <input value={v} onChange={(e) => setV(e.target.value)} placeholder="https://…"
          className="min-w-0 flex-1 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600" />
        {mudou && (
          <button type="button" onClick={() => onSalvar(v)} className="rounded-lg bg-emerald-700 px-2.5 text-xs text-white hover:bg-emerald-600">
            <Check className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}
