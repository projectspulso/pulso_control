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

  const map = new Map<string, string>(
    (data || []).map((c: { chave: string; valor: string }) => [c.chave, c.valor] as [string, string])
  )
  const travasRaw = map.get('orcamento_travas')
  const saldoRaw = map.get('higgsfield_saldo')
  return NextResponse.json({
    travas: travasRaw ? JSON.parse(travasRaw) : null,
    saldoHiggsfield: saldoRaw ? JSON.parse(saldoRaw) : null,
  })
}
