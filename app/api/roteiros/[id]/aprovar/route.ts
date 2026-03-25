import { NextResponse } from 'next/server'

import { getSupabaseAdminClient } from '@/lib/supabase/server'

/**
 * POST /api/roteiros/[id]/aprovar
 * Aprova um roteiro → trigger no banco enfileira GERAR_AUDIO automaticamente
 */
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

    return NextResponse.json({
      success: true,
      roteiro,
      automation: {
        status: 'enqueued',
        message: 'Geração de áudio enfileirada automaticamente via trigger',
      },
    })
  } catch (error) {
    console.error('Erro ao aprovar roteiro:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 },
    )
  }
}
