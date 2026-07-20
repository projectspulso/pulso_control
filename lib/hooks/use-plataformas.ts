import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

// Tipos
export interface Plataforma {
  id: string
  tipo: string
  nome_exibicao: string
  descricao: string | null
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface PlataformaConectada extends Plataforma {
  tem_credenciais: boolean
  credencial_ativa: boolean | null
  usuario_conectado: string | null
  data_autorizacao: string | null
  escopo: string[] | null
  token_valido: boolean | null
  token_expira_em: string | null
}

export interface Configuracao {
  chave: string
  valor: string
  tipo: 'string' | 'number' | 'boolean' | 'json' | 'secret'
  descricao: string | null
  categoria: string | null
  updated_at: string
}

function coreTable(table: 'configuracoes' | 'plataforma_credenciais') {
  return supabase.schema('pulso_core').from(table)
}

// Hook: Plataformas com status de conexão
export function usePlataformasConectadas() {
  return useQuery({
    queryKey: ['plataformas-conectadas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plataformas_conectadas')
        .select('*')
        .order('tipo')
        .order('nome_exibicao')
      
      if (error) throw error
      return data as PlataformaConectada[]
    },
  })
}

// Hook: Atualizar configuração
export function useAtualizarConfiguracao() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ chave, valor }: { chave: string; valor: string }) => {
      const { data, error } = await coreTable('configuracoes')
        .update({ valor, updated_at: new Date().toISOString() })
        .eq('chave', chave)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracoes'] })
    },
  })
}

// Hook: Desconectar plataforma
export function useDesconectarPlataforma() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (plataforma_id: string) => {
      const { error } = await coreTable('plataforma_credenciais')
        .delete()
        .eq('plataforma_id', plataforma_id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plataformas-conectadas'] })
    },
  })
}
