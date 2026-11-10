import { getSupabaseAdminClient } from '@/lib/supabase/server'

interface YoutubeOAuth {
  access_token: string
  refresh_token: string
  expires_at: number
  scope?: string
  obtido_em?: string
}

/**
 * Lê o token OAuth do YouTube de pulso_core.configuracoes. A chave padrão é a do PULSO Histórias
 * (youtube_oauth); cada canal de cortes do PULSO tem a sua (youtube_oauth:<canal>, 10/11/2026).
 * Se expirado (folga de 60s), faz refresh e persiste o novo access_token/expires_at
 * (preservando o refresh_token). Retorna null se não houver token configurado.
 */
export async function getYoutubeAccessToken(chave = 'youtube_oauth'): Promise<string | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseAdminClient() as any

  const { data: cfg } = await supabase
    .schema('pulso_core')
    .from('configuracoes')
    .select('valor')
    .eq('chave', chave)
    .single()

  if (!cfg?.valor) return null

  let oauth: YoutubeOAuth
  try {
    oauth = JSON.parse(cfg.valor)
  } catch {
    return null
  }
  if (!oauth.access_token) return null

  if (Date.now() <= oauth.expires_at - 60_000) {
    return oauth.access_token
  }

  // expirado → refresh
  if (!oauth.refresh_token) return null
  const clientId = process.env.YOUTUBE_CLIENT_ID
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET
  if (!clientId || !clientSecret) return oauth.access_token

  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: oauth.refresh_token,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  }).then((x) => x.json())

  if (!r.access_token) return null

  const atualizado: YoutubeOAuth = {
    ...oauth,
    access_token: r.access_token,
    expires_at: Date.now() + (r.expires_in || 3600) * 1000,
  }
  await supabase
    .schema('pulso_core')
    .from('configuracoes')
    .update({ valor: JSON.stringify(atualizado) })
    .eq('chave', chave)

  return atualizado.access_token
}

export interface CanalYoutube { canal: string; channel_id: string; nome: string; chave: string }

/** Canais do PULSO que o app pode autorizar (config youtube_canais). Canal fora da lista não autoriza. */
export async function canaisYoutube(): Promise<CanalYoutube[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseAdminClient() as any
  const { data } = await supabase.schema('pulso_core').from('configuracoes').select('valor').eq('chave', 'youtube_canais').maybeSingle()
  try {
    const v = JSON.parse(data?.valor || '{}') as Record<string, { channel_id: string; nome: string }>
    return Object.entries(v).map(([canal, c]) => ({ canal, ...c, chave: canal === 'principal' ? 'youtube_oauth' : `youtube_oauth:${canal}` }))
  } catch {
    return []
  }
}
