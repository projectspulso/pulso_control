import { NextRequest, NextResponse } from 'next/server'

import { guardApi } from '@/lib/auth/api-guard'
import { getSupabaseAdminClient } from '@/lib/supabase/server'

/**
 * POST /api/agenda/popular
 * Preenche os slots futuros (gerados da grade vw_agenda_semanal) com o melhor ativo
 * de cada canal: vídeo pronto > áudio > roteiro > ideia. Não reusa o mesmo conteúdo,
 * não sobrescreve slot já atribuído (preserva edição manual). Slot sem estoque = "vazio".
 * Payload: { horizonte?: number }
 */
const RANK: Record<string, number> = { video: 4, audio: 3, roteiro: 2, ideia: 1 }

export async function POST(request: NextRequest) {
  const denied = await guardApi(request)
  if (denied) return denied

  const body = await request.json().catch(() => ({}))
  const horizonte = Math.min(Math.max(Number(body.horizonte) || 21, 7), 60)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseAdminClient() as any

  try {
    const [gradeQ, ideiasQ, roteirosQ, audiosQ, metricasQ, pipeQ, atribQ] = await Promise.all([
      supabase.from('vw_agenda_semanal').select('*').eq('ativo', true),
      supabase.schema('pulso_content').from('ideias').select('id, canal_id, status, titulo'),
      supabase.schema('pulso_content').from('roteiros').select('ideia_id'),
      supabase.schema('pulso_content').from('audios').select('ideia_id'),
      supabase.schema('pulso_content').from('metricas_publicacao').select('ideia_id'),
      supabase.schema('pulso_content').from('pipeline_producao').select('ideia_id, status'),
      supabase.schema('pulso_content').from('agenda_atribuicoes').select('data, horario, ideia_id'),
    ])
    if (gradeQ.error) return NextResponse.json({ error: gradeQ.error.message }, { status: 500 })

    const grade = gradeQ.data || []
    const comRoteiro = new Set((roteirosQ.data || []).map((r: { ideia_id: string }) => r.ideia_id))
    const comAudio = new Set((audiosQ.data || []).map((a: { ideia_id: string }) => a.ideia_id))
    const publicado = new Set((metricasQ.data || []).map((m: { ideia_id: string }) => m.ideia_id))
    const videoPronto = new Set(
      (pipeQ.data || []).filter((p: { status: string }) => p.status === 'PRONTO_PUBLICACAO').map((p: { ideia_id: string }) => p.ideia_id)
    )

    // estoque disponível por canal (não publicado), ordenado por estágio mais avançado
    const estoque = new Map<string, { id: string; titulo: string; estagio: string; rank: number }[]>()
    for (const i of ideiasQ.data || []) {
      if (!i.canal_id || publicado.has(i.id)) continue
      let estagio: string | null = null
      if (videoPronto.has(i.id)) estagio = 'video'
      else if (comAudio.has(i.id)) estagio = 'audio'
      else if (comRoteiro.has(i.id)) estagio = 'roteiro'
      else if (i.status === 'APROVADA') estagio = 'ideia'
      if (!estagio) continue
      if (!estoque.has(i.canal_id)) estoque.set(i.canal_id, [])
      estoque.get(i.canal_id)!.push({ id: i.id, titulo: i.titulo, estagio, rank: RANK[estagio] })
    }
    for (const arr of estoque.values()) arr.sort((a, b) => b.rank - a.rank)

    // já atribuídos: preserva slots + não reusa ideias
    const slotsExistentes = new Set((atribQ.data || []).map((a: { data: string; horario: string }) => `${a.data}|${a.horario}`))
    const usados = new Set((atribQ.data || []).map((a: { ideia_id: string | null }) => a.ideia_id).filter(Boolean))

    // gera slots datados do horizonte
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const novos: Record<string, unknown>[] = []
    for (let d = 0; d < horizonte; d++) {
      const dt = new Date(hoje)
      dt.setDate(hoje.getDate() + d)
      const wd = dt.getDay() === 0 ? 7 : dt.getDay()
      const dataIso = dt.toISOString().slice(0, 10)
      for (const g of grade.filter((x: { dia_semana: number }) => x.dia_semana === wd)) {
        const chave = `${dataIso}|${g.horario}`
        if (slotsExistentes.has(chave)) continue // preserva
        const lista = estoque.get(g.canal_id) || []
        const escolha = lista.find((x) => !usados.has(x.id))
        if (escolha) usados.add(escolha.id)
        novos.push({
          data: dataIso,
          horario: g.horario,
          canal_id: g.canal_id,
          ideia_id: escolha?.id || null,
          estagio: escolha?.estagio || 'vazio',
          status: 'planejado',
        })
        slotsExistentes.add(chave)
      }
    }

    if (novos.length > 0) {
      const { error } = await supabase.schema('pulso_content').from('agenda_atribuicoes').insert(novos)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const porEstagio: Record<string, number> = {}
    for (const n of novos) porEstagio[n.estagio as string] = (porEstagio[n.estagio as string] || 0) + 1

    return NextResponse.json({
      success: true,
      criados: novos.length,
      preenchidos: novos.filter((n) => n.ideia_id).length,
      vazios: novos.filter((n) => !n.ideia_id).length,
      por_estagio: porEstagio,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
