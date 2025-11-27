// Types para as views V2 do pipeline

export interface PipelineCalendario {
  pipeline_id: string
  canal: string
  serie: string | null
  ideia: string
  ideia_status: string
  pipeline_status: string
  is_piloto: boolean | null
  data_prevista: string | null
  data_publicacao_planejada: string | null
  hora_publicacao: string | null
  prioridade: number | null
  metadata: any
}

export interface PipelineComAsset {
  pipeline_id: string
  canal: string
  serie: string | null
  ideia: string
  ideia_status: string
  pipeline_status: string
  is_piloto: boolean | null
  data_prevista: string | null
  data_publicacao_planejada: string | null
  hora_publicacao: string | null
  prioridade: number | null
  metadata: any
  
  // Assets
  asset_id: string | null
  asset_tipo: string | null
  caminho_storage: string | null
  provedor: string | null
  duracao_segundos: number | null
  largura_px: number | null
  altura_px: number | null
  tamanho_bytes: number | null
  asset_metadata: any | null
  asset_papel: string | null
  asset_ordem: number | null
}

export interface PipelineComAssetsAgrupado {
  // Dados do pipeline
  pipeline_id: string
  canal: string
  serie: string | null
  ideia: string
  ideia_status: string
  pipeline_status: string
  is_piloto: boolean | null
  data_prevista: string | null
  data_publicacao_planejada: string | null
  hora_publicacao: string | null
  prioridade: number | null
  metadata: any
  
  // Assets agrupados
  assets: Array<{
    id: string
    tipo: string
    papel: string
    caminho: string
    provedor?: string
    duracao_segundos?: number
    largura_px?: number
    altura_px?: number
    tamanho_bytes?: number
    metadata?: any
    ordem: number
  }>
}

// Status válidos do pipeline
export type PipelineStatus = 
  | 'RASCUNHO'
  | 'EM_REVISAO'
  | 'APROVADO'
  | 'EM_PRODUCAO'
  | 'PRONTO_PUBLICACAO'
  | 'PUBLICADO'
  | 'ARQUIVADO'

// Status válidos do conteúdo/ideia
export type ConteudoStatus =
  | 'RASCUNHO'
  | 'EM_ANALISE'
  | 'APROVADO'
  | 'REJEITADO'
  | 'ARQUIVADO'

// Tipos de asset
export type AssetTipo = 
  | 'audio'
  | 'video'
  | 'imagem'
  | 'thumbnail'
  | 'broll'

// Papéis de asset
export type AssetPapel = 
  | 'THUMB'
  | 'VIDEO'
  | 'AUDIO'
  | 'BROLL'
  | 'LEGENDA'
  | 'OUTRO'

// Filtros para queries
export interface FiltroCalendario {
  canal?: string
  serie?: string
  status?: PipelineStatus[]
  isPiloto?: boolean
  dataInicio?: string
  dataFim?: string
  prioridadeMin?: number
  prioridadeMax?: number
}

// Helper para agrupar assets
export function agruparAssetsPorPipeline(rows: PipelineComAsset[]): PipelineComAssetsAgrupado[] {
  const agrupados = new Map<string, PipelineComAssetsAgrupado>()
  
  rows.forEach(row => {
    if (!agrupados.has(row.pipeline_id)) {
      agrupados.set(row.pipeline_id, {
        pipeline_id: row.pipeline_id,
        canal: row.canal,
        serie: row.serie,
        ideia: row.ideia,
        ideia_status: row.ideia_status,
        pipeline_status: row.pipeline_status,
        is_piloto: row.is_piloto,
        data_prevista: row.data_prevista,
        data_publicacao_planejada: row.data_publicacao_planejada,
        hora_publicacao: row.hora_publicacao,
        prioridade: row.prioridade,
        metadata: row.metadata,
        assets: []
      })
    }
    
    const pipeline = agrupados.get(row.pipeline_id)!
    
    if (row.asset_id) {
      pipeline.assets.push({
        id: row.asset_id,
        tipo: row.asset_tipo!,
        papel: row.asset_papel!,
        caminho: row.caminho_storage!,
        provedor: row.provedor || undefined,
        duracao_segundos: row.duracao_segundos || undefined,
        largura_px: row.largura_px || undefined,
        altura_px: row.altura_px || undefined,
        tamanho_bytes: row.tamanho_bytes || undefined,
        metadata: row.asset_metadata || undefined,
        ordem: row.asset_ordem || 0
      })
    }
  })
  
  // Ordenar assets dentro de cada pipeline
  agrupados.forEach(pipeline => {
    pipeline.assets.sort((a, b) => a.ordem - b.ordem)
  })
  
  return Array.from(agrupados.values())
}
