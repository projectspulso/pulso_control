'use client'

import { useState } from 'react'
import { Copy, Check, ChevronDown, ChevronUp, Save, Plus, Send, ExternalLink, CheckCircle2, Smartphone } from 'lucide-react'

import { useCentralPublicacao, useSalvarPublicacao, useAtualizarNumeros, usePerfilRede, useSalvarPerfilRede, REDES_PADRAO, type PubRede, type VideoPub } from '@/lib/hooks/use-central-publicacao'

// Redes 100% manuais (sem API/coletor) — o "já publicado" só entra quando você marca no app.
const REDES_MANUAIS = new Set(['kwai'])
const HASHTAGS_KWAI = '#curiosidades #misterios #voceSabia #pulso #fyp #viral'

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
  const numeros = useAtualizarNumeros()
  // números manuais por rede (views/likes) — só pra redes sem coletor (Kwai)
  const [nums, setNums] = useState<Record<string, { views: string; likes: string }>>({})
  const getNum = (rede: string, campo: 'views' | 'likes') => nums[rede]?.[campo] ?? ''
  const setNum = (rede: string, campo: 'views' | 'likes', v: string) =>
    setNums((n) => ({
      ...n,
      [rede]: { views: n[rede]?.views ?? '', likes: n[rede]?.likes ?? '', [campo]: v.replace(/\D/g, '') },
    }))
  // estado editável: por rede { titulo, legenda }. inicia dos salvos ou defaults.
  const [edits, setEdits] = useState<Record<string, PubRede>>(video.publicacao)
  const [novaRede, setNovaRede] = useState('')

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const hubUrl = origin && video.numero != null ? `${origin}/v/${video.numero}` : ''
  const hubHome = origin ? `${origin}/hub` : ''
  const redes = Array.from(new Set([...REDES_PADRAO, ...Object.keys(video.publicacao)]))

  function get(rede: string, campo: 'titulo' | 'legenda'): string {
    const salvo = edits[rede]?.[campo]
    if (salvo != null) return salvo
    if (campo === 'titulo') return rede === 'youtube' ? video.tituloCurto : ''
    // só o YouTube ganha o link na descrição (IG/TikTok/FB/Kwai ficam limpos — link só na bio)
    if (rede === 'youtube' && hubHome) return `${video.captionBase}\n\n🔗 Mais histórias: ${hubHome}`
    // Kwai: legenda + hashtags do Kwai (mercado BR, curte hashtag)
    if (rede === 'kwai') return `${video.captionBase}\n\n${HASHTAGS_KWAI}`
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
        {video.thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={video.thumb} alt="" className="h-12 w-8 shrink-0 rounded object-cover ring-1 ring-zinc-700" loading="lazy" />
        ) : (
          <span className="flex h-12 w-8 shrink-0 items-center justify-center rounded bg-zinc-800 text-[10px] text-zinc-600">🎬</span>
        )}
        <span className="shrink-0 rounded bg-zinc-800 px-2 py-0.5 text-xs font-bold text-zinc-300">#{video.numero ?? '—'}</span>
        <span className="min-w-0 flex-1 truncate font-semibold text-white">{video.titulo}</span>
        {!video.pronto && (
          <span className="shrink-0 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-300">a montar</span>
        )}
        <div className="hidden shrink-0 gap-1 sm:flex">
          {REDES_PADRAO.map((r) => (
            <span key={r} title={r} className={`h-2 w-2 rounded-full ${video.publicadoEm.includes(r) ? 'bg-emerald-400' : 'bg-zinc-700'}`} />
          ))}
        </div>
        {aberto ? <ChevronUp className="h-4 w-4 shrink-0 text-zinc-500" /> : <ChevronDown className="h-4 w-4 shrink-0 text-zinc-500" />}
      </button>

      {aberto && (
        <div className="space-y-4 border-t border-zinc-800/50 p-4">
          {!video.pronto ? (
            <p className="text-xs text-zinc-400">Vídeo <b className="text-amber-300">em produção</b> (status: {video.status}). A descrição por rede e o link do hub aparecem aqui quando ficar pronto.</p>
          ) : (
          <>
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
          {redes.map((rede) => {
            const jaPub = video.publicadoEm.includes(rede)
            const dataPub = video.publicadoDatas[rede]
            return (
            <div key={rede} className={`rounded-lg p-3 ${jaPub ? 'bg-amber-500/5 ring-1 ring-amber-500/40' : 'bg-zinc-900/60'}`}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-zinc-300">
                  {rede}
                  {REDES_MANUAIS.has(rede) && (
                    <span title="Rede manual — só posta pelo celular" className="inline-flex items-center gap-0.5 rounded bg-zinc-800 px-1 py-0.5 text-[9px] font-medium normal-case text-zinc-400">
                      <Smartphone className="h-2.5 w-2.5" /> celular
                    </span>
                  )}
                </span>
                {jaPub && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300 ring-1 ring-amber-500/40">
                    ⚠️ já publicado{dataPub ? ` em ${dataPub}` : ''} — não repostar
                  </span>
                )}
              </div>
              {REDES_MANUAIS.has(rede) && (
                <div className="mb-2 flex flex-wrap items-center gap-2 rounded-md bg-zinc-950/60 p-2">
                  <input inputMode="numeric" value={getNum(rede, 'views')} onChange={(e) => setNum(rede, 'views', e.target.value)} placeholder="views"
                    className="w-20 rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-200 focus:border-cyan-500 focus:outline-none" />
                  <input inputMode="numeric" value={getNum(rede, 'likes')} onChange={(e) => setNum(rede, 'likes', e.target.value)} placeholder="curtidas"
                    className="w-20 rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-200 focus:border-cyan-500 focus:outline-none" />
                  <button
                    onClick={() => numeros.mutate({ ideiaId: video.ideiaId, rede, views: getNum(rede, 'views') ? Number(getNum(rede, 'views')) : undefined, likes: getNum(rede, 'likes') ? Number(getNum(rede, 'likes')) : undefined })}
                    disabled={numeros.isPending}
                    className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
                    title="Salva views/curtidas do app do Kwai (também marca como publicado)"
                  >
                    <CheckCircle2 className="h-3 w-3" /> {numeros.isPending ? 'salvando…' : 'salvar números'}
                  </button>
                  <span className="text-[10px] text-zinc-500">📱 números do app do Kwai</span>
                </div>
              )}
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
            )
          })}

          <div className="flex flex-wrap items-center gap-2">
            <input value={novaRede} onChange={(e) => setNovaRede(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addRede()}
              placeholder="nova rede (ex.: kwai, linkedin)" className="rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-xs text-zinc-300 focus:border-cyan-500 focus:outline-none" />
            <button onClick={addRede} className="inline-flex items-center gap-1 rounded-md border border-zinc-700 px-2 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800"><Plus className="h-3 w-3" /> adicionar rede</button>
            <button onClick={() => salvar.mutate({ pipelineId: video.pipelineId, publicacao: edits })} disabled={salvar.isPending}
              className="ml-auto inline-flex items-center gap-1 rounded-md bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-cyan-500 disabled:opacity-50">
              <Save className="h-3 w-3" /> {salvar.isPending ? 'salvando…' : salvar.isSuccess ? 'salvo ✓' : 'salvar'}
            </button>
          </div>
          </>
          )}
        </div>
      )}
    </div>
  )
}

