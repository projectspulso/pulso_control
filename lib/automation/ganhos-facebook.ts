/**
 * GANHOS DO FACEBOOK — o primeiro dinheiro do PULSO.
 *
 * As Estrelas foram liberadas em 01/10/2026 (página Pulso Histórias, 3 de 3 critérios). A Graph API
 * NÃO entrega a contagem de Estrelas por vídeo nem por Página (page_stars_received e afins dão
 * "invalid insights metric", testado em 01/10). O que existe:
 *   monetization_approximate_earnings — ganho diário estimado em USD, todas as ferramentas somadas
 *                                       (Estrelas inclusas, que hoje é a única liberada)
 *   content_monetization_earnings     — só o programa de monetização de conteúdo (ainda não liberado)
 * Estrela vale US$ 0,01, então estrelas ≈ ganho aproximado × 100 enquanto Estrelas for a única fonte.
 *
 * Grava em configuracoes.ganhos_facebook (90 dias); chamado pela coleta do Facebook (pg_cron 06:30 UTC).
 */

export interface DiaGanho {
  data: string
  aproximadoUsd: number
  conteudoUsd: number
}

export interface GanhosFacebook {
  atualizadoEm: string
  estrelasLiberadasEm: string
  historico: DiaGanho[]
  totalUsd: number
  ultimos7Usd: number
}

const API = 'https://graph.facebook.com/v23.0'

export async function coletarGanhosFacebook(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  token: string,
  pageId: string
): Promise<GanhosFacebook> {
  // insights de Página pedem token de Página; o do system user deriva um
  let pageToken = token
  try {
    const r = await fetch(`${API}/${pageId}?fields=access_token&access_token=${token}`).then((x) => x.json())
    if (r?.access_token) pageToken = r.access_token
  } catch {
    /* segue com o token recebido */
  }

  const ate = Math.floor(Date.now() / 1000)
  const desde = ate - 28 * 86_400
  const ler = async (metric: string) => {
    const r = await fetch(`${API}/${pageId}/insights?metric=${metric}&period=day&since=${desde}&until=${ate}&access_token=${pageToken}`)
    const j = await r.json()
    if (!r.ok) throw new Error(`${metric}: ${j?.error?.message || r.status}`)
    return (j?.data?.[0]?.values || []) as Array<{ value: number | { microAmount?: number }; end_time: string }>
  }
  const [aprox, conteudo] = await Promise.all([ler('monetization_approximate_earnings'), ler('content_monetization_earnings')])

  // end_time 07:00 UTC = fim do dia no fuso do Pacífico; o dia de referência é o anterior
  const dia = (end: string) => new Date(new Date(end).getTime() - 86_400_000).toISOString().slice(0, 10)
  const porDia = new Map<string, DiaGanho>()
  const pega = (d: string) => porDia.get(d) ?? porDia.set(d, { data: d, aproximadoUsd: 0, conteudoUsd: 0 }).get(d)!
  for (const v of aprox) pega(dia(v.end_time)).aproximadoUsd = typeof v.value === 'number' ? v.value : 0
  for (const v of conteudo) {
    const micro = typeof v.value === 'object' && v.value ? v.value.microAmount ?? 0 : 0
    pega(dia(v.end_time)).conteudoUsd = micro / 1_000_000
  }

  // mescla com o que já estava gravado (a API só devolve 28 dias)
  const { data: atual } = await supabase.schema('pulso_core').from('configuracoes').select('valor').eq('chave', 'ganhos_facebook').maybeSingle()
  let anterior: DiaGanho[] = []
  try {
    const v = typeof atual?.valor === 'string' ? JSON.parse(atual.valor) : atual?.valor
    anterior = v?.historico || []
  } catch {
    anterior = []
  }
  for (const d of anterior) if (!porDia.has(d.data)) porDia.set(d.data, d)
  const historico = [...porDia.values()].sort((a, b) => a.data.localeCompare(b.data)).slice(-90)
  const soma = (xs: DiaGanho[]) => Math.round(xs.reduce((s, d) => s + d.aproximadoUsd + d.conteudoUsd, 0) * 100) / 100

  const valor: GanhosFacebook = {
    atualizadoEm: new Date().toISOString(),
    estrelasLiberadasEm: '2026-10-01',
    historico,
    totalUsd: soma(historico),
    ultimos7Usd: soma(historico.slice(-7)),
  }
  await supabase.schema('pulso_core').from('configuracoes')
    .upsert({ chave: 'ganhos_facebook', valor: JSON.stringify(valor) }, { onConflict: 'chave' })
  return valor
}
