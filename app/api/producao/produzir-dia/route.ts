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
const ALVO_PADRAO = 4 // publica 3/dia firme → produz 4 pra reconstruir buffer devagar

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
}

async function levantar() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseAdminClient() as any
  const [{ data: pipe }, { data: ideias }, { data: canais }] = await Promise.all([
    supabase.schema('pulso_content').from('pipeline_producao').select('id, ideia_id, status, metadata'),
    supabase.schema('pulso_content').from('ideias').select('id, titulo, canal_id'),
    supabase.schema('pulso_core').from('canais').select('id, nome'),
  ])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ide = new Map<string, any>((ideias || []).map((i: any) => [i.id, i]))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cn = new Map<string, string>((canais || []).map((c: any) => [c.id, (c.nome || '').replace(/^PULSO\s*/i, '')]))
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
    }
  }

  const ordenar = (a: Candidato, b: Candidato) => a.tier - b.tier || (a.numero ?? 999) - (b.numero ?? 999)

  const prontosParaAutorizar = pp.filter((p) => p.status === 'AUDIO_GERADO' && temCenas(p)).map(mapCand).sort(ordenar)
  const semCenas = pp.filter((p) => p.status === 'AUDIO_GERADO' && !temCenas(p)).map(mapCand).sort(ordenar)
  const jaAutorizados = pp.filter((p) => p.status === 'EM_EDICAO' && temCenas(p)).map(mapCand).sort(ordenar)
  const prontosEstoque = pp.filter((p) => p.status === 'PRONTO_PUBLICACAO' && p.metadata?.video_url).length

  return { supabase, prontosParaAutorizar, semCenas, jaAutorizados, prontosEstoque }
}

export async function GET(request: NextRequest) {
  const denied = await guardApi(request)
  if (denied) return denied

  const { prontosParaAutorizar, semCenas, jaAutorizados, prontosEstoque } = await levantar()
  const alvo = ALVO_PADRAO
  const faltam = Math.max(0, alvo - jaAutorizados.length)
  const lote = prontosParaAutorizar.slice(0, faltam)
  const custoCr = lote.length * CUSTO_POR_VIDEO_CR

  return NextResponse.json({
    alvo,
    jaAutorizados: jaAutorizados.length,
    prontosEstoque,
    autorizaveis: prontosParaAutorizar.length,
    semCenas: semCenas.length,
    loteSugerido: lote,
    itensSemCenas: semCenas,
    custoEstimadoCr: custoCr,
    custoEstimadoBrl: Math.round(custoCr * CREDITO_BRL * 100) / 100,
  })
}

export async function POST(request: NextRequest) {
  const denied = await guardApi(request)
  if (denied) return denied

  const body = await request.json().catch(() => ({}))
  const alvo = Number.isFinite(body?.alvo) ? Math.max(1, Math.min(10, body.alvo)) : ALVO_PADRAO

  const { supabase, prontosParaAutorizar, jaAutorizados } = await levantar()
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
