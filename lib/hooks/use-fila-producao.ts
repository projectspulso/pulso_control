import { useQuery } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase/client'

/**
 * FILA DE PRODUÇÃO — "produzir na sequência".
 * Rankeia o pipeline pelo que falta produzir, com os CANAIS VENCEDORES primeiro
 * (curiosidade/mistério/psicologia/estudos/casos reais) e, dentro do tier, o que
 * está mais perto de ficar pronto (render > áudio > roteiro). É o controle do app:
 * diz o próximo a produzir sem depender de ninguém pedir.
 *
 * Canal vem de ideias.canal_id → canais (metadata.canal_nome quase nunca está
 * preenchido). PRONTO_PUBLICACAO e PUBLICADO ficam de fora (não é "produzir").
 */

// Tiers de prioridade por canal (estratégia: vencedores primeiro, sazonal/Copa por último)
const TIER1 = ['curiosidade', 'mistério', 'misterio', 'psicologia', 'estudos', 'produtividade', 'casos reais', 'bizarr']
const TIER3 = ['do momento', 'momento', 'games', 'nostalgia']
function tierDoCanal(nome: string): number {
  const n = (nome || '').toLowerCase()
  if (TIER1.some((k) => n.includes(k))) return 1
  if (TIER3.some((k) => n.includes(k))) return 3
  return 2
}

export type EtapaProducao = 'roteiro' | 'audio' | 'render'

const PROXIMA: Record<string, { label: string; etapa: EtapaProducao } | undefined> = {
  AGUARDANDO_ROTEIRO: { label: 'Gerar roteiro', etapa: 'roteiro' },
  ROTEIRO_PRONTO: { label: 'Gerar áudio', etapa: 'audio' },
  AUDIO_GERADO: { label: 'Renderizar', etapa: 'render' },
  EM_EDICAO: { label: 'Finalizar render', etapa: 'render' },
}
// quanto menor, mais perto de pronto → produzir primeiro dentro do tier
const ORDEM_ETAPA: Record<EtapaProducao, number> = { render: 0, audio: 1, roteiro: 2 }

export interface FilaItem {
  pipelineId: string
  ideiaId: string | null
  numero: number | null
  titulo: string
  canal: string
  status: string
  acaoLabel: string
  etapa: EtapaProducao
  tier: number
}

export interface FilaProducaoSnapshot {
  fila: FilaItem[]
  porEtapa: { render: number; audio: number; roteiro: number }
  prontos: number // PRONTO_PUBLICACAO (estoque)
}

export function useFilaProducao() {
  return useQuery<FilaProducaoSnapshot>({
    queryKey: ['fila-producao'],
    refetchInterval: 5 * 60 * 1000,
    queryFn: async () => {
      const [pipeQ, ideiasQ, canaisQ] = await Promise.all([
        supabase.schema('pulso_content').from('pipeline_producao').select('id, ideia_id, status, metadata, prioridade'),
        supabase.schema('pulso_content').from('ideias').select('id, titulo, canal_id'),
        supabase.schema('pulso_core').from('canais').select('id, nome'),
      ])
      if (pipeQ.error) throw pipeQ.error
      if (ideiasQ.error) throw ideiasQ.error

      const tituloDe = new Map((ideiasQ.data || []).map((i) => [i.id, i.titulo as string]))
      const canalIdDe = new Map((ideiasQ.data || []).map((i) => [i.id, i.canal_id as string | null]))
      const nomeCanal = new Map((canaisQ.data || []).map((c) => [c.id, (c.nome as string).replace(/^PULSO\s*/i, '')]))

      const fila: FilaItem[] = []
      const porEtapa = { render: 0, audio: 0, roteiro: 0 }
      let prontos = 0
      for (const p of pipeQ.data || []) {
        if (p.status === 'PUBLICADO') continue
        if (p.status === 'PRONTO_PUBLICACAO') { prontos++; continue }
        const prox = PROXIMA[p.status]
        if (!prox) continue
        const canal = nomeCanal.get(canalIdDe.get(p.ideia_id) || '') || '—'
        porEtapa[prox.etapa]++
        fila.push({
          pipelineId: p.id,
          ideiaId: p.ideia_id,
          numero: (p.metadata?.numero as number) ?? null,
          titulo: tituloDe.get(p.ideia_id) || 'Sem título',
          canal,
          status: p.status,
          acaoLabel: prox.label,
          etapa: prox.etapa,
          tier: tierDoCanal(canal),
        })
      }
      fila.sort((a, b) =>
        a.tier - b.tier ||
        ORDEM_ETAPA[a.etapa] - ORDEM_ETAPA[b.etapa] ||
        (a.numero ?? 999) - (b.numero ?? 999),
      )
      return { fila, porEtapa, prontos }
    },
  })
}
