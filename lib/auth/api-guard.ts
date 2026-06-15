import 'server-only'

import { NextRequest } from 'next/server'
import { getSupabaseServerSSR } from '@/lib/supabase/server-ssr'
import { emailAutorizado } from '@/lib/auth/allowlist'

/**
 * Guarda das rotas de API de automação. Permite a chamada se houver:
 *   1) sessão válida de usuário na allowlist (chamadas da UI logada), OU
 *   2) Authorization: Bearer <CRON_SECRET> (Vercel Cron injeta isso automaticamente
 *      quando a env CRON_SECRET existe), OU
 *   3) x-webhook-secret: <WEBHOOK_SECRET> (chamadas externas/manuais).
 *
 * Retorna null quando autorizado; senão uma Response 401 (a rota devolve direto).
 */
export async function guardApi(request: NextRequest): Promise<Response | null> {
  // 1) sessão da UI
  try {
    const supabase = await getSupabaseServerSSR()
    const { data } = await supabase.auth.getUser()
    if (data?.user?.email && emailAutorizado(data.user.email)) return null
  } catch {
    // sem sessão válida — tenta os segredos abaixo
  }

  // 2) Vercel Cron
  const auth = request.headers.get('authorization')
  if (process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`) return null

  // 3) segredo de webhook
  const ws = request.headers.get('x-webhook-secret')
  if (process.env.WEBHOOK_SECRET && ws === process.env.WEBHOOK_SECRET) return null

  return new Response(JSON.stringify({ error: 'Nao autorizado' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  })
}
