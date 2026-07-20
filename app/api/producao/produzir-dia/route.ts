import { NextRequest, NextResponse } from 'next/server'
import { guardApi } from '@/lib/auth/api-guard'
import { getSupabaseAdminClient } from '@/lib/supabase/server'

/**
 * PRODUZIR O DIA — fecha o gap da esteira: em vez de arrastar card a card no kanban,
 * um clique autoriza os melhores AUDIO_GERADO (tier-1 primeiro) QUE JÁ TÊM CENAS,
 * movendo-os pra EM_EDICAO. O worker local (08/16/23h) renderiza o que está autorizado.
 * O freio de custo real segue sendo o guard (600cr/dia) dentro do gen_scenes.
 *
 * Regra de higiene do gap:
 *  - só entra na fila item COM cenas (nada quebrado autoriza — foi o que travou 03/07).
 *  - não passa da meta do dia (alvo) contando o que já está autorizado.
 *
 * GET  → prévia/saúde (o que dá pra autorizar, custo estimado, itens sem cenas, estoque).
 * POST → autoriza o lote { alvo?: number }.
 */

const CUSTO_POR_VIDEO_CR = 60 // ~10 cenas, banco reusa ~25% → ~7-8 cenas novas × 8cr
const CREDITO_BRL = 0.27
const ALVO_PADRAO = 3 // fallback se a config linha_producao não existir (dono travou 3 render/dia 20/07)

