import { NextRequest, NextResponse } from 'next/server'
import { guardApi } from '@/lib/auth/api-guard'
import { getSupabaseAdminClient } from '@/lib/supabase/server'

/**
 * POST /api/automation/publicar
 *
 * Publica um vídeo do pipeline DIRETO nas redes Meta (Instagram Reels + Facebook Reels)
 * via Graph API, usando o app "Pulso Control" + system user token.
 *
 * Payload: {
 *   pipeline_id: string,
 *   video_url: string,        // URL pública do .mp4 (Supabase Storage, OneDrive direto etc.)
 *   caption: string,
 *   plataformas?: ('instagram'|'facebook')[],
 *   confirmar: true           // gate humano explícito (R-011): sem isso, não publica
 * }
 *
 * YouTube/TikTok continuam via kit + navegador (F3/F4).
 * FACEBOOK também: desde 12/06 o default é só Instagram — reels FB via API
 * nesta Página são sufocados pelo algoritmo (ver teste A/B no changelog).
 */

const GRAPH = 'https://graph.facebook.com/v23.0'

async function aguardarContainer(containerId: string, token: string) {
  for (let i = 0; i < 30; i++) {
    const r = await fetch(`${GRAPH}/${containerId}?fields=status_code&access_token=${token}`)
    const j = await r.json()
    if (j.status_code === 'FINISHED') return true
    if (j.status_code === 'ERROR') throw new Error(`Container IG com erro: ${JSON.stringify(j)}`)
    await new Promise((res) => setTimeout(res, 5000))
  }
  throw new Error('Timeout aguardando processamento do vídeo no Instagram')
}

async function publicarInstagram(videoUrl: string, caption: string, token: string, igUserId: string) {
  const criar = await fetch(`${GRAPH}/${igUserId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      media_type: 'REELS',
      video_url: videoUrl,
      caption,
      share_to_feed: true,
      access_token: token,
    }),
  })
  const container = await criar.json()
  if (!container.id) throw new Error(`IG container: ${JSON.stringify(container)}`)

  await aguardarContainer(container.id, token)

  const pub = await fetch(`${GRAPH}/${igUserId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: container.id, access_token: token }),
  })
  const media = await pub.json()
  if (!media.id) throw new Error(`IG publish: ${JSON.stringify(media)}`)

  const info = await fetch(`${GRAPH}/${media.id}?fields=permalink&access_token=${token}`).then((r) => r.json())
  return { post_id: media.id as string, url: (info.permalink as string) || 'https://www.instagram.com/pulsoprojects/' }
}

async function publicarFacebook(videoUrl: string, description: string, token: string, pageId: string) {
  const start = await fetch(`${GRAPH}/${pageId}/video_reels`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ upload_phase: 'start', access_token: token }),
  }).then((r) => r.json())
  if (!start.video_id) throw new Error(`FB start: ${JSON.stringify(start)}`)

  const up = await fetch(`https://rupload.facebook.com/video_reels/${start.video_id}`, {
    method: 'POST',
    headers: { Authorization: `OAuth ${token}`, file_url: videoUrl },
  }).then((r) => r.json())
  if (!up.success) throw new Error(`FB upload: ${JSON.stringify(up)}`)

  const fim = await fetch(
    `${GRAPH}/${pageId}/video_reels?upload_phase=finish&video_id=${start.video_id}` +
      `&video_state=PUBLISHED&description=${encodeURIComponent(description)}&access_token=${token}`,
    { method: 'POST' }
  ).then((r) => r.json())
  if (fim.success === false) throw new Error(`FB finish: ${JSON.stringify(fim)}`)

  return { post_id: start.video_id as string, url: `https://www.facebook.com/reel/${start.video_id}` }
}

export async function POST(request: NextRequest) {
  const denied = await guardApi(request)
  if (denied) return denied
  const payload = await request.json().catch(() => ({}))
  const { pipeline_id, video_url, caption, confirmar } = payload
  // Default SEM facebook: teste A/B 12/06 — reels FB via API nesta Página são
  // sufocados pelo algoritmo (0-2 plays/13h vs 232/40min manual). FB = Business Suite.
  // Passar plataformas:['facebook'] explícito ainda funciona (para re-teste futuro).
  const plataformas: string[] = payload.plataformas || ['instagram']

  if (!confirmar) {
    return NextResponse.json(
      { error: 'Publicação exige confirmação humana explícita: envie confirmar: true (R-011)' },
      { status: 400 }
    )
  }
  if (!pipeline_id || !video_url) {
    return NextResponse.json({ error: 'pipeline_id e video_url são obrigatórios' }, { status: 400 })
  }

  const token = process.env.INSTAGRAM_ACCESS_TOKEN
  // IDs públicos da Página/IG do PULSO como fallback (portfólio Projetos Pulso)
  const igUserId = process.env.META_IG_USER_ID || '17841478757082171'
  const pageId = process.env.META_PAGE_ID || '926237593895365'
  if (!token || !igUserId || !pageId) {
    return NextResponse.json(
      { error: 'Credenciais Meta ausentes (INSTAGRAM_ACCESS_TOKEN / META_IG_USER_ID / META_PAGE_ID)' },
      { status: 500 }
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseAdminClient() as any

  const { data: item, error: pipeErr } = await supabase
    .schema('pulso_content')
    .from('pipeline_producao')
    .select('id, ideia_id, roteiro_id, status, metadata')
    .eq('id', pipeline_id)
    .single()
  if (pipeErr || !item) {
    return NextResponse.json({ error: 'Pipeline não encontrado' }, { status: 404 })
  }

  const { data: ideia } = await supabase
    .schema('pulso_content')
    .from('ideias')
    .select('id, titulo')
    .eq('id', item.ideia_id)
    .single()

  const legenda = caption || `${ideia?.titulo || 'PULSO'} 👁️ Segue o PULSO.`
  const agora = new Date().toISOString()
  const resultados: Array<{ plataforma: string; status: string; url?: string; post_id?: string; erro?: string }> = []

  for (const plataforma of plataformas) {
    try {
      let res: { post_id: string; url: string }
      if (plataforma === 'instagram') {
        res = await publicarInstagram(video_url, legenda, token, igUserId)
      } else if (plataforma === 'facebook') {
        res = await publicarFacebook(video_url, legenda, token, pageId)
      } else {
        resultados.push({ plataforma, status: 'MANUAL', erro: 'Plataforma sem API direta (usar kit + navegador)' })
        continue
      }

      // registra a publicação (fonte da coleta de métricas)
      await supabase.schema('pulso_content').from('metricas_publicacao').insert({
        ideia_id: item.ideia_id,
        roteiro_id: item.roteiro_id,
        plataforma,
        url_publicacao: res.url,
        post_id: res.post_id,
        data_publicacao: agora,
      })

      resultados.push({ plataforma, status: 'PUBLICADO', url: res.url, post_id: res.post_id })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido'
      resultados.push({ plataforma, status: 'ERRO', erro: msg })
    }
  }

  const publicou = resultados.some((r) => r.status === 'PUBLICADO')
  if (publicou) {
    await supabase
      .schema('pulso_content')
      .from('pipeline_producao')
      .update({
        status: 'PUBLICADO',
        data_publicacao: agora,
        metadata: { ...(item.metadata || {}), publicacao_meta_api: resultados },
      })
      .eq('id', pipeline_id)
  }

  return NextResponse.json({
    success: publicou,
    pipeline_id,
    publicados: resultados.filter((r) => r.status === 'PUBLICADO').length,
    erros: resultados.filter((r) => r.status === 'ERRO').length,
    resultados,
  })
}
