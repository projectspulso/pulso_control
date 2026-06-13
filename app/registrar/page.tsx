'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Loader2, UserPlus } from 'lucide-react'

import { getSupabaseBrowser } from '@/lib/supabase/browser'

export default function RegistrarPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)

  async function registrar(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    setCarregando(true)

    const res = await fetch('/api/auth/registrar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password: senha }),
    })
    const data = await res.json()
    if (!res.ok) {
      setErro(data.error || 'Falha ao criar acesso.')
      setCarregando(false)
      return
    }

    // já provisionado e confirmado — entra direto
    const supabase = getSupabaseBrowser()
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha })
    if (error) {
      setErro('Acesso criado, mas o login falhou. Tente entrar pela tela de login.')
      setCarregando(false)
      return
    }
    router.replace('/')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <Image src="/pulso/logo.png" alt="PULSO" width={56} height={56} className="rounded-2xl" />
          <div className="text-center">
            <h1 className="text-2xl font-black text-white">Criar acesso</h1>
            <p className="text-sm text-zinc-500">Só e-mails autorizados</p>
          </div>
        </div>

        <form onSubmit={registrar} className="glass space-y-4 rounded-2xl border border-zinc-800/50 p-6">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-400">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-white focus:border-violet-500 focus:outline-none"
              placeholder="voce@email.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Crie sua senha (mín. 8)
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              autoComplete="new-password"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-white focus:border-violet-500 focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          {erro && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{erro}</p>}

          <button
            type="submit"
            disabled={carregando}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-linear-to-r from-violet-600 to-purple-600 px-4 py-2.5 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {carregando ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            Criar acesso e entrar
          </button>

          <p className="text-center text-xs text-zinc-500">
            Já tem acesso?{' '}
            <Link href="/login" className="text-violet-400 hover:underline">
              Entrar
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
