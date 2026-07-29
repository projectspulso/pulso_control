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
  type LeituraBruta,
  type PubBruta,
} from '@/lib/decisor/fatos'

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
    const desde = new Date(Date.now() - DIAS_SERIE * 86_400_000).toISOString().slice(0, 10)

    const [pubQ, leiQ, ideiasQ, filaQ, parecerQ] = await Promise.all([
      supabase
        .schema('pulso_content')
        .from('metricas_publicacao')
        .select('ideia_id, plataforma, data_publicacao, views, likes, reach, taxa_conversao'),
      supabase
        .schema('pulso_analytics')
        .from('leituras_metricas')
        .select('ideia_id, plataforma, post_id, data_ref, views')
        .gte('data_ref', desde),
      supabase.schema('pulso_content').from('ideias').select('id, titulo, status'),
      // fila = o que está pronto ou em produção e ainda não publicou
      supabase
        .schema('pulso_content')
        .from('pipeline_producao')
        .select('ideia_id, status')
        .not('status', 'eq', 'PUBLICADO'),
      supabase.schema('pulso_core').from('configuracoes').select('valor').eq('chave', CHAVE_PARECER).maybeSingle(),
    ])

    if (pubQ.error) throw pubQ.error
    if (leiQ.error) throw leiQ.error
    if (ideiasQ.error) throw ideiasQ.error

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawPubs = (pubQ.data || []) as any[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawLei = (leiQ.data || []) as any[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawIdeias = (ideiasQ.data || []) as any[]

    const titulos = new Map<string, string | null>(rawIdeias.map((i) => [i.id, i.titulo]))

    const pubs: PubBruta[] = rawPubs.map((p) => ({
      ideiaId: p.ideia_id,
      plataforma: p.plataforma,
      dataPublicacao: p.data_publicacao,
      views: p.views,
      likes: p.likes,
      reach: p.reach,
      taxaConversao: p.taxa_conversao,
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
    const titulosFila = idsFila.map((id) => titulos.get(id) ?? null)

    const radar = radarDeEstouro(leituras, titulos, publicadoEm)
    const temasFacebook = desempenhoPorTema(pubs, titulos, 'facebook')
    const temasGeral = desempenhoPorTema(pubs, titulos)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parecerRaw = (parecerQ.data as any)?.valor ?? null
    const parecer = typeof parecerRaw === 'string' ? safeParse(parecerRaw) : parecerRaw

    return NextResponse.json({
      ok: true,
      geradoEm: new Date().toISOString(),
      janelaDias: DIAS_SERIE,
      fatos: {
        radar,
        ganhos: ganhos.slice(-14),
        tendencia: tendencia(ganhos, 7),
        dependencia: dependenciaDeViral(ganhos, viewsPorVideo),
        redes: perfilDasRedes(pubs),
        temasFacebook,
        temasGeral,
        fila: filaPorTema(titulosFila),
        publicadosHoje: contarPublicadosHoje(pubs),
      },
      parecer,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}

function contarPublicadosHoje(pubs: PubBruta[]) {
  const hoje = new Date().toISOString().slice(0, 10)
  const ideias = new Set<string>()
  const redes = new Set<string>()
  for (const p of pubs) {
    if (!p.dataPublicacao || p.dataPublicacao.slice(0, 10) !== hoje) continue
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
