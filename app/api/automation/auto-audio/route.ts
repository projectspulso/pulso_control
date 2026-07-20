import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { guardApi } from '@/lib/auth/api-guard'

/**
 * AUTO-AUDIO — gera áudio dos roteiros que VOCÊ aprovou e ainda não têm áudio.
 *
 * Backstop do gate de aprovação: a rota /roteiros/[id]/aprovar já dispara o áudio
 * na hora, mas isso aqui drena o backlog (roteiros aprovados antes do fix) e
 * reprocessa o que falhar. Capado a MAX_POR_RUN pra não estourar custo (ElevenLabs
 * + render). Cron diário.
 */
const MAX_POR_RUN = 4

async function autoAudio(request: NextRequest) {
  const denied = await guardApi(request)
  if (denied) return denied
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseAdminClient() as any

  const [{ data: roteiros }, { data: audios }, { data: pipe }, { data: cfgRow }] = await Promise.all([
    supabase.schema('pulso_content').from('roteiros').select('id, ideia_id, titulo, status'),
    supabase.schema('pulso_content').from('audios').select('roteiro_id'),
    supabase.schema('pulso_content').from('pipeline_producao').select('ideia_id, status'),
    supabase.schema('pulso_core').from('configuracoes').select('valor').eq('chave', 'linha_producao').maybeSingle(),
  ])

  const comAudio = new Set((audios || []).map((a: { roteiro_id: string }) => a.roteiro_id))
  const statusPipe = new Map<string, string>(
    (pipe || []).map((p: { ideia_id: string; status: string }) => [p.ideia_id, p.status]),
  )

  // TRAVA DE BUFFER (linha de produção): o gargalo é o render (3/dia). Com AUDIO_GERADO acima
  // do teto, gerar mais áudio só queima ElevenLabs pra formar fila — pausa até o worker drenar.
  let bufferAudioMax = 15
  try { if (cfgRow?.valor) bufferAudioMax = JSON.parse(cfgRow.valor).buffer_audio_max ?? 15 } catch { /* default */ }
  const emAudioGerado = (pipe || []).filter((p: { status: string }) => p.status === 'AUDIO_GERADO').length
  if (emAudioGerado >= bufferAudioMax) {
    return NextResponse.json({
      success: true,
      pausado: true,
      motivo: `buffer AUDIO_GERADO cheio (${emAudioGerado}/${bufferAudioMax}) — áudio pausado até o render drenar`,
      processados: 0,
    })
  }

  // alvos: roteiro APROVADO, sem áudio, cujo pipeline ainda está em ROTEIRO_PRONTO
  const alvos = (roteiros || [])
    .filter(
      (r: { id: string; ideia_id: string; status: string }) =>
        r.status === 'APROVADO' && !comAudio.has(r.id) && statusPipe.get(r.ideia_id) === 'ROTEIRO_PRONTO',
    )
    .slice(0, MAX_POR_RUN)

  const origin = new URL(request.url).origin
  const auth = request.headers.get('authorization') || ''
  const ws = process.env.WEBHOOK_SECRET || ''
  const feitos: Array<{ titulo: string; ok: boolean; erro?: string }> = []
  for (const a of alvos) {
    try {
      const r = await fetch(`${origin}/api/automation/gerar-audio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: auth, 'x-webhook-secret': ws },
        body: JSON.stringify({ roteiro_id: a.id }),
      })
      const d = await r.json().catch(() => ({}))
      feitos.push({ titulo: a.titulo, ok: r.ok, erro: r.ok ? undefined : d.error || `HTTP ${r.status}` })
    } catch (e) {
      feitos.push({ titulo: a.titulo, ok: false, erro: e instanceof Error ? e.message : 'erro' })
    }
  }

  return NextResponse.json({
    success: true,
    aprovados_sem_audio: (roteiros || []).filter(
      (r: { id: string; ideia_id: string; status: string }) =>
        r.status === 'APROVADO' && !comAudio.has(r.id) && statusPipe.get(r.ideia_id) === 'ROTEIRO_PRONTO',
    ).length,
    processados: feitos.filter((f) => f.ok).length,
    detalhe: feitos,
  })
}

export async function POST(request: NextRequest) {
  return autoAudio(request)
}
export async function GET(request: NextRequest) {
  return autoAudio(request)
}
