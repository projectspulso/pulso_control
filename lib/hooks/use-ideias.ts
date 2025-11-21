import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ideiasApi } from '../api/ideias'
import { Database } from '../supabase/database.types'

type IdeiaInsert = Database['pulso_content']['Tables']['ideias']['Insert']
type IdeiaUpdate = Database['pulso_content']['Tables']['ideias']['Update']
type IdeiaStatus = Database['pulso_content']['Tables']['ideias']['Row']['status']

// Hook para listar todas as ideias
export function useIdeias() {
  return useQuery({
    queryKey: ['ideias'],
    queryFn: ideiasApi.getAll
  })
}

// Hook para buscar ideia por ID
export function useIdeia(id: string | null) {
  return useQuery({
    queryKey: ['ideias', id],
    queryFn: () => id ? ideiasApi.getById(id) : null,
    enabled: !!id
  })
}

// Hook para ideias por status
export function useIdeiasPorStatus(status: IdeiaStatus) {
  return useQuery({
    queryKey: ['ideias', 'status', status],
    queryFn: () => ideiasApi.getByStatus(status)
  })
}

// Hook para stats
export function useIdeiasStats() {
  return useQuery({
    queryKey: ['ideias', 'stats'],
    queryFn: ideiasApi.getStats
  })
}

// Mutation para criar ideia
export function useCriarIdeia() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (ideia: IdeiaInsert) => ideiasApi.create(ideia),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ideias'] })
    }
  })
}

// Mutation para atualizar ideia
export function useAtualizarIdeia() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: IdeiaUpdate }) => 
      ideiasApi.update(id, updates),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['ideias'] })
      if (data?.id) {
        queryClient.invalidateQueries({ queryKey: ['ideias', data.id] })
      }
    }
  })
}

// Mutation para deletar ideia
export function useDeletarIdeia() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => ideiasApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ideias'] })
    }
  })
}
