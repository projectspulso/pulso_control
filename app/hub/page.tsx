import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

import { getVideosRecentes, CONTAS } from '@/lib/hub/data'

export const revalidate = 600

export const metadata: Metadata = {
  title: 'PULSO — Histórias que ninguém te conta',
  description: 'Curiosidades, mistérios e histórias reais em vídeos curtos. Siga o PULSO no YouTube, Instagram, TikTok e Facebook.',
  openGraph: { title: 'PULSO', description: 'Histórias e curiosidades que ninguém te conta. ⚡', siteName: 'PULSO', type: 'website' },
}

const COR: Record<string, string> = {
  youtube: 'bg-red-600 hover:bg-red-500',
  instagram: 'bg-linear-to-r from-pink-600 to-purple-600 hover:opacity-90',
  tiktok: 'bg-zinc-900 hover:bg-zinc-800 ring-1 ring-cyan-500/40',
  facebook: 'bg-blue-600 hover:bg-blue-500',
}

export default async function HubPage() {
  const videos = await getVideosRecentes(40)

  return (
    <main className="min-h-screen bg-zinc-950 px-5 py-12 text-white">
      <div className="mx-auto max-w-xl">
        <div className="flex flex-col items-center text-center">
          <Image src="/pulso/logo.png" alt="PULSO" width={72} height={72} className="rounded-2xl" priority />
          <h1 className="mt-4 bg-linear-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-3xl font-black text-transparent">PULSO</h1>
          <p className="mt-2 text-sm text-zinc-400">Histórias e curiosidades que ninguém te conta. ⚡</p>
        </div>

        <div className="mt-8 grid gap-3">
          {CONTAS.map((c) => (
            <a key={c.plataforma} href={c.url} target="_blank" rel="noreferrer"
              className={`flex items-center justify-between rounded-xl px-5 py-3.5 text-sm font-bold text-white transition-all ${COR[c.plataforma] || 'bg-zinc-800'}`}>
              <span>{c.nome}</span>
              <span className="text-xs font-normal opacity-80">{c.handle}</span>
            </a>
          ))}
        </div>

        {videos.length > 0 && (
          <div className="mt-10">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-500">Últimos vídeos</p>
            <div className="grid gap-2">
              {videos.map((v) => (
                <Link key={v.numero} href={`/v/${v.numero}`}
                  className="flex items-center gap-3 rounded-lg border border-zinc-800/60 bg-zinc-900/40 px-4 py-3 transition-colors hover:border-purple-500/40 hover:bg-zinc-900">
                  <span className="shrink-0 text-xs font-bold text-zinc-600">#{v.numero}</span>
                  <span className="min-w-0 flex-1 truncate text-sm text-zinc-200">{v.titulo}</span>
                  <span className="shrink-0 text-zinc-600">→</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <p className="mt-10 text-center text-[11px] text-zinc-600">© PULSO · pulsoprojects</p>
      </div>
    </main>
  )
}
