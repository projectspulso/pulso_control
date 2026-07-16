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
 * (best>=0.25 E best-second>=0.15 — a margem evita casar ambíguo); o resto vai
 * pra "revisar" (nunca chuta). Órfão SEM legenda (FB manual sem texto) nunca casa
 * por aqui — registrar na mão. Lição: ao publicar manual, sempre colar a legenda.
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
  // Facebook /videos é edge de PÁGINA: o INSTAGRAM_ACCESS_TOKEN (IG-scoped) lê seguidores
  // mas pode devolver [] em /videos sem erro — foi o que sumiu os reels de 16/07 em silêncio.
  // O system user token é page-scoped e sem expiração (ver meta-api-pulso).
  const pageToken = process.env.META_SYSTEM_USER_TOKEN || process.env.META_PAGE_ACCESS_TOKEN || token
  // diagnóstico: quantos itens cada rede devolveu vs quantos viraram órfão novo — mata a
  // cegueira "0 órfãos" que não distinguia "não varri" de "varri e não achei nada".
  const varridos: Record<string, { api: number; novos: number }> = {}

  // 1) estado atual: post_ids cadastrados por rede + mapa ideia->roteiro
  const { data: pubs, error: pErr } = await supabase
    .schema('pulso_content')
    .from('metricas_publicacao')
    .select('id, post_id, ideia_id, roteiro_id, plataforma, url_publicacao')
  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 })

  const registrados = new Set<string>()
  const roteiroDeIdeia = new Map<string, string | null>()
  const igRows: Array<{ post_id: string; ideia_id: string }> = []
  // rascunhos do TikTok (post_id v_inbox_file~...): ideia_id -> row id, p/ PROMOVER quando o vídeo público aparecer
  const draftTikTok = new Map<string, string>()
  let ttHandle = 'pulsohistorias'
  for (const p of pubs || []) {
    if (p.post_id) registrados.add(String(p.post_id))
    if (p.ideia_id && !roteiroDeIdeia.has(p.ideia_id)) roteiroDeIdeia.set(p.ideia_id, p.roteiro_id ?? null)
    if (p.plataforma === 'instagram' && p.post_id && p.ideia_id) igRows.push({ post_id: p.post_id, ideia_id: p.ideia_id })
    if (p.plataforma === 'tiktok' && p.url_publicacao) {
      const m = String(p.url_publicacao).match(/@([\w.]+)/)
      if (m) ttHandle = m[1]
    }
    if (p.plataforma === 'tiktok' && p.ideia_id && String(p.post_id || '').startsWith('v_inbox_file') && p.id) {
      draftTikTok.set(p.ideia_id, String(p.id))
    }
  }

  const avisos: string[] = []

  // 2) âncora: ideia_id -> tokens. Fontes por ideia: caption do pipeline (texto EXATO que
  //    publicamos — a âncora mais forte), TÍTULO da ideia e caption do IG.
  //    idsAlvo = TODA ideia com qualquer publicação. Antes era só quem tinha linha de IG,
  //    o que criava um ovo-e-galinha: se o publish do IG morreu no timeout da Vercel, a ideia
  //    ficava SEM âncora e os órfãos de FB/TikTok dela nunca casavam.
  const ancora: Array<{ ideia_id: string; toks: Set<string> }> = []
  const idsAlvo = [
    ...new Set((pubs || []).map((p: { ideia_id?: string | null }) => p.ideia_id).filter(Boolean)),
  ] as string[]

  // mídias do IG: viram âncora (as já registradas) E órfão (as que faltam) — ver bloco 3
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let igMedia: any[] = []
  if (token && igUserId) {
    const r = await fetch(`${GRAPH}/${igUserId}/media?fields=id,caption,permalink,timestamp&limit=50&access_token=${token}`)
      .then((x) => x.json())
      .catch(() => null)
    if (r?.error) avisos.push(`Instagram: ${r.error.message}`)
    igMedia = r?.data || []
    const byId = new Map(igRows.map((x) => [x.post_id, x.ideia_id]))
    for (const m of igMedia) {
      const iid = byId.get(m.id)
      if (iid) ancora.push({ ideia_id: iid, toks: tokens(m.caption || '') })
    }
  }
  if (idsAlvo.length) {
    const { data: ideias } = await supabase.schema('pulso_content').from('ideias').select('id, titulo').in('id', idsAlvo)
    for (const i of ideias || []) if (i.titulo) ancora.push({ ideia_id: i.id, toks: tokens(i.titulo) })
    const { data: pipe } = await supabase
      .schema('pulso_content').from('pipeline_producao').select('ideia_id, metadata').in('ideia_id', idsAlvo)
    for (const p of (pipe || []) as Array<{ ideia_id: string; metadata: Record<string, unknown> | null }>) {
      const cap = (p.metadata || {}).caption
      if (p.ideia_id && cap) ancora.push({ ideia_id: p.ideia_id, toks: tokens(String(cap)) })
    }
  }
  function casar(caption: string): { ideia_id: string | null; best: number; second: number } {
    const t = tokens(caption)
    // melhor score POR IDEIA (uma ideia tem 2 âncoras: caption + título)
    const porIdeia = new Map<string, number>()
    for (const a of ancora) {
      const s = jaccard(t, a.toks)
      if (s > (porIdeia.get(a.ideia_id) ?? 0)) porIdeia.set(a.ideia_id, s)
    }
    // best/second entre IDEIAS DISTINTAS (margem não conta a 2ª âncora da mesma ideia)
    let best = 0, second = 0, ideia_id: string | null = null
    for (const [id, s] of porIdeia) {
      if (s > best) { second = best; best = s; ideia_id = id }
      else if (s > second) second = s
    }
    return { ideia_id, best, second }
  }

  // 3) coleta os vídeos de cada rede (cada uma isolada)
  const orfaos: Orfao[] = []

  // --- Instagram: a linha PODE faltar. O publish via Vercel estoura os 60s e morre ANTES de
  //     gravar em metricas_publicacao — o reel fica no ar e o app nem sabe que existe.
  //     Antes o IG era só âncora (fonte da verdade) e nunca era varrido como órfão. ---
  let igNovos = 0
  for (const m of igMedia) {
    const id = String(m.id)
    if (registrados.has(id)) continue
    orfaos.push({
      plataforma: 'instagram', post_id: id, caption: m.caption || '',
      url: m.permalink || '', data: m.timestamp || new Date().toISOString(),
    })
    igNovos++
  }
  varridos.instagram = { api: igMedia.length, novos: igNovos }

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
      const vids = lista?.data?.videos || []
      let ttNovos = 0
      for (const v of vids) {
        const id = String(v.id)
        if (registrados.has(id)) continue
        orfaos.push({ plataforma: 'tiktok', post_id: id, caption: v.title || '',
          url: `https://www.tiktok.com/@${ttHandle}/video/${id}`,
          data: v.create_time ? new Date(v.create_time * 1000).toISOString() : new Date().toISOString() })
        ttNovos++
      }
      varridos.tiktok = { api: vids.length, novos: ttNovos }
    } else avisos.push('TikTok sem token configurado')
  } catch (e) { avisos.push(`TikTok falhou: ${e instanceof Error ? e.message : 'erro'}`) }

  // --- Facebook (/videos cobre os reels; usa o page/system token, não o IG-scoped) ---
  try {
    if (pageToken && pageId) {
      const r = await fetch(`${GRAPH}/${pageId}/videos?fields=id,description,created_time&limit=50&access_token=${pageToken}`).then((x) => x.json())
      if (r.error) avisos.push(`Facebook: ${r.error.message}`)
      const lista = r?.data || []
      let novos = 0
      for (const v of lista) {
        const id = String(v.id)
        if (registrados.has(id)) continue
        orfaos.push({ plataforma: 'facebook', post_id: id, caption: v.description || '',
          url: `https://www.facebook.com/reel/${id}`, data: v.created_time || new Date().toISOString() })
        novos++
      }
      varridos.facebook = { api: lista.length, novos }
    } else avisos.push('Facebook: sem page token ou META_PAGE_ID — ignorado')
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
              // casa pela DESCRIÇÃO (legenda PULSO completa, ~igual ao IG) + título — o título do Short
              // costuma ser reescrito (ex.: "1513/Antártida" no lugar de "Piri Reis") e sozinho não casa.
              const ytDesc = it?.snippet?.description || ''
              const ytTitle = it?.snippet?.title || ''
              orfaos.push({ plataforma: 'youtube', post_id: String(id), caption: `${ytDesc} ${ytTitle}`.trim(),
                url: `https://youtube.com/shorts/${id}`, data: it?.contentDetails?.videoPublishedAt || new Date().toISOString() })
            }
          }
        }
      }
    } else avisos.push('YOUTUBE_API_KEY ausente — YouTube ignorado')
  } catch (e) { avisos.push(`YouTube falhou: ${e instanceof Error ? e.message : 'erro'}`) }

  // hora real de publicação (Brasília, UTC-3) a partir do timestamp da rede → alimenta o painel de horários
  const horaBRT = (iso: string): { hora: string; dia: number; data: string } | null => {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return null
    const br = new Date(d.getTime() - 3 * 3600_000)
    const dia = br.getUTCDay() === 0 ? 7 : br.getUTCDay() // 1=Seg..7=Dom
    return { hora: br.toISOString().slice(11, 19), dia, data: br.toISOString().slice(0, 10) }
  }

  // 4) casa cada órfão e cadastra os de alta confiança
  const registrar: Array<Record<string, unknown>> = []
  const promover: Array<{ rowId: string; patch: Record<string, unknown> }> = []
  const revisar: Array<{ plataforma: string; post_id: string; caption: string; best: number }> = []
  for (const o of orfaos) {
    const { ideia_id, best, second } = casar(o.caption)
    const h = horaBRT(o.data)
    const base = {
      url_publicacao: o.url, post_id: o.post_id, data_publicacao: o.data,
      ...(h ? { hora_publicacao: h.hora, dia_semana: h.dia } : {}),
    }
    const draftId = o.plataforma === 'tiktok' && ideia_id ? draftTikTok.get(ideia_id) : undefined
    if (ideia_id && best >= 0.25 && best - second >= 0.15) {
      if (draftId) {
        promover.push({ rowId: draftId, patch: base }) // promove rascunho TikTok → vídeo real
        draftTikTok.delete(ideia_id)
      } else {
        registrar.push({ ideia_id, roteiro_id: roteiroDeIdeia.get(ideia_id) ?? null, plataforma: o.plataforma, ...base })
      }
    } else if (draftId && ideia_id && best >= 0.12) {
      // RELAXADO: a ideia tem rascunho TikTok pendente (prior forte — nós mesmos subimos) +
      // match razoável → promove o rascunho pro vídeo público real.
      promover.push({ rowId: draftId, patch: base })
      draftTikTok.delete(ideia_id)
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

  let promovidos = 0
  for (const pr of promover) {
    const { error: upErr } = await supabase.schema('pulso_content').from('metricas_publicacao').update(pr.patch).eq('id', pr.rowId)
    if (!upErr) promovidos++
  }

  const porRede: Record<string, number> = {}
  for (const r of registrar) porRede[r.plataforma as string] = (porRede[r.plataforma as string] || 0) + 1

  return NextResponse.json({
    success: true,
    orfaos_encontrados: orfaos.length,
    inseridos,
    promovidos,
    por_rede: porRede,
    varridos, // {rede: {api, novos}} — o que cada rede DEVOLVEU vs virou órfão novo
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
