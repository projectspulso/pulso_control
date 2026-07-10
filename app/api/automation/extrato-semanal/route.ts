import { NextRequest, NextResponse } from 'next/server'
import { guardApi } from '@/lib/auth/api-guard'
import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { ASSINATURAS_TOTAL_BRL } from '@/lib/config/custos'

/**
 * EXTRATO SEMANAL DE CUSTOS — a "folha de pagamento" dos agentes/serviços do PULSO.
 *
 * Consolida os lançamentos de GASTO_SERVICO (logs_workflows) da semana que fechou,
 * quebrado POR SERVIÇO/AGENTE (higgsfield = vídeo, elevenlabs = voz, openai = roteiro),
 * separa consumo × recarga (topup) × assinatura, conta os vídeos produzidos e o custo
 * médio por vídeo, e anexa o saldo Higgsfield conhecido.
 *
 * GET|POST → calcula E persiste em pulso_core.configuracoes['extrato_semanal'] (histórico,
 *        1 registro por semana ISO, últimos 16). Idempotente: deduplica pela semana, então
 *        rodar de novo só reescreve a mesma linha. O cron de segunda (Vercel = GET) dispara isto.
 *
 * A parte financeira do app (aba Financeiro) lê esse snapshot — assim toda segunda o
 * financeiro nasce atualizado sozinho, sem depender da máquina local.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Lanc = { servico: string; brl: number; creditos: number | null; data: string; descricao: string }

// segunda a domingo da semana ANTERIOR à data de referência (quando roda seg de manhã,
// pega a semana que acabou de fechar). ref = agora por padrão.
function semanaAnterior(ref: Date) {
  const d = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate()))
  const dow = d.getUTCDay() === 0 ? 7 : d.getUTCDay() // 1=seg..7=dom
  const segAtual = new Date(d)
  segAtual.setUTCDate(d.getUTCDate() - (dow - 1)) // segunda desta semana
  const fim = new Date(segAtual)
  fim.setUTCDate(segAtual.getUTCDate() - 1) // domingo passado
  const ini = new Date(fim)
  ini.setUTCDate(fim.getUTCDate() - 6) // segunda passada
  const iso = (x: Date) => x.toISOString().slice(0, 10)
  return { ini: iso(ini), fim: iso(fim) }
}

// rótulo ISO-week (ex.: 2026-W28) só pra chavear o histórico sem colidir
function chaveSemana(iniISO: string) {
  const d = new Date(iniISO + 'T00:00:00Z')
  const jan1 = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const semana = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getUTCDay() + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(semana).padStart(2, '0')}`
}

const AGENTE: Record<string, string> = {
  higgsfield: 'Higgsfield (vídeo/Veo)',
  elevenlabs: 'ElevenLabs (voz)',
  openai: 'OpenAI (roteiro/legenda)',
}

async function montar(supabase: ReturnType<typeof getSupabaseAdminClient>, ref: Date) {
  const { ini, fim } = semanaAnterior(ref)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any
  const { data: logs } = await sb
    .schema('pulso_content')
    .from('logs_workflows')
    .select('detalhes')
    .eq('workflow_name', 'GASTO_SERVICO')
  const { data: cfg } = await sb
    .schema('pulso_core')
    .from('configuracoes')
    .select('valor')
    .eq('chave', 'higgsfield_saldo')
    .single()

  const lanc: Lanc[] = (logs || [])
    .map((l: { detalhes: Record<string, unknown> }) => l.detalhes || {})
    .map((d: Record<string, unknown>) => ({
      servico: String(d.servico || '?'),
      brl: Number(d.brl || 0),
      creditos: (d.creditos as number) ?? null,
      data: String(d.data || ''),
      descricao: String(d.descricao || ''),
    }))
    .filter((l: Lanc) => l.data >= ini && l.data <= fim)

  const porServico = new Map<string, { brl: number; creditos: number; n: number }>()
  let recargasBRL = 0
  const slugs = new Set<string>()
  for (const l of lanc) {
    if (l.servico === 'topup') { recargasBRL += l.brl; continue }
    if (l.servico === 'assinatura') continue // assinatura é fixa mensal, não entra no consumo semanal
    const a = porServico.get(l.servico) || { brl: 0, creditos: 0, n: 0 }
    a.brl += l.brl
    a.creditos += l.creditos || 0
    a.n += 1
    porServico.set(l.servico, a)
    if (l.servico === 'higgsfield' && l.descricao) slugs.add(l.descricao.split(' ')[0])
  }

  const consumoTotalBRL = [...porServico.values()].reduce((s, x) => s + x.brl, 0)
  const videos = slugs.size
  const saldo = cfg?.valor ? JSON.parse(cfg.valor) : null

  return {
    semana: chaveSemana(ini),
    periodo: `${ini} a ${fim}`,
    gerado_em: ref.toISOString(),
    consumoTotalBRL: Math.round(consumoTotalBRL * 100) / 100,
    recargasBRL: Math.round(recargasBRL * 100) / 100,
    assinaturasMensalBRL: Math.round(ASSINATURAS_TOTAL_BRL * 100) / 100,
    videosProduzidos: videos,
    custoMedioVideoBRL: videos ? Math.round((consumoTotalBRL / videos) * 100) / 100 : 0,
    saldoHiggsfield: saldo,
    porAgente: [...porServico.entries()]
      .map(([servico, x]) => ({
        servico,
        agente: AGENTE[servico] || servico,
        brl: Math.round(x.brl * 100) / 100,
        creditos: x.creditos,
        lancamentos: x.n,
      }))
      .sort((a, b) => b.brl - a.brl),
  }
}

async function gerarEPersistir(request: NextRequest) {
  const denied = await guardApi(request)
  if (denied) return denied
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseAdminClient() as any
  const extrato = await montar(supabase, new Date())

  const { data: cfg } = await supabase
    .schema('pulso_core')
    .from('configuracoes')
    .select('valor')
    .eq('chave', 'extrato_semanal')
    .single()
  let hist: Array<{ semana: string }> = []
  try { hist = cfg?.valor ? JSON.parse(cfg.valor) : [] } catch { hist = [] }
  hist = hist.filter((h) => h.semana !== extrato.semana) // dedupe pela semana
  hist.unshift(extrato)
  hist = hist.slice(0, 16)

  const payload = { chave: 'extrato_semanal', valor: JSON.stringify(hist) }
  const { error } = await supabase
    .schema('pulso_core')
    .from('configuracoes')
    .upsert(payload, { onConflict: 'chave' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, persistido: true, semanas_no_historico: hist.length, extrato })
}

export const GET = gerarEPersistir
export const POST = gerarEPersistir
