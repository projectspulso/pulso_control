import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { guardApi } from '@/lib/auth/api-guard'

/**
 * POST|GET /api/automation/resolver-post-ids
 *
 * AUTO-HEAL dos posts manuais. Todo post feito na mão (Business Suite / celular) nasce
 * sem o id certo: IG grava o shortcode em vez do media_id numérico, FB/TikTok ficam sem id.
 * Sem post_id válido, o coletor de métricas pula a linha → views ficam zeradas.
 *
 * Esta rota acha o id sozinho: puxa as mídias recentes de cada rede (IG/FB/TikTok),
 * casa com a ideia pela legenda/título e grava post_id (+ url). Depois o coletor puxa normal.
 * Roda antes do coletar-metricas (ou sob demanda).
 */

const GRAPH = 'https://graph.facebook.com/v23.0'

function tokens(texto: string): string[] {
  return (texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2)
}
// casa palavra: igualdade OU prefixo (≥5 chars) — pega "brilha"⊂"brilhando", "desaparec"⊂"desaparecimento"
function matchTok(w: string, b: Set<string>): boolean {
  if (b.has(w)) return true
  if (w.length >= 5) {
    for (const x of b) {
      if (x.length >= 5 && (x.startsWith(w.slice(0, 5)) || w.startsWith(x.slice(0, 5)))) return true
    }
  }
  return false
}
function overlap(a: string[], b: Set<string>): number {
  return a.reduce((n, w) => n + (matchTok(w, b) ? 1 : 0), 0)
}
const soDigitos = (s: string | null) => !!s && /^\d+$/.test(s)

interface Item {
  id: string
  url: string
  toks: Set<string>
}

// casa cada órfão com o melhor item disponível (guloso, sem reusar item — evita colisão)
function casar(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  orfaos: { row: any; texto: string }[],
  itens: Item[],
): { rowId: string; postId: string; url: string }[] {
  const usados = new Set<string>()
  const pares: { rowId: string; postId: string; url: string; sc: number }[] = []
  for (const o of orfaos) {
    const toks = tokens(o.texto)
    let melhor: Item | null = null
    let sc = 0
    let segundo = 0 // 2º melhor score — usado pra exigir vitória CLARA (evita atribuir errado)
    for (const it of itens) {
      if (usados.has(it.id)) continue
      const s = overlap(toks, it.toks)
      if (s > sc) {
        segundo = sc
        sc = s
        melhor = it
      } else if (s > segundo) {
        segundo = s
      }
    }
    // só casa com confiança: score forte E claramente à frente do 2º (senão deixa pro manual)
    if (melhor && sc >= 4 && sc - segundo >= 3) {
      usados.add(melhor.id)
      pares.push({ rowId: o.row.id, postId: melhor.id, url: melhor.url, sc })
    }
  }
  return pares
}

async function getTikTokToken(supabase: unknown): Promise<string | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any
  const { data: cfg } = await sb.schema('pulso_core').from('configuracoes').select('valor').eq('chave', 'tiktok_oauth').single()
  if (!cfg?.valor) return null
  let oauth = typeof cfg.valor === 'string' ? JSON.parse(cfg.valor) : cfg.valor
  if (Date.now() > oauth.expires_at - 60_000 && oauth.refresh_token) {
    const r = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_key: (process.env.TIKTOK_SANDBOX_KEY || process.env.TIKTOK_CLIENT_KEY) ?? '',
        client_secret: (process.env.TIKTOK_SANDBOX_SECRET || process.env.TIKTOK_CLIENT_SECRET) ?? '',
        grant_type: 'refresh_token',
        refresh_token: oauth.refresh_token,
      }),
    }).then((x) => x.json())
    if (r.access_token) {
      oauth = { ...oauth, access_token: r.access_token, refresh_token: r.refresh_token, expires_at: Date.now() + (r.expires_in || 86400) * 1000 }
      await sb.schema('pulso_core').from('configuracoes').update({ valor: JSON.stringify(oauth) }).eq('chave', 'tiktok_oauth')
    }
  }
  return oauth.access_token || null
}

