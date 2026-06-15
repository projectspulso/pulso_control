import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { guardApi } from '@/lib/auth/api-guard'

/**
 * POST|GET /api/automation/reconciliar-publicacoes
 *
 * Descobre vídeos publicados nas redes que AINDA NÃO estão em
 * pulso_content.metricas_publicacao e os AUTO-CADASTRA. Resolve a subcontagem
 * causada por posts feitos fora do app (FB manual, TikTok no celular, YT Studio):
 * a coleta de métricas é só-update e nunca descobre vídeo novo — este endpoint sim.
 *
 * Matching: âncora Instagram. O IG é publicado via Graph API (auto-registrado),
 * então cada media IG tem ideia_id. Casa a legenda do órfão (TikTok/FB/YT) contra
 * as legendas IG por similaridade de tokens (Jaccard). Aceita só alta confiança
 * (best>=0.30 E best-second>=0.15); o resto vai pra "revisar" (nunca chuta).
 *
 * INSERT-ONLY e idempotente: pula post_id já cadastrado, nunca apaga/altera.
 * Fontes: TikTok video.list · Facebook /videos · YouTube uploads do canal.
 */

const GRAPH = 'https://graph.facebook.com/v23.0'

const STOP = new Set('de do da dos das o a os as e que um uma em no na para por com se ao the of to is'.split(' '))
function tokens(s: string): Set<string> {
  const norm = (s || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase()
  return new Set((norm.match(/[a-z0-9]+/g) || []).filter((t) => t.length > 2 && !STOP.has(t)))
}
function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0
  let inter = 0
  for (const t of a) if (b.has(t)) inter++
  return inter / (a.size + b.size - inter)
}

interface Orfao { plataforma: string; post_id: string; caption: string; url: string; data: string }

