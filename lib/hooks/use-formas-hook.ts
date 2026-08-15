import { useQuery } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase/client'
import { FORMAS_HOOK } from '@/lib/automation/forma-hook.constantes'

/**
 * O EXPERIMENTO DO GANCHO, medido por RETENÇÃO — não por views.
 *
 * Medido em 14/08/2026 sobre 121 vídeos do YouTube com curva segundo a segundo:
 *
 *   métrica            variação   vídeos por braço p/ detectar 20%
 *   retenção @5s          11%                  5
 *   retenção total        42%                 72
 *   views                 74%                221
 *
 * Views carregam sorte de algoritmo; retenção no começo é quase só o gancho. Por isso o
 * julgamento é @5s: dá resposta em ~duas semanas em vez de quatro meses.
 *
 * @3s NÃO serve de árbitro: varia só 5% porque quase todo mundo assiste 3 segundos. A peneira
 * real está entre 5 e 8s, onde a retenção cai de 78% para 64% — é ali que o gancho ganha ou perde.
 *
 * SÓ YouTube e Facebook entregam curva. TikTok e Kwai ficam de fora — e isso aparece na tela,
 * porque conclusão sobre gancho não pode parecer que vale para redes que não medimos.
 */

export interface DesempenhoForma {
  forma: string
  n: number
  ret3: number | null
  ret5: number | null
  ret8: number | null
  /** views é contexto, NÃO é o critério — fica na tela para não fingir que não existe */
  medianaViews: number | null
}

const mediana = (a: number[]) => {
  if (!a.length) return null
  const s = [...a].sort((x, y) => x - y)
  const m = s.length >> 1
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

function segundo(graf: unknown, s: number): number | null {
  if (!graf) return null
  const g = (typeof graf === 'string' ? JSON.parse(graf) : graf) as Record<string, number>
  const v = g?.[String(s)]
  return typeof v === 'number' && v > 0 ? v * 100 : null
}

export function useFormasHook() {
  return useQuery<{ formas: DesempenhoForma[]; semForma: number; redesMedidas: string[] }>({
    queryKey: ['formas-hook'],
    refetchInterval: 10 * 60 * 1000,
    queryFn: async () => {
      const [{ data: roteiros, error: e1 }, { data: metricas, error: e2 }] = await Promise.all([
        supabase.schema('pulso_content').from('roteiros').select('ideia_id, metadata'),
        supabase
          .schema('pulso_content')
          .from('metricas_publicacao')
          .select('ideia_id, plataforma, retention_graph, views')
          .in('plataforma', ['youtube', 'facebook']),
      ])
      if (e1) throw e1
      if (e2) throw e2

      const formaDaIdeia = new Map<string, string>()
      let semForma = 0
      for (const r of roteiros || []) {
        const f = (r.metadata as { forma_hook?: string } | null)?.forma_hook
        if (f && r.ideia_id) formaDaIdeia.set(r.ideia_id, f)
        else semForma++
      }

      const balde: Record<string, { r3: number[]; r5: number[]; r8: number[]; v: number[] }> = {}
      for (const f of FORMAS_HOOK) balde[f] = { r3: [], r5: [], r8: [], v: [] }

      for (const m of metricas || []) {
        const f = m.ideia_id ? formaDaIdeia.get(m.ideia_id) : undefined
        if (!f || !balde[f]) continue
        const a = segundo(m.retention_graph, 3)
        const b = segundo(m.retention_graph, 5)
        const c = segundo(m.retention_graph, 8)
        if (a != null) balde[f].r3.push(a)
        if (b != null) balde[f].r5.push(b)
        if (c != null) balde[f].r8.push(c)
        if (typeof m.views === 'number') balde[f].v.push(m.views)
      }

      const formas: DesempenhoForma[] = FORMAS_HOOK.map((f) => ({
        forma: f,
        n: balde[f].r5.length,
        ret3: mediana(balde[f].r3),
        ret5: mediana(balde[f].r5),
        ret8: mediana(balde[f].r8),
        medianaViews: mediana(balde[f].v),
      })).sort((a, b) => (b.ret5 ?? -1) - (a.ret5 ?? -1))

      return { formas, semForma, redesMedidas: ['youtube', 'facebook'] }
    },
  })
}
