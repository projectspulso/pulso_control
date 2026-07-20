import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import type { 
  PipelineCalendario, 
  PipelineComAsset,
  PipelineComAssetsAgrupado,
  FiltroCalendario,
  PipelineStatus
} from '@/lib/types/pipeline'

type CalendarioViewRow = {
  pipeline_id: string
  canal_nome: string | null
  serie_nome: string | null
  ideia_titulo: string | null
  ideia_status: string
  pipeline_status: string
  is_piloto: boolean | null
  data_prevista: string | null
  data_publicacao_planejada: string | null
  hora_publicacao: string | null
  prioridade: number | null
  pipeline_metadata: any
}

function mapCalendarioRow(row: CalendarioViewRow): PipelineCalendario {
  return {
    pipeline_id: row.pipeline_id,
    canal: row.canal_nome || 'Sem canal',
    serie: row.serie_nome,
    ideia: row.ideia_titulo || 'Sem titulo',
    ideia_status: row.ideia_status,
    pipeline_status: row.pipeline_status,
    is_piloto: row.is_piloto,
    data_prevista: row.data_prevista,
    data_publicacao_planejada: row.data_publicacao_planejada,
    hora_publicacao: row.hora_publicacao,
    prioridade: row.prioridade,
    metadata: row.pipeline_metadata || {},
  }
}

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
        query = query.eq('canal_nome', filtros.canal)
      }
      
      if (filtros?.serie) {
        query = query.eq('serie_nome', filtros.serie)
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
      return (data || []).map((row) => mapCalendarioRow(row as CalendarioViewRow))
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
      return (data || []).map((row) => mapCalendarioRow(row as CalendarioViewRow))
    },
  })
}

// Hook para agendar publicacao (modo assistido): grava data/hora planejada
// no pipeline. NAO enfileira nada — e lembrete/agenda; publicacao segue manual.
export function useAgendarPublicacao() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      pipelineIds,
      dataHora,
    }: {
      pipelineIds: string[]
      dataHora: string
    }) => {
      const { data, error } = await supabase
        .schema('pulso_content')
        .from('pipeline_producao')
        .update({ data_publicacao_planejada: dataHora })
        .in('id', pipelineIds)
        .select()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendario'] })
      queryClient.invalidateQueries({ queryKey: ['calendario-dia'] })
      queryClient.invalidateQueries({ queryKey: ['calendario-intervalo'] })
      queryClient.invalidateQueries({ queryKey: ['conteudos-prontos'] })
      queryClient.invalidateQueries({ queryKey: ['pipeline-status'] })
      queryClient.invalidateQueries({ queryKey: ['pipelines-assets'] })
    },
  })
}

