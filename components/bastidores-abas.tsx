'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

/** Bastidores tem duas faces: a linha do tempo (a história contada) e o livro (o que deu errado e como foi resolvido). */
export function BastidoresAbas() {
  const livro = usePathname().startsWith('/bastidores/livro')
  const aba = (ativa: boolean) =>
    `rounded-full px-4 py-2 text-[13px] transition-colors ${ativa ? 'bg-(--pulso-action) font-medium text-(--pulso-on-action)' : 'text-(--pulso-text-subtle) hover:text-(--pulso-text-muted)'}`
  return (
    <nav aria-label="Seções dos Bastidores" className="flex w-fit gap-1 rounded-full border border-(--pulso-border) bg-(--pulso-surface) p-1">
      <Link href="/bastidores" className={aba(!livro)} aria-current={!livro ? 'page' : undefined}>Linha do tempo</Link>
      <Link href="/bastidores/livro" className={aba(livro)} aria-current={livro ? 'page' : undefined}>Livro de problemas</Link>
    </nav>
  )
}
