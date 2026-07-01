'use client'

import { AlertTriangle, Zap } from 'lucide-react'
import { useHiggsfieldSaldo } from '@/lib/hooks/use-higgsfield-saldo'

/**
 * Banner proativo de crédito de render (Higgsfield/Veo). Só aparece quando o
 * saldo está baixo — some quando dá pra render. Colocar no topo de /producao
 * e /audios (onde o render acontece).
 */
export function AvisoCreditoRender() {
  const { data } = useHiggsfieldSaldo()
  if (!data || data.nivel === 'ok') return null

  const critico = data.nivel === 'critico'
  const quando = data.quando
    ? new Date(data.quando).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <div
      className={`mb-4 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
        critico
          ? 'border-red-500/40 bg-red-500/10 text-red-200'
          : 'border-amber-500/40 bg-amber-500/10 text-amber-200'
      }`}
    >
      {critico ? (
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
      ) : (
        <Zap className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
      )}
      <div>
        <p className="font-semibold">
          {critico
            ? `Higgsfield com ${data.creditos.toFixed(2)} crédito(s) — os renders vão FALHAR.`
            : `Crédito de render baixo: ${data.creditos.toFixed(0)} créditos (~${data.videosRestantes} vídeo${data.videosRestantes === 1 ? '' : 's'}).`}
        </p>
        <p className="mt-0.5 text-xs opacity-80">
          {critico
            ? 'Recarregue o Higgsfield (ou renderize pelo banco de clips) — cada vídeo custa ~72 créditos Veo.'
            : 'Recarregue antes que os vídeos em Em Edição travem no worker.'}
          {quando && <span className="ml-1 opacity-60">· saldo lido em {quando}</span>}
        </p>
      </div>
    </div>
  )
}
