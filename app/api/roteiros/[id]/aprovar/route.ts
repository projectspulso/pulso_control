import { NextResponse } from 'next/server'

import { getSupabaseAdminClient } from '@/lib/supabase/server'

/**
 * POST /api/roteiros/[id]/aprovar
 * Aprova um roteiro E dispara a geração de áudio na hora.
 *
 * (Antes confiava num trigger do banco que enfileirava GERAR_AUDIO pro orchestrator
 * — mas o processador da fila está parado (n8n), então o áudio nunca saía. Agora a
 * própria aprovação chama gerar-audio direto: áudio → cenas → AUDIO_GERADO → o worker
 * local renderiza. A aprovação é o gate humano = a intenção de produzir.)
 */
export const maxDuration = 60

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = getSupabaseAdminClient() as any

    const { data: roteiro, error: updateError } = await supabase
      .from('roteiros')
      .update({ status: 'APROVADO', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Erro ao atualizar roteiro:', updateError)
      return NextResponse.json({ error: 'Erro ao atualizar status do roteiro' }, { status: 500 })
    }

    // dispara o áudio na hora (gerar-audio também aciona as cenas best-effort e
    // seta o pipeline pra AUDIO_GERADO → o card anda no kanban)
    let automation: { status: string; message: string } = { status: 'falhou', message: '' }
    try {
      const origin = new URL(request.url).origin
      const r = await fetch(`${origin}/api/automation/gerar-audio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-webhook-secret': process.env.WEBHOOK_SECRET || '' },
        body: JSON.stringify({ roteiro_id: id }),
      })
      automation = r.ok
        ? { status: 'gerando', message: 'Áudio em geração — o card vai pra "Renderizar".' }
        : { status: 'falhou', message: `gerar-audio retornou ${r.status} (o cron auto-audio reprocessa)` }
    } catch (e) {
      automation = { status: 'falhou', message: e instanceof Error ? e.message : 'erro ao acionar áudio' }
    }

    return NextResponse.json({ success: true, roteiro, automation })
  } catch (error) {
    console.error('Erro ao aprovar roteiro:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
