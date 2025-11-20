import { useQuery } from '@tanstack/react-query'
import { workflowsApi } from '../api/workflows'

export function useWorkflows() {
  return useQuery({
    queryKey: ['workflows'],
    queryFn: workflowsApi.getAll
  })
}

export function useWorkflowExecucoes(workflowId?: string) {
  return useQuery({
    queryKey: ['workflow_execucoes', workflowId],
    queryFn: () => workflowsApi.getExecucoes(workflowId),
    refetchInterval: 10 * 1000 // Atualiza a cada 10s
  })
}

export function useWorkflowStats() {
  return useQuery({
    queryKey: ['workflows', 'stats'],
    queryFn: workflowsApi.getStats
  })
}
