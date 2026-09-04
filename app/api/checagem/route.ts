import { NextRequest, NextResponse } from 'next/server'
import { guardApi } from '@/lib/auth/api-guard'
import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { callOpenAI } from '@/lib/automation/ai-clients'
import { checarFatos } from '@/lib/automation/checagem-fatos'

/**
 * POST /api/checagem { numero? , ideia_id?, lote? }
 *
 * Confere os fatos de roteiros que JÁ EXISTEM. A trava nova (lib/automation/checagem-fatos.ts) pega
 * o que for escrito daqui pra frente; esta rota é para o acervo, que foi escrito sem conferência
 * nenhuma — 160 dos 211 roteiros afirmam um ano específico e ZERO passaram por verificação.
 *
 * Sem `numero`/`ideia_id`, confere um LOTE dos ainda não conferidos, do mais recente para trás:
 * o que ainda não publicou é onde a correção ainda muda alguma coisa.
 *
 * O resultado é gravado em `ideias.metadata.checagem` — a rota nunca corrige o roteiro sozinha.
 * Reescrever texto publicado é decisão do dono, e "a IA achou que estava errado" não é motivo
 * suficiente para mexer no que já está no ar.
 */

export const maxDuration = 300

export async function POST(request: NextRequest) {
  const guard = await guardApi(request)
  if (guard) return guard

  const body = await request.json().catch(() => ({}))
  const lote = Math.min(Math.max(Number(body?.lote) || 10, 1), 40)

  try {
    const supabase = getSupabaseAdminClient()
    const [ideiasQ, rotQ, pipeQ, pubQ] = await Promise.all([
      supabase.schema('pulso_content').from('ideias').select('id, titulo, status, formato, metadata'),
      supabase.schema('pulso_content').from('roteiros').select('ideia_id, conteudo_md'),
      supabase.schema('pulso_content').from('pipeline_producao').select('ideia_id, metadata'),
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

    type Ideia = { id: string; titulo: string | null; status: string; formato: string | null; metadata: Record<string, unknown> | null }
    const todas = ((ideiasQ.data || []) as Ideia[]).filter(
      (i) => i.status !== 'DESCARTADA' && i.formato !== 'longo' && corpo.has(i.id)
    )

    let alvo: Ideia[]
    if (body?.ideia_id) {
      alvo = todas.filter((i) => i.id === body.ideia_id)
    } else if (body?.numero != null) {
      alvo = todas.filter((i) => numero.get(i.id) === Number(body.numero))
    } else {
      // ainda não conferidos, do maior número para o menor (o novo importa mais que o antigo)
      alvo = todas
        .filter((i) => !(i.metadata as { checagem?: unknown } | null)?.checagem)
        .sort((a, b) => (numero.get(b.id) ?? 0) - (numero.get(a.id) ?? 0))
        .slice(0, lote)
    }
    if (alvo.length === 0) return NextResponse.json({ ok: true, conferidos: 0, nota: 'nada a conferir' })

    const saida = []
    for (const i of alvo) {
      const r = await checarFatos(corpo.get(i.id)!, (p) =>
        callOpenAI(p, { model: 'gpt-4o-mini', json_mode: true, temperature: 0, max_tokens: 900 }).then((x) => x.content)
      )
      const resumo = {
        conferidas: r.afirmacoes.length,
        suspeitas: r.suspeitas.length,
        sem_resposta: r.semResposta,
        indisponivel: r.indisponivel,
        quando: new Date().toISOString(),
        itens: r.suspeitas.slice(0, 8).map((a) => ({ trecho: a.trecho, sabido: a.sabido, observacao: a.observacao })),
      }
      if (!r.indisponivel) {
        await supabase
          .schema('pulso_content')
          .from('ideias')
          .update({ metadata: { ...(i.metadata || {}), checagem: resumo } })
          .eq('id', i.id)
      }
      saida.push({
        numero: numero.get(i.id) ?? null,
        titulo: i.titulo,
        publicado: publicadas.has(i.id),
        ...resumo,
      })
    }

    return NextResponse.json({
      ok: true,
      conferidos: saida.length,
      com_suspeita: saida.filter((s) => s.suspeitas > 0).length,
      resultados: saida,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
