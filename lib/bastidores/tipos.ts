import { AlertTriangle, Flag, GitBranch, Hash, Package, type LucideIcon } from 'lucide-react'
import type { TipoAssunto } from '@/lib/hooks/use-bastidores'

// tipo nunca vai só pela cor: ícone + rótulo sempre juntos
export const TIPOS: Record<TipoAssunto, { rotulo: string; icone: LucideIcon; cor: string; fundo: string }> = {
  incidente: { rotulo: 'Incidente', icone: AlertTriangle, cor: 'text-(--pulso-danger)', fundo: 'bg-(--pulso-danger)/12' },
  marco: { rotulo: 'Marco', icone: Flag, cor: 'text-(--pulso-ok)', fundo: 'bg-(--pulso-ok)/12' },
  decisao: { rotulo: 'Decisão', icone: GitBranch, cor: 'text-(--pulso-warn)', fundo: 'bg-(--pulso-warn)/12' },
  produto: { rotulo: 'Produto', icone: Package, cor: 'text-(--pulso-action)', fundo: 'bg-(--pulso-action)/12' },
  numero: { rotulo: 'Número', icone: Hash, cor: 'text-(--pulso-text-muted)', fundo: 'bg-(--pulso-text-muted)/12' },
}

export const dataLonga = (iso: string) =>
  new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

export const mesAno = (iso: string) =>
  new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
