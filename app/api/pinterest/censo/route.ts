import { NextRequest, NextResponse } from 'next/server'
import { guardApi } from '@/lib/auth/api-guard'
import { getSupabaseAdminClient } from '@/lib/supabase/server'

/**
 * CENSO MANUAL DO PINTEREST — a série de autoridade da rede espelho.
 *
 * O Pinterest republica sozinho tudo que sai no Instagram (recurso nativo: IG reivindicado +
 * publicação automática). Alcance de graça — mas o app não via nada, e o que não se mede não
 * vira prova de autoridade.
 *
 * POR QUE CENSO E NÃO COLETOR: por acordo com o digiai (26/08/2026), o coletor de Pinterest é
 * ÚNICO e nasce no sync-metricas do digiai_mkt; os apps leem por espelho. Construir o nosso
 * criaria a segunda credencial e a segunda verdade. Censo manual foi o caminho provisório que
 * eles mesmos recomendaram (fizeram igual com o LinkedIn) — some quando o coletor existir.
 *
 * A leitura vem do painel logado (analytics.pinterest.com), que entrega em três níveis: conta,
 * pin e vídeo. Aqui guardamos o nível de conta, que é o que sustenta a conversa de autoridade.
 *
 * Payload: { data?: 'YYYY-MM-DD', janela_dias?: 30, impressoes, engajamentos, cliques_saida,
 *            pins_salvos, publico_total, publico_engajado, pins_criados?, nota? }
 */

const CHAVE = 'pinterest_censo'

export interface LeituraPinterest {
  data: string
  janela_dias: number
  impressoes: number
  engajamentos: number
  cliques_saida: number
  pins_salvos: number
  publico_total: number
  publico_engajado: number
  pins_criados?: number
  nota?: string
}

export async function POST(request: NextRequest) {
  const denied = await guardApi(request)
  if (denied) return denied
  const body = await request.json().catch(() => ({}))

  const hoje = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
  const leitura: LeituraPinterest = {
    data: body.data || hoje,
    janela_dias: Number(body.janela_dias) || 30,
    impressoes: Number(body.impressoes) || 0,
    engajamentos: Number(body.engajamentos) || 0,
    cliques_saida: Number(body.cliques_saida) || 0,
    pins_salvos: Number(body.pins_salvos) || 0,
    publico_total: Number(body.publico_total) || 0,
    publico_engajado: Number(body.publico_engajado) || 0,
    ...(body.pins_criados != null ? { pins_criados: Number(body.pins_criados) } : {}),
    ...(body.nota ? { nota: String(body.nota).slice(0, 300) } : {}),
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseAdminClient() as any
  const { data: atual } = await supabase
    .schema('pulso_core').from('configuracoes').select('valor').eq('chave', CHAVE).maybeSingle()

  let serie: LeituraPinterest[] = []
  try {
    const raw = atual?.valor
    const v = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (Array.isArray(v)) serie = v
  } catch { /* série nova */ }

  // uma leitura por data: recenso do mesmo dia corrige, não duplica
  serie = serie.filter((l) => l.data !== leitura.data)
  serie.push(leitura)
  serie.sort((a, b) => a.data.localeCompare(b.data))

  const { error } = await supabase.schema('pulso_core').from('configuracoes').upsert(
    {
      chave: CHAVE,
      valor: JSON.stringify(serie),
      tipo: 'json',
      categoria: 'metricas',
      descricao: 'Censo manual do Pinterest (@projectspulso) — rede espelho do Instagram. Substituir pelo coletor do digiai_mkt quando existir.',
    },
    { onConflict: 'chave' }
  )
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, leituras: serie.length, leitura })
}

export async function GET(request: NextRequest) {
  const denied = await guardApi(request)
  if (denied) return denied
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseAdminClient() as any
  const { data } = await supabase
    .schema('pulso_core').from('configuracoes').select('valor').eq('chave', CHAVE).maybeSingle()
  let serie: LeituraPinterest[] = []
  try {
    const v = typeof data?.valor === 'string' ? JSON.parse(data.valor) : data?.valor
    if (Array.isArray(v)) serie = v
  } catch { /* vazio */ }
  return NextResponse.json({ leituras: serie })
}
