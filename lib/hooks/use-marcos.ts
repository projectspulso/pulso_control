'use client'

import { useQuery } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase/client'
import { calcularMarcos, type PontoSerie, type ResumoMarcos } from '@/lib/analytics/marcos'

/**
 * As duas séries cumulativas que sustentam marcos, cada uma com sua limitação declarada.
 *
 * VIEWS — reconstruídas de `pulso_analytics.leituras_metricas`: para cada dia, soma da ÚLTIMA
 * leitura conhecida de cada post até ali. Não dá pra somar as leituras do dia direto (isso daria
 * o ganho do dia, não o acumulado) nem usar `metricas_diarias` (snapshots cumulativos aposentados
 * que inflam ~37× quando somados — legado morto, ver AGENTS.md).
 *
 * SEGUIDORES — de `pulso_core.configuracoes.seguidores_historico`, o contador diário das 5 redes.
 * Começa em 13/07 com 529 já acumulados: os marcos de 100 a 500 são anteriores ao registro e
 * ficam de fora, sinalizados pelo `pisoConhecido`.
 */
export interface MarcosSnapshot {
  views: ResumoMarcos
  seguidores: ResumoMarcos
  videos: ResumoMarcos
}

export function useMarcos() {
  return useQuery<MarcosSnapshot>({
    queryKey: ['marcos'],
    refetchInterval: 15 * 60 * 1000,
    queryFn: async () => {
      const [leiQ, cfgQ, pubQ] = await Promise.all([
        supabase
          .schema('pulso_analytics')
          .from('leituras_metricas')
          .select('post_id, plataforma, data_ref, views')
          // Mesmo recorte da use-bi: o backfill de 19/06 carimbou o valor daquele dia sobre
          // 10–17/06, o que não muda os marcos mas falsifica o piso da série (3.998 em vez de 378).
          .eq('estimado', false)
          .gte('data_ref', '2026-06-18')
          .order('data_ref'),
        supabase.schema('pulso_core').from('configuracoes').select('valor').eq('chave', 'seguidores_historico').maybeSingle(),
        supabase.schema('pulso_content').from('metricas_publicacao').select('ideia_id, data_publicacao'),
      ])
      if (leiQ.error) throw leiQ.error

      // ── views: acumulado por dia ──
      const leituras = (leiQ.data || []) as Array<{ post_id: string | null; plataforma: string; data_ref: string; views: number | null }>
      const porDia = new Map<string, typeof leituras>()
      for (const l of leituras) {
        const d = l.data_ref.slice(0, 10)
        if (!porDia.has(d)) porDia.set(d, [])
        porDia.get(d)!.push(l)
      }
      const ultimaDoPost = new Map<string, number>()
      const serieViews: PontoSerie[] = []
      for (const d of [...porDia.keys()].sort()) {
        for (const l of porDia.get(d)!) ultimaDoPost.set(`${l.plataforma}|${l.post_id}`, l.views ?? 0)
        let soma = 0
        for (const v of ultimaDoPost.values()) soma += v
        serieViews.push({ data: d, valor: soma })
      }

      // ── seguidores: soma das 5 redes por dia ──
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let raw: any = (cfgQ.data as any)?.valor ?? null
      if (typeof raw === 'string') { try { raw = JSON.parse(raw) } catch { raw = null } }
      const hist: Array<Record<string, unknown>> = Array.isArray(raw) ? raw : raw?.historico || []
      const REDES = ['youtube', 'instagram', 'facebook', 'tiktok', 'kwai']
      const serieSeg: PontoSerie[] = hist
        .map((h) => ({
          data: String(h.data),
          valor: REDES.reduce((s, r) => s + (typeof h[r] === 'number' ? (h[r] as number) : 0), 0),
        }))
        .filter((p) => p.valor > 0)

      // ── vídeos publicados: acumulado por data de publicação (1 por ideia) ──
      const pubs = (pubQ.data || []) as Array<{ ideia_id: string | null; data_publicacao: string | null }>
      const primeiraPub = new Map<string, string>()
      for (const p of pubs) {
        if (!p.ideia_id || !p.data_publicacao) continue
        const d = p.data_publicacao.slice(0, 10)
        const at = primeiraPub.get(p.ideia_id)
        if (!at || d < at) primeiraPub.set(p.ideia_id, d)
      }
      const contagem = new Map<string, number>()
      for (const d of primeiraPub.values()) contagem.set(d, (contagem.get(d) || 0) + 1)
      let acc = 0
      const serieVideos: PontoSerie[] = [...contagem.entries()]
        .sort((a, b) => (a[0] < b[0] ? -1 : 1))
        .map(([d, n]) => ({ data: d, valor: (acc += n) }))

      return {
        views: calcularMarcos(serieViews, 100_000),
        seguidores: calcularMarcos(serieSeg, 100),
        videos: calcularMarcos(serieVideos, 25),
      }
    },
  })
}
