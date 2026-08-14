'use client'

import { usePathname } from 'next/navigation'

import { Sidebar } from '@/components/layout/sidebar'

const SEM_SHELL = ['/login', '/registrar']

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  if (SEM_SHELL.includes(pathname)) {
    return <>{children}</>
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      {/*
        O CONTAINER DA PÁGINA MORA AQUI, e só aqui.
        Antes cada uma das 18 telas repetia `min-h-screen bg-zinc-950 p-4 sm:p-6 lg:p-8` e escolhia
        a própria largura: 7xl na maioria, 6xl no /trends, 5xl no /integracoes, 4xl no /automacao,
        e o Decisor sem nenhuma. O resultado era o app trocando de largura conforme a aba — e
        ninguém iria manter 18 cópias em sincronia.
        LARGURA TOTAL de propósito: as telas são densas (tabelas, kanban, calendário) e o
        `max-w-7xl` deixava faixas mortas nas laterais em monitor grande. Texto corrido (/termos,
        /privacidade) mantém a própria largura de leitura — ali linha longa atrapalha, e isso é
        exceção justificada, não desalinho.
        pt-14 no mobile compensa a top bar fixa; md zera.
      */}
      <main className="flex-1 overflow-y-auto bg-zinc-950 p-4 pt-18 sm:p-6 md:pt-6 lg:p-8">
        {children}
      </main>
    </div>
  )
}
