import { useQuery } from '@tanstack/react-query'
import { audiosApi } from '../api/audios'

export function useAudios() {
  return useQuery({
    queryKey: ['audios'],
    queryFn: audiosApi.getAll
  })
}

export function useAudio(id: string | null) {
  return useQuery({
    queryKey: ['audios', id],
    queryFn: () => id ? audiosApi.getById(id) : null,
    enabled: !!id
  })
}

export function useAudiosPorRoteiro(roteiroId: string | null) {
  return useQuery({
    queryKey: ['audios', 'roteiro', roteiroId],
    queryFn: () => roteiroId ? audiosApi.getByRoteiroId(roteiroId) : [],
    enabled: !!roteiroId
  })
}

export function useAudiosStats() {
  return useQuery({
    queryKey: ['audios', 'stats'],
    queryFn: audiosApi.getStats
  })
}
