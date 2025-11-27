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

// Hook: Listar todas as plataformas
export function usePlataformas() {
  return useQuery({
    queryKey: ['plataformas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plataformas')
        .select('*')
        .order('tipo')
        .order('nome_exibicao')
      
      if (error) throw error
      return data as Plataforma[]
    },
  })
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

// Hook: Configurações por categoria
export function useConfiguracoes(categoria?: string) {
  return useQuery({
    queryKey: ['configuracoes', categoria],
    queryFn: async () => {
      let query = supabase.from('configuracoes').select('*')
      
      if (categoria) {
        query = query.eq('categoria', categoria)
      }
      
      const { data, error } = await query.order('chave')
      
      if (error) throw error
      return data as Configuracao[]
    },
  })
}

// Hook: Atualizar configuração
export function useAtualizarConfiguracao() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ chave, valor }: { chave: string; valor: string }) => {
      const { data, error } = await supabase
        .from('configuracoes')
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

// Hook: Salvar credenciais de plataforma
export function useSalvarCredenciais() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({
      plataforma_id,
      access_token,
      refresh_token,
      token_expira_em,
      usuario_conectado,
      escopo,
    }: {
      plataforma_id: string
      access_token?: string
      refresh_token?: string
      token_expira_em?: string
      usuario_conectado?: string
      escopo?: string[]
    }) => {
      const { data, error } = await supabase
        .from('plataforma_credenciais')
        .upsert({
          plataforma_id,
          access_token,
          refresh_token,
          token_expira_em,
          usuario_conectado,
          escopo,
          data_autorizacao: new Date().toISOString(),
          ativo: true,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plataformas-conectadas'] })
    },
  })
}

// Hook: Desconectar plataforma
export function useDesconectarPlataforma() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (plataforma_id: string) => {
      const { error } = await supabase
        .from('plataforma_credenciais')
        .delete()
        .eq('plataforma_id', plataforma_id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plataformas-conectadas'] })
    },
  })
}
