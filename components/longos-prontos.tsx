'use client'

import { useState } from 'react'
import { Film, Loader2, Upload } from 'lucide-react'

import { useEpisodios } from '@/lib/hooks/use-episodios'
import { useAtualizarEpisodio } from '@/lib/hooks/use-episodios'

/**
 * Bloco "Longos" da Central de Publicação — só aparece quando existe episódio pronto.
 *
 * Publicação DELIBERADA e só YouTube: o botão chama /api/automation/publicar com a
 * plataforma explícita e confirmar:true (R-011 — o clique É a confirmação humana).
 * O formato longo faz a rota publicar sem #Shorts e com URL watch?v= — e as cercas
 * mantêm este vídeo fora do teto/grade dos Shorts.
 */
export function LongosProntos() {
  const { data: episodios } = useEpisodios()
  const atualizar = useAtualizarEpisodio()
  const [ocupado, setOcupado] = useState<string | null>(null)
  const [msg, setMsg] = useState<Record<string, string>>({})

  const prontos = (episodios || []).filter((e) => e.status === 'pronto_publicacao' && e.ideia_id)
  if (prontos.length === 0) return null

  async function publicar(epId: string) {
    const ep = prontos.find((e) => e.id === epId)
    if (!ep) return
    if (!window.confirm(`Publicar ${ep.codigo} — "${ep.titulo}" no YouTube AGORA?\n\nVídeo longo: sai sem #Shorts, como watch. Lembre de conferir a declaração de voz sintética no Studio depois.`)) return
    setOcupado(epId)
    setMsg((m) => ({ ...m, [epId]: '' }))
    try {
      // pipeline do episódio (criado na promoção)
      const rPipe = await fetch(`/api/bastidores/pipeline?ideia_id=${ep.ideia_id}`, { method: 'GET' })
      const dPipe = await rPipe.json()
      if (!rPipe.ok) throw new Error(dPipe.error || 'pipeline não encontrado')
      const r = await fetch('/api/automation/publicar', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          pipeline_id: dPipe.pipeline_id,
          video_url: ep.video_url,
          caption: `${ep.titulo}\n\nSérie: Como se constrói um canal sozinho — ${ep.codigo}`,
          plataformas: ['youtube'],
          confirmar: true,
        }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`)
      const yt = (d.resultados || []).find((x: { plataforma: string }) => x.plataforma === 'youtube')
      if (yt?.status === 'PUBLICADO') {
        await atualizar(ep.id, { status: 'publicado' })
        setMsg((m) => ({ ...m, [epId]: `✅ No ar: ${yt.url}` }))
      } else {
        setMsg((m) => ({ ...m, [epId]: `⚠ ${yt?.status || 'sem resultado'}: ${yt?.erro || ''}` }))
      }
    } catch (e) {
      setMsg((m) => ({ ...m, [epId]: `✗ ${e instanceof Error ? e.message : 'falhou'}` }))
    } finally {
      setOcupado(null)
    }
  }

  return (
    <div className="mb-4 glass rounded-2xl border border-violet-500/30 bg-violet-500/[0.04] p-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
        <Film className="h-4 w-4 text-violet-400" /> Longos prontos para publicar
        <span className="text-xs font-normal text-zinc-500">· só YouTube · fora da grade dos Shorts</span>
      </h3>
      <div className="mt-3 space-y-2">
        {prontos.map((ep) => (
          <div key={ep.id} className="flex flex-wrap items-center gap-3 rounded-lg bg-zinc-900/50 px-3 py-2">
            <span className="font-mono text-xs text-violet-300">{ep.codigo}</span>
            <span className="min-w-0 flex-1 truncate text-sm text-zinc-200">{ep.titulo}</span>
            <button type="button" onClick={() => publicar(ep.id)} disabled={ocupado !== null}
              className="flex items-center gap-2 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-500 disabled:opacity-50">
              {ocupado === ep.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              Publicar no YouTube
            </button>
            {msg[ep.id] && <p className="w-full text-xs text-zinc-400">{msg[ep.id]}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
