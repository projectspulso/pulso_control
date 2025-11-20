import { supabase } from '../supabase/client'

export const metricasApi = {
  async getByPost(postId: string) {
    const { data, error } = await supabase
      .from('metricas_diarias')
      .select(`
        *,
        plataforma:plataforma_id(nome_exibicao)
      `)
      .eq('post_id', postId)
      .order('data_ref', { ascending: false })
    
    if (error) throw error
    return data
  },

  async getTotais() {
    const { data, error } = await supabase
      .from('metricas_diarias')
      .select('views, likes, comentarios, compartilhamentos')
    
    if (error) throw error
    
    const totais = data.reduce((acc, m) => ({
      views: acc.views + (m.views || 0),
      likes: acc.likes + (m.likes || 0),
      comentarios: acc.comentarios + (m.comentarios || 0),
      compartilhamentos: acc.compartilhamentos + (m.compartilhamentos || 0)
    }), {
      views: 0,
      likes: 0,
      comentarios: 0,
      compartilhamentos: 0
    })
    
    return totais
  },

  async getUltimos7Dias() {
    const dataInicio = new Date()
    dataInicio.setDate(dataInicio.getDate() - 7)
    
    const { data, error } = await supabase
      .from('metricas_diarias')
      .select('*')
      .gte('data_ref', dataInicio.toISOString().split('T')[0])
      .order('data_ref', { ascending: true })
    
    if (error) throw error
    return data
  }
}
