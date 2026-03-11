import { NextRequest, NextResponse } from 'next/server'

import { getSupabaseAdminClient } from '@/lib/supabase/server'

function getRoteiroIdFromWorkflowData(workflowData: unknown) {
  if (typeof workflowData !== 'object' || workflowData === null) {
    return undefined
  }

  if (!('data' in workflowData)) {
    return undefined
  }

  const firstDataLevel = workflowData.data
  if (typeof firstDataLevel !== 'object' || firstDataLevel === null) {
    return undefined
  }

  if (!('roteiro' in firstDataLevel)) {
    return undefined
  }

  const roteiro = firstDataLevel.roteiro
  if (typeof roteiro !== 'object' || roteiro === null || !('id' in roteiro)) {
    return undefined
  }

  return roteiro.id
}

async function triggerRoteiroWorkflow(ideiaId: string) {
  const webhookUrl = process.env.N8N_WEBHOOK_APROVAR_IDEIA

  if (!webhookUrl) {
    return NextResponse.json(
      {
        success: false,
        error: 'Webhook WF01 nao configurado',
      },
      { status: 500 },
    )
  }

  const webhookResponse = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-secret': process.env.WEBHOOK_SECRET ?? '',
    },
    body: JSON.stringify({
      ideia_id: ideiaId,
      trigger: 'manual-gerar-roteiro',
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
    return NextResponse.json(
      {
        success: false,
        error: `Webhook retornou ${webhookResponse.status}`,
        details: parsedBody,
      },
      { status: 500 },
    )
  }

  return NextResponse.json({
    success: true,
    workflow: {
      status: 'triggered',
      data: parsedBody,
    },
  })
}

/**
 * POST /api/ideias/[id]/gerar-roteiro
 * Dispara o workflow WF01 para gerar roteiro sem alterar status da ideia.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  void request

  try {
    const { id } = await params
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = getSupabaseAdminClient() as any

    const { data: ideia, error: fetchError } = await supabase
      .from('ideias')
      .select('id, status, titulo')
      .eq('id', id)
      .single()

    if (fetchError || !ideia) {
      return NextResponse.json(
        { error: 'Ideia nao encontrada' },
        { status: 404 },
      )
    }

    if (ideia.status !== 'APROVADA') {
      return NextResponse.json(
        { error: 'Ideia precisa estar aprovada antes de gerar roteiro' },
        { status: 400 },
      )
    }

    const { data: roteiros } = await supabase
      .from('roteiros')
      .select('id')
      .eq('ideia_id', id)
      .limit(1)

    if (roteiros && roteiros.length > 0) {
      return NextResponse.json(
        {
          error: 'Ja existe um roteiro para esta ideia',
          roteiro_id: roteiros[0].id,
        },
        { status: 400 },
      )
    }

    const workflowResponse = await triggerRoteiroWorkflow(id)
    const workflowPayload = await workflowResponse.json()

    if (!workflowResponse.ok) {
      return NextResponse.json(workflowPayload, { status: workflowResponse.status })
    }

    return NextResponse.json({
      success: true,
      message: 'Roteiro sendo gerado',
      ideia: {
        id: ideia.id,
        titulo: ideia.titulo,
      },
      workflow: workflowPayload.workflow,
      roteiro_id: getRoteiroIdFromWorkflowData(workflowPayload.workflow?.data),
    })
  } catch (error) {
    console.error('Erro geral ao processar geracao de roteiro:', error)
    return NextResponse.json(
      {
        error: 'Erro ao processar geracao de roteiro',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 },
    )
  }
}
