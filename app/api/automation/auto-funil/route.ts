import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { guardApi } from '@/lib/auth/api-guard'

/**
 * AUTO-FUNIL — enche o estoque SEM tirar a aprovação humana.
 *
 * Gera ROTEIRO (só) para ideias que VOCÊ já aprovou (status APROVADA) e que ainda
 * não têm roteiro, mirando o DÉFICIT da agenda (canais perenes nos próximos N dias
 * menos o que já está em produção). NÃO gera áudio: o roteiro fica pra você aprovar
 * — esse é o gate. Áudio→cenas→render seguem automáticos depois que você manda.
 *
 * Custo: só GPT (gerar-roteiro), capado a MAX_POR_RUN por execução. Nada de
 * ElevenLabs/Veo automático aqui. Cron diário.
 */

const MAX_POR_RUN = 3 // teto de roteiros gerados por execução (controle de custo)
const HORIZONTE_DIAS = 20
const EM_PRODUCAO = ['ROTEIRO_PRONTO', 'AUDIO_GERADO', 'EM_EDICAO', 'PRONTO_PUBLICACAO']
const TIER1 = ['curiosidade', 'mistério', 'misterio', 'psicologia', 'estudos', 'produtividade', 'casos reais', 'bizarr']
const TIER3 = ['do momento', 'momento', 'games', 'nostalgia']
const norm = (s: string) => (s || '').replace(/^PULSO\s*/i, '').trim().toLowerCase()
const tier = (n: string) => (TIER1.some((k) => norm(n).includes(k)) ? 1 : TIER3.some((k) => norm(n).includes(k)) ? 3 : 2)

async function autoFunil(request: NextRequest) {
  const denied = await guardApi(request)
  if (denied) return denied
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseAdminClient() as any

  const [{ data: ideias }, { data: roteiros }, { data: pipe }, { data: canais }, gradeRes, { data: cfgRow }] = await Promise.all([
    supabase.schema('pulso_content').from('ideias').select('id, titulo, canal_id, status, prioridade'),
    supabase.schema('pulso_content').from('roteiros').select('ideia_id'),
    supabase.schema('pulso_content').from('pipeline_producao').select('ideia_id, status'),
    supabase.schema('pulso_core').from('canais').select('id, nome'),
    supabase.from('vw_agenda_semanal').select('dia_semana, faixa, canal_nome').eq('ativo', true),
    supabase.schema('pulso_core').from('configuracoes').select('valor').eq('chave', 'linha_producao').maybeSingle(),
  ])
  // cap diário vem da linha de produção (fallback = MAX_POR_RUN)
  let maxPorRun = MAX_POR_RUN
  try { if (cfgRow?.valor) maxPorRun = JSON.parse(cfgRow.valor).roteiros_dia_max ?? MAX_POR_RUN } catch { /* default */ }
  const nomeCanal = new Map<string, string>((canais || []).map((c: { id: string; nome: string }) => [c.id, c.nome]))
  const canalDe = (id: string | null): string => nomeCanal.get(id || '') || '—'

  // DEMANDA: slots perenes por canal nos próximos N dias
  const demanda = new Map<string, number>()
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0)
  const grade = (gradeRes.data || []).filter((g: { faixa: string }) => g.faixa === 'perene')
  for (let i = 0; i < HORIZONTE_DIAS; i++) {
    const d = new Date(hoje); d.setDate(hoje.getDate() + i)
    const wd = d.getDay() === 0 ? 7 : d.getDay()
    for (const g of grade) if (g.dia_semana === wd) demanda.set(norm(g.canal_nome), (demanda.get(norm(g.canal_nome)) || 0) + 1)
  }
  // EM PRODUÇÃO por canal (roteiro→pronto) = o que já cobre a demanda
  const emProd = new Map<string, number>()
  const canalDaIdeia = new Map<string, string | null>((ideias || []).map((i: { id: string; canal_id: string | null }) => [i.id, i.canal_id]))
  for (const p of pipe || []) {
    if (!EM_PRODUCAO.includes(p.status)) continue
    const c = norm(canalDe(canalDaIdeia.get(p.ideia_id) as string | null))
    emProd.set(c, (emProd.get(c) || 0) + 1)
  }
  const deficit = (canalNome: string) => Math.max(0, (demanda.get(norm(canalNome)) || 0) - (emProd.get(norm(canalNome)) || 0))

  // ALVOS: ideias APROVADA sem roteiro, em canais com déficit — PRIORIDADE manda primeiro
  // (a fila do concorrente foi ranqueada 10→7 e o dono quer produção NESSA sequência; ideia
  // comum tem prioridade 5, então a trilha do benchmark flui na ordem sem starvar o déficit).
  const comRoteiro = new Set((roteiros || []).map((r: { ideia_id: string }) => r.ideia_id))
  const alvos = (ideias || [])
    .filter((i: { id: string; status: string; canal_id: string | null }) => i.status === 'APROVADA' && i.canal_id && !comRoteiro.has(i.id))
    .map((i: { id: string; titulo: string; canal_id: string | null; prioridade: number | null }) => ({ ...i, canal: canalDe(i.canal_id), def: deficit(canalDe(i.canal_id)) }))
    .filter((i: { def: number }) => i.def > 0)
    .sort((a: { def: number; canal: string; prioridade: number | null }, b: { def: number; canal: string; prioridade: number | null }) =>
      (b.prioridade ?? 5) - (a.prioridade ?? 5) || b.def - a.def || tier(a.canal) - tier(b.canal))
    .slice(0, maxPorRun)

  // gera o roteiro de cada (self-call à rota que já existe; repassa o segredo do cron)
  const origin = new URL(request.url).origin
  const auth = request.headers.get('authorization') || ''
  const gerados: Array<{ titulo: string; canal: string; ok: boolean; erro?: string }> = []
  for (const a of alvos) {
    try {
      const r = await fetch(`${origin}/api/automation/gerar-roteiro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: auth },
        body: JSON.stringify({ ideia_id: a.id }),
      })
      const d = await r.json().catch(() => ({}))
      gerados.push({ titulo: a.titulo, canal: a.canal, ok: r.ok, erro: r.ok ? undefined : d.error || `HTTP ${r.status}` })
    } catch (e) {
      gerados.push({ titulo: a.titulo, canal: a.canal, ok: false, erro: e instanceof Error ? e.message : 'erro' })
    }
  }

  return NextResponse.json({
    success: true,
    candidatos: alvos.length,
    gerados: gerados.filter((g) => g.ok).length,
    detalhe: gerados,
    nota: 'Roteiros gerados ficam pra APROVAÇÃO HUMANA antes do áudio (gate preservado).',
  })
}

export async function POST(request: NextRequest) {
  return autoFunil(request)
}
export async function GET(request: NextRequest) {
  return autoFunil(request)
}
