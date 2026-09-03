import { NextRequest, NextResponse } from 'next/server'
import { guardApi } from '@/lib/auth/api-guard'
import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { varrerDuplicidade, type ItemVigiado } from '@/lib/automation/vigia-duplicidade'

/**
 * GET /api/duplicidade
 *
 * O VIGIA. Varre o corpo de todos os roteiros procurando pares que contam a mesma história com
 * títulos diferentes — o ponto cego que deixou dois vídeos repetidos chegarem renderizados e
 * agendados (ver lib/automation/vigia-duplicidade.ts).
 *
 * Custa ZERO: nenhuma chamada de IA, só frequência de token. Por isso pode rodar sempre que a
 * tela abrir, em vez de virar mais um cron que ninguém olha.
 */

export const maxDuration = 60

export async function GET(request: NextRequest) {
  const guard = await guardApi(request)
  if (guard) return guard

  try {
    const supabase = getSupabaseAdminClient()

    const [ideiasQ, rotQ, pipeQ, pubQ] = await Promise.all([
      supabase.schema('pulso_content').from('ideias').select('id, titulo, status, formato'),
      supabase.schema('pulso_content').from('roteiros').select('ideia_id, conteudo_md'),
      supabase.schema('pulso_content').from('pipeline_producao').select('ideia_id, status, metadata'),
      supabase.schema('pulso_content').from('metricas_publicacao').select('ideia_id'),
    ])
    if (ideiasQ.error) throw ideiasQ.error

    const corpo = new Map<string, string>()
    for (const r of (rotQ.data || []) as Array<{ ideia_id: string; conteudo_md: string | null }>) {
      if (r.ideia_id && r.conteudo_md && !corpo.has(r.ideia_id)) corpo.set(r.ideia_id, r.conteudo_md)
    }
    const numero = new Map<string, number | null>()
    for (const p of (pipeQ.data || []) as Array<{ ideia_id: string; metadata: { numero?: number } | null }>) {
      if (p.ideia_id) numero.set(p.ideia_id, p.metadata?.numero ?? null)
    }
    const publicadas = new Set(
      ((pubQ.data || []) as Array<{ ideia_id: string | null }>).map((p) => p.ideia_id).filter(Boolean) as string[]
    )

    // Descartada não conta: já foi tirada de circulação, e apontá-la vira ruído permanente.
    // Longo (bastidores) também não: outra régua, outro acervo.
    const itens: ItemVigiado[] = ((ideiasQ.data || []) as Array<{
      id: string
      titulo: string | null
      status: string
      formato: string | null
    }>)
      .filter((i) => i.status !== 'DESCARTADA' && i.formato !== 'longo' && corpo.has(i.id))
      .map((i) => ({
        id: i.id,
        titulo: i.titulo,
        corpo: corpo.get(i.id) ?? null,
        publicado: publicadas.has(i.id),
        numero: numero.get(i.id) ?? null,
      }))

    const pares = varrerDuplicidade(itens)

    return NextResponse.json({
      ok: true,
      geradoEm: new Date().toISOString(),
      analisados: itens.length,
      pares,
      evitaveis: pares.filter((p) => p.evitavel).length,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
