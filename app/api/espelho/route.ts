import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { createHash, timingSafeEqual } from 'node:crypto'

/**
 * GET /api/espelho — o espelho do PULSO para o digiai, com credencial de UMA LEITURA.
 *
 * POR QUE ESTA ROTA EXISTE. Até 08/09/2026 o digiai lia `public.v_espelho_pulso` direto no banco
 * do PULSO. Primeiro pela chave `anon` — o que deixava custo_caixa_total_brl, custo do mês e custo
 * por serviço legíveis por qualquer visitante. Fechado isso, a correção seguinte guardou a SERVICE
 * KEY do PULSO como secret do digiai: fechou o público e piorou o raio de dano, porque a service
 * key tem `bypassrls`, atravessa toda a RLS, lê os 220 roteiros e as ideias com a checagem, e tem
 * INSERT/UPDATE/DELETE. Além de acoplar os projetos: rotacionar a chave do PULSO derrubaria o
 * digiai junto.
 *
 * Esta rota inverte o portão de lado. Ele passa a morar onde o dado mora, e a credencial que sai
 * daqui concede exatamente esta leitura — não o banco.
 *
 * POR QUE SEGREDO PRÓPRIO E NÃO O `guardApi`. O `guardApi` aceita `x-webhook-secret`, e esse mesmo
 * segredo abre 35 rotas — entre elas `automation/publicar`, `publicar-agendados`, `gerar-roteiro`
 * e `agenda/comprometer`. Entregá-lo ao digiai seria trocar a chave-mestra do banco pela da
 * automação: o outro projeto passaria a poder PUBLICAR nas redes do dono. `ESPELHO_SECRET` é
 * verificado só aqui.
 *
 * FALHA FECHADA, de propósito. Sem `ESPELHO_SECRET` no ambiente a rota responde 503 e não serve
 * nada. Portão que abre no erro não é portão (R-037).
 */

const sha256 = (v: string) => createHash('sha256').update(v, 'utf8').digest()

export async function GET(request: NextRequest) {
  const esperado = process.env.ESPELHO_SECRET
  if (!esperado) {
    return NextResponse.json({ error: 'Espelho indisponivel' }, { status: 503 })
  }

  // SHA-256 dos dois lados antes de comparar: os digests tem sempre 32 bytes, entao a comparacao
  // nao depende do tamanho do segredo. A versao anterior checava `recebido.length !==
  // esperado.length` ANTES do laco e respondia mais cedo para tamanho errado — vazava o TAMANHO do
  // segredo pelo tempo de resposta, que e exatamente o que comparacao em tempo constante existe
  // para nao fazer. O comentario que estava aqui afirmava "comparacao de tamanho fixo" e mentia.
  // Achado pelo agente do MKT ao copiar este arquivo como molde.
  const recebido = request.headers.get('x-espelho-secret')
  if (!recebido || !timingSafeEqual(sha256(recebido), sha256(esperado))) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseAdminClient() as any
  const { data, error } = await supabase.from('v_espelho_pulso').select('*').maybeSingle()
  if (error) {
    return NextResponse.json({ error: `Espelho falhou: ${error.message}` }, { status: 500 })
  }

  return NextResponse.json(data ?? {}, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
