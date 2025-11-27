import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import type { 
  PipelineCalendario, 
  PipelineComAsset,
  PipelineComAssetsAgrupado,
  FiltroCalendario,
  PipelineStatus,
  agruparAssetsPorPipeline
} from '@/lib/types/pipeline'

// Re-exportar types para uso nos componentes
export type { PipelineCalendario, PipelineComAsset, PipelineComAssetsAgrupado, FiltroCalendario, PipelineStatus }

// Hook para buscar calendário com filtros
export function useCalendario(filtros?: FiltroCalendario) {
  return useQuery({
    queryKey: ['calendario', filtros],
    queryFn: async () => {
      let query = supabase
        .from('vw_pulso_calendario_publicacao_v2')
        .select('*')
      
      // Aplicar filtros
      if (filtros?.canal) {
        query = query.eq('canal', filtros.canal)
      }
      
      if (filtros?.serie) {
        query = query.eq('serie', filtros.serie)
      }
      
      if (filtros?.status && filtros.status.length > 0) {
        query = query.in('pipeline_status', filtros.status)
      }
      
      if (filtros?.isPiloto !== undefined) {
        query = query.eq('is_piloto', filtros.isPiloto)
      }
      
      if (filtros?.dataInicio) {
        query = query.gte('data_publicacao_planejada', filtros.dataInicio)
      }
      
      if (filtros?.dataFim) {
        query = query.lte('data_publicacao_planejada', filtros.dataFim)
      }
      
      if (filtros?.prioridadeMin !== undefined) {
        query = query.gte('prioridade', filtros.prioridadeMin)
      }
      
      if (filtros?.prioridadeMax !== undefined) {
        query = query.lte('prioridade', filtros.prioridadeMax)
      }
      
      // Ordenar por data e hora
      query = query
        .order('data_publicacao_planejada', { ascending: true })
        .order('hora_publicacao', { ascending: true })
      
      const { data, error } = await query
      
      if (error) throw error
      return data as PipelineCalendario[]
    },
  })
}

// Hook para buscar calendário de um dia específico
export function useCalendarioDia(dia: string) {
  return useQuery({
    queryKey: ['calendario-dia', dia],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vw_pulso_calendario_publicacao_v2')
        .select('*')
        .gte('data_publicacao_planejada', `${dia}T00:00:00`)
        .lt('data_publicacao_planejada', `${dia}T23:59:59`)
        .order('hora_publicacao', { ascending: true })
      
      if (error) throw error
      return data as PipelineCalendario[]
    },
  })
}

// Hook para buscar calendário de um intervalo de datas
export function useCalendarioIntervalo(dataInicio: string, dataFim: string) {
  return useQuery({
    queryKey: ['calendario-intervalo', dataInicio, dataFim],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vw_pulso_calendario_publicacao_v2')
        .select('*')
        .gte('data_publicacao_planejada', `${dataInicio}T00:00:00`)
        .lt('data_publicacao_planejada', `${dataFim}T23:59:59`)
        .order('data_publicacao_planejada', { ascending: true })
        .order('hora_publicacao', { ascending: true })
      
      if (error) throw error
      return data as PipelineCalendario[]
    },
  })
}

// Hook para buscar conteúdos prontos para publicação
export function useConteudosProntos() {
  return useQuery({
    queryKey: ['conteudos-prontos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vw_pulso_calendario_publicacao_v2')
        .select('*')
        .eq('pipeline_status', 'PRONTO_PUBLICACAO')
        .order('data_publicacao_planejada', { ascending: true })
        .order('hora_publicacao', { ascending: true })
      
      if (error) throw error
      return data as PipelineCalendario[]
    },
  })
}

// Hook para buscar pipeline por status (Kanban)
export function usePipelinePorStatus(status: PipelineStatus[]) {
  return useQuery({
    queryKey: ['pipeline-status', status],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vw_pulso_calendario_publicacao_v2')
        .select('*')
        .in('pipeline_status', status)
        .order('prioridade', { ascending: false })
        .order('data_publicacao_planejada', { ascending: true })
      
      if (error) throw error
      return data as PipelineCalendario[]
    },
  })
}

