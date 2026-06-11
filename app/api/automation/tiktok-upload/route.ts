import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/server'

/**
 * POST /api/automation/tiktok-upload
 * Envia um vídeo pros RASCUNHOS do TikTok (@pulsohistorias) via Content Posting API
 * (inbox/FILE_UPLOAD — sem auditoria). O dono publica com 2 toques no app, escolhendo som.
 * Payload: { video_url: string, confirmar: true }
 */
export async function POST(request: NextRequest) {
  const { video_url, confirmar } = await request.json().catch(() => ({}))
  if (!confirmar) return NextResponse.json({ error: 'Envie confirmar: true (R-011)' }, { status: 400 })
  if (!video_url) return NextResponse.json({ error: 'video_url é obrigatório' }, { status: 400 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseAdminClient() as any
  const { data: cfg } = await supabase
    .schema('pulso_core').from('configuracoes').select('valor').eq('chave', 'tiktok_oauth').single()
  if (!cfg?.valor) return NextResponse.json({ error: 'TikTok não autorizado ainda (rode o OAuth)' }, { status: 401 })

  let oauth = JSON.parse(cfg.valor)

  // refresh se expirou
  if (Date.now() > oauth.expires_at - 60_000) {
    const r = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_key: process.env.TIKTOK_CLIENT_KEY || '',
        client_secret: process.env.TIKTOK_CLIENT_SECRET || '',
        grant_type: 'refresh_token',
        refresh_token: oauth.refresh_token,
      }),
    }).then((x) => x.json())
    if (!r.access_token) return NextResponse.json({ error: `Refresh falhou: ${JSON.stringify(r)}` }, { status: 502 })
    oauth = { ...oauth, access_token: r.access_token, refresh_token: r.refresh_token,
      expires_at: Date.now() + (r.expires_in || 86400) * 1000 }
    await supabase.schema('pulso_core').from('configuracoes')
      .update({ valor: JSON.stringify(oauth) }).eq('chave', 'tiktok_oauth')
  }

  // baixa o vídeo (usar versão <20MB)
  const vid = await fetch(video_url)
  if (!vid.ok) return NextResponse.json({ error: `Não baixei o vídeo (${vid.status})` }, { status: 400 })
  const buf = Buffer.from(await vid.arrayBuffer())

  // init inbox upload
  const init = await fetch('https://open.tiktokapis.com/v2/post/publish/inbox/video/init/', {
    method: 'POST',
    headers: { Authorization: `Bearer ${oauth.access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      source_info: { source: 'FILE_UPLOAD', video_size: buf.length, chunk_size: buf.length, total_chunk_count: 1 },
    }),
  }).then((x) => x.json())
  const uploadUrl = init?.data?.upload_url
  if (!uploadUrl) return NextResponse.json({ error: `Init falhou: ${JSON.stringify(init)}` }, { status: 502 })

  const put = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'video/mp4',
      'Content-Length': String(buf.length),
      'Content-Range': `bytes 0-${buf.length - 1}/${buf.length}`,
    },
    body: buf,
  })
  if (!put.ok) return NextResponse.json({ error: `Upload falhou (${put.status})` }, { status: 502 })

  return NextResponse.json({
    success: true,
    publish_id: init.data.publish_id,
    mensagem: 'Vídeo enviado pros RASCUNHOS do TikTok — abra o app no celular pra publicar (escolha um som trending!)',
  })
}
