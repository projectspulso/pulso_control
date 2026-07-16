import { useQuery } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase/client'

/**
 * TRILHA DO BENCHMARK — a coorte de ideias semeadas do concorrente (origem=BENCHMARK_CONCORRENTE)
 * medida contra a nossa linha de base histórica. Responde a pergunta única do experimento:
 * "copiar o padrão que funciona pra ele está rendendo mais pra gente?"
 *
 * Honesto por construção: só compara views reais de posts já no ar. Enquanto a coorte não
 * publica, o veredito é "medindo" — nunca um número inventado.
 */

export interface ExperimentoRede {
  rede: string
  base: number // média de views/post da nossa base (fora da coorte)
  coorte: number | null // média de views/post da coorte (null = nada no ar ainda)
  nBase: number
  nCoorte: number
  delta: number | null // coorte/base − 1 (ex.: +0.4 = 40% acima)
}

export interface Experimento {
  totalCoorte: number
  publicadas: number
  porRede: ExperimentoRede[]
  deltaGeral: number | null // ganho médio ponderado da coorte vs base
  veredito: string
}

const ORDEM = ['youtube', 'instagram', 'facebook', 'tiktok', 'kwai']

export function useExperimento() {
  return useQuery<Experimento>({
    queryKey: ['experimento-benchmark'],
    refetchInterval: 10 * 60 * 1000,
    queryFn: async () => {
      const [{ data: bench, error: e1 }, { data: mp, error: e2 }] = await Promise.all([
        supabase.schema('pulso_content').from('ideias').select('id').eq('origem', 'BENCHMARK_CONCORRENTE'),
        supabase.schema('pulso_content').from('metricas_publicacao').select('ideia_id, plataforma, views'),
      ])
      if (e1) throw e1
      if (e2) throw e2

      const benchIds = new Set((bench || []).map((b) => b.id))
      const base: Record<string, { n: number; v: number }> = {}
      const coorte: Record<string, { n: number; v: number }> = {}
      const publicadasSet = new Set<string>()

      for (const m of mp || []) {
        const naCoorte = m.ideia_id && benchIds.has(m.ideia_id)
        if (naCoorte) publicadasSet.add(m.ideia_id as string)
        const bucket = naCoorte ? coorte : base
        const b = (bucket[m.plataforma] = bucket[m.plataforma] || { n: 0, v: 0 })
        b.n++
        b.v += m.views || 0
      }

      const media = (x?: { n: number; v: number }) => (x && x.n ? x.v / x.n : 0)
      const porRede: ExperimentoRede[] = ORDEM.map((rede) => {
        const b = base[rede]
        const c = coorte[rede]
        const mb = media(b)
        const mc = c ? media(c) : null
        return {
          rede,
          base: Math.round(mb),
          coorte: mc == null ? null : Math.round(mc),
          nBase: b?.n || 0,
          nCoorte: c?.n || 0,
          delta: mc != null && mb > 0 ? mc / mb - 1 : null,
        }
      })

      // ganho geral: soma das views da coorte vs o que a base renderia no mesmo nº de posts
      let coorteV = 0
      let esperadoBase = 0
      for (const r of porRede) {
        if (!r.nCoorte) continue
        coorteV += (r.coorte || 0) * r.nCoorte
        esperadoBase += r.base * r.nCoorte
      }
      const deltaGeral = esperadoBase > 0 ? coorteV / esperadoBase - 1 : null

      const publicadas = publicadasSet.size
      let veredito: string
      if (publicadas === 0) {
        veredito = `Medindo — 0 de ${benchIds.size} temas no ar. A trilha liga sozinha quando os primeiros forem publicados e coletados.`
      } else if (deltaGeral == null) {
        veredito = `${publicadas} no ar, aguardando coleta de views.`
      } else if (deltaGeral >= 0.15) {
        veredito = `Está funcionando: a coorte rende ${Math.round(deltaGeral * 100)}% acima da nossa base (${publicadas}/${benchIds.size} no ar).`
      } else if (deltaGeral <= -0.15) {
        veredito = `Atenção: a coorte rende ${Math.round(-deltaGeral * 100)}% ABAIXO da base (${publicadas}/${benchIds.size}). O padrão pode não transferir pra nossa audiência.`
      } else {
        veredito = `Empate técnico com a base (${publicadas}/${benchIds.size} no ar). Precisa de mais posts pra decidir.`
      }

      return { totalCoorte: benchIds.size, publicadas, porRede, deltaGeral, veredito }
    },
  })
}
