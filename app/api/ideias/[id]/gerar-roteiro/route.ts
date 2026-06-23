import { NextRequest, NextResponse } from 'next/server'

import { getSupabaseAdminClient } from '@/lib/supabase/server'

/**
 * POST /api/ideias/[id]/gerar-roteiro
 * Gera o roteiro DIRETO (reusa /api/automation/gerar-roteiro via GPT-4o).
 * Antes só enfileirava na automation_queue, que dependia de um worker sem gatilho
 * (n8n morto) — os jobs nunca rodavam e entupiam a fila. Agora gera na hora.
 * Ideia precisa estar APROVADA.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = getSupabaseAdminClient() as any

    const { data: ideia, error: fetchError } = await supabase
      .from('ideias')
      .select('id, status, titulo, canal_id')
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

    // Gera DIRETO reusando o gerador (GPT-4o + trava de hook + atualiza pipeline)
    const origin = request.nextUrl.origin
    const secret = process.env.CRON_SECRET || ''
    const resp = await fetch(`${origin}/api/automation/gerar-roteiro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` },
      body: JSON.stringify({ ideia_id: id, canal_id: ideia.canal_id }),
    })
    const data = await resp.json().catch(() => ({}))

    if (!resp.ok) {
      return NextResponse.json(
        { error: data.error || 'Erro ao gerar roteiro', details: data },
        { status: resp.status },
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Roteiro gerado',
      ideia: { id: ideia.id, titulo: ideia.titulo },
      roteiro_id: data.roteiro_id,
      status: data.status,
      quality_score: data.quality_score,
      auto_aprovado: data.auto_aprovado,
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
