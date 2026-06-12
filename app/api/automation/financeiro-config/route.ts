import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/server'

/** GET /api/automation/financeiro-config — travas + saldo Higgsfield (service role; RLS bloqueia o anon). */
export async function GET() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseAdminClient() as any
  const { data, error } = await supabase
    .schema('pulso_core')
    .from('configuracoes')
    .select('chave, valor')
    .in('chave', ['orcamento_travas', 'higgsfield_saldo'])
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const map = new Map((data || []).map((c: { chave: string; valor: string }) => [c.chave, c.valor]))
  return NextResponse.json({
    travas: map.has('orcamento_travas') ? JSON.parse(map.get('orcamento_travas')!) : null,
    saldoHiggsfield: map.has('higgsfield_saldo') ? JSON.parse(map.get('higgsfield_saldo')!) : null,
  })
}
