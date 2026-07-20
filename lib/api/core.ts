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
      .eq('id', id)
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
      .eq('canal_id', canalId)
      .order('ordem_padrao', { ascending: true })
    
    if (error) throw error
    return data
  }
}

