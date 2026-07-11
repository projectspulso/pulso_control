import type { Metadata } from 'next'
import Link from 'next/link'
import { Play } from 'lucide-react'

import Navbar from '../../hub/_components/Navbar'
import Row from '../../hub/_components/Row'
import { getVideoPorNumero, getVideosRecentes, SITE_URL } from '@/lib/hub/data'

export const revalidate = 600 // ISR: regenera a cada 10min

const COR: Record<string, string> = {
  youtube: 'bg-red-600 hover:bg-red-500',
  instagram: 'bg-linear-to-r from-pink-600 to-purple-600 hover:opacity-90',
  tiktok: 'bg-zinc-800 hover:bg-zinc-700 ring-1 ring-cyan-500/40',
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
  const imgs = v.thumb ? [{ url: v.thumb }] : undefined
  return {
    title: `${v.titulo} | PULSO`,
    description: desc,
    openGraph: { title: v.titulo, description: desc, type: 'video.other', siteName: 'PULSO', images: imgs },
    twitter: { card: 'summary_large_image', title: v.titulo, description: desc, images: imgs },
  }
}

export default async function VideoPage({ params }: { params: Promise<{ numero: string }> }) {
  const { numero } = await params
  const num = Number(numero)
  const [v, todos] = await Promise.all([getVideoPorNumero(num), getVideosRecentes(120)])
  const relacionados = todos.filter((x) => x.numero !== num).slice(0, 16)

  const jsonLd = v && {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: v.titulo,
    description: resumo(v.descricao, 300) || v.titulo,
    ...(v.thumb ? { thumbnailUrl: v.thumb } : {}),
    ...(v.data ? { uploadDate: v.data } : {}),
    ...(v.transcricao ? { transcript: v.transcricao } : {}),
    url: `${SITE_URL}/v/${v.numero}`,
    ...(v.redes.find((r) => r.plataforma === 'youtube') ? { contentUrl: v.redes.find((r) => r.plataforma === 'youtube')!.url } : {}),
    publisher: { '@type': 'Organization', name: 'PULSO', logo: { '@type': 'ImageObject', url: `${SITE_URL}/icons/icon-512.png` } },
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />}
      <Navbar />

      {!v ? (
        <div className="mx-auto max-w-xl px-5 pt-32 text-center">
          <p className="text-zinc-400">Vídeo não encontrado.</p>
          <Link href="/hub" className="mt-4 inline-block text-purple-400 hover:text-purple-300">Ver todo o catálogo →</Link>
        </div>
      ) : (
        <>
          <section className="relative">
            {v.thumb && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={v.thumb} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-110 object-cover opacity-30 blur-2xl" />
                <div className="hero-fade absolute inset-0" />
              </>
            )}

            <div className="relative mx-auto flex max-w-[1100px] flex-col gap-8 px-4 pb-10 pt-28 sm:px-10 md:flex-row md:pt-32">
              {v.youtubeId ? (
                <div className="aspect-9/16 w-full max-w-[300px] shrink-0 overflow-hidden rounded-xl bg-black shadow-2xl shadow-black/60 ring-1 ring-white/10">
                  <iframe
                    src={`https://www.youtube.com/embed/${v.youtubeId}?rel=0&modestbranding=1&playsinline=1`}
                    title={v.titulo}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              ) : (
                v.thumb && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={v.thumb}
                    alt={v.titulo}
                    className="aspect-9/16 w-full max-w-[300px] shrink-0 rounded-xl object-cover shadow-2xl shadow-black/60 ring-1 ring-white/10"
                  />
                )
              )}

              <div className="flex-1">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-purple-300">PULSO #{v.numero}</span>
                <h1 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">{v.titulo}</h1>
                {v.descricao && <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-zinc-300">{v.descricao}</p>}

                <div className="mt-7">
                  <p className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-500">Assistir em</p>
                  {v.redes.length ? (
                    <div className="flex flex-wrap gap-3">
                      {v.redes.map((r) => (
                        <a
                          key={r.plataforma}
                          href={r.url}
                          target="_blank"
                          rel="noreferrer"
                          className={`flex items-center gap-2 rounded-md px-6 py-3 text-sm font-bold text-white transition-all ${COR[r.plataforma] || 'bg-zinc-800'}`}
                        >
                          <Play className="h-4 w-4 fill-white" /> {r.nome}
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-500">Em breve nas redes.</p>
                  )}
                </div>

                {v.transcricao && (
                  <details className="mt-8 rounded-xl border border-white/10 bg-black/30 p-4">
                    <summary className="cursor-pointer text-sm font-semibold text-zinc-300">Transcrição completa</summary>
                    <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-zinc-400">{v.transcricao}</p>
                  </details>
                )}
              </div>
            </div>
          </section>

          <div className="pb-16">
            <Row titulo="Mais do PULSO" itens={relacionados} />
          </div>
        </>
      )}
    </main>
  )
}
