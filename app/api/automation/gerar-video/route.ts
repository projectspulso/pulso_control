import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { buildSubtitles, selectPose, selectBackground } from '@/lib/video/subtitles'
import type { MascotePose, Background } from '@/remotion/PulsoVideo'

/**
 * POST /api/automation/gerar-video
 *
 * Enfileira a geração de um vídeo Remotion (1080×1920 9:16).
 * Pode ser chamado diretamente da UI ou pelo orchestrator via GERAR_VIDEO.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      titulo,
      roteiro,
      duracao_segundos = 45,
      pose,
      background,
      audio_url,
      roteiro_id,
      canal_id,
    }: {
      titulo: string
      roteiro: string
      duracao_segundos?: number
      pose?: MascotePose
      background?: Background
      audio_url?: string
      roteiro_id?: string
      canal_id?: string
    } = body

    if (!titulo || !roteiro) {
      return NextResponse.json({ error: 'titulo e roteiro são obrigatórios' }, { status: 400 })
    }

    const finalPose: MascotePose = pose ?? selectPose(titulo)
    const finalBackground: Background = background ?? selectBackground(titulo)
    const subtitles = buildSubtitles(roteiro, duracao_segundos)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = getSupabaseAdminClient() as any

    // Inserir na fila de automação
    const { data: queueItem, error: queueError } = await supabase
      .schema('pulso_automation')
      .from('automation_queue')
      .insert({
        tipo: 'GERAR_VIDEO',
        status: 'PENDENTE',
        payload: {
          titulo,
          roteiro,
          duracao_segundos,
          pose: finalPose,
          background: finalBackground,
          subtitles,
          audio_url,
          roteiro_id,
          canal_id,
        },
        scheduled_at: new Date().toISOString(),
        max_tentativas: 2,
      })
      .select()
      .single()

    if (queueError) {
      console.error('Erro ao enfileirar GERAR_VIDEO:', queueError)
      return NextResponse.json({ error: queueError.message }, { status: 500 })
    }

    return NextResponse.json({
      job_id: queueItem.id,
      message: 'Vídeo enfileirado para geração',
      preview_props: {
        titulo,
        subtitles,
        pose: finalPose,
        background: finalBackground,
        audioUrl: audio_url,
        showLogo: true,
      },
    })
  } catch (err) {
    console.error('Erro em gerar-video:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
}
