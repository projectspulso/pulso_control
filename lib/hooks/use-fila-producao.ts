import { useQuery } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase/client'

/**
 * FILA DE PRODUÇÃO — "produzir na sequência", ORIENTADA À DEMANDA DA AGENDA.
 *
 * A ordem reflete o que a agenda precisa, não só a estratégia:
 *   1) DÉFICIT do canal = (slots perenes nos próximos N dias) − (estoque PRONTO do canal).
 *      Canal mais deficitário primeiro — é o que vai furar a agenda.
 *   2) ETAPA: o mais perto de pronto antes (render > áudio > roteiro) — termina o começado.
 *   3) TIER (vencedor) como desempate; depois nº.
 *
 * Itens cujo canal já tem estoque suficiente (déficit 0) caem pro fim — não adianta
 * produzir o que não vai ter slot. Canal vem de ideias.canal_id → canais.
 * PRONTO_PUBLICACAO e PUBLICADO ficam de fora da fila (não é "produzir").
 */

const TIER1 = ['curiosidade', 'mistério', 'misterio', 'psicologia', 'estudos', 'produtividade', 'casos reais', 'bizarr']
const TIER3 = ['do momento', 'momento', 'games', 'nostalgia']
function tierDoCanal(nome: string): number {
  const n = (nome || '').toLowerCase()
  if (TIER1.some((k) => n.includes(k))) return 1
  if (TIER3.some((k) => n.includes(k))) return 3
  return 2
}
function normCanal(nome: string): string {
  return (nome || '').replace(/^PULSO\s*/i, '').trim().toLowerCase()
}

export type EtapaProducao = 'roteiro' | 'audio' | 'render'

const PROXIMA: Record<string, { label: string; etapa: EtapaProducao } | undefined> = {
  AGUARDANDO_ROTEIRO: { label: 'Gerar roteiro', etapa: 'roteiro' },
  ROTEIRO_PRONTO: { label: 'Gerar áudio', etapa: 'audio' },
  AUDIO_GERADO: { label: 'Renderizar', etapa: 'render' },
  EM_EDICAO: { label: 'Finalizar render', etapa: 'render' },
}
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
  deficit: number // quanto o canal deste item está devendo à agenda
  semCenas: boolean // AUDIO_GERADO sem cenas → worker travaria
}

export interface DeficitCanal {
  canal: string
  demanda: number // slots perenes nos próximos N dias
  estoque: number // PRONTO do canal
  deficit: number // max(0, demanda - estoque)
}

export interface FilaProducaoSnapshot {
  fila: FilaItem[]
  porEtapa: { render: number; audio: number; roteiro: number }
  prontos: number
  rebaixadosOcultos: number // canais rebaixados (Copa/games) fora da fila
  deficits: DeficitCanal[] // o que a agenda precisa, por canal (deficit desc)
  horizonteDias: number
}

export function useFilaProducao(horizonteDias = 20) {
  return useQuery<FilaProducaoSnapshot>({
    queryKey: ['fila-producao', horizonteDias],
    refetchInterval: 5 * 60 * 1000,
    queryFn: async () => {
      const [pipeQ, ideiasQ, canaisQ, gradeQ] = await Promise.all([
        supabase.schema('pulso_content').from('pipeline_producao').select('id, ideia_id, status, metadata'),
        supabase.schema('pulso_content').from('ideias').select('id, titulo, canal_id'),
        supabase.schema('pulso_core').from('canais').select('id, nome'),
        supabase.from('vw_agenda_semanal').select('dia_semana, faixa, canal_nome').eq('ativo', true),
      ])
      if (pipeQ.error) throw pipeQ.error
      if (ideiasQ.error) throw ideiasQ.error

      const tituloDe = new Map((ideiasQ.data || []).map((i) => [i.id, i.titulo as string]))
      const canalIdDe = new Map((ideiasQ.data || []).map((i) => [i.id, i.canal_id as string | null]))
      const nomeCanal = new Map((canaisQ.data || []).map((c) => [c.id, (c.nome as string).replace(/^PULSO\s*/i, '')]))
      const canalDoItem = (ideiaId: string | null) => nomeCanal.get(canalIdDe.get(ideiaId || '') || '') || '—'

      // DEMANDA: slots perenes por canal nos próximos N dias (a grade rebaixa sazonal/"do Momento")
      const demandaPorCanal = new Map<string, number>()
      const hoje = new Date(); hoje.setHours(0, 0, 0, 0)
      const grade = (gradeQ.data || []).filter((g) => g.faixa === 'perene')
      for (let i = 0; i < horizonteDias; i++) {
        const d = new Date(hoje); d.setDate(hoje.getDate() + i)
        const wd = d.getDay() === 0 ? 7 : d.getDay()
        for (const g of grade) {
          if (g.dia_semana !== wd) continue
          const c = normCanal(g.canal_nome || '')
          demandaPorCanal.set(c, (demandaPorCanal.get(c) || 0) + 1)
        }
      }

      // ESTOQUE PRONTO por canal
      const estoquePorCanal = new Map<string, number>()
      for (const p of pipeQ.data || []) {
        if (p.status !== 'PRONTO_PUBLICACAO') continue
        const c = normCanal(canalDoItem(p.ideia_id))
        estoquePorCanal.set(c, (estoquePorCanal.get(c) || 0) + 1)
      }

      // DÉFICIT por canal
      const canaisTodos = new Set<string>([...demandaPorCanal.keys(), ...estoquePorCanal.keys()])
      const deficitDe = new Map<string, number>()
      const deficits: DeficitCanal[] = []
      for (const c of canaisTodos) {
        const demanda = demandaPorCanal.get(c) || 0
        const estoque = estoquePorCanal.get(c) || 0
        const deficit = Math.max(0, demanda - estoque)
        deficitDe.set(c, deficit)
        if (demanda > 0) deficits.push({ canal: c, demanda, estoque, deficit })
      }
      deficits.sort((a, b) => b.deficit - a.deficit || b.demanda - a.demanda)

      // FILA — só o que é PRA produzir: exclui rebaixados (Copa/games) e já publicados/prontos
      const fila: FilaItem[] = []
      const porEtapa = { render: 0, audio: 0, roteiro: 0 }
      let prontos = 0
      let rebaixadosOcultos = 0
      for (const p of pipeQ.data || []) {
        if (p.status === 'PUBLICADO') continue
        if (p.status === 'PRONTO_PUBLICACAO') { prontos++; continue }
        const prox = PROXIMA[p.status]
        if (!prox) continue
        const canal = canalDoItem(p.ideia_id)
        if (tierDoCanal(canal) === 3) { rebaixadosOcultos++; continue } // não entram na fila (não vão sair)
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
          deficit: deficitDe.get(normCanal(canal)) || 0,
          semCenas: p.status === 'AUDIO_GERADO' && !p.metadata?.cenas,
        })
      }
      // ordem: déficit do canal desc → etapa (render antes) → tier → nº
      fila.sort((a, b) =>
        b.deficit - a.deficit ||
        ORDEM_ETAPA[a.etapa] - ORDEM_ETAPA[b.etapa] ||
        a.tier - b.tier ||
        (a.numero ?? 999) - (b.numero ?? 999),
      )
      return { fila, porEtapa, prontos, rebaixadosOcultos, deficits, horizonteDias }
    },
  })
}