const TIER1 = ['curios', 'mist', 'psico', 'estudo', 'produt', 'casos reais', 'bizarr']
const TIER3 = ['momento', 'games', 'nostalgia']
function tier(nome: string) {
  const n = (nome || '').toLowerCase()
  if (TIER1.some((k) => n.includes(k))) return 1
  if (TIER3.some((k) => n.includes(k))) return 3
  return 2
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function temCenas(p: any) {
  return !!p?.metadata?.cenas?.scenes?.length
}

interface Candidato {
  id: string
  ideiaId: string
  numero: number | null
  titulo: string
  canal: string
  tier: number
  cenas: number
  notaHook: number | null
  concorrente: boolean
}

interface ConfigLinha {
  render_dia_max: number
  publicar_dia: number
  intercalar: { estoque: number; concorrente: number }
  buffer_audio_max: number
  roteiros_dia_max: number
  buffer_pronto_min: number
  buffer_pronto_max: number
}

// Intercala as duas trilhas no padrão da config (2 estoque : 1 concorrente por default).
// Quando uma trilha seca, a outra preenche — a fila nunca trava por falta de mistura.
function intercalar(estoque: Candidato[], concorrente: Candidato[], padrao: { estoque: number; concorrente: number }) {
  const fila: Candidato[] = []
  let e = 0
  let c = 0
  while (e < estoque.length || c < concorrente.length) {
    for (let i = 0; i < padrao.estoque && e < estoque.length; i++) fila.push(estoque[e++])
    for (let i = 0; i < padrao.concorrente && c < concorrente.length; i++) fila.push(concorrente[c++])
    if (e >= estoque.length && c >= concorrente.length) break
  }
  return fila
}

async function levantar() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseAdminClient() as any
  const [{ data: pipe }, { data: ideias }, { data: canais }, { data: roteiros }, { data: cfgRow }] = await Promise.all([
    supabase.schema('pulso_content').from('pipeline_producao').select('id, ideia_id, status, metadata'),
    supabase.schema('pulso_content').from('ideias').select('id, titulo, canal_id, origem'),
    supabase.schema('pulso_core').from('canais').select('id, nome'),
    supabase.schema('pulso_content').from('roteiros').select('ideia_id, nota_hook'),
    supabase.schema('pulso_core').from('configuracoes').select('valor').eq('chave', 'linha_producao').maybeSingle(),
  ])
  let cfg: ConfigLinha = {
    render_dia_max: ALVO_PADRAO, publicar_dia: 2, intercalar: { estoque: 2, concorrente: 1 },
    buffer_audio_max: 15, roteiros_dia_max: 3, buffer_pronto_min: 4, buffer_pronto_max: 6,
  }
  try { if (cfgRow?.valor) cfg = { ...cfg, ...JSON.parse(cfgRow.valor) } } catch { /* usa default */ }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ide = new Map<string, any>((ideias || []).map((i: any) => [i.id, i]))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cn = new Map<string, string>((canais || []).map((c: any) => [c.id, (c.nome || '').replace(/^PULSO\s*/i, '')]))
  // nota_hook por ideia (a força do gancho viaja do roteiro até a decisão de render)
  const nh = new Map<string, number>()
  for (const r of (roteiros || []) as { ideia_id: string; nota_hook: number | null }[]) {
    if (r.ideia_id && typeof r.nota_hook === 'number' && !nh.has(r.ideia_id)) nh.set(r.ideia_id, r.nota_hook)
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pp = (pipe || []) as any[]

  const mapCand = (p: (typeof pp)[number]): Candidato => {
    const i = ide.get(p.ideia_id)
    const canal = (i?.canal_id && cn.get(i.canal_id)) || '—'
    return {
      id: p.id,
      ideiaId: p.ideia_id,
      numero: p.metadata?.numero ?? null,
      titulo: i?.titulo || '(sem título)',
      canal,
      tier: tier(canal),
      cenas: p.metadata?.cenas?.scenes?.length ?? 0,
      notaHook: nh.get(p.ideia_id) ?? null,
      concorrente: i?.origem === 'BENCHMARK_CONCORRENTE',
    }
  }

  // prioridade dentro de cada trilha: gancho mais forte, depois tier do vertical, depois número
  const ordenar = (a: Candidato, b: Candidato) =>
    (b.notaHook ?? 0) - (a.notaHook ?? 0) || a.tier - b.tier || (a.numero ?? 999) - (b.numero ?? 999)

  // FILA 2×1 (decisão do dono 20/07): dos renders do dia, 2 do estoque próprio + 1 da trilha
  // do concorrente (origem BENCHMARK_CONCORRENTE) — as trilhas ordenam separado e intercalam.
  const comCenas = pp.filter((p) => p.status === 'AUDIO_GERADO' && temCenas(p)).map(mapCand)
  const prontosParaAutorizar = intercalar(
    comCenas.filter((c) => !c.concorrente).sort(ordenar),
    comCenas.filter((c) => c.concorrente).sort(ordenar),
    cfg.intercalar,
  )
  const semCenas = pp.filter((p) => p.status === 'AUDIO_GERADO' && !temCenas(p)).map(mapCand).sort(ordenar)
  const jaAutorizados = pp.filter((p) => p.status === 'EM_EDICAO' && temCenas(p)).map(mapCand).sort(ordenar)
  const prontosEstoque = pp.filter((p) => p.status === 'PRONTO_PUBLICACAO' && p.metadata?.video_url).length

  return { supabase, cfg, prontosParaAutorizar, semCenas, jaAutorizados, prontosEstoque }
}

export async function GET(request: NextRequest) {
  const denied = await guardApi(request)
  if (denied) return denied

  const { cfg, prontosParaAutorizar, semCenas, jaAutorizados, prontosEstoque } = await levantar()
  const alvo = cfg.render_dia_max
  const faltam = Math.max(0, alvo - jaAutorizados.length)
  const lote = prontosParaAutorizar.slice(0, faltam)
  const custoCr = lote.length * CUSTO_POR_VIDEO_CR

  return NextResponse.json({
    alvo,
    cfg,
    jaAutorizados: jaAutorizados.length,
    prontosEstoque,
    autorizaveis: prontosParaAutorizar.length,
    semCenas: semCenas.length,
    loteSugerido: lote,
    fila10: prontosParaAutorizar.slice(0, 10), // próximos 10 na ordem 2×1 (painel Linha de Produção)
    itensSemCenas: semCenas,
    custoEstimadoCr: custoCr,
    custoEstimadoBrl: Math.round(custoCr * CREDITO_BRL * 100) / 100,
  })
}

export async function POST(request: NextRequest) {
  const denied = await guardApi(request)
  if (denied) return denied

  const body = await request.json().catch(() => ({}))
  const { supabase, cfg, prontosParaAutorizar, jaAutorizados } = await levantar()
  // alvo manual nunca passa do teto diário da linha (render_dia_max — freio de custo)
  const alvo = Number.isFinite(body?.alvo)
    ? Math.max(1, Math.min(cfg.render_dia_max, body.alvo))
    : cfg.render_dia_max
  const faltam = Math.max(0, alvo - jaAutorizados.length)
  const lote = prontosParaAutorizar.slice(0, faltam)

  if (lote.length === 0) {
    return NextResponse.json({
      success: true,
      autorizados: 0,
      motivo: jaAutorizados.length >= alvo ? `já há ${jaAutorizados.length} autorizados (meta ${alvo})` : 'nenhum AUDIO_GERADO com cenas disponível',
      custoEstimadoCr: 0,
    })
  }

  const agora = new Date().toISOString()
  const ids = lote.map((c) => c.id)
  const { error } = await supabase
    .schema('pulso_content')
    .from('pipeline_producao')
    .update({ status: 'EM_EDICAO', updated_at: agora })
    .in('id', ids)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const custoCr = lote.length * CUSTO_POR_VIDEO_CR
  return NextResponse.json({
    success: true,
    autorizados: lote.length,
    itens: lote.map((c) => ({ numero: c.numero, titulo: c.titulo, canal: c.canal })),
    custoEstimadoCr: custoCr,
    custoEstimadoBrl: Math.round(custoCr * CREDITO_BRL * 100) / 100,
    nota: 'Autorizados pra render. O worker local (08/16/23h) renderiza dentro do teto de 600cr/dia.',
  })
}
