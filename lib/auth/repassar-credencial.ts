import 'server-only'

import { NextRequest } from 'next/server'

/**
 * CABEÇALHOS PARA UMA ROTA CHAMAR OUTRA ROTA NOSSA.
 *
 * Quatro rotas faziam isto na mão, e todas do mesmo jeito quebrado:
 *
 *   const auth = request.headers.get('authorization') || ''
 *   fetch(`${origin}/api/...`, { headers: { Authorization: auth } })
 *
 * O `guardApi` aceita TRÊS credenciais — sessão da UI, `Authorization: Bearer CRON_SECRET` e
 * `x-webhook-secret`. Repassar só a segunda significa que a chamada interna morre com 401 sempre
 * que a externa chegou por uma das outras duas. Foi o que aconteceu com o auto-funil: ele
 * encontrava os candidatos certos e devolvia `success: true` com `gerados: 0` e "Nao autorizado"
 * item por item. Sucesso na aparência, zero roteiro na prática — e o estoque secou por dias sem
 * nenhum alarme.
 *
 * Aqui a chamada interna leva o `authorization` de quem chamou (quando existe) E o segredo de
 * webhook do próprio servidor. O segundo é o que garante que funciona independentemente de a
 * chamada externa ter vindo do cron da Vercel, de um webhook ou do navegador do dono.
 */
export function repassarCredencial(request: NextRequest): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const auth = request.headers.get('authorization')
  if (auth) headers.Authorization = auth
  // O servidor sempre conhece o próprio segredo — é a credencial que não depende do chamador.
  if (process.env.WEBHOOK_SECRET) headers['x-webhook-secret'] = process.env.WEBHOOK_SECRET
  else if (process.env.CRON_SECRET && !auth) headers.Authorization = `Bearer ${process.env.CRON_SECRET}`
  return headers
}
