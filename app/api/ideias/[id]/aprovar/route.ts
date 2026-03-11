import { NextRequest, NextResponse } from 'next/server'

import { getSupabaseAdminClient } from '@/lib/supabase/server'

async function triggerIdeiaWebhook(ideiaId: string) {
  const webhookUrl = process.env.N8N_WEBHOOK_APROVAR_IDEIA

  if (!webhookUrl) {
    return {
      statusCode: 200,
      body: {
        status: 'skipped',
        message: 'Webhook nao configurado',
      },
    }
  }

  const webhookResponse = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-secret': process.env.WEBHOOK_SECRET ?? '',
    },
    body: JSON.stringify({
      ideia_id: ideiaId,
      trigger: 'app-aprovacao',
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
      statusCode: 207,
      body: {
        status: 'error',
        message: `Webhook retornou ${webhookResponse.status}`,
        details: parsedBody,
      },
    }
  }

  return {
    statusCode: 200,
    body: {
      status: 'triggered',
      message: 'Roteiro sendo gerado',
      data: parsedBody,
    },
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  void request

  try {
    const { id } = await params
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = getSupabaseAdminClient() as any

    const { data: ideia, error: updateError } = await supabase
      .from('ideias')
      .update({ status: 'APROVADA' })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Erro ao aprovar ideia:', updateError)
      return NextResponse.json(
        { error: 'Erro ao aprovar ideia', details: updateError.message },
        { status: 500 },
      )
    }

    try {
      const workflow = await triggerIdeiaWebhook(id)

      return NextResponse.json(
        {
          success: true,
          ideia,
          workflow: workflow.body,
        },
        { status: workflow.statusCode },
      )
    } catch (webhookError) {
      console.error('Erro ao chamar webhook da ideia:', webhookError)

      return NextResponse.json(
        {
          success: true,
          ideia,
          workflow: {
            status: 'error',
            message: 'Nao foi possivel disparar geracao de roteiro',
            error:
              webhookError instanceof Error
                ? webhookError.message
                : 'Erro desconhecido',
          },
        },
        { status: 207 },
      )
    }
  } catch (error) {
    console.error('Erro geral ao aprovar ideia:', error)
    return NextResponse.json(
      {
        error: 'Erro ao processar aprovacao',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 },
    )
  }
}
