import { NextRequest, NextResponse } from 'next/server'
import { guardApi } from '@/lib/auth/api-guard'
import { gravarEstado, novoEstado } from '@/lib/auth/oauth-state'

/**
 * GET /api/youtube/oauth/start
 * Monta a URL de autorização do Google e redireciona. ?canal= escolhe qual canal do PULSO (padrão: principal).
 * redirect_uri é dinâmico (origin atual) — funciona em localhost e na Vercel;
 * ambos precisam estar registrados no cliente OAuth.
 */
export async function GET(request: NextRequest) {
  const denied = await guardApi(request)
  if (denied) return denied
  const clientId = process.env.YOUTUBE_CLIENT_ID
  if (!clientId) {
    return new NextResponse('YOUTUBE_CLIENT_ID não configurada', { status: 500 })
  }

  const redirectUri = `${request.nextUrl.origin}/api/youtube/oauth/callback`
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('access_type', 'offline')
  url.searchParams.set('prompt', 'consent')
  url.searchParams.set('include_granted_scopes', 'true')
  url.searchParams.set('scope', 'https://www.googleapis.com/auth/yt-analytics.readonly https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/youtube.upload')

  // ?canal=<id de youtube_canais> (10/11): o canal viaja no state, que o cookie protege
  const canal = request.nextUrl.searchParams.get('canal') || 'principal'
  if (!/^[a-z0-9_]{1,40}$/.test(canal)) return new NextResponse('canal inválido', { status: 400 })
  const estado = novoEstado(`youtube-${canal}`)
  url.searchParams.set('state', estado)
  return gravarEstado(NextResponse.redirect(url.toString()), estado)
}
