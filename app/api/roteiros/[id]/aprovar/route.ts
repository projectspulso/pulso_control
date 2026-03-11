import { NextResponse } from 'next/server'

import { triggerN8nWorkflow } from '@/lib/n8n/runtime'
import { getSupabaseAdminClient } from '@/lib/supabase/server'

async function triggerRoteiroWebhook(roteiroId: string) {
  const result = await triggerN8nWorkflow('gerar-audio', {
    roteiro_id: roteiroId,
    timestamp: new Date().toISOString(),
  })

  if (
    !result.success &&
    result.status === 500 &&
    typeof result.error === 'string' &&
    result.error.includes('nao configurado')
  ) {
    return {
      status: 'skipped',
      message: 'Roteiro aprovado, mas webhook WF02 nao configurado',
    }
  }

  if (!result.success) {
    return {
      status: 'error',
      message: 'Roteiro aprovado, mas webhook WF02 falhou',
      details: result.details,
      tried_urls: result.tried_urls,
    }
  }

  return {
    status: 'triggered',
    data: result.data,
    url: result.url,
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
