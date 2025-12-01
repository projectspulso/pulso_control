import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  const { workflow_name, status, data } = await request.json()
  const secret = request.headers.get('x-webhook-secret')
  if (secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Exemplo: salvar log extra ou disparar notificação
  await supabase.from('logs_workflows').insert({
    workflow_name,
    status,
    detalhes: data,
    erro_mensagem: status === 'erro' ? (data?.erro || 'Erro desconhecido') : null
  })

  // Aqui você pode invalidar cache, disparar toast, etc
  return NextResponse.json({ received: true })
}
