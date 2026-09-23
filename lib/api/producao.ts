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
  
  // Qualidade
  nota_hook: number | null

  // Prioridade e metadata
  prioridade: number
  metadata: any
}

/**
 * O CANAL DO CARD VEM DA IDEIA, não de uma cópia. Até 23/09/2026 o card lia
 * `pipeline_producao.metadata.canal_nome` — cópia gravada na criação do registro que ninguém mais
 * escreve: 242 de 248 estavam sem ela e o card mostrava "Sem canal" (44 em andamento). A fonte
 * verdadeira é `ideias.canal_id` → `pulso_core.canais`. A cópia antiga só vale se a ideia não tiver
 * canal. O embed cruzado de schema não é suportado pelo PostgREST, por isso os nomes vêm à parte.
 */
async function nomesDosCanais(): Promise<Map<string, string>> {
  const { data } = await supabase.schema('pulso_core').from('canais').select('id, nome')
  return new Map(((data || []) as Array<{ id: string; nome: string }>).map((c) => [c.id, c.nome]))
}

function canalDoCard(canalId: string | null | undefined, metadata: { canal_nome?: string } | null | undefined, canais: Map<string, string>): string {
  return (canalId && canais.get(canalId)) || metadata?.canal_nome || 'Sem canal'
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
        status,
        canal_id
      ),
      roteiros:roteiro_id (
        id,
        titulo,
        status,
        nota_hook
      )
    `)
    .order('prioridade', { ascending: false })
    .order('data_publicacao_planejada', { ascending: true })

  if (error) throw error
  const canais = await nomesDosCanais()

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
      nota_hook: roteiroData?.nota_hook ?? null,
      canal: canalDoCard(ideiaData?.canal_id, item.metadata, canais),
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
        status,
        canal_id
      ),
      roteiros:roteiro_id (
        id,
        titulo,
        status,
        nota_hook
      )
    `)
    .eq('status', status)
    .order('prioridade', { ascending: false })

  if (error) throw error
  const canais = await nomesDosCanais()

  return (data || []).map(item => {
    const ideiaData = Array.isArray(item.ideias) ? item.ideias[0] : item.ideias
    const roteiroData = Array.isArray(item.roteiros) ? item.roteiros[0] : item.roteiros
    
    return {
      pipeline_id: item.id,
      ideia_id: item.ideia_id,
      roteiro_id: item.roteiro_id,
      
      ideia: ideiaData?.titulo || 'Sem título',
      roteiro: roteiroData?.titulo || null,
      nota_hook: roteiroData?.nota_hook ?? null,
      canal: canalDoCard(ideiaData?.canal_id, item.metadata, canais),
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

// Escrita via API server-side (service role) — o update client-side authenticated
// na tabela pulso_content dá 400 (grant/schema). Ver app/api/producao/status.
export async function updateStatus(id: string, novoStatus: string) {
  const r = await fetch('/api/producao/status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, status: novoStatus }),
  })
  const d = await r.json()
  if (!r.ok) throw new Error(d.error || 'Falha ao atualizar status')
  return d.item
}

export async function updateDataPrevista(id: string, novaData: Date) {
  const r = await fetch('/api/producao/status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, data_prevista: novaData.toISOString() }),
  })
  const d = await r.json()
  if (!r.ok) throw new Error(d.error || 'Falha ao atualizar data')
  return d.item
}
