import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { callOpenAI } from '@/lib/automation/ai-clients'
import { buildPromptMetadataPlataforma } from '@/lib/automation/prompts'

/**
 * POST /api/automation/publicar
 *
 * Prepara e publica conteúdo nas plataformas.
 * Para plataformas com API: publica diretamente.
 * Para plataformas sem API: dispara Manus (browser automation).
 *
 * Payload: { pipeline_ids?: string[], plataformas?: string[] }
 */
export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-webhook-secret')
  if (secret && secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseAdminClient() as any
  const payload = await request.json()

  try {
    // Buscar conteúdos prontos para publicação
    const { data: pipeline, error: pipeError } = await supabase
      .schema('pulso_content')
      .from('pipeline_producao')
      .select('*')
      .in('status', ['PRONTO_PARA_PUBLICACAO', 'PRONTO'])
      .limit(10)

    if (pipeError || !pipeline?.length) {
      return NextResponse.json({
        success: true,
        message: 'Nenhum conteúdo pronto para publicação',
        publicados: 0,
      })
    }

    const resultados = []

    for (const item of pipeline) {
      // Buscar dados completos (roteiro + canal + áudio)
      const { data: roteiro } = await supabase
        .schema('pulso_content')
        .from('roteiros')
        .select('id, titulo, conteudo_md, canal_id')
        .eq('id', item.roteiro_id)
        .single()

      if (!roteiro) continue

      const { data: canal } = await supabase
        .from('vw_pulso_canais')
        .select('id, nome, descricao, idioma, slug')
        .eq('id', roteiro.canal_id)
        .single()

      if (!canal) continue

      // Buscar áudio associado
      const { data: audio } = await supabase
        .schema('pulso_content')
        .from('audios')
        .select('url_publica, storage_path')
        .eq('roteiro_id', roteiro.id)
        .single()

      // Plataformas alvo
      const plataformas = payload.plataformas || [
        'youtube_shorts',
        'tiktok',
        'instagram_reels',
        'kwai',
      ]

      for (const plataforma of plataformas) {
        try {
          // Gerar metadados otimizados para a plataforma via GPT
          const metadataPrompt = buildPromptMetadataPlataforma(
            plataforma,
            roteiro.titulo,
            roteiro.conteudo_md.substring(0, 200),
            canal
          )

          const { content: metadataRaw } = await callOpenAI(metadataPrompt, {
            temperature: 0.6,
            json_mode: true,
          })

          let metadata
          try {
            metadata = JSON.parse(metadataRaw)
          } catch {
            metadata = { titulo: roteiro.titulo, descricao: roteiro.conteudo_md.substring(0, 150) }
          }

          // Decidir método de publicação
          const temAPI = ['youtube_shorts'].includes(plataforma)
          const usarManus = ['kwai', 'facebook_reels'].includes(plataforma) || !temAPI

          if (usarManus) {
            // Disparar Manus para publicação via browser
            const manusResult = await dispararManus({
              plataforma,
              video_url: audio?.url_publica || '',
              titulo: metadata.titulo || roteiro.titulo,
              descricao: metadata.descricao || metadata.caption || '',
              hashtags: metadata.hashtags || metadata.tags || [],
              canal_slug: canal.slug,
              callback_url: `${new URL(request.url).origin}/api/automation/webhooks/manus-callback`,
              metadata: {
                pipeline_id: item.id,
                roteiro_id: roteiro.id,
                canal_id: canal.id,
              },
            })

            resultados.push({
              pipeline_id: item.id,
              plataforma,
              metodo: 'manus',
              status: manusResult.success ? 'ENVIADO' : 'ERRO',
              detalhes: manusResult,
            })
          } else {
            // TODO: Publicação via API direta (YouTube, TikTok, Instagram)
            // Por enquanto, registra como pendente para publicação manual
            resultados.push({
              pipeline_id: item.id,
              plataforma,
              metodo: 'api_pendente',
              status: 'PREPARADO',
              metadata,
              detalhes: 'API de publicação direta ainda não implementada. Metadados preparados.',
            })
          }
        } catch (platErr) {
          resultados.push({
            pipeline_id: item.id,
            plataforma,
            status: 'ERRO',
            error: platErr instanceof Error ? platErr.message : 'Erro desconhecido',
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      publicados: resultados.filter((r) => r.status !== 'ERRO').length,
      erros: resultados.filter((r) => r.status === 'ERRO').length,
      resultados,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// ====== INTEGRAÇÃO MANUS ======

interface ManusPayload {
  plataforma: string
  video_url: string
  titulo: string
  descricao: string
  hashtags: string[]
  canal_slug: string
  callback_url: string
  metadata: Record<string, string>
}

async function dispararManus(payload: ManusPayload) {
  const manusUrl = process.env.MANUS_WEBHOOK_URL
  const manusKey = process.env.MANUS_API_KEY

  if (!manusUrl) {
    return {
      success: false,
      error: 'MANUS_WEBHOOK_URL não configurado',
      fallback: 'Publicação manual necessária',
    }
  }

  try {
    const response = await fetch(manusUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(manusKey ? { Authorization: `Bearer ${manusKey}` } : {}),
      },
      body: JSON.stringify({
        task: 'publicar',
        ...payload,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      return { success: false, error: `Manus retornou ${response.status}: ${error}` }
    }

    return { success: true, data: await response.json() }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Falha ao chamar Manus',
    }
  }
}
