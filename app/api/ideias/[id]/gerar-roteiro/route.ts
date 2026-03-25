import { NextRequest, NextResponse } from 'next/server'

import { getSupabaseAdminClient } from '@/lib/supabase/server'

/**
 * POST /api/ideias/[id]/gerar-roteiro
 * Enfileira geração de roteiro manualmente (sem alterar status da ideia).
 * Ideia precisa estar APROVADA.
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

    // Enfileira na automation_queue
    const { error: queueError } = await supabase
      .schema('pulso_automation')
      .from('automation_queue')
      .insert({
        tipo: 'GERAR_ROTEIRO',
        payload: { ideia_id: id, canal_id: ideia.canal_id },
        referencia_id: id,
        referencia_tipo: 'ideia',
        origem: 'manual',
      })

    if (queueError) {
      console.error('Erro ao enfileirar geração de roteiro:', queueError)
      return NextResponse.json(
        { error: 'Erro ao enfileirar geração de roteiro', details: queueError.message },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Geração de roteiro enfileirada',
      ideia: {
        id: ideia.id,
        titulo: ideia.titulo,
      },
      automation: {
        status: 'enqueued',
        message: 'Geração de roteiro enfileirada na automation_queue',
      },
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
