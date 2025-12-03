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

// Interface para asset simples (estendida com public_url)
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
  public_url?: string // URL pública do Supabase Storage
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

// Hook para buscar assets por tipo (CORRIGIDO - usa audios reais)
export function useAssetsPorTipo(tipo?: string) {
  return useQuery({
    queryKey: ['assets', tipo],
    queryFn: async () => {
      // Por enquanto, só temos áudios - buscar da tabela audios
      if (!tipo || tipo === 'audio') {
        const { data, error } = await supabase
          .schema('pulso_content')
          .from('audios')
          .select(`
            id,
            storage_path as caminho_storage,
            duracao_segundos,
            linguagem,
            tipo,
            status,
            metadata,
            created_at,
            updated_at,
            public_url,
            roteiros(titulo)
          `)
          .order('created_at', { ascending: false })
        
        if (error) throw error
        
        // Mapear para formato Asset
        return (data || []).map(audio => ({
          id: audio.id,
          tipo: 'audio' as const,
          nome: audio.roteiros?.[0]?.titulo || `Audio ${audio.id.slice(0, 8)}`,
          descricao: `Status: ${audio.status}`,
          caminho_storage: audio.caminho_storage,
          provedor: audio.metadata?.provedor || 'openai',
          duracao_segundos: audio.duracao_segundos,
          tamanho_bytes: undefined,
          largura_px: undefined,
          altura_px: undefined,
          hash_arquivo: undefined,
          metadata: audio.metadata,
          criado_por: undefined,
          created_at: audio.created_at,
          updated_at: audio.updated_at,
          public_url: audio.public_url
        }))
      }
      
      // Para outros tipos (vídeo, imagem, etc), retornar vazio por enquanto
      return []
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

// ============================================
// NOTA: Assets são gerenciados via n8n workflows
// Os hooks abaixo são READ-ONLY para visualização
// ============================================

// Hook para buscar audios gerados (tabela pulso_content.audios)
export function useAudiosGerados() {
  return useQuery({
    queryKey: ['audios-gerados'],
    queryFn: async () => {
      const { data, error } = await supabase
        .schema('pulso_content')
        .from('audios')
        .select(`
          id,
          roteiro_id,
          canal_id,
          storage_path,
          public_url,
          duracao_segundos,
          linguagem,
          formato,
          tipo,
          status,
          metadata,
          created_at,
          roteiros(
            titulo,
            ideia_id,
            ideias(
              titulo
            )
          )
        `)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    },
  })
}

// Hook para buscar áudio específico de um roteiro
export function useAudioDoRoteiro(roteiroId?: string) {
  return useQuery({
    queryKey: ['audio-roteiro', roteiroId],
    queryFn: async () => {
      if (!roteiroId) return null
      
      const { data, error } = await supabase
        .schema('pulso_content')
        .from('audios')
        .select('*')
        .eq('roteiro_id', roteiroId)
        .single()
      
      if (error && error.code !== 'PGRST116') throw error // PGRST116 = not found
      return data
    },
    enabled: !!roteiroId,
  })
}
