'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AudioLines, RefreshCw, RotateCcw, Clapperboard, Loader2, Info } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { ErrorState } from '@/components/ui/error-state'

interface AudioItem {
  id: string
  ideia_id: string
  roteiro_id: string | null
  public_url: string | null
  url: string | null
  duracao_segundos: number | null
  qualidade_voz_ia: number | null
  created_at: string
  titulo: string
  status: string
  numero?: number
}

// estágio do pipeline -> rótulo + cor + ordem + se dá pra mandar renderizar
const STATUS: Record<string, { label: string; cls: string; ord: number; renderizavel?: boolean }> = {
  AUDIO_GERADO: { label: 'Áudio pronto — aguardando render', cls: 'text-emerald-300 bg-emerald-500/10 ring-emerald-500/30', ord: 0, renderizavel: true },
  EM_EDICAO: { label: 'Na fila de render', cls: 'text-sky-300 bg-sky-500/10 ring-sky-500/30', ord: 1 },
  PRONTO_PUBLICACAO: { label: 'Renderizado', cls: 'text-violet-300 bg-violet-500/10 ring-violet-500/30', ord: 2 },
  PUBLICADO: { label: 'Publicado', cls: 'text-zinc-400 bg-zinc-500/10 ring-zinc-500/30', ord: 3 },
}
const cfg = (s: string) => STATUS[s] || { label: s, cls: 'text-zinc-400 bg-zinc-500/10 ring-zinc-500/30', ord: 4 }

const fmtDur = (s: number | null) =>
  s ? `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}` : '—'

