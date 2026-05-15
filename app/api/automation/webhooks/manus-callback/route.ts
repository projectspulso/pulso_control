import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/server'

/**
 * POST /api/automation/webhooks/manus-callback
 *
 * Callback do Manus após publicação via browser.
 * Manus chama esta URL com o resultado da publicação.
 *
 * Payload esperado:
 * {
 *   success: boolean,
 *   plataforma: string,
 *   post_url: string,        // URL do post publicado
 *   post_id_externo: string,  // ID do post na plataforma
 *   metadata: { pipeline_id, roteiro_id, canal_id },
 *   error?: string
 * }
 */
export async function POST(request: NextRequest) {
  const payload = await request.json()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseAdminClient() as any

  try {
    const {
      success,
      plataforma,
      post_url,
      post_id_externo,
      metadata,
      error: publishError,
    } = payload

    if (success && metadata?.pipeline_id) {
      // Registrar post publicado
      await supabase
        .schema('pulso_distribution')
        .from('posts')
        .insert({
          pipeline_id: metadata.pipeline_id,
          plataforma,
          url_post: post_url,
          post_id_externo,
          status: 'PUBLICADO',
          publicado_em: new Date().toISOString(),
          publicado_via: 'manus',
          metadata: payload,
        })

      // Atualizar automation_queue se existir referência
      if (metadata.queue_id) {
        await supabase
          .schema('pulso_automation')
          .from('automation_queue')
          .update({
            status: 'SUCESSO',
            resultado: payload,
            completed_at: new Date().toISOString(),
          })
          .eq('id', metadata.queue_id)
      }
    } else {
      // Registrar falha
      if (metadata?.queue_id) {
        await supabase
          .schema('pulso_automation')
          .from('automation_queue')
          .update({
            status: 'ERRO',
            erro_ultimo: publishError || 'Manus reportou falha',
            completed_at: new Date().toISOString(),
          })
          .eq('id', metadata.queue_id)
      }
    }

    // Log da publicação
    await supabase.from('logs_workflows').insert({
      workflow_name: `publicar_${plataforma}`,
      status: success ? 'sucesso' : 'erro',
      detalhes: payload,
      erro_mensagem: success ? null : (publishError || 'Falha na publicação'),
    })

    return NextResponse.json({ received: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
