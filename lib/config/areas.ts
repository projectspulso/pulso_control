import {
  BarChart3,
  CalendarDays,
  Clapperboard,
  FileEdit,
  LayoutDashboard,
  Lightbulb,
  Send,
  Target,
  Wallet,
  Zap,
  type LucideIcon,
} from 'lucide-react'

/**
 * Cor por contexto (R-014 / identidade PULSO).
 * Cada área do app tem um acento próprio — pra o olho bater e saber onde está,
 * quebrando a monotonia de "tudo glass-card violeta". As classes são LITERAIS
 * (Tailwind não compila nomes montados em runtime).
 */
export interface Area {
  href: string
  nome: string
  icon: LucideIcon
  navGradient: string // sidebar ativo (from-x to-y)
  navGlow: string // sombra do item ativo
  text: string // texto de acento (títulos/ícone do header)
  dot: string // bolinha/realce sólido
  ring: string // anel sutil
  soft: string // fundo suave do acento
  headerGlow: string // brilho do cabeçalho da página
  iconBox: string // gradiente da caixinha do ícone
}

export const AREAS: Area[] = [
  { href: '/', nome: 'Dashboard', icon: LayoutDashboard,
    navGradient: 'from-violet-600 to-pink-600', navGlow: 'shadow-violet-500/25',
    text: 'text-violet-300', dot: 'bg-violet-500', ring: 'ring-violet-500/30', soft: 'bg-violet-500/10',
    headerGlow: 'from-violet-600/20 via-fuchsia-600/5 to-transparent', iconBox: 'from-violet-500 to-pink-500' },
  { href: '/validacao', nome: 'Validação', icon: Target,
    navGradient: 'from-cyan-600 to-blue-600', navGlow: 'shadow-cyan-500/25',
    text: 'text-cyan-300', dot: 'bg-cyan-500', ring: 'ring-cyan-500/30', soft: 'bg-cyan-500/10',
    headerGlow: 'from-cyan-600/20 via-blue-600/5 to-transparent', iconBox: 'from-cyan-500 to-blue-500' },
  { href: '/ideias', nome: 'Ideias', icon: Lightbulb,
    navGradient: 'from-amber-500 to-yellow-500', navGlow: 'shadow-amber-500/25',
    text: 'text-amber-300', dot: 'bg-amber-500', ring: 'ring-amber-500/30', soft: 'bg-amber-500/10',
    headerGlow: 'from-amber-500/20 via-yellow-500/5 to-transparent', iconBox: 'from-amber-500 to-yellow-500' },
  { href: '/roteiros', nome: 'Roteiros', icon: FileEdit,
    navGradient: 'from-sky-600 to-indigo-600', navGlow: 'shadow-sky-500/25',
    text: 'text-sky-300', dot: 'bg-sky-500', ring: 'ring-sky-500/30', soft: 'bg-sky-500/10',
    headerGlow: 'from-sky-600/20 via-indigo-600/5 to-transparent', iconBox: 'from-sky-500 to-indigo-500' },
  { href: '/producao', nome: 'Produção', icon: Clapperboard,
    navGradient: 'from-violet-600 to-fuchsia-600', navGlow: 'shadow-fuchsia-500/25',
    text: 'text-fuchsia-300', dot: 'bg-fuchsia-500', ring: 'ring-fuchsia-500/30', soft: 'bg-fuchsia-500/10',
    headerGlow: 'from-fuchsia-600/20 via-violet-600/5 to-transparent', iconBox: 'from-violet-500 to-fuchsia-500' },
  { href: '/publicar', nome: 'Publicar', icon: Send,
    navGradient: 'from-orange-500 to-amber-500', navGlow: 'shadow-orange-500/25',
    text: 'text-orange-300', dot: 'bg-orange-500', ring: 'ring-orange-500/30', soft: 'bg-orange-500/10',
    headerGlow: 'from-orange-500/20 via-amber-500/5 to-transparent', iconBox: 'from-orange-500 to-amber-500' },
  { href: '/agenda', nome: 'Agenda', icon: CalendarDays,
    navGradient: 'from-emerald-600 to-teal-600', navGlow: 'shadow-emerald-500/25',
    text: 'text-emerald-300', dot: 'bg-emerald-500', ring: 'ring-emerald-500/30', soft: 'bg-emerald-500/10',
    headerGlow: 'from-emerald-600/20 via-teal-600/5 to-transparent', iconBox: 'from-emerald-500 to-teal-500' },
  { href: '/automacao', nome: 'Automação', icon: Zap,
    navGradient: 'from-fuchsia-600 to-purple-600', navGlow: 'shadow-fuchsia-500/25',
    text: 'text-fuchsia-300', dot: 'bg-fuchsia-500', ring: 'ring-fuchsia-500/30', soft: 'bg-fuchsia-500/10',
    headerGlow: 'from-fuchsia-600/20 via-purple-600/5 to-transparent', iconBox: 'from-fuchsia-500 to-purple-500' },
  { href: '/analytics', nome: 'Analytics', icon: BarChart3,
    navGradient: 'from-cyan-600 to-teal-600', navGlow: 'shadow-cyan-500/25',
    text: 'text-cyan-300', dot: 'bg-cyan-500', ring: 'ring-cyan-500/30', soft: 'bg-cyan-500/10',
    headerGlow: 'from-cyan-600/20 via-teal-600/5 to-transparent', iconBox: 'from-cyan-500 to-teal-500' },
  { href: '/financeiro', nome: 'Financeiro', icon: Wallet,
    navGradient: 'from-green-600 to-emerald-600', navGlow: 'shadow-green-500/25',
    text: 'text-green-300', dot: 'bg-green-500', ring: 'ring-green-500/30', soft: 'bg-green-500/10',
    headerGlow: 'from-green-600/20 via-emerald-600/5 to-transparent', iconBox: 'from-green-500 to-emerald-500' },
]

const DASHBOARD = AREAS[0]

/** Acha a área pela rota (exata pra '/', senão maior prefixo). */
export function areaFor(pathname: string): Area {
  if (pathname === '/') return DASHBOARD
  const match = AREAS.filter((a) => a.href !== '/' && pathname.startsWith(a.href)).sort(
    (a, b) => b.href.length - a.href.length,
  )[0]
  return match || DASHBOARD
}
