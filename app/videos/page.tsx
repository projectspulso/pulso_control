'use client'

import { useState, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { Video, Play, Download, Zap, RefreshCw } from 'lucide-react'
import { buildSubtitles, selectPose, selectBackground } from '@/lib/video/subtitles'
import type { PulsoVideoProps, MascotePose, Background } from '@/remotion/PulsoVideo'

// Remotion Player só no client (sem SSR)
const PlayerComponent = dynamic(
  () => import('./VideoPlayer'),
  { ssr: false, loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-zinc-900 rounded-xl">
      <div className="text-center">
        <RefreshCw className="h-8 w-8 animate-spin text-purple-400 mx-auto mb-2" />
        <p className="text-zinc-400 text-sm">Carregando player...</p>
      </div>
    </div>
  )}
)

const POSES: { value: MascotePose; label: string; desc: string }[] = [
  { value: 1, label: 'Surpreso',  desc: 'Revelações, ganchos fortes' },
  { value: 2, label: 'Relaxado',  desc: 'Conteúdo calmo, reflexivo' },
  { value: 3, label: 'Animado',   desc: 'Storytelling, descobertas' },
  { value: 4, label: 'Cool',      desc: 'CTA, conclusões, tendências' },
  { value: 5, label: 'Sério',     desc: 'Dark, mistérios, fatos' },
]

const BACKGROUNDS: { value: Background; label: string }[] = [
  { value: 1, label: 'Gradiente Roxo/Amarelo' },
  { value: 2, label: 'Azul Profundo' },
  { value: 3, label: 'Verde/Escuro' },
  { value: 4, label: 'Rosa/Violeta' },
  { value: 5, label: 'Claro/Suave' },
]

const EXEMPLO_ROTEIRO = `Você não vai acreditar nesse experimento. Em 1950, cientistas soviéticos costuraram dois cães juntos, criando um ser único. O resultado foi perturbador e mudou a história da medicina para sempre. Se isso te chocou, imagina o que mais estamos descobrindo. Segue o PULSO e não perca as próximas revelações.`

