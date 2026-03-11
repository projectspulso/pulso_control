import { NextRequest, NextResponse } from 'next/server'

import { triggerN8nWorkflow, type WorkflowTriggerKey } from '@/lib/n8n/runtime'

const ALLOWED_WORKFLOWS = new Set<WorkflowTriggerKey>([
  'gerar-ideias',
  'gerar-roteiro',
  'gerar-audio',
  'agendar-publicacao',
  'publicar-agora',
])

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const workflow = body?.workflow
    const payload = body?.payload

    if (typeof workflow !== 'string' || !ALLOWED_WORKFLOWS.has(workflow as WorkflowTriggerKey)) {
      return NextResponse.json(
        { error: 'workflow invalido' },
        { status: 400 },
      )
    }

    const result = await triggerN8nWorkflow(workflow as WorkflowTriggerKey, payload)

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          details: result.details,
          tried_urls: result.tried_urls,
        },
        { status: result.status || 500 },
      )
    }

    return NextResponse.json({
      success: true,
      url: result.url,
      data: result.data,
      tried_urls: result.tried_urls,
    })
  } catch (error) {
    console.error('Erro ao disparar workflow do n8n:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno do servidor',
      },
      { status: 500 },
    )
  }
}
