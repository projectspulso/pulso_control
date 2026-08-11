import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { guardApi } from '@/lib/auth/api-guard'
import { getYoutubeAccessToken } from '@/lib/youtube/oauth'
import { fetchYoutubeRetention, fetchYoutubeWatchTime } from '@/lib/youtube/retention'
import { resolverRascunhosTikTok } from '@/lib/publicacao/tiktok-rascunho'

/**
 * POST|GET /api/automation/coletar-metricas
 *
 * Coleta métricas das publicações registradas em pulso_content.metricas_publicacao
 * (linhas com post_id externo preenchido) e atualiza as colunas de métricas da própria linha.
 *
 * Fontes: YouTube Data API v3 (YOUTUBE_API_KEY) e Instagram Graph API (INSTAGRAM_ACCESS_TOKEN —
 * page access token do app Meta "Pulso Control"). TikTok/Facebook: coleta manual até F4.
 */

// Teto do plano. Sem isto a rota roda no default (bem menor) e o cron das 11h morria no meio:
// 308 publicações em série passavam de 90s, então só os primeiros posts ganhavam leitura do dia
// e metricas_diarias subcontava todo dia. Ver também o pool em comPool().
export const maxDuration = 60

interface LinhaPublicacao {
  id: string
  ideia_id: string | null
  plataforma: string
  post_id: string | null
  url_publicacao: string | null
  data_publicacao: string
  views: number | null
  metadata: Record<string, unknown> | null
}

/** Roda fn sobre os itens com no máximo `limite` em voo — o laço era sequencial e estourava o tempo. */
async function comPool<T>(itens: T[], limite: number, fn: (item: T) => Promise<void>) {
  let proximo = 0
  const trabalhadores = Array.from({ length: Math.min(limite, itens.length) }, async () => {
    while (proximo < itens.length) {
      await fn(itens[proximo++])
    }
  })
  await Promise.all(trabalhadores)
}

