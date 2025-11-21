import { supabase } from '../supabase/client'

export const canaisApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('canais')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('canais')
      .select('*')
      .eq('id', id as any)
      .single()
    
    if (error) throw error
    return data
  }
}

export const seriesApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('series')
      .select('*')
      .order('ordem_padrao', { ascending: true })
    
    if (error) throw error
    return data
  },

  async getByCanal(canalId: string) {
    const { data, error } = await supabase
      .from('series')
      .select('*')
      .eq('canal_id', canalId as any)
      .order('ordem_padrao', { ascending: true })
    
    if (error) throw error
    return data
  }
}

export const plataformasApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('plataformas')
      .select('*')
      .eq('ativo', true as any)
      .order('nome_exibicao')
    
    if (error) throw error
    return data
  }
}

export const tagsApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .order('nome')
    
    if (error) throw error
    return data
  }
}
