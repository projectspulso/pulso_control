import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/server'

/**
 * POST|GET /api/automation/coletar-metricas
 *
 * Coleta métricas das publicações registradas em pulso_content.metricas_publicacao
 * (linhas com post_id externo preenchido) e atualiza as colunas de métricas da própria linha.
 *
 * Fontes: YouTube Data API v3 (YOUTUBE_API_KEY) e Instagram Graph API (INSTAGRAM_ACCESS_TOKEN —
 * page access token do app Meta "Pulso Control"). TikTok/Facebook: coleta manual até F4.
 */

interface LinhaPublicacao {
  id: string
  ideia_id: string | null
  plataforma: string
  post_id: string | null
  url_publicacao: string | null
  data_publicacao: string
  views: number | null
}

async function coletar(request: NextRequest) {
  const secret = request.headers.get('x-webhook-secret')
  if (process.env.WEBHOOK_SECRET && secret && secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseAdminClient() as any

  const { data: linhas, error: fetchError } = await supabase
    .schema('pulso_content')
    .from('metricas_publicacao')
    .select('id, ideia_id, plataforma, post_id, url_publicacao, data_publicacao, views')
    .not('post_id', 'is', null)

  if (fetchError) {
    return NextResponse.json({ error: `Erro ao buscar publicações: ${fetchError.message}` }, { status: 500 })
  }

  const publicacoes = (linhas || []) as LinhaPublicacao[]

  // mapa metricas_publicacao.id -> pulso_distribution.posts.id (para o snapshot diário com FK válida)
  const postIdPorPub = new Map<string, string>()
  const { data: postsRows } = await supabase
    .schema('pulso_distribution')
    .from('posts')
    .select('id, metadata')
    .eq('status', 'PUBLICADO')
  for (const p of postsRows || []) {
    const pubId = p.metadata?.metricas_publicacao_id
    if (pubId) postIdPorPub.set(pubId, p.id)
  }

  const avisos: string[] = []
  if (!process.env.YOUTUBE_API_KEY) avisos.push('YOUTUBE_API_KEY ausente — YouTube ignorado')
  if (!process.env.INSTAGRAM_ACCESS_TOKEN) avisos.push('INSTAGRAM_ACCESS_TOKEN ausente — Instagram ignorado')

  // YouTube em lote (1 chamada para todos os vídeos)
  const ytStats = new Map<string, { views: number; likes: number; comentarios: number }>()
  const ytIds = publicacoes.filter((p) => p.plataforma === 'youtube' && p.post_id).map((p) => p.post_id as string)
  if (ytIds.length > 0 && process.env.YOUTUBE_API_KEY) {
    const url = new URL('https://www.googleapis.com/youtube/v3/videos')
    url.searchParams.set('part', 'statistics')
    url.searchParams.set('id', ytIds.join(','))
    url.searchParams.set('key', process.env.YOUTUBE_API_KEY)
    const resp = await fetch(url.toString())
    if (resp.ok) {
      const data = await resp.json()
      for (const v of data.items || []) {
        ytStats.set(v.id, {
          views: parseInt(v.statistics?.viewCount || '0', 10),
          likes: parseInt(v.statistics?.likeCount || '0', 10),
          comentarios: parseInt(v.statistics?.commentCount || '0', 10),
        })
      }
    } else {
      avisos.push(`YouTube API ${resp.status}: ${(await resp.text()).slice(0, 200)}`)
    }
  }

  const agora = new Date()
  const resultados: Array<{ id: string; plataforma: string; status: string; views?: number; motivo?: string }> = []

  for (const pub of publicacoes) {
    try {
      let metricas: Record<string, number> | null = null

      if (pub.plataforma === 'youtube') {
        const s = ytStats.get(pub.post_id as string)
        if (s) metricas = { views: s.views, likes: s.likes, comentarios: s.comentarios }
      } else if (pub.plataforma === 'instagram' && process.env.INSTAGRAM_ACCESS_TOKEN) {
        const token = process.env.INSTAGRAM_ACCESS_TOKEN
        const mediaUrl = new URL(`https://graph.facebook.com/v23.0/${pub.post_id}`)
        mediaUrl.searchParams.set('fields', 'like_count,comments_count')
        mediaUrl.searchParams.set('access_token', token)
        const mediaResp = await fetch(mediaUrl.toString())
        if (!mediaResp.ok) throw new Error(`IG media ${mediaResp.status}`)
        const media = await mediaResp.json()

        const insights: Record<string, number> = {}
        const insUrl = new URL(`https://graph.facebook.com/v23.0/${pub.post_id}/insights`)
        insUrl.searchParams.set('metric', 'views,reach,saved,shares')
        insUrl.searchParams.set('access_token', token)
        const insResp = await fetch(insUrl.toString())
        if (insResp.ok) {
          const ins = await insResp.json()
          for (const m of ins.data || []) insights[m.name] = m.values?.[0]?.value || 0
        }

        metricas = {
          views: insights.views || 0,
          likes: media.like_count || 0,
          comentarios: media.comments_count || 0,
          shares: insights.shares || 0,
          saves: insights.saved || 0,
        }
      } else if (pub.plataforma === 'facebook' && process.env.INSTAGRAM_ACCESS_TOKEN) {
        // page access token cobre os Reels da Página (video_insights)
        const token = process.env.INSTAGRAM_ACCESS_TOKEN
        const insUrl = new URL(`https://graph.facebook.com/v23.0/${pub.post_id}/video_insights`)
        insUrl.searchParams.set('access_token', token)
        const insResp = await fetch(insUrl.toString())
        if (!insResp.ok) throw new Error(`FB video_insights ${insResp.status}`)
        const ins = await insResp.json()
        const vals: Record<string, unknown> = {}
        for (const m of ins.data || []) vals[m.name] = m.values?.[0]?.value
        const reacoes = (vals.post_video_likes_by_reaction_type || {}) as Record<string, number>
        const likesFb = Object.values(reacoes).reduce((a, b) => a + (b || 0), 0)
        const social = (vals.post_video_social_actions || {}) as Record<string, number>
        metricas = {
          views: (vals.fb_reels_total_plays as number) || (vals.blue_reels_play_count as number) || 0,
          likes: likesFb,
          comentarios: social.COMMENT || 0,
          shares: social.SHARE || 0,
          saves: 0,
        }
      } else {
        resultados.push({ id: pub.id, plataforma: pub.plataforma, status: 'MANUAL' })
        continue
      }

      if (!metricas) {
        resultados.push({ id: pub.id, plataforma: pub.plataforma, status: 'SEM_DADOS' })
        continue
      }

      // janelas: marca views_24h/7d/30d conforme idade da publicação
      const horas = (agora.getTime() - new Date(pub.data_publicacao).getTime()) / 36e5
      const update: Record<string, unknown> = { ...metricas }
      if (horas <= 30) update.views_24h = metricas.views
      if (horas <= 7 * 24 + 6) update.views_7dias = metricas.views
      if (horas <= 30 * 24 + 6) update.views_30dias = metricas.views

      const { error: upError } = await supabase
        .schema('pulso_content')
        .from('metricas_publicacao')
        .update(update)
        .eq('id', pub.id)

      if (upError) {
        resultados.push({ id: pub.id, plataforma: pub.plataforma, status: 'ERRO', motivo: upError.message })
      } else {
        resultados.push({ id: pub.id, plataforma: pub.plataforma, status: 'SUCESSO', views: metricas.views })
      }

      // snapshot diário em pulso_analytics.metricas_diarias (alimenta /analytics e o histórico de aderência)
      const distPostId = postIdPorPub.get(pub.id)
      if (distPostId) {
        const dataRef = agora.toISOString().slice(0, 10)
        const snapshot = {
          views: metricas.views || 0,
          likes: metricas.likes || 0,
          comentarios: metricas.comentarios || 0,
          compartilhamentos: metricas.shares || 0,
          metadata: { plataforma: pub.plataforma, ideia_id: pub.ideia_id, saves: metricas.saves || 0 },
        }
        const { data: snapUpdated } = await supabase
          .schema('pulso_analytics')
          .from('metricas_diarias')
          .update(snapshot)
          .eq('post_id', distPostId)
          .eq('data_ref', dataRef)
          .select('id')
        if (!snapUpdated || snapUpdated.length === 0) {
          await supabase
            .schema('pulso_analytics')
            .from('metricas_diarias')
            .insert({ post_id: distPostId, data_ref: dataRef, ...snapshot })
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido'
      resultados.push({ id: pub.id, plataforma: pub.plataforma, status: 'ERRO', motivo: msg })
    }
  }

  return NextResponse.json({
    success: true,
    total: publicacoes.length,
    coletados: resultados.filter((r) => r.status === 'SUCESSO').length,
    manuais: resultados.filter((r) => r.status === 'MANUAL').length,
    erros: resultados.filter((r) => r.status === 'ERRO').length,
    coletado_em: agora.toISOString(),
    avisos: avisos.length > 0 ? avisos : undefined,
    resultados,
  })
}

export async function POST(request: NextRequest) {
  return coletar(request)
}

// Vercel Cron chama via GET
export async function GET(request: NextRequest) {
  return coletar(request)
}