export default function AudiosPage() {
  const qc = useQueryClient()
  const [filtro, setFiltro] = useState<string>('todos')

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['audios'],
    queryFn: async (): Promise<AudioItem[]> => {
      const [au, id, pp] = await Promise.all([
        supabase
          .schema('pulso_content')
          .from('audios')
          .select('id, ideia_id, roteiro_id, public_url, url, duracao_segundos, qualidade_voz_ia, created_at'),
        supabase.schema('pulso_content').from('ideias').select('id, titulo'),
        supabase.schema('pulso_content').from('pipeline_producao').select('ideia_id, status, metadata'),
      ])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const idMap = new Map((id.data || []).map((i: any) => [i.id, i.titulo]))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ppMap = new Map((pp.data || []).map((p: any) => [p.ideia_id, p]))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (au.data || []).map((a: any) => {
        const p = ppMap.get(a.ideia_id)
        return {
          ...a,
          titulo: idMap.get(a.ideia_id) || '(sem título)',
          status: p?.status || '—',
          numero: p?.metadata?.numero,
        }
      })
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  })

  // mandar renderizar = AUDIO_GERADO -> EM_EDICAO (o gate de render; worker local consome EM_EDICAO)
  const renderizar = useMutation({
    mutationFn: async (ideia_id: string) => {
      const r = await fetch('/api/producao/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ideia_id, status: 'EM_EDICAO' }),
      })
      if (!r.ok) throw new Error((await r.json()).error || 'falha ao mandar renderizar')
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['audios'] }),
  })

  const refazer = useMutation({
    mutationFn: async (roteiro_id: string) => {
      const r = await fetch('/api/automation/gerar-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roteiro_id, force: true }),
      })
      if (!r.ok) throw new Error((await r.json()).error || 'Falha ao refazer')
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['audios'] }),
  })

  const audios = useMemo(
    () => [...(data || [])].sort((a, b) => cfg(a.status).ord - cfg(b.status).ord),
    [data],
  )
  const contagem = useMemo(() => {
    const c: Record<string, number> = {}
    for (const a of audios) c[a.status] = (c[a.status] || 0) + 1
    return c
  }, [audios])
  const aguardando = useMemo(() => audios.filter((a) => cfg(a.status).renderizavel).length, [audios])

  const filtrados = filtro === 'todos' ? audios : audios.filter((a) => a.status === filtro)

  if (isError) {
    return (
      <div className="min-h-screen bg-zinc-950 p-8">
        <div className="mx-auto max-w-5xl">
          <ErrorState title="Erro ao carregar áudios" message="Não foi possível carregar os áudios." onRetry={() => refetch()} />
        </div>
      </div>
    )
  }

  const Chip = ({ v, label, n }: { v: string; label: string; n?: number }) => (
    <button
      onClick={() => setFiltro(v)}
      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
        filtro === v ? 'bg-teal-600 text-white' : 'bg-zinc-900/60 text-zinc-400 ring-1 ring-zinc-700/50 hover:text-white'
      }`}
    >
      {label} {n !== undefined && <span className="opacity-70">({n})</span>}
    </button>
  )

  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <div className="mx-auto max-w-5xl">
        {/* header */}
        <div className="mb-6">
          <div className="mb-2 flex items-center gap-3">
            <AudioLines className="h-7 w-7 text-teal-400" />
            <h1 className="bg-linear-to-r from-teal-400 to-cyan-400 bg-clip-text text-4xl font-black text-transparent">
              Áudios
            </h1>
          </div>
          <p className="text-zinc-400">
            Os áudios gerados, prontos pra revisar. Ouça, refaça um ruim antes de gastar render, e clique{' '}
            <b className="text-teal-300">Renderizar</b> pra mandar o vídeo (o passo caro só com seu OK).
          </p>
        </div>

        {/* aguardando render */}
        {aguardando > 0 && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-200">
            <Info className="h-4 w-4 shrink-0" />
            {aguardando} áudio{aguardando > 1 ? 's' : ''} pronto aguardando você mandar renderizar. O render roda no worker
            local (08/16/23h).
          </div>
        )}

        {/* filtros */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Chip v="todos" label="Todos" n={audios.length} />
          <Chip v="AUDIO_GERADO" label="🟢 Aguardando render" n={contagem.AUDIO_GERADO || 0} />
          <Chip v="EM_EDICAO" label="🎬 Na fila de render" n={contagem.EM_EDICAO || 0} />
          <Chip v="PRONTO_PUBLICACAO" label="Renderizados" n={contagem.PRONTO_PUBLICACAO || 0} />
          <Chip v="PUBLICADO" label="Publicados" n={contagem.PUBLICADO || 0} />
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-zinc-700/50 bg-zinc-900/60 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-800 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} /> Atualizar
          </button>
        </div>

        {/* lista */}
        {isLoading ? (
          <div className="flex items-center justify-center gap-3 rounded-2xl border border-zinc-800/50 bg-zinc-900/40 py-20 text-zinc-400">
            <Loader2 className="h-5 w-5 animate-spin" /> Carregando áudios…
          </div>
        ) : filtrados.length === 0 ? (
          <p className="rounded-2xl border border-zinc-800/50 bg-zinc-900/40 py-16 text-center text-zinc-500">
            Nenhum áudio nesse filtro.
          </p>
        ) : (
          <div className="space-y-2">
            {filtrados.map((a) => {
              const c = cfg(a.status)
              const src = a.public_url || a.url || ''
              const refazendoEste = refazer.isPending && refazer.variables === a.roteiro_id
              const renderizandoEste = renderizar.isPending && renderizar.variables === a.ideia_id
              return (
                <div
                  key={a.id}
                  className="rounded-2xl border border-zinc-800/50 bg-zinc-900/40 p-4 transition-colors hover:border-zinc-700/60"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    {a.numero != null && <span className="text-xs font-bold text-zinc-500">#{a.numero}</span>}
                    <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ${c.cls}`}>{c.label}</span>
                    {a.qualidade_voz_ia != null && (
                      <span className="rounded-md bg-zinc-800/60 px-2 py-0.5 text-[11px] text-zinc-400">
                        qual. {a.qualidade_voz_ia}
                      </span>
                    )}
                    <span className="text-[11px] text-zinc-600">{fmtDur(a.duracao_segundos)}</span>
                  </div>
                  <p className="mt-1.5 font-medium text-zinc-100">{a.titulo}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    {src ? (
                      <audio controls preload="none" src={src} className="h-9 w-full max-w-sm" />
                    ) : (
                      <span className="text-sm text-zinc-600">sem arquivo de áudio</span>
                    )}
                    <div className="ml-auto flex items-center gap-2">
                      {c.renderizavel && (
                        <button
                          onClick={() => renderizar.mutate(a.ideia_id)}
                          disabled={renderizar.isPending}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-teal-500/30 bg-teal-500/10 px-3 py-1.5 text-sm font-medium text-teal-300 transition-colors hover:bg-teal-500/20 disabled:opacity-50"
                        >
                          {renderizandoEste ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clapperboard className="h-4 w-4" />}
                          Renderizar
                        </button>
                      )}
                      {a.status !== 'PUBLICADO' && a.roteiro_id && (
                        <button
                          onClick={() => {
                            if (confirm('Refazer o áudio? Apaga o atual e gera de novo (custo de TTS).')) {
                              refazer.mutate(a.roteiro_id!)
                            }
                          }}
                          disabled={refazer.isPending}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700/60 bg-zinc-900/60 px-3 py-1.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 disabled:opacity-50"
                        >
                          {refazendoEste ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                          Refazer
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
