import { supabase } from '../supabase/client'
import { Database } from '../supabase/database.types'

type Ideia = Database['pulso_content']['Tables']['ideias']['Row']
type IdeiaInsert = Database['pulso_content']['Tables']['ideias']['Insert']
type IdeiaUpdate = Database['pulso_content']['Tables']['ideias']['Update']

export const ideiasApi = {
  // Listar todas as ideias com joins
  async getAll() {
    const { data, error } = await supabase
      .schema('pulso_content')
      .from('ideias')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Buscar por ID
  async getById(id: string) {
    const { data, error } = await supabase
      .schema('pulso_content')
      .from('ideias')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  // Listar por status
  async getByStatus(status: Ideia['status']) {
    const { data, error } = await supabase
      .schema('pulso_content')
      .from('ideias')
      .select('*')
      .eq('status', status)
      .order('prioridade', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Criar nova ideia
  async create(ideia: IdeiaInsert) {
    const { data, error } = await supabase
      .schema('pulso_content')
      .from('ideias')
      .insert(ideia)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Atualizar ideia
  async update(id: string, updates: IdeiaUpdate) {
    const { data, error } = await supabase
      .schema('pulso_content')
      .from('ideias')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Erro no Supabase ao atualizar ideia:', error)
      throw error
    }
    return data
  },

  // Deletar ideia
  async delete(id: string) {
    const { error } = await supabase
      .schema('pulso_content')
      .from('ideias')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  // Stats das ideias
  async getStats() {
    const { data, error } = await supabase
      .schema('pulso_content')
      .from('ideias')
      .select('status')
    
    if (error) throw error
    
    const stats = data.reduce((acc, ideia: any) => {
      acc[ideia.status] = (acc[ideia.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return {
      total: data.length,
      por_status: stats
    }
  }
}
