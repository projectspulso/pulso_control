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
 * Hook para gerar roteiro
 */
export function useGerarRoteiro() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ ideiaId, prompt }: { ideiaId: string; prompt?: string }) =>
      n8nApi.workflows.gerarRoteiro(ideiaId, prompt),
    onSuccess: () => {
      // Invalida cache de roteiros e ideias
      queryClient.invalidateQueries({ queryKey: ['roteiros'] })
      queryClient.invalidateQueries({ queryKey: ['ideias'] })
      queryClient.invalidateQueries({ queryKey: ['workflow_execucoes'] })
    }
  })
}

/**
 * Hook para gerar áudio
 */
export function useGerarAudio() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ roteiroId, vozId }: { roteiroId: string; vozId?: string }) =>
      n8nApi.workflows.gerarAudio(roteiroId, vozId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline_producao'] })
      queryClient.invalidateQueries({ queryKey: ['workflow_execucoes'] })
    }
  })
}

/**
 * Hook para gerar vídeo
 */
export function useGerarVideo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ audioId, template }: { audioId: string; template?: string }) =>
      n8nApi.workflows.gerarVideo(audioId, template),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline_producao'] })
      queryClient.invalidateQueries({ queryKey: ['workflow_execucoes'] })
    }
  })
}

/**
 * Hook para publicar conteúdo
 */
export function usePublicarConteudo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ conteudoId, plataforma }: { conteudoId: string; plataforma: string }) =>
      n8nApi.workflows.publicarConteudo(conteudoId, plataforma),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline_producao'] })
      queryClient.invalidateQueries({ queryKey: ['workflow_execucoes'] })
    }
  })
}
