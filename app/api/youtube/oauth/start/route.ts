import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/youtube/oauth/start
 * Monta a URL de autorização do Google (YouTube Analytics readonly) e redireciona.
 * redirect_uri é dinâmico (origin atual) — funciona em localhost e na Vercel;
 * ambos precisam estar registrados no cliente OAuth.
 */
export async function GET(request: NextRequest) {
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
  url.searchParams.set('scope', 'https://www.googleapis.com/auth/yt-analytics.readonly')

  return NextResponse.redirect(url.toString())
}
