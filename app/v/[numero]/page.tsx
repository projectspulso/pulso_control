import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

import { getVideoPorNumero } from '@/lib/hub/data'

export const revalidate = 600 // ISR: regenera a cada 10min

const COR: Record<string, string> = {
  youtube: 'bg-red-600 hover:bg-red-500',
  instagram: 'bg-linear-to-r from-pink-600 to-purple-600 hover:opacity-90',
  tiktok: 'bg-zinc-900 hover:bg-zinc-800 ring-1 ring-cyan-500/40',
  facebook: 'bg-blue-600 hover:bg-blue-500',
}

function resumo(txt: string, n = 160) {
  const t = (txt || '').replace(/\s+/g, ' ').trim()
  return t.length > n ? t.slice(0, n - 1).trimEnd() + '…' : t
}

export async function generateMetadata({ params }: { params: Promise<{ numero: string }> }): Promise<Metadata> {
  const { numero } = await params
  const v = await getVideoPorNumero(Number(numero))
  if (!v) return { title: 'PULSO' }
  const desc = resumo(v.descricao) || 'Histórias e curiosidades que ninguém te conta. Segue o Pulso. ⚡'
  return {
    title: `${v.titulo} | PULSO`,
    description: desc,
    openGraph: { title: v.titulo, description: desc, type: 'video.other', siteName: 'PULSO' },
    twitter: { card: 'summary_large_image', title: v.titulo, description: desc },
  }
}

export default async function VideoPage({ params }: { params: Promise<{ numero: string }> }) {
  const { numero } = await params
  const v = await getVideoPorNumero(Number(numero))

  return (
    <main className="min-h-screen bg-zinc-950 px-5 py-12 text-white">
      <div className="mx-auto max-w-xl">
        <Link href="/hub" className="mb-8 flex items-center gap-2">
          <Image src="/pulso/logo.png" alt="PULSO" width={36} height={36} className="rounded-lg" />
          <span className="bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-xl font-black text-transparent">PULSO</span>
        </Link>

        {!v ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 text-center">
            <p className="text-zinc-400">Vídeo não encontrado.</p>
            <Link href="/hub" className="mt-4 inline-block text-purple-400 hover:text-purple-300">Ver todos os vídeos →</Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-black leading-tight sm:text-3xl">{v.titulo}</h1>
            {v.descricao && <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-zinc-300">{v.descricao}</p>}

            <div className="mt-8">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-500">Assista em</p>
              {v.redes.length ? (
                <div className="grid gap-3">
                  {v.redes.map((r) => (
                    <a key={r.plataforma} href={r.url} target="_blank" rel="noreferrer"
                      className={`flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold text-white transition-all ${COR[r.plataforma] || 'bg-zinc-800'}`}>
                      Ver no {r.nome}
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-500">Em breve nas redes.</p>
              )}
            </div>

            <div className="mt-10 border-t border-zinc-800 pt-6 text-center">
              <Link href="/hub" className="text-sm font-semibold text-purple-400 hover:text-purple-300">⚡ Segue o Pulso — todos os canais</Link>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
