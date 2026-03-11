import { NextRequest, NextResponse } from 'next/server'

import { getSupabaseAdminClient } from '@/lib/supabase/server'

interface WorkflowCompletedPayload {
  workflow_name?: string
  status?: string
  data?: unknown
}

function getWorkflowErrorMessage(data: unknown) {
  if (typeof data === 'object' && data !== null && 'erro' in data) {
    const errorMessage = data.erro
    if (typeof errorMessage === 'string' && errorMessage.trim().length > 0) {
      return errorMessage
    }
  }

  return 'Erro desconhecido'
}

export async function POST(request: NextRequest) {
  const expectedSecret = process.env.WEBHOOK_SECRET

  if (!expectedSecret) {
    return NextResponse.json(
      { error: 'WEBHOOK_SECRET nao configurado no servidor' },
      { status: 500 },
    )
  }

  const secret = request.headers.get('x-webhook-secret')
  if (secret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let payload: WorkflowCompletedPayload

  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Payload JSON invalido' }, { status: 400 })
  }

  if (!payload.workflow_name || !payload.status) {
    return NextResponse.json(
      { error: 'workflow_name e status sao obrigatorios' },
      { status: 400 },
    )
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = getSupabaseAdminClient() as any
    const { error } = await supabase
      .schema('pulso_content')
      .from('logs_workflows')
      .insert({
      workflow_name: payload.workflow_name,
      status: payload.status,
      detalhes: payload.data ?? null,
      erro_mensagem:
        payload.status === 'erro'
          ? getWorkflowErrorMessage(payload.data)
          : null,
    })

    if (error) {
      console.error('Erro ao registrar log de workflow:', error)
      return NextResponse.json(
        { error: 'Nao foi possivel registrar o log do workflow' },
        { status: 500 },
      )
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Erro ao processar webhook de workflow:', error)
    return NextResponse.json(
      { error: 'Erro interno ao processar webhook' },
      { status: 500 },
    )
  }
}
