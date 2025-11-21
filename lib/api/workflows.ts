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
      .select('*')
      .order('inicio_em', { ascending: false })
      .limit(50)
    
    if (workflowId) {
      query = query.eq('workflow_id', workflowId as any)
    }
    
    const { data: execucoes, error } = await query
    
    if (error) throw error
    
    // Buscar workflows separadamente
    const workflowIds = [...new Set(execucoes?.map((e: any) => e.workflow_id).filter(Boolean))]
    
    if (workflowIds.length === 0) return execucoes
    
    const { data: workflows } = await supabase
      .from('workflows')
      .select('id, nome, slug')
      .in('id', workflowIds)
    
    // Mapear workflows para execuções
    const workflowMap = new Map(workflows?.map((w: any) => [w.id, w]))
    
    return execucoes?.map((exec: any) => ({
      ...exec,
      workflow: workflowMap.get(exec.workflow_id) || null
    }))
  },

  async getStats() {
    const { data, error } = await supabase
      .from('workflow_execucoes')
      .select('status, workflow_id')
    
    if (error) throw error
    
    const stats = {
      total: data.length,
      sucesso: data.filter((e: any) => e.status === 'SUCESSO').length,
      erro: data.filter((e: any) => e.status === 'ERRO').length,
      executando: data.filter((e: any) => e.status === 'EXECUTANDO').length
    }
    
    return stats
  }
}
