import { NextRequest, NextResponse } from 'next/server'
import { guardApi } from '@/lib/auth/api-guard'
import { getSupabaseAdminClient } from '@/lib/supabase/server'

/**
 * POST /api/bastidores/promover — a PONTE única entre a trilha de longos e o encanamento
 * de publicação. Cria ideia (formato=longo) + linha no pipeline em PRONTO_PUBLICACAO e
 * carimba o episódio. As cercas do formato garantem que roteador/auto-agendar/cron ignoram;
 * a publicação é deliberada, pela Central.
 *
 * Payload: { episodio_id: string }
 */
export async function POST(request: NextRequest) {
  const denied = await guardApi(request)
  if (denied) return denied
  const { episodio_id } = await request.json().catch(() => ({}))
  if (!episodio_id) return NextResponse.json({ error: 'episodio_id é obrigatório' }, { status: 400 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseAdminClient() as any

  const { data: ep, error: epErr } = await supabase
    .schema('pulso_content').from('episodios').select('*').eq('id', episodio_id).single()
  if (epErr || !ep) return NextResponse.json({ error: 'Episódio não encontrado' }, { status: 404 })
  if (!ep.video_url) {
    return NextResponse.json({ error: 'Episódio sem video_url — monte o vídeo antes de promover' }, { status: 422 })
  }
  if (ep.ideia_id) {
    return NextResponse.json({ error: 'Episódio já promovido', ideia_id: ep.ideia_id }, { status: 409 })
  }
  const pend = (ep.checklist || []).filter((c: { feito: boolean }) => !c.feito)
  if (pend.length > 0) {
    // Regra dura da série: número falado = tela coletada. Checklist aberto = não está pronto.
    return NextResponse.json({ error: `Checklist com ${pend.length} item(ns) aberto(s)`, pendentes: pend }, { status: 422 })
  }

  const { data: canal } = await supabase
    .schema('pulso_core').from('canais').select('id').eq('slug', 'pulso-bastidores-pt').single()
  const { data: serie } = await supabase
    .schema('pulso_core').from('series').select('id').eq('slug', 'bastidores-t1').single()

  const { data: ideia, error: iErr } = await supabase
    .schema('pulso_content').from('ideias').insert({
      titulo: ep.titulo,
      canal_id: canal?.id ?? null,
      serie_id: serie?.id ?? null,
      status: 'APROVADA',
      formato: 'longo',
      metadata: { episodio_id: ep.id, codigo: ep.codigo },
    }).select('id').single()
  if (iErr) return NextResponse.json({ error: `ideia: ${iErr.message}` }, { status: 500 })

  // SEM metadata.numero de propósito: a sequência #pulsoNNN é dos Shorts (gerar-roteiro faz
  // maxNumero varrendo o pipeline) — episódio usa o código T01E01 como identidade.
  const { error: pErr } = await supabase
    .schema('pulso_content').from('pipeline_producao').insert({
      ideia_id: ideia.id,
      status: 'PRONTO_PUBLICACAO',
      metadata: { codigo: ep.codigo, titulo: ep.titulo, video_url: ep.video_url, formato: 'longo' },
    })
  if (pErr) return NextResponse.json({ error: `pipeline: ${pErr.message}` }, { status: 500 })

  await supabase.schema('pulso_content').from('episodios')
    .update({ ideia_id: ideia.id, status: 'pronto_publicacao', updated_at: new Date().toISOString() })
    .eq('id', ep.id)

  return NextResponse.json({ success: true, ideia_id: ideia.id, codigo: ep.codigo })
}
