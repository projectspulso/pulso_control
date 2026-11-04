import { randomBytes, timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

// Callback de OAuth sem state de uso único aceitava qualquer `code`: quem autorizasse a própria
// conta trocava o token de publicação do PULSO (achado da revisão de 03/11/2026).
const COOKIE = 'pulso_oauth_state'

export function novoEstado(prefixo: string): string {
  return `${prefixo}.${randomBytes(16).toString('hex')}`
}

export function gravarEstado(res: NextResponse, estado: string): NextResponse {
  res.cookies.set(COOKIE, estado, { httpOnly: true, secure: true, sameSite: 'lax', path: '/api', maxAge: 600 })
  return res
}

export function estadoConfere(request: NextRequest): boolean {
  const s = request.nextUrl.searchParams.get('state') || ''
  const c = request.cookies.get(COOKIE)?.value || ''
  return !!s && s.length === c.length && timingSafeEqual(Buffer.from(s), Buffer.from(c))
}
