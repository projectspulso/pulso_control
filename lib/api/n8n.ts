/**
 * API para integração com n8n
 * Dispara workflows e monitora execuções
 */

const N8N_URL = process.env.N8N_URL || process.env.NEXT_PUBLIC_N8N_URL
const N8N_API_KEY = process.env.N8N_API_KEY || process.env.NEXT_PUBLIC_N8N_API_KEY

interface N8nWorkflow {
  id: string
  name: string
  active: boolean
  tags?: string[]
}

interface N8nExecution {
  id: string
  finished: boolean
  mode: string
  retryOf?: string
  retrySuccessId?: string
  startedAt: string
  stoppedAt?: string
  workflowId: string
  status: 'running' | 'success' | 'error' | 'waiting'
}

export const n8nApi = {
  /**
   * Lista todos os workflows ativos no n8n
   */
  async getWorkflows(): Promise<N8nWorkflow[]> {
    if (!N8N_URL || !N8N_API_KEY) {
      console.warn('n8n não configurado')
      return []
    }

    try {
      const response = await fetch(`${N8N_URL}/api/v1/workflows`, {
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`n8n API error: ${response.status}`)
      }

      const result = await response.json()
      return result.data || []
    } catch (error) {
      console.error('Erro ao buscar workflows do n8n:', error)
      return []
    }
  },

  /**
   * Executa um workflow no n8n via webhook
   */
  async executeWorkflow(webhookPath: string, payload: any): Promise<any> {
    if (!N8N_URL) {
      throw new Error('N8N_URL não configurado')
    }

    try {
      const response = await fetch(`${N8N_URL}/webhook/${webhookPath}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error(`Webhook error: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Erro ao executar workflow:', error)
      throw error
    }
  },

  /**
   * Busca execuções recentes de um workflow
   */
  async getExecutions(workflowId: string, limit = 20): Promise<N8nExecution[]> {
    if (!N8N_URL || !N8N_API_KEY) {
      console.warn('n8n não configurado')
      return []
    }

    try {
      const response = await fetch(
        `${N8N_URL}/api/v1/executions?workflowId=${workflowId}&limit=${limit}`,
        {
          headers: {
            'X-N8N-API-KEY': N8N_API_KEY,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`n8n API error: ${response.status}`)
      }

      const result = await response.json()
      return result.data || []
    } catch (error) {
      console.error('Erro ao buscar execuções do n8n:', error)
      return []
    }
  },

  /**
   * Workflows específicos do PULSO
   */
  workflows: {
    /**
     * WF00 - Gera ideias automaticamente para um canal
     */
    async gerarIdeias(canalId: string, quantidade: number = 5) {
      return n8nApi.executeWorkflow('gerar-ideias', {
        canal_id: canalId,
        quantidade
      })
    },

    /**
     * WF01 - Gera roteiro a partir de uma ideia aprovada
     */
    async gerarRoteiro(ideiaId: string) {
      return n8nApi.executeWorkflow('ideia-aprovada', {
        ideia_id: ideiaId
      })
    },

    /**
     * WF02 - Gera áudio TTS a partir de um roteiro aprovado
     */
    async gerarAudio(roteiroId: string) {
      return n8nApi.executeWorkflow('roteiro-aprovado', {
        roteiro_id: roteiroId
      })
    },

    /**
     * WF04 - Agenda publicação de conteúdo
     */
    async agendarPublicacao(pipelineId: string, dataHora: string, plataformas: string[]) {
      return n8nApi.executeWorkflow('agendar-publicacao', {
        pipeline_id: pipelineId,
        data_hora_publicacao: dataHora,
        plataformas
      })
    },

    /**
     * WF04 - Publica múltiplos conteúdos imediatamente
     */
    async publicarAgora(pipelineIds: string[], plataformas: string[]) {
      return n8nApi.executeWorkflow('publicar-agora', {
        pipeline_ids: pipelineIds,
        plataformas
      })
    }
  }
}
