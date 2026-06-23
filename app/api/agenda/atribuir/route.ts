import { NextRequest, NextResponse } from 'next/server'

import { guardApi } from '@/lib/auth/api-guard'
import { getSupabaseAdminClient } from '@/lib/supabase/server'

/**
 * POST /api/agenda/atribuir
 * Encaixa/troca manualmente o conteúdo de um slot (data+horario). Marca fixado=true
 * pra o auto-popular não sobrescrever. ideia_id null = limpar o slot.
 * Payload: { data, horario, canal_id, ideia_id?, estagio? }
 */
export async function POST(request: NextRequest) {
  const denied = await guardApi(request)
  if (denied) return denied

  const body = await request.json().catch(() => ({}))
  const { data, horario, canal_id } = body
  if (!data || !horario) {
    return NextResponse.json({ error: 'data e horario são obrigatórios' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseAdminClient() as any
  try {
    const row = {
      data,
      horario,
      canal_id: canal_id || null,
      ideia_id: body.ideia_id || null,
      estagio: body.estagio || (body.ideia_id ? 'roteiro' : 'vazio'),
      status: 'planejado',
      fixado: true,
      updated_at: new Date().toISOString(),
    }
    const { error } = await supabase
      .schema('pulso_content')
      .from('agenda_atribuicoes')
      .upsert(row, { onConflict: 'data,horario' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
