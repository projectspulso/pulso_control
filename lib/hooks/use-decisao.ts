import { useQuery } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase/client'

/**
 * Camada de DECISÃO: cruza o que foi CRIADO (ideias/roteiros + atributos) com o
 * que foi PUBLICADO (views). Responde: qual canal rende, o que publicar a seguir,
 * e onde investir produção. Lê tabelas base (pulso_content / pulso_core).
 */
export interface DecisaoCanal {
  canalId: string
  nome: string
  ideias: number
  roteirosProntos: number // roteiros APROVADO ainda não publicados
  publicados: number
  views: number
  mediaViews: number
  notaHookMedia: number | null
  acao: 'produzir' | 'manter' | 'segurar' | 'testar'
}

export interface FilaItem {
  roteiroId: string
  ideiaId: string | null
  titulo: string
  canalNome: string
  notaHook: number | null
  potencial: number
}

export interface DecisaoSnapshot {
  canais: DecisaoCanal[]
  fila: FilaItem[]
  totalPublicados: number
}

export function useDecisao() {
  return useQuery<DecisaoSnapshot>({
    queryKey: ['decisao'],
    refetchInterval: 5 * 60 * 1000,
    queryFn: async () => {
      const [canaisQ, ideiasQ, roteirosQ, metricasQ] = await Promise.all([
        supabase.schema('pulso_core').from('canais').select('id, nome').order('nome'),
        supabase.schema('pulso_content').from('ideias').select('id, canal_id'),
        supabase.schema('pulso_content').from('roteiros').select('id, ideia_id, canal_id, titulo, nota_hook, status'),
        supabase.schema('pulso_content').from('metricas_publicacao').select('ideia_id, views'),
      ])
      if (canaisQ.error) throw canaisQ.error
      if (ideiasQ.error) throw ideiasQ.error
      if (roteirosQ.error) throw roteirosQ.error
      if (metricasQ.error) throw metricasQ.error

      const canais = canaisQ.data || []
      const ideias = ideiasQ.data || []
      const roteiros = roteirosQ.data || []
      const metricas = metricasQ.data || []

      const nomeCanal = new Map(canais.map((c) => [c.id, c.nome.replace(/^PULSO\s*/i, '')]))
      const canalDaIdeia = new Map(ideias.map((i) => [i.id, i.canal_id]))

      // views somadas por ideia (todas as redes) + conjunto de publicados
      const viewsIdeia = new Map<string, number>()
      const publicados = new Set<string>()
      for (const m of metricas) {
        if (!m.ideia_id) continue
        publicados.add(m.ideia_id)
        viewsIdeia.set(m.ideia_id, (viewsIdeia.get(m.ideia_id) || 0) + (m.views || 0))
      }

      // agrega por canal
      const matriz: DecisaoCanal[] = canais.map((c) => {
        const ideiasC = ideias.filter((i) => i.canal_id === c.id)
        const rotC = roteiros.filter((r) => r.canal_id === c.id)
        const pubC = ideiasC.filter((i) => publicados.has(i.id))
        const views = pubC.reduce((a, i) => a + (viewsIdeia.get(i.id) || 0), 0)
        const notas = rotC.map((r) => r.nota_hook).filter((n): n is number => typeof n === 'number')
        const roteirosProntos = rotC.filter((r) => r.status === 'APROVADO' && r.ideia_id && !publicados.has(r.ideia_id)).length
        return {
          canalId: c.id,
          nome: nomeCanal.get(c.id) || c.nome,
          ideias: ideiasC.length,
          roteirosProntos,
          publicados: pubC.length,
          views,
          mediaViews: pubC.length ? Math.round(views / pubC.length) : 0,
          notaHookMedia: notas.length ? Number((notas.reduce((a, b) => a + b, 0) / notas.length).toFixed(1)) : null,
          acao: 'testar',
        }
      })

      // ação por canal: relativa ao melhor mediaViews (só entre os que já têm publicação)
      const maxMedia = Math.max(1, ...matriz.filter((m) => m.publicados > 0).map((m) => m.mediaViews))
      for (const m of matriz) {
        if (m.publicados === 0) m.acao = 'testar'
        else if (m.mediaViews >= maxMedia * 0.6) m.acao = 'produzir'
        else if (m.mediaViews >= maxMedia * 0.3) m.acao = 'manter'
        else m.acao = 'segurar'
      }
      matriz.sort((a, b) => b.mediaViews - a.mediaViews || b.publicados - a.publicados)

      // FILA: roteiros APROVADO sem publicação, ranqueados por potencial
      // (nota de hook pesa primeiro; média do canal desempata). É o "o que publicar a seguir".
      const mediaPorCanal = new Map(matriz.map((m) => [m.canalId, m.mediaViews]))
      const fila: FilaItem[] = roteiros
        .filter((r) => r.status === 'APROVADO' && (!r.ideia_id || !publicados.has(r.ideia_id)))
        .map((r) => {
          const nh = typeof r.nota_hook === 'number' ? r.nota_hook : 3
          const mc = (r.canal_id && mediaPorCanal.get(r.canal_id)) || 0
          return {
            roteiroId: r.id,
            ideiaId: r.ideia_id,
            titulo: r.titulo || 'Sem título',
            canalNome: (r.canal_id && nomeCanal.get(r.canal_id)) || '—',
            notaHook: typeof r.nota_hook === 'number' ? r.nota_hook : null,
            potencial: nh * 100000 + mc,
          }
        })
        .sort((a, b) => b.potencial - a.potencial)

      return { canais: matriz, fila, totalPublicados: publicados.size }
    },
  })
}
