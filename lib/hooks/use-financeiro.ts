import { useQuery } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase/client'

export interface Lancamento {
  id: string
  servico: string
  creditos: number | null
  brl: number
  descricao: string
  data: string
}

export interface Travas {
  teto_creditos_higgsfield_dia: number
  teto_brl_mes: number
  max_videos_dia: number
  max_cenas_novas_por_video: number
  min_clips_banco_por_video: number
  credito_brl: number
  modelo_padrao: string
}

export interface FinanceiroData {
  lancamentos: Lancamento[]
  travas: Travas | null
  saldoHiggsfield: { creditos: number; snapshot_em: string } | null
  clipsNoBanco: number
  gastoHojeBRL: number
  gastoHojeCreditos: number
  gastoMesBRL: number
  gastoPorServico: { servico: string; brl: number }[]
}

export function useFinanceiro() {
  return useQuery<FinanceiroData>({
    queryKey: ['financeiro'],
    refetchInterval: 5 * 60 * 1000,
    queryFn: async () => {
      const [logsQ, cfgRes, clipsQ] = await Promise.all([
        supabase
          .schema('pulso_content')
          .from('logs_workflows')
          .select('id, detalhes, created_at')
          .eq('workflow_name', 'GASTO_SERVICO')
          .order('created_at', { ascending: false }),
        // configuracoes tem RLS — leitura via rota server (service role)
        fetch('/api/automation/financeiro-config').then((r) => r.json()),
        supabase.schema('pulso_content').from('videos').select('id', { count: 'exact', head: true }).eq('tipo', 'CLIP_CENA'),
      ])
      if (logsQ.error) throw logsQ.error

      const lancamentos: Lancamento[] = (logsQ.data || []).map((l) => {
        const d = (l.detalhes || {}) as Record<string, unknown>
        return {
          id: l.id,
          servico: String(d.servico || '?'),
          creditos: (d.creditos as number) ?? null,
          brl: Number(d.brl || 0),
          descricao: String(d.descricao || ''),
          data: String(d.data || l.created_at?.slice(0, 10) || ''),
        }
      })

      const travas = (cfgRes?.travas as Travas) ?? null
      const saldoHiggsfield = cfgRes?.saldoHiggsfield ?? null

      const hoje = new Date().toISOString().slice(0, 10)
      const mes = hoje.slice(0, 7)
      const gastoHojeBRL = lancamentos.filter((l) => l.data === hoje).reduce((a, l) => a + l.brl, 0)
      const gastoHojeCreditos = lancamentos
        .filter((l) => l.data === hoje && l.servico === 'higgsfield')
        .reduce((a, l) => a + (l.creditos || 0), 0)
      const gastoMesBRL = lancamentos.filter((l) => l.data.startsWith(mes)).reduce((a, l) => a + l.brl, 0)

      const porServico = new Map<string, number>()
      for (const l of lancamentos) {
        if (!l.data.startsWith(mes)) continue
        porServico.set(l.servico, (porServico.get(l.servico) || 0) + l.brl)
      }

      return {
        lancamentos,
        travas,
        saldoHiggsfield,
        clipsNoBanco: clipsQ.count || 0,
        gastoHojeBRL,
        gastoHojeCreditos,
        gastoMesBRL,
        gastoPorServico: [...porServico.entries()]
          .map(([servico, brl]) => ({ servico, brl }))
          .sort((a, b) => b.brl - a.brl),
      }
    },
  })
}
