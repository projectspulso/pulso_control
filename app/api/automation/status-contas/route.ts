import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { GATES_MONETIZACAO } from '@/lib/config/monetizacao'

const REDES = ['youtube', 'instagram', 'facebook', 'tiktok', 'kwai'] as const

/**
 * GET /api/automation/status-contas
 *
 * Seguidores/inscritos atuais de cada conta PULSO — alimenta o placar
 * "Rumo à monetização" do /analytics (gates em lib/config/monetizacao.ts).
 */

const GRAPH = 'https://graph.facebook.com/v23.0'
const YT_CHANNEL_ID = 'UCqrAzwWiKvphDqH2o6PGzBw'

export async function GET() {
  const contas: Record<string, { seguidores: number | null; detalhe?: string }> = {
    youtube: { seguidores: null },
    instagram: { seguidores: null },
    facebook: { seguidores: null },
    tiktok: { seguidores: null },
    kwai: { seguidores: null },
  }
  const avisos: string[] = []
  let ytViewsCanal: number | null = null

  const token = process.env.INSTAGRAM_ACCESS_TOKEN
  const igUserId = process.env.META_IG_USER_ID || '17841478757082171'
  const pageId = process.env.META_PAGE_ID || '926237593895365'

  // YouTube — inscritos do canal
  if (process.env.YOUTUBE_API_KEY) {
    try {
      const url = new URL('https://www.googleapis.com/youtube/v3/channels')
      url.searchParams.set('part', 'statistics')
      url.searchParams.set('id', YT_CHANNEL_ID)
      url.searchParams.set('key', process.env.YOUTUBE_API_KEY)
      const j = await fetch(url).then((r) => r.json())
      const st = j?.items?.[0]?.statistics
      if (st) {
        ytViewsCanal = Number(st.viewCount || 0)
        contas.youtube = {
          seguidores: Number(st.subscriberCount || 0),
          detalhe: `${st.viewCount} views totais no canal`,
        }
      }
    } catch (e) {
      avisos.push(`youtube: ${e instanceof Error ? e.message : 'erro'}`)
    }
  } else {
    avisos.push('YOUTUBE_API_KEY ausente')
  }

  // Instagram + Facebook via Graph API
  if (token) {
    try {
      const ig = await fetch(`${GRAPH}/${igUserId}?fields=followers_count&access_token=${token}`).then((r) => r.json())
      if (typeof ig.followers_count === 'number') contas.instagram = { seguidores: ig.followers_count }
    } catch (e) {
      avisos.push(`instagram: ${e instanceof Error ? e.message : 'erro'}`)
    }
    try {
      const fb = await fetch(`${GRAPH}/${pageId}?fields=followers_count,fan_count&access_token=${token}`).then((r) => r.json())
      const seg = fb.followers_count ?? fb.fan_count
      if (typeof seg === 'number') contas.facebook = { seguidores: seg }
    } catch (e) {
      avisos.push(`facebook: ${e instanceof Error ? e.message : 'erro'}`)
    }
  } else {
    avisos.push('INSTAGRAM_ACCESS_TOKEN ausente')
  }

  // TikTok — follower_count via Display API (token em pulso_core.configuracoes, com refresh)
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = getSupabaseAdminClient() as any
    const { data: cfg } = await supabase
      .schema('pulso_core').from('configuracoes').select('valor').eq('chave', 'tiktok_oauth').single()
    if (cfg?.valor) {
      let oauth = JSON.parse(cfg.valor)
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
          oauth = { ...oauth, access_token: r.access_token, refresh_token: r.refresh_token,
            expires_at: Date.now() + (r.expires_in || 86400) * 1000 }
          await supabase.schema('pulso_core').from('configuracoes')
            .update({ valor: JSON.stringify(oauth) }).eq('chave', 'tiktok_oauth')
        }
      }
      const info = await fetch(
        'https://open.tiktokapis.com/v2/user/info/?fields=follower_count,likes_count',
        { headers: { Authorization: `Bearer ${oauth.access_token}` } }
      ).then((x) => x.json())
      const fc = info?.data?.user?.follower_count
      if (typeof fc === 'number') {
        contas.tiktok = { seguidores: fc, detalhe: `${info.data.user.likes_count ?? 0} likes na conta` }
      }
    }
  } catch (e) {
    avisos.push(`tiktok: ${e instanceof Error ? e.message : 'erro'}`)
  }

  // Kwai — sem API pública; seguidores vêm do lançamento manual (config kwai_perfil)
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = getSupabaseAdminClient() as any
    const { data: cfg } = await supabase
      .schema('pulso_core').from('configuracoes').select('valor').eq('chave', 'kwai_perfil').single()
    if (cfg?.valor) {
      const perfil = typeof cfg.valor === 'string' ? JSON.parse(cfg.valor) : cfg.valor
      if (typeof perfil?.seguidores === 'number') {
        contas.kwai = { seguidores: perfil.seguidores, detalhe: `${perfil.curtidas ?? 0} curtidas · manual` }
      }
    }
  } catch (e) {
    avisos.push(`kwai: ${e instanceof Error ? e.message : 'erro'}`)
  }

  // ── snapshot diário de seguidores + ritmo/ETA ──────────────────────────────
  // Histórico mora em pulso_core.configuracoes['seguidores_historico'] (sem tabela nova).
  // 1 entrada por dia; ritmo = inclinação dos últimos ~28d; ETA = faltam / ritmo.
  type Snap = { data: string; [k: string]: number | string | null }
  const projecao: Record<string, { porSemana: number | null; etaSemanas: number | null; gate: number }> = {}
  let historico: Snap[] = []
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = getSupabaseAdminClient() as any
    const hoje = new Date().toISOString().slice(0, 10)
    const { data: cfg } = await supabase
      .schema('pulso_core').from('configuracoes').select('valor').eq('chave', 'seguidores_historico').maybeSingle()
    let hist: Snap[] = []
    if (cfg?.valor) {
      const v = typeof cfg.valor === 'string' ? JSON.parse(cfg.valor) : cfg.valor
      if (Array.isArray(v?.historico)) hist = v.historico
    }

    const entradaHoje: Snap = { data: hoje }
    for (const rede of REDES) {
      const s = contas[rede]?.seguidores
      entradaHoje[rede] = typeof s === 'number' ? s : null
    }
    entradaHoje.views_canal = ytViewsCanal

    // só grava se houver ao menos 1 número real (evita zerar histórico se as APIs falharem)
    const temDado = REDES.some((r) => typeof entradaHoje[r] === 'number')
    if (temDado) {
      hist = hist.filter((h) => h.data !== hoje)
      hist.push(entradaHoje)
      hist.sort((a, b) => (a.data < b.data ? -1 : 1))
      hist = hist.slice(-180)
      const payload = JSON.stringify({ historico: hist })
      const { data: upd } = await supabase
        .schema('pulso_core').from('configuracoes').update({ valor: payload }).eq('chave', 'seguidores_historico').select('chave')
      if (!upd || upd.length === 0) {
        await supabase.schema('pulso_core').from('configuracoes').insert({ chave: 'seguidores_historico', valor: payload })
      }
    }
    historico = hist.slice(-60)

    for (const g of GATES_MONETIZACAO) {
      const pts = hist.filter((h) => typeof h[g.plataforma] === 'number')
      let porSemana: number | null = null
      if (pts.length >= 2) {
        const recentes = pts.filter((h) => (Date.now() - new Date(h.data).getTime()) / 864e5 <= 28)
        const use = recentes.length >= 2 ? recentes : pts
        const a = use[0]
        const b = use[use.length - 1]
        const dias = Math.max(1, (new Date(b.data).getTime() - new Date(a.data).getTime()) / 864e5)
        porSemana = (((b[g.plataforma] as number) - (a[g.plataforma] as number)) / dias) * 7
      }
      const atual = contas[g.plataforma]?.seguidores ?? null
      const usaAtalho = !!g.gateRapido && atual !== null && atual < g.gateRapido.meta
      const meta = usaAtalho ? g.gateRapido!.meta : g.metaSeguidores
      let etaSemanas: number | null = null
      if (porSemana !== null && porSemana > 0 && atual !== null) {
        etaSemanas = Math.ceil(Math.max(0, meta - atual) / porSemana)
      }
      projecao[g.plataforma] = {
        porSemana: porSemana === null ? null : Math.round(porSemana * 10) / 10,
        etaSemanas,
        gate: meta,
      }
    }
  } catch (e) {
    avisos.push(`projecao: ${e instanceof Error ? e.message : 'erro'}`)
  }

  return NextResponse.json({ contas, projecao, historico, avisos, coletado_em: new Date().toISOString() })
}
