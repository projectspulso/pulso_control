import { NextRequest, NextResponse } from 'next/server'

import { guardApi } from '@/lib/auth/api-guard'
import { getSupabaseAdminClient } from '@/lib/supabase/server'

/**
 * POST /api/roteiros/gerar-lote
 * Gera roteiros para IDEIAS APROVADAS que ainda não têm roteiro (opcionalmente de
 * um canal). Reusa o gerador existente (/api/automation/gerar-roteiro) por ideia.
 * Cap pequeno (default 3, máx 5) pra não estourar o timeout serverless.
 * Payload: { canal_id?: string, quantidade?: number }
 */
export async function POST(request: NextRequest) {
  const denied = await guardApi(request)
  if (denied) return denied

  const body = await request.json().catch(() => ({}))
  const canalId: string | undefined = body.canal_id
  const limite = Math.min(Math.max(Number(body.quantidade) || 3, 1), 5)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseAdminClient() as any

  try {
    let q = supabase
      .schema('pulso_content')
      .from('ideias')
      .select('id, canal_id, prioridade')
      .eq('status', 'APROVADA')
    if (canalId) q = q.eq('canal_id', canalId)
    const { data: aprovadas, error: apErr } = await q
    if (apErr) return NextResponse.json({ error: apErr.message }, { status: 500 })

    const { data: rots } = await supabase.schema('pulso_content').from('roteiros').select('ideia_id')
    const comRoteiro = new Set((rots || []).map((r: { ideia_id: string }) => r.ideia_id))

    const elegiveis = (aprovadas || [])
      .filter((i: { id: string }) => !comRoteiro.has(i.id))
      .sort((a: { prioridade?: number }, b: { prioridade?: number }) => (b.prioridade || 0) - (a.prioridade || 0))
    const lote = elegiveis.slice(0, limite)

    const origin = request.nextUrl.origin
    const secret = process.env.CRON_SECRET || ''
    const resultados = []
    for (const i of lote) {
      try {
        const r = await fetch(`${origin}/api/automation/gerar-roteiro`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` },
          body: JSON.stringify({ ideia_id: i.id }),
        })
        const d = await r.json()
        resultados.push({ ideia_id: i.id, ok: r.ok, roteiro_id: d.roteiro_id, hook: d.quality_score, status: d.status, error: d.error })
      } catch (e) {
        resultados.push({ ideia_id: i.id, ok: false, error: e instanceof Error ? e.message : 'erro' })
      }
    }

    return NextResponse.json({
      success: true,
      elegiveis_total: elegiveis.length,
      processados: resultados.filter((r) => r.ok).length,
      falhas: resultados.filter((r) => !r.ok).length,
      resultados,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
