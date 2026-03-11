import { NextResponse } from 'next/server'

import { getSupabaseAdminClient } from '@/lib/supabase/server'

async function triggerRoteiroWebhook(roteiroId: string) {
  const webhookUrl = process.env.N8N_WEBHOOK_APROVAR_ROTEIRO

  if (!webhookUrl) {
    return {
      status: 'skipped',
      message: 'Roteiro aprovado, mas webhook WF02 nao configurado',
    }
  }

  const webhookResponse = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(process.env.WEBHOOK_SECRET
        ? { 'X-Webhook-Secret': process.env.WEBHOOK_SECRET }
        : {}),
    },
    body: JSON.stringify({
      roteiro_id: roteiroId,
      timestamp: new Date().toISOString(),
    }),
  })

  const rawBody = await webhookResponse.text()
  let parsedBody: unknown = null

  if (rawBody) {
    try {
      parsedBody = JSON.parse(rawBody)
    } catch {
      parsedBody = rawBody
    }
  }

  if (!webhookResponse.ok) {
    return {
      status: 'error',
      message: 'Roteiro aprovado, mas webhook WF02 falhou',
      details: parsedBody,
    }
  }

  return {
    status: 'triggered',
    data: parsedBody,
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  void request

  try {
    const { id } = await params
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = getSupabaseAdminClient() as any

    const { data: roteiro, error: updateError } = await supabase
      .from('roteiros')
      .update({
        status: 'APROVADO',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Erro ao atualizar roteiro:', updateError)
      return NextResponse.json(
        { error: 'Erro ao atualizar status do roteiro' },
        { status: 500 },
      )
    }

    try {
      const webhook = await triggerRoteiroWebhook(id)

      return NextResponse.json({
        success: true,
        roteiro,
        webhook,
      })
    } catch (webhookError) {
      console.error('Erro ao chamar webhook WF02:', webhookError)
      return NextResponse.json({
        success: true,
        roteiro,
        warning: 'Roteiro aprovado, mas webhook WF02 com erro',
      })
    }
  } catch (error) {
    console.error('Erro ao aprovar roteiro:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 },
    )
  }
}
