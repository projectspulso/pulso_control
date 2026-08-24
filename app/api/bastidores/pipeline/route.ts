import { NextRequest, NextResponse } from 'next/server'
import { guardApi } from '@/lib/auth/api-guard'
import { getSupabaseAdminClient } from '@/lib/supabase/server'

/** GET /api/bastidores/pipeline?ideia_id=… — resolve o pipeline_id do episódio promovido
 *  (a Central precisa dele para chamar /api/automation/publicar). */
export async function GET(request: NextRequest) {
  const denied = await guardApi(request)
  if (denied) return denied
  const ideiaId = request.nextUrl.searchParams.get('ideia_id')
  if (!ideiaId) return NextResponse.json({ error: 'ideia_id é obrigatório' }, { status: 400 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseAdminClient() as any
  const { data, error } = await supabase
    .schema('pulso_content').from('pipeline_producao')
    .select('id').eq('ideia_id', ideiaId).maybeSingle()
  if (error || !data) return NextResponse.json({ error: 'pipeline não encontrado para a ideia' }, { status: 404 })
  return NextResponse.json({ pipeline_id: data.id })
}
