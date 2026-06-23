import { useQuery } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase/client'

/**
 * AGENDA (calendário humano + trilha de trabalho). Lê a grade semanal travada
 * (vw_agenda_semanal), gera slots datados (planejamento reverso: ideia D-7,
 * roteiro D-4, produção D-2, publica D), traz as atribuições reais por slot
 * (vw_agenda_atribuicoes) e o estoque disponível por canal pra encaixar.
 */
export const LEAD = { ideia: 7, roteiro: 4, producao: 2 }

export interface AgendaSlot {
  chave: string
  data: string
  diaSemana: number
  horario: string
  faixa: string
  canalId: string | null
  canalNome: string
  ideiaAte: string
  roteiroAte: string
  producaoAte: string
}

export interface Atribuicao {
  ideiaId: string | null
  ideiaTitulo: string | null
  estagio: string // ideia|roteiro|audio|video|vazio
  status: string
}

export interface EstoqueItem {
  id: string
  titulo: string
  estagio: string
}

export interface FunilCanal {
  canalId: string
  nome: string
  ideia: number
  roteiro: number
  audio: number
  video: number
}

export interface AgendaSnapshot {
  slots: AgendaSlot[]
  canais: { id: string; nome: string }[]
  funil: FunilCanal[]
  totais: { ideia: number; roteiro: number; audio: number; video: number }
  atribuicoes: Record<string, Atribuicao> // chave 'data|horario'
  estoqueDisponivel: Record<string, EstoqueItem[]> // canalId -> itens não publicados
}

function iso(d: Date) {
  return d.toISOString().slice(0, 10)
}
function addDias(base: Date, n: number) {
  const d = new Date(base)
  d.setDate(base.getDate() + n)
  return iso(d)
}

export function useAgenda(horizonteDias = 21) {
  return useQuery<AgendaSnapshot>({
    queryKey: ['agenda', horizonteDias],
    refetchInterval: 5 * 60 * 1000,
    queryFn: async () => {
      const [gradeQ, canaisQ, ideiasQ, roteirosQ, audiosQ, metricasQ, pipeQ, atribQ] = await Promise.all([
        supabase.from('vw_agenda_semanal').select('*').eq('ativo', true),
        supabase.schema('pulso_core').from('canais').select('id, nome').order('nome'),
        supabase.schema('pulso_content').from('ideias').select('id, canal_id, status, titulo'),
        supabase.schema('pulso_content').from('roteiros').select('ideia_id'),
        supabase.schema('pulso_content').from('audios').select('ideia_id'),
        supabase.schema('pulso_content').from('metricas_publicacao').select('ideia_id'),
        supabase.schema('pulso_content').from('pipeline_producao').select('ideia_id, status'),
        supabase.from('vw_agenda_atribuicoes').select('*'),
      ])
      if (gradeQ.error) throw gradeQ.error
      if (canaisQ.error) throw canaisQ.error

      const grade = gradeQ.data || []
      const canais = canaisQ.data || []
      const nome = new Map(canais.map((c) => [c.id, c.nome.replace(/^PULSO\s*/i, '')]))

      // slots datados
      const hoje = new Date()
      hoje.setHours(0, 0, 0, 0)
      const slots: AgendaSlot[] = []
      for (let i = 0; i < horizonteDias; i++) {
        const d = new Date(hoje)
        d.setDate(hoje.getDate() + i)
        const wd = d.getDay() === 0 ? 7 : d.getDay()
        const dataPub = iso(d)
        for (const g of grade.filter((x) => x.dia_semana === wd)) {
          slots.push({
            chave: `${dataPub}|${g.horario}`,
            data: dataPub,
            diaSemana: wd,
            horario: g.horario,
            faixa: g.faixa,
            canalId: g.canal_id,
            canalNome: (g.canal_nome || '—').replace(/^PULSO\s*/i, ''),
            ideiaAte: addDias(d, -LEAD.ideia),
            roteiroAte: addDias(d, -LEAD.roteiro),
            producaoAte: addDias(d, -LEAD.producao),
          })
        }
      }

      // estágio por ideia (furthest)
      const comRoteiro = new Set((roteirosQ.data || []).map((r) => r.ideia_id).filter(Boolean))
      const comAudio = new Set((audiosQ.data || []).map((a) => a.ideia_id).filter(Boolean))
      const publicado = new Set((metricasQ.data || []).map((m) => m.ideia_id).filter(Boolean))
      const videoPronto = new Set((pipeQ.data || []).filter((p) => p.status === 'PRONTO_PUBLICACAO').map((p) => p.ideia_id).filter(Boolean))

      const estagioDe = (id: string, status: string): string | null => {
        if (publicado.has(id)) return 'publicado'
        if (videoPronto.has(id)) return 'video'
        if (comAudio.has(id)) return 'audio'
        if (comRoteiro.has(id)) return 'roteiro'
        if (status === 'APROVADA') return 'ideia'
        return null
      }

      // funil + estoque disponível por canal
      const funilMap = new Map<string, FunilCanal>()
      const garante = (id: string): FunilCanal => {
        if (!funilMap.has(id)) funilMap.set(id, { canalId: id, nome: nome.get(id) || '—', ideia: 0, roteiro: 0, audio: 0, video: 0 })
        return funilMap.get(id)!
      }
      const totais = { ideia: 0, roteiro: 0, audio: 0, video: 0 }
      const estoqueDisponivel: Record<string, EstoqueItem[]> = {}
      for (const i of ideiasQ.data || []) {
        if (!i.canal_id) continue
        const est = estagioDe(i.id, i.status)
        if (!est) continue
        if (est === 'publicado') continue // já foi
        const f = garante(i.canal_id)
        if (est === 'video') { f.video++; totais.video++ }
        else if (est === 'audio') { f.audio++; totais.audio++ }
        else if (est === 'roteiro') { f.roteiro++; totais.roteiro++ }
        else if (est === 'ideia') { f.ideia++; totais.ideia++ }
        if (!estoqueDisponivel[i.canal_id]) estoqueDisponivel[i.canal_id] = []
        estoqueDisponivel[i.canal_id].push({ id: i.id, titulo: i.titulo, estagio: est })
      }
      const RANK: Record<string, number> = { video: 4, audio: 3, roteiro: 2, ideia: 1 }
      for (const arr of Object.values(estoqueDisponivel)) arr.sort((a, b) => (RANK[b.estagio] || 0) - (RANK[a.estagio] || 0))
      const funil = [...funilMap.values()]

      // atribuições por slot
      const atribuicoes: Record<string, Atribuicao> = {}
      for (const a of atribQ.data || []) {
        atribuicoes[`${a.data}|${a.horario}`] = {
          ideiaId: a.ideia_id,
          ideiaTitulo: a.ideia_titulo,
          estagio: a.estagio || 'vazio',
          status: a.status,
        }
      }

      return { slots, canais, funil, totais, atribuicoes, estoqueDisponivel }
    },
  })
}
