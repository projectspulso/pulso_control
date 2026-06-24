import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/server'

/**
 * GET /api/youtube/oauth/callback
 * Callback do OAuth do Google. Troca o code por access/refresh token e guarda em
 * pulso_core.configuracoes (chave youtube_oauth). Mesmo padrão do tiktok_oauth.
 */
export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get('code')
    const erro = request.nextUrl.searchParams.get('error')
    if (erro || !code) {
      return NextResponse.redirect(`${request.nextUrl.origin}/analytics?yt=erro`)
    }

    const clientId = process.env.YOUTUBE_CLIENT_ID
    const clientSecret = process.env.YOUTUBE_CLIENT_SECRET
    if (!clientId || !clientSecret) {
      return NextResponse.redirect(`${request.nextUrl.origin}/analytics?yt=erro`)
    }

    const redirectUri = `${request.nextUrl.origin}/api/youtube/oauth/callback`
    const resp = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })
    const tok = await resp.json()
    if (!tok.access_token) {
      return NextResponse.redirect(`${request.nextUrl.origin}/analytics?yt=erro`)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = getSupabaseAdminClient() as any
    const valor = JSON.stringify({
      access_token: tok.access_token,
      refresh_token: tok.refresh_token,
      expires_at: Date.now() + (tok.expires_in || 3600) * 1000,
      scope: tok.scope,
      obtido_em: new Date().toISOString(),
    })
    await supabase.schema('pulso_core').from('configuracoes').upsert(
      {
        chave: 'youtube_oauth',
        valor,
        tipo: 'json',
        categoria: 'integracao',
        descricao: 'OAuth YouTube Analytics API (yt-analytics.readonly) — retenção de Shorts',
      },
      { onConflict: 'chave' }
    )

    return NextResponse.redirect(`${request.nextUrl.origin}/analytics?yt=conectado`)
  } catch {
    return NextResponse.redirect(`${request.nextUrl.origin}/analytics?yt=erro`)
  }
}
