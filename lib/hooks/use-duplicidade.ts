'use client'

import { useQuery } from '@tanstack/react-query'
import type { ParSuspeito } from '@/lib/automation/vigia-duplicidade'

/**
 * O VIGIA na tela — só o que ainda dá pra impedir.
 *
 * A varredura não custa nada (frequência de token, zero IA), então roda pela rota a cada meia
 * hora em vez de virar cron. O que importa aqui não é o total de pares parecidos do acervo: é
 * quantos deles têm pelo menos um lado NÃO publicado — porque esses ainda podem ser barrados
 * antes de virarem vídeo repetido, que foi exatamente o que aconteceu com #175 e #165.
 */

export interface Duplicidade {
  analisados: number
  pares: ParSuspeito[]
  evitaveis: ParSuspeito[]
}

export function useDuplicidade() {
  return useQuery<Duplicidade | null>({
    queryKey: ['duplicidade'],
    staleTime: 30 * 60 * 1000,
    refetchInterval: 30 * 60 * 1000,
    queryFn: async () => {
      const r = await fetch('/api/duplicidade')
      if (!r.ok) return null
      const j = (await r.json()) as { ok?: boolean; analisados?: number; pares?: ParSuspeito[] }
      if (!j.ok) return null
      const pares = j.pares || []
      return { analisados: j.analisados ?? 0, pares, evitaveis: pares.filter((p) => p.evitavel) }
    },
  })
}
