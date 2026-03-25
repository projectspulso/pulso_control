import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/server'

/**
 * POST /api/automation/coletar-metricas
 *
 * Coleta métricas de plataformas sociais para conteúdos publicados.
 * Payload: { post_ids?: string[], dias_atras?: number }
 *
 * Consulta posts com status PUBLICADO e busca métricas via APIs
 * das plataformas (YouTube, TikTok, Instagram). Para plataformas
 * sem API configurada, marca como coleta manual necessária.
 */
export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-webhook-secret')
  if (secret && secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const queueId = request.headers.get('x-queue-item-id')
  const payload = await request.json().catch(() => ({}))
  const diasAtras = payload.dias_atras || 30
  const postIds: string[] | undefined = payload.post_ids

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseAdminClient() as any

  try {
    // Buscar posts publicados
    const dataLimite = new Date()
    dataLimite.setDate(dataLimite.getDate() - diasAtras)

    let query = supabase
      .schema('pulso_distribution')
      .from('posts')
      .select('id, conteudo_id, plataforma, identificador_externo, publicado_em, metadata')
      .eq('status', 'PUBLICADO')
      .gte('publicado_em', dataLimite.toISOString())
      .order('publicado_em', { ascending: false })

    if (postIds && postIds.length > 0) {
      query = query.in('id', postIds)
    }

    const { data: posts, error: fetchError } = await query

    if (fetchError) {
      return NextResponse.json(
        { error: `Erro ao buscar posts: ${fetchError.message}` },
        { status: 500 }
      )
    }

    if (!posts || posts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nenhum post publicado encontrado no período',
        coletados: 0,
        ignorados: 0,
        erros: 0,
      })
    }

    const dataRef = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    const resultados: MetricaResultado[] = []
    const avisos: string[] = []

    // Verificar quais APIs estão disponíveis
    const apisDisponiveis = {
      youtube: !!process.env.YOUTUBE_API_KEY,
      tiktok: !!process.env.TIKTOK_API_KEY,
      instagram: !!process.env.INSTAGRAM_ACCESS_TOKEN,
    }

    if (!apisDisponiveis.youtube) avisos.push('YOUTUBE_API_KEY não configurada — YouTube será ignorado')
    if (!apisDisponiveis.tiktok) avisos.push('TIKTOK_API_KEY não configurada — TikTok será ignorado')
    if (!apisDisponiveis.instagram) avisos.push('INSTAGRAM_ACCESS_TOKEN não configurado — Instagram será ignorado')

    // Processar cada post
    for (const post of posts) {
      const plataforma = (post.plataforma || '').toUpperCase()
      const externalId = post.identificador_externo

      try {
        let metricas: MetricasPlataforma | null = null

        switch (plataforma) {
          case 'YOUTUBE': {
            if (!apisDisponiveis.youtube) {
              resultados.push({ post_id: post.id, plataforma, status: 'IGNORADO', motivo: 'API key ausente' })
              continue
            }
            if (!externalId) {
              resultados.push({ post_id: post.id, plataforma, status: 'ERRO', motivo: 'Sem identificador externo' })
              continue
            }
            metricas = await coletarYouTube(externalId)
            break
          }

          case 'TIKTOK': {
            if (!apisDisponiveis.tiktok) {
              resultados.push({ post_id: post.id, plataforma, status: 'IGNORADO', motivo: 'API key ausente' })
              continue
            }
            if (!externalId) {
              resultados.push({ post_id: post.id, plataforma, status: 'ERRO', motivo: 'Sem identificador externo' })
              continue
            }
            metricas = await coletarTikTok(externalId)
            break
          }

          case 'INSTAGRAM': {
            if (!apisDisponiveis.instagram) {
              resultados.push({ post_id: post.id, plataforma, status: 'IGNORADO', motivo: 'API key ausente' })
              continue
            }
            if (!externalId) {
              resultados.push({ post_id: post.id, plataforma, status: 'ERRO', motivo: 'Sem identificador externo' })
              continue
            }
            metricas = await coletarInstagram(externalId)
            break
          }

          default: {
            // Kwai, Facebook, etc — coleta manual
            resultados.push({
              post_id: post.id,
              plataforma,
              status: 'MANUAL',
              motivo: `Coleta manual necessária para ${plataforma}`,
            })
            continue
          }
        }

        if (!metricas) {
          resultados.push({ post_id: post.id, plataforma, status: 'ERRO', motivo: 'API retornou sem dados' })
          continue
        }

        // Upsert na tabela de métricas diárias
        const { error: upsertError } = await supabase
          .schema('pulso_analytics')
          .from('metricas_diarias')
          .upsert(
            {
              post_id: post.id,
              data_ref: dataRef,
              plataforma,
              visualizacoes: metricas.visualizacoes || 0,
              likes: metricas.likes || 0,
              comentarios: metricas.comentarios || 0,
              compartilhamentos: metricas.compartilhamentos || 0,
              salvamentos: metricas.salvamentos || 0,
              impressoes: metricas.impressoes || 0,
              alcance: metricas.alcance || 0,
              tempo_medio_visualizacao: metricas.tempo_medio_visualizacao || null,
              taxa_retencao: metricas.taxa_retencao || null,
              novos_seguidores: metricas.novos_seguidores || 0,
              metadata: metricas.metadata || {},
              coletado_em: new Date().toISOString(),
            },
            { onConflict: 'post_id,data_ref' }
          )

        if (upsertError) {
          resultados.push({ post_id: post.id, plataforma, status: 'ERRO', motivo: upsertError.message })
        } else {
          resultados.push({ post_id: post.id, plataforma, status: 'SUCESSO', metricas })
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro desconhecido'
        resultados.push({ post_id: post.id, plataforma, status: 'ERRO', motivo: msg })
      }
    }

    // Atualizar queue se chamado pelo orchestrator
    if (queueId) {
      await supabase
        .schema('pulso_automation')
        .from('automation_queue')
        .update({
          status: 'SUCESSO',
          resultado: {
            total_posts: posts.length,
            coletados: resultados.filter((r) => r.status === 'SUCESSO').length,
            ignorados: resultados.filter((r) => r.status === 'IGNORADO' || r.status === 'MANUAL').length,
            erros: resultados.filter((r) => r.status === 'ERRO').length,
          },
          completed_at: new Date().toISOString(),
        })
        .eq('id', queueId)
    }

    const resumo = {
      success: true,
      total_posts: posts.length,
      coletados: resultados.filter((r) => r.status === 'SUCESSO').length,
      ignorados: resultados.filter((r) => r.status === 'IGNORADO' || r.status === 'MANUAL').length,
      erros: resultados.filter((r) => r.status === 'ERRO').length,
      data_ref: dataRef,
      avisos: avisos.length > 0 ? avisos : undefined,
      resultados,
    }

    return NextResponse.json(resumo)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido'

    // Marcar falha na queue se aplicável
    if (queueId) {
      await supabase
        .schema('pulso_automation')
        .from('automation_queue')
        .update({
          status: 'ERRO',
          erro_ultimo: msg,
          completed_at: new Date().toISOString(),
        })
        .eq('id', queueId)
    }

    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// ====== TIPOS ======

interface MetricasPlataforma {
  visualizacoes: number
  likes: number
  comentarios: number
  compartilhamentos: number
  salvamentos: number
  impressoes: number
  alcance: number
  tempo_medio_visualizacao?: number | null
  taxa_retencao?: number | null
  novos_seguidores: number
  metadata?: Record<string, unknown>
}

interface MetricaResultado {
  post_id: string
  plataforma: string
  status: 'SUCESSO' | 'ERRO' | 'IGNORADO' | 'MANUAL'
  motivo?: string
  metricas?: MetricasPlataforma
}

// ====== COLETORES POR PLATAFORMA ======

/**
 * Coleta métricas do YouTube Data API v3
 * https://developers.google.com/youtube/v3/docs/videos/list
 */
async function coletarYouTube(videoId: string): Promise<MetricasPlataforma | null> {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) return null

  const url = new URL('https://www.googleapis.com/youtube/v3/videos')
  url.searchParams.set('part', 'statistics,contentDetails')
  url.searchParams.set('id', videoId)
  url.searchParams.set('key', apiKey)

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`YouTube API error ${response.status}: ${errorText}`)
  }

  const data = await response.json()
  const video = data.items?.[0]
  if (!video) return null

  const stats = video.statistics || {}

  return {
    visualizacoes: parseInt(stats.viewCount || '0', 10),
    likes: parseInt(stats.likeCount || '0', 10),
    comentarios: parseInt(stats.commentCount || '0', 10),
    compartilhamentos: 0, // YouTube API não expõe shares publicamente
    salvamentos: 0,
    impressoes: 0, // Disponível apenas via YouTube Analytics API (OAuth)
    alcance: 0,
    tempo_medio_visualizacao: null,
    taxa_retencao: null,
    novos_seguidores: 0,
    metadata: {
      fonte: 'youtube_data_api_v3',
      favorite_count: parseInt(stats.favoriteCount || '0', 10),
      duracao: video.contentDetails?.duration || null,
      definicao: video.contentDetails?.definition || null,
    },
  }
}

