import { NextResponse } from 'next/server'

import { listN8nWorkflows } from '@/lib/n8n/runtime'

export async function GET() {
  try {
    const workflows = await listN8nWorkflows()
    return NextResponse.json(workflows)
  } catch (error) {
    console.error('Erro ao listar workflows do n8n:', error)
    return NextResponse.json([], { status: 200 })
  }
}
