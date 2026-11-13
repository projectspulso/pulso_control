import { NextRequest, NextResponse } from 'next/server'
import { guardApi } from '@/lib/auth/api-guard'
import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { getYoutubeAccessToken } from '@/lib/youtube/oauth'
import { fetchYoutubeRetention } from '@/lib/youtube/retention'
import { tokenTikTokConta } from '@/lib/publicacao/tiktok-rascunho-cortes'

/**
 * Coleta diária dos Longos (091, 06/11/2026). O Pulso lê pela API pública do YouTube o que é dele ler:
 * o longo no canal principal (id do vídeo no link que o digiai_mkt devolveu, ou no post_id) e os cortes
 * que saíram no YouTube do canal de cortes. As outras redes chegam pelo digiai_mkt (rpc leitura_peca_bastidores).
 * Horas de exibição e retenção do longo pedem o OAuth do canal principal (ainda não existe): ficam nulas.
 * Desde 12/11/2026 lê também os cortes nos canais DO PULSO (Cortes e Bastidores PULSO Histórias): YouTube
 * pela chave pública, Instagram e Facebook pelo token do pulso_publisher, e os seguidores de cada canal.
 * Desde 12/11/2026 (096) grava de onde vêm as views: tipo de tráfego e detalhe (site externo, vídeo de origem)
 * do longo e dos cortes nos canais do PULSO, e avisa quando falta a leitura do digiai_mkt nos cortes da DIGIAI.
 * Registra TODA rodada, inclusive a ociosa (cron nunca falha em silêncio).
 */
export const maxDuration = 300

const GRAPH = 'https://graph.facebook.com/v21.0'
const CANAIS_PULSO = ['pulso_cortes', 'pulso_bastidores']
const CONTA_TIKTOK: Record<string, string> = { pulso_cortes: 'cortes', pulso_bastidores: 'bastidores' }
const TT = 'https://open.tiktokapis.com/v2'
const canalDe = (destino: string) => (destino === 'digiai' ? 'digiai' : destino === 'bastidores2' ? 'cortes2' : CANAIS_PULSO.includes(destino) ? destino : 'cortes')

const idDoYoutube = (s: string | null | undefined) => {
  if (!s) return null
  const m = s.match(/(?:v=|youtu\.be\/|shorts\/|live\/)([A-Za-z0-9_-]{11})/)
  return m ? m[1] : /^[A-Za-z0-9_-]{11}$/.test(s) ? s : null
}
const hojeBrt = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })

