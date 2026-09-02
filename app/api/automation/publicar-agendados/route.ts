import { NextRequest, NextResponse } from 'next/server'
import { guardApi } from '@/lib/auth/api-guard'
import { repassarCredencial } from '@/lib/auth/repassar-credencial'
import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { REDES_API_SEGURAS } from '@/lib/publicacao/redes-api'
import { experimentoFbAtivo, vaiPorApi } from '@/lib/publicacao/experimento-fb'

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

  const [pipeQ, pubQ, cfgQ, longosQ] = await Promise.all([
    // Sem filtro de status: o teto precisa enxergar TAMBÉM os já publicados de hoje para saber
    // quantas vagas da grade sobraram. Filtrar PRONTO_PUBLICACAO acontece depois.
    supabase.schema('pulso_content').from('pipeline_producao')
      .select('id, ideia_id, status, metadata, data_publicacao_planejada')
      .not('data_publicacao_planejada', 'is', null),
    supabase.schema('pulso_content').from('metricas_publicacao')
      .select('ideia_id, plataforma, data_publicacao'),
    supabase.schema('pulso_core').from('configuracoes').select('valor').eq('chave', 'linha_producao').maybeSingle(),
    // VÍDEO LONGO NÃO É DESTE CRON. A série de bastidores (formato=longo) publica deliberada e
    // manualmente só no YouTube — se entrasse aqui, sairia nas 5 redes (TikTok/Kwai com 10min!)
    // e comeria uma vaga do teto da grade de Shorts. Filtrado na ORIGEM: some do teto, dos
    // vencidos e do remendo de uma vez. Ver _DESPACHO_VIDEOS_LONGOS_2026-08-24.md.
    supabase.schema('pulso_content').from('ideias').select('id').eq('formato', 'longo'),
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
  const ehLongo = new Set(((longosQ.data || []) as Array<{ id: string }>).map((i) => i.id))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pipeTodos = ((pipeQ.data || []) as any[]).filter((p) => !ehLongo.has(p.ideia_id))
  // Já publicado em ALGUMA rede = não é mais candidato do agendamento (o resto é escolha manual).
  const jaSaiu = new Set(pubs.filter((p) => p.data_publicacao).map((p) => p.ideia_id))

  // O TETO CONTA A GRADE DE HOJE, não "linhas de publicação criadas hoje".
  //
  // Medido em 10/08/2026: o #115 é de 26/07 e estava sem TikTok — a Aderência apontou, alguém
  // completou a rede às 17:22, e essa linha nova fez a conta chegar a 3. Resultado: o #133, que
  // era da grade das 21h, não saiu por "teto cheio". Completar uma rede atrasada de um vídeo
  // ANTIGO não pode roubar a vaga de um vídeo NOVO — são coisas diferentes.
  //
  // Agora conta só vídeos cujo agendamento é de hoje e que já têm alguma publicação.
  const daGradeDeHoje = pipeTodos.filter((p) => diaBRT(horaMarcada(p.data_publicacao_planejada)) === hoje)
  const publicadosHoje = new Set(daGradeDeHoje.filter((p) => jaSaiu.has(p.ideia_id)).map((p) => p.ideia_id))

  const vencidos = pipeTodos
    .filter((p) => {
      if (p.status !== 'PRONTO_PUBLICACAO') return false
      const quando = horaMarcada(p.data_publicacao_planejada)
      return quando <= agora && quando >= limiteAtraso && !jaSaiu.has(p.ideia_id)
    })
    .sort((a, b) => (a.data_publicacao_planejada < b.data_publicacao_planejada ? -1 : 1))

  // UM VÍDEO POR RODADA. A função morre aos 60s (teto do Hobby) e um vídeo já consome quase isso
  // por causa do Instagram. Dois na mesma rodada garantiriam timeout no segundo. Como o cron bate
  // de hora em hora e a janela de atraso é de 12h, o acúmulo se resolve nas rodadas seguintes.
  const vagas = Math.max(0, tetoDia - publicadosHoje.size)
  const aDisparar = vencidos.slice(0, Math.min(vagas, 1))

  // ═══ TRAVA DE CADÊNCIA — o erro que custou caro em 30/08 e 01/09 ═══
  //
  // O QUE ACONTECEU: a fila tinha 11 vídeos PRONTOS, mas todos carimbados para dias à frente.
  // Como nada vencia hoje, esta rota rodava 23 vezes ao dia gravando "ocioso" e o canal ficava
  // sem post. Dois dias com 1 vídeo em vez de 2 — e o YouTube respondeu na hora: de ~2.500
  // views/dia (com 2 posts) para 766 (com 1) e 119 (com quase nenhum). Publicar é o insumo mais
  // barato que existe; deixar de publicar com estoque cheio é o pior erro possível.
  //
  // A REGRA: passadas as 19h BRT, se o dia ainda não bateu a meta e existe vídeo pronto agendado
  // para o FUTURO, ele é antecipado. Cadência vale mais que a data exata — a data é uma
  // preferência, a publicação diária é o que sustenta a distribuição.
  //
  // TRAVAS: só antecipa dentro do teto do dia (nunca publica a mais), um por rodada como o resto,
  // pega sempre o mais próximo (não fura a ordem editorial), e grava `antecipado: true` no log
  // para o dono saber que a data foi puxada — antecipação silenciosa seria outro erro.
  const horaBRT = Number(
    agora.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', hour12: false })
  )
  let antecipado: { numero: number | null; de: string } | null = null
  if (aDisparar.length === 0 && vagas > 0 && horaBRT >= 19) {
    const futuros = pipeTodos
      .filter((p) => {
        if (p.status !== 'PRONTO_PUBLICACAO' || !p.metadata?.video_url) return false
        if (jaSaiu.has(p.ideia_id)) return false
        return horaMarcada(p.data_publicacao_planejada) > agora
      })
      .sort((a, b) => (a.data_publicacao_planejada < b.data_publicacao_planejada ? -1 : 1))
    if (futuros.length > 0) {
      aDisparar.push(futuros[0])
      antecipado = { numero: futuros[0].metadata?.numero ?? null, de: futuros[0].data_publicacao_planejada }
    }
  }

  // RE-TESTE DO FACEBOOK: exceção explícita, com prazo, que se desliga sozinha ao vencer.
  // A trava de REDES_PROIBIDAS_API continua de pé — ver lib/publicacao/experimento-fb.ts.
  const expFb = await experimentoFbAtivo(supabase)

  const origin = new URL(request.url).origin
  const credenciais = repassarCredencial(request)
  const resultados: Array<{ numero: number | null; marcado: string; redes: string; ok: boolean }> = []

  for (const p of aDisparar) {
    const md = p.metadata || {}
    if (!md.video_url) {
      resultados.push({ numero: md.numero ?? null, marcado: p.data_publicacao_planejada, redes: 'sem video_url — pulado', ok: false })
      continue
    }
    // AS REDES EM SEQUÊNCIA, DA MAIS RÁPIDA PARA A MAIS LENTA — e cada uma com orçamento próprio.
    //
    // Duas medições ensinaram esta ordem:
    //  · 10/08 12:05 (sequencial, IG antes do TikTok): o Instagram consumiu os 60s da função e o
    //    TikTok nunca foi chamado. A função morreu antes até de gravar o log.
    //  · 10/08 18:05 (paralelo, 45s cada): IG e TikTok estouraram JUNTOS. Três invocações
    //    simultâneas baixam o mesmo vídeo ao mesmo tempo e atrapalham umas às outras — paralelo
    //    piorou em vez de melhorar.
    //
    // A chave é uma observação do 18:05: o Instagram apareceu publicado às 18:05 mesmo tendo
    // "falhado" por prazo. Abortar do nosso lado NÃO cancela o trabalho do outro lado. Então o
    // Instagram vai por último, com prazo curto — a gente solta o pedido e segue, e a
    // reconciliação amarra o post depois. Assim ele nunca mais come o tempo do TikTok.
    const ORCAMENTO_MS: Record<string, number> = { tiktok: 18_000, youtube: 22_000, instagram: 10_000, facebook: 12_000 }
    const ORDEM = ['tiktok', 'youtube', 'instagram'].filter((r) => (REDES_API_SEGURAS as readonly string[]).includes(r))
    // Facebook entra só se o experimento estiver valendo E este vídeo for do braço da API.
    // Fica por ÚLTIMO: se o orçamento de 60s acabar, quem perde é o experimento, não a operação.
    const fbNesteVideo = !!expFb && vaiPorApi(md.numero, expFb)
    if (fbNesteVideo) ORDEM.push('facebook')
    const porRede: string[] = []
    for (const rede of ORDEM) {
      const prazo = ORCAMENTO_MS[rede] ?? 20_000
      try {
        const r = await fetch(`${origin}/api/automation/publicar`, {
          method: 'POST',
          headers: credenciais,
          signal: AbortSignal.timeout(prazo),
          body: JSON.stringify({
            pipeline_id: p.id, video_url: md.video_url, caption: md.caption,
            plataformas: [rede], confirmar: true,
          }),
        })
        const d = await r.json().catch(() => ({}))
        const r0 = (d.resultados || [])[0]
        porRede.push(`${rede}:${r0?.status || (d.error ? 'ERRO' : '?')}`)
      } catch (e) {
        // Prazo estourado não é fracasso: o pedido continua correndo no servidor. Quem confirma
        // é a reconciliação. Chamar isso de FALHOU faria toda rodada parecer parcial sem ser.
        const expirou = e instanceof Error && (e.name === 'TimeoutError' || e.name === 'AbortError')
        porRede.push(expirou
          ? `${rede}:ENVIADO(sem confirmacao em ${prazo / 1000}s)`
          : `${rede}:FALHOU(${e instanceof Error ? e.message.slice(0, 40) : 'erro'})`)
      }
    }
    // `ok` exige TODAS as redes CONFIRMADAS. Duas correções sofridas moram aqui:
    //
    // 1) com `some`, o #114 de 10/08 — YouTube e Instagram sim, TikTok não — virava sucesso pleno.
    // 2) `ENVIADO` (prazo estourado) NÃO é sucesso, é DESCONHECIDO. Eu o tratava como ok e o
    //    resultado foi medido em 16-17/08: das três rodadas com Instagram em ENVIADO, DUAS
    //    chegaram sozinhas e UMA (#141) nunca chegou — e as três foram registradas como
    //    "sucesso". Um terço de perda invisível. Agora incerteza vira `parcial`, que é o que ela
    //    é, e a varredura abaixo conserta o buraco na rodada seguinte.
    resultados.push({
      numero: md.numero ?? null,
      marcado: p.data_publicacao_planejada,
      ...(expFb ? { braco_fb: fbNesteVideo ? 'api' : 'manual' } : {}),
      redes: porRede.join(' · '),
      ok: porRede.every((x) => x.includes('PUBLICADO') || x.includes('PROCESSANDO')),
    })
  }

  // O Instagram costuma voltar PROCESSANDO (o container leva 30-60s e a Vercel corta em 60).
  // Na tela, quem fecha isso é o próprio navegador chamando reconciliar 40s e 90s depois. Aqui
  // não há navegador, então o cron chama uma vez — o cron de reconciliação segue de backstop.
  if (resultados.some((r) => r.redes.includes('PROCESSANDO') || r.redes.includes('ENVIADO'))) {
    fetch(`${origin}/api/automation/reconciliar-publicacoes`, { method: 'POST', headers: credenciais }).catch(() => {})
  }

  // ══════ REMENDO DAS REDES QUE FICARAM PARA TRÁS ══════
  //
  // O Instagram é lento por natureza (cria container, espera ficar pronto) e a função morre aos
  // 60s. A gente aborta em 10s e segue — mas abortar não garante que o outro lado terminou.
  // MEDIDO em 16-17/08/2026: das três rodadas com `instagram:ENVIADO`, duas chegaram sozinhas e
  // uma (#141) nunca chegou. Um terço perdido, e o log dizia "sucesso" nas três.
  //
  // Antes disto, rede perdida NUNCA era retentada: assim que uma rede dá certo o pipeline vira
  // PUBLICADO e sai do filtro de `vencidos`. Quem completava era eu, à mão, quando alguém notava.
  //
  // Agora toda rodada olha para trás: vídeo agendado que saiu nas últimas 24h e está sem alguma
  // rede de API ganha nova tentativa. A rota de publicar é idempotente por (ideia, rede), então
  // repetir é seguro — no pior caso ela responde que já existe.
  const remendos: Array<{ numero: number | null; rede: string; resultado: string }> = []
  if (aDisparar.length === 0) {
    const limite24h = new Date(agora.getTime() - 24 * 3600_000)
    const redesPorIdeia = new Map<string, Set<string>>()
    const quandoSaiu = new Map<string, string>()
    for (const p of pubs) {
      if (!p.data_publicacao) continue
      if (!redesPorIdeia.has(p.ideia_id)) redesPorIdeia.set(p.ideia_id, new Set())
      redesPorIdeia.get(p.ideia_id)!.add(p.plataforma)
      const atual = quandoSaiu.get(p.ideia_id)
      if (!atual || p.data_publicacao < atual) quandoSaiu.set(p.ideia_id, p.data_publicacao)
    }

    const incompletos = pipeTodos.filter((p) => {
      const q = quandoSaiu.get(p.ideia_id)
      if (!q || new Date(q) < limite24h) return false
      const tem = redesPorIdeia.get(p.ideia_id) || new Set()
      return REDES_API_SEGURAS.some((r) => !tem.has(r))
    })

    // Uma rede por rodada: o cron bate de hora em hora, então o remendo se completa sozinho sem
    // arriscar o orçamento de 60s da função.
    const alvo = incompletos[0]
    if (alvo) {
      const md = alvo.metadata || {}
      const tem = redesPorIdeia.get(alvo.ideia_id) || new Set()
      const rede = REDES_API_SEGURAS.find((r) => !tem.has(r))
      if (rede && md.video_url) {
        try {
          const r = await fetch(`${origin}/api/automation/publicar`, {
            method: 'POST',
            headers: credenciais,
            signal: AbortSignal.timeout(40_000),
            body: JSON.stringify({
              pipeline_id: alvo.id, video_url: md.video_url, caption: md.caption,
              plataformas: [rede], confirmar: true,
            }),
          })
          const d = await r.json().catch(() => ({}))
          remendos.push({ numero: md.numero ?? null, rede, resultado: (d.resultados || [])[0]?.status || d.error || '?' })
        } catch (e) {
          remendos.push({ numero: md.numero ?? null, rede, resultado: e instanceof Error ? e.name : 'erro' })
        }
      }
    }
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
    status: resultados.length === 0 && remendos.length === 0
      ? 'ocioso'
      : resultados.every((r) => r.ok) && remendos.every((r) => r.resultado === 'PUBLICADO')
        ? 'sucesso'
        : 'parcial',
    detalhes: {
      disparados: resultados.length,
      agendados_vencidos: vencidos.length,
      teto_dia: tetoDia,
      ja_hoje: publicadosHoje.size,
      dia_brt: hoje,
      antecipado,
      resultados,
      ...(remendos.length ? { remendos } : {}),
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
