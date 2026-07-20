import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

function sanitizeStorageValue(value?: string | null) {
  if (!value) {
    return undefined
  }

  const normalized = value.trim()

  if (!normalized || normalized === 'undefined' || normalized === 'null') {
    return undefined
  }

  return normalized
}

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
