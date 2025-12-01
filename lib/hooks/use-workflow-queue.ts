import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

export interface WorkflowQueueItem {
  id: string
  workflow_name: string
  workflow_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  payload: any
  error_message?: string
  retry_count: number
  max_retries: number
  next_retry_at?: string
  created_at: string
  updated_at: string
  completed_at?: string
}

// Buscar itens da fila
export function useWorkflowQueue() {
  return useQuery({
    queryKey: ['workflow-queue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workflow_queue')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
      
      if (error) throw error
      return data as WorkflowQueueItem[]
    },
    refetchInterval: 30000, // Atualiza a cada 30s
  })
}

// Buscar itens pendentes (para retry)
export function usePendingWorkflows() {
  return useQuery({
    queryKey: ['workflow-queue-pending'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workflow_queue')
        .select('*')
        .in('status', ['pending', 'failed'])
        .order('created_at', { ascending: true })
      
      if (error) throw error
      
      // Filtrar items onde retry_count < max_retries
      const filtered = data?.filter(item => item.retry_count < item.max_retries) || []
      return filtered as WorkflowQueueItem[]
    },
  })
}

// Adicionar item à fila
export function useAddToQueue() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (item: Partial<WorkflowQueueItem>) => {
      const { data, error } = await supabase
        .from('workflow_queue')
        .insert({
          workflow_name: item.workflow_name,
          workflow_id: item.workflow_id,
          payload: item.payload,
          status: 'pending',
          retry_count: 0,
          max_retries: item.max_retries || 3,
        })
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-queue'] })
    },
  })
}

// Atualizar status do item
export function useUpdateQueueStatus() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      error_message 
    }: { 
      id: string
      status: WorkflowQueueItem['status']
      error_message?: string 
    }) => {
      const updates: any = {
        status,
        updated_at: new Date().toISOString(),
      }
      
      if (error_message) {
        updates.error_message = error_message
      }
      
      if (status === 'completed') {
        updates.completed_at = new Date().toISOString()
      }
      
      if (status === 'failed') {
        // Buscar retry_count atual
        const { data: currentItem } = await supabase
          .from('workflow_queue')
          .select('retry_count')
          .eq('id', id)
          .single()
        
        if (currentItem) {
          updates.retry_count = currentItem.retry_count + 1
        }
        
        // Próximo retry em 5 minutos
        const nextRetry = new Date()
        nextRetry.setMinutes(nextRetry.getMinutes() + 5)
        updates.next_retry_at = nextRetry.toISOString()
      }
      
      const { data, error } = await supabase
        .from('workflow_queue')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-queue'] })
      queryClient.invalidateQueries({ queryKey: ['workflow-queue-pending'] })
    },
  })
}

// Retry manual de um item
export function useRetryWorkflow() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('workflow_queue')
        .update({
          status: 'pending',
          next_retry_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-queue'] })
    },
  })
}

// Estatísticas da fila
export function useQueueStats() {
  return useQuery({
    queryKey: ['workflow-queue-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workflow_queue')
        .select('status')
      
      if (error) throw error
      
      const stats = {
        total: data.length,
        pending: data.filter(d => d.status === 'pending').length,
        processing: data.filter(d => d.status === 'processing').length,
        completed: data.filter(d => d.status === 'completed').length,
        failed: data.filter(d => d.status === 'failed').length,
      }
      
      return stats
    },
    refetchInterval: 30000,
  })
}
