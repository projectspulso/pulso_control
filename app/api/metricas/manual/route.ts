import { NextRequest, NextResponse } from 'next/server'
import { guardApi } from '@/lib/auth/api-guard'
import { getSupabaseAdminClient } from '@/lib/supabase/server'

/**
 * Números MANUAIS (Kwai e outras redes sem API/coletor).
 * Escrita via service role — o client-side authenticated é bloqueado por RLS.
 *
 * POST — dois modos:
 *   A) por vídeo:  { ideia_id, plataforma, views?, likes? }  → upsert em metricas_publicacao
 *   B) perfil:     { perfilRede, seguidores?, curtidas? }     → salva config <rede>_perfil
 * GET  ?perfil=kwai  → retorna o perfil salvo (seguidores/curtidas/quando)
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function admin() { return getSupabaseAdminClient() as any }

export async function GET(request: NextRequest) {
  const denied = await guardApi(request)
  if (denied) return denied
  const rede = new URL(request.url).searchParams.get('perfil') || 'kwai'
  const { data } = await admin().schema('pulso_core').from('configuracoes').select('valor').eq('chave', `${rede}_perfil`).maybeSingle()
  let v = data?.valor ?? null
  if (typeof v === 'string') { try { v = JSON.parse(v) } catch { v = null } }
  return NextResponse.json({ perfil: v || { seguidores: 0, curtidas: 0, quando: null } })
}

export async function POST(request: NextRequest) {
  const denied = await guardApi(request)
  if (denied) return denied
  const body = await request.json()
  const sb = admin()

  // Modo B) perfil da conta (seguidores/curtidas)
  if (body.perfilRede) {
    const rede = String(body.perfilRede)
    const valor = JSON.stringify({
      seguidores: Number(body.seguidores) || 0,
      curtidas: Number(body.curtidas) || 0,
      quando: new Date().toISOString(),
    })
    const { data: ex } = await sb.schema('pulso_core').from('configuracoes').select('chave').eq('chave', `${rede}_perfil`).maybeSingle()
    const q = ex
      ? sb.schema('pulso_core').from('configuracoes').update({ valor }).eq('chave', `${rede}_perfil`)
      : sb.schema('pulso_core').from('configuracoes').insert({ chave: `${rede}_perfil`, valor })
    const { error } = await q
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  // Modo A) números por vídeo
  const { ideia_id, plataforma } = body
  if (!ideia_id || !plataforma) return NextResponse.json({ error: 'ideia_id e plataforma obrigatórios' }, { status: 400 })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const campos: Record<string, any> = {}
  if (body.views != null) campos.views = Number(body.views) || 0
  if (body.likes != null) campos.likes = Number(body.likes) || 0

  const { data: ja } = await sb.schema('pulso_content').from('metricas_publicacao')
    .select('id, post_id').eq('ideia_id', ideia_id).eq('plataforma', plataforma).limit(1)

  let postId = `manual_${plataforma}`
  if (ja && ja.length) {
    postId = ja[0].post_id || postId
    const { error } = await sb.schema('pulso_content').from('metricas_publicacao').update(campos).eq('id', ja[0].id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else {
    const { error } = await sb.schema('pulso_content').from('metricas_publicacao').insert({
      ideia_id, plataforma, post_id: postId, url_publicacao: null,
      data_publicacao: new Date().toISOString(), views: campos.views ?? 0, likes: campos.likes ?? 0,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // CONTROLE FIRME: toda salvada vira uma LEITURA datada (mesmo padrão do coletor) em
  // pulso_analytics.leituras_metricas — 1/post/dia, upsert no dia, com a hora exata da
  // puxada (coletado_em). É daí que saem crescimento/curvas; o Kwai entra igual às outras.
  try {
    const agora = new Date()
    const leitura = {
      ideia_id, plataforma, post_id: postId,
      data_ref: agora.toISOString().slice(0, 10), coletado_em: agora.toISOString(),
      views: campos.views ?? 0, likes: campos.likes ?? 0, comentarios: 0, compartilhamentos: 0,
    }
    const { data: jaHoje } = await sb.schema('pulso_analytics').from('leituras_metricas')
      .update(leitura)
      .eq('ideia_id', ideia_id).eq('plataforma', plataforma).eq('data_ref', leitura.data_ref)
      .select('id')
    if (!jaHoje || jaHoje.length === 0) {
      await sb.schema('pulso_analytics').from('leituras_metricas').insert(leitura)
    }
  } catch { /* leitura é best-effort, não bloqueia o salvar */ }

  return NextResponse.json({ success: true })
}
