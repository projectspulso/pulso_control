import { useQuery } from '@tanstack/react-query'
import { canaisApi, seriesApi } from '../api/core'

export function useCanais() {
  return useQuery({
    queryKey: ['canais'],
    queryFn: canaisApi.getAll
  })
}

export function useSeriesPorCanal(canalId: string | null) {
  return useQuery({
    queryKey: ['series', 'canal', canalId],
    queryFn: () => canalId ? seriesApi.getByCanal(canalId) : [],
    enabled: !!canalId
  })
}
