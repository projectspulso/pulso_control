import { NextRequest, NextResponse } from 'next/server'
import { guardApi } from '@/lib/auth/api-guard'
import { getSupabaseAdminClient } from '@/lib/supabase/server'

/**
 * POST /api/automation/publicar-stories { momento: 'antes'|'depois' }
 *
 * MOTOR DE STORIES (dono, 03/10/2026 — plano em docs/planos/motor-stories.md). Dois momentos por
 * dia em volta do vídeo das 19h:
 *   antes  (17h BRT)  — pergunta.jpg + teaser_antes.mp4: cria expectativa ("a resposta sai às 19h")
 *   depois (19h40 BRT) — teaser_depois.mp4: "saiu, vídeo completo no perfil" — só se o vídeo saiu mesmo
 * Instagram e Facebook vão por API; TikTok e Kwai entram como linha `pendente` (modo manual) que o
 * dono marca na Central. As artes vêm do motor local (motor/gerar_stories.py) em metadata.stories.
 * Idempotente por (ideia, rede, momento, tipo): rodar de novo não duplica story.
 */

export const maxDuration = 60

const GRAPH = 'https://graph.facebook.com/v23.0'
const espera = (ms: number) => new Promise((r) => setTimeout(r, ms))

type Peca = { tipo: 'imagem' | 'video'; url: string }

async function storyInstagram(peca: Peca, igUser: string, token: string): Promise<string> {
  const p = new URLSearchParams({ media_type: 'STORIES', access_token: token })
  p.set(peca.tipo === 'imagem' ? 'image_url' : 'video_url', peca.url)
  const c = await fetch(`${GRAPH}/${igUser}/media`, { method: 'POST', body: p }).then((r) => r.json())
  if (!c?.id) throw new Error(`IG container: ${c?.error?.message || 'sem id'}`)
  if (peca.tipo === 'video') {
    let st = ''
    for (let i = 0; i < 12 && st !== 'FINISHED'; i++) {
      await espera(3000)
      st = (await fetch(`${GRAPH}/${c.id}?fields=status_code&access_token=${token}`).then((r) => r.json()))?.status_code
      if (st === 'ERROR') throw new Error('IG: processamento do vídeo falhou')
    }
    if (st !== 'FINISHED') throw new Error('IG: vídeo ainda processando (prazo)')
  }
  const pub = await fetch(`${GRAPH}/${igUser}/media_publish`, {
    method: 'POST', body: new URLSearchParams({ creation_id: c.id, access_token: token }),
  }).then((r) => r.json())
  if (!pub?.id) throw new Error(`IG publish: ${pub?.error?.message || 'sem id'}`)
  return pub.id
}

async function storyFacebook(peca: Peca, pageId: string, pageToken: string): Promise<string> {
  if (peca.tipo === 'imagem') {
    const foto = await fetch(`${GRAPH}/${pageId}/photos`, {
      method: 'POST', body: new URLSearchParams({ url: peca.url, published: 'false', access_token: pageToken }),
    }).then((r) => r.json())
    if (!foto?.id) throw new Error(`FB foto: ${foto?.error?.message || 'sem id'}`)
    const s = await fetch(`${GRAPH}/${pageId}/photo_stories`, {
      method: 'POST', body: new URLSearchParams({ photo_id: foto.id, access_token: pageToken }),
    }).then((r) => r.json())
    if (!s?.success && !s?.post_id) throw new Error(`FB story foto: ${s?.error?.message || 'falhou'}`)
    return s.post_id || foto.id
  }
  const ini = await fetch(`${GRAPH}/${pageId}/video_stories`, {
    method: 'POST', body: new URLSearchParams({ upload_phase: 'start', access_token: pageToken }),
  }).then((r) => r.json())
  if (!ini?.video_id || !ini?.upload_url) throw new Error(`FB story vídeo (start): ${ini?.error?.message || 'falhou'}`)
  const up = await fetch(ini.upload_url, {
    method: 'POST', headers: { Authorization: `OAuth ${pageToken}`, file_url: peca.url },
  }).then((r) => r.json())
  if (!up?.success) throw new Error(`FB story vídeo (upload): ${up?.error?.message || up?.debug_info?.message || 'falhou'}`)
  const fim = await fetch(`${GRAPH}/${pageId}/video_stories`, {
    method: 'POST', body: new URLSearchParams({ upload_phase: 'finish', video_id: ini.video_id, access_token: pageToken }),
  }).then((r) => r.json())
  if (!fim?.success) throw new Error(`FB story vídeo (finish): ${fim?.error?.message || 'falhou'}`)
  return fim.post_id || ini.video_id
}

