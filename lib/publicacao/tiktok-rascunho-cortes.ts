import { credenciaisTikTok } from '@/lib/publicacao/tiktok-chave'

/**
 * Rascunho na caixa do TikTok para as contas de cortes do PULSO (dono, 12/11/2026: "mandar como rascunho,
 * igual em todos os canais de cortes"). Enquanto o app não é aprovado, o TikTok só aceita rascunho (/inbox/),
 * e quem aperta publicar é o dono, no celular. O token de cada conta mora em tiktok_oauth:<conta>.
 * Devolve null quando a conta ainda não foi autorizada: a peça fica para o dono postar como antes.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function tokenTikTokConta(supabase: any, conta: string): Promise<string | null> {
  const chave = `tiktok_oauth:${conta}`
  const { data: cfg } = await supabase.schema('pulso_core').from('configuracoes').select('valor').eq('chave', chave).maybeSingle()
  if (!cfg?.valor) return null
  let oauth = JSON.parse(cfg.valor)
  if (Date.now() > oauth.expires_at - 60_000) {
    const { key, secret } = credenciaisTikTok(oauth.app)
    const r = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_key: key, client_secret: secret, grant_type: 'refresh_token', refresh_token: oauth.refresh_token }),
    }).then((x) => x.json())
    if (!r.access_token) throw new Error(`renovar o acesso do TikTok ${conta}: ${JSON.stringify(r).slice(0, 120)}`)
    oauth = { ...oauth, access_token: r.access_token, refresh_token: r.refresh_token, expires_at: Date.now() + (r.expires_in || 86400) * 1000 }
    await supabase.schema('pulso_core').from('configuracoes').update({ valor: JSON.stringify(oauth) }).eq('chave', chave)
  }
  return oauth.access_token as string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function enviaRascunhoTikTok(supabase: any, conta: string, video: Buffer): Promise<string | null> {
  const token = await tokenTikTokConta(supabase, conta)
  if (!token) return null
  const init = await fetch('https://open.tiktokapis.com/v2/post/publish/inbox/video/init/', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ source_info: { source: 'FILE_UPLOAD', video_size: video.length, chunk_size: video.length, total_chunk_count: 1 } }),
  }).then((x) => x.json())
  const upload = init?.data?.upload_url
  if (!upload) throw new Error(`TikTok ${conta} init: ${JSON.stringify(init?.error || init).slice(0, 150)}`)
  const put = await fetch(upload, {
    method: 'PUT',
    headers: { 'Content-Type': 'video/mp4', 'Content-Length': String(video.length), 'Content-Range': `bytes 0-${video.length - 1}/${video.length}` },
    body: new Uint8Array(video),
  })
  if (!put.ok) throw new Error(`TikTok ${conta} upload (${put.status})`)
  return init.data.publish_id as string
}
