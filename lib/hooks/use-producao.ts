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

export interface ConteudoProducao {
  // IDs
  pipeline_id: string
  ideia_id: string
  roteiro_id: string | null
  canal_id: string
  serie_id: string
  
  // Nomes/Títulos
  canal: string
  serie: string
  ideia: string
  
  // Status
  pipeline_status: StatusProducao
  ideia_status: string
  roteiro_status: string | null
  
  // Flags
  is_piloto: boolean
  
  // Datas
  data_prevista: string | null
  data_publicacao_planejada: string | null
  hora_publicacao: string | null
  
  // Prioridade e metadata
  prioridade: number
  metadata: any
}

// Buscar todos os conteúdos em produção (para Kanban) - usando view V2
export function useConteudosProducao() {
  return useQuery({
    queryKey: ['conteudos-producao'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vw_pulso_calendario_publicacao_v2')
        .select('*')
      
      if (error) {
        console.error('Erro ao buscar pipeline:', error)
        throw error
      }
      
      return data as ConteudoProducao[]
    },
  })
}

// Buscar conteúdos por status (para Kanban) - usando view V2
export function useConteudosPorStatus(status: StatusProducao) {
  return useQuery({
    queryKey: ['conteudos-producao', status],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vw_pulso_calendario_publicacao_v2')
        .select('*')
        .eq('pipeline_status', status)
      
      if (error) throw error
      return data as ConteudoProducao[]
    },
  })
}

// Buscar conteúdos agendados (para calendário) - usando view V2
export function useConteudosAgendados(mesInicio: Date, mesFim: Date) {
  return useQuery({
    queryKey: ['conteudos-agendados', mesInicio.toISOString(), mesFim.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vw_pulso_calendario_publicacao_v2')
        .select('*')
        .gte('data_publicacao_planejada', mesInicio.toISOString())
        .lte('data_publicacao_planejada', mesFim.toISOString())
      
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
      queryClient.invalidateQueries({ queryKey: ['conteudos-agendados'] })
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

// Estatísticas do pipeline - usando view V2
export function useEstatisticasProducao() {
  return useQuery({
    queryKey: ['stats-producao'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vw_pulso_calendario_publicacao_v2')
        .select('pipeline_status')
      
      if (error) throw error
      
      const stats = {
        total: data.length,
        aguardando_roteiro: data.filter(d => d.pipeline_status === 'AGUARDANDO_ROTEIRO').length,
        roteiro_pronto: data.filter(d => d.pipeline_status === 'ROTEIRO_PRONTO').length,
        audio_gerado: data.filter(d => d.pipeline_status === 'AUDIO_GERADO').length,
        em_edicao: data.filter(d => d.pipeline_status === 'EM_EDICAO').length,
        pronto_publicacao: data.filter(d => d.pipeline_status === 'PRONTO_PUBLICACAO').length,
        publicado: data.filter(d => d.pipeline_status === 'PUBLICADO').length,
      }
      
      return stats
    },
  })
}