async function itensInstagram(): Promise<Item[]> {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN || process.env.META_SYSTEM_USER_TOKEN
  const ig = process.env.META_IG_USER_ID || '17841478757082171'
  if (!token) return []
  const url = `${GRAPH}/${ig}/media?fields=id,permalink,caption&limit=50&access_token=${encodeURIComponent(token)}`
  const d = await fetch(url).then((r) => r.json()).catch(() => ({}))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (d.data || []).map((m: any) => ({ id: m.id, url: m.permalink || '', toks: new Set(tokens(m.caption)) }))
}
async function itensFacebook(): Promise<Item[]> {
  const token = process.env.META_PAGE_ACCESS_TOKEN || process.env.META_SYSTEM_USER_TOKEN
  const page = process.env.META_PAGE_ID || '926237593895365'
  if (!token) return []
  const url = `${GRAPH}/${page}/video_reels?fields=id,description&limit=50&access_token=${encodeURIComponent(token)}`
  const d = await fetch(url).then((r) => r.json()).catch(() => ({}))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (d.data || []).map((v: any) => ({ id: v.id, url: `https://www.facebook.com/reel/${v.id}`, toks: new Set(tokens(v.description)) }))
}
async function itensTikTok(supabase: unknown): Promise<Item[]> {
  const token = await getTikTokToken(supabase)
  if (!token) return []
  const fields = 'id,title,video_description,share_url'
  const d = await fetch(`https://open.tiktokapis.com/v2/video/list/?fields=${encodeURIComponent(fields)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ max_count: 20 }),
  }).then((r) => r.json()).catch(() => ({}))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (d.data?.videos || []).map((v: any) => ({ id: String(v.id), url: v.share_url || '', toks: new Set(tokens(`${v.title || ''} ${v.video_description || ''}`)) }))
}

async function resolver(request: NextRequest) {
  const denied = await guardApi(request)
  if (denied) return denied
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseAdminClient() as any

  const [{ data: ideias }, { data: linhas }, { data: roteiros }] = await Promise.all([
    supabase.schema('pulso_content').from('ideias').select('id, titulo'),
    supabase.schema('pulso_content').from('metricas_publicacao').select('id, ideia_id, plataforma, post_id, url_publicacao').in('plataforma', ['instagram', 'facebook', 'tiktok']),
    supabase.schema('pulso_content').from('roteiros').select('ideia_id, conteudo_md'),
  ])
  const tituloDe = new Map<string, string>((ideias || []).map((i: { id: string; titulo: string }) => [i.id, i.titulo]))
  // roteiro por ideia (conteúdo real do vídeo — de onde saem as legendas; casa muito melhor que só o título)
  const roteiroDe = new Map<string, string>()
  for (const r of (roteiros || []) as { ideia_id: string; conteudo_md: string }[]) {
    if (r.ideia_id && r.conteudo_md && !roteiroDe.has(r.ideia_id)) roteiroDe.set(r.ideia_id, r.conteudo_md.slice(0, 400))
  }
  // texto de casamento = título + trecho do roteiro (cobre legendas reescritas na publicação manual)
  const textoDe = (id: string) => `${tituloDe.get(id) || ''} ${roteiroDe.get(id) || ''}`

  // órfão = precisa de id.
  //  IG: sem post_id OU shortcode (não-numérico — a Graph API exige o media_id numérico).
  //  TikTok: sem post_id OU rascunho `v_inbox_file~...` — o publish via API cria um rascunho e,
  //    quando o vídeo é finalizado, ganha um id REAL (numérico). O rascunho engana o `!post_id`
  //    e a linha ficava presa no id de inbox pra sempre (views zeradas). Ids reais são numéricos.
  //  FB: sem post_id.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const precisa = (l: any) => {
    if (!l.ideia_id || !tituloDe.get(l.ideia_id)) return false
    if (l.plataforma === 'instagram') return !soDigitos(l.post_id)
    if (l.plataforma === 'tiktok') return !soDigitos(l.post_id)
    return !l.post_id
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orfaos = (linhas || []).filter(precisa) as any[]
  const porRede = (p: string) => orfaos.filter((l) => l.plataforma === p).map((row) => ({ row, texto: textoDe(row.ideia_id) }))

  const igOrf = porRede('instagram')
  const fbOrf = porRede('facebook')
  const ttOrf = porRede('tiktok')

  const [igIt, fbIt, ttIt] = await Promise.all([
    igOrf.length ? itensInstagram() : Promise.resolve([]),
    fbOrf.length ? itensFacebook() : Promise.resolve([]),
    ttOrf.length ? itensTikTok(supabase) : Promise.resolve([]),
  ])

  const pares = [...casar(igOrf, igIt), ...casar(fbOrf, fbIt), ...casar(ttOrf, ttIt)]

  const agora = new Date().toISOString()
  let resolvidos = 0
  for (const p of pares) {
    const { error } = await supabase
      .schema('pulso_content')
      .from('metricas_publicacao')
      .update({ post_id: p.postId, url_publicacao: p.url, ultima_atualizacao: agora })
      .eq('id', p.rowId)
    if (!error) resolvidos++
  }

  return NextResponse.json({
    ok: true,
    orfaos: { instagram: igOrf.length, facebook: fbOrf.length, tiktok: ttOrf.length },
    resolvidos,
    nota: 'post_id/url backfillados; o coletor de métricas puxa as views no próximo ciclo.',
  })
}

export const GET = resolver
export const POST = resolver
