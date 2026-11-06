import { NextRequest, NextResponse } from 'next/server'
import { guardApi } from '@/lib/auth/api-guard'
import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { getYoutubeAccessToken } from '@/lib/youtube/oauth'
import { fetchYoutubeRetention } from '@/lib/youtube/retention'

/**
 * Coleta diária dos Longos (091, 06/11/2026). O Pulso lê pela API pública do YouTube o que é dele ler:
 * o longo no canal principal (id do vídeo no link que o digiai_mkt devolveu, ou no post_id) e os cortes
 * que saíram no YouTube do canal de cortes. As outras redes chegam pelo digiai_mkt (rpc leitura_peca_bastidores).
 * Horas de exibição e retenção do longo pedem o OAuth do canal principal (ainda não existe): ficam nulas.
 * Registra TODA rodada, inclusive a ociosa (cron nunca falha em silêncio).
 */
export const maxDuration = 60

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
  const { data: eps, error: e1 } = await supabase.schema('pulso_content').from('episodios').select('id, metadata').eq('status', 'publicado')
  if (e1) return registra(supabase, 'erro', { erro: e1.message }, 500)
  for (const ep of eps || []) {
    const id = idDoYoutube(ep.metadata?.publicacao?.post_id) || idDoYoutube(ep.metadata?.publicacao?.url)
    if (id) alvos.push({ episodio_id: ep.id, peca_id: null, canal: 'principal', rede: 'youtube', tipo: 'longo', post_id: id })
  }
  const { data: pecas, error: e2 } = await supabase.schema('pulso_content').from('corte_publicacoes')
    .select('id, rede, tipo, destino, post_id, url, episodio_cortes!inner(episodio_id)')
    .eq('status', 'publicado').eq('rede', 'youtube')
  if (e2) return registra(supabase, 'erro', { erro: e2.message }, 500)
  for (const p of pecas || []) {
    const id = idDoYoutube(p.post_id) || idDoYoutube(p.url)
    if (id) alvos.push({ episodio_id: p.episodio_cortes.episodio_id, peca_id: p.id, canal: p.destino === 'digiai' ? 'digiai' : 'cortes', rede: 'youtube', tipo: p.tipo, post_id: id })
  }

  const falhas: string[] = []
  let gravadas = 0
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
    // o longo sai no PULSO Histórias (dono, 06/11), canal que já tem o acesso ao Analytics: horas, retenção e origens
    const token = linhas.some((l) => l.tipo === 'longo') ? await getYoutubeAccessToken().catch(() => null) : null
    for (const l of linhas) {
      if (l.tipo !== 'longo') continue
      if (!token) { falhas.push(`${l.post_id}: sem acesso ao Analytics do canal`); continue }
      Object.assign(l, await analyticsDoLongo(l.post_id, token, falhas))
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

  // inscritos do principal e do canal de cortes no YouTube, quando o id do canal estiver na config
  const { data: cfg } = await supabase.schema('pulso_core').from('configuracoes').select('valor').eq('chave', 'cortes_destinos').maybeSingle()
  let inscritos = 0
  try {
    const v = JSON.parse(cfg?.valor || '{}')
    const canais = [
      { canal: 'principal', id: v.principal?.channel_id },
      { canal: 'cortes', id: (v.destinos || []).find((d: { id: string }) => d.id === 'bastidores')?.youtube_channel_id },
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
        const { error } = await supabase.schema('pulso_analytics').from('seguidores_longos')
          .upsert({ canal: c.canal, rede: 'youtube', data_ref, seguidores: Number(it.statistics.subscriberCount || 0), fonte: 'pulso', coletado_em: new Date().toISOString() }, { onConflict: 'canal,rede,data_ref' })
        if (error) falhas.push(`canal ${c.canal}: ${error.message}`)
        else inscritos += 1
      }
    }
  } catch (e) {
    falhas.push(`config: ${(e as Error).message}`)
  }

  const status = !alvos.length && !inscritos ? 'ocioso' : falhas.length ? 'parcial' : 'sucesso'
  return registra(supabase, status, { data_ref, alvos: alvos.length, gravadas, canais_lidos: inscritos, falhas }, 200)
}

/** Horas, retenção média, curva e origens do longo. O Analytics atrasa ~48 h: vídeo novo volta vazio e fica nulo. */
async function analyticsDoLongo(videoId: string, token: string, falhas: string[]) {
  const hoje = new Date().toISOString().slice(0, 10)
  const relatorio = async (metrics: string, dimensions?: string) => {
    const url = new URL('https://youtubeanalytics.googleapis.com/v2/reports')
    url.searchParams.set('ids', 'channel==MINE')
    url.searchParams.set('startDate', '2026-01-01')
    url.searchParams.set('endDate', hoje)
    url.searchParams.set('metrics', metrics)
    url.searchParams.set('filters', `video==${videoId}`)
    if (dimensions) url.searchParams.set('dimensions', dimensions)
    const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    if (!r.ok) { falhas.push(`${videoId}: Analytics ${r.status}`); return [] }
    return ((await r.json()).rows || []) as (string | number)[][]
  }
  const extra: { horas_exibicao?: number; retencao_media_pct?: number; retencao_curva?: { p: number; ret: number }[]; origens?: Record<string, number> } = {}
  const [tot] = await relatorio('views,estimatedMinutesWatched,averageViewPercentage')
  if (tot && Number(tot[0]) > 0) {
    extra.horas_exibicao = Math.round((Number(tot[1]) / 60) * 10) / 10
    extra.retencao_media_pct = Math.round(Number(tot[2]) * 10) / 10
  }
  const curva = await fetchYoutubeRetention(videoId, token)
  if (curva) extra.retencao_curva = Object.entries(curva).map(([t, ret]) => ({ p: Number(t) / 40, ret })).sort((a, b) => a.p - b.p)
  const orig = await relatorio('views', 'insightTrafficSourceType')
  if (orig.length) extra.origens = Object.fromEntries(orig.map(([o, v]) => [String(o), Number(v)]))
  return extra
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function registra(supabase: any, status: string, detalhes: Record<string, unknown>, http: number) {
  await supabase.schema('pulso_content').from('logs_workflows').insert({ workflow_name: 'COLETAR_LONGOS', status, detalhes })
  return NextResponse.json({ status, ...detalhes }, { status: http })
}
