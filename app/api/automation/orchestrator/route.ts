import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/server'

/**
 * POST /api/automation/orchestrator
 *
 * Processa itens pendentes na automation_queue.
 * Chamado por pg_net (trigger no banco) ou por cron externo.
 * Pega o próximo item PENDENTE, marca como PROCESSANDO,
 * chama o worker correspondente, e atualiza o resultado.
 */
export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-webhook-secret')
  if (secret && secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseAdminClient() as any

  // Buscar próximo item pendente (FIFO)
  const { data: items, error: fetchError } = await supabase
    .schema('pulso_automation')
    .from('automation_queue')
    .select('*')
    .eq('status', 'PENDENTE')
    .lte('scheduled_at', new Date().toISOString())
    .order('created_at', { ascending: true })
    .limit(5)

  if (fetchError || !items?.length) {
    return NextResponse.json({
      processed: 0,
      message: fetchError ? fetchError.message : 'Nenhum item pendente',
    })
  }

  const results = []

  for (const item of items) {
    // Marcar como PROCESSANDO
    await supabase
      .schema('pulso_automation')
      .from('automation_queue')
      .update({ status: 'PROCESSANDO', started_at: new Date().toISOString() })
      .eq('id', item.id)

    try {
      // Chamar worker correspondente
      const workerUrl = getWorkerUrl(item.tipo, request)
      if (!workerUrl) {
        throw new Error(`Worker não encontrado para tipo: ${item.tipo}`)
      }

      const workerResponse = await fetch(workerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-secret': process.env.WEBHOOK_SECRET || '',
          'x-queue-item-id': item.id,
        },
        body: JSON.stringify(item.payload),
      })

      const workerResult = await workerResponse.json()

      if (workerResponse.ok) {
        // Sucesso
        await supabase
          .schema('pulso_automation')
          .from('automation_queue')
          .update({
            status: 'SUCESSO',
            resultado: workerResult,
            completed_at: new Date().toISOString(),
          })
          .eq('id', item.id)

        results.push({ id: item.id, tipo: item.tipo, status: 'SUCESSO' })
      } else {
        throw new Error(workerResult.error || `Worker retornou ${workerResponse.status}`)
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido'
      const tentativas = (item.tentativas || 0) + 1
      const maxTentativas = item.max_tentativas || 3

      // Calcular próximo retry (backoff exponencial: 5min, 15min, 45min)
      const retryDelay = Math.pow(3, tentativas) * 5 * 60 * 1000
      const proximoRetry = new Date(Date.now() + retryDelay).toISOString()

      await supabase
        .schema('pulso_automation')
        .from('automation_queue')
        .update({
          status: tentativas >= maxTentativas ? 'ERRO' : 'RETRY',
          tentativas,
          erro_ultimo: errorMsg,
          erro_historico: [
            ...(item.erro_historico || []),
            { tentativa: tentativas, erro: errorMsg, timestamp: new Date().toISOString() },
          ],
          proximo_retry: tentativas < maxTentativas ? proximoRetry : null,
          completed_at: tentativas >= maxTentativas ? new Date().toISOString() : null,
        })
        .eq('id', item.id)

      results.push({ id: item.id, tipo: item.tipo, status: 'ERRO', error: errorMsg })
    }
  }

  return NextResponse.json({ processed: results.length, results })
}

function getWorkerUrl(tipo: string, request: NextRequest): string | null {
  const baseUrl = new URL(request.url).origin

  const workers: Record<string, string> = {
    GERAR_IDEIAS: `${baseUrl}/api/automation/gerar-ideias`,
    GERAR_ROTEIRO: `${baseUrl}/api/automation/gerar-roteiro`,
    GERAR_AUDIO: `${baseUrl}/api/automation/gerar-audio`,
    PUBLICAR: `${baseUrl}/api/automation/publicar`,
  }

  return workers[tipo] || null
}
