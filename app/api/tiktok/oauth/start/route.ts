import { NextRequest, NextResponse } from 'next/server'
import { guardApi } from '@/lib/auth/api-guard'
import { credenciaisTikTok, TIKTOK_ESCOPOS, TIKTOK_REDIRECT_URI } from '@/lib/publicacao/tiktok-chave'

/**
 * GET /api/tiktok/oauth/start — o dono abre logado no app e autoriza a conta @pulsohistorias no
 * APP DE PRODUÇÃO do TikTok (auditado: publica direto). O callback grava o token com app='producao'.
 */
export async function GET(request: NextRequest) {
  const denied = await guardApi(request)
  if (denied) return denied
  const { key } = credenciaisTikTok('producao')
  if (!key) return new NextResponse('TIKTOK_CLIENT_KEY não configurada na Vercel', { status: 500 })
  const u = new URL('https://www.tiktok.com/v2/auth/authorize/')
  u.searchParams.set('client_key', key)
  u.searchParams.set('scope', TIKTOK_ESCOPOS)
  u.searchParams.set('response_type', 'code')
  u.searchParams.set('redirect_uri', TIKTOK_REDIRECT_URI)
  u.searchParams.set('state', 'producao')
  return NextResponse.redirect(u.toString())
}
