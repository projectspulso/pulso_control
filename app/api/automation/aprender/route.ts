import { NextRequest, NextResponse } from 'next/server'
import { guardApi } from '@/lib/auth/api-guard'
import { getSupabaseAdminClient } from '@/lib/supabase/server'

/**
 * POST /api/automation/aprender
 *
 * LOOP DE APRENDIZADO — fecha o ciclo "mede → aprende".
 * Lê os campeões da nossa própria audiência (ganchos de maior retenção + tema×rede)
 * e grava um digest em pulso_core.configuracoes (chave: aprendizado_cerebro).
 * A geração de ideias/roteiro injeta esse digest no prompt (few-shot + viés tema→rede).
 * Roda semanal (cron) — quanto mais dados, mais forte.
 */

const norm = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

function primeiraFrase(md: string): string {
  const linha = (md || '').split('\n').map((l) => l.trim()).find(Boolean) || ''
  const ponto = linha.search(/[.!?]/)
  const frase = ponto > 12 ? linha.slice(0, ponto + 1) : linha
  return frase.slice(0, 140).trim()
}

export async function POST(request: NextRequest) {
  const denied = await guardApi(request)
  if (denied) return denied

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseAdminClient() as any

  try {
    const [{ data: metricas }, { data: roteiros }, { data: ideias }, { data: canais }] =
      await Promise.all([
        supabase
          .schema('pulso_content')
          .from('metricas_publicacao')
          .select('ideia_id, plataforma, views, taxa_retencao'),
        supabase
          .schema('pulso_content')
          .from('roteiros')
          .select('ideia_id, conteudo_md, nota_hook'),
        supabase.schema('pulso_content').from('ideias').select('id, titulo, canal_id'),
        supabase.schema('pulso_core').from('canais').select('id, nome'),
      ])

    const canalNome = new Map<string, string>((canais || []).map((c: { id: string; nome: string }) => [c.id, c.nome]))
    const ideiaCanal = new Map<string, string>()
    const ideiaTitulo = new Map<string, string>()
    for (const i of ideias || []) {
      ideiaCanal.set(i.id, i.canal_id)
      ideiaTitulo.set(i.id, i.titulo)
    }
    const roteiroPorIdeia = new Map<string, { conteudo_md: string; nota_hook: number | null }>()
    for (const r of roteiros || []) {
      if (r.ideia_id && !roteiroPorIdeia.has(r.ideia_id)) roteiroPorIdeia.set(r.ideia_id, r)
    }

    // --- agrega métricas por ideia (retenção máx + views totais) ---
    const porIdeia = new Map<string, { views: number; ret: number }>()
    // --- tema×rede: views por (plataforma, vertical) ---
    const temaRede = new Map<string, Map<string, number>>()
    for (const m of metricas || []) {
      const ag = porIdeia.get(m.ideia_id) || { views: 0, ret: 0 }
      ag.views += m.views || 0
      ag.ret = Math.max(ag.ret, m.taxa_retencao || 0)
      porIdeia.set(m.ideia_id, ag)

      const vert = canalNome.get(ideiaCanal.get(m.ideia_id) || '') || '?'
      if (!temaRede.has(m.plataforma)) temaRede.set(m.plataforma, new Map())
      const vm = temaRede.get(m.plataforma)!
      vm.set(vert, (vm.get(vert) || 0) + (m.views || 0))
    }

    // --- ganchos campeões: ordena por retenção, depois views; pega os com roteiro ---
    const ranked = [...porIdeia.entries()]
      .map(([id, ag]) => ({ id, ...ag, r: roteiroPorIdeia.get(id) }))
      .filter((x) => x.r && x.r.conteudo_md)
      .sort((a, b) => b.ret - a.ret || b.views - a.views)

    const ganchos: string[] = []
    const vistos = new Set<string>()
    for (const x of ranked) {
      const g = primeiraFrase(x.r!.conteudo_md)
      const k = norm(g).slice(0, 40)
      if (g.length > 20 && !vistos.has(k)) {
        vistos.add(k)
        ganchos.push(g)
      }
      if (ganchos.length >= 8) break
    }

    const temaRedeTop: Record<string, string> = {}
    for (const [plat, vm] of temaRede) {
      const top = [...vm.entries()].sort((a, b) => b[1] - a[1])[0]
      if (top) temaRedeTop[plat] = top[0].replace(/^PULSO\s*/i, '')
    }

    // --- monta o digest (texto pronto pra injetar no prompt) ---
    const linhasTemaRede = Object.entries(temaRedeTop)
      .map(([p, v]) => `- ${p}: ${v}`)
      .join('\n')
    const texto = `APRENDIZADO DA NOSSA AUDIÊNCIA (referência de PADRÃO — não copie tema nem frase literal):
GANCHOS QUE MAIS RETIVERAM (replique a ESTRUTURA do gancho, não o assunto):
${ganchos.map((g) => `- "${g}"`).join('\n')}
TEMA × REDE (o que cada rede mais premiou em views — priorize ao distribuir/escolher tema):
${linhasTemaRede}`

    const valor = {
      texto,
      ganchos,
      tema_rede: temaRedeTop,
      base: { ideias_com_metrica: porIdeia.size, ganchos: ganchos.length },
      atualizado_em: new Date().toISOString(),
    }

    // upsert em configuracoes
    const { data: existe } = await supabase
      .schema('pulso_core')
      .from('configuracoes')
      .select('chave')
      .eq('chave', 'aprendizado_cerebro')
      .maybeSingle()

    if (existe) {
      await supabase
        .schema('pulso_core')
        .from('configuracoes')
        .update({ valor: JSON.stringify(valor) })
        .eq('chave', 'aprendizado_cerebro')
    } else {
      await supabase
        .schema('pulso_core')
        .from('configuracoes')
        .insert({ chave: 'aprendizado_cerebro', valor: JSON.stringify(valor) })
    }

    return NextResponse.json({ success: true, ...valor })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
