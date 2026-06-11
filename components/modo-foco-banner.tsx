import Link from 'next/link'
import { Lock, ArrowRight } from 'lucide-react'

import { MODO_FOCO, MODO_FOCO_ATIVO } from '@/lib/config/modo-foco'

interface ModoFocoBannerProps {
  detail?: string
}

export function ModoFocoBanner({ detail }: ModoFocoBannerProps) {
  if (!MODO_FOCO_ATIVO) return null
  return (
    <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-4 text-cyan-100">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500/15">
            <Lock className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider">Modo Foco ativo</p>
            <p className="mt-1 text-sm opacity-85">
              Canal autorizado: {MODO_FOCO.canalNome}. Ancora: {MODO_FOCO.redeAncora}.
            </p>
            {detail && <p className="mt-1 text-sm opacity-70">{detail}</p>}
          </div>
        </div>
        <Link
          href={`/canais/${MODO_FOCO.canalSlug}`}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-cyan-400/30 px-3 py-2 text-sm font-semibold transition hover:border-cyan-200"
        >
          Abrir canal foco
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}

