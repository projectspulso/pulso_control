'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  AudioLines,
  BarChart3,
  CalendarDays,
  Wallet,
  Clapperboard,
  FileEdit,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  Menu,
  Send,
  Settings,
  Sparkles,
  Sun,
  Target,
  TrendingUp,
  Tv,
  Plug,
  Library,
  X,
  Zap,
} from 'lucide-react'

import { getSupabaseBrowser } from '@/lib/supabase/browser'
import { useUsuario } from '@/lib/hooks/use-usuario'
import { areaFor } from '@/lib/config/areas'

const navigation = [
  { name: 'Hoje', href: '/hoje', icon: Sun, badge: 'ai', soAdmin: false },
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, badge: null, soAdmin: false },
  { name: 'Validacao', href: '/validacao', icon: Target, badge: 'mvp', soAdmin: false },
  { name: 'Ideias', href: '/ideias', icon: Lightbulb, badge: null, soAdmin: false },
  { name: 'Trend Tops', href: '/trends', icon: TrendingUp, badge: 'ai', soAdmin: false },
  { name: 'Roteiros', href: '/roteiros', icon: FileEdit, badge: null, soAdmin: false },
  { name: 'Áudios', href: '/audios', icon: AudioLines, badge: null, soAdmin: false },
  { name: 'Producao', href: '/producao', icon: Clapperboard, badge: null, soAdmin: false },
  { name: 'Publicar', href: '/publicar', icon: Send, badge: null, soAdmin: false },
  { name: 'Agenda', href: '/agenda', icon: CalendarDays, badge: null, soAdmin: false },
  { name: 'Automacao', href: '/automacao', icon: Zap, badge: 'ai', soAdmin: false },
  { name: 'Analytics', href: '/analytics', icon: BarChart3, badge: null, soAdmin: false },
  { name: 'Financeiro', href: '/financeiro', icon: Wallet, badge: null, soAdmin: true },
  { name: 'Canais', href: '/canais', icon: Tv, badge: null, soAdmin: false },
  { name: 'Integracoes', href: '/integracoes', icon: Plug, badge: null, soAdmin: false },
  { name: 'Assets', href: '/assets', icon: Library, badge: null, soAdmin: false },
]

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const { papel } = useUsuario()
  const itens = navigation.filter((i) => !i.soAdmin || papel === 'admin')

  return (
    <>
      {itens.map((item) => {
        const isActive = pathname === item.href
        const Icon = item.icon
        const area = areaFor(item.href)
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={onNavigate}
            className={`group relative flex items-center justify-between gap-3 overflow-hidden rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300 ${
              isActive
                ? `bg-linear-to-r ${area.navGradient} text-white shadow-lg ${area.navGlow}`
                : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-white'
            }`}
          >
            {/* trilho de acento da área na borda esquerda (some quando ativo) */}
            {!isActive && (
              <span className={`absolute left-0 top-1/2 h-0 w-[3px] -translate-y-1/2 rounded-r-full ${area.dot} opacity-0 transition-all duration-300 group-hover:h-5 group-hover:opacity-100`} />
            )}
            <div className="relative z-10 flex items-center gap-3">
              <Icon className={`h-5 w-5 transition-transform duration-300 ${isActive ? 'scale-110' : `${area.text} group-hover:scale-110`}`} />
              <span>{item.name}</span>
            </div>
            {item.badge === 'ai' && (
              <div className="relative z-10 flex items-center gap-1 rounded-full border border-purple-500/30 bg-purple-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-400">
                <Sparkles className="h-2.5 w-2.5" /> AI
              </div>
            )}
            {item.badge === 'mvp' && (
              <span className="relative z-10 rounded-full border border-cyan-500/30 bg-cyan-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                MVP
              </span>
            )}
          </Link>
        )
      })}
    </>
  )
}

function Rodape() {
  const router = useRouter()
  const { email, papel } = useUsuario()
  const [saindo, setSaindo] = useState(false)

  async function sair() {
    setSaindo(true)
    await getSupabaseBrowser().auth.signOut()
    router.replace('/login')
    router.refresh()
  }

  return (
    <div className="relative border-t border-zinc-800/50 p-4">
      <div className="mb-2 flex items-center gap-3 rounded-xl bg-zinc-900/50 p-3">
        <div className="h-9 w-9 shrink-0 rounded-lg bg-linear-to-br from-purple-500 to-pink-500 p-0.5">
          <div className="flex h-full w-full items-center justify-center rounded-[7px] bg-zinc-950 text-xs font-bold text-white">
            {(email || 'P')[0].toUpperCase()}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{email || 'PULSO'}</p>
          <p className="text-xs capitalize text-zinc-500">{papel || '—'}</p>
        </div>
        <Link href="/settings" className="text-zinc-600 transition-colors hover:text-purple-400">
          <Settings className="h-4 w-4" />
        </Link>
      </div>
      <button
        onClick={sair}
        disabled={saindo}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900/50 px-3 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50"
      >
        <LogOut className="h-4 w-4" /> Sair
      </button>
    </div>
  )
}

function Cabecalho() {
  return (
    <div className="relative flex h-16 items-center gap-3 border-b border-zinc-800/50 px-6">
      <div className="h-10 w-10 rounded-xl bg-linear-to-br from-purple-500 to-pink-500 p-0.5">
        <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-[10px] bg-zinc-950">
          <Image src="/pulso/logo.png" alt="PULSO" width={32} height={32} className="object-contain" priority />
        </div>
      </div>
      <div className="flex flex-col">
        <span className="bg-linear-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-lg font-bold text-transparent">
          PULSO
        </span>
        <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">Control Center</span>
      </div>
    </div>
  )
}

export function Sidebar() {
  const [aberto, setAberto] = useState(false)

  return (
    <>
      {/* Desktop */}
      <aside className="relative hidden h-screen w-64 flex-col overflow-hidden border-r border-zinc-800/50 bg-zinc-950/90 backdrop-blur-xl md:flex">
        <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-purple-600/5 via-transparent to-pink-600/5" />
        <Cabecalho />
        <nav className="relative z-10 flex-1 space-y-1 overflow-y-auto px-3 py-6">
          <NavLinks />
        </nav>
        <Rodape />
      </aside>

      {/* Top bar mobile */}
      <div className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-zinc-800/50 bg-zinc-950/95 px-4 backdrop-blur-xl md:hidden">
        <div className="flex items-center gap-2">
          <Image src="/pulso/logo.png" alt="PULSO" width={28} height={28} className="rounded-lg" />
          <span className="bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text font-bold text-transparent">PULSO</span>
        </div>
        <button onClick={() => setAberto(true)} className="rounded-lg p-2 text-zinc-300 hover:bg-zinc-900" aria-label="Menu">
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Drawer mobile */}
      {aberto && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setAberto(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-72 max-w-[85%] flex-col bg-zinc-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800/50 pr-2">
              <Cabecalho />
              <button onClick={() => setAberto(false)} className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-900" aria-label="Fechar">
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
              <NavLinks onNavigate={() => setAberto(false)} />
            </nav>
            <Rodape />
          </aside>
        </div>
      )}
    </>
  )
}
