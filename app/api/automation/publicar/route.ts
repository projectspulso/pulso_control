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

// ---- YouTube (videos.insert via API) ----
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function tokenYoutube(supabase: any): Promise<string> {
  const { data: cfg } = await supabase
    .schema('pulso_core').from('configuracoes').select('valor').eq('chave', 'youtube_oauth').single()
  if (!cfg?.valor) throw new Error('YouTube não autorizado (rode o OAuth)')
  let tok = JSON.parse(cfg.valor)
  if (!String(tok.scope || '').includes('youtube.upload')) {
    throw new Error('YouTube precisa re-autorizar com escopo de upload — abra /api/youtube/oauth/start')
  }
  if (Date.now() > (tok.expires_at || 0) - 60_000) {
    const r = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.YOUTUBE_CLIENT_ID || '',
        client_secret: process.env.YOUTUBE_CLIENT_SECRET || '',
        grant_type: 'refresh_token',
        refresh_token: tok.refresh_token,
      }),
    }).then((x) => x.json())
    if (!r.access_token) throw new Error(`Refresh YT falhou: ${JSON.stringify(r).slice(0, 120)}`)
    tok = { ...tok, access_token: r.access_token, expires_at: Date.now() + (r.expires_in || 3600) * 1000 }
    await supabase.schema('pulso_core').from('configuracoes').update({ valor: JSON.stringify(tok) }).eq('chave', 'youtube_oauth')
  }
  return tok.access_token
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function publicarYouTube(videoUrl: string, titulo: string, descricao: string, supabase: any) {
  const at = await tokenYoutube(supabase)
  const vid = await fetch(videoUrl)
  if (!vid.ok) throw new Error(`Não baixei o vídeo (${vid.status})`)
  const buf = Buffer.from(await vid.arrayBuffer())
  const meta = {
    snippet: { title: titulo.slice(0, 100), description: descricao.slice(0, 4900), categoryId: '27' },
    status: { privacyStatus: 'public', selfDeclaredMadeForKids: false },
  }
  const boundary = '----pulso' + Math.random().toString(16).slice(2)
  const pre = Buffer.from(
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n--${boundary}\r\nContent-Type: video/mp4\r\n\r\n`,
  )
  const post = Buffer.from(`\r\n--${boundary}--\r\n`)
  const body = Buffer.concat([pre, buf, post])
  const r = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status', {
    method: 'POST',
    headers: { Authorization: `Bearer ${at}`, 'Content-Type': `multipart/related; boundary=${boundary}` },
    body,
  })
  const d = await r.json()
  if (!r.ok || !d.id) throw new Error(`YT upload: ${d?.error?.message || r.status}`)
  return { post_id: d.id as string, url: `https://youtube.com/shorts/${d.id}` }
}

// ---- TikTok (inbox/rascunho via Content Posting API) ----
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function publicarTikTok(videoUrl: string, supabase: any) {
  const { data: cfg } = await supabase
    .schema('pulso_core').from('configuracoes').select('valor').eq('chave', 'tiktok_oauth').single()
  if (!cfg?.valor) throw new Error('TikTok não autorizado (rode o OAuth)')
  let oauth = JSON.parse(cfg.valor)
  if (Date.now() > oauth.expires_at - 60_000) {
    const r = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_key: (process.env.TIKTOK_SANDBOX_KEY || process.env.TIKTOK_CLIENT_KEY) || '',
        client_secret: (process.env.TIKTOK_SANDBOX_SECRET || process.env.TIKTOK_CLIENT_SECRET) || '',
        grant_type: 'refresh_token',
        refresh_token: oauth.refresh_token,
      }),
    }).then((x) => x.json())
    if (!r.access_token) throw new Error(`Refresh TikTok falhou: ${JSON.stringify(r).slice(0, 120)}`)
    oauth = { ...oauth, access_token: r.access_token, refresh_token: r.refresh_token, expires_at: Date.now() + (r.expires_in || 86400) * 1000 }
    await supabase.schema('pulso_core').from('configuracoes').update({ valor: JSON.stringify(oauth) }).eq('chave', 'tiktok_oauth')
  }
  const vid = await fetch(videoUrl)
  if (!vid.ok) throw new Error(`Não baixei o vídeo (${vid.status})`)
  const buf = Buffer.from(await vid.arrayBuffer())
  const init = await fetch('https://open.tiktokapis.com/v2/post/publish/inbox/video/init/', {
    method: 'POST',
    headers: { Authorization: `Bearer ${oauth.access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ source_info: { source: 'FILE_UPLOAD', video_size: buf.length, chunk_size: buf.length, total_chunk_count: 1 } }),
  }).then((x) => x.json())
  const uploadUrl = init?.data?.upload_url
  if (!uploadUrl) throw new Error(`TikTok init: ${JSON.stringify(init).slice(0, 150)}`)
  const put = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'video/mp4', 'Content-Length': String(buf.length), 'Content-Range': `bytes 0-${buf.length - 1}/${buf.length}` },
    body: buf,
  })
  if (!put.ok) throw new Error(`TikTok upload (${put.status})`)
  return { post_id: init.data.publish_id as string, url: 'rascunho no app TikTok (finalize no celular)' }
}

export const maxDuration = 60

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
  // hora real (Brasília, UTC-3) — alimenta o painel de horários do analytics
  const _br = new Date(Date.now() - 3 * 3600_000)
  const horaPub = _br.toISOString().slice(11, 19)
  const diaSemPub = _br.getUTCDay() === 0 ? 7 : _br.getUTCDay()
  const resultados: Array<{ plataforma: string; status: string; url?: string; post_id?: string; erro?: string }> = []

  for (const plataforma of plataformas) {
    try {
      // IDEMPOTÊNCIA: se já existe publicação dessa plataforma pra esta ideia,
      // NÃO republica (blinda contra double-fire do botão / retry / chamada dupla).
      const { data: jaPublicado } = await supabase
        .schema('pulso_content')
        .from('metricas_publicacao')
        .select('post_id, url_publicacao')
        .eq('ideia_id', item.ideia_id)
        .eq('plataforma', plataforma)
        .limit(1)
      if (jaPublicado && jaPublicado.length > 0) {
        resultados.push({
          plataforma,
          status: 'JA_PUBLICADO',
          url: jaPublicado[0].url_publicacao,
          post_id: jaPublicado[0].post_id,
        })
        continue
      }

      let res: { post_id: string; url: string }
      if (plataforma === 'instagram') {
        res = await publicarInstagram(video_url, legenda, token, igUserId)
      } else if (plataforma === 'facebook') {
        res = await publicarFacebook(video_url, legenda, token, pageId)
      } else if (plataforma === 'youtube') {
        res = await publicarYouTube(video_url, ideia?.titulo || 'PULSO', legenda, supabase)
      } else if (plataforma === 'tiktok') {
        res = await publicarTikTok(video_url, supabase)
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
        hora_publicacao: horaPub,
        dia_semana: diaSemPub,
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
