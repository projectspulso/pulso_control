// Database types gerados a partir da estrutura Supabase
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  pulso_core: {
    Tables: {
      canais: {
        Row: {
          id: string
          nome: string
          slug: string
          descricao: string | null
          idioma: string | null
          status: 'ATIVO' | 'INATIVO' | 'ARQUIVADO'
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['pulso_core']['Tables']['canais']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['pulso_core']['Tables']['canais']['Insert']>
      }
      plataformas: {
        Row: {
          id: string
          tipo: 'YOUTUBE_SHORTS' | 'YOUTUBE_LONGO' | 'TIKTOK' | 'INSTAGRAM_REELS' | 'FACEBOOK_REELS' | 'KWAI'
          nome_exibicao: string
          descricao: string | null
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['pulso_core']['Tables']['plataformas']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['pulso_core']['Tables']['plataformas']['Insert']>
      }
      series: {
        Row: {
          id: string
          canal_id: string
          nome: string
          slug: string
          descricao: string | null
          status: 'ATIVO' | 'INATIVO' | 'ARQUIVADO'
          ordem_padrao: number | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['pulso_core']['Tables']['series']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['pulso_core']['Tables']['series']['Insert']>
      }
      tags: {
        Row: {
          id: string
          nome: string
          slug: string
          descricao: string | null
          created_at: string
        }
        Insert: Omit<Database['pulso_core']['Tables']['tags']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['pulso_core']['Tables']['tags']['Insert']>
      }
      canais_plataformas: {
        Row: {
          id: string
          canal_id: string
          plataforma_id: string
          identificador_externo: string
          nome_exibicao: string | null
          url_canal: string | null
          ativo: boolean
          configuracoes: Json
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['pulso_core']['Tables']['canais_plataformas']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['pulso_core']['Tables']['canais_plataformas']['Insert']>
      }
      usuarios_internos: {
        Row: {
          id: string
          auth_user_id: string | null
          nome: string
          email: string | null
          papel: string | null
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['pulso_core']['Tables']['usuarios_internos']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['pulso_core']['Tables']['usuarios_internos']['Insert']>
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
  pulso_content: {
    Tables: {
      ideias: {
        Row: {
          id: string
          canal_id: string | null
          serie_id: string | null
          titulo: string
          descricao: string | null
          origem: string | null
          prioridade: number | null
          status: 'RASCUNHO' | 'APROVADA' | 'EM_PRODUCAO' | 'CONCLUIDA' | 'ARQUIVADA'
          tags: string[] | null
          linguagem: string | null
          criado_por: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['pulso_content']['Tables']['ideias']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['pulso_content']['Tables']['ideias']['Insert']>
      }
      roteiros: {
        Row: {
          id: string
          ideia_id: string | null
          titulo: string
          versao: number
          conteudo_md: string
          duracao_estimado_segundos: number | null
          status: 'RASCUNHO' | 'REVISAO' | 'APROVADO' | 'PRODUCAO' | 'CONCLUIDO'
          linguagem: string | null
          criado_por: string | null
          revisado_por: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['pulso_content']['Tables']['roteiros']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['pulso_content']['Tables']['roteiros']['Insert']>
      }
      conteudos: {
        Row: {
          id: string
          canal_id: string | null
          serie_id: string | null
          roteiro_id: string | null
          titulo_interno: string
          sinopse: string | null
          status: 'RASCUNHO' | 'EM_PRODUCAO' | 'PRONTO' | 'PUBLICADO' | 'ARQUIVADO'
          linguagem: string | null
          ordem_na_serie: number | null
          tags: string[] | null
          metadata: Json
          criado_por: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['pulso_content']['Tables']['conteudos']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['pulso_content']['Tables']['conteudos']['Insert']>
      }
      conteudo_variantes: {
        Row: {
          id: string
          conteudo_id: string
          nome_variacao: string
          plataforma_tipo: 'YOUTUBE_SHORTS' | 'YOUTUBE_LONGO' | 'TIKTOK' | 'INSTAGRAM_REELS' | 'FACEBOOK_REELS' | 'KWAI' | null
          status: 'RASCUNHO' | 'EM_PRODUCAO' | 'PRONTO' | 'PUBLICADO' | 'ARQUIVADO'
          titulo_publico: string | null
          descricao_publica: string | null
          legenda: string | null
          hashtags: string[] | null
          linguagem: string | null
          ordem_exibicao: number | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['pulso_content']['Tables']['conteudo_variantes']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['pulso_content']['Tables']['conteudo_variantes']['Insert']>
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
  pulso_assets: {
    Tables: {
      assets: {
        Row: {
          id: string
          tipo: 'AUDIO' | 'VIDEO' | 'IMAGEM' | 'THUMBNAIL' | 'OUTRO'
          nome: string | null
          descricao: string | null
          caminho_storage: string
          provedor: string | null
          duracao_segundos: number | null
          largura_px: number | null
          altura_px: number | null
          tamanho_bytes: number | null
          hash_arquivo: string | null
          metadata: Json
          criado_por: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['pulso_assets']['Tables']['assets']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['pulso_assets']['Tables']['assets']['Insert']>
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
  pulso_distribution: {
    Tables: {
      posts: {
        Row: {
          id: string
          conteudo_variantes_id: string
          canal_plataforma_id: string
          status: 'AGENDADO' | 'PUBLICADO' | 'FALHOU' | 'REMOVIDO'
          titulo_publicado: string | null
          descricao_publicada: string | null
          legenda_publicada: string | null
          url_publicacao: string | null
          identificador_externo: string | null
          data_agendada: string | null
          data_publicacao: string | null
          data_remocao: string | null
          metadata: Json
          criado_por: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['pulso_distribution']['Tables']['posts']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['pulso_distribution']['Tables']['posts']['Insert']>
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
  pulso_analytics: {
    Tables: {
      metricas_diarias: {
        Row: {
          id: string
          post_id: string
          plataforma_id: string | null
          data_ref: string
          views: number | null
          likes: number | null
          deslikes: number | null
          comentarios: number | null
          compartilhamentos: number | null
          cliques_link: number | null
          inscricoes: number | null
          watch_time_segundos: number | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['pulso_analytics']['Tables']['metricas_diarias']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['pulso_analytics']['Tables']['metricas_diarias']['Insert']>
      }
      eventos: {
        Row: {
          id: string
          post_id: string | null
          plataforma_id: string | null
          tipo: 'VIEW' | 'LIKE' | 'COMMENT' | 'SHARE' | 'CLICK' | 'SUBSCRIBE'
          quantidade: number
          valor_numerico: number | null
          metadata: Json
          registrado_em: string
          data_evento: string
        }
        Insert: Omit<Database['pulso_analytics']['Tables']['eventos']['Row'], 'id' | 'registrado_em'>
        Update: Partial<Database['pulso_analytics']['Tables']['eventos']['Insert']>
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
  pulso_automation: {
    Tables: {
      workflows: {
        Row: {
          id: string
          nome: string
          slug: string
          descricao: string | null
          origem: string | null
          referencia_externa: string | null
          ativo: boolean
          configuracao: Json
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['pulso_automation']['Tables']['workflows']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['pulso_automation']['Tables']['workflows']['Insert']>
      }
      workflow_execucoes: {
        Row: {
          id: string
          workflow_id: string
          entidade_tipo: string | null
          entidade_id: string | null
          status: string
          mensagem: string | null
          payload_entrada: Json | null
          payload_saida: Json | null
          inicio_em: string
          fim_em: string | null
          criado_por: string | null
        }
        Insert: Omit<Database['pulso_automation']['Tables']['workflow_execucoes']['Row'], 'id' | 'inicio_em'>
        Update: Partial<Database['pulso_automation']['Tables']['workflow_execucoes']['Insert']>
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}
