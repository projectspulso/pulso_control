import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { hojeBRT } from '@/lib/datas'
import { createHash, timingSafeEqual } from 'node:crypto'

/**
 * GET /api/agenda-gj — a agenda de trabalho do PULSO para o GJ, com credencial de UMA LEITURA.
 *
 * POR QUE PULL E NÃO PUSH. O molde da casa para integrar projetos era empurrar: uma edge com cron
 * daqui escrevendo no banco do outro. Isso exige hospedar a chave de SERVICE ROLE do GJ aqui —
 * chave-mestra do banco dele, com escrita, morando num projeto que não é o dele. É exatamente o
 * arranjo que passamos 08/09/2026 desfazendo no sentido inverso (a service key do PULSO vivia nos
 * secrets do digiai). Trocar a chave-mestra do GJ pela campainha do PULSO não é empate.
 *
 * Puxar também é mais tolerante a falha: GJ fora do ar não quebra nada aqui, e PULSO fora do ar o
 * GJ tenta de novo. No push, o GJ cair vira fila e erro DESTE lado, por dado que não é nosso.
 *
 * COLUNAS NOMEADAS, NUNCA `select('*')`. Não é estilo: é trava. Em 08/09 o hub fazia
 * `select('metadata')` e levava junto a `checagem` — as fontes — de 52 de 60 ideias. Lista
 * explícita significa que uma coluna nova acrescentada amanhã NÃO vaza sozinha. Pelo mesmo motivo
 * esta rota lê `vw_agenda_atribuicoes` e nunca `vw_agenda_publicacao_detalhada`, que carrega
 * `pipeline_metadata` — o campo onde a receita mora.
 *
 * SEGREDO PRÓPRIO, e este é o ponto. O `guardApi` aceita `x-webhook-secret`, que abre 35 rotas —
 * entre elas `automation/publicar` e `agenda/comprometer`. Dar esse segredo ao GJ seria dar a ele
 * o poder de publicar nas redes do dono. `AGENDA_GJ_SECRET` é verificado só aqui.
 *
 * FALHA FECHADA: sem o segredo no ambiente responde 503 e não serve nada (R-037).
 *
 * JANELA: só o futuro, e limitada. `?dias=N` (padrão 30, teto 90). Sem isso a rota viraria despejo
 * do histórico inteiro a cada chamada — 235 linhas hoje e crescendo para sempre.
 */

const DIAS_PADRAO = 30
const DIAS_MAX = 90

const COLUNAS = 'data, horario, canal_nome, ideia_titulo, estagio, status, fixado'

const sha256 = (v: string) => createHash('sha256').update(v, 'utf8').digest()

export async function GET(request: NextRequest) {
  const esperado = process.env.AGENDA_GJ_SECRET
  if (!esperado) {
    return NextResponse.json({ error: 'Agenda indisponivel' }, { status: 503 })
  }

  // SHA-256 dos dois lados antes de comparar: os digests tem sempre 32 bytes, entao a comparacao
  // nao depende do tamanho do segredo. A versao anterior checava `recebido.length !==
  // esperado.length` ANTES do laco e respondia mais cedo para tamanho errado — vazava o TAMANHO do
  // segredo pelo tempo de resposta, que e exatamente o que comparacao em tempo constante existe
  // para nao fazer. Achado pelo agente do MKT ao copiar este arquivo como molde.
  const recebido = request.headers.get('x-agenda-gj-secret')
  if (!recebido || !timingSafeEqual(sha256(recebido), sha256(esperado))) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  }

  const pedido = Number(request.nextUrl.searchParams.get('dias'))
  const dias = Number.isFinite(pedido) && pedido > 0 ? Math.min(pedido, DIAS_MAX) : DIAS_PADRAO

  const de = hojeBRT() // o dia do PULSO é o dia de Brasília; cortar um ISO em UTC erra depois das 21h
  const ate = new Date(`${de}T12:00:00Z`)
  ate.setUTCDate(ate.getUTCDate() + dias)
  const limite = ate.toISOString().slice(0, 10)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseAdminClient() as any
  const { data, error } = await supabase
    .from('vw_agenda_atribuicoes')
    .select(COLUNAS)
    .gte('data', de)
    .lte('data', limite)
    .order('data', { ascending: true })
    .order('horario', { ascending: true })

  if (error) {
    return NextResponse.json({ error: `Agenda falhou: ${error.message}` }, { status: 500 })
  }

  return NextResponse.json(
    { de, ate: limite, dias, total: data?.length ?? 0, agenda: data ?? [] },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
