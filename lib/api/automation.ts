/**
 * API de Automação AI-Native
 * Substitui lib/api/n8n.ts — toda automação via banco + Edge Functions
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

function getClient() {
  return createClient(supabaseUrl, supabaseAnonKey)
}

export type AutomationTipo =
  | 'GERAR_IDEIAS'
  | 'GERAR_ROTEIRO'
  | 'GERAR_AUDIO'
  | 'PREPARAR_VIDEO'
  | 'PUBLICAR'
  | 'COLETAR_METRICAS'
  | 'RELATORIO_SEMANAL'
  | 'PROCESSAR_FILA'
  | 'CUSTOM'

export type AutomationStatus =
  | 'PENDENTE'
  | 'PROCESSANDO'
  | 'SUCESSO'
  | 'ERRO'
  | 'RETRY'
  | 'CANCELADO'

export interface AutomationQueueItem {
  id: string
  tipo: AutomationTipo
  payload: Record<string, unknown>
  status: AutomationStatus
  tentativas: number
  max_tentativas: number
  erro_ultimo: string | null
  origem: string
  referencia_id: string | null
  referencia_tipo: string | null
  resultado: Record<string, unknown> | null
  scheduled_at: string
  started_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
  duracao_segundos: number | null
}

export interface AutomationStats {
  tipo: AutomationTipo
  pendentes: number
  processando: number
  sucesso: number
  erros: number
  retry: number
  total: number
  ultima_execucao_ok: string | null
  duracao_media_seg: number | null
}

export const automationApi = {
  /**
   * Busca itens da fila de automação
   */
  async getQueue(filters?: {
    tipo?: AutomationTipo
    status?: AutomationStatus
    limit?: number
  }): Promise<AutomationQueueItem[]> {
    const supabase = getClient()
    let query = supabase
      .from('vw_automation_queue')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(filters?.limit || 50)

    if (filters?.tipo) query = query.eq('tipo', filters.tipo)
    if (filters?.status) query = query.eq('status', filters.status)

    const { data, error } = await query
    if (error) throw new Error(`Erro ao buscar fila: ${error.message}`)
    return (data as AutomationQueueItem[]) || []
  },

  /**
   * Busca estatísticas da automação (últimos 7 dias)
   */
  async getStats(): Promise<AutomationStats[]> {
    const supabase = getClient()
    const { data, error } = await supabase
      .from('vw_automation_stats')
      .select('*')

    if (error) throw new Error(`Erro ao buscar stats: ${error.message}`)
    return (data as AutomationStats[]) || []
  },

  /**
   * Enfileira geração de ideias para um canal
   */
  async gerarIdeias(canalId: string, quantidade = 5) {
    const supabase = getClient()
    return supabase
      .schema('pulso_automation' as 'public')
      .from('automation_queue')
      .insert({
        tipo: 'GERAR_IDEIAS',
        payload: { canal_id: canalId, quantidade },
        origem: 'manual',
      })
  },

  /**
   * Aprova uma ideia — o trigger automático enfileira geração de roteiro
   */
  async aprovarIdeia(ideiaId: string) {
    const supabase = getClient()
    return supabase
      .schema('pulso_content' as 'public')
      .from('ideias')
      .update({ status: 'APROVADA' })
      .eq('id', ideiaId)
  },

  /**
   * Enfileira geração de roteiro manualmente
   */
  async gerarRoteiro(ideiaId: string, canalId?: string) {
    const supabase = getClient()
    return supabase
      .schema('pulso_automation' as 'public')
      .from('automation_queue')
      .insert({
        tipo: 'GERAR_ROTEIRO',
        payload: { ideia_id: ideiaId, canal_id: canalId },
        referencia_id: ideiaId,
        referencia_tipo: 'ideia',
        origem: 'manual',
      })
  },

  /**
   * Aprova um roteiro — o trigger automático enfileira geração de áudio
   */
  async aprovarRoteiro(roteiroId: string) {
    const supabase = getClient()
    return supabase
      .schema('pulso_content' as 'public')
      .from('roteiros')
      .update({ status: 'APROVADO' })
      .eq('id', roteiroId)
  },

  /**
   * Enfileira geração de áudio manualmente
   */
  async gerarAudio(roteiroId: string, canalId?: string) {
    const supabase = getClient()
    return supabase
      .schema('pulso_automation' as 'public')
      .from('automation_queue')
      .insert({
        tipo: 'GERAR_AUDIO',
        payload: { roteiro_id: roteiroId, canal_id: canalId },
        referencia_id: roteiroId,
        referencia_tipo: 'roteiro',
        origem: 'manual',
      })
  },

  /**
   * Enfileira publicação
   */
  async publicar(pipelineIds: string[], plataformas: string[]) {
    const supabase = getClient()
    return supabase
      .schema('pulso_automation' as 'public')
      .from('automation_queue')
      .insert({
        tipo: 'PUBLICAR',
        payload: { pipeline_ids: pipelineIds, plataformas },
        origem: 'manual',
      })
  },

  /**
   * Trigger: gerar ideias (atalho que insere na fila)
   */
  async triggerGerarIdeias(canalId?: string, quantidade?: number) {
    const supabase = getClient()
    return supabase
      .schema('pulso_automation' as 'public')
      .from('automation_queue')
      .insert({
        tipo: 'GERAR_IDEIAS',
        payload: { canal_id: canalId || null, quantidade: quantidade || 5 },
        origem: 'manual',
      })
  },

  /**
   * Trigger: publicar conteúdo
   */
  async triggerPublicar(pipelineId?: string) {
    const supabase = getClient()
    return supabase
      .schema('pulso_automation' as 'public')
      .from('automation_queue')
      .insert({
        tipo: 'PUBLICAR',
        payload: { pipeline_id: pipelineId || null },
        origem: 'manual',
      })
  },

  /**
   * Trigger: coletar métricas
   */
  async triggerColetarMetricas() {
    const supabase = getClient()
    return supabase
      .schema('pulso_automation' as 'public')
      .from('automation_queue')
      .insert({
        tipo: 'COLETAR_METRICAS',
        payload: {},
        origem: 'manual',
      })
  },

  /**
   * Trigger: gerar relatório semanal
   */
  async triggerRelatorio() {
    const supabase = getClient()
    return supabase
      .schema('pulso_automation' as 'public')
      .from('automation_queue')
      .insert({
        tipo: 'RELATORIO_SEMANAL',
        payload: {},
        origem: 'manual',
      })
  },

  /**
   * Trigger: processar fila (orchestrator)
   */
  async triggerProcessarFila() {
    const supabase = getClient()
    return supabase
      .schema('pulso_automation' as 'public')
      .from('automation_queue')
      .insert({
        tipo: 'PROCESSAR_FILA',
        payload: {},
        origem: 'manual',
      })
  },

  /**
   * Cancela um item pendente na fila
   */
  async cancelar(id: string) {
    const supabase = getClient()
    return supabase
      .schema('pulso_automation' as 'public')
      .from('automation_queue')
      .update({ status: 'CANCELADO' })
      .eq('id', id)
  },

  /**
   * Retry manual de um item com erro
   */
  async retry(id: string) {
    const supabase = getClient()
    return supabase
      .schema('pulso_automation' as 'public')
      .from('automation_queue')
      .update({ status: 'PENDENTE', tentativas: 0 })
      .eq('id', id)
  },
}
