import { supabase } from '@/lib/supabase/client'

export interface ConteudoProducao {
  // IDs
  pipeline_id: string
  ideia_id: string
  roteiro_id: string | null
  
  // Títulos
  ideia: string
  roteiro: string | null
  canal: string
  serie: string
  
  // Status
  pipeline_status: string
  ideia_status: string
  roteiro_status: string | null
  
  // Flags
  is_piloto: boolean
  
  // Datas
  data_prevista: string | null
  data_publicacao_planejada: string | null
  
  // Prioridade e metadata
  prioridade: number
  metadata: any
}

export async function getAll() {
  const { data, error } = await supabase
    .schema('pulso_content')
    .from('pipeline_producao')
    .select(`
      id,
      ideia_id,
      roteiro_id,
      status,
      prioridade,
      data_prevista,
      data_publicacao_planejada,
      is_piloto,
      metadata,
      ideias:ideia_id (
        id,
        titulo,
        status
      ),
      roteiros:roteiro_id (
        id,
        titulo,
        status
      )
    `)
    .order('prioridade', { ascending: false })
    .order('data_publicacao_planejada', { ascending: true })

  if (error) throw error

  // Transformar para o formato esperado
  return (data || []).map(item => {
    const ideiaData = Array.isArray(item.ideias) ? item.ideias[0] : item.ideias
    const roteiroData = Array.isArray(item.roteiros) ? item.roteiros[0] : item.roteiros
    
    return {
      pipeline_id: item.id,
      ideia_id: item.ideia_id,
      roteiro_id: item.roteiro_id,
      
      ideia: ideiaData?.titulo || 'Sem título',
      roteiro: roteiroData?.titulo || null,
      canal: item.metadata?.canal_nome || 'Sem canal',
      serie: item.metadata?.serie_nome || '',
      
      pipeline_status: item.status,
      ideia_status: ideiaData?.status || '',
      roteiro_status: roteiroData?.status || null,
      
      is_piloto: item.is_piloto || false,
      
      data_prevista: item.data_prevista,
      data_publicacao_planejada: item.data_publicacao_planejada,
      
      prioridade: item.prioridade || 1,
      metadata: item.metadata || {}
    }
  }) as ConteudoProducao[]
}

export async function getByStatus(status: string) {
  const { data, error } = await supabase
    .schema('pulso_content')
    .from('pipeline_producao')
    .select(`
      id,
      ideia_id,
      roteiro_id,
      status,
      prioridade,
      data_prevista,
      data_publicacao_planejada,
      is_piloto,
      metadata,
      ideias:ideia_id (
        id,
        titulo,
        status
      ),
      roteiros:roteiro_id (
        id,
        titulo,
        status
      )
    `)
    .eq('status', status)
    .order('prioridade', { ascending: false })

  if (error) throw error

  return (data || []).map(item => {
    const ideiaData = Array.isArray(item.ideias) ? item.ideias[0] : item.ideias
    const roteiroData = Array.isArray(item.roteiros) ? item.roteiros[0] : item.roteiros
    
    return {
      pipeline_id: item.id,
      ideia_id: item.ideia_id,
      roteiro_id: item.roteiro_id,
      
      ideia: ideiaData?.titulo || 'Sem título',
      roteiro: roteiroData?.titulo || null,
      canal: item.metadata?.canal_nome || 'Sem canal',
      serie: item.metadata?.serie_nome || '',
      
      pipeline_status: item.status,
      ideia_status: ideiaData?.status || '',
      roteiro_status: roteiroData?.status || null,
      
      is_piloto: item.is_piloto || false,
      
      data_prevista: item.data_prevista,
      data_publicacao_planejada: item.data_publicacao_planejada,
      
      prioridade: item.prioridade || 1,
      metadata: item.metadata || {}
    }
  }) as ConteudoProducao[]
}

export async function getStats() {
  const { data, error } = await supabase
    .schema('pulso_content')
    .from('pipeline_producao')
    .select('status')

  if (error) throw error

  const stats = {
    total: data.length,
    aguardando_roteiro: data.filter(d => d.status === 'AGUARDANDO_ROTEIRO').length,
    roteiro_pronto: data.filter(d => d.status === 'ROTEIRO_PRONTO').length,
    audio_gerado: data.filter(d => d.status === 'AUDIO_GERADO').length,
    em_edicao: data.filter(d => d.status === 'EM_EDICAO').length,
    pronto_publicacao: data.filter(d => d.status === 'PRONTO_PUBLICACAO').length,
    publicado: data.filter(d => d.status === 'PUBLICADO').length,
  }

  return stats
}

export async function updateStatus(id: string, novoStatus: string) {
  const { data, error } = await supabase
    .schema('pulso_content')
    .from('pipeline_producao')
    .update({ 
      status: novoStatus,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateDataPrevista(id: string, novaData: Date) {
  const { data, error } = await supabase
    .schema('pulso_content')
    .from('pipeline_producao')
    .update({ 
      data_prevista: novaData.toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}