export async function POST(request: NextRequest) {
  const denied = await guardApi(request)
  if (denied) return denied
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseAdminClient() as any
  const chave = process.env.YOUTUBE_API_KEY
  if (!chave) return registra(supabase, 'erro', { erro: 'YOUTUBE_API_KEY ausente' }, 500)
  const data_ref = hojeBrt()

  const alvos: { episodio_id: string; peca_id: string | null; canal: string; rede: string; tipo: string; post_id: string }[] = []
  const { data: eps, error: e1 } = await supabase.schema('pulso_content').from('episodios').select('id, status, metadata').in('status', ['publicado', 'pronto_publicacao'])
  if (e1) return registra(supabase, 'erro', { erro: e1.message }, 500)
  for (const ep of eps || []) {
    // episódio agendado pelo motor/publicar_longo.py (13/11): vira publicado quando passa a hora da estreia
    if (ep.status === 'pronto_publicacao') {
      const pub = ep.metadata?.publicacao
      if (pub?.estado !== 'agendado' || !pub?.agendado_para || new Date(pub.agendado_para) > new Date()) continue
      await supabase.schema('pulso_content').from('episodios')
        .update({ status: 'publicado', metadata: { ...ep.metadata, publicacao: { ...pub, estado: 'publicado' } } }).eq('id', ep.id)
    }
    const id = idDoYoutube(ep.metadata?.publicacao?.post_id) || idDoYoutube(ep.metadata?.publicacao?.url)
    if (id) alvos.push({ episodio_id: ep.id, peca_id: null, canal: 'principal', rede: 'youtube', tipo: 'longo', post_id: id })
  }
  const { data: pecas, error: e2 } = await supabase.schema('pulso_content').from('corte_publicacoes')
    .select('id, rede, tipo, destino, post_id, url, episodio_cortes!inner(episodio_id)')
    .eq('status', 'publicado').eq('rede', 'youtube')
  if (e2) return registra(supabase, 'erro', { erro: e2.message }, 500)
  for (const p of pecas || []) {
    const id = idDoYoutube(p.post_id) || idDoYoutube(p.url)
    if (id) alvos.push({ episodio_id: p.episodio_cortes.episodio_id, peca_id: p.id, canal: canalDe(p.destino), rede: 'youtube', tipo: p.tipo, post_id: id })
  }

  const falhas: string[] = []
  let gravadas = 0
  const { data: cfg } = await supabase.schema('pulso_core').from('configuracoes').select('valor').eq('chave', 'cortes_destinos').maybeSingle()
  const { data: cfgYt } = await supabase.schema('pulso_core').from('configuracoes').select('valor').eq('chave', 'youtube_canais').maybeSingle()
  let destinos: Array<{ id: string; youtube_canal?: string; youtube_channel_id?: string; instagram_id?: string; facebook_page_id?: string }> = []
  let ytCanais: Record<string, { channel_id?: string }> = {}
  try { destinos = JSON.parse(cfg?.valor || '{}').destinos || [] } catch { destinos = [] }
  try { ytCanais = JSON.parse(cfgYt?.valor || '{}') } catch { ytCanais = {} }
  // token do Analytics por canal: o principal (longo) e os 2 canais de cortes do PULSO
  const tokens = new Map<string, string | null>()
  const tokenDoCanal = async (canal: string) => {
    const chaveOauth = canal === 'principal' ? 'youtube_oauth' : `youtube_oauth:${destinos.find((d) => d.id === canal)?.youtube_canal || ''}`
    if (!tokens.has(chaveOauth)) tokens.set(chaveOauth, await getYoutubeAccessToken(chaveOauth).catch(() => null))
    return tokens.get(chaveOauth) || null
  }
  for (let i = 0; i < alvos.length; i += 50) {
    const lote = alvos.slice(i, i + 50)
    const url = new URL('https://www.googleapis.com/youtube/v3/videos')
    url.searchParams.set('part', 'statistics')
    url.searchParams.set('id', lote.map((a) => a.post_id).join(','))
    url.searchParams.set('key', chave)
    const r = await fetch(url)
    if (!r.ok) { falhas.push(`youtube ${r.status}`); continue }
    const j = await r.json()
    const stats = new Map<string, Record<string, string>>((j.items || []).map((it: { id: string; statistics: Record<string, string> }) => [it.id, it.statistics]))
    const linhas = lote.filter((a) => stats.has(a.post_id)).map((a) => {
      const s = stats.get(a.post_id) || {}
      return { ...a, data_ref, views: Number(s.viewCount || 0), likes: Number(s.likeCount || 0), comentarios: Number(s.commentCount || 0), fonte: 'pulso', coletado_em: new Date().toISOString() }
    })
    for (const a of lote) if (!stats.has(a.post_id)) falhas.push(`${a.post_id}: não achado no YouTube`)
    // Analytics: o longo (horas, retenção, origens) e os cortes nos canais do PULSO (retenção e origens).
    // O canal de cortes da DIGIAI é do MKT: o token não mora aqui.
    for (const l of linhas) {
      if (l.canal !== 'principal' && !CANAIS_PULSO.includes(l.canal)) continue
      const token = await tokenDoCanal(l.canal)
      if (!token) { falhas.push(`${l.post_id}: sem acesso ao Analytics do canal ${l.canal}`); continue }
      Object.assign(l, await analyticsDoVideo(l.post_id, token, falhas, l.tipo === 'longo'))
    }
    for (const l of linhas) {
      // o índice único usa coalesce(peca_id): o upsert do PostgREST não o enxerga, então apaga o do dia e grava
      let q = supabase.schema('pulso_analytics').from('leituras_longos').delete().eq('episodio_id', l.episodio_id).eq('rede', l.rede).eq('data_ref', data_ref)
      q = l.peca_id ? q.eq('peca_id', l.peca_id) : q.is('peca_id', null)
      const { error: d } = await q
      const { error: w } = d ? { error: d } : await supabase.schema('pulso_analytics').from('leituras_longos').insert(l)
      if (w) falhas.push(`${l.post_id}: ${w.message}`)
      else gravadas += 1
    }
  }


  // Instagram e Facebook dos cortes nos canais do PULSO (o token do pulso_publisher só alcança esses)
  const metaToken = process.env.INSTAGRAM_ACCESS_TOKEN
  const pageTokens = new Map<string, string>()
  const tokenDaPagina = async (pageId: string) => {
    if (!pageTokens.has(pageId)) {
      const r = await fetch(`${GRAPH}/${pageId}?fields=access_token&access_token=${metaToken}`).then((x) => x.json()).catch(() => ({}))
      pageTokens.set(pageId, r?.access_token || '')
    }
    return pageTokens.get(pageId) || ''
  }
  let lidasMeta = 0
  if (metaToken) {
    const { data: meta } = await supabase.schema('pulso_content').from('corte_publicacoes')
      .select('id, rede, tipo, destino, post_id, episodio_cortes!inner(episodio_id)')
      .eq('status', 'publicado').in('rede', ['instagram', 'facebook']).in('destino', CANAIS_PULSO).not('post_id', 'is', null)
    for (const p of meta || []) {
      const dest = destinos.find((d) => d.id === p.destino)
      const base = { episodio_id: p.episodio_cortes.episodio_id, peca_id: p.id, canal: p.destino, rede: p.rede, tipo: p.tipo, post_id: p.post_id, data_ref, fonte: 'pulso', coletado_em: new Date().toISOString() }
      try {
        let m: { views: number; likes: number; comentarios: number; compartilhamentos: number }
        if (p.rede === 'instagram') {
          const info = await fetch(`${GRAPH}/${p.post_id}?fields=like_count,comments_count&access_token=${metaToken}`).then((x) => x.json())
          const ins = await fetch(`${GRAPH}/${p.post_id}/insights?metric=views,shares&access_token=${metaToken}`).then((x) => x.json())
          if (info?.error) throw new Error(info.error.message)
          const val = (nome: string) => Number((ins?.data || []).find((x: { name: string }) => x.name === nome)?.values?.[0]?.value || 0)
          m = { views: val('views'), likes: Number(info.like_count || 0), comentarios: Number(info.comments_count || 0), compartilhamentos: val('shares') }
        } else {
          const pt = dest?.facebook_page_id ? await tokenDaPagina(dest.facebook_page_id) : ''
          if (!pt) throw new Error('sem token da Página')
          const ins = await fetch(`${GRAPH}/${p.post_id}/video_insights?metric=fb_reels_total_plays&access_token=${pt}`).then((x) => x.json())
          const info = await fetch(`${GRAPH}/${p.post_id}?fields=likes.summary(true).limit(0),comments.summary(true).limit(0)&access_token=${pt}`).then((x) => x.json())
          if (ins?.error) throw new Error(ins.error.message)
          m = { views: Number(ins?.data?.[0]?.values?.[0]?.value || 0), likes: Number(info?.likes?.summary?.total_count || 0),
            comentarios: Number(info?.comments?.summary?.total_count || 0), compartilhamentos: 0 }
        }
        await supabase.schema('pulso_analytics').from('leituras_longos').delete().eq('peca_id', p.id).eq('rede', p.rede).eq('data_ref', data_ref)
        const { error: w } = await supabase.schema('pulso_analytics').from('leituras_longos').insert({ ...base, ...m })
        if (w) falhas.push(`${p.rede} ${p.post_id}: ${w.message}`)
        else { gravadas += 1; lidasMeta += 1 }
      } catch (e) {
        falhas.push(`${p.rede} ${p.post_id}: ${(e as Error).message}`)
      }
    }
  }

  // TikTok dos canais do PULSO (13/11): o corte sai como rascunho e o dono publica no celular. Primeiro troca o
  // publish_id do rascunho pelo id do post (status/fetch), depois lê views, curtidas, comentários e partilhas
  // (video/query) com o token de cada conta. O id tem 19 dígitos: lê como texto, nunca .json() direto.
  let lidasTikTok = 0
  const ttTokens = new Map<string, string | null>()
  const ttToken = async (destino: string) => {
    const conta = CONTA_TIKTOK[destino]
    if (!ttTokens.has(conta)) ttTokens.set(conta, await tokenTikTokConta(supabase, conta).catch((e) => { falhas.push(`TikTok ${conta}: ${(e as Error).message}`); return null }))
    return ttTokens.get(conta) || null
  }
  const ttJson = (t: string) => JSON.parse(t.replace(/"id"\s*:\s*(\d{15,})/g, '"id":"$1"'))
  const { data: rasc } = await supabase.schema('pulso_content').from('corte_publicacoes')
    .select('id, destino, motivo, publicado_em').eq('rede', 'tiktok').in('destino', CANAIS_PULSO).in('status', ['agendado', 'publicado'])
    .is('post_id', null).like('motivo', 'rascunho_tiktok:%')
  for (const p of rasc || []) {
    const tk = await ttToken(p.destino)
    if (!tk) continue
    const bruto = await fetch(`${TT}/post/publish/status/fetch/`, {
      method: 'POST', headers: { Authorization: `Bearer ${tk}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ publish_id: p.motivo.slice('rascunho_tiktok:'.length) }),
    }).then((x) => x.text()).catch(() => '')
    const id = bruto.match(/"publ[a-z]*_available_post_id"\s*:\s*\[?\s*"?(\d+)"?/)?.[1]
    if (!id) continue
    await supabase.schema('pulso_content').from('corte_publicacoes')
      .update({ post_id: id, status: 'publicado', publicado_em: p.publicado_em || new Date().toISOString() }).eq('id', p.id)
  }
  const { data: tts } = await supabase.schema('pulso_content').from('corte_publicacoes')
    .select('id, tipo, destino, post_id, episodio_cortes!inner(episodio_id)')
    .eq('status', 'publicado').eq('rede', 'tiktok').in('destino', CANAIS_PULSO).not('post_id', 'is', null)
  for (const destino of CANAIS_PULSO) {
    const pecas = (tts || []).filter((p: { destino: string }) => p.destino === destino)
    if (!pecas.length) continue
    const tk = await ttToken(destino)
    if (!tk) { falhas.push(`TikTok ${destino}: conta sem autorização`); continue }
    for (let i = 0; i < pecas.length; i += 20) {
      const lote = pecas.slice(i, i + 20)
      try {
        const t = await fetch(`${TT}/video/query/?fields=id,view_count,like_count,comment_count,share_count`, {
          method: 'POST', headers: { Authorization: `Bearer ${tk}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ filters: { video_ids: lote.map((p: { post_id: string }) => p.post_id) } }),
        }).then((x) => x.text())
        const j = ttJson(t)
        if (j?.error?.code && j.error.code !== 'ok') throw new Error(`${j.error.code}: ${j.error.message}`)
        const vids: Array<{ id: string; view_count?: number; like_count?: number; comment_count?: number; share_count?: number }> = j?.data?.videos || []
        for (const p of lote) {
          const v = vids.find((x) => String(x.id) === p.post_id)
          if (!v) { falhas.push(`tiktok ${p.post_id}: não voltou na consulta`); continue }
          await supabase.schema('pulso_analytics').from('leituras_longos').delete().eq('peca_id', p.id).eq('rede', 'tiktok').eq('data_ref', data_ref)
          const { error: w } = await supabase.schema('pulso_analytics').from('leituras_longos').insert({
            episodio_id: p.episodio_cortes.episodio_id, peca_id: p.id, canal: p.destino, rede: 'tiktok', tipo: p.tipo, post_id: p.post_id,
            data_ref, fonte: 'pulso', coletado_em: new Date().toISOString(),
            views: Number(v.view_count || 0), likes: Number(v.like_count || 0), comentarios: Number(v.comment_count || 0), compartilhamentos: Number(v.share_count || 0),
          })
          if (w) falhas.push(`tiktok ${p.post_id}: ${w.message}`)
          else { gravadas += 1; lidasTikTok += 1 }
        }
      } catch (e) {
        falhas.push(`TikTok ${destino}: ${(e as Error).message}`)
      }
    }
  }

  // seguidores: principal e canais de cortes no YouTube; Instagram, Facebook e TikTok dos canais do PULSO
  let inscritos = 0
  const grava = async (canal: string, rede: string, seguidores: number) => {
    const { error } = await supabase.schema('pulso_analytics').from('seguidores_longos')
      .upsert({ canal, rede, data_ref, seguidores, fonte: 'pulso', coletado_em: new Date().toISOString() }, { onConflict: 'canal,rede,data_ref' })
    if (error) falhas.push(`seguidores ${canal}/${rede}: ${error.message}`)
    else inscritos += 1
  }
  for (const d of destinos.filter((x) => CANAIS_PULSO.includes(x.id))) {
    const tk = await ttToken(d.id)
    if (tk) {
      const r = await fetch(`${TT}/user/info/?fields=follower_count`, { headers: { Authorization: `Bearer ${tk}` } }).then((x) => x.json()).catch(() => ({}))
      if (r?.data?.user?.follower_count != null) await grava(d.id, 'tiktok', Number(r.data.user.follower_count))
      else falhas.push(`seguidores ${d.id}/tiktok: ${r?.error?.message || 'sem leitura'}`)
    }
    if (!metaToken) continue
    if (d.instagram_id) {
      const r = await fetch(`${GRAPH}/${d.instagram_id}?fields=followers_count&access_token=${metaToken}`).then((x) => x.json()).catch(() => ({}))
      if (r?.followers_count != null) await grava(d.id, 'instagram', Number(r.followers_count))
      else falhas.push(`seguidores ${d.id}/instagram: ${r?.error?.message || 'sem leitura'}`)
    }
    if (d.facebook_page_id) {
      const pt = await tokenDaPagina(d.facebook_page_id)
      const r = await fetch(`${GRAPH}/${d.facebook_page_id}?fields=followers_count&access_token=${pt || metaToken}`).then((x) => x.json()).catch(() => ({}))
      if (r?.followers_count != null) await grava(d.id, 'facebook', Number(r.followers_count))
      else falhas.push(`seguidores ${d.id}/facebook: ${r?.error?.message || 'sem leitura'}`)
    }
  }
  try {
    const v = JSON.parse(cfg?.valor || '{}')
    const canais = [
      { canal: 'principal', id: v.principal?.channel_id || ytCanais.principal?.channel_id },
      { canal: 'cortes', id: destinos.find((d) => d.id === 'bastidores')?.youtube_channel_id },
      ...destinos.filter((d) => CANAIS_PULSO.includes(d.id)).map((d) => ({ canal: d.id, id: ytCanais[d.youtube_canal || '']?.channel_id })),
    ].filter((c) => c.id)
    if (canais.length) {
      const url = new URL('https://www.googleapis.com/youtube/v3/channels')
      url.searchParams.set('part', 'statistics')
      url.searchParams.set('id', canais.map((c) => c.id).join(','))
      url.searchParams.set('key', chave)
      const r = await fetch(url)
      const j = r.ok ? await r.json() : { items: [] }
      for (const c of canais) {
        const it = (j.items || []).find((x: { id: string }) => x.id === c.id)
        if (!it) { falhas.push(`canal ${c.canal}: não achado`); continue }
        await grava(c.canal, 'youtube', Number(it.statistics.subscriberCount || 0))
      }
    }
  } catch (e) {
    falhas.push(`config: ${(e as Error).message}`)
  }

  // cortes da DIGIAI fora do YouTube: quem lê é o digiai_mkt (rpc leitura_peca_bastidores). Sem leitura em 2 dias vira alerta.
  const { data: dgi } = await supabase.schema('pulso_content').from('corte_publicacoes')
    .select('id, rede, destino, publicado_em').eq('status', 'publicado').not('destino', 'in', `(${CANAIS_PULSO.join(',')})`).neq('rede', 'youtube')
  const doisDias = new Date(Date.now() - 2 * 86_400_000).toISOString().slice(0, 10)
  for (const p of dgi || []) {
    if (p.publicado_em && p.publicado_em.slice(0, 10) > doisDias) continue
    const { count } = await supabase.schema('pulso_analytics').from('leituras_longos').select('id', { count: 'exact', head: true })
      .eq('peca_id', p.id).gte('data_ref', doisDias)
    if (!count) falhas.push(`sem leitura do digiai_mkt há 2 dias: ${p.destino}/${p.rede} ${p.id.slice(0, 8)}`)
  }

  const status = !alvos.length && !inscritos ? 'ocioso' : falhas.length ? 'parcial' : 'sucesso'
  return registra(supabase, status, { data_ref, alvos: alvos.length, lidas_instagram_facebook: lidasMeta, lidas_tiktok: lidasTikTok, gravadas, canais_lidos: inscritos, falhas }, 200)
}