export async function POST(request: NextRequest) {
  const denied = await guardApi(request)
  if (denied) return denied
  const body = await request.json().catch(() => ({}))
  const momento: 'antes' | 'depois' = body?.momento === 'depois' ? 'depois' : 'antes'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseAdminClient() as any
  const hoje = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })

  // o vídeo do dia: o agendado para hoje (antes) ou o que saiu hoje (depois)
  const { data: pipes } = await supabase.schema('pulso_content').from('pipeline_producao')
    .select('id, ideia_id, status, metadata, data_publicacao_planejada')
    .gte('data_publicacao_planejada', `${hoje}T00:00:00`).lte('data_publicacao_planejada', `${hoje}T23:59:59`)
    .order('data_publicacao_planejada').limit(1)
  const p = pipes?.[0]
  const log = async (status: string, detalhes: Record<string, unknown>) =>
    supabase.schema('pulso_content').from('logs_workflows').insert({ workflow_name: 'PUBLICAR_STORIES', status, detalhes: { momento, hoje, ...detalhes } })

  if (!p) { await log('ocioso', { motivo: 'nenhum vídeo agendado para hoje' }); return NextResponse.json({ ok: true, nada: 'sem vídeo hoje' }) }
  const st = p.metadata?.stories
  if (!st?.pergunta) { await log('erro', { motivo: 'vídeo do dia sem artes de story (motor local não gerou)', ideia_id: p.ideia_id }); return NextResponse.json({ ok: false, erro: 'sem artes de story' }) }

  if (momento === 'depois') {
    const { data: pub } = await supabase.schema('pulso_content').from('metricas_publicacao')
      .select('id').eq('ideia_id', p.ideia_id).gte('data_publicacao', `${hoje}T00:00:00-03:00`).limit(1)
    if (!pub?.length) { await log('ocioso', { motivo: 'vídeo do dia ainda não saiu — não anuncia o que não está no ar', ideia_id: p.ideia_id }); return NextResponse.json({ ok: true, nada: 'vídeo ainda não publicado' }) }
  }

  const pecas: Peca[] = momento === 'antes'
    ? [{ tipo: 'imagem', url: st.pergunta }, { tipo: 'video', url: st.teaser_antes }]
    : [{ tipo: 'video', url: st.teaser_depois }]

  const token = process.env.META_PAGE_ACCESS_TOKEN || process.env.META_SYSTEM_USER_TOKEN || process.env.INSTAGRAM_ACCESS_TOKEN || ''
  const igToken = process.env.INSTAGRAM_ACCESS_TOKEN || token
  const igUser = process.env.META_IG_USER_ID || '17841478757082171'
  const pageId = process.env.META_PAGE_ID || ''
  let pageToken = token
  try {
    const r = await fetch(`${GRAPH}/${pageId}?fields=access_token&access_token=${token}`).then((x) => x.json())
    if (r?.access_token) pageToken = r.access_token
  } catch { /* segue com o token base */ }

  const { data: existentes } = await supabase.schema('pulso_content').from('stories')
    .select('rede, tipo, status').eq('ideia_id', p.ideia_id).eq('momento', momento)
  // automático: só não repete o que já saiu (erro tenta de novo); manual: linha existente já basta
  const feito = (rede: string, tipo: string) =>
    (existentes || []).some((e: { rede: string; tipo: string; status: string }) =>
      e.rede === rede && e.tipo === tipo && (['instagram', 'facebook'].includes(rede) ? e.status === 'publicado' : true))

  const resultados: Array<Record<string, unknown>> = []
  for (const peca of pecas) {
    for (const rede of ['instagram', 'facebook'] as const) {
      if (feito(rede, peca.tipo)) { resultados.push({ rede, tipo: peca.tipo, pulado: 'já publicado' }); continue }
      const linha = { ideia_id: p.ideia_id, rede, momento, tipo: peca.tipo, asset_url: peca.url, modo: 'auto' }
      try {
        const postId = rede === 'instagram' ? await storyInstagram(peca, igUser, igToken) : await storyFacebook(peca, pageId, pageToken)
        await supabase.schema('pulso_content').from('stories').upsert({ ...linha, status: 'publicado', post_id: postId, publicado_em: new Date().toISOString(), erro: null }, { onConflict: 'ideia_id,rede,momento,tipo' })
        resultados.push({ rede, tipo: peca.tipo, ok: postId })
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'erro'
        await supabase.schema('pulso_content').from('stories').upsert({ ...linha, status: 'erro', erro: msg.slice(0, 500) }, { onConflict: 'ideia_id,rede,momento,tipo' })
        resultados.push({ rede, tipo: peca.tipo, erro: msg })
      }
    }
    // manuais: TikTok e Kwai entram na lista do dia; quem posta é o dono
    for (const rede of ['tiktok', 'kwai']) {
      if (feito(rede, peca.tipo)) continue
      await supabase.schema('pulso_content').from('stories').upsert(
        { ideia_id: p.ideia_id, rede, momento, tipo: peca.tipo, asset_url: peca.url, modo: 'manual', status: 'pendente' },
        { onConflict: 'ideia_id,rede,momento,tipo', ignoreDuplicates: true }
      )
    }
  }

  const erros = resultados.filter((r) => r.erro).length
  await log(erros ? (erros === resultados.length ? 'erro' : 'parcial') : 'sucesso', { ideia_id: p.ideia_id, resultados })
  return NextResponse.json({ ok: erros === 0, momento, ideia_id: p.ideia_id, resultados })
}
