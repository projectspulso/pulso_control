'use client'

import type { ReactNode } from 'react'
import { AlertTriangle, CalendarClock, CheckCircle2, Clock, Facebook, Hand, Instagram, Music2, Send, Youtube, type LucideIcon } from 'lucide-react'

/**
 * Kit visual dos Longos (dono, 12/11/2026: "muita coisa escrita, complicado de entender"). Peças pequenas e
 * iguais em todas as telas do VL: número em destaque, abas, rede com ícone e estado com cor + ícone + texto
 * (nunca só cor, QC 8.2). Tokens do PULSO, cards rounded-xl (padrão de cards da casa).
 */
export const CARTAO = 'rounded-xl border border-(--pulso-border) bg-(--pulso-surface) shadow-sm'

export function Numero({ icone: Icone, rotulo, valor, sub, tom = 'neutro' }: {
  icone: LucideIcon; rotulo: string; valor: string | number; sub?: string; tom?: 'neutro' | 'ok' | 'alerta' | 'perigo' | 'vl'
}) {
  const cor = { neutro: 'text-(--pulso-text-muted) bg-(--pulso-surface-raised)', ok: 'text-(--pulso-ok) bg-(--pulso-ok)/10',
    alerta: 'text-(--pulso-warn) bg-(--pulso-warn)/10', perigo: 'text-(--pulso-danger) bg-(--pulso-danger)/10', vl: 'text-(--pulso-vl) bg-(--pulso-vl)/10' }[tom]
  return (
    <div className={`${CARTAO} p-4`}>
      <div className="flex items-center gap-2">
        <span className={`rounded-lg p-2 ${cor}`}><Icone className="h-4 w-4" aria-hidden /></span>
        <span className="text-xs text-(--pulso-text-muted)">{rotulo}</span>
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums text-(--pulso-text)">{valor}</p>
      {sub && <p className="text-[11px] text-(--pulso-text-subtle)">{sub}</p>}
    </div>
  )
}

export function Abas<T extends string>({ abas, ativa, onChange }: { abas: { id: T; rotulo: string; icone?: LucideIcon; n?: number }[]; ativa: T; onChange: (id: T) => void }) {
  return (
    <div role="tablist" className="flex gap-1 overflow-x-auto rounded-full border border-(--pulso-border) bg-(--pulso-surface) p-1">
      {abas.map((a) => (
        <button key={a.id} type="button" role="tab" aria-selected={ativa === a.id} onClick={() => onChange(a.id)}
          className={`inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-4 text-[13px] transition-colors ${ativa === a.id ? 'bg-(--pulso-vl) font-medium text-[#1a1206]' : 'text-(--pulso-text-muted) hover:text-(--pulso-text)'}`}>
          {a.icone && <a.icone className="h-4 w-4" aria-hidden />} {a.rotulo}
          {a.n != null && <span className={`rounded-full px-1.5 text-[11px] tabular-nums ${ativa === a.id ? 'bg-black/15' : 'bg-(--pulso-surface-raised)'}`}>{a.n}</span>}
        </button>
      ))}
    </div>
  )
}

export const REDES: Record<string, { nome: string; Icone: LucideIcon }> = {
  youtube: { nome: 'YouTube', Icone: Youtube }, instagram: { nome: 'Instagram', Icone: Instagram },
  facebook: { nome: 'Facebook', Icone: Facebook }, tiktok: { nome: 'TikTok', Icone: Music2 }, kwai: { nome: 'Kwai', Icone: Send },
  linkedin: { nome: 'LinkedIn', Icone: Send },
}
export const redeBase = (r: string) => r.replace(/_story.*$/, '').replace(/_antes|_depois/, '')

export const CANAIS: Record<string, { nome: string; curto: string }> = {
  pulso_cortes: { nome: 'Cortes PULSO Histórias', curto: 'Cortes' },
  pulso_bastidores: { nome: 'Bastidores PULSO Histórias', curto: 'Bastidores' },
  bastidores: { nome: 'Bastidores DIGIAI Cortes', curto: 'DIGIAI Cortes' },
  bastidores_cortes: { nome: 'Bastidores DIGIAI Cortes', curto: 'DIGIAI Cortes' },
  digiai: { nome: 'DIGIAI', curto: 'DIGIAI' },
}
export const ORDEM_CANAIS = ['pulso_cortes', 'pulso_bastidores', 'bastidores', 'digiai']

/** estado de uma peça da agenda: quem publica + em que pé está */
export function estadoDaPeca(p: { status: string; modo: string }) {
  if (p.status === 'publicado') return { rotulo: 'no ar', Icone: CheckCircle2, classe: 'text-(--pulso-ok) bg-(--pulso-ok)/12 border-(--pulso-ok)/30' }
  if (p.status === 'agendado') return { rotulo: 'agendado na Meta', Icone: CalendarClock, classe: 'text-(--pulso-ok) bg-(--pulso-ok)/8 border-(--pulso-ok)/25' }
  if (p.status === 'erro') return { rotulo: 'erro', Icone: AlertTriangle, classe: 'text-(--pulso-danger) bg-(--pulso-danger)/10 border-(--pulso-danger)/30' }
  if (p.status === 'aguarda_conta') return { rotulo: 'sem conta', Icone: AlertTriangle, classe: 'text-(--pulso-text-subtle) bg-(--pulso-surface-raised) border-(--pulso-border)' }
  if (p.modo === 'manual' || p.modo === 'rascunho') return { rotulo: 'você posta', Icone: Hand, classe: 'text-(--pulso-warn) bg-(--pulso-warn)/10 border-(--pulso-warn)/30' }
  if (p.modo === 'job') return { rotulo: 'MKT publica', Icone: Send, classe: 'text-(--pulso-text-muted) bg-(--pulso-surface-raised) border-(--pulso-border)' }
  return { rotulo: 'sai sozinho', Icone: Clock, classe: 'text-(--pulso-vl) bg-(--pulso-vl)/10 border-(--pulso-vl)/30' }
}

export function Legenda() {
  const itens = [
    estadoDaPeca({ status: 'planejado', modo: 'auto' }), estadoDaPeca({ status: 'agendado', modo: 'auto' }),
    estadoDaPeca({ status: 'publicado', modo: 'auto' }), estadoDaPeca({ status: 'planejado', modo: 'manual' }),
    estadoDaPeca({ status: 'planejado', modo: 'job' }), estadoDaPeca({ status: 'erro', modo: 'auto' }),
  ]
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Legenda dos estados">
      {itens.map((e) => (
        <li key={e.rotulo} className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] ${e.classe}`}><e.Icone className="h-3 w-3" aria-hidden /> {e.rotulo}</li>
      ))}
    </ul>
  )
}

export function Vazio({ children }: { children: ReactNode }) {
  return <div className="flex min-h-24 items-center justify-center rounded-xl border border-dashed border-(--pulso-border) px-4 text-center text-xs text-(--pulso-text-muted)">{children}</div>
}
