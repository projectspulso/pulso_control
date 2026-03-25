import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { automationApi } from '../api/automation'
import type { AutomationTipo, AutomationStatus } from '../api/automation'

/**
 * Lista itens da fila de automação
 */
export function useAutomationQueue(filters?: {
  tipo?: AutomationTipo
  status?: AutomationStatus
  limit?: number
}) {
  return useQuery({
    queryKey: ['automation', 'queue', filters],
    queryFn: () => automationApi.getQueue(filters),
    refetchInterval: 10 * 1000,
  })
}

/**
 * Estatísticas da automação (últimos 7 dias)
 */
export function useAutomationStats() {
  return useQuery({
    queryKey: ['automation', 'stats'],
    queryFn: automationApi.getStats,
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  })
}

/**
 * Gerar ideias para um canal
 */
export function useGerarIdeias() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ canalId, quantidade }: { canalId: string; quantidade?: number }) =>
      automationApi.gerarIdeias(canalId, quantidade || 5),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation'] })
      queryClient.invalidateQueries({ queryKey: ['ideias'] })
    },
  })
}

/**
 * Aprovar ideia (trigger automático enfileira roteiro)
 */
export function useAprovarIdeia() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (ideiaId: string) => automationApi.aprovarIdeia(ideiaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ideias'] })
      queryClient.invalidateQueries({ queryKey: ['automation'] })
      queryClient.invalidateQueries({ queryKey: ['roteiros'] })
    },
  })
}

/**
 * Gerar roteiro manualmente
 */
export function useGerarRoteiro() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ ideiaId, canalId }: { ideiaId: string; canalId?: string }) =>
      automationApi.gerarRoteiro(ideiaId, canalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation'] })
      queryClient.invalidateQueries({ queryKey: ['roteiros'] })
      queryClient.invalidateQueries({ queryKey: ['pipeline'] })
    },
  })
}

/**
 * Aprovar roteiro (trigger automático enfileira áudio)
 */
export function useAprovarRoteiro() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (roteiroId: string) => automationApi.aprovarRoteiro(roteiroId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roteiros'] })
      queryClient.invalidateQueries({ queryKey: ['automation'] })
      queryClient.invalidateQueries({ queryKey: ['pipeline'] })
    },
  })
}

/**
 * Gerar áudio manualmente
 */
export function useGerarAudio() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ roteiroId, canalId }: { roteiroId: string; canalId?: string }) =>
      automationApi.gerarAudio(roteiroId, canalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation'] })
      queryClient.invalidateQueries({ queryKey: ['pipeline'] })
    },
  })
}

/**
 * Publicar conteúdos
 */
export function usePublicar() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ pipelineIds, plataformas }: { pipelineIds: string[]; plataformas: string[] }) =>
      automationApi.publicar(pipelineIds, plataformas),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation'] })
      queryClient.invalidateQueries({ queryKey: ['pipeline'] })
      queryClient.invalidateQueries({ queryKey: ['calendario'] })
    },
  })
}

/**
 * Cancelar item na fila
 */
export function useCancelarAutomation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => automationApi.cancelar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation'] })
    },
  })
}

/**
 * Retry manual
 */
export function useRetryAutomation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => automationApi.retry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation'] })
    },
  })
}
