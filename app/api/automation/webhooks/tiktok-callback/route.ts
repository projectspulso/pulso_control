import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/server'

/**
 * GET /api/automation/webhooks/tiktok-callback
 * Callback do OAuth do TikTok (Login Kit). Troca o code por access/refresh token
 * e guarda em pulso_core.configuracoes (chave tiktok_oauth).
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const erro = request.nextUrl.searchParams.get('error')
  if (erro) return new NextResponse(`Autorização negada: ${erro}`, { status: 400 })
  if (!code) return new NextResponse('Faltou o code', { status: 400 })

  const clientKey = process.env.TIKTOK_CLIENT_KEY
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET
  if (!clientKey || !clientSecret) {
    return new NextResponse('TIKTOK_CLIENT_KEY/SECRET não configuradas', { status: 500 })
  }

  const resp = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: 'https://pulsoprojects.vercel.app/api/automation/webhooks/tiktok-callback',
    }),
  })
  const tok = await resp.json()
  if (!tok.access_token) {
    return new NextResponse(`Falha ao trocar token: ${JSON.stringify(tok)}`, { status: 502 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseAdminClient() as any
  const valor = JSON.stringify({
    access_token: tok.access_token,
    refresh_token: tok.refresh_token,
    open_id: tok.open_id,
    scope: tok.scope,
    expires_at: Date.now() + (tok.expires_in || 86400) * 1000,
    refresh_expires_at: Date.now() + (tok.refresh_expires_in || 31536000) * 1000,
  })
  await supabase.schema('pulso_core').from('configuracoes').upsert(
    { chave: 'tiktok_oauth', valor, tipo: 'json', categoria: 'integracao',
      descricao: 'OAuth Content Posting API — @pulsohistorias' },
    { onConflict: 'chave' }
  )

  return new NextResponse(
    '<html><body style="font-family:sans-serif;background:#0a0a14;color:#eee;display:grid;place-items:center;height:100vh"><div><h1>✅ TikTok autorizado!</h1><p>Pode fechar esta aba e voltar pro PULSO Control.</p></div></body></html>',
    { headers: { 'Content-Type': 'text/html' } }
  )
}
