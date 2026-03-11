import { NextRequest, NextResponse } from 'next/server'

import { listN8nExecutions } from '@/lib/n8n/runtime'

export async function GET(request: NextRequest) {
  const workflowId = request.nextUrl.searchParams.get('workflowId') || ''
  const limitParam = Number(request.nextUrl.searchParams.get('limit') || '20')
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? limitParam : 20

  try {
    const executions = await listN8nExecutions(workflowId, limit)
    return NextResponse.json(executions)
  } catch (error) {
    console.error('Erro ao listar execucoes do n8n:', error)
    return NextResponse.json([], { status: 200 })
  }
}
