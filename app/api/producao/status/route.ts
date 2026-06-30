import { NextRequest, NextResponse } from 'next/server'
import { guardApi } from '@/lib/auth/api-guard'
import { getSupabaseAdminClient } from '@/lib/supabase/server'

/**
 * POST /api/producao/status
 * Atualiza o status (e opcionalmente a data prevista) de um item do pipeline.
 * Via service role server-side — a escrita client-side authenticated na tabela
 * pulso_content.pipeline_producao dá 400 (grant/schema), então o kanban posta aqui.
 * Payload: { id: string, status?: string, data_prevista?: string }
 */
export async function POST(request: NextRequest) {
  const denied = await guardApi(request)
  if (denied) return denied

  const { id, ideia_id, status, data_prevista } = await request.json()
  if (!id && !ideia_id) return NextResponse.json({ error: 'id ou ideia_id é obrigatório' }, { status: 400 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const patch: Record<string, any> = { updated_at: new Date().toISOString() }
  if (status) patch.status = status
  if (data_prevista) patch.data_prevista = data_prevista

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseAdminClient() as any
  const q = supabase.schema('pulso_content').from('pipeline_producao').update(patch)
  const { data, error } = await (id ? q.eq('id', id) : q.eq('ideia_id', ideia_id)).select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true, itens: data })
}
