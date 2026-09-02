'use client'

import { useQuery } from '@tanstack/react-query'
import { getSupabaseBrowser } from '@/lib/supabase/browser'

/**
 * VIGIA DA CADÊNCIA — o insumo mais barato da operação, e o que mais custou caro quando faltou.
 *
 * Em 30/08 e 01/09/2026 saiu 1 vídeo em vez de 2. O canal respondeu no mesmo dia: de ~2.500
 * views/dia (2 posts) para 766 (1 post) e 119 (quase nenhum). O pior: havia 11 vídeos PRONTOS
 * na fila — só estavam carimbados para dias à frente. O cron gravou "ocioso" 23 vezes ao dia e
 * ninguém foi avisado, porque nenhuma tela olhava para a cadência.
 *
 * Este hook existe para essa pergunta não depender de alguém lembrar de perguntar. A trava que
 * conserta sozinho vive no cron (antecipação depois das 19h); aqui é o olho humano.
 */

export interface Cadencia {
  meta: number
  hoje: number
  /** dias dos últimos 7 (sem contar hoje) que saíram abaixo da meta */
  diasAbaixo: number
  /** quantos vídeos deixaram de sair no período */
  deficit: number
  /** hoje ainda dá tempo? (antes das 21h a grade ainda tem slot) */
  aindaDaTempo: boolean
  ultimos: Array<{ dia: string; n: number }>
}

export function useCadencia() {
  const supabase = getSupabaseBrowser()
  return useQuery<Cadencia | null>({
    queryKey: ['cadencia'],
    refetchInterval: 10 * 60 * 1000,
    queryFn: async () => {
      const desde = new Date(Date.now() - 7 * 864e5).toISOString()
      const [{ data: pubs }, { data: cfg }] = await Promise.all([
        supabase.schema('pulso_content').from('metricas_publicacao')
          .select('ideia_id, data_publicacao').gte('data_publicacao', desde),
        supabase.schema('pulso_core').from('configuracoes')
          .select('valor').eq('chave', 'linha_producao').maybeSingle(),
      ])

      let meta = 2
      try {
        const raw = cfg?.valor
        const c = typeof raw === 'string' ? JSON.parse(raw) : raw
        if (c?.publicar_dia) meta = c.publicar_dia
      } catch { /* mantém 2 */ }

      // vídeo único por dia (1 vídeo em 5 redes conta 1), no fuso de Brasília — a grade é BRT
      const porDia = new Map<string, Set<string>>()
      for (const p of pubs || []) {
        if (!p.data_publicacao || !p.ideia_id) continue
        const dia = new Date(p.data_publicacao).toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
        if (!porDia.has(dia)) porDia.set(dia, new Set())
        porDia.get(dia)!.add(p.ideia_id)
      }

      const hojeISO = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
      const ultimos: Array<{ dia: string; n: number }> = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date(Date.now() - i * 864e5).toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
        ultimos.push({ dia: d, n: porDia.get(d)?.size ?? 0 })
      }

      const passados = ultimos.filter((u) => u.dia !== hojeISO)
      const diasAbaixo = passados.filter((u) => u.n < meta).length
      const deficit = passados.reduce((s, u) => s + Math.max(0, meta - u.n), 0)
      const hora = Number(new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', hour12: false }))

      return {
        meta,
        hoje: porDia.get(hojeISO)?.size ?? 0,
        diasAbaixo,
        deficit,
        aindaDaTempo: hora < 21,
        ultimos,
      }
    },
  })
}
