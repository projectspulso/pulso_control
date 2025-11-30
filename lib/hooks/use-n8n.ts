import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { n8nApi } from '../api/n8n'

/**
 * Lista workflows do n8n
 */
export function useN8nWorkflows() {
  return useQuery({
    queryKey: ['n8n', 'workflows'],
    queryFn: n8nApi.getWorkflows,
    staleTime: 5 * 60 * 1000 // Cache por 5 minutos
  })
}

/**
 * Lista execuções de um workflow específico
 */
export function useN8nExecutions(workflowId: string) {
  return useQuery({
    queryKey: ['n8n', 'executions', workflowId],
    queryFn: () => n8nApi.getExecutions(workflowId),
    enabled: !!workflowId,
    refetchInterval: 10 * 1000 // Atualiza a cada 10s
  })
}

/**
 * Hook para gerar roteiro (WF01 - Webhook)
 */
export function useGerarRoteiro() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (ideiaId: string) => n8nApi.workflows.gerarRoteiro(ideiaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roteiros'] })
      queryClient.invalidateQueries({ queryKey: ['ideias'] })
      queryClient.invalidateQueries({ queryKey: ['pipeline'] })
    }
  })
}

/**
 * Hook para gerar áudio (WF02 - Webhook)
 */
export function useGerarAudio() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (roteiroId: string) => n8nApi.workflows.gerarAudio(roteiroId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline'] })
      queryClient.invalidateQueries({ queryKey: ['roteiros'] })
    }
  })
}

/**
 * Hook para gerar ideias (WF00 - Manual trigger)
 */
export function useGerarIdeias() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ canalId, quantidade }: { canalId: string; quantidade?: number }) =>
      n8nApi.workflows.gerarIdeias(canalId, quantidade || 5),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ideias'] })
    }
  })
}

/**
 * Hook para agendar publicação
 */
export function useAgendarPublicacao() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ pipelineId, dataHora, plataformas }: { 
      pipelineId: string
      dataHora: string
      plataformas: string[] 
    }) =>
      n8nApi.workflows.agendarPublicacao(pipelineId, dataHora, plataformas),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline_producao'] })
      queryClient.invalidateQueries({ queryKey: ['calendario'] })
      queryClient.invalidateQueries({ queryKey: ['conteudos-prontos'] })
    }
  })
}

/**
 * Hook para publicar vários conteúdos agora
 */
export function usePublicarAgora() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ pipelineIds, plataformas }: { 
      pipelineIds: string[]
      plataformas: string[] 
    }) =>
      n8nApi.workflows.publicarAgora(pipelineIds, plataformas),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline_producao'] })
      queryClient.invalidateQueries({ queryKey: ['workflow_execucoes'] })
      queryClient.invalidateQueries({ queryKey: ['conteudos-prontos'] })
      queryClient.invalidateQueries({ queryKey: ['calendario'] })
    }
  })
}

/**
 * Hook para gerar ideias automaticamente
 */
export function useGerarIdeias() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ canalId, quantidade }: { canalId: string; quantidade?: number }) =>
      n8nApi.workflows.gerarIdeias(canalId, quantidade),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ideias'] })
      queryClient.invalidateQueries({ queryKey: ['workflow_execucoes'] })
    }
  })
}

