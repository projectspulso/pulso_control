import 'server-only'

/**
 * O VÍNCULO QUE A GENTE JOGAVA FORA.
 *
 * O upload do TikTok pela API não publica: ele deposita o vídeo na CAIXA DE ENTRADA do app, e
 * quem finaliza é o dono, no celular, minutos ou horas depois. Nesse momento o TikTok cria um
 * post com um id NOVO — que o app nunca soube. O vídeo virava órfão e alguém tinha que adivinhar
 * de quem era.
 *
 * Só que o `init` já devolve um `publish_id`, e é exatamente ele que a gente guarda em
 * `post_id` como `v_inbox_file~v2.xxxx`. Ou seja: o vínculo sempre esteve no banco, nunca foi
 * usado. O endpoint `post/publish/status/fetch/` troca esse publish_id pelo id do post real assim
 * que ele existe.
 *
 * Isso elimina o palpite. Em 10/08/2026 o palpite creditou 254 views do vídeo da lagosta (#114)
 * ao vídeo da Assinatura Digital (#115) — os dois só tinham em comum a palavra "como".
 */

const ENDPOINT = 'https://open.tiktokapis.com/v2/post/publish/status/fetch/'

type Sb = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: (s: string) => any
}

async function tokenValido(supabase: Sb): Promise<string | null> {
  const { data: cfg } = await supabase.schema('pulso_core').from('configuracoes')
    .select('valor').eq('chave', 'tiktok_oauth').single()
  if (!cfg?.valor) return null
  let oauth = JSON.parse(cfg.valor)
  if (Date.now() > oauth.expires_at - 60_000 && oauth.refresh_token) {
    const r = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_key: (process.env.TIKTOK_SANDBOX_KEY || process.env.TIKTOK_CLIENT_KEY) || '',
        client_secret: (process.env.TIKTOK_SANDBOX_SECRET || process.env.TIKTOK_CLIENT_SECRET) || '',
        grant_type: 'refresh_token',
        refresh_token: oauth.refresh_token,
      }),
    }).then((x) => x.json())
    if (!r.access_token) return null
    oauth = { ...oauth, access_token: r.access_token, refresh_token: r.refresh_token, expires_at: Date.now() + (r.expires_in || 86400) * 1000 }
    await supabase.schema('pulso_core').from('configuracoes').update({ valor: JSON.stringify(oauth) }).eq('chave', 'tiktok_oauth')
  }
  return oauth.access_token as string
}

export interface ResultadoRascunho {
  resolvidos: number
  pendentes: number
  avisos: string[]
}

/**
 * Troca cada `post_id` de rascunho pelo id do post real, perguntando ao TikTok.
 * Rascunho que o dono ainda não finalizou simplesmente continua pendente — sem palpite.
 */
export async function resolverRascunhosTikTok(supabase: Sb): Promise<ResultadoRascunho> {
  const avisos: string[] = []
  const { data: rascunhos } = await supabase.schema('pulso_content').from('metricas_publicacao')
    .select('id, ideia_id, post_id').eq('plataforma', 'tiktok').like('post_id', 'v_inbox%')
  const lista = (rascunhos || []) as Array<{ id: string; ideia_id: string; post_id: string }>
  if (!lista.length) return { resolvidos: 0, pendentes: 0, avisos }

  const token = await tokenValido(supabase)
  if (!token) return { resolvidos: 0, pendentes: lista.length, avisos: ['TikTok sem token — rascunhos não conferidos'] }

  let resolvidos = 0
  for (const r of lista) {
    try {
      const resp = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ publish_id: r.post_id }),
      }).then((x) => x.json())

      // O TikTok escreve "publicaly" mesmo (typo deles). Aceito as duas grafias por segurança.
      const ids: string[] = resp?.data?.publicaly_available_post_id || resp?.data?.publicly_available_post_id || []
      const idReal = Array.isArray(ids) ? ids[0] : ids
      if (!idReal) continue

      const { error } = await supabase.schema('pulso_content').from('metricas_publicacao').update({
        post_id: String(idReal),
        url_publicacao: `https://www.tiktok.com/@pulsohistorias/video/${idReal}`,
        ultima_atualizacao: new Date().toISOString(),
      }).eq('id', r.id)
      if (error) { avisos.push(`rascunho ${r.post_id.slice(0, 24)}: ${error.message}`); continue }
      resolvidos++
      avisos.push(`TikTok resolvido pelo publish_id: ${String(idReal)}`)
    } catch (e) {
      avisos.push(`rascunho ${r.post_id.slice(0, 24)}: ${e instanceof Error ? e.message.slice(0, 60) : 'erro'}`)
    }
  }
  return { resolvidos, pendentes: lista.length - resolvidos, avisos }
}
