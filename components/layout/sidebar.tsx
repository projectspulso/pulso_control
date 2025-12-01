'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { 
  LayoutDashboard, 
  Megaphone, 
  Workflow, 
  FileText, 
  BarChart3,
  Settings,
  Zap,
  Lightbulb,
  FileEdit,
  Clapperboard,
  FolderOpen,
  Calendar,
  Send,
  Plug,
  Library,
  Sparkles,
  Activity
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, badge: null },
  { name: 'Conteúdo', href: '/conteudo', icon: Library, badge: null },
  { name: 'Ideias', href: '/ideias', icon: Lightbulb, badge: 'new' },
  { name: 'Roteiros', href: '/roteiros', icon: FileEdit, badge: null },
  { name: 'Produção', href: '/producao', icon: Clapperboard, badge: null },
  { name: 'Assets', href: '/assets', icon: FolderOpen, badge: null },
  { name: 'Calendário', href: '/calendario', icon: Calendar, badge: null },
  { name: 'Publicar', href: '/publicar', icon: Send, badge: null },
  { name: 'Monitor n8n', href: '/monitor', icon: Activity, badge: 'ai' },
  { name: 'Organograma', href: '/organograma', icon: BarChart3, badge: null },
  { name: 'Analytics', href: '/analytics', icon: BarChart3, badge: null },
  { name: 'Canais', href: '/canais', icon: Megaphone, badge: null },
  { name: 'Workflows', href: '/workflows', icon: Workflow, badge: null },
  { name: 'Integrações', href: '/integracoes', icon: Plug, badge: null },
  { name: 'Configurações', href: '/settings', icon: Settings, badge: null },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-screen w-64 flex-col bg-zinc-950/90 backdrop-blur-xl border-r border-zinc-800/50 relative overflow-hidden">
      {/* Background Gradient Effect */}
      <div className="absolute inset-0 bg-linear-to-b from-purple-600/5 via-transparent to-pink-600/5 pointer-events-none" />
      
      {/* Logo Section */}
      <div className="relative flex h-20 items-center gap-3 border-b border-zinc-800/50 px-6 backdrop-blur-sm">
        <div className="relative h-10 w-10 rounded-xl bg-linear-to-br from-purple-500 to-pink-500 p-0.5 animate-pulse-glow">
          <div className="h-full w-full rounded-[10px] bg-zinc-950 flex items-center justify-center overflow-hidden">
            <Image 
              src="/pulso/logo.png" 
              alt="PULSO" 
              width={32}
              height={32}
              className="object-contain"
              priority
            />
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-bold bg-linear-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            PULSO
          </span>
          <span className="text-[10px] text-zinc-500 font-medium tracking-wider uppercase">
            Control Center
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-6 overflow-y-auto relative z-10">
        {navigation.map((item, index) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                group flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-medium
                transition-all duration-300 relative overflow-hidden
                ${isActive 
                  ? 'bg-linear-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/20' 
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
                }
              `}
              style={{
                animationDelay: `${index * 50}ms`
              }}
            >
              {/* Hover glow effect */}
              {!isActive && (
                <div className="absolute inset-0 bg-linear-to-r from-purple-600/0 via-purple-600/5 to-pink-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              )}
              
              <div className="flex items-center gap-3 relative z-10">
                <Icon className={`h-5 w-5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span>{item.name}</span>
              </div>

              {/* Badges */}
              {item.badge && (
                <div className="relative z-10">
                  {item.badge === 'new' && (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-green-500/20 text-green-400 rounded-full border border-green-500/30 uppercase tracking-wider">
                      New
                    </span>
                  )}
                  {item.badge === 'ai' && (
                    <div className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-purple-500/20 text-purple-400 rounded-full border border-purple-500/30 uppercase tracking-wider">
                      <Sparkles className="h-2.5 w-2.5" />
                      AI
                    </div>
                  )}
                </div>
              )}

              {/* Active indicator */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full shadow-lg shadow-white/50" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer - User Profile */}
      <div className="relative border-t border-zinc-800/50 p-4 backdrop-blur-sm">
        <div className="glass glass-hover rounded-xl p-3 cursor-pointer group">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-10 w-10 rounded-xl bg-linear-to-br from-purple-500 via-pink-500 to-yellow-500 p-0.5">
                <div className="h-full w-full rounded-[11px] bg-zinc-950 flex items-center justify-center overflow-hidden">
                  <Image 
                    src="/pulso/mascote.png" 
                    alt="PULSO Mascote" 
                    width={36}
                    height={36}
                    className="object-cover"
                  />
                </div>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-zinc-950 shadow-lg shadow-green-500/50" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white text-sm truncate group-hover:text-purple-400 transition-colors">
                Admin PULSO
              </p>
              <p className="text-xs text-zinc-500 truncate">
                admin@pulso.ai
              </p>
            </div>
            <Settings className="h-4 w-4 text-zinc-600 group-hover:text-purple-400 group-hover:rotate-90 transition-all duration-300" />
          </div>
        </div>
      </div>
    </div>
  )
}
