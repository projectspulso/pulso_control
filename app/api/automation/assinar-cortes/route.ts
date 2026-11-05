import { NextRequest, NextResponse } from 'next/server'
import { guardApi } from '@/lib/auth/api-guard'
import { getSupabaseAdminClient } from '@/lib/supabase/server'

/**
 * Renova os links assinados dos cortes que o digiai_mkt baixa (contrato 085). O vídeo fica no bucket
 * privado (rosto do dono); cada link vale 7 dias e é renovado quando faltam 2. Roda 1x/dia pelo pg_cron
 * e registra TODA rodada, inclusive quando não há nada a renovar (regra: cron nunca falha em silêncio).
 */
export const maxDuration = 60

const SETE_DIAS = 7 * 86400

export async function POST(request: NextRequest) {
  const denied = await guardApi(request)
  if (denied) return denied
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseAdminClient() as any
  const limite = new Date(Date.now() + 2 * 864e5).toISOString()

  const { data: linhas, error } = await supabase.schema('pulso_content').from('corte_publicacoes')
    .select('id, video, url_expira')
    .eq('modo', 'job').in('status', ['planejado', 'agendado']).not('video', 'is', null)
    .or(`url_expira.is.null,url_expira.lt.${limite}`)
  if (error) return registra(supabase, 'erro', { erro: error.message }, 500)

  let renovados = 0
  const falhas: string[] = []
  for (const l of linhas || []) {
    const { data: s, error: e } = await supabase.storage.from('bastidores').createSignedUrl(l.video, SETE_DIAS)
    if (e || !s?.signedUrl) { falhas.push(`${l.id}: ${e?.message || 'sem link'}`); continue }
    const { error: u } = await supabase.schema('pulso_content').from('corte_publicacoes')
      .update({ video_url_assinada: s.signedUrl, url_expira: new Date(Date.now() + SETE_DIAS * 1000).toISOString(), atualizado_em: new Date().toISOString() })
      .eq('id', l.id)
    if (u) falhas.push(`${l.id}: ${u.message}`)
    else renovados += 1
  }
  return registra(supabase, falhas.length ? 'parcial' : 'sucesso', { candidatos: linhas?.length || 0, renovados, falhas }, 200)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function registra(supabase: any, status: string, detalhes: Record<string, unknown>, http: number) {
  await supabase.schema('pulso_content').from('logs_workflows').insert({ workflow_name: 'ASSINAR_CORTES', status, detalhes })
  return NextResponse.json({ status, ...detalhes }, { status: http })
}
