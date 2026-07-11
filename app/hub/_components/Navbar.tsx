'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function Navbar() {
  const [solid, setSolid] = useState(false)

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        solid ? 'bg-zinc-950/95 shadow-lg shadow-black/40 backdrop-blur' : 'bg-linear-to-b from-black/80 to-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-[1800px] items-center gap-6 px-4 py-3 sm:px-10">
        <Link href="/hub" className="flex items-center gap-2">
          <Image
            src="/pulso/avatar/exp_feliz.png"
            alt="PULSO"
            width={28}
            height={40}
            className="h-8 w-auto drop-shadow-[0_4px_12px_rgba(168,85,247,0.5)]"
            priority
          />
          <span className="bg-linear-to-r from-purple-400 to-pink-500 bg-clip-text text-2xl font-black tracking-tight text-transparent">
            PULSO
          </span>
        </Link>

        <nav className="hidden items-center gap-5 text-sm text-zinc-300 sm:flex">
          <Link href="/hub" className="font-semibold text-white">Início</Link>
          <a href="#em-alta" className="transition hover:text-white">Em alta</a>
          <a href="#catalogo" className="transition hover:text-white">Catálogo</a>
        </nav>

        <a
          href="https://youtube.com/@pulsohistorias"
          target="_blank"
          rel="noreferrer"
          className="ml-auto rounded bg-linear-to-r from-purple-600 to-pink-600 px-4 py-1.5 text-sm font-bold text-white transition hover:opacity-90"
        >
          Seguir
        </a>
      </div>
    </header>
  )
}
