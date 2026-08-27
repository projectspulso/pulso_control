import { NextRequest, NextResponse } from 'next/server'
import { guardApi } from '@/lib/auth/api-guard'

/**
 * GET /api/diagnostico/openai — de qual conta/organização é a chave que o app usa?
 *
 * A OPENAI_API_KEY vive só na Vercel, marcada como sensível: ninguém (nem os agentes) lê o
 * valor. Quando a API respondeu "no credits remaining" em 27/08/2026 mesmo com faturas pagas,
 * a pergunta virou "então estamos ligados em QUAL conta?" — e não havia como responder.
 *
 * A OpenAI devolve a organização no cabeçalho `openai-organization` de toda resposta. Esta rota
 * faz a chamada mais barata que existe (GET /v1/models não consome crédito) e devolve só os
 * metadados: org, projeto, status e o PREFIXO da chave (o suficiente pra saber se é chave de
 * projeto `sk-proj-` ou legada de organização `sk-`). O valor nunca sai daqui.
 */
export async function GET(request: NextRequest) {
  const denied = await guardApi(request)
  if (denied) return denied

  const k = process.env.OPENAI_API_KEY || ''
  if (!k) return NextResponse.json({ erro: 'OPENAI_API_KEY ausente no ambiente' }, { status: 500 })

  const r = await fetch('https://api.openai.com/v1/models', { headers: { Authorization: `Bearer ${k}` } })
  const corpo = await r.text()

  return NextResponse.json({
    chave: { prefixo: k.slice(0, 8), tamanho: k.length, tipo: k.startsWith('sk-proj-') ? 'chave de projeto' : 'chave de organização (legada)' },
    status: r.status,
    organizacao: r.headers.get('openai-organization'),
    projeto: r.headers.get('openai-project'),
    valida: r.ok,
    // em erro, a mensagem da OpenAI já diz o motivo (quota, chave inválida, org errada)
    detalhe: r.ok ? `${(JSON.parse(corpo).data || []).length} modelos disponíveis` : corpo.slice(0, 300),
  })
}
