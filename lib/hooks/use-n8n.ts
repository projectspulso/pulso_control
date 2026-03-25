/**
 * Hooks legados de n8n — redirecionados para automação AI-native.
 * Mantém a mesma interface pública para compatibilidade do frontend.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { automationApi } from '../api/automation'

/**
 * @deprecated Use useAutomationQueue de use-automation.ts
 */
export function useN8nWorkflows() {
  return { data: [], isLoading: false, error: null, refetch: () => Promise.resolve({ data: [], error: null, isError: false, isLoading: false, isSuccess: true, status: 'success' as const }) }
}

/**
 * @deprecated Use useAutomationQueue de use-automation.ts
 */
export function useN8nExecutions(_workflowId: string) {
  return { data: [], isLoading: false, error: null, refetch: () => Promise.resolve({ data: [], error: null, isError: false, isLoading: false, isSuccess: true, status: 'success' as const }) }
}

export function useGerarRoteiro() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ideiaId: string) => automationApi.aprovarIdeia(ideiaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roteiros'] })
      queryClient.invalidateQueries({ queryKey: ['ideias'] })
      queryClient.invalidateQueries({ queryKey: ['pipeline'] })
      queryClient.invalidateQueries({ queryKey: ['automation-queue'] })
    }
  })
}

export function useGerarAudio() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (roteiroId: string) => automationApi.aprovarRoteiro(roteiroId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline'] })
      queryClient.invalidateQueries({ queryKey: ['roteiros'] })
      queryClient.invalidateQueries({ queryKey: ['automation-queue'] })
    }
  })
}

export function useGerarIdeiasManual() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ canalId, quantidade }: { canalId: string; quantidade?: number }) =>
      automationApi.triggerGerarIdeias(canalId, quantidade || 5),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ideias'] })
      queryClient.invalidateQueries({ queryKey: ['automation-queue'] })
    }
  })
}

export function useAgendarPublicacao() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ pipelineId }: {
      pipelineId: string
      dataHora: string
      plataformas: string[]
    }) =>
      automationApi.triggerPublicar(pipelineId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline_producao'] })
      queryClient.invalidateQueries({ queryKey: ['calendario'] })
      queryClient.invalidateQueries({ queryKey: ['automation-queue'] })
    }
  })
}

export function usePublicarAgora() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ pipelineIds }: {
      pipelineIds: string[]
      plataformas: string[]
    }) =>
      Promise.all(pipelineIds.map(id => automationApi.triggerPublicar(id))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline_producao'] })
      queryClient.invalidateQueries({ queryKey: ['automation-queue'] })
    }
  })
}

export function useGerarIdeias() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ canalId, quantidade }: { canalId: string; quantidade?: number }) =>
      automationApi.triggerGerarIdeias(canalId, quantidade),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ideias'] })
      queryClient.invalidateQueries({ queryKey: ['automation-queue'] })
    }
  })
}
