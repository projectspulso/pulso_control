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

/**
 * QUEM CHAMA ESTA ROTA: pg_cron dentro do Postgres — NÃO o cron da Vercel.
 *
 * Duas tentativas fracassaram no plano Hobby, cada uma falhando em silêncio de um jeito
 * diferente, e as duas custaram dias:
 *
 *  1. `5 * * * *` no vercel.json → a Vercel RECUSA O DEPLOY INTEIRO ("Hobby accounts are limited
 *     to daily cron jobs"). Pelo GitHub a recusa é muda: nenhum build na lista, nem como erro.
 *     Cinco commits ficaram fora do ar por dois dias.
 *  2. Três crons diários (15/21/00 UTC) → o deploy passou, os três apareceram no painel e
 *     NENHUM executou. Outros crons do mesmo projeto rodaram no mesmo dia (o `coletar-metricas`
 *     renovou o token do TikTok às 11:40 UTC), então não é o projeto: é limite de cron do Hobby
 *     mordendo os jobs novos. Resultado: o dia 61 do desafio ficou sem publicação.
 *
 * Agora o agendamento mora no banco (`cron.schedule` + `net.http_post`, segredo no Vault), igual
 * ao limelight. O Postgres não tem plano Hobby: aceita a frequência que quisermos e não depende
 * de deploy. De hora em hora — qualquer horário da grade é alcançado em no máximo 60 minutos, e
 * as travas abaixo (teto diário + janela de 12h) é que decidem o que sai.
 *
 * Ver docs/20_BANCO/CRON_PUBLICACAO.md.
 */
export const maxDuration = 60

/**
 * O FUSO, que quase custou 3 horas de erro silencioso.
 *
 * `data_publicacao_planejada` é `timestamp WITHOUT time zone`: o banco guarda "2026-08-08T11:00:00"
 * e descarta qualquer offset que a gente mande. Um `new Date()` nessa string usa o fuso do
 * PROCESSO — que aqui na máquina do dono é BRT e na Vercel é UTC. O mesmo agendamento dispararia
 * às 11h em teste e às 8h em produção, e nada no log denunciaria.
 *
 * A intenção de quem marca a hora é sempre horário de Brasília. Então é isso que assumimos,
 * explicitamente, em vez de deixar o fuso do servidor decidir.
 */
const FUSO_DO_DONO = '-03:00'

function horaMarcada(valor: string): Date {
  // já tem offset (Z ou ±hh:mm)? respeita. Senão, é hora de Brasília.
  return /[Zz]|[+-]\d{2}:?\d{2}$/.test(valor) ? new Date(valor) : new Date(`${valor}${FUSO_DO_DONO}`)
}