/**
 * Coleta métricas do TikTok Video Query API
 * https://developers.tiktok.com/doc/research-api-specs-query-videos
 */
async function coletarTikTok(videoId: string): Promise<MetricasPlataforma | null> {
  const apiKey = process.env.TIKTOK_API_KEY
  if (!apiKey) return null

  // TikTok Research API - Video Query
  const response = await fetch('https://open.tiktokapis.com/v2/video/query/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      filters: {
        video_ids: [videoId],
      },
      fields: [
        'id',
        'like_count',
        'comment_count',
        'share_count',
        'view_count',
        'favorite_count',
      ],
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`TikTok API error ${response.status}: ${errorText}`)
  }

  const data = await response.json()
  const video = data.data?.videos?.[0]
  if (!video) return null

  return {
    visualizacoes: video.view_count || 0,
    likes: video.like_count || 0,
    comentarios: video.comment_count || 0,
    compartilhamentos: video.share_count || 0,
    salvamentos: video.favorite_count || 0,
    impressoes: 0,
    alcance: 0,
    tempo_medio_visualizacao: null,
    taxa_retencao: null,
    novos_seguidores: 0,
    metadata: {
      fonte: 'tiktok_research_api_v2',
      video_id: video.id,
    },
  }
}

/**
 * Coleta métricas do Instagram Graph API (Insights)
 * https://developers.facebook.com/docs/instagram-api/reference/ig-media/insights
 */
