import { NextRequest, NextResponse } from 'next/server'

import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { refazerHookRoteiro } from '@/lib/automation/refazer-hook'

/**
 * POST /api/roteiros/[id]/refazer-hook
 * Reescreve só a primeira frase (hook) via Gemini seguindo a trava dos 3s,
 * re-pontua e salva como nova versão.
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

    const { data: roteiro, error } = await supabase
      .schema('pulso_content')
      .from('roteiros')
      .select('id, titulo, conteudo_md, nota_hook, versao')
      .eq('id', id)
      .single()

    if (error || !roteiro) {
      return NextResponse.json({ error: 'Roteiro não encontrado' }, { status: 404 })
    }

    const r = await refazerHookRoteiro(supabase, roteiro)
    if (!r.ok) {
      return NextResponse.json({ error: r.erro || 'Falha ao refazer hook', ...r }, { status: 502 })
    }
    return NextResponse.json({ success: true, ...r })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
