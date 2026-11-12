import { NextRequest, NextResponse } from 'next/server'
import { guardApi } from '@/lib/auth/api-guard'
import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { canaisYoutube, getYoutubeAccessToken } from '@/lib/youtube/oauth'

/**
 * Publica os cortes dos canais DO PULSO (dono 10/11/2026): Cortes PULSO Histórias e Bastidores PULSO
 * Histórias. Lê corte_publicacoes com modo=auto (o MKT só lê modo=job). YouTube: token do próprio canal
 * (youtube_oauth:<canal>), nunca o do PULSO Histórias. Instagram: Reels na conta do destino (instagram_id),
 * com o token do pulso_publisher; o container pendente fica em `motivo` para a rodada seguinte não publicar 2×.
 * Portão: configuracoes.cortes_pulso.publicar = true, posto só com o "pode" do dono.
 * 1 peça por rodada (o cron chama de hora em hora). Registra TODA rodada, inclusive a ociosa.
 */
export const maxDuration = 300

export async function POST(request: NextRequest) {
  const denied = await guardApi(request)
  if (denied) return denied
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseAdminClient() as any

  const { data: gate } = await supabase.schema('pulso_core').from('configuracoes').select('valor').eq('chave', 'cortes_pulso').maybeSingle()
  let publicar = false
  try { publicar = JSON.parse(gate?.valor || '{}').publicar === true } catch { publicar = false }

  // Facebook: agenda TRAVADA (dono, 12/11). A peça sobe já agendada na Meta assim que entra na agenda (até 28
  // dias à frente; a Meta aceita de 10 min a ~30 dias) e o Planner do Business Suite mostra tudo. Até 4 por rodada.
  if (publicar) {
    const { data: fb } = await supabase.schema('pulso_content').from('corte_publicacoes')
      .select('id, destino, rede, video, titulo, legenda, hashtags, agendado_para')
      .eq('modo', 'auto').eq('status', 'planejado').eq('rede', 'facebook')
      .gte('agendado_para', new Date(Date.now() + 25 * 60_000).toISOString())
      .lte('agendado_para', new Date(Date.now() + 28 * 86_400_000).toISOString()).order('agendado_para').limit(4)
    // não devolve aqui: a mesma rodada segue para o YouTube/Instagram vencido, senão o FB atrasaria os outros
    for (const p of fb || []) await agendaFacebook(supabase, p)

    // depois que o reel agendado entra no ar, a Página comenta o link do episódio completo (dono, 11/11):
    // link em legenda de Reel não é garantido clicável; em comentário é
    const { data: semComentario } = await supabase.schema('pulso_content').from('corte_publicacoes')
      .select('id, destino, post_id, legenda, motivo')
      .eq('modo', 'auto').eq('rede', 'facebook').eq('status', 'agendado').not('post_id', 'is', null)
      .lte('agendado_para', new Date(Date.now() - 3 * 60_000).toISOString()).limit(3)
    for (const p of (semComentario || []).filter((x: { motivo?: string }) => !String(x.motivo || '').startsWith('comentado:'))) {
      await comentaLink(supabase, p)
    }
  }

  const vencidas = () => supabase.schema('pulso_content').from('corte_publicacoes')
    .select('id, destino, rede, video, titulo, legenda, hashtags, agendado_para, motivo')
    .eq('modo', 'auto').eq('status', 'planejado').in('rede', ['youtube', 'instagram'])
    .lte('agendado_para', new Date().toISOString()).order('agendado_para').limit(1)
  const { data: fila, error } = await vencidas()
  if (error) return registra(supabase, 'erro', { erro: error.message }, 500)
  if (!fila?.length) return registra(supabase, 'ocioso', { motivo: 'nada vencido' }, 200)
  if (!publicar) return registra(supabase, 'ocioso', { motivo: 'aguarda o pode do dono (cortes_pulso.publicar)', vencidas: fila.length }, 200)

  // todas as peças vencidas que couberem no tempo (11/11: o IG do 1º corte saiu 1 h depois do YouTube
  // porque cada rodada fazia uma só). O IG pode esperar até 200 s, então só começa outra até os 60 s.
  const inicio = Date.now()
  const feitas: unknown[] = []
  let atual = fila[0]
  let ultima: Response = new Response(null)
  for (let i = 0; i < 6 && atual; i++) {
    ultima = await umaPeca(supabase, atual)
    feitas.push(atual.id)
    if (ultima.status !== 200 || Date.now() - inicio > 60_000) break
    const { data: prox } = await vencidas()
    atual = prox?.[0] && !feitas.includes(prox[0].id) ? prox[0] : null
  }
  return ultima
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function umaPeca(supabase: any, p: any): Promise<Response> {
  try {
    const { data: cfg } = await supabase.schema('pulso_core').from('configuracoes').select('valor').eq('chave', 'cortes_destinos').single()
    const dest = (JSON.parse(cfg.valor).destinos || []).find((d: { id: string }) => d.id === p.destino)
    if (p.rede === 'instagram') {
      const r = await publicaInstagram(supabase, p, dest)
      if (!r) return registra(supabase, 'aguardando', { peca: p.id, destino: p.destino, motivo: 'Reel processando, a próxima rodada publica' }, 200)
      await supabase.schema('pulso_content').from('corte_publicacoes')
        .update({ status: 'publicado', post_id: r.post_id, url: r.url, publicado_em: new Date().toISOString(), erro: null, motivo: null }).eq('id', p.id)
      return registra(supabase, 'sucesso', { peca: p.id, destino: p.destino, rede: 'instagram', post_id: r.post_id, url: r.url }, 200)
    }
    const canal = (await canaisYoutube()).find((c) => c.canal === dest?.youtube_canal)
    if (!canal) throw new Error(`destino ${p.destino} sem canal do YouTube em youtube_canais`)
    const token = await getYoutubeAccessToken(canal.chave)
    if (!token) throw new Error(`${canal.nome} sem autorização (abra /api/youtube/oauth/start?canal=${canal.canal})`)
    if (!p.video) throw new Error('peça sem arquivo')

    const { data: ass, error: e2 } = await supabase.storage.from('bastidores').createSignedUrl(p.video, 600)
    if (e2 || !ass?.signedUrl) throw new Error(`link do arquivo: ${e2?.message || 'vazio'}`)
    const vid = await fetch(ass.signedUrl)
    if (!vid.ok) throw new Error(`não baixei o vídeo (${vid.status})`)
    const buf = Buffer.from(await vid.arrayBuffer())

    const tags = [...new Set([...(p.hashtags || []).map((h: string) => h.replace(/^#/, '')), 'bastidores', 'shorts'])].slice(0, 15)
    const descricao = `${p.legenda || ''}\n\n${(p.hashtags || []).join(' ')}\n\n#Shorts`.trim()
    // pt-BR explícito e voz sintética declarada: os mesmos dois cuidados do publicador dos Curtos
    const meta = {
      snippet: { title: String(p.titulo || '').slice(0, 100), description: descricao.slice(0, 4900), categoryId: '28',
        defaultLanguage: 'pt-BR', defaultAudioLanguage: 'pt-BR', tags },
      status: { privacyStatus: 'public', selfDeclaredMadeForKids: false, containsSyntheticMedia: true },
    }
    const boundary = '----pulso' + Math.random().toString(16).slice(2)
    const body = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n--${boundary}\r\nContent-Type: video/mp4\r\n\r\n`),
      buf,
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ])
    const r = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status', {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': `multipart/related; boundary=${boundary}` }, body,
    })
    const d = await r.json()
    if (!r.ok || !d.id) throw new Error(`upload: ${d?.error?.message || r.status}`)

    const url = `https://youtube.com/shorts/${d.id}`
    await supabase.schema('pulso_content').from('corte_publicacoes')
      .update({ status: 'publicado', post_id: d.id, url, publicado_em: new Date().toISOString(), erro: null }).eq('id', p.id)
    return registra(supabase, 'sucesso', { peca: p.id, destino: p.destino, canal: canal.nome, post_id: d.id, url }, 200)
  } catch (e) {
    const msg = (e as Error).message
    await supabase.schema('pulso_content').from('corte_publicacoes').update({ status: 'erro', erro: msg.slice(0, 500) }).eq('id', p.id)
    return registra(supabase, 'erro', { peca: p.id, destino: p.destino, erro: msg }, 500)
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function registra(supabase: any, status: string, detalhes: Record<string, unknown>, http: number) {
  await supabase.schema('pulso_content').from('logs_workflows').insert({ workflow_name: 'PUBLICAR_CORTES_PULSO', status, detalhes })
  return NextResponse.json({ status, ...detalhes }, { status: http })
}

const GRAPH = 'https://graph.facebook.com/v21.0'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function publicaInstagram(supabase: any, p: any, dest: any): Promise<{ post_id: string; url: string } | null> {
  const igId = dest?.instagram_id
  if (!igId) throw new Error(`destino ${p.destino} sem instagram_id em cortes_destinos`)
  const token = process.env.INSTAGRAM_ACCESS_TOKEN
  if (!token) throw new Error('INSTAGRAM_ACCESS_TOKEN ausente')
  if (!p.video) throw new Error('peça sem arquivo')
  const status = async (id: string) =>
    (await fetch(`${GRAPH}/${id}?fields=status_code&access_token=${token}`).then((r) => r.json()))?.status_code as string | undefined

  let container = typeof p.motivo === 'string' && p.motivo.startsWith('ig_container:') ? p.motivo.slice(13) : null
  if (container) {
    const st = await status(container)
    if (st === 'PUBLISHED') throw new Error(`container ${container} já publicado e não registrado: conferir no Instagram antes de repetir`)
    if (st !== 'FINISHED' && st !== 'IN_PROGRESS') container = null
  }
  if (!container) {
    // link de 1 h: a Meta baixa o vídeo depois de criar o container, não na hora
    const { data: ass, error } = await supabase.storage.from('bastidores').createSignedUrl(p.video, 3600)
    if (error || !ass?.signedUrl) throw new Error(`link do arquivo: ${error?.message || 'vazio'}`)
    const caption = `${p.legenda || p.titulo || ''}

${(p.hashtags || []).join(' ')}`.trim().slice(0, 2200)
    const c = await fetch(`${GRAPH}/${igId}/media`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ media_type: 'REELS', video_url: ass.signedUrl, caption, share_to_feed: true, access_token: token }),
    }).then((r) => r.json())
    if (!c?.id) throw new Error(`IG container: ${c?.error?.message || JSON.stringify(c)}`)
    container = c.id as string
    await supabase.schema('pulso_content').from('corte_publicacoes').update({ motivo: `ig_container:${container}` }).eq('id', p.id)
  }

  const prazo = Date.now() + 200_000
  let st = await status(container)
  while (st === 'IN_PROGRESS' && Date.now() < prazo) {
    await new Promise((r) => setTimeout(r, 8000))
    st = await status(container)
  }
  if (st === 'IN_PROGRESS') return null
  if (st !== 'FINISHED') {
    await supabase.schema('pulso_content').from('corte_publicacoes').update({ motivo: null }).eq('id', p.id)
    throw new Error(`container IG ${st || 'sem status'}`)
  }
  const pub = await fetch(`${GRAPH}/${igId}/media_publish`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: container, access_token: token }),
  }).then((r) => r.json())
  if (!pub?.id) throw new Error(`IG publish: ${pub?.error?.message || JSON.stringify(pub)}`)
  const info = await fetch(`${GRAPH}/${pub.id}?fields=permalink&access_token=${token}`).then((r) => r.json())
  return { post_id: pub.id as string, url: info?.permalink || `https://www.instagram.com/${String(dest.instagram_arroba || '').replace('@', '')}/` }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function agendaFacebook(supabase: any, p: any) {
  try {
    const { data: cfg } = await supabase.schema('pulso_core').from('configuracoes').select('valor').eq('chave', 'cortes_destinos').single()
    const dest = (JSON.parse(cfg.valor).destinos || []).find((d: { id: string }) => d.id === p.destino)
    const pageId = dest?.facebook_page_id
    if (!pageId) throw new Error(`destino ${p.destino} sem facebook_page_id`)
    if (!p.video) throw new Error('peça sem arquivo')
    const token = process.env.INSTAGRAM_ACCESS_TOKEN
    const pt = await fetch(`${GRAPH}/${pageId}?fields=access_token&access_token=${token}`).then((r) => r.json())
    if (!pt?.access_token) throw new Error(`sem token da Página ${pageId}`)
    const pageToken = pt.access_token as string
    const { data: ass, error } = await supabase.storage.from('bastidores').createSignedUrl(p.video, 3600)
    if (error || !ass?.signedUrl) throw new Error(`link do arquivo: ${error?.message || 'vazio'}`)

    const start = await fetch(`${GRAPH}/${pageId}/video_reels`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ upload_phase: 'start', access_token: pageToken }),
    }).then((r) => r.json())
    if (!start?.video_id) throw new Error(`FB start: ${start?.error?.message || JSON.stringify(start)}`)
    const up = await fetch(start.upload_url || `https://rupload.facebook.com/video_reels/${start.video_id}`, {
      method: 'POST', headers: { Authorization: `OAuth ${pageToken}`, file_url: ass.signedUrl },
    }).then((r) => r.json())
    if (!up?.success) throw new Error(`FB upload: ${JSON.stringify(up).slice(0, 200)}`)
    const descricao = `${p.legenda || p.titulo || ''}

${(p.hashtags || []).join(' ')}`.trim()
    const quando = Math.floor(new Date(p.agendado_para).getTime() / 1000)
    const fim = await fetch(`${GRAPH}/${pageId}/video_reels?upload_phase=finish&video_id=${start.video_id}` +
      `&video_state=SCHEDULED&scheduled_publish_time=${quando}&description=${encodeURIComponent(descricao)}&access_token=${pageToken}`,
    { method: 'POST' }).then((r) => r.json())
    if (fim?.success === false || fim?.error) throw new Error(`FB finish: ${fim?.error?.message || JSON.stringify(fim)}`)

    const url = `https://www.facebook.com/reel/${start.video_id}`
    await supabase.schema('pulso_content').from('corte_publicacoes')
      .update({ status: 'agendado', post_id: start.video_id, url, erro: null, motivo: 'agendado pela API no Planner da Meta' }).eq('id', p.id)
    return registra(supabase, 'sucesso', { peca: p.id, destino: p.destino, rede: 'facebook', agendado_para: p.agendado_para, post_id: start.video_id }, 200)
  } catch (e) {
    const msg = (e as Error).message
    await supabase.schema('pulso_content').from('corte_publicacoes').update({ status: 'erro', erro: msg.slice(0, 500) }).eq('id', p.id)
    return registra(supabase, 'erro', { peca: p.id, destino: p.destino, rede: 'facebook', erro: msg }, 500)
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function comentaLink(supabase: any, p: any) {
  try {
    const m = String(p.legenda || '').match(/youtu\.be\/([\w-]{11})|youtube\.com\/watch\?v=([\w-]{11})/)
    if (!m) throw new Error('legenda sem link do episódio')
    const link = `https://youtu.be/${m[1] || m[2]}`
    const { data: cfg } = await supabase.schema('pulso_core').from('configuracoes').select('valor').eq('chave', 'cortes_destinos').single()
    const dest = (JSON.parse(cfg.valor).destinos || []).find((d: { id: string }) => d.id === p.destino)
    const token = process.env.INSTAGRAM_ACCESS_TOKEN
    const pt = await fetch(`${GRAPH}/${dest?.facebook_page_id}?fields=access_token&access_token=${token}`).then((r) => r.json())
    if (!pt?.access_token) throw new Error('sem token da Página')
    const st = await fetch(`${GRAPH}/${p.post_id}?fields=published&access_token=${pt.access_token}`).then((r) => r.json())
    if (st?.published !== true) return // ainda não entrou no ar: a próxima rodada tenta
    const c = await fetch(`${GRAPH}/${p.post_id}/comments`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: `▶ Episódio completo no PULSO Histórias: ${link}`, access_token: pt.access_token }),
    }).then((r) => r.json())
    if (!c?.id) throw new Error(`comentário: ${c?.error?.message || JSON.stringify(c)}`)
    await supabase.schema('pulso_content').from('corte_publicacoes')
      .update({ status: 'publicado', publicado_em: new Date().toISOString(), motivo: `comentado:${c.id}` }).eq('id', p.id)
    await registra(supabase, 'sucesso', { peca: p.id, rede: 'facebook', comentario: c.id }, 200)
  } catch (e) {
    // o reel já está no ar; erro de comentário não derruba a peça, só fica registrado
    await supabase.schema('pulso_content').from('corte_publicacoes').update({ erro: (e as Error).message.slice(0, 500) }).eq('id', p.id)
    await registra(supabase, 'erro', { peca: p.id, rede: 'facebook', etapa: 'comentario', erro: (e as Error).message }, 500)
  }
}