async function coletarInstagram(mediaId: string): Promise<MetricasPlataforma | null> {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN
  if (!accessToken) return null

  // Buscar métricas básicas do media
  const mediaUrl = new URL(`https://graph.facebook.com/v19.0/${mediaId}`)
  mediaUrl.searchParams.set('fields', 'like_count,comments_count,media_type,timestamp')
  mediaUrl.searchParams.set('access_token', accessToken)

  const mediaResponse = await fetch(mediaUrl.toString(), {
    method: 'GET',
    headers: { Accept: 'application/json' },
  })

  if (!mediaResponse.ok) {
    const errorText = await mediaResponse.text()
    throw new Error(`Instagram API error ${mediaResponse.status}: ${errorText}`)
  }

  const mediaData = await mediaResponse.json()

  // Buscar insights (impressions, reach, saved, shares, video_views)
  const insightsUrl = new URL(`https://graph.facebook.com/v19.0/${mediaId}/insights`)

  // Métricas disponíveis dependem do tipo de mídia
  const metricsForType =
    mediaData.media_type === 'VIDEO'
      ? 'impressions,reach,saved,shares,video_views'
      : 'impressions,reach,saved,shares'

  insightsUrl.searchParams.set('metric', metricsForType)
  insightsUrl.searchParams.set('access_token', accessToken)

  let insightsData: Record<string, number> = {}

  try {
    const insightsResponse = await fetch(insightsUrl.toString(), {
      method: 'GET',
      headers: { Accept: 'application/json' },
    })

    if (insightsResponse.ok) {
      const insights = await insightsResponse.json()
      for (const metric of insights.data || []) {
        insightsData[metric.name] = metric.values?.[0]?.value || 0
      }
    }
    // Se insights falhar (ex: conta pessoal), continua com dados básicos
  } catch {
    // Insights podem não estar disponíveis para todas as contas
  }

  return {
    visualizacoes: insightsData.video_views || 0,
    likes: mediaData.like_count || 0,
    comentarios: mediaData.comments_count || 0,
    compartilhamentos: insightsData.shares || 0,
    salvamentos: insightsData.saved || 0,
    impressoes: insightsData.impressions || 0,
    alcance: insightsData.reach || 0,
    tempo_medio_visualizacao: null,
    taxa_retencao: null,
    novos_seguidores: 0,
    metadata: {
      fonte: 'instagram_graph_api_v19',
      media_type: mediaData.media_type,
      timestamp: mediaData.timestamp,
    },
  }
}
