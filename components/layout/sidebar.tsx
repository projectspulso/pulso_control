'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
  Library
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Conteúdo', href: '/conteudo', icon: Library },
  { name: 'Ideias', href: '/ideias', icon: Lightbulb },
  { name: 'Roteiros', href: '/roteiros', icon: FileEdit },
  { name: 'Produção', href: '/producao', icon: Clapperboard },
  { name: 'Assets', href: '/assets', icon: FolderOpen },
  { name: 'Calendário', href: '/calendario', icon: Calendar },
  { name: 'Publicar', href: '/publicar', icon: Send },
  { name: 'Organograma', href: '/organograma', icon: BarChart3 },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Canais', href: '/canais', icon: Megaphone },
  { name: 'Workflows', href: '/workflows', icon: Workflow },
  { name: 'Integrações', href: '/integracoes', icon: Plug },
  { name: 'Configurações', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-screen w-64 flex-col bg-zinc-950 border-r border-zinc-800">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-zinc-800 px-6">
        <Zap className="h-6 w-6 text-purple-500" />
        <span className="text-xl font-bold text-white">PULSO Control</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium
                transition-colors
                ${isActive 
                  ? 'bg-purple-600 text-white' 
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                }
              `}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-zinc-800 p-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
          <div className="flex-1 text-sm">
            <p className="font-medium text-white">Admin</p>
            <p className="text-xs text-zinc-500">PULSO Team</p>
          </div>
        </div>
      </div>
    </div>
  )
}
