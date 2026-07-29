'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Tema } from '@/lib/decisor/temas'

/**
 * DECISOR — lê os fatos calculados no servidor (/api/decisor) + o último parecer do analista,
 * que vem do cache. A tela NUNCA dispara LLM sozinha; só o botão "reanalisar" e o cron fazem isso.
 */

export interface PostEmAlta {
  ideiaId: string
  titulo: string
  tema: Tema
  plataforma: string
  views: number
  idadeDias: number
  medianaNaIdade: number
  multiplo: number
}

export interface GanhoDia {
  dia: string
  total: number
  porRede: Record<string, number>
}

export interface Tendencia {
  janelaDias: number
  atual: number
  anterior: number
  variacao: number
  mediaDiaAtual: number
}

export interface DependenciaViral {
  concentracaoTop2: number
  piso: number
  pico: number
  dependente: boolean
}

export interface PerfilRede {
  plataforma: string
  views: number
  likes: number
  seguidores: number | null
  ganhoJanela: number | null
  diasJanela: number
  seguidorPorMilViews: number | null
  papel: 'motor de seguidor' | 'motor de view' | 'indefinido'
}

export interface CoberturaRede {
  plataforma: string
  fonte: 'api' | 'manual' | 'misto'
  registros: number
  registrosManuais: number
  ultimaColeta: string | null
  atrasoDias: number | null
  entrega: string[]
  naoEntrega: string[]
}

export interface DesempenhoTema {
  tema: Tema
  n: number
  medianaViews: number
  maxViews: number
  estouros: number
  papelFacebook: 'sorteia' | 'neutro' | 'morto'
  melhor: string | null
}

export interface FilaPorTema {
  total: number
  porTema: Array<{ tema: Tema; n: number; papelFacebook: 'sorteia' | 'neutro' | 'morto' }>
  emTemaMorto: number
  percentualMorto: number
  emTemaQueSorteia: number
}

export interface ItemParecer {
  tipo: 'fato' | 'tendencia' | 'hipotese' | 'caminho'
  texto: string
}

export interface Parecer {
  geradoEm: string
  leitura: string
  faca: string[]
  evite: string[]
  observe: string[]
  itens: ItemParecer[]
  modelo: string
}

export interface DecisorSnapshot {
  geradoEm: string
  janelaDias: number
  fatos: {
    radar: PostEmAlta[]
    ganhos: GanhoDia[]
    tendencia: Tendencia | null
    dependencia: DependenciaViral
    redes: PerfilRede[]
    temasFacebook: DesempenhoTema[]
    temasGeral: DesempenhoTema[]
    fila: FilaPorTema
    cobertura: CoberturaRede[]
    publicadosHoje: { videos: number; redes: string[] }
  }
  parecer: Parecer | null
}

export function useDecisor() {
  return useQuery<DecisorSnapshot>({
    queryKey: ['decisor'],
    refetchInterval: 10 * 60 * 1000,
    queryFn: async () => {
      const r = await fetch('/api/decisor', { cache: 'no-store' })
      if (!r.ok) throw new Error(`decisor ${r.status}`)
      const j = await r.json()
      if (!j.ok) throw new Error(j.error || 'falha ao calcular os fatos')
      return j as DecisorSnapshot
    },
  })
}

/** Reanalisar sob demanda — o único caminho da UI que gasta LLM, e só por clique do dono. */
export function useReanalisar() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const r = await fetch('/api/decisor/analisar', { method: 'POST' })
      const j = await r.json()
      if (!r.ok || !j.ok) throw new Error(j.error || 'falha ao analisar')
      return j.parecer as Parecer
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['decisor'] }),
  })
}