async function coletar(request: NextRequest) {
  const denied = await guardApi(request)
  if (denied) return denied

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseAdminClient() as any

  const { data: linhas, error: fetchError } = await supabase
    .schema('pulso_content')
    .from('metricas_publicacao')
    .select('id, ideia_id, plataforma, post_id, url_publicacao, data_publicacao, views, metadata')
    .not('post_id', 'is', null)

  if (fetchError) {
    return NextResponse.json({ error: `Erro ao buscar publicações: ${fetchError.message}` }, { status: 500 })
  }

  const publicacoes = (linhas || []) as LinhaPublicacao[]

  // Duração da narração = duração do vídeo (o vídeo é montado em cima do áudio). É o
  // denominador da retenção: sem ele, avg_watch_ms sozinho não diz se 18s é bom ou ruim.
  const { data: audios } = await supabase
    .schema('pulso_content').from('audios')
    .select('ideia_id, duracao_segundos').not('duracao_segundos', 'is', null)
  const duracaoPorIdeia = new Map<string, number>()
  for (const a of (audios || []) as { ideia_id: string; duracao_segundos: number }[]) {
    if (a.ideia_id && a.duracao_segundos && !duracaoPorIdeia.has(a.ideia_id)) {
      duracaoPorIdeia.set(a.ideia_id, a.duracao_segundos)
    }
  }

  const avisos: string[] = []
  if (!process.env.YOUTUBE_API_KEY) avisos.push('YOUTUBE_API_KEY ausente — YouTube ignorado')
  if (!process.env.INSTAGRAM_ACCESS_TOKEN) avisos.push('INSTAGRAM_ACCESS_TOKEN ausente — Instagram ignorado')

  const fbToken =
    process.env.META_PAGE_ACCESS_TOKEN || process.env.META_SYSTEM_USER_TOKEN || process.env.INSTAGRAM_ACCESS_TOKEN
  const fbPageId = process.env.META_PAGE_ID
  if (!fbToken) avisos.push('sem token de Página (META_PAGE_ACCESS_TOKEN/META_SYSTEM_USER_TOKEN) — Facebook ignorado')

  // RECONCILIAÇÃO FB: reels publicados manualmente entram com post_id placeholder (não-numérico),
  // então o coletor não acha as views (0 no app apesar de ter views no Meta). Buscamos os reels reais
  // da Página e casamos por palavra-chave da ideia (só match único = seguro) → corrige o post_id.
  try {
    const fbBad = publicacoes.filter((p) => p.plataforma === 'facebook' && !/^\d+$/.test(p.post_id || ''))
    if (fbBad.length > 0 && fbToken && fbPageId) {
      const ideiaIds = [...new Set(fbBad.map((p) => p.ideia_id).filter(Boolean))]
      const { data: ideiasFb } = await supabase
        .schema('pulso_content').from('ideias').select('id, titulo').in('id', ideiaIds)
      const tituloPorIdeia = new Map(
        ((ideiasFb || []) as Array<{ id: string; titulo: string }>).map((i) => [i.id, i.titulo])
      )
      const reelsResp = await fetch(
        `https://graph.facebook.com/v23.0/${fbPageId}/video_reels?fields=id,description&limit=30&access_token=${fbToken}`
      ).then((x) => x.json())
      const reels = (reelsResp.data || []) as Array<{ id: string; description?: string }>
      const usados = new Set<string>()
      for (const p of fbBad) {
        const titulo = (tituloPorIdeia.get(p.ideia_id || '') || '').toLowerCase()
        const tokens = titulo.split(/[^a-zà-ú0-9]+/i).filter((t) => t.length >= 5)
        const cands = reels.filter((re) => !usados.has(re.id) && tokens.some((t) => (re.description || '').toLowerCase().includes(t)))
        if (cands.length === 1) {
          usados.add(cands[0].id)
          await supabase.schema('pulso_content').from('metricas_publicacao')
            .update({ post_id: cands[0].id, url_publicacao: `https://www.facebook.com/reel/${cands[0].id}` })
            .eq('id', p.id)
          p.post_id = cands[0].id
          avisos.push(`FB reconciliado: ${(p.ideia_id || '').slice(0, 8)} -> reel ${cands[0].id}`)
        }
      }
    }
  } catch (e) {
    avisos.push(`Reconciliação FB: ${e instanceof Error ? e.message : 'erro'}`)
  }

  // YouTube em lote (1 chamada para todos os vídeos)
  const ytStats = new Map<string, { views: number; likes: number; comentarios: number }>()
  const ytIds = publicacoes.filter((p) => p.plataforma === 'youtube' && p.post_id).map((p) => p.post_id as string)
  if (ytIds.length > 0 && process.env.YOUTUBE_API_KEY) {
    // videos.list aceita no máx 50 ids por chamada — fatia em lotes (51+ dava 400 "invalid filter")
    for (let i = 0; i < ytIds.length; i += 50) {
      const lote = ytIds.slice(i, i + 50)
      const url = new URL('https://www.googleapis.com/youtube/v3/videos')
      url.searchParams.set('part', 'statistics')
      url.searchParams.set('id', lote.join(','))
      url.searchParams.set('key', process.env.YOUTUBE_API_KEY)
      const resp = await fetch(url.toString())
      if (resp.ok) {
        const data = await resp.json()
        for (const v of data.items || []) {
          ytStats.set(v.id, {
            views: parseInt(v.statistics?.viewCount || '0', 10),
            likes: parseInt(v.statistics?.likeCount || '0', 10),
            comentarios: parseInt(v.statistics?.commentCount || '0', 10),
          })
        }
      } else {
        avisos.push(`YouTube API ${resp.status}: ${(await resp.text()).slice(0, 200)}`)
      }
    }
  }

  // YouTube Analytics OAuth — token p/ retenção (audienceWatchRatio). null = não conectado.
  let ytAnalyticsToken: string | null = null
  try {
    ytAnalyticsToken = await getYoutubeAccessToken()
  } catch {
    ytAnalyticsToken = null
  }
  if (!ytAnalyticsToken && ytIds.length > 0) {
    avisos.push('YouTube OAuth ausente — retenção (curva) do YouTube ignorada')
  }

  // TikTok via Display API (video.list) — token OAuth guardado em pulso_core.configuracoes
  const ttStats = new Map<string, { views: number; likes: number; comentarios: number; shares: number }>()
  const ttVideos: Array<{ id: string; title: string; view_count: number; like_count: number; comment_count: number; share_count: number; share_url: string }> = []
  try {
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
      // PAGINAÇÃO: video/list devolve no máx 20 por página. Sem seguir has_more/cursor só os 20
      // vídeos mais novos ganhavam métrica e os demais ficavam congelados (53 de 73 parados).
      let cursor: number | undefined
      let paginas = 0
      do {
        const corpo: Record<string, unknown> = { max_count: 20 }
        if (cursor) corpo.cursor = cursor
        const lista = await fetch(
          'https://open.tiktokapis.com/v2/video/list/?fields=id,title,view_count,like_count,comment_count,share_count,share_url',
          { method: 'POST', headers: { Authorization: `Bearer ${oauth.access_token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(corpo) }
        ).then((x) => x.json())
        for (const v of lista?.data?.videos || []) {
          ttStats.set(String(v.id), {
            views: v.view_count || 0, likes: v.like_count || 0,
            comentarios: v.comment_count || 0, shares: v.share_count || 0,
          })
          ttVideos.push({
            id: String(v.id), title: v.title || '', view_count: v.view_count || 0,
            like_count: v.like_count || 0, comment_count: v.comment_count || 0,
            share_count: v.share_count || 0, share_url: v.share_url || '',
          })
        }
        cursor = lista?.data?.has_more ? lista.data.cursor : undefined
        paginas++
      } while (cursor && paginas < 15)
    }
  } catch {
    avisos.push('TikTok video.list falhou — coleta manual nesta rodada')
  }

  // RECONCILIAÇÃO TIKTOK: o app empurra o vídeo pro RASCUNHO; ao finalizar no celular o TikTok gera
  // um post_id NOVO que o app nunca soube → o vídeo fica órfão (sem linha no metricas) e o coletor
  // (que só ATUALIZA por post_id) não o pega ("não aparece nada"). Aqui descobrimos os órfãos: vídeos
  // do video.list não registrados, casados por palavra-chave com ideias que têm publicação em OUTRA
  // rede mas SEM TikTok (match único = seguro) → cria a linha. Mesmo padrão da reconciliação do FB.
  // ANTES de qualquer palpite: perguntar ao TikTok. Todo rascunho que geramos tem um publish_id
  // guardado; o endpoint de status devolve o id do post real assim que o dono finaliza. Resolvido
  // aqui, o vídeo nunca chega a ser órfão — e o matcher abaixo vira só rede de segurança para o
  // que foi publicado fora do app.
  try {
    const rascunhos = await resolverRascunhosTikTok(supabase)
    if (rascunhos.resolvidos) avisos.push(`TikTok: ${rascunhos.resolvidos} rascunho(s) resolvido(s) pelo publish_id`)
    if (rascunhos.pendentes) avisos.push(`TikTok: ${rascunhos.pendentes} rascunho(s) ainda não finalizado(s) no celular`)
    for (const a of rascunhos.avisos) avisos.push(a)
  } catch (e) {
    avisos.push(`Rascunhos TikTok: ${e instanceof Error ? e.message.slice(0, 60) : 'erro'}`)
  }

  try {
    if (ttVideos.length > 0) {
      const ttIdsReg = new Set(publicacoes.filter((p) => p.plataforma === 'tiktok').map((p) => p.post_id))
      const orfaos = ttVideos.filter((v) => !ttIdsReg.has(v.id))
      const ideiasComTt = new Set(publicacoes.filter((p) => p.plataforma === 'tiktok').map((p) => p.ideia_id))
      const candIds = [...new Set(
        publicacoes.map((p) => p.ideia_id).filter((id): id is string => !!id && !ideiasComTt.has(id))
      )]
      if (orfaos.length > 0 && candIds.length > 0) {
        const { data: candIdeias } = await supabase
          .schema('pulso_content').from('ideias').select('id, titulo').in('id', candIds)
        // PALAVRA COMUM NÃO É PROVA. A versão anterior aceitava UM token de 4+ letras em comum e,
        // se só uma candidata batesse, gravava como certeza. Em 10/08/2026 a legenda da lagosta
        // (#114) dizia "Quer entender COMO isso afeta a economia" e o título do #115 era "COMO a
        // Assinatura Digital..." — casou por "como" e creditou 254 views ao vídeo errado.
        // Agora: fora as palavras vazias, e são precisos DOIS termos distintos.
        const VAZIAS = new Set([
          'como', 'para', 'porque', 'sobre', 'quando', 'onde', 'quem', 'esse', 'essa', 'este',
          'esta', 'isso', 'mais', 'menos', 'muito', 'pode', 'ser', 'sua', 'seu', 'nao', 'não',
          'voce', 'você', 'sabia', 'todos', 'toda', 'todo', 'foi', 'era', 'anos', 'ano', 'vida',
          'mundo', 'pulso', 'segue', 'conta', 'ninguem', 'ninguém', 'mesmo', 'ainda', 'depois',
        ])
        const MIN_TERMOS = 2
        const cands = ((candIdeias || []) as Array<{ id: string; titulo: string }>).map((i) => ({
          id: i.id,
          tokens: [...new Set(
            (i.titulo || '').toLowerCase().split(/[^a-zà-ú0-9]+/i).filter((t) => t.length >= 5 && !VAZIAS.has(t))
          )],
        }))
        const usadas = new Set<string>()
        for (const v of orfaos) {
          const cap = (v.title || '').toLowerCase()
          const matches = cands.filter((c) => !usadas.has(c.id) && c.tokens.filter((t) => cap.includes(t)).length >= MIN_TERMOS)
          if (matches.length !== 1 && orfaos.length) {
            // Sem prova suficiente o órfão FICA VISÍVEL em vez de ser chutado. Buraco a gente vê;
            // preenchimento errado a gente acredita e leva pra análise de tema.
            if (matches.length === 0) avisos.push(`TikTok órfão sem dono claro: ${v.id} — "${(v.title || '').slice(0, 40)}"`)
            else avisos.push(`TikTok órfão ambíguo (${matches.length} candidatas): ${v.id}`)
          }
          if (matches.length === 1) {
            const iid = matches[0].id
            usadas.add(iid)
            await supabase.schema('pulso_content').from('metricas_publicacao').insert({
              ideia_id: iid, plataforma: 'tiktok', post_id: v.id, url_publicacao: v.share_url,
              data_publicacao: new Date().toISOString(), views: v.view_count,
              likes: v.like_count, comentarios: v.comment_count, shares: v.share_count,
            })
            avisos.push(`TikTok reconciliado: ${iid.slice(0, 8)} -> ${v.id} (${v.view_count} views)`)
          }
        }
      }
    }
  } catch (e) {
    avisos.push(`Reconciliação TikTok: ${e instanceof Error ? e.message : 'erro'}`)
  }

  const agora = new Date()
  const resultados: Array<{ id: string; plataforma: string; status: string; views?: number; motivo?: string }> = []

  const processarPub = async (pub: LinhaPublicacao) => {
    try {
      let metricas: Record<string, number> | null = null
      const extras: Record<string, unknown> = {} // retenção/watch-time → colunas novas (Kaizen)
      // números de CONFERÊNCIA (não decidem nada) — vão pro metadata, não viram coluna
      const metaExtra: Record<string, unknown> = {}

      if (pub.plataforma === 'youtube') {
        const s = ytStats.get(pub.post_id as string)
        if (s) metricas = { views: s.views, likes: s.likes, comentarios: s.comentarios }
        // retenção (curva 41 pts) via YouTube Analytics API — mesma escala/coluna do FB
        if (ytAnalyticsToken && pub.post_id) {
          try {
            const retGraph = await fetchYoutubeRetention(pub.post_id, ytAnalyticsToken)
            if (retGraph) extras.retention_graph = retGraph
            // tempo médio: põe o YouTube no mesmo ranking de qualidade de IG/FB.
            // A API já devolve a % pronta — melhor que dividir por duração (ela considera
            // rewatch e o corte real do Short), então esta tem prioridade sobre o cálculo.
            const wt = await fetchYoutubeWatchTime(pub.post_id, ytAnalyticsToken)
            if (wt) {
              extras.avg_watch_ms = wt.avgWatchMs
              extras.taxa_retencao = wt.retencaoPct
            }
          } catch { /* retenção é best-effort */ }
        }
      } else if (pub.plataforma === 'instagram' && process.env.INSTAGRAM_ACCESS_TOKEN) {
        const token = process.env.INSTAGRAM_ACCESS_TOKEN
        const mediaUrl = new URL(`https://graph.facebook.com/v23.0/${pub.post_id}`)
        mediaUrl.searchParams.set('fields', 'like_count,comments_count')
        mediaUrl.searchParams.set('access_token', token)
        const mediaResp = await fetch(mediaUrl.toString())
        if (!mediaResp.ok) throw new Error(`IG media ${mediaResp.status}`)
        const media = await mediaResp.json()

        const insights: Record<string, number> = {}
        const insUrl = new URL(`https://graph.facebook.com/v23.0/${pub.post_id}/insights`)
        // MÉTRICAS ESSENCIAIS — só o que TODO reel entrega. `facebook_views` NÃO entra aqui:
        // ele só existe em post crospostado pro Facebook e, pedido junto, derruba a chamada
        // INTEIRA com "Fatal" (code -1, subcode 2207086). Foi o que quebrou a coleta em 30/07,
        // quando adicionei os campos de crosspost: 41 de 44 posts passaram a falhar e — como o
        // código gravava `views: insights.views || 0` mesmo com a chamada falhando — o app zerou
        // vídeos que tinham views reais. Isolado por bissecção: views/reach/saved/shares/
        // watch-time/total_views passam; só facebook_views derruba.
        insUrl.searchParams.set(
          'metric',
          'views,total_views,reach,saved,shares,ig_reels_avg_watch_time,ig_reels_video_view_total_time,total_interactions'
        )
        insUrl.searchParams.set('access_token', token)

        let insOk = false
        let ultimoErro = 'sem detalhe'
        for (let tentativa = 0; tentativa < 3 && !insOk; tentativa++) {
          if (tentativa > 0) await new Promise((r) => setTimeout(r, 400 * tentativa))
          const insResp = await fetch(insUrl.toString())
          const ins = await insResp.json().catch(() => null)
          if (!insResp.ok || !ins || ins.error || !Array.isArray(ins.data)) {
            // guardar o erro REAL: a primeira versão dizia "limite de taxa?", o que me fez caçar
            // cota (estava em 1%) em vez da causa verdadeira.
            ultimoErro = ins?.error
              ? `${insResp.status} code=${ins.error.code}/${ins.error.error_subcode ?? '-'} ${String(ins.error.message).slice(0, 90)}`
              : `HTTP ${insResp.status}`
            continue
          }
          for (const m of ins.data) insights[m.name] = m.values?.[0]?.value || 0
          insOk = true
        }

        // CROSSPOST — chamada à parte, e falhar aqui não custa nada. Serve só pra tela explicar
        // por que o app do Instagram mostra um número maior (ele soma IG + Facebook).
        try {
          const fbvUrl = new URL(`https://graph.facebook.com/v23.0/${pub.post_id}/insights`)
          fbvUrl.searchParams.set('metric', 'facebook_views')
          fbvUrl.searchParams.set('access_token', token)
          const fbvResp = await fetch(fbvUrl.toString())
          const fbv = await fbvResp.json().catch(() => null)
          const v = fbv?.data?.[0]?.values?.[0]?.value
          if (typeof v === 'number') insights.facebook_views = v
        } catch {
          /* post sem crosspost — segue sem o número de conferência */
        }

        if (!insOk) {
          throw new Error(`IG insights: ${ultimoErro}`)
        }

        metricas = {
          views: insights.views || 0,
          likes: media.like_count || 0,
          comentarios: media.comments_count || 0,
          shares: insights.shares || 0,
          saves: insights.saved || 0,
        }
        // watch-time + alcance (colunas novas) — IG manda em ms
        if (insights.ig_reels_avg_watch_time) extras.avg_watch_ms = Math.round(insights.ig_reels_avg_watch_time)
        if (insights.ig_reels_video_view_total_time) extras.view_time_ms = insights.ig_reels_video_view_total_time
        if (insights.reach) extras.reach = insights.reach
        // guardado no metadata (não vira coluna): é número de conferência, não métrica de decisão
        if (insights.total_views) {
          metaExtra.ig_total_views = insights.total_views
          metaExtra.ig_facebook_views = insights.facebook_views || 0
        }
      } else if (pub.plataforma === 'tiktok') {
        const s = ttStats.get(pub.post_id as string)
        if (s) {
          metricas = { views: s.views, likes: s.likes, comentarios: s.comentarios, shares: s.shares, saves: 0 }
        } else {
          resultados.push({ id: pub.id, plataforma: pub.plataforma, status: 'MANUAL' })
          return
        }
      } else if (pub.plataforma === 'facebook' && fbToken) {
        // video_insights é edge de PÁGINA: o token IG-scoped não lê. Preferir page/system token —
        // com o IG-scoped a resposta vem vazia e o Reel era gravado como 0 view.
        const token = fbToken
        const insUrl = new URL(`https://graph.facebook.com/v23.0/${pub.post_id}/video_insights`)
        insUrl.searchParams.set('access_token', token)
        const insResp = await fetch(insUrl.toString())
        if (!insResp.ok) throw new Error(`FB video_insights ${insResp.status}`)
        const ins = await insResp.json()
        const vals: Record<string, unknown> = {}
        for (const m of ins.data || []) vals[m.name] = m.values?.[0]?.value
        const reacoes = (vals.post_video_likes_by_reaction_type || {}) as Record<string, number>
        const likesFb = Object.values(reacoes).reduce((a, b) => a + (b || 0), 0)
        const social = (vals.post_video_social_actions || {}) as Record<string, number>
        // Estes três já vinham nesta MESMA resposta e eram descartados — nenhuma chamada extra.
        // alcance: quantas pessoas distintas viram (views conta exibição, não pessoa).
        if (typeof vals.post_impressions_unique === 'number') extras.reach = vals.post_impressions_unique
        // seguidores ganhos POR ESTE VÍDEO ÷ mil views. É a única métrica de conversão real que
        // alguma rede nos dá — mede o que a meta pede (virar seguidor), não só quem assistiu.
        const seguidores = vals.post_video_followers
        const viewsFb = (vals.fb_reels_total_plays as number) || (vals.blue_reels_play_count as number) || 0
        if (typeof seguidores === 'number' && viewsFb > 0) {
          extras.taxa_conversao = Math.round((seguidores / viewsFb) * 1000 * 100) / 100
        }
        metricas = {
          views: (vals.fb_reels_total_plays as number) || (vals.blue_reels_play_count as number) || 0,
          likes: likesFb,
          comentarios: social.COMMENT || 0,
          shares: social.SHARE || 0,
          saves: 0,
        }
        // retenção (curva 40 pts) + watch-time + alcance — FB é a única API com a curva completa
        try {
          const retUrl = new URL(`https://graph.facebook.com/v23.0/${pub.post_id}/video_insights`)
          retUrl.searchParams.set('metric', 'post_video_retention_graph,post_video_avg_time_watched,post_video_view_time')
          retUrl.searchParams.set('access_token', token)
          const retResp = await fetch(retUrl.toString())
          if (retResp.ok) {
            const ret = await retResp.json()
            const rv: Record<string, unknown> = {}
            for (const m of ret.data || []) rv[m.name] = m.values?.[0]?.value
            if (rv.post_video_retention_graph) extras.retention_graph = rv.post_video_retention_graph
            if (rv.post_video_avg_time_watched) extras.avg_watch_ms = Math.round(rv.post_video_avg_time_watched as number)
            if (rv.post_video_view_time) extras.view_time_ms = rv.post_video_view_time
          }
        } catch { /* retenção é best-effort */ }
      } else {
        resultados.push({ id: pub.id, plataforma: pub.plataforma, status: 'MANUAL' })
        return
      }

      if (!metricas) {
        resultados.push({ id: pub.id, plataforma: pub.plataforma, status: 'SEM_DADOS' })
        return
      }

      // janelas: marca views_24h/7d/30d conforme idade da publicação
      const horas = (agora.getTime() - new Date(pub.data_publicacao).getTime()) / 36e5
      // taxa_retencao (%) = tempo médio assistido ÷ duração do vídeo. Estava NULA em 100% das
      // linhas, e o loop de aprendizado ordena por ela — na prática ele aprendia só por views,
      // que é o sinal errado: o vídeo de mais views tinha o MENOR tempo médio.
      const durSeg = pub.ideia_id ? duracaoPorIdeia.get(pub.ideia_id) : undefined
      if (extras.taxa_retencao === undefined && typeof extras.avg_watch_ms === 'number' && durSeg && durSeg > 0) {
        const pct = Math.round(((extras.avg_watch_ms as number) / (durSeg * 1000)) * 1000) / 10
        if (pct > 0 && pct <= 100) extras.taxa_retencao = pct
      }

      // TRAVA GERAL — views nunca RETROCEDE a zero. Vale pra todas as redes, não só o Instagram:
      // view acumulada é monotônica (uma vez contada, não some), então 0 vindo de uma API que já
      // devolveu número é sempre falha de leitura, nunca fato. Sem esta trava, um erro de rede
      // apagava o histórico e ainda contaminava o "ganho do dia" (o delta ficava negativo e
      // depois artificialmente enorme na coleta seguinte).
      if ((metricas.views ?? 0) === 0 && (pub.views ?? 0) > 0) {
        resultados.push({
          id: pub.id,
          plataforma: pub.plataforma,
          status: 'IGNORADO',
          motivo: `API devolveu 0 e a linha tinha ${pub.views} — leitura descartada`,
        })
        return
      }

      const update: Record<string, unknown> = { ...metricas, ...extras, ultima_atualizacao: agora.toISOString() }
      if (Object.keys(metaExtra).length) {
        update.metadata = { ...(pub.metadata || {}), ...metaExtra }
      }
      if (horas <= 30) update.views_24h = metricas.views
      if (horas <= 7 * 24 + 6) update.views_7dias = metricas.views
      if (horas <= 30 * 24 + 6) update.views_30dias = metricas.views

      const { error: upError } = await supabase
        .schema('pulso_content')
        .from('metricas_publicacao')
        .update(update)
        .eq('id', pub.id)

      if (upError) {
        resultados.push({ id: pub.id, plataforma: pub.plataforma, status: 'ERRO', motivo: upError.message })
      } else {
        resultados.push({ id: pub.id, plataforma: pub.plataforma, status: 'SUCESSO', views: metricas.views })
      }

      // LEITURA LIMPA: 1 registro por post por dia em pulso_analytics.leituras_metricas (SEM FK —
      // captura TODOS os posts; crescimento = diferença entre leituras). Upsert no dia (latest do dia).
      try {
        const dataRef = agora.toISOString().slice(0, 10)
        // SÓ as colunas que leituras_metricas TEM. `extras` carrega taxa_retencao e
        // taxa_conversao (que só existem em metricas_publicacao) — jogá-las aqui via `...extras`
        // fazia o insert dar 400 (PGRST204) e o catch abaixo engolia em silêncio. Foi o que
        // parou a série diária em 19/07 (o "ganho do dia" secou; o acumulado sobrevive porque
        // tem âncora no total real). Espalhar só o subconjunto que a tabela aceita.
        const extrasLeitura: Record<string, unknown> = {}
        for (const k of ['avg_watch_ms', 'view_time_ms', 'reach', 'retention_graph'] as const) {
          if (extras[k] !== undefined) extrasLeitura[k] = extras[k]
        }
        const leitura = {
          ideia_id: pub.ideia_id, plataforma: pub.plataforma, post_id: pub.post_id,
          data_ref: dataRef, coletado_em: agora.toISOString(),
          views: metricas.views || 0, likes: metricas.likes || 0,
          comentarios: metricas.comentarios || 0, compartilhamentos: metricas.shares || 0,
          ...extrasLeitura,
        }
        const { data: jaHoje } = await supabase
          .schema('pulso_analytics').from('leituras_metricas')
          .update(leitura)
          .eq('ideia_id', pub.ideia_id).eq('plataforma', pub.plataforma).eq('data_ref', dataRef)
          .select('id')
        if (!jaHoje || jaHoje.length === 0) {
          await supabase.schema('pulso_analytics').from('leituras_metricas').insert(leitura)
        }
      } catch (e) {
        // era `catch {}` mudo — foi ele que escondeu por 4 dias o 400 do insert. Best-effort
        // continua (não derruba a coleta), mas agora o motivo aparece no log da função.
        console.error('[coletar-metricas] leitura_metricas falhou:', e instanceof Error ? e.message : e)
      }
      // (o snapshot em metricas_diarias foi aposentado 20/07: cobria só ~48 posts/dia via FK de
      // pulso_distribution.posts e nenhuma tela lia — leituras_metricas é a série canônica)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido'
      resultados.push({ id: pub.id, plataforma: pub.plataforma, status: 'ERRO', motivo: msg })
    }
  }

  // INSTAGRAM SEPARADO E DEVAGAR (31/07/2026). Com as 100+ publicações no mesmo pool de 16, o
  // Instagram limitava a taxa e devolvia erro em 81 de 100 — e antes da trava de "zero não
  // sobrescreve" isso virava 0 no banco, apagando views reais. A Graph API aguenta bem menos
  // paralelismo que YouTube e TikTok, que vão em lote e não reclamam.
  //
  // Então: as outras redes seguem no pool de 16 (rápido), e o Instagram vai com 3 em voo e uma
  // pausa curta entre as rodadas. Fica mais lento, mas lê de verdade — e maxDuration=60 cobre,
  // porque o IG é só ~1/3 das publicações.
  const pubsResto = publicacoes.filter((p) => p.plataforma !== 'instagram')
  await comPool(pubsResto, 16, processarPub)

  // INSTAGRAM: NOVOS PRIMEIRO, e com folga de concorrência.
  //
  // O pool de 3 com pausa de 150ms coube enquanto eram ~100 posts. Em 01/08 o volume passou disso
  // e o Instagram deixou de caber nos 60s da Vercel: passou a ler 56-67 de 107 todo dia, contra
  // 105-107 das outras redes. Pior, a consulta não tinha ORDEM — o pool consome o array como vem,
  // então quem ficava de fora era sempre a CAUDA, isto é, os posts mais novos. Os dois vídeos de
  // 03/08 ficaram com views=0 no app por dois dias enquanto os antigos atualizavam normalmente.
  //
  // Duas correções: ordenar por publicação DESC (post de ontem muda muito, post de junho quase
  // não muda) e subir o pool para 8 — a cota da Graph marcava 1% de uso, os 3 eram educação, não
  // necessidade. E um prazo explícito: se ainda assim não couber, para limpo e AVISA quantos
  // ficaram, em vez de a função morrer calada no meio.
  const PRAZO_IG_MS = 50_000
  const igDaVez = publicacoes
    .filter((p) => p.plataforma === 'instagram')
    .sort((a, b) => String(b.data_publicacao || '').localeCompare(String(a.data_publicacao || '')))
  let igLidos = 0
  let igPulados = 0
  await comPool(igDaVez, 8, async (p) => {
    if (Date.now() - agora.getTime() > PRAZO_IG_MS) { igPulados++; return }
    await processarPub(p)
    igLidos++
  })
  if (igPulados > 0) {
    avisos.push(`Instagram: ${igLidos} lidos, ${igPulados} ficaram para a próxima rodada (prazo de ${PRAZO_IG_MS / 1000}s). Os mais novos foram primeiro.`)
  }

  return NextResponse.json({
    success: true,
    total: publicacoes.length,
    duracao_ms: Date.now() - agora.getTime(),
    coletados: resultados.filter((r) => r.status === 'SUCESSO').length,
    manuais: resultados.filter((r) => r.status === 'MANUAL').length,
    erros: resultados.filter((r) => r.status === 'ERRO').length,
    coletado_em: agora.toISOString(),
    avisos: avisos.length > 0 ? avisos : undefined,
    resultados,
  })
}

export async function POST(request: NextRequest) {
  return coletar(request)
}

// Vercel Cron chama via GET
export async function GET(request: NextRequest) {
  return coletar(request)
}
