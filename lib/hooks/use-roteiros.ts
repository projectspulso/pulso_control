import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { roteirosApi } from '../api/roteiros'
import { Database } from '../supabase/database.types'

type RoteiroInsert = Database['pulso_content']['Tables']['roteiros']['Insert']
type RoteiroUpdate = Database['pulso_content']['Tables']['roteiros']['Update']

export function useRoteiros() {
  return useQuery({
    queryKey: ['roteiros'],
    queryFn: roteirosApi.getAll
  })
}

export function useRoteiro(id: string | null) {
  return useQuery({
    queryKey: ['roteiros', id],
    queryFn: () => id ? roteirosApi.getById(id) : null,
    enabled: !!id
  })
}

export function useRoteirosPorIdeia(ideiaId: string | null) {
  return useQuery({
    queryKey: ['roteiros', 'ideia', ideiaId],
    queryFn: () => ideiaId ? roteirosApi.getByIdeiaId(ideiaId) : [],
    enabled: !!ideiaId
  })
}

export function useRoteirosStats() {
  return useQuery({
    queryKey: ['roteiros', 'stats'],
    queryFn: roteirosApi.getStats
  })
}

export function useCriarRoteiro() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (roteiro: RoteiroInsert) => roteirosApi.create(roteiro),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roteiros'] })
    }
  })
}

export function useAtualizarRoteiro() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: RoteiroUpdate }) => 
      roteirosApi.update(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['roteiros'] })
      queryClient.invalidateQueries({ queryKey: ['roteiros', data.id] })
    }
  })
}

export function useDeletarRoteiro() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => roteirosApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roteiros'] })
    }
  })
}