// tipos de tráfego em que o YouTube informa o detalhe (o site externo, o vídeo de origem, a busca)
const COM_DETALHE = ['EXT_URL', 'RELATED_VIDEO', 'YT_CHANNEL', 'END_SCREEN', 'PLAYLIST', 'YT_SEARCH', 'YT_OTHER_PAGE']

/** Horas, retenção, curva (só o longo) e origens com detalhe. O Analytics atrasa ~48 h: vídeo novo volta vazio e fica nulo. */
async function analyticsDoVideo(videoId: string, token: string, falhas: string[], longo: boolean) {
  const hoje = new Date().toISOString().slice(0, 10)
  const relatorio = async (metrics: string, dimensions?: string, filtroExtra = '') => {
    const url = new URL('https://youtubeanalytics.googleapis.com/v2/reports')
    url.searchParams.set('ids', 'channel==MINE')
    url.searchParams.set('startDate', '2026-01-01')
    url.searchParams.set('endDate', hoje)
    url.searchParams.set('metrics', metrics)
    url.searchParams.set('filters', `video==${videoId}${filtroExtra}`)
    if (dimensions) url.searchParams.set('dimensions', dimensions)
    if (dimensions === 'insightTrafficSourceDetail') { url.searchParams.set('sort', '-views'); url.searchParams.set('maxResults', '25') }
    const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    if (!r.ok) { falhas.push(`${videoId}: Analytics ${r.status}`); return [] }
    return ((await r.json()).rows || []) as (string | number)[][]
  }
  const extra: { horas_exibicao?: number; retencao_media_pct?: number; retencao_curva?: { p: number; ret: number }[]; origens?: Record<string, number>; origens_detalhe?: Record<string, Record<string, number>> } = {}
  const [tot] = await relatorio('views,estimatedMinutesWatched,averageViewPercentage')
  if (tot && Number(tot[0]) > 0) {
    extra.horas_exibicao = Math.round((Number(tot[1]) / 60) * 10) / 10
    extra.retencao_media_pct = Math.round(Number(tot[2]) * 10) / 10
  }
  const curva = longo ? await fetchYoutubeRetention(videoId, token) : null
  if (curva) extra.retencao_curva = Object.entries(curva).map(([t, ret]) => ({ p: Number(t) / 40, ret })).sort((a, b) => a.p - b.p)
  const orig = await relatorio('views', 'insightTrafficSourceType')
  if (orig.length) extra.origens = Object.fromEntries(orig.map(([o, v]) => [String(o), Number(v)]))
  const detalhe: Record<string, Record<string, number>> = {}
  for (const [tipo] of orig) {
    if (!COM_DETALHE.includes(String(tipo))) continue
    const rows = await relatorio('views', 'insightTrafficSourceDetail', `;insightTrafficSourceType==${tipo}`)
    if (rows.length) detalhe[String(tipo)] = Object.fromEntries(rows.slice(0, 25).map(([d, v]) => [String(d), Number(v)]))
  }
  if (Object.keys(detalhe).length) extra.origens_detalhe = detalhe
  return extra
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function registra(supabase: any, status: string, detalhes: Record<string, unknown>, http: number) {
  await supabase.schema('pulso_content').from('logs_workflows').insert({ workflow_name: 'COLETAR_LONGOS', status, detalhes })
  return NextResponse.json({ status, ...detalhes }, { status: http })
}
