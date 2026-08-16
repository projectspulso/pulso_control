import { NextRequest, NextResponse } from 'next/server'
import { guardApi } from '@/lib/auth/api-guard'
import { getSupabaseAdminClient } from '@/lib/supabase/server'

/**
 * A PONTE QUE FALTAVA — o plano inteligente vira data que o cron dispara.
 *
 * Havia DUAS agendas paralelas que nunca se encontravam:
 *   · `agenda_atribuicoes` — o plano bom, montado por lib/agenda/roteador.ts, que pontua por
 *     desempenho de tema e trava repetição. Alimentava o calendário e NÃO disparava nada.
 *   · `pipeline_producao.data_publicacao_planejada` — o que o cron pg_cron lê para publicar.
 *     Vinha sendo preenchido À MÃO, em script, um vídeo de cada vez.
 *
 * O cérebro planejava numa tabela; o publicador lia outra. Em 13/08/2026 agendei nove vídeos à
 * mão aplicando exatamente as regras que o roteador já sabe — o trabalho manual era o sintoma.
 *
 * Esta rota copia o plano para onde ele tem efeito. NÃO decide nada por conta própria: quem
 * escolhe o vídeo de cada slot continua sendo o roteador.
 *
 * R-011: por padrão é SIMULAÇÃO. Só grava com `confirmar: true` — a decisão de por data em
 * publicação segue sendo humana, ela só deixa de ser digitada uma por uma.
 */

export const maxDuration = 60

/** A coluna é `timestamp` sem fuso e o cron a lê como Brasília. Ver docs/20_BANCO/MIGRACAO_FUSO. */
function quandoBRT(data: string, horario: string): string {
  return `${data}T${String(horario).slice(0, 5)}:00`
}

async function comprometer(request: NextRequest) {
  const denied = await guardApi(request)
  if (denied) return denied

  const body = await request.json().catch(() => ({}))
  const confirmar = body?.confirmar === true

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseAdminClient() as any
  const hoje = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })

  const [planoQ, pipeQ, pubQ, ideiasQ, cfgQ] = await Promise.all([
    supabase.schema('pulso_content').from('agenda_atribuicoes')
      .select('data, horario, ideia_id').gte('data', hoje).not('ideia_id', 'is', null).order('data'),
    supabase.schema('pulso_content').from('pipeline_producao')
      .select('id, ideia_id, status, metadata, data_publicacao_planejada'),
    supabase.schema('pulso_content').from('metricas_publicacao').select('ideia_id, data_publicacao'),
    supabase.schema('pulso_content').from('ideias').select('id, titulo'),
    supabase.schema('pulso_core').from('configuracoes').select('valor').eq('chave', 'linha_producao').maybeSingle(),
  ])
  if (planoQ.error) return NextResponse.json({ error: `plano: ${planoQ.error.message}` }, { status: 500 })
  if (pipeQ.error) return NextResponse.json({ error: `pipeline: ${pipeQ.error.message}` }, { status: 500 })

  const titulo = Object.fromEntries((ideiasQ.data || []).map((i: { id: string; titulo: string }) => [i.id, i.titulo]))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pipePorIdeia = new Map<string, any>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const p of (pipeQ.data || []) as any[]) if (p.ideia_id) pipePorIdeia.set(p.ideia_id, p)
  const jaPublicado = new Set(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((pubQ.data || []) as any[]).filter((m) => m.data_publicacao).map((m) => m.ideia_id)
  )

  // TETO POR DIA — sem isto a rota criava plano que o cron não honra.
  // Flagrado na simulação de 14/08: o dia 16 já tinha 2 vídeos agendados à mão e o plano queria
  // pôr mais 2. Quatro num dia de teto 2 significa dois descartados em silêncio na hora H.
  // Conta o que JÁ está marcado (por qualquer via) antes de acrescentar.
  let tetoDia = 2
  try {
    const raw = cfgQ.data?.valor
    const cfg = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (cfg?.publicar_dia) tetoDia = cfg.publicar_dia
  } catch { /* mantém o padrão */ }

  const ocupacao: Record<string, number> = {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const p of (pipeQ.data || []) as any[]) {
    if (!p.data_publicacao_planejada) continue
    const dia = String(p.data_publicacao_planejada).slice(0, 10)
    ocupacao[dia] = (ocupacao[dia] || 0) + 1
  }

  const aGravar: Array<{ id: string; numero: number | null; titulo: string; quando: string }> = []
  const pulados: Array<{ numero: number | null; titulo: string; motivo: string }> = []
  const vistos = new Set<string>()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const slot of (planoQ.data || []) as any[]) {
    const p = pipePorIdeia.get(slot.ideia_id)
    const md = p?.metadata || {}
    const rot = { numero: md.numero ?? null, titulo: String(titulo[slot.ideia_id] || '').slice(0, 50) }

    if (!p) { pulados.push({ ...rot, motivo: 'sem linha no pipeline' }); continue }
    if (jaPublicado.has(slot.ideia_id)) { pulados.push({ ...rot, motivo: 'já publicado' }); continue }
    // O plano inclui itens ainda em roteiro/áudio. Data só em quem o cron consegue publicar —
    // carimbar data em vídeo inexistente é promessa que a rodada das 18h não cumpre.
    if (p.status !== 'PRONTO_PUBLICACAO') { pulados.push({ ...rot, motivo: `ainda em ${p.status}` }); continue }
    if (!md.video_url) { pulados.push({ ...rot, motivo: 'sem video_url' }); continue }
    if (p.data_publicacao_planejada) { pulados.push({ ...rot, motivo: 'já tem data' }); continue }
    if (vistos.has(slot.ideia_id)) { pulados.push({ ...rot, motivo: 'repetido no plano' }); continue }
    if ((ocupacao[slot.data] || 0) >= tetoDia) {
      pulados.push({ ...rot, motivo: `dia ${slot.data} já cheio (teto ${tetoDia})` })
      continue
    }

    ocupacao[slot.data] = (ocupacao[slot.data] || 0) + 1
    vistos.add(slot.ideia_id)
    aGravar.push({ id: p.id, numero: rot.numero, titulo: rot.titulo, quando: quandoBRT(slot.data, slot.horario) })
  }

  if (!confirmar) {
    return NextResponse.json({
      success: true,
      simulacao: true,
      agendaria: aGravar.length,
      plano: aGravar,
      pulados,
      nota: 'Nada foi gravado. Reenvie com confirmar: true para comprometer estas datas.',
    })
  }

  let gravados = 0
  const erros: string[] = []
  for (const item of aGravar) {
    const { error } = await supabase.schema('pulso_content').from('pipeline_producao')
      .update({ data_publicacao_planejada: item.quando }).eq('id', item.id)
    if (error) erros.push(`#${item.numero}: ${error.message}`)
    else gravados++
  }

  await supabase.schema('pulso_content').from('logs_workflows').insert({
    workflow_name: 'AUTO_AGENDAR',
    status: erros.length ? 'parcial' : gravados ? 'sucesso' : 'ocioso',
    detalhes: { gravados, pulados: pulados.length, erros, plano: aGravar },
  }).then(() => {}, () => {})

  return NextResponse.json({ success: true, gravados, pulados: pulados.length, erros, plano: aGravar })
}

export async function POST(request: NextRequest) {
  return comprometer(request)
}
