import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/server'

/**
 * GET /api/automation/status-contas
 *
 * Seguidores/inscritos atuais de cada conta PULSO — alimenta o placar
 * "Rumo à monetização" do /analytics (gates em lib/config/monetizacao.ts).
 */

const GRAPH = 'https://graph.facebook.com/v23.0'
const YT_CHANNEL_ID = 'UCqrAzwWiKvphDqH2o6PGzBw'

export async function GET() {
  const contas: Record<string, { seguidores: number | null; detalhe?: string }> = {
    youtube: { seguidores: null },
    instagram: { seguidores: null },
    facebook: { seguidores: null },
    tiktok: { seguidores: null },
    kwai: { seguidores: null },
  }
  const avisos: string[] = []

  const token = process.env.INSTAGRAM_ACCESS_TOKEN
  const igUserId = process.env.META_IG_USER_ID || '17841478757082171'
  const pageId = process.env.META_PAGE_ID || '926237593895365'

  // YouTube — inscritos do canal
  if (process.env.YOUTUBE_API_KEY) {
    try {
      const url = new URL('https://www.googleapis.com/youtube/v3/channels')
      url.searchParams.set('part', 'statistics')
      url.searchParams.set('id', YT_CHANNEL_ID)
      url.searchParams.set('key', process.env.YOUTUBE_API_KEY)
      const j = await fetch(url).then((r) => r.json())
      const st = j?.items?.[0]?.statistics
      if (st) {
        contas.youtube = {
          seguidores: Number(st.subscriberCount || 0),
          detalhe: `${st.viewCount} views totais no canal`,
        }
      }
    } catch (e) {
      avisos.push(`youtube: ${e instanceof Error ? e.message : 'erro'}`)
    }
  } else {
    avisos.push('YOUTUBE_API_KEY ausente')
  }

  // Instagram + Facebook via Graph API
  if (token) {
    try {
      const ig = await fetch(`${GRAPH}/${igUserId}?fields=followers_count&access_token=${token}`).then((r) => r.json())
      if (typeof ig.followers_count === 'number') contas.instagram = { seguidores: ig.followers_count }
    } catch (e) {
      avisos.push(`instagram: ${e instanceof Error ? e.message : 'erro'}`)
    }
    try {
      const fb = await fetch(`${GRAPH}/${pageId}?fields=followers_count,fan_count&access_token=${token}`).then((r) => r.json())
      const seg = fb.followers_count ?? fb.fan_count
      if (typeof seg === 'number') contas.facebook = { seguidores: seg }
    } catch (e) {
      avisos.push(`facebook: ${e instanceof Error ? e.message : 'erro'}`)
    }
  } else {
    avisos.push('INSTAGRAM_ACCESS_TOKEN ausente')
  }

  // TikTok — follower_count via Display API (token em pulso_core.configuracoes, com refresh)
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = getSupabaseAdminClient() as any
    const { data: cfg } = await supabase
      .schema('pulso_core').from('configuracoes').select('valor').eq('chave', 'tiktok_oauth').single()
    if (cfg?.valor) {
      let oauth = JSON.parse(cfg.valor)
      if (Date.now() > oauth.expires_at - 60_000 && oauth.refresh_token) {
        const r = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_key: (process.env.TIKTOK_SANDBOX_KEY || process.env.TIKTOK_CLIENT_KEY) ?? '',
            client_secret: (process.env.TIKTOK_SANDBOX_SECRET || process.env.TIKTOK_CLIENT_SECRET) ?? '',
            grant_type: 'refresh_token',
            refresh_token: oauth.refresh_token,
          }),
        }).then((x) => x.json())
        if (r.access_token) {
          oauth = { ...oauth, access_token: r.access_token, refresh_token: r.refresh_token,
            expires_at: Date.now() + (r.expires_in || 86400) * 1000 }
          await supabase.schema('pulso_core').from('configuracoes')
            .update({ valor: JSON.stringify(oauth) }).eq('chave', 'tiktok_oauth')
        }
      }
      const info = await fetch(
        'https://open.tiktokapis.com/v2/user/info/?fields=follower_count,likes_count',
        { headers: { Authorization: `Bearer ${oauth.access_token}` } }
      ).then((x) => x.json())
      const fc = info?.data?.user?.follower_count
      if (typeof fc === 'number') {
        contas.tiktok = { seguidores: fc, detalhe: `${info.data.user.likes_count ?? 0} likes na conta` }
      }
    }
  } catch (e) {
    avisos.push(`tiktok: ${e instanceof Error ? e.message : 'erro'}`)
  }

  // Kwai — sem API pública; seguidores vêm do lançamento manual (config kwai_perfil)
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = getSupabaseAdminClient() as any
    const { data: cfg } = await supabase
      .schema('pulso_core').from('configuracoes').select('valor').eq('chave', 'kwai_perfil').single()
    if (cfg?.valor) {
      const perfil = typeof cfg.valor === 'string' ? JSON.parse(cfg.valor) : cfg.valor
      if (typeof perfil?.seguidores === 'number') {
        contas.kwai = { seguidores: perfil.seguidores, detalhe: `${perfil.curtidas ?? 0} curtidas · manual` }
      }
    }
  } catch (e) {
    avisos.push(`kwai: ${e instanceof Error ? e.message : 'erro'}`)
  }

  return NextResponse.json({ contas, avisos, coletado_em: new Date().toISOString() })
}
