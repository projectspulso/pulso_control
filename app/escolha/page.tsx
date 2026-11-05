'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Film, Smartphone } from 'lucide-react'
import { MODOS, gravarModo, type Modo } from '@/lib/modo'

/** A porta de entrada depois do login: escolher em que cara do app trabalhar. */
export default function EscolhaPage() {
  const router = useRouter()

  function entrar(m: Modo) {
    gravarModo(m)
    router.replace(MODOS[m].inicio)
  }

  const cartao = (m: Modo, Icone: typeof Film, cor: string, texto: string) => (
    <button type="button" onClick={() => entrar(m)}
      className="group flex flex-col items-start gap-4 rounded-3xl border border-(--pulso-border) bg-(--pulso-surface) p-7 text-left transition-colors hover:border-current focus:outline-none focus-visible:ring-2 focus-visible:ring-current"
      style={{ color: cor }}>
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: cor }}>
        <Icone className="h-6 w-6" style={{ color: texto }} />
      </span>
      <span>
        <span className="block text-2xl font-bold text-(--pulso-text)">
          {MODOS[m].nome} <span className="text-base font-medium" style={{ color: cor }}>{MODOS[m].sigla}</span>
        </span>
        <span className="mt-1.5 block text-sm leading-relaxed text-(--pulso-text-muted)">{MODOS[m].descricao}</span>
      </span>
      <span className="text-sm font-medium opacity-80 group-hover:opacity-100">Entrar →</span>
    </button>
  )

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-12">
      <div className="w-full max-w-3xl">
        <div className="mb-8 flex items-center justify-center gap-3">
          <Image src="/pulso/logo.png" alt="PULSO" width={40} height={40} className="rounded-xl" priority />
          <h1 className="text-xl font-semibold text-(--pulso-text)">Em que você vai trabalhar agora?</h1>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {cartao('curtos', Smartphone, 'var(--pulso-vc)', '#0f0e16')}
          {cartao('longos', Film, 'var(--pulso-vl)', '#1a1206')}
        </div>
        <p className="mt-6 text-center text-xs text-(--pulso-text-subtle)">Dá para trocar a qualquer hora pelo seletor no topo do menu.</p>
      </div>
    </main>
  )
}