export default function VideosPage() {
  const [titulo, setTitulo] = useState('Experimento Mais Bizarro da Ciência')
  const [roteiro, setRoteiro] = useState(EXEMPLO_ROTEIRO)
  const [duracao, setDuracao] = useState(45)
  const [pose, setPose] = useState<MascotePose>(1)
  const [background, setBackground] = useState<Background>(2)
  const [audioUrl, setAudioUrl] = useState('')
  const [generating, setGenerating] = useState(false)
  const [jobId, setJobId] = useState<string | null>(null)
  const [jobStatus, setJobStatus] = useState<string | null>(null)

  const videoProps: PulsoVideoProps = {
    titulo,
    subtitles: buildSubtitles(roteiro, duracao),
    pose,
    background,
    audioUrl: audioUrl || undefined,
    showLogo: true,
  }

  const handleAutoSelect = () => {
    setPose(selectPose(titulo))
    setBackground(selectBackground(titulo))
  }

  const handleGerarVideo = async () => {
    setGenerating(true)
    setJobStatus('Enfileirando geração...')
    try {
      const res = await fetch('/api/automation/gerar-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo,
          roteiro,
          duracao_segundos: duracao,
          pose,
          background,
          audio_url: audioUrl || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setJobId(data.job_id)
      setJobStatus(data.message || 'Na fila...')
    } catch (err) {
      setJobStatus(`Erro: ${err instanceof Error ? err.message : 'desconhecido'}`)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Video className="h-7 w-7 text-purple-400" />
            <h1 className="text-3xl font-black text-white">Gerador de Vídeos</h1>
          </div>
          <p className="text-zinc-400">Crie shorts com o mascote PULSO via Remotion — 1080×1920, 9:16</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Painel de configuração */}
          <div className="space-y-6">

            {/* Conteúdo */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h3 className="text-white font-semibold mb-4">Conteúdo</h3>

              <label className="block text-sm text-zinc-400 mb-1">Título</label>
              <input
                type="text"
                value={titulo}
                onChange={e => setTitulo(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white text-sm mb-4 focus:outline-none focus:border-purple-500"
              />

              <label className="block text-sm text-zinc-400 mb-1">Roteiro / Legenda</label>
              <textarea
                value={roteiro}
                onChange={e => setRoteiro(e.target.value)}
                rows={6}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white text-sm mb-4 focus:outline-none focus:border-purple-500 resize-none"
              />

              <div className="flex gap-4 items-center">
                <div className="flex-1">
                  <label className="block text-sm text-zinc-400 mb-1">Duração (segundos)</label>
                  <input
                    type="number"
                    min={15} max={60}
                    value={duracao}
                    onChange={e => setDuracao(Number(e.target.value))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm text-zinc-400 mb-1">URL do Áudio (opcional)</label>
                  <input
                    type="text"
                    value={audioUrl}
                    onChange={e => setAudioUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>

            {/* Mascote */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold">Mascote & Visual</h3>
                <button
                  type="button"
                  onClick={handleAutoSelect}
                  className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 bg-purple-500/10 px-3 py-1.5 rounded-lg border border-purple-500/30 transition-colors"
                >
                  <Zap className="h-3 w-3" />
                  Auto-selecionar
                </button>
              </div>

              <label className="block text-sm text-zinc-400 mb-2">Pose do mascote</label>
              <div className="grid grid-cols-5 gap-2 mb-4">
                {POSES.map(p => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPose(p.value)}
                    title={p.desc}
                    className={`flex flex-col items-center gap-1 rounded-lg p-2 border transition-all ${
                      pose === p.value
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-zinc-700 hover:border-zinc-600'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/pulso/${p.value}.png`} alt={p.label} className="w-12 h-12 object-contain" />
                    <span className="text-[10px] text-zinc-400">{p.label}</span>
                  </button>
                ))}
              </div>

              <label className="block text-sm text-zinc-400 mb-2">Background</label>
              <div className="grid grid-cols-5 gap-2">
                {BACKGROUNDS.map(b => (
                  <button
                    key={b.value}
                    type="button"
                    onClick={() => setBackground(b.value)}
                    title={b.label}
                    className={`rounded-lg overflow-hidden border-2 transition-all ${
                      background === b.value ? 'border-purple-500' : 'border-zinc-700'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/pulso/back${b.value}.png`} alt={b.label} className="w-full h-12 object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Ações */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleGerarVideo}
                disabled={generating}
                className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                <Download className="h-4 w-4" />
                {generating ? 'Enfileirando...' : 'Gerar MP4'}
              </button>
            </div>

            {jobStatus && (
              <div className={`rounded-xl px-4 py-3 text-sm border ${
                jobStatus.startsWith('Erro')
                  ? 'bg-red-500/10 border-red-500/30 text-red-400'
                  : 'bg-green-500/10 border-green-500/30 text-green-400'
              }`}>
                {jobStatus}
                {jobId && <span className="block text-xs text-zinc-500 mt-1">Job ID: {jobId}</span>}
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="flex flex-col gap-4">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Play className="h-4 w-4 text-purple-400" />
              Preview (9:16)
            </h3>

            <div className="flex justify-center">
              <div style={{ width: 360, height: 640 }} className="rounded-xl overflow-hidden border border-zinc-700 shadow-2xl">
                <Suspense fallback={
                  <div className="flex h-full w-full items-center justify-center bg-zinc-900">
                    <RefreshCw className="h-8 w-8 animate-spin text-purple-400" />
                  </div>
                }>
                  <PlayerComponent videoProps={videoProps} duracao={duracao} />
                </Suspense>
              </div>
            </div>

            <p className="text-center text-xs text-zinc-500">
              Preview interativo — use os controles para reproduzir
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
