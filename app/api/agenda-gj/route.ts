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
 * JANELA: passado E futuro, os dois limitados. `?passado=N` (padrão 30, teto 90) e `?dias=N` (padrão
 * 30, teto 90). O passado existe para o GJ RECONCILIAR: sem ele, um vídeo que publicou ou atrasou some
 * da resposta e o GJ não tem como saber se concluiu ou se foi cancelado.
 *
 * O ID ESTÁVEL, E POR QUE ESTA ROTA TROCOU DE VIEW (14/09/2026). A primeira versão lia
 * `vw_agenda_atribuicoes` e não devolvia id nenhum. O GJ mediu contra a agenda real do dono e travou:
 * ele tem 34 eventos chaveados como `pp-<id>`, 20 marcados como concluídos e 10 atrasados, e sem o id
 * os 34 viram referência nova e as conclusões se perdem. Fui ler como o `sync-pulso` antigo montava a
 * chave — `'pp-' + r.pipeline_id`, lendo `vw_agenda_publicacao_geral`. Ou seja: não faltava só um
 * campo, a rota estava na VIEW ERRADA. `vw_agenda_atribuicoes` tem outro espaço de id, e devolver o id
 * dela quebraria as 34 referências do mesmo jeito que não devolver nada. Conferido: o `pipeline_id` de
 * `vw_agenda_publicacao_geral` casa 149 de 149 com `pipeline_producao.id`, todos distintos.
 *
 * ESTA VIEW CARREGA A RECEITA: `pipeline_metadata` e `ideia_metadata` estão entre as colunas dela, e é
 * nesses campos que moram a checagem (as fontes), a âncora e o gancho. A lista nomeada abaixo é o que
 * impede que eles saiam — nunca troque por `*`.
 */

const DIAS_PADRAO = 30
const PASSADO_PADRAO = 30
const JANELA_MAX = 90

// NOMEADAS. A view tem pipeline_metadata e ideia_metadata — a receita. Nenhum dos dois entra aqui.
const COLUNAS = 'pipeline_id, datahora_publicacao_planejada, canal, serie, ideia_titulo, pipeline_status'

function limitar(bruto: string | null, padrao: number): number {
  // ausente NAO e zero. `Number(null)` e `Number('')` dao 0, e sem esta guarda a chamada sem
  // parametro virava janela de 0 dias — o GJ receberia so o dia de hoje e as 34 referencias seguiriam
  // perdidas. Achado no teste, nao na leitura. `passado=0` explicito continua valendo.
  if (bruto === null || bruto.trim() === '') return padrao
  const n = Number(bruto)
  return Number.isFinite(n) && n >= 0 ? Math.min(Math.floor(n), JANELA_MAX) : padrao
}

function somarDias(diaBRT: string, n: number): string {
  const d = new Date(`${diaBRT}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

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

  const dias = limitar(request.nextUrl.searchParams.get('dias'), DIAS_PADRAO)
  const passado = limitar(request.nextUrl.searchParams.get('passado'), PASSADO_PADRAO)

  const hoje = hojeBRT() // o dia do PULSO é o dia de Brasília; cortar um ISO em UTC erra depois das 21h
  const de = somarDias(hoje, -passado)
  const ate = somarDias(hoje, dias)

  // `datahora_publicacao_planejada` é NAIVE e já está em Brasília (ver lib/datas.ts): compara por
  // string e corta os dez primeiros caracteres. Converter de novo tiraria três horas que não existem.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseAdminClient() as any
  const { data, error } = await supabase
    .schema('pulso_content')
    .from('vw_agenda_publicacao_geral')
    .select(COLUNAS)
    .not('datahora_publicacao_planejada', 'is', null)
    .gte('datahora_publicacao_planejada', `${de}T00:00:00`)
    .lte('datahora_publicacao_planejada', `${ate}T23:59:59`)
    .order('datahora_publicacao_planejada', { ascending: true })

  if (error) {
    return NextResponse.json({ error: `Agenda falhou: ${error.message}` }, { status: 500 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const agenda = (data ?? []).map((r: any) => {
    const dh = String(r.datahora_publicacao_planejada)
    const dia = dh.slice(0, 10)
    return {
      pipeline_id: r.pipeline_id, // estável: o GJ chaveia como `pp-<pipeline_id>`
      data: dia,
      horario: dh.slice(11, 16),
      canal_nome: r.canal,
      serie: r.serie ?? null,
      ideia_titulo: r.ideia_titulo,
      status: r.pipeline_status, // PUBLICADO/CANCELADO no passado = o que o GJ reconcilia
      atrasado: dia < hoje && r.pipeline_status !== 'PUBLICADO' && r.pipeline_status !== 'CANCELADO',
    }
  })

  return NextResponse.json(
    { hoje, de, ate, passado, dias, total: agenda.length, agenda },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