// Hook para buscar pipeline com assets (detalhe)
export function usePipelineComAssets(pipelineId: string) {
  return useQuery({
    queryKey: ['pipeline-assets', pipelineId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vw_pulso_pipeline_com_assets_v2')
        .select('*')
        .eq('pipeline_id', pipelineId)
        .order('asset_ordem', { ascending: true })
      
      if (error) throw error
      
      const rows = data as PipelineComAsset[]
      
      // Importar a função helper dinamicamente
      const { agruparAssetsPorPipeline } = await import('@/lib/types/pipeline')
      const agrupados = agruparAssetsPorPipeline(rows)
      
      return agrupados[0] || null
    },
    enabled: !!pipelineId,
  })
}

// Hook para buscar todos os pipelines com assets (lista com thumbs)
export function usePipelinesComAssets(filtros?: FiltroCalendario) {
  return useQuery({
    queryKey: ['pipelines-assets', filtros],
    queryFn: async () => {
      let query = supabase
        .from('vw_pulso_pipeline_com_assets_v2')
        .select('*')
      
      // Aplicar filtros
      if (filtros?.canal) {
        query = query.eq('canal', filtros.canal)
      }
      
      if (filtros?.serie) {
        query = query.eq('serie', filtros.serie)
      }
      
      if (filtros?.status && filtros.status.length > 0) {
        query = query.in('pipeline_status', filtros.status)
      }
      
      if (filtros?.isPiloto !== undefined) {
        query = query.eq('is_piloto', filtros.isPiloto)
      }
      
      if (filtros?.dataInicio) {
        query = query.gte('data_publicacao_planejada', filtros.dataInicio)
      }
      
      if (filtros?.dataFim) {
        query = query.lte('data_publicacao_planejada', filtros.dataFim)
      }
      
      query = query.order('data_publicacao_planejada', { ascending: true })
      
      const { data, error } = await query
      
      if (error) throw error
      
      const rows = data as PipelineComAsset[]
      
      // Importar a função helper dinamicamente
      const { agruparAssetsPorPipeline } = await import('@/lib/types/pipeline')
      return agruparAssetsPorPipeline(rows)
    },
  })
}

// Hook para buscar pilotos
export function usePilotos() {
  return useQuery({
    queryKey: ['pilotos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vw_pulso_calendario_publicacao_v2')
        .select('*')
        .eq('is_piloto', true)
        .order('data_publicacao_planejada', { ascending: true })
      
      if (error) throw error
      return data as PipelineCalendario[]
    },
  })
}

// Hook para buscar conteúdos por canal
export function useConteudosPorCanal(canal: string) {
  return useQuery({
    queryKey: ['conteudos-canal', canal],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vw_pulso_calendario_publicacao_v2')
        .select('*')
        .eq('canal', canal)
        .order('data_publicacao_planejada', { ascending: true })
      
      if (error) throw error
      return data as PipelineCalendario[]
    },
    enabled: !!canal,
  })
}

// Hook para buscar conteúdos por série
export function useConteudosPorSerie(serie: string) {
  return useQuery({
    queryKey: ['conteudos-serie', serie],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vw_pulso_calendario_publicacao_v2')
        .select('*')
        .eq('serie', serie)
        .order('data_publicacao_planejada', { ascending: true })
      
      if (error) throw error
      return data as PipelineCalendario[]
    },
    enabled: !!serie,
  })
}

// Hook para atualizar status do pipeline
export function useAtualizarStatusPipeline() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ 
      pipelineId, 
      novoStatus 
    }: { 
      pipelineId: string
      novoStatus: PipelineStatus 
    }) => {
      const { data, error } = await supabase
        .from('pipeline_producao')
        .update({ status: novoStatus })
        .eq('id', pipelineId)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      // Invalidar todas as queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['calendario'] })
      queryClient.invalidateQueries({ queryKey: ['calendario-dia'] })
      queryClient.invalidateQueries({ queryKey: ['calendario-intervalo'] })
      queryClient.invalidateQueries({ queryKey: ['pipeline-status'] })
      queryClient.invalidateQueries({ queryKey: ['pipeline-assets'] })
      queryClient.invalidateQueries({ queryKey: ['pipelines-assets'] })
      queryClient.invalidateQueries({ queryKey: ['conteudos-prontos'] })
    },
  })
}
