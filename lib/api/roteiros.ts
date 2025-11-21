import { supabase } from '../supabase/client'
import { Database } from '../supabase/database.types'

type Roteiro = Database['pulso_content']['Tables']['roteiros']['Row']
type RoteiroInsert = Database['pulso_content']['Tables']['roteiros']['Insert']
type RoteiroUpdate = Database['pulso_content']['Tables']['roteiros']['Update']

export const roteirosApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('roteiros')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('roteiros')
      .select('*')
      .eq('id', id as any)
      .single()
    
    if (error) throw error
    return data
  },

  async getByIdeiaId(ideiaId: string) {
    const { data, error } = await supabase
      .from('roteiros')
      .select('*')
      .eq('ideia_id', ideiaId as any)
      .order('versao', { ascending: false })
    
    if (error) throw error
    return data
  },

  async create(roteiro: RoteiroInsert) {
    const { data, error } = await supabase
      .from('roteiros')
      .insert(roteiro as any)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: string, updates: RoteiroUpdate) {
    const { data, error} = await supabase
      .from('roteiros')
      .update({ ...updates, updated_at: new Date().toISOString() } as any)
      .eq('id', id as any)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('roteiros')
      .delete()
      .eq('id', id as any)
    
    if (error) throw error
  },

  async getStats() {
    const { data, error } = await supabase
      .from('roteiros')
      .select('status')
    
    if (error) throw error
    
    const stats = data.reduce((acc, roteiro: any) => {
      acc[roteiro.status] = (acc[roteiro.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return {
      total: data.length,
      por_status: stats
    }
  }
}
