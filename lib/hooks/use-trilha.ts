'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

/**
 * TRILHA DE MELHORIAS — o loop de aprendizado de produto/operação.
 * Cada melhoria é um experimento: hipótese → o que muda → métrica → resultado.
 * Fonte: pulso_core.configuracoes chave='trilha_melhorias' (editável sem deploy).
 */

export type StatusExp = 'proximo' | 'rodando' | 'aprendido'

export interface Experimento {
  id: string
  titulo: string
  cat: string
  prioridade: number
  status: StatusExp
  hipotese: string
  muda: string
  metrica: string
  resultado: string | null
}

export const COLUNAS: { status: StatusExp; label: string; emoji: string }[] = [
  { status: 'proximo', label: 'Próximo', emoji: '🎯' },
  { status: 'rodando', label: 'Rodando', emoji: '🔄' },
  { status: 'aprendido', label: 'Aprendido', emoji: '✅' },
]

export function useTrilha() {
  return useQuery<Experimento[]>({
    queryKey: ['trilha-melhorias'],
    refetchInterval: 10 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .schema('pulso_core')
        .from('configuracoes')
        .select('valor')
        .eq('chave', 'trilha_melhorias')
        .maybeSingle()
      if (!data?.valor) return []
      try {
        const arr = typeof data.valor === 'string' ? JSON.parse(data.valor) : data.valor
        return (arr as Experimento[]).sort((a, b) => a.prioridade - b.prioridade)
      } catch {
        return []
      }
    },
  })
}
