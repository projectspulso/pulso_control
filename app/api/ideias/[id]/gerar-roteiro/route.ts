import { NextRequest, NextResponse } from 'next/server'

import { triggerN8nWorkflow } from '@/lib/n8n/runtime'
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
  const result = await triggerN8nWorkflow('gerar-roteiro', {
    ideia_id: ideiaId,
    trigger: 'manual-gerar-roteiro',
    timestamp: new Date().toISOString(),
  })

  if (!result.success) {
    return NextResponse.json(
      {
        success: false,
        error: result.error || `Webhook retornou ${result.status}`,
        details: result.details,
        tried_urls: result.tried_urls,
      },
      { status: result.status || 500 },
    )
  }

  return NextResponse.json({
    success: true,
    workflow: {
      status: 'triggered',
      data: result.data,
      url: result.url,
      tried_urls: result.tried_urls,
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
