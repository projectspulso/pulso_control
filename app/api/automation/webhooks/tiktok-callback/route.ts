import { NextRequest, NextResponse } from 'next/server'
import { guardApi } from '@/lib/auth/api-guard'
import { estadoConfere } from '@/lib/auth/oauth-state'
import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { credenciaisTikTok, TIKTOK_REDIRECT_URI } from '@/lib/publicacao/tiktok-chave'

/**
 * GET /api/automation/webhooks/tiktok-callback
 * Callback do OAuth do TikTok (Login Kit). Troca o code por access/refresh token
 * e guarda em pulso_core.configuracoes: tiktok_oauth (principal) ou tiktok_oauth:<conta> (cortes),
 * conferindo antes qual conta foi autorizada.
 */
export async function GET(request: NextRequest) {
  const denied = await guardApi(request)
  if (denied) return denied
  if (!estadoConfere(request)) return new NextResponse('Autorização sem state válido: abra /api/tiktok/oauth/start logado no app', { status: 400 })
  const code = request.nextUrl.searchParams.get('code')
  const erro = request.nextUrl.searchParams.get('error')
  if (erro) return new NextResponse(`Autorização negada: ${erro}`, { status: 400 })
  if (!code) return new NextResponse('Faltou o code', { status: 400 })

  // o prefixo do `state` diz qual app pediu a autorização (o /api/tiktok/oauth/start manda 'producao.<aleatório>')
  const prefixo = (request.nextUrl.searchParams.get('state') || '').split('.')[0]
  const app = prefixo.startsWith('producao') ? 'producao' : 'sandbox'
  const conta = prefixo.startsWith('producao-') ? prefixo.slice('producao-'.length) : 'principal'
  const { key: clientKey, secret: clientSecret } = credenciaisTikTok(app)
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
      redirect_uri: TIKTOK_REDIRECT_URI,
    }),
  })
  const tok = await resp.json()
  if (!tok.access_token) {
    return new NextResponse(`Falha ao trocar token: ${JSON.stringify(tok)}`, { status: 502 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseAdminClient() as any
  // confere QUAL conta o dono autorizou antes de gravar (10/11): o principal só aceita o mesmo open_id
  // de antes; uma conta de cortes não pode ser uma já ligada e tem o nome cadastrado em tiktok_contas
  const chave = conta === 'principal' ? 'tiktok_oauth' : `tiktok_oauth:${conta}`
  // o escopo user.info.basic dá open_id e display_name (username pediria user.info.profile)
  const info = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name', {
    headers: { Authorization: `Bearer ${tok.access_token}` },
  }).then((x) => x.json()).catch(() => ({}))
  const usuario = String(info?.data?.user?.display_name || '')
  const { data: tokens } = await supabase.schema('pulso_core').from('configuracoes').select('chave, valor').like('chave', 'tiktok_oauth%')
  const openIds = new Map<string, string>()
  for (const t of tokens || []) {
    try { openIds.set(t.chave, JSON.parse(t.valor).open_id || '') } catch { /* token ilegível não conta */ }
  }
  if (conta === 'principal') {
    const antes = openIds.get('tiktok_oauth') || ''
    if (antes && antes !== tok.open_id) {
      return new NextResponse(`Conta errada: esta autorização é de "${usuario || '?'}", não da conta principal do PULSO. Nada foi gravado.`, { status: 409 })
    }
  } else {
    const { data: lista } = await supabase.schema('pulso_core').from('configuracoes').select('valor').eq('chave', 'tiktok_contas').maybeSingle()
    let esperado = ''
    try { esperado = JSON.parse(lista?.valor || '{}')?.[conta]?.nome || '' } catch { esperado = '' }
    if (!esperado) return new NextResponse(`Conta ${conta} não está em tiktok_contas. Nada foi gravado.`, { status: 400 })
    const ocupada = [...openIds.entries()].find(([k, id]) => k !== chave && id && id === tok.open_id)
    if (ocupada) return new NextResponse(`Conta errada: "${usuario || '?'}" já está ligada em ${ocupada[0]}. Nada foi gravado.`, { status: 409 })
    if (usuario.trim().toLowerCase() !== esperado.trim().toLowerCase()) {
      return new NextResponse(`Conta errada: esperava "${esperado}", veio "${usuario || '?'}". Nada foi gravado.`, { status: 409 })
    }
  }
  const valor = JSON.stringify({
    access_token: tok.access_token,
    refresh_token: tok.refresh_token,
    open_id: tok.open_id,
    scope: tok.scope,
    app,
    expires_at: Date.now() + (tok.expires_in || 86400) * 1000,
    refresh_expires_at: Date.now() + (tok.refresh_expires_in || 31536000) * 1000,
  })
  await supabase.schema('pulso_core').from('configuracoes').upsert(
    { chave, valor, tipo: 'json', categoria: 'integracao',
      descricao: conta === 'principal' ? 'OAuth Content Posting API — conta principal do PULSO' : `OAuth Content Posting API — @${usuario} (${conta})` },
    { onConflict: 'chave' }
  )

  return new NextResponse(
    '<html><body style="font-family:sans-serif;background:#0a0a14;color:#eee;display:grid;place-items:center;height:100vh"><div><h1>✅ TikTok autorizado!</h1><p>Pode fechar esta aba e voltar pro PULSO Control.</p></div></body></html>',
    { headers: { 'Content-Type': 'text/html' } }
  )
}
