import { NextRequest, NextResponse } from 'next/server'
import { guardApi } from '@/lib/auth/api-guard'
import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { gerarCenas } from '@/lib/automation/gerar-cenas'

/**
 * POST /api/automation/gerar-cenas — o CÉREBRO do worker de render.
 * Lê o roteiro e escreve o roteiro VISUAL (~10 cenas de b-roll + BASE) com as travas
 * (sem pessoas/crianças, soccer-não-football, sem texto, s10_cta). Persiste em
 * pipeline_producao.metadata.cenas; o worker local só consome.
 * Payload: { ideia_id } ou { roteiro_id }
 */
export async function POST(request: NextRequest) {
  const denied = await guardApi(request)
  if (denied) return denied

  const payload = await request.json().catch(() => ({}))
  const { ideia_id, roteiro_id } = payload
  if (!ideia_id && !roteiro_id) {
    return NextResponse.json({ error: 'ideia_id ou roteiro_id é obrigatório' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseAdminClient() as any
  try {
    const result = await gerarCenas(supabase, { ideia_id, roteiro_id })
    return NextResponse.json({ success: true, ...result })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido'
    const status = /não encontrado/i.test(msg) ? 404 : /trava|JSON/i.test(msg) ? 422 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}
