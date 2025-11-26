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
  audio_id: string | null
  video_id: string | null
  canal_id: string
  serie_id: string
  
  // Status e prioridade
  pipeline_status: StatusProducao
  pipeline_prioridade: number
  ideia_status: string
  roteiro_status: string | null
  
  // Títulos
  ideia_titulo: string
  roteiro_titulo: string | null
  canal: string
  serie: string
  
  // Flags
  tem_roteiro: boolean
  tem_audio: boolean
  tem_video: boolean
  
  // Datas
  data_prevista: string | null
  data_publicacao_planejada: string | null
  data_publicacao: string | null
  datahora_publicacao_planejada: string | null
  
  // Outros
  pipeline_responsavel: string | null
  pipeline_observacoes: string | null
  ideia_tags: string[] | null
  pipeline_metadata: any
}

// Buscar todos os conteúdos em produção
export function useConteudosProducao() {
  return useQuery({
    queryKey: ['conteudos-producao'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vw_agenda_publicacao_detalhada')
        .select('*')
        .order('pipeline_prioridade', { ascending: false })
        .order('datahora_publicacao_planejada', { ascending: true })
      
      if (error) {
        console.error('Erro ao buscar pipeline:', error)
        throw error
      }
      
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
        .from('vw_agenda_publicacao_detalhada')
        .select('*')
        .eq('pipeline_status', status)
        .order('pipeline_prioridade', { ascending: false })
      
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
        .from('vw_agenda_publicacao_detalhada')
        .select('*')
        .not('datahora_publicacao_planejada', 'is', null)
        .gte('datahora_publicacao_planejada', mesInicio.toISOString())
        .lte('datahora_publicacao_planejada', mesFim.toISOString())
        .order('datahora_publicacao_planejada', { ascending: true })
      
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

// Estatísticas do pipeline
export function useEstatisticasProducao() {
  return useQuery({
    queryKey: ['stats-producao'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vw_agenda_publicacao_detalhada')
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
