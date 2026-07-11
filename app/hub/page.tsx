import type { Metadata } from 'next'
import Link from 'next/link'
import { Play, Info } from 'lucide-react'

import Navbar from './_components/Navbar'
import Row from './_components/Row'
import { getVideosRecentes, getVideoPorNumero, agruparPorCanal, CONTAS, SITE_URL } from '@/lib/hub/data'

export const revalidate = 600

export const metadata: Metadata = {
  title: 'PULSO — Histórias que ninguém te conta',
  description: 'Curiosidades, mistérios e histórias reais em vídeos curtos. Siga o PULSO no YouTube, Instagram, TikTok e Facebook.',
  openGraph: { title: 'PULSO', description: 'Histórias e curiosidades que ninguém te conta. ⚡', siteName: 'PULSO', type: 'website' },
}

function resumo(txt: string, n = 180) {
  const t = (txt || '').replace(/\s+/g, ' ').trim()
  return t.length > n ? t.slice(0, n - 1).trimEnd() + '…' : t
}

export default async function HubPage() {
  const videos = await getVideosRecentes(120)
  const comCapa = videos.filter((v) => v.thumb)
  const destaqueItem = comCapa[0] || videos[0]
  const destaque = destaqueItem ? await getVideoPorNumero(destaqueItem.numero) : null

  const canais = agruparPorCanal(comCapa)
  const semCanal = comCapa.filter((v) => !v.canalNome)

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
    <main className="min-h-screen bg-zinc-950 text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <Navbar />

      {/* Billboard */}
      {destaqueItem && (
        <section className="relative h-[82vh] min-h-[560px] w-full">
          {destaqueItem.thumb && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={destaqueItem.thumb} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-110 object-cover opacity-40 blur-2xl" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={destaqueItem.thumb} alt={destaqueItem.titulo} className="absolute right-0 top-0 hidden h-full w-1/2 object-cover lg:block" />
            </>
          )}
          <div className="hero-fade absolute inset-0" />

          <div className="relative mx-auto flex h-full max-w-[1800px] flex-col justify-end px-4 pb-28 sm:px-10 lg:pb-32">
            <span className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-purple-300">
              <span className="h-2 w-2 animate-pulse rounded-full bg-pink-500" />
              {destaqueItem.canalNome || 'PULSO Originais'}
            </span>
            <h1 className="max-w-2xl text-3xl font-black leading-tight drop-shadow-2xl sm:text-5xl lg:text-6xl">
              {destaqueItem.titulo}
            </h1>
            {destaque?.descricao && (
              <p className="mt-4 max-w-xl text-sm text-zinc-200 drop-shadow-lg sm:text-base">{resumo(destaque.descricao)}</p>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link href={`/v/${destaqueItem.numero}`} className="flex items-center gap-2 rounded-md bg-white px-7 py-3 text-base font-bold text-black transition hover:bg-white/85">
                <Play className="h-5 w-5 fill-black" /> Assistir
              </Link>
              <Link href={`/v/${destaqueItem.numero}`} className="flex items-center gap-2 rounded-md bg-zinc-600/70 px-7 py-3 text-base font-bold text-white backdrop-blur transition hover:bg-zinc-500/70">
                <Info className="h-5 w-5" /> Mais informações
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Trilhos: Em alta + um por canal real */}
      <div id="em-alta" className="relative z-10 -mt-20 space-y-8 pb-10">
        <Row titulo="🔥 Em alta agora" itens={comCapa.slice(0, 16)} />
        {canais.map((c) => (
          <Row key={c.id} titulo={c.nome} itens={c.itens} />
        ))}
        {semCanal.length > 0 && <Row titulo="📼 Mais do PULSO" itens={semCanal} />}
      </div>

      {/* Catálogo completo */}
      <section id="catalogo" className="mx-auto max-w-[1800px] px-4 pb-16 sm:px-10">
        <h3 className="mb-4 text-lg font-bold text-zinc-100">Todo o catálogo</h3>
        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8">
          {videos.map((v) => (
            <Link key={v.numero} href={`/v/${v.numero}`} className="group relative overflow-hidden rounded-lg bg-zinc-900 ring-1 ring-white/5 transition-all hover:scale-105 hover:ring-purple-500/60">
              {v.thumb ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={v.thumb} alt={v.titulo} loading="lazy" className="aspect-9/16 w-full object-cover" />
              ) : (
                <div className="flex aspect-9/16 w-full items-center justify-center p-2 text-center text-[11px] text-zinc-500">{v.titulo}</div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/95 via-black/40 to-transparent p-2">
                <p className="line-clamp-2 text-[10px] font-medium leading-tight text-zinc-100">{v.titulo}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Rodapé com redes */}
      <footer className="border-t border-white/5 bg-black/40 px-4 py-12 sm:px-10">
        <div className="mx-auto max-w-[1800px]">
          <p className="mb-4 text-sm font-bold uppercase tracking-wider text-zinc-400">Segue o PULSO</p>
          <div className="flex flex-wrap gap-3">
            {CONTAS.map((c) => (
              <a key={c.plataforma} href={c.url} target="_blank" rel="noreferrer" className="rounded-full bg-zinc-800 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-zinc-700">
                {c.nome} <span className="text-zinc-400">{c.handle}</span>
              </a>
            ))}
          </div>
          <p className="mt-8 text-xs text-zinc-600">© PULSO · Histórias que ninguém te conta ⚡</p>
        </div>
      </footer>
    </main>
  )
}
