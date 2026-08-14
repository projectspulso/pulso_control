import {
  Workflow,
  BarChart3,
  Clapperboard,
  Compass,
  Send,
  Target,
  TrendingUp,
  Wallet,
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
  // A HOME é o Decisor desde 14/08/2026 — antes eram duas telas respondendo metades da mesma
  // pergunta. As outras áreas são a biblioteca de consulta; esta é a camada de decisão.
  { href: '/', nome: 'Decisor', icon: Compass,
    navGradient: 'from-indigo-600 to-violet-600', navGlow: 'shadow-indigo-500/25',
    text: 'text-indigo-300', dot: 'bg-indigo-500', ring: 'ring-indigo-500/30', soft: 'bg-indigo-500/10',
    headerGlow: 'from-indigo-600/20 via-violet-600/5 to-transparent', iconBox: 'from-indigo-500 to-violet-500' },
  { href: '/validacao', nome: 'Validação', icon: Target,
    navGradient: 'from-cyan-600 to-blue-600', navGlow: 'shadow-cyan-500/25',
    text: 'text-cyan-300', dot: 'bg-cyan-500', ring: 'ring-cyan-500/30', soft: 'bg-cyan-500/10',
    headerGlow: 'from-cyan-600/20 via-blue-600/5 to-transparent', iconBox: 'from-cyan-500 to-blue-500' },
  { href: '/esteira', nome: 'Esteira', icon: Workflow,
    navGradient: 'from-amber-600 to-orange-600', navGlow: 'shadow-amber-500/25',
    text: 'text-amber-300', dot: 'bg-amber-500', ring: 'ring-amber-500/30', soft: 'bg-amber-500/10',
    headerGlow: 'from-amber-600/20 via-orange-600/5 to-transparent', iconBox: 'from-amber-500 to-orange-500' },
  { href: '/producao', nome: 'Produção', icon: Clapperboard,
    navGradient: 'from-violet-600 to-fuchsia-600', navGlow: 'shadow-fuchsia-500/25',
    text: 'text-fuchsia-300', dot: 'bg-fuchsia-500', ring: 'ring-fuchsia-500/30', soft: 'bg-fuchsia-500/10',
    headerGlow: 'from-fuchsia-600/20 via-violet-600/5 to-transparent', iconBox: 'from-violet-500 to-fuchsia-500' },
  { href: '/publicar', nome: 'Publicar', icon: Send,
    navGradient: 'from-orange-500 to-amber-500', navGlow: 'shadow-orange-500/25',
    text: 'text-orange-300', dot: 'bg-orange-500', ring: 'ring-orange-500/30', soft: 'bg-orange-500/10',
    headerGlow: 'from-orange-500/20 via-amber-500/5 to-transparent', iconBox: 'from-orange-500 to-amber-500' },
  { href: '/analytics', nome: 'Analytics', icon: BarChart3,
    navGradient: 'from-cyan-600 to-teal-600', navGlow: 'shadow-cyan-500/25',
    text: 'text-cyan-300', dot: 'bg-cyan-500', ring: 'ring-cyan-500/30', soft: 'bg-cyan-500/10',
    headerGlow: 'from-cyan-600/20 via-teal-600/5 to-transparent', iconBox: 'from-cyan-500 to-teal-500' },
  { href: '/financeiro', nome: 'Financeiro', icon: Wallet,
    navGradient: 'from-green-600 to-emerald-600', navGlow: 'shadow-green-500/25',
    text: 'text-green-300', dot: 'bg-green-500', ring: 'ring-green-500/30', soft: 'bg-green-500/10',
    headerGlow: 'from-green-600/20 via-emerald-600/5 to-transparent', iconBox: 'from-green-500 to-emerald-500' },
  { href: '/trends', nome: 'Trend Tops', icon: TrendingUp,
    navGradient: 'from-rose-600 to-red-600', navGlow: 'shadow-rose-500/25',
    text: 'text-rose-300', dot: 'bg-rose-500', ring: 'ring-rose-500/30', soft: 'bg-rose-500/10',
    headerGlow: 'from-rose-600/20 via-red-600/5 to-transparent', iconBox: 'from-rose-500 to-red-500' },
]

// por href: '/' é a home (Decisor). Mantido explícito porque areaFor() cai aqui no fallback.
const HOME = AREAS.find((a) => a.href === '/')!

/** Acha a área pela rota (exata pra '/', senão maior prefixo). */
export function areaFor(pathname: string): Area {
  if (pathname === '/') return HOME
  const match = AREAS.filter((a) => a.href !== '/' && pathname.startsWith(a.href)).sort(
    (a, b) => b.href.length - a.href.length,
  )[0]
  return match || HOME
}
