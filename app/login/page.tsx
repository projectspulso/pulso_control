'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import { Loader2, LogIn } from 'lucide-react'

import { getSupabaseBrowser } from '@/lib/supabase/browser'

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get('next') || '/'

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)

  async function entrar(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    setCarregando(true)
    const supabase = getSupabaseBrowser()
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha })
    if (error) {
      setErro(error.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : error.message)
      setCarregando(false)
      return
    }
    router.replace(next)
    router.refresh()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <Image src="/pulso/logo.png" alt="PULSO" width={56} height={56} className="rounded-2xl" />
          <div className="text-center">
            <h1 className="text-2xl font-black text-white">PULSO Control</h1>
            <p className="text-sm text-zinc-500">Centro de Comando</p>
          </div>
        </div>

        <form onSubmit={entrar} className="glass space-y-4 rounded-2xl border border-zinc-800/50 p-6">
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
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-400">Senha</label>
            <input
              type="password"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              autoComplete="current-password"
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
            {carregando ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
            Entrar
          </button>

          <p className="text-center text-xs text-zinc-500">
            Primeira vez?{' '}
            <Link href="/registrar" className="text-violet-400 hover:underline">
              Criar acesso
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950" />}>
      <LoginForm />
    </Suspense>
  )
}
