import { NextRequest, NextResponse } from 'next/server'

import { getSupabaseAdminClient } from '@/lib/supabase/server'

/**
 * PATCH /api/ideias/[id]/status
 * Atualiza apenas o status da ideia, sem disparar workflow.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const { status } = await request.json()

    if (!status) {
      return NextResponse.json(
        { error: 'Status e obrigatorio' },
        { status: 400 },
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = getSupabaseAdminClient() as any
    const { data: ideia, error: updateError } = await supabase
      .from('ideias')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Erro ao atualizar status da ideia:', updateError)
      return NextResponse.json(
        { error: 'Erro ao atualizar status', details: updateError.message },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      ideia,
    })
  } catch (error) {
    console.error('Erro ao processar atualizacao de status:', error)
    return NextResponse.json(
      {
        error: 'Erro ao processar atualizacao',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 },
    )
  }
}
