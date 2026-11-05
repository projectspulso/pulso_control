'use client'

import { usePathname } from 'next/navigation'
import { useSyncExternalStore } from 'react'

/**
 * UM APP, DUAS CARAS (dono, 05/11/2026): Curtos (VC) é o PULSO diário de Shorts; Longos (VL) é a
 * fábrica dos vídeos longos dos Bastidores e dos cortes que saem deles. A cara muda o menu, a cor
 * de destaque e os dados. A rota manda: /longos e /bastidores são Longos, o resto é Curtos, e as
 * telas compartilhadas (configurações, assets, kit) ficam na cara em que você estava.
 */
export type Modo = 'curtos' | 'longos'

export const MODOS: Record<Modo, { nome: string; sigla: string; inicio: string; descricao: string }> = {
  curtos: { nome: 'Curtos', sigla: 'VC', inicio: '/', descricao: 'PULSO diário: Shorts, Reels e TikTok, um por dia, nas 5 redes' },
  longos: { nome: 'Longos', sigla: 'VL', inicio: '/longos', descricao: 'Bastidores: vídeos longos no YouTube e a fábrica de cortes que sai deles' },
}

const ROTAS_LONGOS = ['/longos', '/bastidores']
export const ROTAS_COMPARTILHADAS = ['/settings', '/integracoes', '/assets', '/analytics/kit', '/escolha']

const casa = (p: string, base: string) => p === base || p.startsWith(`${base}/`)
export const ehCompartilhada = (p: string) => ROTAS_COMPARTILHADAS.some((b) => casa(p, b))

export function modoDaRota(pathname: string, salvo: Modo): Modo {
  if (ROTAS_LONGOS.some((b) => casa(pathname, b))) return 'longos'
  if (ehCompartilhada(pathname)) return salvo
  return 'curtos'
}

const CHAVE = 'pulso:modo'
const EVENTO = 'pulso-modo'

function lerSalvo(): Modo {
  try { return localStorage.getItem(CHAVE) === 'longos' ? 'longos' : 'curtos' } catch { return 'curtos' }
}

export function gravarModo(m: Modo) {
  try {
    if (localStorage.getItem(CHAVE) === m) return
    localStorage.setItem(CHAVE, m)
  } catch { return }
  window.dispatchEvent(new Event(EVENTO))
}

function assinar(avisar: () => void) {
  window.addEventListener(EVENTO, avisar)
  window.addEventListener('storage', avisar)
  return () => { window.removeEventListener(EVENTO, avisar); window.removeEventListener('storage', avisar) }
}

export function useModo(): Modo {
  const pathname = usePathname()
  const salvo = useSyncExternalStore(assinar, lerSalvo, () => 'curtos' as Modo)
  return modoDaRota(pathname, salvo)
}
