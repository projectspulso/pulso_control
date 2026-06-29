'use client'

import { useState } from 'react'
import { Copy, Check, ChevronDown, ChevronUp, Save, Plus, Send, ExternalLink } from 'lucide-react'

import { useCentralPublicacao, useSalvarPublicacao, REDES_PADRAO, type PubRede, type VideoPub } from '@/lib/hooks/use-central-publicacao'

function BotaoCopiar({ texto }: { texto: string }) {
  const [ok, setOk] = useState(false)
  if (!texto) return null
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(texto); setOk(true); setTimeout(() => setOk(false), 1200) }}
      className="inline-flex items-center gap-1 rounded-md border border-zinc-700 px-2 py-1 text-[11px] font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
    >
      {ok ? <><Check className="h-3 w-3 text-emerald-400" /> copiado</> : <><Copy className="h-3 w-3" /> copiar</>}
    </button>
  )
}

function CartaoVideo({ video }: { video: VideoPub }) {
  const [aberto, setAberto] = useState(false)
  const salvar = useSalvarPublicacao()
  // estado editável: por rede { titulo, legenda }. inicia dos salvos ou defaults.
  const [edits, setEdits] = useState<Record<string, PubRede>>(video.publicacao)
  const [novaRede, setNovaRede] = useState('')

  const hubUrl = typeof window !== 'undefined' && video.numero != null ? `${window.location.origin}/v/${video.numero}` : ''
  const redes = Array.from(new Set([...REDES_PADRAO, ...Object.keys(video.publicacao)]))

  function get(rede: string, campo: 'titulo' | 'legenda'): string {
    const salvo = edits[rede]?.[campo]
    if (salvo != null) return salvo
    if (campo === 'titulo') return rede === 'youtube' ? video.tituloCurto : ''
    return video.captionBase
  }
  function set(rede: string, campo: 'titulo' | 'legenda', valor: string) {
    setEdits((e) => ({ ...e, [rede]: { ...e[rede], [campo]: valor } }))
  }
  function addRede() {
    const r = novaRede.trim().toLowerCase()
    if (!r || redes.includes(r)) return
    setEdits((e) => ({ ...e, [r]: { legenda: video.captionBase } }))
    setNovaRede('')
  }

  const usaTitulo = (rede: string) => rede === 'youtube'

  return (
    <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/40">
      <button onClick={() => setAberto((v) => !v)} className="flex w-full items-center gap-3 p-4 text-left">
        <span className="shrink-0 rounded bg-zinc-800 px-2 py-0.5 text-xs font-bold text-zinc-300">#{video.numero ?? '—'}</span>
        <span className="min-w-0 flex-1 truncate font-semibold text-white">{video.titulo}</span>
        <div className="hidden shrink-0 gap-1 sm:flex">
          {REDES_PADRAO.map((r) => (
            <span key={r} title={r} className={`h-2 w-2 rounded-full ${video.publicadoEm.includes(r) ? 'bg-emerald-400' : 'bg-zinc-700'}`} />
          ))}
        </div>
        {aberto ? <ChevronUp className="h-4 w-4 shrink-0 text-zinc-500" /> : <ChevronDown className="h-4 w-4 shrink-0 text-zinc-500" />}
      </button>

      {aberto && (
        <div className="space-y-4 border-t border-zinc-800/50 p-4">
          {video.videoUrl && (
            <a href={video.videoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300">
              <ExternalLink className="h-3 w-3" /> arquivo do vídeo
            </a>
          )}

          {video.numero != null && (
            <div className="rounded-lg bg-cyan-500/5 p-3 ring-1 ring-cyan-500/20">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">Link do hub (cross-rede / SEO)</span>
                <BotaoCopiar texto={hubUrl} />
              </div>
              <code className="block break-all text-xs text-zinc-300">{hubUrl}</code>
              <p className="mt-1.5 text-[10px] leading-relaxed text-zinc-500">
                ✅ Cole na <b className="text-zinc-300">descrição do YouTube</b> e use o <b className="text-zinc-300">/hub na bio</b> das redes.
                ❌ Não cole em legenda de IG/TikTok/FB — não vira clicável e <b className="text-zinc-300">derruba o alcance</b> (manda pra fora da rede).
              </p>
            </div>
          )}
          {redes.map((rede) => (
            <div key={rede} className="rounded-lg bg-zinc-900/60 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">{rede}</span>
                {video.publicadoEm.includes(rede) && <span className="text-[10px] font-semibold text-emerald-400">já publicado</span>}
              </div>
              {usaTitulo(rede) && (
                <div className="mb-2">
                  <div className="mb-1 flex items-center justify-between"><label className="text-[10px] text-zinc-500">Título</label><BotaoCopiar texto={get(rede, 'titulo')} /></div>
                  <input value={get(rede, 'titulo')} onChange={(e) => set(rede, 'titulo', e.target.value)}
                    className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-200 focus:border-cyan-500 focus:outline-none" />
                </div>
              )}
              <div>
                <div className="mb-1 flex items-center justify-between"><label className="text-[10px] text-zinc-500">{usaTitulo(rede) ? 'Descrição' : 'Legenda'}</label><BotaoCopiar texto={get(rede, 'legenda')} /></div>
                <textarea value={get(rede, 'legenda')} onChange={(e) => set(rede, 'legenda', e.target.value)} rows={3}
                  className="w-full resize-y rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-200 focus:border-cyan-500 focus:outline-none" />
              </div>
            </div>
          ))}

          <div className="flex flex-wrap items-center gap-2">
            <input value={novaRede} onChange={(e) => setNovaRede(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addRede()}
              placeholder="nova rede (ex.: kwai, linkedin)" className="rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-xs text-zinc-300 focus:border-cyan-500 focus:outline-none" />
            <button onClick={addRede} className="inline-flex items-center gap-1 rounded-md border border-zinc-700 px-2 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800"><Plus className="h-3 w-3" /> adicionar rede</button>
            <button onClick={() => salvar.mutate({ pipelineId: video.pipelineId, publicacao: edits })} disabled={salvar.isPending}
              className="ml-auto inline-flex items-center gap-1 rounded-md bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-cyan-500 disabled:opacity-50">
              <Save className="h-3 w-3" /> {salvar.isPending ? 'salvando…' : salvar.isSuccess ? 'salvo ✓' : 'salvar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function CentralPublicacao() {
  const { data, isLoading } = useCentralPublicacao()
  if (isLoading) return <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-zinc-900/50" />)}</div>
  if (!data || !data.length) return null
  return (
    <div className="glass rounded-2xl border border-cyan-500/20 p-5">
      <div className="mb-3 flex items-center gap-2">
        <Send className="h-4 w-4 text-cyan-300" />
        <h2 className="text-sm font-bold text-white">Central de Publicação</h2>
        <span className="ml-auto text-[11px] text-zinc-500">{data.length} vídeos · título/legenda por rede</span>
      </div>
      <p className="mb-4 text-[11px] text-zinc-500">A fonte das publicações manuais. Conteúdo por rede pra copiar; edite e <b className="text-zinc-300">salve</b> pra fixar; <b className="text-zinc-300">adicione redes novas</b> quando criar. 🟢 = já publicado.</p>
      <div className="space-y-2">
        {data.map((v) => <CartaoVideo key={v.pipelineId} video={v} />)}
      </div>
    </div>
  )
}
