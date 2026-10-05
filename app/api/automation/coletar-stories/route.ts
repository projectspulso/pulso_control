import { NextRequest, NextResponse } from 'next/server'
import { guardApi } from '@/lib/auth/api-guard'
import { getSupabaseAdminClient } from '@/lib/supabase/server'

/**
 * POST /api/automation/coletar-stories
 *
 * MEDIÇÃO DO MOTOR DE STORIES (docs/planos/motor-stories.md). O Instagram só entrega métrica de
 * story enquanto ele está no ar (24h) — os de 03/10 e da tarde de 04/10/2026 expiraram sem leitura.
 * Por isso roda todo dia às 16h30 (BRT), antes do story das 17h do dia anterior sair do ar, e grava:
 *   stories.metricas — views, reach, replies, shares, follows, profile_visits e a navegação
 *                      (avançou, voltou, saiu) de cada story ativo
 *   configuracoes.ig_conta_diaria — visitas ao perfil e alcance da conta por dia: é com ela (e com
 *                      seguidores_historico) que o teste de 14 dias responde "o story faz crescer?"
 * Facebook: a Graph API não entrega insight de story de Página; ali a régua é o seguidor diário.
 */

export const maxDuration = 60
const GRAPH = 'https://graph.facebook.com/v23.0'

export async function POST(request: NextRequest) {
  const denied = await guardApi(request)
  if (denied) return denied
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseAdminClient() as any
  const token = process.env.INSTAGRAM_ACCESS_TOKEN
  const ig = process.env.META_IG_USER_ID || '17841478757082171'
  if (!token) return NextResponse.json({ error: 'INSTAGRAM_ACCESS_TOKEN ausente' }, { status: 500 })

  const ativos = await fetch(`${GRAPH}/${ig}/stories?fields=id,timestamp&access_token=${token}`).then((r) => r.json())
  const lidos: Array<Record<string, unknown>> = []
  for (const s of (ativos?.data || []) as Array<{ id: string; timestamp: string }>) {
    const m = await fetch(`${GRAPH}/${s.id}/insights?metric=views,reach,replies,shares,total_interactions,follows,profile_visits&access_token=${token}`).then((r) => r.json())
    const nav = await fetch(`${GRAPH}/${s.id}/insights?metric=navigation&breakdown=story_navigation_action_type&access_token=${token}`).then((r) => r.json())
    if (!m?.data) { lidos.push({ id: s.id, erro: m?.error?.message || 'sem dados' }); continue }
    const metricas: Record<string, unknown> = {}
    for (const x of m.data as Array<{ name: string; values?: Array<{ value: number }> }>) metricas[x.name] = x.values?.[0]?.value ?? null
    const quebra = nav?.data?.[0]?.total_value?.breakdowns?.[0]?.results as Array<{ dimension_values: string[]; value: number }> | undefined
    if (quebra) for (const q of quebra) metricas[`nav_${q.dimension_values[0]}`] = q.value
    const { data: upd } = await supabase.schema('pulso_content').from('stories')
      .update({ metricas, metricas_em: new Date().toISOString() }).eq('post_id', s.id).eq('rede', 'instagram').select('id')
    lidos.push({ id: s.id, casou: !!upd?.length, ...metricas })
  }

  // conta: visitas ao perfil e alcance de ONTEM (dia fechado, horário de Brasília)
  const hojeBRT = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
  const ate = Math.floor(new Date(`${hojeBRT}T00:00:00-03:00`).getTime() / 1000)
  const desde = ate - 86_400
  const ontem = new Date((desde + 43_200) * 1000).toISOString().slice(0, 10)
  const conta = await fetch(`${GRAPH}/${ig}/insights?metric=profile_views,reach,accounts_engaged&period=day&metric_type=total_value&since=${desde}&until=${ate}&access_token=${token}`).then((r) => r.json())
  const dia: Record<string, unknown> = { data: ontem }
  for (const x of (conta?.data || []) as Array<{ name: string; total_value?: { value: number } }>) dia[x.name] = x.total_value?.value ?? null
  const { data: cfg } = await supabase.schema('pulso_core').from('configuracoes').select('valor').eq('chave', 'ig_conta_diaria').maybeSingle()
  let hist: Array<Record<string, unknown>> = []
  try { hist = (typeof cfg?.valor === 'string' ? JSON.parse(cfg.valor) : cfg?.valor)?.historico || [] } catch { hist = [] }
  hist = hist.filter((h) => h.data !== ontem)
  // LINHA DE BASE: sem os dias ANTES do primeiro story (03/10) não há com o que comparar. Na primeira
  // rodada, busca os 28 dias anteriores (a API aceita no máximo ~30 dias para trás), um por um.
  if (hist.length < 20) {
    for (let k = 2; k <= 29; k++) {
      const a = ate - (k - 1) * 86_400
      const d0 = a - 86_400
      const dt = new Date((d0 + 43_200) * 1000).toISOString().slice(0, 10)
      if (hist.some((h) => h.data === dt)) continue
      const r = await fetch(`${GRAPH}/${ig}/insights?metric=profile_views,reach,accounts_engaged&period=day&metric_type=total_value&since=${d0}&until=${a}&access_token=${token}`).then((x) => x.json())
      const linha: Record<string, unknown> = { data: dt }
      for (const x of (r?.data || []) as Array<{ name: string; total_value?: { value: number } }>) linha[x.name] = x.total_value?.value ?? null
      if (r?.data) hist.push(linha)
    }
  }
  hist = [...hist, dia].sort((a, b) => String(a.data).localeCompare(String(b.data))).slice(-180)
  await supabase.schema('pulso_core').from('configuracoes')
    .upsert({ chave: 'ig_conta_diaria', valor: JSON.stringify({ historico: hist }) }, { onConflict: 'chave' })

  await supabase.schema('pulso_content').from('logs_workflows').insert({
    workflow_name: 'COLETAR_STORIES', status: lidos.length ? 'sucesso' : 'ocioso', detalhes: { stories: lidos, conta: dia },
  })
  return NextResponse.json({ ok: true, stories: lidos, conta: dia })
}
