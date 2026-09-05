import { NextRequest, NextResponse } from 'next/server'
import { guardApi } from '@/lib/auth/api-guard'
import { getSupabaseAdminClient } from '@/lib/supabase/server'
import {
  radarDeEstouro,
  ganhoPorDia,
  tendencia,
  dependenciaDeViral,
  perfilDasRedes,
  desempenhoPorTema,
  filaPorTema,
  coberturaPorRede,
  type CoberturaEntrada,
  type PontoSeguidores,
  type LeituraBruta,
  type PubBruta,
} from '@/lib/decisor/fatos'
import { montarContratoRedes } from '@/lib/decisor/contrato-redes'
import { hojeBRT, diaBRT } from '@/lib/datas'

/**
 * GET /api/decisor
 *
 * OS FATOS, calculados em código — nunca por LLM. Esta rota é a única fonte do módulo /decisor:
 * o analista (rota /api/decisor/analisar) recebe exatamente este JSON e só escreve a frase em
 * cima dele. Se um número não sai daqui, o analista não pode citá-lo.
 *
 * Devolve também o último parecer do analista, lido do cache (pulso_core.configuracoes) — a tela
 * nunca dispara LLM por conta própria, senão cada abertura viraria custo.
 */

export const maxDuration = 60

const DIAS_SERIE = 21 // janela da série diária (suficiente pra tendência 7×7 + radar)
const CHAVE_PARECER = 'decisor_parecer'

