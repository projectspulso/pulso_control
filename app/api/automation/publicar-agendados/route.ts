import { NextRequest, NextResponse } from 'next/server'
import { guardApi } from '@/lib/auth/api-guard'
import { repassarCredencial } from '@/lib/auth/repassar-credencial'
import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { REDES_API_SEGURAS } from '@/lib/publicacao/redes-api'

/**
 * O DESPERTADOR DA PUBLICAÇÃO — a metade que faltava do botão "Agendar".
 *
 * O botão sempre gravou `data_publicacao_planejada` e nada mais. Cinco lugares no app LEEM essa
 * coluna, e os cinco só a exibem: o card mostra a data, a lista ordena por ela. Nenhum publica.
 * Em 07/08/2026 o dono agendou dois vídeos (#138 às 20:06 e #139 às 19:05), clicou "enviar" num
 * terceiro — e só o terceiro saiu. Mesma preparação nos três; a diferença foi o gatilho.
 *
 * Esta rota NÃO reimplementa publicação. Ela faz uma pergunta e delega:
 *   "tem PRONTO_PUBLICACAO com hora vencida e ainda não publicado?" → chama /api/automation/publicar
 * A rota de publicar já é idempotente por (ideia, rede), já monta a legenda, já grava o resultado
 * por rede. Duplicar essa lógica aqui seria criar uma segunda verdade.
 *
 * PORQUE ISSO NÃO FERE O GATE HUMANO (R-011): o `confirmar: true` existe para impedir que algo
 * saia sem decisão do dono. Agendar É a decisão — ela só acontece antes, quando ele marca a hora,
 * em vez de no instante do disparo. O que o cron não pode é inventar o que publicar, e por isso
 * ele só toca no que TEM data marcada à mão.
 */

export const maxDuration = 60

/** Sem isso um bug de data viraria dez posts numa hora. O teto vem da config da linha. */
const TETO_PADRAO_POR_DIA = 2
/** Não ressuscita agendamento antigo: hora que venceu há dias não é plano, é esquecimento. */
const JANELA_ATRASO_HORAS = 12

