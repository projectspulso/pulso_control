'use client'

import { ShieldCheck, ShieldAlert, Check, X } from 'lucide-react'

import { useAudit } from '@/lib/hooks/use-audit'

export function AuditPanel() {
  const { data, isLoading } = useAudit()
  if (isLoading || !data) return null
  const problemas = data.checks.filter((c) => !c.ok)
  const tudoOk = problemas.length === 0

  return (
    <div className={`glass rounded-2xl border p-5 ${tudoOk ? 'border-emerald-500/25' : 'border-red-500/30'}`}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {tudoOk ? <ShieldCheck className="h-4 w-4 text-emerald-300" /> : <ShieldAlert className="h-4 w-4 text-red-300" />}
        <h2 className="text-sm font-bold text-white">Saúde dos dados</h2>
        <span className="text-xs text-zinc-500">coerência entre pipeline e publicações</span>
        <span className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-bold ${tudoOk ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300'}`}>
          {data.saude}% ok
        </span>
      </div>
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
        {data.checks.map((c) => (
          <div key={c.id} className={`flex items-start gap-2 rounded-lg px-3 py-2 ${c.ok ? 'bg-zinc-900/40' : 'bg-red-500/10'}`}>
            <span className={`mt-0.5 shrink-0 ${c.ok ? 'text-emerald-400' : 'text-red-400'}`}>
              {c.ok ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
            </span>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-zinc-200">{c.label} {!c.ok && <span className="text-red-300">({c.count})</span>}</div>
              {!c.ok && <div className="truncate text-[10px] text-zinc-500" title={c.detalhe.join(' · ')}>{c.detalhe.join(' · ')}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
