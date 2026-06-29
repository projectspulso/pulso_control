import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

import { getVideosRecentes, CONTAS, SITE_URL } from '@/lib/hub/data'

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
  const videos = await getVideosRecentes(60)
  const comCapa = videos.filter((v) => v.thumb)
  const destaque = comCapa[0] || videos[0]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'PULSO',
    url: `${SITE_URL}/hub`,
    logo: `${SITE_URL}/icons/icon-512.png`,
    description: 'Histórias, mistérios e curiosidades que ninguém te conta, em vídeos curtos.',
    sameAs: CONTAS.map((c) => c.url),
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-zinc-950 text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* glows de fundo */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-purple-600/20 blur-[120px]" />
      <div className="pointer-events-none absolute top-40 right-0 h-72 w-72 rounded-full bg-pink-600/10 blur-[120px]" />

      <div className="relative mx-auto max-w-5xl px-5 py-14">
        {/* HERO */}
        <header className="flex flex-col items-center text-center">
          <Image src="/pulso/logo.png" alt="PULSO" width={84} height={84} className="rounded-2xl shadow-lg shadow-purple-900/40" priority />
          <h1 className="mt-5 bg-linear-to-r from-purple-300 via-pink-300 to-purple-300 bg-clip-text text-5xl font-black tracking-tight text-transparent sm:text-6xl">PULSO</h1>
          <p className="mt-3 max-w-md text-lg text-zinc-300">Histórias, mistérios e curiosidades que <span className="text-white">ninguém te conta</span>. ⚡</p>

          {/* canais */}
          <div className="mt-7 flex flex-wrap justify-center gap-2.5">
            {CONTAS.map((c) => (
              <a key={c.plataforma} href={c.url} target="_blank" rel="noreferrer"
                className={`rounded-full px-5 py-2.5 text-sm font-bold text-white transition-all hover:scale-105 ${COR[c.plataforma] || 'bg-zinc-800'}`}>
                {c.nome}
              </a>
            ))}
          </div>
          <p className="mt-3 text-xs text-zinc-500">@pulsohistorias · @pulsoprojects</p>
        </header>

        {/* DESTAQUE */}
        {destaque?.thumb && (
          <Link href={`/v/${destaque.numero}`} className="group mt-12 block">
            <div className="relative overflow-hidden rounded-3xl ring-1 ring-zinc-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={destaque.thumb} alt={destaque.titulo} className="max-h-[420px] w-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-linear-to-t from-black via-black/40 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6">
                <span className="rounded-full bg-pink-600/90 px-3 py-1 text-[11px] font-bold uppercase tracking-wider">Em alta</span>
                <h2 className="mt-2 max-w-2xl text-2xl font-bold sm:text-3xl">{destaque.titulo}</h2>
              </div>
            </div>
          </Link>
        )}

        {/* GRADE DE VÍDEOS */}
        <section className="mt-12">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-zinc-400">Todos os vídeos</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {videos.map((v) => (
              <Link key={v.numero} href={`/v/${v.numero}`} className="group relative overflow-hidden rounded-xl bg-zinc-900 ring-1 ring-zinc-800 transition-all hover:ring-purple-500/50">
                {v.thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={v.thumb} alt={v.titulo} loading="lazy" className="aspect-9/16 w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="flex aspect-9/16 w-full items-center justify-center bg-zinc-900 p-3 text-center text-xs text-zinc-500">{v.titulo}</div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/95 via-black/50 to-transparent p-2.5">
                  <p className="line-clamp-2 text-[11px] font-medium leading-tight text-zinc-100">{v.titulo}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <footer className="mt-16 text-center text-[11px] text-zinc-600">
          © PULSO · Histórias que ninguém te conta
        </footer>
      </div>
    </main>
  )
}
