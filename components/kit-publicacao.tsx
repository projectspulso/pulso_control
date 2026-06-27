'use client'

import { useState } from 'react'
import { Copy, Check, ChevronDown, ChevronRight, BookOpen } from 'lucide-react'

import { useKitPublicacao, type KitVideo } from '@/lib/hooks/use-kit-publicacao'

const FB_COMPOSER = 'https://business.facebook.com/latest/reels_composer?asset_id=926237593895365&business_id=1539817773572500'

function CopyBtn({ texto, label }: { texto: string; label: string }) {
  const [ok, setOk] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(texto); setOk(true); setTimeout(() => setOk(false), 1500) }}
      className="inline-flex items-center gap-1 rounded bg-zinc-800 px-2 py-1 text-[10px] font-semibold text-zinc-300 hover:bg-zinc-700"
    >
      {ok ? <><Check className="h-3 w-3 text-emerald-400" /> copiado</> : <><Copy className="h-3 w-3" /> {label}</>}
    </button>
  )
}

const PASSOS = {
  youtube: ['Studio → Criar → Enviar vídeos', 'Selecione o arquivo (OneDrive)', 'Cole o TÍTULO curto', 'Cole a DESCRIÇÃO (legenda)', '"Não é conteúdo para crianças"', 'Avançar ×3 → Público → Publicar'],
  facebook: ['Abra o composer da Pulso Projects (botão abaixo)', 'Adicionar vídeo → selecione o arquivo', '⚠️ DESMARQUE o Instagram (só Pulso Projects)', 'Cole a legenda', 'Avançar (sem música) → Avançar → Compartilhar'],
  tiktok: ['O app já criou o rascunho — abra o TikTok no celular', 'Cole a legenda', 'Publicar'],
  instagram: ['Sai automático: tela /publicar → "Enviar agora"'],
}

function VideoCard({ v }: { v: KitVideo }) {
  const [aberto, setAberto] = useState<string | null>(null)
  const toggle = (k: string) => setAberto((a) => (a === k ? null : k))
  return (
    <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-bold text-white">{v.numero != null ? `#${v.numero}` : ''} {v.tituloCurto}</span>
        <div className="ml-auto flex gap-1.5">
          <CopyBtn texto={v.tituloCurto} label="título" />
          <CopyBtn texto={v.legenda} label="legenda" />
          {v.videoUrl && <CopyBtn texto={v.videoUrl} label="link" />}
        </div>
      </div>
      <p className="mt-1 truncate text-[10px] text-zinc-500" title={v.arquivoOneDrive}>📁 {v.arquivoOneDrive}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {(['youtube', 'facebook', 'tiktok', 'instagram'] as const).map((rede) => (
          <button key={rede} onClick={() => toggle(rede)} className={`flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-semibold ${aberto === rede ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}>
            {aberto === rede ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />} {rede}
          </button>
        ))}
      </div>
      {aberto && (
        <ol className="mt-2 list-decimal space-y-0.5 rounded-lg bg-zinc-950/50 p-3 pl-6 text-[11px] text-zinc-300">
          {PASSOS[aberto as keyof typeof PASSOS].map((p, i) => <li key={i}>{p}</li>)}
          {aberto === 'facebook' && (
            <a href={FB_COMPOSER} target="_blank" rel="noreferrer" className="mt-1 inline-block text-[10px] font-semibold text-violet-300 hover:text-violet-200">→ abrir composer Pulso Projects</a>
          )}
        </ol>
      )}
    </div>
  )
}

export function KitPublicacao() {
  const { data, isLoading } = useKitPublicacao()
  if (isLoading || !data || data.length === 0) return null
  return (
    <div className="glass rounded-2xl border border-zinc-800/50 p-5">
      <div className="mb-3 flex items-center gap-2">
        <BookOpen className="h-4 w-4 text-amber-300" />
        <h2 className="text-sm font-bold text-white">Kit de publicação manual</h2>
        <span className="text-xs text-zinc-500">legenda + passo a passo por rede (até tudo via API)</span>
        <span className="ml-auto rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-300">{data.length} prontos</span>
      </div>
      <div className="space-y-2">
        {data.map((v) => <VideoCard key={v.ideiaId} v={v} />)}
      </div>
      <p className="mt-3 text-[11px] text-zinc-500">IG sai pelo app; <b className="text-zinc-400">YouTube + Facebook</b> manual com o passo a passo; TikTok finaliza no celular. Macetes embutidos (COPPA, portfólio Pulso Projects, desmarcar IG).</p>
    </div>
  )
}
