import { useQuery } from '@tanstack/react-query'
import { metricasApi } from '../api/metricas'

export function useMetricasPorPost(postId: string | null) {
  return useQuery({
    queryKey: ['metricas', 'post', postId],
    queryFn: () => postId ? metricasApi.getByPost(postId) : [],
    enabled: !!postId
  })
}

export function useMetricasTotais() {
  return useQuery({
    queryKey: ['metricas', 'totais'],
    queryFn: metricasApi.getTotais
  })
}

export function useMetricasUltimos7Dias() {
  return useQuery({
    queryKey: ['metricas', 'ultimos7dias'],
    queryFn: metricasApi.getUltimos7Dias,
    refetchInterval: 5 * 60 * 1000 // Atualiza a cada 5 minutos
  })
}
