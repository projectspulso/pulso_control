import { NextRequest, NextResponse } from 'next/server'

import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { refazerHookRoteiro } from '@/lib/automation/refazer-hook'

/**
 * POST /api/roteiros/refazer-hooks-fracos
 * Refaz o hook de TODOS os roteiros com nota_hook <= 2 (lote). Sequencial p/ não
 * estourar rate limit do Gemini.
 */
export async function POST(request: NextRequest) {
  void request
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = getSupabaseAdminClient() as any

    const { data: fracos, error } = await supabase
      .schema('pulso_content')
      .from('roteiros')
      .select('id, titulo, conteudo_md, nota_hook, versao')
      .lte('nota_hook', 2)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const lista = (fracos || []) as Parameters<typeof refazerHookRoteiro>[1][]
    const resultados = []
    for (const roteiro of lista) {
      resultados.push(await refazerHookRoteiro(supabase, roteiro))
    }

    const melhorados = resultados.filter((r) => r.ok && r.depois > r.antes).length
    return NextResponse.json({
      success: true,
      total: lista.length,
      processados: resultados.filter((r) => r.ok).length,
      melhorados,
      falhas: resultados.filter((r) => !r.ok).length,
      resultados,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
