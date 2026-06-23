import { useQuery } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase/client'

/**
 * AGENDA TRÍPLICE (planejamento reverso). A partir da grade semanal travada
 * (vw_agenda_semanal), gera slots DATADOS no horizonte e calcula as datas-limite
 * de cada etapa puxando pra trás da publicação:
 *   ideia até D-7 · roteiro até D-4 · produção (áudio/vídeo) até D-2 · publica em D.
 */
export const LEAD = { ideia: 7, roteiro: 4, producao: 2 }

export interface AgendaSlot {
  chave: string
  data: string // publicação (YYYY-MM-DD)
  diaSemana: number // 1=Seg..7=Dom
  horario: string
  faixa: string // sazonal | perene
  canalId: string | null
  canalNome: string
  ideiaAte: string // D-7
  roteiroAte: string // D-4
  producaoAte: string // D-2
}

export interface FunilCanal {
  canalId: string
  nome: string
  ideia: number // aprovada, sem roteiro
  roteiro: number // tem roteiro, sem áudio
  audio: number // tem áudio, sem vídeo publicado
  video: number // publicado / pronto
}

export interface AgendaSnapshot {
  slots: AgendaSlot[]
  canais: { id: string; nome: string }[]
  funil: FunilCanal[]
  totais: { ideia: number; roteiro: number; audio: number; video: number }
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
    refetchInterval: 10 * 60 * 1000,
    queryFn: async () => {
      const [gradeQ, canaisQ, ideiasQ, roteirosQ, audiosQ, metricasQ] = await Promise.all([
        supabase.from('vw_agenda_semanal').select('*').eq('ativo', true),
        supabase.schema('pulso_core').from('canais').select('id, nome').order('nome'),
        supabase.schema('pulso_content').from('ideias').select('id, canal_id, status'),
        supabase.schema('pulso_content').from('roteiros').select('ideia_id'),
        supabase.schema('pulso_content').from('audios').select('ideia_id'),
        supabase.schema('pulso_content').from('metricas_publicacao').select('ideia_id'),
      ])
      if (gradeQ.error) throw gradeQ.error
      if (canaisQ.error) throw canaisQ.error

      const grade = gradeQ.data || []
      const canais = canaisQ.data || []

      // gera slots datados a partir da grade semanal
      const hoje = new Date()
      hoje.setHours(0, 0, 0, 0)
      const slots: AgendaSlot[] = []
      for (let i = 0; i < horizonteDias; i++) {
        const d = new Date(hoje)
        d.setDate(hoje.getDate() + i)
        const wd = d.getDay() === 0 ? 7 : d.getDay() // 1=Seg..7=Dom
        const dataPub = iso(d)
        for (const g of grade.filter((x) => x.dia_semana === wd)) {
          slots.push({
            chave: `${dataPub}|${g.horario}|${g.canal_id}`,
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

      // FUNIL por canal (trilha de trabalho): cada ideia contada no estágio MAIS AVANÇADO
      // que alcançou — ideia → roteiro → áudio → vídeo (publicado).
      const nome = new Map(canais.map((c) => [c.id, c.nome.replace(/^PULSO\s*/i, '')]))
      const comRoteiro = new Set((roteirosQ.data || []).map((r) => r.ideia_id).filter(Boolean))
      const comAudio = new Set((audiosQ.data || []).map((a) => a.ideia_id).filter(Boolean))
      const publicado = new Set((metricasQ.data || []).map((m) => m.ideia_id).filter(Boolean))

      const funilMap = new Map<string, FunilCanal>()
      const garante = (id: string): FunilCanal => {
        if (!funilMap.has(id)) funilMap.set(id, { canalId: id, nome: nome.get(id) || '—', ideia: 0, roteiro: 0, audio: 0, video: 0 })
        return funilMap.get(id)!
      }
      const totais = { ideia: 0, roteiro: 0, audio: 0, video: 0 }
      for (const i of ideiasQ.data || []) {
        if (!i.canal_id) continue
        const f = garante(i.canal_id)
        if (publicado.has(i.id)) { f.video++; totais.video++ }
        else if (comAudio.has(i.id)) { f.audio++; totais.audio++ }
        else if (comRoteiro.has(i.id)) { f.roteiro++; totais.roteiro++ }
        else if (i.status === 'APROVADA') { f.ideia++; totais.ideia++ }
      }
      const funil = [...funilMap.values()]

      return { slots, canais, funil, totais }
    },
  })
}
