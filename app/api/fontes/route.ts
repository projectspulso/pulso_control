import { NextRequest, NextResponse } from 'next/server'
import { guardApi } from '@/lib/auth/api-guard'
import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { callOpenAI } from '@/lib/automation/ai-clients'
import { checarFatos } from '@/lib/automation/checagem-fatos'
import { verificarFontes } from '@/lib/automation/verificar-fontes'

/**
 * POST /api/fontes { ideia_id?, numero?, lote?, desde? }   desde = só publicados a partir da data (AAAA-MM-DD)
 *
 * Preenche a FONTE DE VERDADE (lib/automation/verificar-fontes.ts) do que já foi escrito. Roteiro
 * novo já nasce com fontes (gerar-roteiro); esta rota cobre o resto, nesta ordem: o ESTOQUE (ainda
 * vai ao ar — é onde a fonte evita erro) e depois os PUBLICADOS do mais novo para trás (é onde
 * chegam as perguntas). Quem não tem a checagem de memória ganha ela antes, porque é dela que saem
 * as afirmações. Grava em ideias.metadata.fontes — só no banco, nunca na tela pública.
 */

export const maxDuration = 300

const NO_ESTOQUE = ['AGUARDANDO_ROTEIRO', 'ROTEIRO_PRONTO', 'AUDIO_GERADO', 'EM_EDICAO', 'PRONTO_PUBLICACAO']

export async function POST(request: NextRequest) {
  const guard = await guardApi(request)
  if (guard) return guard

  const body = await request.json().catch(() => ({}))
  const lote = Math.min(Math.max(Number(body?.lote) || 4, 1), 8)

  try {
    const supabase = getSupabaseAdminClient()
    const [ideiasQ, rotQ, pipeQ, pubQ] = await Promise.all([
      supabase.schema('pulso_content').from('ideias').select('id, titulo, status, formato, metadata'),
      supabase.schema('pulso_content').from('roteiros').select('ideia_id, conteudo_md'),
      supabase.schema('pulso_content').from('pipeline_producao').select('ideia_id, status, metadata'),
      supabase.schema('pulso_content').from('metricas_publicacao').select('ideia_id, data_publicacao'),
    ])
    if (ideiasQ.error) throw ideiasQ.error

    const corpo = new Map<string, string>()
    for (const r of (rotQ.data || []) as Array<{ ideia_id: string; conteudo_md: string | null }>) {
      if (r.ideia_id && r.conteudo_md && !corpo.has(r.ideia_id)) corpo.set(r.ideia_id, r.conteudo_md)
    }
    const pipe = new Map<string, { status: string; numero: number | null }>()
    for (const p of (pipeQ.data || []) as Array<{ ideia_id: string; status: string; metadata: { numero?: number } | null }>) {
      if (p.ideia_id) pipe.set(p.ideia_id, { status: p.status, numero: p.metadata?.numero ?? null })
    }
    const publicadoEm = new Map<string, string>()
    for (const m of (pubQ.data || []) as Array<{ ideia_id: string | null; data_publicacao: string | null }>) {
      if (!m.ideia_id || !m.data_publicacao) continue
      const atual = publicadoEm.get(m.ideia_id)
      if (!atual || m.data_publicacao < atual) publicadoEm.set(m.ideia_id, m.data_publicacao)
    }

    type Ideia = { id: string; titulo: string | null; status: string; formato: string | null; metadata: Record<string, unknown> | null }
    const todas = ((ideiasQ.data || []) as Ideia[]).filter(
      (i) => i.status !== 'DESCARTADA' && i.formato !== 'longo' && corpo.has(i.id)
    )

    let alvo: Ideia[]
    if (body?.ideia_id) alvo = todas.filter((i) => i.id === body.ideia_id)
    else if (body?.numero != null) alvo = todas.filter((i) => pipe.get(i.id)?.numero === Number(body.numero))
    else {
      const pendentes = todas.filter((i) => !(i.metadata as { fontes?: unknown } | null)?.fontes)
      const estoque = pendentes.filter((i) => !publicadoEm.has(i.id) && NO_ESTOQUE.includes(pipe.get(i.id)?.status || ''))
      const publicados = pendentes
        .filter((i) => publicadoEm.has(i.id) && (!body?.desde || publicadoEm.get(i.id)! >= String(body.desde)))
        .sort((a, b) => (publicadoEm.get(b.id)! < publicadoEm.get(a.id)! ? -1 : 1))
      alvo = [...estoque, ...publicados].slice(0, lote)
    }
    if (alvo.length === 0) return NextResponse.json({ ok: true, conferidos: 0, nota: 'nada a conferir' })

    const saida = []
    for (const i of alvo) {
      const md = { ...(i.metadata || {}) } as Record<string, unknown>
      let itens = ((md.checagem as { itens?: Array<{ trecho: string; tipo?: string }> } | undefined)?.itens) || []
      if (!md.checagem) {
        const r = await checarFatos(corpo.get(i.id)!, (p) =>
          callOpenAI(p, { model: 'gpt-4o-mini', json_mode: true, temperature: 0, max_tokens: 900 }).then((x) => x.content)
        )
        if (!r.indisponivel) {
          md.checagem = {
            conferidas: r.afirmacoes.length, erradas: r.erradas.length, nao_confirmadas: r.naoConfirmadas.length,
            indisponivel: false, quando: new Date().toISOString(), fontes_verificadas: false,
            itens: r.afirmacoes.slice(0, 20).map((a) => ({
              trecho: a.trecho, tipo: a.tipo, veredito: a.veredito, sabido: a.sabido, fonte: a.fonte ?? null, observacao: a.observacao,
            })),
          }
          itens = r.afirmacoes
        }
      }
      const fontes = await verificarFontes(itens, { roteiro: corpo.get(i.id), titulo: i.titulo })
      if (!fontes.indisponivel) {
        md.fontes = fontes
        if (md.checagem) (md.checagem as Record<string, unknown>).fontes_verificadas = fontes.confirmadas > 0
      }
      await supabase.schema('pulso_content').from('ideias').update({ metadata: md }).eq('id', i.id)
      saida.push({
        numero: pipe.get(i.id)?.numero ?? null,
        titulo: i.titulo,
        publicado: publicadoEm.has(i.id),
        total: fontes.total, confirmadas: fontes.confirmadas, contraditas: fontes.contraditas,
        sem_prova: fontes.semProva, indisponivel: fontes.indisponivel,
      })
    }

    const restantes = todas.filter((i) => !(i.metadata as { fontes?: unknown } | null)?.fontes &&
      (!body?.desde || !publicadoEm.has(i.id) || publicadoEm.get(i.id)! >= String(body.desde))).length - saida.length
    return NextResponse.json({ ok: true, conferidos: saida.length, restantes: Math.max(0, restantes), resultados: saida })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'erro' }, { status: 500 })
  }
}
