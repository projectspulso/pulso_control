import { supabase } from '../supabase/client'

export const audiosApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('audios')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('audios')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async getByRoteiroId(roteiroId: string) {
    const { data, error } = await supabase
      .from('audios')
      .select('*')
      .eq('roteiro_id', roteiroId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  async getStats() {
    const { data, error } = await supabase
      .from('audios')
      .select('status, tipo, duracao_segundos')
    
    if (error) throw error
    
    const stats = {
      total: data.length,
      por_status: data.reduce((acc, audio: any) => {
        acc[audio.status] = (acc[audio.status] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      por_tipo: data.reduce((acc, audio: any) => {
        acc[audio.tipo] = (acc[audio.tipo] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      duracao_total_segundos: data.reduce((acc, audio: any) => acc + (audio.duracao_segundos || 0), 0)
    }
    
    return stats
  }
}
