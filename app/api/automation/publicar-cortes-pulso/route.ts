import { NextRequest, NextResponse } from 'next/server'
import { guardApi } from '@/lib/auth/api-guard'
import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { canaisYoutube, getYoutubeAccessToken } from '@/lib/youtube/oauth'

/**
 * Publica os cortes dos canais DO PULSO (dono 10/11/2026): Cortes PULSO Histórias e Bastidores PULSO
 * Histórias. Lê corte_publicacoes com modo=auto (o MKT só lê modo=job), sobe no YouTube com o token do
 * próprio canal (youtube_oauth:<canal>), nunca com o do PULSO Histórias.
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

  const { data: fila, error } = await supabase.schema('pulso_content').from('corte_publicacoes')
    .select('id, destino, rede, video, titulo, legenda, hashtags, agendado_para')
    .eq('modo', 'auto').eq('status', 'planejado').eq('rede', 'youtube')
    .lte('agendado_para', new Date().toISOString()).order('agendado_para').limit(1)
  if (error) return registra(supabase, 'erro', { erro: error.message }, 500)
  if (!fila?.length) return registra(supabase, 'ocioso', { motivo: 'nada vencido' }, 200)
  if (!publicar) return registra(supabase, 'ocioso', { motivo: 'aguarda o pode do dono (cortes_pulso.publicar)', vencidas: fila.length }, 200)

  const p = fila[0]
  try {
    const { data: cfg } = await supabase.schema('pulso_core').from('configuracoes').select('valor').eq('chave', 'cortes_destinos').single()
    const dest = (JSON.parse(cfg.valor).destinos || []).find((d: { id: string }) => d.id === p.destino)
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
