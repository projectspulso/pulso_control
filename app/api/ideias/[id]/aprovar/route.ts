import { NextRequest, NextResponse } from 'next/server'

import { getSupabaseAdminClient } from '@/lib/supabase/server'

/**
 * POST /api/ideias/[id]/aprovar
 * Aprova uma ideia → trigger no banco enfileira GERAR_ROTEIRO automaticamente
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

    const { data: ideia, error: updateError } = await supabase
      .from('ideias')
      .update({ status: 'APROVADA', updated_at: new Date().toISOString() })
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

    return NextResponse.json({
      success: true,
      ideia,
      automation: {
        status: 'enqueued',
        message: 'Geração de roteiro enfileirada automaticamente via trigger',
      },
    })
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
