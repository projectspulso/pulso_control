import { NextRequest, NextResponse } from 'next/server'
import { guardApi } from '@/lib/auth/api-guard'
import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { callOpenAI } from '@/lib/automation/ai-clients'
import { extrairAncora } from '@/lib/automation/ancora'

/**
 * POST /api/duplicidade/backfill { lote?: number }
 *
 * Preenche a âncora dos roteiros ANTIGOS. Sem isto, a trava de âncora nasce sem base: ela só
 * compara contra ideias que já declararam a sua, e o acervo de 191 roteiros anteriores a
 * 02/09/2026 não declarou nenhuma.
 *
 * Roda aqui, e não em script local, porque a chave da OpenAI vive na Vercel — o `.env` da máquina
 * tem placeholder. Em lotes por causa do teto de tempo da rota: chamar de novo continua de onde
 * parou, porque o filtro é "quem ainda não tem âncora".
 *
 * Enquanto o backfill não roda, a rede que segura é a varredura de termos raros
 * (lib/automation/vigia-duplicidade.ts), que não depende de âncora nenhuma.
 */

export const maxDuration = 300

export async function POST(request: NextRequest) {
  const guard = await guardApi(request)
  if (guard) return guard

  const body = await request.json().catch(() => ({}))
  const lote = Math.min(Math.max(Number(body?.lote) || 40, 1), 120)

  try {
    const supabase = getSupabaseAdminClient()
    const [ideiasQ, rotQ] = await Promise.all([
      supabase.schema('pulso_content').from('ideias').select('id, titulo, status, formato, metadata'),
      supabase.schema('pulso_content').from('roteiros').select('ideia_id, conteudo_md'),
    ])
    if (ideiasQ.error) throw ideiasQ.error

    const corpo = new Map<string, string>()
    for (const r of (rotQ.data || []) as Array<{ ideia_id: string; conteudo_md: string | null }>) {
      if (r.ideia_id && r.conteudo_md && !corpo.has(r.ideia_id)) corpo.set(r.ideia_id, r.conteudo_md)
    }

    const pendentes = ((ideiasQ.data || []) as Array<{
      id: string
      titulo: string | null
      status: string
      formato: string | null
      metadata: { ancora?: string; ancora_nomeada?: boolean } | null
    }>).filter(
      (i) =>
        i.status !== 'DESCARTADA' &&
        i.formato !== 'longo' &&
        corpo.has(i.id) &&
        // sem âncora ainda, OU com âncora antiga que não sabe se o roteiro FECHA a promessa.
        // O julgamento de "nomeado" nasceu em 03/09/2026; o acervo anterior não o tem, e uma
        // heurística de capitalização não serve de substituto: ela marca "levitação diamagnética
        // 1939 bismuto" como vago, e isso é específico. Quem lê o roteiro inteiro é o modelo.
        (!i.metadata?.ancora || i.metadata?.ancora_nomeada === undefined)
    )

    const alvo = pendentes.slice(0, lote)
    const feitas: Array<{ titulo: string; ancora: string }> = []
    let semResposta = 0

    for (const i of alvo) {
      const a = await extrairAncora(corpo.get(i.id)!, (p) =>
        callOpenAI(p, { model: 'gpt-4o-mini', json_mode: true, temperature: 0, max_tokens: 200 }).then((r) => r.content)
      )
      if (!a) { semResposta++; continue }
      const { error } = await supabase
        .schema('pulso_content')
        .from('ideias')
        .update({ metadata: { ...(i.metadata || {}), ancora: a.ancora, ancora_nomeada: a.nomeado } })
        .eq('id', i.id)
      if (error) { semResposta++; continue }
      feitas.push({ titulo: i.titulo || '(sem título)', ancora: a.ancora })
    }

    return NextResponse.json({
      ok: true,
      pendentes_antes: pendentes.length,
      processadas: alvo.length,
      gravadas: feitas.length,
      sem_resposta: semResposta,
      faltam: pendentes.length - feitas.length,
      amostra: feitas.slice(0, 10),
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
