import { NextRequest, NextResponse } from 'next/server'
import { guardApi } from '@/lib/auth/api-guard'
import { getSupabaseAdminClient } from '@/lib/supabase/server'

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function registra(supabase: any, status: string, detalhes: Record<string, unknown>, http: number) {
  await supabase.schema('pulso_content').from('logs_workflows').insert({ workflow_name: 'COLETAR_LONGOS', status, detalhes })
  return NextResponse.json({ status, ...detalhes }, { status: http })
}
