import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

// Estados do pipeline de produção
export type StatusProducao = 
  | 'AGUARDANDO_ROTEIRO'
  | 'ROTEIRO_PRONTO'
  | 'AUDIO_GERADO'
  | 'EM_EDICAO'
  | 'PRONTO_PUBLICACAO'
  | 'PUBLICADO'

interface ConteudoProducao {
  id: string
  ideia_id: string
  roteiro_id: string | null
  audio_id: string | null
  video_id: string | null
  status: StatusProducao
  prioridade: number
  data_prevista: string | null
  data_publicacao: string | null
  responsavel: string | null
  observacoes: string | null
  created_at: string
  updated_at: string
  // Dados relacionados
  ideia?: any
  roteiro?: any
  canal?: any
}

// Buscar todos os conteúdos em produção
export function useConteudosProducao() {
  return useQuery({
    queryKey: ['conteudos-producao'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pipeline_producao')
        .select('*')
        .order('prioridade', { ascending: false })
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as ConteudoProducao[]
    },
  })
}

// Buscar conteúdos por status
export function useConteudosPorStatus(status: StatusProducao) {
  return useQuery({
    queryKey: ['conteudos-producao', status],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pipeline_producao')
        .select('*')
        .eq('status', status)
        .order('prioridade', { ascending: false })
      
      if (error) throw error
      return data as ConteudoProducao[]
    },
  })
}

// Buscar conteúdos agendados (para calendário)
export function useConteudosAgendados(mesInicio: Date, mesFim: Date) {
  return useQuery({
    queryKey: ['conteudos-agendados', mesInicio.toISOString(), mesFim.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pipeline_producao')
        .select('*')
        .gte('data_prevista', mesInicio.toISOString())
        .lte('data_prevista', mesFim.toISOString())
        .order('data_prevista', { ascending: true })
      
      if (error) throw error
      return data as ConteudoProducao[]
    },
  })
}

// Atualizar status no pipeline
export function useAtualizarStatusProducao() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, novoStatus }: { id: string; novoStatus: StatusProducao }) => {
      const { data, error } = await supabase
        .from('pipeline_producao')
        .update({ 
          status: novoStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conteudos-producao'] })
    },
  })
}

// Atualizar data prevista (drag no calendário)
export function useAtualizarDataPrevista() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, novaData }: { id: string; novaData: Date }) => {
      const { data, error } = await supabase
        .from('pipeline_producao')
        .update({ 
          data_prevista: novaData.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conteudos-agendados'] })
      queryClient.invalidateQueries({ queryKey: ['conteudos-producao'] })
    },
  })
}

// Criar novo item no pipeline
export function useCriarItemProducao() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (dados: Partial<ConteudoProducao>) => {
      const { data, error } = await supabase
        .from('pipeline_producao')
        .insert(dados)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conteudos-producao'] })
    },
  })
}

// Estatísticas do pipeline
export function useEstatisticasProducao() {
  return useQuery({
    queryKey: ['stats-producao'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pipeline_producao')
        .select('status')
      
      if (error) throw error
      
      const stats = {
        total: data.length,
        aguardando_roteiro: data.filter(d => d.status === 'AGUARDANDO_ROTEIRO').length,
        roteiro_pronto: data.filter(d => d.status === 'ROTEIRO_PRONTO').length,
        audio_gerado: data.filter(d => d.status === 'AUDIO_GERADO').length,
        em_edicao: data.filter(d => d.status === 'EM_EDICAO').length,
        pronto_publicacao: data.filter(d => d.status === 'PRONTO_PUBLICACAO').length,
        publicado: data.filter(d => d.status === 'PUBLICADO').length,
      }
      
      return stats
    },
  })
}
