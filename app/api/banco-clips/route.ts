import { NextResponse } from 'next/server'

import { getSupabaseAdminClient } from '@/lib/supabase/server'

// Serve stats + catálogo do banco de clips lendo pulso_core.configuracoes com SERVICE ROLE
// (server-side). O navegador não lê configuracoes direto: RLS esconde (guarda tokens).
export const dynamic = 'force-dynamic'

function parse(v?: string | null) {
  try {
    return v ? JSON.parse(v) : null
  } catch {
    return null
  }
}

export async function GET() {
  try {
    const sb = getSupabaseAdminClient()
    const { data } = await sb
      .schema('pulso_core')
      .from('configuracoes')
      .select('chave, valor')
      .in('chave', ['banco_clips_stats', 'banco_clips_catalogo'])
    const byKey = new Map((data || []).map((r) => [r.chave as string, r.valor as string]))
    return NextResponse.json({
      stats: parse(byKey.get('banco_clips_stats')),
      catalogo: parse(byKey.get('banco_clips_catalogo')) || [],
    })
  } catch {
    return NextResponse.json({ stats: null, catalogo: [] })
  }
}