async function reconciliar(request: NextRequest) {
  const denied = await guardApi(request)
  if (denied) return denied

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseAdminClient() as any
  const token = process.env.INSTAGRAM_ACCESS_TOKEN
  const igUserId = process.env.META_IG_USER_ID
  const pageId = process.env.META_PAGE_ID
  const ytKey = process.env.YOUTUBE_API_KEY

  // 1) estado atual: post_ids cadastrados por rede + mapa ideia->roteiro
  const { data: pubs, error: pErr } = await supabase
    .schema('pulso_content')
    .from('metricas_publicacao')
    .select('post_id, ideia_id, roteiro_id, plataforma, url_publicacao')
  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 })

  const registrados = new Set<string>()
  const roteiroDeIdeia = new Map<string, string | null>()
  const igRows: Array<{ post_id: string; ideia_id: string }> = []
  let ttHandle = 'pulsohistorias'
  for (const p of pubs || []) {
    if (p.post_id) registrados.add(String(p.post_id))
    if (p.ideia_id && !roteiroDeIdeia.has(p.ideia_id)) roteiroDeIdeia.set(p.ideia_id, p.roteiro_id ?? null)
    if (p.plataforma === 'instagram' && p.post_id && p.ideia_id) igRows.push({ post_id: p.post_id, ideia_id: p.ideia_id })
    if (p.plataforma === 'tiktok' && p.url_publicacao) {
      const m = String(p.url_publicacao).match(/@([\w.]+)/)
      if (m) ttHandle = m[1]
    }
  }

  // 2) âncora IG: ideia_id -> tokens(legenda)
  const ancora: Array<{ ideia_id: string; toks: Set<string> }> = []
  if (token && igUserId) {
    const r = await fetch(`${GRAPH}/${igUserId}/media?fields=id,caption&limit=50&access_token=${token}`).then((x) => x.json()).catch(() => null)
    const byId = new Map(igRows.map((x) => [x.post_id, x.ideia_id]))
    for (const m of r?.data || []) {
      const iid = byId.get(m.id)
      if (iid) ancora.push({ ideia_id: iid, toks: tokens(m.caption || '') })
    }
  }
  function casar(caption: string): { ideia_id: string | null; best: number; second: number } {
    const t = tokens(caption)
    let best = 0, second = 0, ideia_id: string | null = null
    for (const a of ancora) {
      const s = jaccard(t, a.toks)
      if (s > best) { second = best; best = s; ideia_id = a.ideia_id }
      else if (s > second) second = s
    }
    return { ideia_id, best, second }
  }

  // 3) coleta os vídeos de cada rede (cada uma isolada)
  const orfaos: Orfao[] = []
  const avisos: string[] = []

  // --- TikTok ---
  try {
    const { data: cfg } = await supabase.schema('pulso_core').from('configuracoes').select('valor').eq('chave', 'tiktok_oauth').single()
    if (cfg?.valor) {
      let oauth = JSON.parse(cfg.valor)
      if (Date.now() > oauth.expires_at - 60_000 && oauth.refresh_token) {
        const rr = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
          method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_key: (process.env.TIKTOK_SANDBOX_KEY || process.env.TIKTOK_CLIENT_KEY) ?? '',
            client_secret: (process.env.TIKTOK_SANDBOX_SECRET || process.env.TIKTOK_CLIENT_SECRET) ?? '',
            grant_type: 'refresh_token', refresh_token: oauth.refresh_token,
          }),
        }).then((x) => x.json())
        if (rr.access_token) {
          oauth = { ...oauth, access_token: rr.access_token, refresh_token: rr.refresh_token, expires_at: Date.now() + (rr.expires_in || 86400) * 1000 }
          await supabase.schema('pulso_core').from('configuracoes').update({ valor: JSON.stringify(oauth) }).eq('chave', 'tiktok_oauth')
        }
      }
      const lista = await fetch('https://open.tiktokapis.com/v2/video/list/?fields=id,title,create_time', {
        method: 'POST', headers: { Authorization: `Bearer ${oauth.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ max_count: 20 }),
      }).then((x) => x.json())
      for (const v of lista?.data?.videos || []) {
        const id = String(v.id)
        if (registrados.has(id)) continue
        orfaos.push({ plataforma: 'tiktok', post_id: id, caption: v.title || '',
          url: `https://www.tiktok.com/@${ttHandle}/video/${id}`,
          data: v.create_time ? new Date(v.create_time * 1000).toISOString() : new Date().toISOString() })
      }
    } else avisos.push('TikTok sem token configurado')
  } catch (e) { avisos.push(`TikTok falhou: ${e instanceof Error ? e.message : 'erro'}`) }

  // --- Facebook (/videos cobre os reels com o system token) ---
  try {
    if (token && pageId) {
      const r = await fetch(`${GRAPH}/${pageId}/videos?fields=id,description,created_time&limit=50&access_token=${token}`).then((x) => x.json())
      if (r.error) avisos.push(`Facebook: ${r.error.message}`)
      for (const v of r?.data || []) {
        const id = String(v.id)
        if (registrados.has(id)) continue
        orfaos.push({ plataforma: 'facebook', post_id: id, caption: v.description || '',
          url: `https://www.facebook.com/reel/${id}`, data: v.created_time || new Date().toISOString() })
      }
    }
  } catch (e) { avisos.push(`Facebook falhou: ${e instanceof Error ? e.message : 'erro'}`) }

  // --- YouTube (uploads do canal via playlist) ---
  try {
    if (ytKey) {
      const algumYt = (pubs || []).find((p: { plataforma: string; post_id?: string }) => p.plataforma === 'youtube' && p.post_id)?.post_id
      if (algumYt) {
        const ch = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${algumYt}&key=${ytKey}`).then((x) => x.json())
        const channelId = ch?.items?.[0]?.snippet?.channelId
        if (channelId) {
          const chDet = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${ytKey}`).then((x) => x.json())
          const uploads = chDet?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads
          if (uploads) {
            const pl = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${uploads}&key=${ytKey}`).then((x) => x.json())
            for (const it of pl?.items || []) {
              const id = it?.contentDetails?.videoId
              if (!id || registrados.has(String(id))) continue
              orfaos.push({ plataforma: 'youtube', post_id: String(id), caption: it?.snippet?.title || '',
                url: `https://youtube.com/shorts/${id}`, data: it?.contentDetails?.videoPublishedAt || new Date().toISOString() })
            }
          }
        }
      }
    } else avisos.push('YOUTUBE_API_KEY ausente — YouTube ignorado')
  } catch (e) { avisos.push(`YouTube falhou: ${e instanceof Error ? e.message : 'erro'}`) }

  // 4) casa cada órfão e cadastra os de alta confiança
  const registrar: Array<Record<string, unknown>> = []
  const revisar: Array<{ plataforma: string; post_id: string; caption: string; best: number }> = []
  for (const o of orfaos) {
    const { ideia_id, best, second } = casar(o.caption)
    if (ideia_id && best >= 0.3 && best - second >= 0.15) {
      registrar.push({
        ideia_id, roteiro_id: roteiroDeIdeia.get(ideia_id) ?? null, plataforma: o.plataforma,
        url_publicacao: o.url, post_id: o.post_id, data_publicacao: o.data,
      })
    } else {
      revisar.push({ plataforma: o.plataforma, post_id: o.post_id, caption: o.caption.slice(0, 60), best: Number(best.toFixed(2)) })
    }
  }

  let inseridos = 0
  if (registrar.length > 0) {
    const { error: insErr } = await supabase.schema('pulso_content').from('metricas_publicacao').insert(registrar)
    if (insErr) return NextResponse.json({ error: `Insert falhou: ${insErr.message}`, registrar }, { status: 500 })
    inseridos = registrar.length
  }

  const porRede: Record<string, number> = {}
  for (const r of registrar) porRede[r.plataforma as string] = (porRede[r.plataforma as string] || 0) + 1

  return NextResponse.json({
    success: true,
    orfaos_encontrados: orfaos.length,
    inseridos,
    por_rede: porRede,
    revisar,
    avisos: avisos.length ? avisos : undefined,
    registrados: registrar.map((r) => ({ plataforma: r.plataforma, post_id: r.post_id })),
  })
}

export async function POST(request: NextRequest) {
  return reconciliar(request)
}

export async function GET(request: NextRequest) {
  return reconciliar(request)
}
