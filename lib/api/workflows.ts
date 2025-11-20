import { supabase } from '../supabase/client'

export const workflowsApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .order('nome')
    
    if (error) throw error
    return data
  },

  async getExecucoes(workflowId?: string) {
    let query = supabase
      .from('workflow_execucoes')
      .select(`
        *,
        workflow:workflow_id(nome, slug)
      `)
      .order('inicio_em', { ascending: false })
      .limit(50)
    
    if (workflowId) {
      query = query.eq('workflow_id', workflowId)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    return data
  },

  async getStats() {
    const { data, error } = await supabase
      .from('workflow_execucoes')
      .select('status, workflow_id')
    
    if (error) throw error
    
    const stats = {
      total: data.length,
      sucesso: data.filter(e => e.status === 'SUCESSO').length,
      erro: data.filter(e => e.status === 'ERRO').length,
      executando: data.filter(e => e.status === 'EXECUTANDO').length
    }
    
    return stats
  }
}
