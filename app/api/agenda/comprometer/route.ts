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
  // REALINHAR: por padrao quem ja tem data e intocavel — mas a data velha pode ter virado
  // buraco. Em 01/09/2026 os 11 prontos estavam carimbados para 05-11/09 enquanto o plano
  // mandava publicar a partir de 01/09: o cron ficou ocioso 4 dias e a cadencia caiu pela
  // metade. Com realinhar:true a data do pipeline volta a seguir o plano (so para quem ainda
  // NAO foi publicado). Sem a flag, o comportamento antigo continua.
  const realinhar = body?.realinhar === true

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseAdminClient() as any
  const hoje = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })

  const [planoQ, pipeQ, pubQ, ideiasQ, cfgQ] = await Promise.all([
    supabase.schema('pulso_content').from('agenda_atribuicoes')
      .select('data, horario, ideia_id').gte('data', hoje).not('ideia_id', 'is', null).order('data'),
    supabase.schema('pulso_content').from('pipeline_producao')
      .select('id, ideia_id, status, metadata, data_publicacao_planejada'),
    supabase.schema('pulso_content').from('metricas_publicacao').select('ideia_id, data_publicacao'),
    supabase.schema('pulso_content').from('ideias').select('id, titulo, formato'),
    supabase.schema('pulso_core').from('configuracoes').select('valor').eq('chave', 'linha_producao').maybeSingle(),
  ])
  if (planoQ.error) return NextResponse.json({ error: `plano: ${planoQ.error.message}` }, { status: 500 })
  if (pipeQ.error) return NextResponse.json({ error: `pipeline: ${pipeQ.error.message}` }, { status: 500 })

  const titulo = Object.fromEntries((ideiasQ.data || []).map((i: { id: string; titulo: string }) => [i.id, i.titulo]))
  const ehLongo = new Set(
    ((ideiasQ.data || []) as Array<{ id: string; formato?: string }>).filter((i) => i.formato === 'longo').map((i) => i.id)
  )
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
  const aRealinhar: Array<{ numero: number | null; de: string; para: string }> = []
  const pulados: Array<{ numero: number | null; titulo: string; motivo: string }> = []

  const agora = new Date().toLocaleString('sv-SE', { timeZone: 'America/Sao_Paulo' }).replace(' ', 'T')

  // O SLOT É TEMPO, O VÍDEO É CONTEÚDO — e soldar os dois foi o que bagunçou a fila em 04/09/2026.
  //
  // Esta rota andava pelo plano SLOT A SLOT e, quando a ideia daquele slot não estava pronta,
  // deixava o dia VAZIO. O resultado, medido: 44 vídeos prontos, 8 dias sem nada (10 a 14/09, 16,
  // 21, 22) e 14 sem data nenhuma, espalhados até 01/10 — enquanto 2/dia cobriria 22 dias
  // corridos. Com `realinhar` era pior: reescrevia data boa para o buraco do plano.
  //
  // A inteligência do roteador é a ORDEM (que vídeo vem antes de qual, por desempenho de tema),
  // não a célula do calendário. Então: mantém-se a ordem dele e as datas são preenchidas
  // DENSAMENTE com o que existe. Slot vazio com estoque pronto é erro, nunca plano.
  const ordemPlano = new Map<string, number>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;((planoQ.data || []) as any[]).forEach((slot, i) => {
    if (slot.ideia_id && !ordemPlano.has(slot.ideia_id)) ordemPlano.set(slot.ideia_id, i)
  })

  // Slots do plano ainda no futuro, sem repetir horário, do mais cedo ao mais tarde.
  const slots: string[] = []
  const vistoSlot = new Set<string>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const slot of (planoQ.data || []) as any[]) {
    const quando = quandoBRT(slot.data, slot.horario)
    if (quando <= agora || vistoSlot.has(quando)) continue
    vistoSlot.add(quando)
    slots.push(quando)
  }
  slots.sort()

  // Quem pode receber data: pronto, com vídeo, não publicado, formato curto.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const candidatos = ((pipeQ.data || []) as any[]).filter((p) => {
    if (!p.ideia_id) return false
    const rot = { numero: p.metadata?.numero ?? null, titulo: String(titulo[p.ideia_id] || '').slice(0, 50) }
    if (ehLongo.has(p.ideia_id)) return false // publicação deliberada, fora da esteira de Shorts
    if (jaPublicado.has(p.ideia_id)) return false
    if (p.status !== 'PRONTO_PUBLICACAO') return false
    if (!p.metadata?.video_url) { pulados.push({ ...rot, motivo: 'sem video_url' }); return false }
    // Sem realinhar, quem já tem data é intocável — o padrão continua conservador.
    if (p.data_publicacao_planejada && !realinhar) {
      pulados.push({ ...rot, motivo: `já tem data (${String(p.data_publicacao_planejada).slice(0, 16)})` })
      return false
    }
    return true
  })

  candidatos.sort((a, b) => {
    const oa = ordemPlano.has(a.ideia_id) ? ordemPlano.get(a.ideia_id)! : 99999
    const ob = ordemPlano.has(b.ideia_id) ? ordemPlano.get(b.ideia_id)! : 99999
    if (oa !== ob) return oa - ob
    return String(a.data_publicacao_planejada || '9').localeCompare(String(b.data_publicacao_planejada || '9'))
  })

  // Realinhando, a grade é redistribuída do zero; senão, respeita-se o que já está marcado.
  const ocupado = new Set<string>()
  if (!realinhar) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const p of (pipeQ.data || []) as any[]) {
      if (p.data_publicacao_planejada) ocupado.add(String(p.data_publicacao_planejada).slice(0, 16))
    }
  }
  // Contagem por dia começa do que já está marcado (ou zerada, se vamos redistribuir tudo) e
  // SOBE a cada slot entregue — sem isso o teto seria furado dentro da própria rodada.
  const porDia: Record<string, number> = realinhar ? {} : { ...ocupacao }
  const proximoSlot = () => {
    while (slots.length) {
      const q = slots.shift()!
      const dia = q.slice(0, 10)
      if (!realinhar && ocupado.has(q.slice(0, 16))) continue
      if ((porDia[dia] || 0) >= tetoDia) continue
      porDia[dia] = (porDia[dia] || 0) + 1
      return q
    }
    return null
  }

  for (const p of candidatos) {
    const rot = { numero: p.metadata?.numero ?? null, titulo: String(titulo[p.ideia_id] || '').slice(0, 50) }
    const quando = proximoSlot()
    if (!quando) {
      pulados.push({ ...rot, motivo: 'sem slot livre no horizonte do plano' })
      continue
    }
    const atual = p.data_publicacao_planejada ? String(p.data_publicacao_planejada).slice(0, 16) : null
    if (atual && atual !== quando.slice(0, 16)) aRealinhar.push({ numero: rot.numero, de: atual, para: quando })
    if (atual === quando.slice(0, 16)) continue // já está no lugar certo: nada a gravar
    aGravar.push({ id: p.id, numero: rot.numero, titulo: rot.titulo, quando })
  }

  // O AVISO QUE OFERECE O REALINHAMENTO. Sem realinhar, `aRealinhar` fica vazio por construção
  // (só entram itens sem data), e o botão âmbar nunca apareceria — o dono não descobriria que
  // existe conserto. O sinal honesto é outro: sobrou dia abaixo da meta COM vídeo pronto marcado
  // depois dele? Se sim, há estoque no lugar errado, e redistribuir resolve.
  let diasComBuraco = 0
  if (!realinhar) {
    const ocupFinal: Record<string, number> = { ...ocupacao }
    for (const g of aGravar) ocupFinal[g.quando.slice(0, 10)] = (ocupFinal[g.quando.slice(0, 10)] || 0) + 1
    const dias = Object.keys(ocupFinal).sort()
    const ultimo = dias[dias.length - 1]
    for (const d of dias) {
      if (d < agora.slice(0, 10) || (ocupFinal[d] || 0) >= tetoDia) continue
      if (d < ultimo) diasComBuraco++ // há material marcado depois deste dia magro
    }
  }

  if (!confirmar) {
    return NextResponse.json({
      success: true,
      simulacao: true,
      agendaria: aGravar.length,
      plano: aGravar,
      realinhamentos: aRealinhar,
      divergentes: realinhar ? aRealinhar.length : diasComBuraco,
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

  return NextResponse.json({ success: true, gravados, realinhados: aRealinhar.length, pulados: pulados.length, erros, plano: aGravar })
}

export async function POST(request: NextRequest) {
  return comprometer(request)
}