function PerfilKwai() {
  const { data } = usePerfilRede('kwai')
  const salvar = useSalvarPerfilRede()
  const [seg, setSeg] = useState('')
  const [cur, setCur] = useState('')
  // preenche com o salvo quando chega
  const seguidores = seg !== '' ? seg : String(data?.seguidores ?? '')
  const curtidas = cur !== '' ? cur : String(data?.curtidas ?? '')
  const quando = data?.quando ? new Date(data.quando).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : null
  return (
    <div className="mb-4 rounded-xl border border-amber-500/25 bg-amber-500/5 p-3">
      <div className="mb-2 flex items-center gap-2">
        <Smartphone className="h-3.5 w-3.5 text-amber-300" />
        <span className="text-xs font-bold uppercase tracking-wider text-amber-200">Perfil Kwai (conta)</span>
        {quando && <span className="text-[10px] text-zinc-500">atualizado {quando}</span>}
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-[10px] text-zinc-400">Seguidores
          <input inputMode="numeric" value={seguidores} onChange={(e) => setSeg(e.target.value.replace(/\D/g, ''))}
            className="mt-0.5 block w-24 rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-zinc-200 focus:border-amber-500 focus:outline-none" />
        </label>
        <label className="text-[10px] text-zinc-400">Curtidas
          <input inputMode="numeric" value={curtidas} onChange={(e) => setCur(e.target.value.replace(/\D/g, ''))}
            className="mt-0.5 block w-24 rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-zinc-200 focus:border-amber-500 focus:outline-none" />
        </label>
        <button
          onClick={() => salvar.mutate({ rede: 'kwai', seguidores: Number(seguidores) || 0, curtidas: Number(curtidas) || 0 })}
          disabled={salvar.isPending}
          className="inline-flex items-center gap-1 rounded-md bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
        >
          <Save className="h-3 w-3" /> {salvar.isPending ? 'salvando…' : salvar.isSuccess ? 'salvo ✓' : 'salvar'}
        </button>
        <span className="text-[10px] text-zinc-500">📱 do app do Kwai (perfil)</span>
      </div>
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
      <p className="mb-4 text-[11px] text-zinc-500">A fonte das publicações manuais. Conteúdo por rede pra copiar; edite e <b className="text-zinc-300">salve</b> pra fixar; <b className="text-zinc-300">adicione redes novas</b> quando criar. 🟢 = já publicado. No <b className="text-amber-300">Kwai</b> (📱 celular): salve views/curtidas por vídeo e o perfil abaixo.</p>
      <PerfilKwai />
      <div className="space-y-2">
        {data.map((v) => <CartaoVideo key={v.pipelineId} video={v} />)}
      </div>
    </div>
  )
}
