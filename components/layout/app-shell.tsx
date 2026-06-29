'use client'

import { usePathname } from 'next/navigation'

import { Sidebar } from '@/components/layout/sidebar'

const SEM_SHELL = ['/login', '/registrar']
const SEM_SHELL_PREFIXO = ['/v/', '/hub'] // hub público (SEO) — sem o chrome do app

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  if (SEM_SHELL.includes(pathname) || SEM_SHELL_PREFIXO.some((p) => pathname === p.replace(/\/$/, '') || pathname.startsWith(p))) {
    return <>{children}</>
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      {/* pt-14 no mobile compensa a top bar fixa; md zera */}
      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">{children}</main>
    </div>
  )
}
