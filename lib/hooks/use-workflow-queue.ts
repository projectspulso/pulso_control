import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase/client'
import { isMissingRelationError } from '@/lib/supabase/runtime-access'

type WorkflowQueueStatusDb = 'pendente' | 'processando' | 'falha' | 'sucesso'

interface WorkflowQueueRow {
  id: string
  workflow_name: string
  payload: unknown
  tentativas: number | null
  max_tentativas: number | null
  proximo_retry: string | null
  erro_ultimo: string | null
  status: WorkflowQueueStatusDb
  created_at: string
}

export interface WorkflowQueueItem {
  id: string
  workflow_name: string
  workflow_id?: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  payload: unknown
  error_message?: string
  retry_count: number
  max_retries: number
  next_retry_at?: string
  created_at: string
  updated_at: string
  completed_at?: string
}

function queueTable() {
  return supabase.schema('pulso_content').from('workflow_queue')
}

function getQueueMissingMessage() {
  return 'A tabela pulso_content.workflow_queue ainda nao existe no banco. Aplique a migration oficial do MVP antes de usar a fila.'
}

function throwQueueError(error: unknown): never {
  if (isMissingRelationError(error as { code?: string; message?: string } | null)) {
    throw new Error(getQueueMissingMessage())
  }

  throw error
}

function mapDbStatus(status: WorkflowQueueStatusDb): WorkflowQueueItem['status'] {
  const mapping: Record<WorkflowQueueStatusDb, WorkflowQueueItem['status']> = {
    pendente: 'pending',
    processando: 'processing',
    falha: 'failed',
    sucesso: 'completed',
  }

  return mapping[status]
}

function mapAppStatus(status: WorkflowQueueItem['status']): WorkflowQueueStatusDb {
  const mapping: Record<WorkflowQueueItem['status'], WorkflowQueueStatusDb> = {
    pending: 'pendente',
    processing: 'processando',
    failed: 'falha',
    completed: 'sucesso',
  }

  return mapping[status]
}

function mapQueueRow(row: WorkflowQueueRow): WorkflowQueueItem {
  return {
    id: row.id,
    workflow_name: row.workflow_name,
    status: mapDbStatus(row.status),
    payload: row.payload,
    error_message: row.erro_ultimo ?? undefined,
    retry_count: row.tentativas ?? 0,
    max_retries: row.max_tentativas ?? 3,
    next_retry_at: row.proximo_retry ?? undefined,
    created_at: row.created_at,
    updated_at: row.created_at,
    completed_at: row.status === 'sucesso' ? row.created_at : undefined,
  }
}

// Buscar itens da fila
export function useWorkflowQueue() {
  return useQuery({
    queryKey: ['workflow-queue'],
    queryFn: async () => {
      const { data, error } = await queueTable()
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        if (isMissingRelationError(error)) {
          return []
        }

        throw error
      }

      return (data ?? []).map((item) => mapQueueRow(item as WorkflowQueueRow))
    },
    refetchInterval: 30000,
  })
}

// Buscar itens pendentes para retry
export function usePendingWorkflows() {
  return useQuery({
    queryKey: ['workflow-queue-pending'],
    queryFn: async () => {
      const { data, error } = await queueTable()
        .select('*')
        .in('status', ['pendente', 'falha'])
        .order('created_at', { ascending: true })

      if (error) {
        if (isMissingRelationError(error)) {
          return []
        }

        throw error
      }

      return (data ?? [])
        .map((item) => mapQueueRow(item as WorkflowQueueRow))
        .filter((item) => item.retry_count < item.max_retries)
    },
  })
}

// Adicionar item a fila
export function useAddToQueue() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (item: Partial<WorkflowQueueItem>) => {
      const { data, error } = await queueTable()
        .insert({
          workflow_name: item.workflow_name,
          payload: item.payload,
          status: 'pendente',
          tentativas: 0,
          max_tentativas: item.max_retries || 3,
        })
        .select()
        .single()

      if (error) {
        throwQueueError(error)
      }

      return mapQueueRow(data as WorkflowQueueRow)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-queue'] })
      queryClient.invalidateQueries({ queryKey: ['workflow-queue-pending'] })
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
      error_message,
    }: {
      id: string
      status: WorkflowQueueItem['status']
      error_message?: string
    }) => {
      const updates: Record<string, unknown> = {
        status: mapAppStatus(status),
      }

      if (error_message) {
        updates.erro_ultimo = error_message
      }

      if (status === 'failed') {
        const { data: currentItem } = await queueTable()
          .select('tentativas')
          .eq('id', id)
          .single()

        const tentativasAtuais =
          currentItem && typeof currentItem.tentativas === 'number'
            ? currentItem.tentativas
            : 0

        updates.tentativas = tentativasAtuais + 1

        const nextRetry = new Date()
        nextRetry.setMinutes(nextRetry.getMinutes() + 5)
        updates.proximo_retry = nextRetry.toISOString()
      }

      if (status === 'completed') {
        updates.proximo_retry = null
      }

      if (status === 'pending') {
        updates.proximo_retry = new Date().toISOString()
      }

      const { data, error } = await queueTable()
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throwQueueError(error)
      }

      return mapQueueRow(data as WorkflowQueueRow)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-queue'] })
      queryClient.invalidateQueries({ queryKey: ['workflow-queue-pending'] })
    },
  })
}

// Retry manual
export function useRetryWorkflow() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await queueTable()
        .update({
          status: 'pendente',
          proximo_retry: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throwQueueError(error)
      }

      return mapQueueRow(data as WorkflowQueueRow)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-queue'] })
      queryClient.invalidateQueries({ queryKey: ['workflow-queue-pending'] })
    },
  })
}

// Estatisticas da fila
export function useQueueStats() {
  return useQuery({
    queryKey: ['workflow-queue-stats'],
    queryFn: async () => {
      const { data, error } = await queueTable().select('status')

      if (error) {
        if (isMissingRelationError(error)) {
          return {
            total: 0,
            pending: 0,
            processing: 0,
            completed: 0,
            failed: 0,
          }
        }

        throw error
      }

      const items = (data ?? []).map((item) =>
        mapDbStatus((item as { status: WorkflowQueueStatusDb }).status),
      )

      return {
        total: items.length,
        pending: items.filter((status) => status === 'pending').length,
        processing: items.filter((status) => status === 'processing').length,
        completed: items.filter((status) => status === 'completed').length,
        failed: items.filter((status) => status === 'failed').length,
      }
    },
    refetchInterval: 30000,
  })
}