export async function GET(request: NextRequest) {
  const guard = await guardApi(request)
  if (guard) return guard

  try {
    const supabase = getSupabaseAdminClient()
    const desde = new Date(Date.now() - DIAS_SERIE * 86_400_000).toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })

    const [pubQ, leiQ, ideiasQ, filaQ, roteirosQ, parecerQ, segQ, audiosQ] = await Promise.all([
      supabase
        .schema('pulso_content')
        .from('metricas_publicacao')
        .select(
          'ideia_id, plataforma, data_publicacao, views, likes, reach, taxa_conversao, taxa_retencao, avg_watch_ms, retention_graph, post_id, ultima_atualizacao'
        ),
      supabase
        .schema('pulso_analytics')
        .from('leituras_metricas')
        .select('ideia_id, plataforma, post_id, data_ref, views')
        .gte('data_ref', desde),
      supabase.schema('pulso_content').from('ideias').select('id, titulo, status, formato'),
      // fila = o que está pronto ou em produção e ainda não publicou
      supabase
        .schema('pulso_content')
        .from('pipeline_producao')
        .select('ideia_id, status')
        .not('status', 'eq', 'PUBLICADO'),
      // roteiro entra na classificação de tema: o título sozinho jogava arqueologia em "outros".
      // nota_hook entra no contrato por rede — é o outro lado do eixo da retenção.
      supabase.schema('pulso_content').from('roteiros').select('ideia_id, conteudo_md, nota_hook'),
      supabase.schema('pulso_core').from('configuracoes').select('valor').eq('chave', CHAVE_PARECER).maybeSingle(),
      // contador de seguidores medido todo dia — a ÚNICA fonte honesta de seguidor.
      // Não derivar seguidor de métrica de post: taxa_conversao × reach dava 3.093 no Facebook
      // quando o contador real era 408 (erro de 7,5×, corrigido em 29/07).
      supabase
        .schema('pulso_core')
        .from('configuracoes')
        .select('valor')
        .eq('chave', 'seguidores_historico')
        .maybeSingle(),
      // duração alimenta a faixa campeã por rede no contrato
      supabase.schema('pulso_content').from('audios').select('ideia_id, duracao_segundos'),
    ])

    if (pubQ.error) throw pubQ.error
    if (leiQ.error) throw leiQ.error
    if (ideiasQ.error) throw ideiasQ.error

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawIdeias = (ideiasQ.data || []) as any[]
    // Vídeo longo (bastidores) fora do radar de Shorts: com menos views que a mediana da rede,
    // todo longo viraria "fracasso" no radar e contaminaria a régua dos dois formatos.
    const idsLongo = new Set(rawIdeias.filter((i) => i.formato === 'longo').map((i) => i.id))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawPubs = ((pubQ.data || []) as any[]).filter((p) => !idsLongo.has(p.ideia_id))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawLei = ((leiQ.data || []) as any[]).filter((l) => !idsLongo.has(l.ideia_id))

    const titulos = new Map<string, string | null>(rawIdeias.map((i) => [i.id, i.titulo]))
    // O corpo do roteiro é o segundo turno da classificação de tema — só entra quando o título
    // não decide. "A Misteriosa Biblioteca Subterrânea de Paris" caía em "outros" com o título,
    // e o roteiro dela é catacumba, Segunda Guerra e documento histórico.
    const corpos = new Map<string, string | null>()
    const notasHook = new Map<string, number>()
    for (const r of (roteirosQ.data || []) as Array<{
      ideia_id: string
      conteudo_md: string | null
      nota_hook: number | null
    }>) {
      if (!r.ideia_id) continue
      if (r.conteudo_md && !corpos.has(r.ideia_id)) corpos.set(r.ideia_id, r.conteudo_md)
      if (typeof r.nota_hook === 'number' && !notasHook.has(r.ideia_id)) notasHook.set(r.ideia_id, r.nota_hook)
    }
    const duracoes = new Map<string, number>()
    for (const a of (audiosQ.data || []) as Array<{ ideia_id: string; duracao_segundos: number | null }>) {
      if (a.ideia_id && a.duracao_segundos != null && !duracoes.has(a.ideia_id)) {
        duracoes.set(a.ideia_id, a.duracao_segundos)
      }
    }

    const pubs: PubBruta[] = rawPubs.map((p) => ({
      ideiaId: p.ideia_id,
      plataforma: p.plataforma,
      dataPublicacao: p.data_publicacao,
      views: p.views,
      likes: p.likes,
      reach: p.reach,
      taxaConversao: p.taxa_conversao,
      taxaRetencao: p.taxa_retencao,
    }))

    const leituras: LeituraBruta[] = rawLei.map((l) => ({
      ideiaId: l.ideia_id,
      plataforma: l.plataforma,
      postId: l.post_id,
      dataRef: l.data_ref,
      views: l.views,
    }))

    // "ideia|rede" -> data de publicação (a mais antiga, que é a real)
    const publicadoEm = new Map<string, string>()
    for (const p of pubs) {
      if (!p.ideiaId || !p.dataPublicacao) continue
      const k = `${p.ideiaId}|${p.plataforma}`
      const at = publicadoEm.get(k)
      if (!at || p.dataPublicacao < at) publicadoEm.set(k, p.dataPublicacao)
    }

    // views por vídeo (todas as redes) — pra medir concentração
    const viewsPorVideo = new Map<string, number>()
    for (const p of pubs) {
      if (!p.ideiaId) continue
      viewsPorVideo.set(p.ideiaId, (viewsPorVideo.get(p.ideiaId) || 0) + (p.views ?? 0))
    }

    const ganhos = ganhoPorDia(leituras)

    // fila: títulos das ideias que têm pipeline não publicado
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const idsFila = [...new Set(((filaQ.data || []) as any[]).map((f) => f.ideia_id).filter(Boolean))]
    const itensFila = idsFila.map((id) => ({ titulo: titulos.get(id) ?? null, corpo: corpos.get(id) ?? null }))

    const cobertura: CoberturaEntrada[] = rawPubs.map((p) => ({
      plataforma: p.plataforma,
      postId: p.post_id,
      ultimaAtualizacao: p.ultima_atualizacao,
      reach: p.reach,
      taxaRetencao: p.taxa_retencao,
      avgWatchMs: p.avg_watch_ms,
      retentionGraph: p.retention_graph,
      taxaConversao: p.taxa_conversao,
    }))

    const radar = radarDeEstouro(leituras, titulos, publicadoEm, { corpos })
    const temasFacebook = desempenhoPorTema(pubs, titulos, 'facebook', corpos)
    const temasGeral = desempenhoPorTema(pubs, titulos, undefined, corpos)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parecerRaw = (parecerQ.data as any)?.valor ?? null
    const parecer = typeof parecerRaw === 'string' ? safeParse(parecerRaw) : parecerRaw

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let segRaw: any = (segQ.data as any)?.valor ?? null
    if (typeof segRaw === 'string') segRaw = safeParse(segRaw)
    const historicoSeguidores: PontoSeguidores[] = Array.isArray(segRaw) ? segRaw : segRaw?.historico || []

    return NextResponse.json({
      ok: true,
      geradoEm: new Date().toISOString(),
      janelaDias: DIAS_SERIE,
      fatos: {
        radar,
        ganhos: ganhos.slice(-14),
        tendencia: tendencia(ganhos, 7),
        dependencia: dependenciaDeViral(ganhos, viewsPorVideo),
        redes: perfilDasRedes(pubs, historicoSeguidores),
        temasFacebook,
        temasGeral,
        fila: filaPorTema(itensFila),
        cobertura: coberturaPorRede(cobertura),
        historicoSeguidores,
        publicadosHoje: contarPublicadosHoje(pubs),
        // O CONTRATO POR REDE mora aqui porque o Decisor é o dono da verdade: a mesma função que
        // o gerador de ideias consome (lib/decisor/contrato-redes.ts) é a que alimenta esta tela.
        // Duas contas para a mesma pergunta foi exatamente o erro que criou o gerador cego.
        contratoRedes: montarContratoRedes(
          rawPubs.map((p) => ({
            ideia_id: p.ideia_id,
            plataforma: p.plataforma,
            views: p.views,
            taxa_retencao: p.taxa_retencao,
          })),
          titulos,
          duracoes,
          notasHook,
          corpos
        ),
      },
      parecer,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}

function contarPublicadosHoje(pubs: PubBruta[]) {
  // BRT dos dois lados. Com o dia UTC, das 21h à meia-noite este contador dava ZERO: já era o dia
  // seguinte em UTC enquanto as publicações da noite ainda eram de hoje. Ver lib/datas.ts.
  const hoje = hojeBRT()
  const ideias = new Set<string>()
  const redes = new Set<string>()
  for (const p of pubs) {
    if (!p.dataPublicacao || diaBRT(p.dataPublicacao) !== hoje) continue
    if (p.ideiaId) ideias.add(p.ideiaId)
    redes.add(p.plataforma)
  }
  return { videos: ideias.size, redes: [...redes] }
}

function safeParse(s: string) {
  try {
    return JSON.parse(s)
  } catch {
    return null
  }
}
