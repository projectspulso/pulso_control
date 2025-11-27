import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

// Interface baseada na view vw_pulso_pipeline_com_assets
export interface AssetComVariante {
  // Pipeline
  pipeline_id: string
  ideia_id: string
  roteiro_id?: string
  audio_id?: string
  video_id?: string
  conteudo_variantes_id?: string
  pipeline_status: string
  prioridade: number
  data_publicacao_planejada?: string
  
  // Ideia
  ideia_titulo: string
  ideia_descricao?: string
  canal_id: string
  serie_id?: string
  
  // Canal
  canal_nome: string
  canal_slug: string
  
  // Série
  serie_nome?: string
  serie_slug?: string
  
  // Variante
  conteudo_variantes_id_real?: string
  conteudo_id?: string
  nome_variacao?: string
  plataforma_tipo?: string
  variante_status?: string
  titulo_publico?: string
  descricao_publica?: string
  legenda?: string
  hashtags?: string[]
  
  // Asset
  asset_id?: string
  asset_papel?: string
  asset_ordem?: number
  asset_tipo?: string
  asset_nome?: string
  asset_descricao?: string
  caminho_storage?: string
  provedor?: string
  duracao_segundos?: number
  largura_px?: number
  altura_px?: number
  tamanho_bytes?: number
  hash_arquivo?: string
  asset_metadata?: any
  asset_created_at?: string
  asset_updated_at?: string
}

// Interface para asset simples (tabela assets)
export interface Asset {
  id: string
  tipo: 'audio' | 'video' | 'imagem' | 'thumbnail' | 'broll'
  nome: string
  descricao?: string
  caminho_storage: string
  provedor?: string
  duracao_segundos?: number
  largura_px?: number
  altura_px?: number
  tamanho_bytes?: number
  hash_arquivo?: string
  metadata?: any
  criado_por?: string
  created_at: string
  updated_at: string
}

// Hook para buscar pipeline com assets
export function usePipelineComAssets() {
  return useQuery({
    queryKey: ['pipeline-com-assets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vw_pulso_pipeline_com_assets')
        .select('*')
        .order('pipeline_created_at', { ascending: false })
      
      if (error) throw error
      return data as AssetComVariante[]
    },
  })
}

// Hook para buscar assets por tipo
export function useAssetsPorTipo(tipo?: string) {
  return useQuery({
    queryKey: ['assets', tipo],
    queryFn: async () => {
      let query = supabase
        .from('assets')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (tipo) {
        query = query.eq('tipo', tipo)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      return data as Asset[]
    },
  })
}

// Hook para buscar assets de uma variante específica
export function useAssetsDeVariante(varianteId: string) {
  return useQuery({
    queryKey: ['assets-variante', varianteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vw_pulso_pipeline_com_assets')
        .select('*')
        .eq('conteudo_variantes_id', varianteId)
        .order('asset_ordem', { ascending: true })
      
      if (error) throw error
      return data as AssetComVariante[]
    },
    enabled: !!varianteId,
  })
}

// Hook para criar novo asset
export function useCriarAsset() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (novoAsset: Partial<Asset>) => {
      const { data, error } = await supabase
        .from('assets')
        .insert(novoAsset)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] })
      queryClient.invalidateQueries({ queryKey: ['pipeline-com-assets'] })
    },
  })
}

// Hook para vincular asset a variante
export function useVincularAssetVariante() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (vinculo: { 
      conteudo_variantes_id: string
      asset_id: string
      papel?: string
      ordem?: number
    }) => {
      const { data, error } = await supabase
        .from('conteudo_variantes_assets')
        .insert(vinculo)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-com-assets'] })
      queryClient.invalidateQueries({ queryKey: ['assets-variante'] })
    },
  })
}

// Hook para remover vinculo asset-variante
export function useRemoverAssetVariante() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ 
      varianteId, 
      assetId 
    }: { 
      varianteId: string
      assetId: string 
    }) => {
      const { error } = await supabase
        .from('conteudo_variantes_assets')
        .delete()
        .eq('conteudo_variantes_id', varianteId)
        .eq('asset_id', assetId)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-com-assets'] })
      queryClient.invalidateQueries({ queryKey: ['assets-variante'] })
    },
  })
}

// Hook para deletar asset
export function useDeletarAsset() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (assetId: string) => {
      const { error } = await supabase
        .from('assets')
        .delete()
        .eq('id', assetId)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] })
      queryClient.invalidateQueries({ queryKey: ['pipeline-com-assets'] })
    },
  })
}
