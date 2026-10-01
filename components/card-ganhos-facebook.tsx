'use client'

import { useQuery } from '@tanstack/react-query'

import { Card } from '@/components/analytics-cards'
import type { GanhosFacebook } from '@/lib/automation/ganhos-facebook'
import { supabase } from '@/lib/supabase/client'

const usd = (v: number) => `US$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

/** O primeiro dinheiro: Estrelas do Facebook (coletado com a rede, configuracoes.ganhos_facebook). */
export function CardGanhosFacebook() {
  const { data: g } = useQuery({
    queryKey: ['ganhos-facebook'],
    staleTime: 30 * 60 * 1000,
    queryFn: async (): Promise<GanhosFacebook | null> => {
      const { data } = await supabase.schema('pulso_core').from('configuracoes').select('valor').eq('chave', 'ganhos_facebook').maybeSingle()
      if (!data?.valor) return null
      return typeof data.valor === 'string' ? JSON.parse(data.valor) : data.valor
    },
  })

  const desde = g?.estrelasLiberadasEm ?? '2026-10-01'
  const dias = (g?.historico ?? []).filter((d) => d.data >= desde)
  const totalDesde = dias.reduce((s, d) => s + d.aproximadoUsd + d.conteudoUsd, 0)
  const max = Math.max(...dias.map((d) => d.aproximadoUsd + d.conteudoUsd), 0.01)

  return (
    <Card
      titulo="Ganhos no Facebook"
      sub={`Estrelas liberadas em ${desde.split('-').reverse().join('/')}${g ? ` · atualizado ${new Date(g.atualizadoEm).toLocaleDateString('pt-BR')}` : ''}`}
      rodape={<>Cada Estrela vale US$ 0,01. A Meta não informa a contagem de Estrelas pela API — o valor é o ganho estimado que ela reporta, e hoje Estrelas é a única fonte liberada.</>}
    >
      {!g ? (
        <p className="text-sm text-[#6f6b7d]">Ainda sem leitura — entra na próxima coleta do Facebook (03h30, Brasília).</p>
      ) : (
        <div className="space-y-3 pt-1">
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
            <div>
              <p className="text-2xl font-semibold tabular-nums text-[#f5f4f8]">{usd(totalDesde)}</p>
              <p className="text-[11px] text-[#6f6b7d]">desde a liberação · ≈ {Math.round(totalDesde * 100).toLocaleString('pt-BR')} Estrelas</p>
            </div>
            <div>
              <p className="text-base font-medium tabular-nums text-[#a3a0b0]">{usd(g.ultimos7Usd)}</p>
              <p className="text-[11px] text-[#6f6b7d]">últimos 7 dias</p>
            </div>
          </div>
          {dias.length > 0 && (
            <div className="flex h-16 items-end gap-1">
              {dias.slice(-30).map((d) => {
                const v = d.aproximadoUsd + d.conteudoUsd
                return (
                  <div key={d.data} className="flex-1" title={`${d.data.split('-').reverse().join('/')}: ${usd(v)}`}>
                    <div className="rounded-sm bg-[#9085e9]" style={{ height: `${Math.max(2, (v / max) * 64)}px` }} />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
