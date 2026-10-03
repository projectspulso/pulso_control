import { NextRequest, NextResponse } from 'next/server'
import { guardApi } from '@/lib/auth/api-guard'
import { getSupabaseAdminClient } from '@/lib/supabase/server'

/** POST /api/stories/marcar { id, status: 'feito' | 'pulado' | 'pendente' } — o dono marca o story manual (TikTok/Kwai). */
export async function POST(request: NextRequest) {
  const denied = await guardApi(request)
  if (denied) return denied
  const { id, status } = await request.json().catch(() => ({}))
  if (!id || !['feito', 'pulado', 'pendente'].includes(status)) {
    return NextResponse.json({ error: 'id e status (feito|pulado|pendente) obrigatórios' }, { status: 400 })
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseAdminClient() as any
  const { error } = await supabase.schema('pulso_content').from('stories')
    .update({ status, publicado_em: status === 'feito' ? new Date().toISOString() : null })
    .eq('id', id).eq('modo', 'manual')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
