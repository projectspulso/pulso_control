import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as producaoAPI from '@/lib/api/producao'

// Estados do pipeline de produção
export type StatusProducao = 
  | 'AGUARDANDO_ROTEIRO'
  | 'ROTEIRO_PRONTO'
  | 'AUDIO_GERADO'
  | 'EM_EDICAO'
  | 'PRONTO_PUBLICACAO'
  | 'PUBLICADO'

export interface ConteudoProducao {
  // IDs
  pipeline_id: string
  ideia_id: string
  roteiro_id: string | null
  
  // Nomes/Títulos
  canal: string
  serie: string
  ideia: string
  roteiro: string | null
  
  // Status
  pipeline_status: string
  ideia_status: string
  roteiro_status: string | null
  
  // Flags
  is_piloto: boolean
  
  // Datas
  data_prevista: string | null
  data_publicacao_planejada: string | null
  
  // Prioridade e metadata
  prioridade: number
  metadata: any
}

// Buscar todos os conteúdos em produção (para Kanban)
export function useConteudosProducao() {
  return useQuery({
    queryKey: ['conteudos-producao'],
    queryFn: () => producaoAPI.getAll(),
  })
}

// Buscar conteúdos por status (para Kanban)
export function useConteudosPorStatus(status: StatusProducao) {
  return useQuery({
    queryKey: ['conteudos-producao', status],
    queryFn: () => producaoAPI.getByStatus(status),
  })
}

// Atualizar status no pipeline
export function useAtualizarStatusProducao() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, novoStatus }: { id: string; novoStatus: StatusProducao }) => 
      producaoAPI.updateStatus(id, novoStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conteudos-producao'] })
    },
  })
}

// Atualizar data prevista (drag no calendário)
export function useAtualizarDataPrevista() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, novaData }: { id: string; novaData: Date }) => 
      producaoAPI.updateDataPrevista(id, novaData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conteudos-producao'] })
    },
  })
}

// Estatísticas do pipeline
export function useEstatisticasProducao() {
  return useQuery({
    queryKey: ['stats-producao'],
    queryFn: () => producaoAPI.getStats(),
  })
}