/** Data no calendário do dono (YYYY-MM-DD em Brasília), não no do servidor. */
function diaBRT(d: Date): string {
  return d.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
}

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
  //
  // O DIA É O DE BRASÍLIA, não o do UTC. Contar em UTC engoliu o #138 em 08/08/2026: às 18:05 BRT
  // a rota somou o #139 (publicado à tarde) com o #140 — que saiu às 23:30 BRT do DIA ANTERIOR e,
  // em UTC, cai no dia seguinte. Teto cheio, nada disparou, e como nada dispara não grava log:
  // some sem deixar rastro. Qualquer publicação depois das 21h BRT roubava a vaga do dia seguinte.
  const hoje = diaBRT(agora)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pubs = (pubQ.data || []) as any[]
  const publicadosHoje = new Set(
    pubs.filter((p) => p.data_publicacao && diaBRT(new Date(p.data_publicacao)) === hoje).map((p) => p.ideia_id)
  )
  // Já publicado em ALGUMA rede = não é mais candidato do agendamento (o resto é escolha manual).
  const jaSaiu = new Set(pubs.filter((p) => p.data_publicacao).map((p) => p.ideia_id))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vencidos = ((pipeQ.data || []) as any[])
    .filter((p) => {
      const quando = horaMarcada(p.data_publicacao_planejada)
      return quando <= agora && quando >= limiteAtraso && !jaSaiu.has(p.ideia_id)
    })
    .sort((a, b) => (a.data_publicacao_planejada < b.data_publicacao_planejada ? -1 : 1))

  // UM VÍDEO POR RODADA. A função morre aos 60s (teto do Hobby) e um vídeo já consome quase isso
  // por causa do Instagram. Dois na mesma rodada garantiriam timeout no segundo. Como o cron bate
  // de hora em hora e a janela de atraso é de 12h, o acúmulo se resolve nas rodadas seguintes.
  const vagas = Math.max(0, tetoDia - publicadosHoje.size)
  const aDisparar = vencidos.slice(0, Math.min(vagas, 1))

  const origin = new URL(request.url).origin
  const credenciais = repassarCredencial(request)
  const resultados: Array<{ numero: number | null; marcado: string; redes: string; ok: boolean }> = []

  for (const p of aDisparar) {
    const md = p.metadata || {}
    if (!md.video_url) {
      resultados.push({ numero: md.numero ?? null, marcado: p.data_publicacao_planejada, redes: 'sem video_url — pulado', ok: false })
      continue
    }
    // AS TRÊS REDES EM PARALELO — e cada uma com prazo próprio.
    //
    // Em sequência isto perdia o TikTok todo dia. Medido em 10/08/2026 no #114: YouTube e
    // Instagram publicaram às 12:05, o TikTok não saiu e a rodada nem chegou a gravar log. O
    // Instagram espera o container ficar pronto (30-60s) e sozinho estourava os 60s da função;
    // como o TikTok é o último da lista, era sempre ele que ficava para trás. Não era escolha,
    // era a função sendo morta no meio.
    //
    // Em paralelo o tempo total passa a ser o da rede mais lenta, não a soma. O AbortController
    // garante que uma rede pendurada não leve as outras junto nem impeça o log no fim.
    const PRAZO_POR_REDE_MS = 45_000
    const porRede = await Promise.all(
      REDES_API_SEGURAS.map(async (rede) => {
        const cancelar = AbortSignal.timeout(PRAZO_POR_REDE_MS)
        try {
          const r = await fetch(`${origin}/api/automation/publicar`, {
            method: 'POST',
            headers: credenciais,
            signal: cancelar,
            body: JSON.stringify({
              pipeline_id: p.id, video_url: md.video_url, caption: md.caption,
              plataformas: [rede], confirmar: true,
            }),
          })
          const d = await r.json().catch(() => ({}))
          const r0 = (d.resultados || [])[0]
          return `${rede}:${r0?.status || (d.error ? 'ERRO' : '?')}`
        } catch (e) {
          const msg = e instanceof Error && e.name === 'TimeoutError' ? `PRAZO(${PRAZO_POR_REDE_MS / 1000}s)` : e instanceof Error ? e.message.slice(0, 40) : 'erro'
          return `${rede}:FALHOU(${msg})`
        }
      })
    )
    // `ok` exige TODAS as redes, não "alguma". Com `some`, o #114 de 10/08 — que saiu no YouTube
    // e no Instagram e não saiu no TikTok — teria sido registrado como sucesso pleno, e a rede
    // faltando só apareceria dias depois na Aderência. Rede que ficou de fora tem que doer no log.
    resultados.push({
      numero: md.numero ?? null,
      marcado: p.data_publicacao_planejada,
      redes: porRede.join(' · '),
      ok: porRede.every((x) => x.includes('PUBLICADO') || x.includes('PROCESSANDO')),
    })
  }

  // O Instagram costuma voltar PROCESSANDO (o container leva 30-60s e a Vercel corta em 60).
  // Na tela, quem fecha isso é o próprio navegador chamando reconciliar 40s e 90s depois. Aqui
  // não há navegador, então o cron chama uma vez — o cron de reconciliação segue de backstop.
  if (resultados.some((r) => r.redes.includes('PROCESSANDO'))) {
    fetch(`${origin}/api/automation/reconciliar-publicacoes`, { method: 'POST', headers: credenciais }).catch(() => {})
  }

  // PROVA DE VIDA: grava SEMPRE, inclusive quando não há nada a publicar.
  //
  // A primeira versão só logava quando disparava algo. Nos dias 08 e 09/08/2026 a rota ficou muda
  // e não deu para distinguir "não tinha o que publicar" de "o cron nunca rodou" — custou dois
  // dias e o dia 61 do desafio. Uma linha dizendo "0 vencidos, nada a fazer" não é ruído: é a
  // única diferença entre um sistema silencioso e um sistema morto.
  // Princípio emprestado do tick_log do limelight: cron nunca falha em silêncio.
  // O erro do insert NÃO é engolido. A primeira versão fazia `.then(()=>{},()=>{})` e o próprio
  // log-de-prova-de-vida morreu calado: `status` tinha CHECK aceitando só sucesso/erro/em_andamento,
  // então 'ocioso' — e 'parcial', que já estava no código — eram rejeitados sem ninguém ver.
  // O CHECK foi ampliado no banco; ainda assim, quem grava o razão não pode falhar em segredo.
  const { error: erroLog } = await supabase.schema('pulso_content').from('logs_workflows').insert({
    workflow_name: 'PUBLICAR_AGENDADOS',
    status: resultados.length === 0 ? 'ocioso' : resultados.every((r) => r.ok) ? 'sucesso' : 'parcial',
    detalhes: {
      disparados: resultados.length,
      agendados_vencidos: vencidos.length,
      teto_dia: tetoDia,
      ja_hoje: publicadosHoje.size,
      dia_brt: hoje,
      resultados,
    },
  })
  if (erroLog) console.error('[publicar-agendados] falhou ao gravar log:', erroLog.message)

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