async function publicarAgendados(request: NextRequest) {
  const denied = await guardApi(request)
  if (denied) return denied

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseAdminClient() as any
  const agora = new Date()
  const limiteAtraso = new Date(agora.getTime() - JANELA_ATRASO_HORAS * 3600_000)

  const [pipeQ, pubQ, cfgQ] = await Promise.all([
    supabase.schema('pulso_content').from('pipeline_producao')
      .select('id, ideia_id, status, metadata, data_publicacao_planejada')
      .eq('status', 'PRONTO_PUBLICACAO')
      .not('data_publicacao_planejada', 'is', null),
    supabase.schema('pulso_content').from('metricas_publicacao')
      .select('ideia_id, plataforma, data_publicacao'),
    supabase.schema('pulso_core').from('configuracoes').select('valor').eq('chave', 'linha_producao').maybeSingle(),
  ])
  if (pipeQ.error) return NextResponse.json({ error: `pipeline: ${pipeQ.error.message}` }, { status: 500 })
  if (pubQ.error) return NextResponse.json({ error: `publicacoes: ${pubQ.error.message}` }, { status: 500 })

  let tetoDia = TETO_PADRAO_POR_DIA
  try {
    const raw = cfgQ.data?.valor
    const cfg = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (cfg?.publicar_dia) tetoDia = cfg.publicar_dia
  } catch { /* mantém o padrão */ }

  // Quantos VÍDEOS já saíram hoje (por ideia, não por linha — 1 vídeo em 3 redes conta 1).
  const hoje = agora.toISOString().slice(0, 10)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pubs = (pubQ.data || []) as any[]
  const publicadosHoje = new Set(
    pubs.filter((p) => (p.data_publicacao || '').slice(0, 10) === hoje).map((p) => p.ideia_id)
  )
  // Já publicado em ALGUMA rede = não é mais candidato do agendamento (o resto é escolha manual).
  const jaSaiu = new Set(pubs.filter((p) => p.data_publicacao).map((p) => p.ideia_id))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vencidos = ((pipeQ.data || []) as any[])
    .filter((p) => {
      const quando = new Date(p.data_publicacao_planejada)
      return quando <= agora && quando >= limiteAtraso && !jaSaiu.has(p.ideia_id)
    })
    .sort((a, b) => (a.data_publicacao_planejada < b.data_publicacao_planejada ? -1 : 1))

  const vagas = Math.max(0, tetoDia - publicadosHoje.size)
  const aDisparar = vencidos.slice(0, vagas)

  const origin = new URL(request.url).origin
  const credenciais = repassarCredencial(request)
  const resultados: Array<{ numero: number | null; marcado: string; redes: string; ok: boolean }> = []

  for (const p of aDisparar) {
    const md = p.metadata || {}
    if (!md.video_url) {
      resultados.push({ numero: md.numero ?? null, marcado: p.data_publicacao_planejada, redes: 'sem video_url — pulado', ok: false })
      continue
    }
    // Uma chamada por rede, igual à tela faz: assim uma rede que falha não derruba as outras.
    const porRede: string[] = []
    for (const rede of REDES_API_SEGURAS) {
      try {
        const r = await fetch(`${origin}/api/automation/publicar`, {
          method: 'POST',
          headers: credenciais,
          body: JSON.stringify({
            pipeline_id: p.id, video_url: md.video_url, caption: md.caption,
            plataformas: [rede], confirmar: true,
          }),
        })
        const d = await r.json().catch(() => ({}))
        const r0 = (d.resultados || [])[0]
        porRede.push(`${rede}:${r0?.status || (d.error ? 'ERRO' : '?')}`)
      } catch (e) {
        porRede.push(`${rede}:FALHOU(${e instanceof Error ? e.message.slice(0, 40) : 'erro'})`)
      }
    }
    resultados.push({
      numero: md.numero ?? null,
      marcado: p.data_publicacao_planejada,
      redes: porRede.join(' · '),
      ok: porRede.some((x) => x.includes('PUBLICADO')),
    })
  }

  // O Instagram costuma voltar PROCESSANDO (o container leva 30-60s e a Vercel corta em 60).
  // Na tela, quem fecha isso é o próprio navegador chamando reconciliar 40s e 90s depois. Aqui
  // não há navegador, então o cron chama uma vez — o cron de reconciliação segue de backstop.
  if (resultados.some((r) => r.redes.includes('PROCESSANDO'))) {
    fetch(`${origin}/api/automation/reconciliar-publicacoes`, { method: 'POST', headers: credenciais }).catch(() => {})
  }

  // Registro no razão. A publicação nunca escreveu em logs_workflows, e foi por isso que o erro
  // do YouTube (token expirado) passou dois dias invisível. Automático sem rastro é pior que
  // manual: ninguém está olhando na hora.
  if (resultados.length > 0) {
    await supabase.schema('pulso_content').from('logs_workflows').insert({
      workflow_name: 'PUBLICAR_AGENDADOS',
      status: resultados.every((r) => r.ok) ? 'sucesso' : 'parcial',
      detalhes: { disparados: resultados.length, teto_dia: tetoDia, ja_hoje: publicadosHoje.size, resultados },
    }).then(() => {}, () => {})
  }

  return NextResponse.json({
    success: true,
    agendados_vencidos: vencidos.length,
    teto_dia: tetoDia,
    ja_publicados_hoje: publicadosHoje.size,
    disparados: resultados.length,
    resultados,
    nota: vencidos.length > aDisparar.length
      ? `${vencidos.length - aDisparar.length} ficaram para a próxima rodada (teto diário de ${tetoDia}).`
      : undefined,
  })
}

export async function POST(request: NextRequest) {
  return publicarAgendados(request)
}

// Vercel Cron chama por GET.
export async function GET(request: NextRequest) {
  return publicarAgendados(request)
}
