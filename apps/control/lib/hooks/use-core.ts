import { useQuery } from '@tanstack/react-query'
import { canaisApi, seriesApi, plataformasApi, tagsApi } from '../api/core'

export function useCanais() {
  return useQuery({
    queryKey: ['canais'],
    queryFn: canaisApi.getAll
  })
}

export function useCanal(id: string | null) {
  return useQuery({
    queryKey: ['canais', id],
    queryFn: () => id ? canaisApi.getById(id) : null,
    enabled: !!id
  })
}

export function useSeries() {
  return useQuery({
    queryKey: ['series'],
    queryFn: seriesApi.getAll
  })
}

export function useSeriesPorCanal(canalId: string | null) {
  return useQuery({
    queryKey: ['series', 'canal', canalId],
    queryFn: () => canalId ? seriesApi.getByCanal(canalId) : [],
    enabled: !!canalId
  })
}

export function usePlataformas() {
  return useQuery({
    queryKey: ['plataformas'],
    queryFn: plataformasApi.getAll
  })
}

export function useTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: tagsApi.getAll
  })
}
