'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

/**
 * Analytics dos Longos (06/11/2026, molde: Analytics dos Curtos). Lê só o que é dos Longos:
 * leituras_longos e seguidores_longos (091), a agenda corte_publicacoes, os episódios e o backlog de
 * assuntos dos Bastidores. Crescimento = delta entre leituras do mesmo post (igual aos Curtos).
 */
export interface Leitura {
  episodio_id: string; peca_id: string | null; canal: string; rede: string; tipo: string; data_ref: string
  views: number; likes: number; comentarios: number; compartilhamentos: number
  horas_exibicao: number | null; retencao_media_pct: number | null; cliques_episodio: number | null
  retencao_curva: { p: number; ret: number }[] | null; origens: Record<string, number> | null; fonte: string
}
export interface Peca {
  id: string; episodio_id: string; destino: string; rede: string; tipo: string; status: string; url: string | null
  motivo: string | null; agendado_para: string | null; corte_numero: number; corte_titulo: string; corte_tipo: string | null
}
export interface Ep { id: string; codigo: string; titulo: string; status: string; estreia: string | null; url: string | null }
export interface Gate { id: string; nome: string; inscritos: number; horas_12m: number; recompensa: string }
export interface Assunto { slug: string; titulo: string; tipo: string; data: string | null }

export interface AnalyticsLongos {
  episodios: Ep[]; pecas: Peca[]; leituras: Leitura[]
  seguidores: { canal: string; rede: string; data_ref: string; seguidores: number }[]
  gates: Gate[]; notaMetas: string | null; backlog: Assunto[]
  ultimaColeta: { status: string; criado: string; detalhes: Record<string, unknown> } | null
}

export function useAnalyticsLongos() {
  return useQuery<AnalyticsLongos>({
    queryKey: ['analytics-longos'],
    queryFn: async () => {
      const [ep, pc, le, se, mt, bk, lg] = await Promise.all([
        supabase.schema('pulso_content').from('episodios').select('id, codigo, titulo, status, metadata').order('codigo'),
        supabase.schema('pulso_content').from('corte_publicacoes')
          .select('id, destino, rede, tipo, status, url, motivo, agendado_para, episodio_cortes!inner(episodio_id, numero, titulo, tipo)'),
        supabase.schema('pulso_analytics').from('leituras_longos')
          .select('episodio_id, peca_id, canal, rede, tipo, data_ref, views, likes, comentarios, compartilhamentos, horas_exibicao, retencao_media_pct, cliques_episodio, retencao_curva, origens, fonte')
          .order('data_ref').limit(20000),
        supabase.schema('pulso_analytics').from('seguidores_longos').select('canal, rede, data_ref, seguidores').order('data_ref'),
        supabase.schema('pulso_core').from('configuracoes').select('valor').eq('chave', 'longos_metas').maybeSingle(),
        supabase.schema('pulso_content').from('bastidores_assuntos').select('slug, titulo, tipo, data, episodio, status')
          .is('episodio', null).eq('status', 'aprovado').order('data', { ascending: false }).limit(60),
        supabase.schema('pulso_content').from('logs_workflows').select('status, created_at, detalhes')
          .eq('workflow_name', 'COLETAR_LONGOS').order('created_at', { ascending: false }).limit(1),
      ])
      for (const r of [ep, pc, le, se, mt, bk]) if (r.error) throw r.error
      let metas: { gates?: Gate[]; nota?: string } = {}
      try { metas = JSON.parse(mt.data?.valor || '{}') } catch { metas = {} }
      return {
        episodios: (ep.data || []).map((e) => {
          const p = (e.metadata as { publicacao?: { data?: string; url?: string } } | null)?.publicacao || {}
          return { id: e.id, codigo: e.codigo, titulo: e.titulo, status: e.status, estreia: p.data || null, url: p.url || null }
        }),
        pecas: (pc.data || []).map((p) => {
          const c = p.episodio_cortes as unknown as { episodio_id: string; numero: number; titulo: string; tipo: string | null }
          return { id: p.id, episodio_id: c.episodio_id, destino: p.destino, rede: p.rede, tipo: p.tipo, status: p.status, url: p.url,
            motivo: p.motivo, agendado_para: p.agendado_para, corte_numero: c.numero, corte_titulo: c.titulo, corte_tipo: c.tipo }
        }),
        leituras: (le.data || []) as Leitura[],
        seguidores: se.data || [],
        gates: Array.isArray(metas.gates) ? metas.gates : [],
        notaMetas: metas.nota || null,
        backlog: (bk.data || []).map((a) => ({ slug: a.slug, titulo: a.titulo, tipo: a.tipo, data: a.data })),
        ultimaColeta: lg.data?.[0] ? { status: lg.data[0].status, criado: lg.data[0].created_at, detalhes: lg.data[0].detalhes || {} } : null,
      }
    },
  })
}

/** chave de um post: o longo (peca nula) ou a peça */
export const chavePost = (l: Pick<Leitura, 'episodio_id' | 'peca_id' | 'rede'>) => `${l.peca_id || `longo:${l.episodio_id}`}|${l.rede}`

/** a leitura mais recente de cada post */
export function ultimas(leituras: Leitura[]) {
  const m = new Map<string, Leitura>()
  for (const l of leituras) {
    const k = chavePost(l)
    const a = m.get(k)
    if (!a || a.data_ref <= l.data_ref) m.set(k, l)
  }
  return [...m.values()]
}

/** série diária: acumulado (cada post carrega a última leitura até o dia) e ganho do dia (soma dos deltas) */
export function serieDiaria(leituras: Leitura[], campo: 'views' | 'horas_exibicao' = 'views') {
  const dias = [...new Set(leituras.map((l) => l.data_ref))].sort()
  const atual = new Map<string, number>()
  const porDia = new Map<string, Leitura[]>()
  for (const l of leituras) porDia.set(l.data_ref, [...(porDia.get(l.data_ref) || []), l])
  return dias.map((d) => {
    let ganho = 0
    for (const l of porDia.get(d) || []) {
      const k = chavePost(l)
      const v = Number(l[campo] || 0)
      const antes = atual.get(k)
      if (antes !== undefined) ganho += Math.max(0, v - antes)
      else ganho += v
      atual.set(k, v)
    }
    const acumulado = [...atual.values()].reduce((s, v) => s + v, 0)
    return { data: d, acumulado, ganho }
  })
}

export const mediana = (xs: number[]) => {
  if (!xs.length) return 0
  const s = [...xs].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}
