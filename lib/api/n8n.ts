/**
 * API client do frontend para integrações do n8n.
 * Todo acesso externo passa primeiro pelas rotas server do app.
 */

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

function buildWorkflowErrorMessage(errorBody: {
  error?: string
  details?: unknown
  tried_urls?: string[]
} | null, status: number) {
  const parts: string[] = []

  if (errorBody?.error) {
    parts.push(errorBody.error)
  } else {
    parts.push(`Webhook error: ${status}`)
  }

  if (typeof errorBody?.details === 'string' && errorBody.details.trim()) {
    parts.push(errorBody.details.trim())
  }

  if (Array.isArray(errorBody?.tried_urls) && errorBody.tried_urls.length > 0) {
    parts.push(`URLs testadas: ${errorBody.tried_urls.join(', ')}`)
  }

  return parts.join(' | ')
}

async function parseJsonSafely(response: Response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

export const n8nApi = {
  async getWorkflows(): Promise<N8nWorkflow[]> {
    try {
      const response = await fetch('/api/n8n/workflows')

      if (!response.ok) {
        throw new Error(`n8n API error: ${response.status}`)
      }

      return (await response.json()) || []
    } catch (error) {
      console.error('Erro ao buscar workflows do n8n:', error)
      return []
    }
  },

  async executeWorkflow(webhookPath: string, payload: unknown): Promise<unknown> {
    try {
      const response = await fetch('/api/n8n/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflow: webhookPath,
          payload,
        }),
      })

      if (!response.ok) {
        const errorBody = await parseJsonSafely(response)
        throw new Error(buildWorkflowErrorMessage(errorBody, response.status))
      }

      return await response.json()
    } catch (error) {
      console.error('Erro ao executar workflow:', error)
      throw error
    }
  },

  async getExecutions(workflowId: string, limit = 20): Promise<N8nExecution[]> {
    try {
      const response = await fetch(
        `/api/n8n/executions?workflowId=${workflowId}&limit=${limit}`,
      )

      if (!response.ok) {
        throw new Error(`n8n API error: ${response.status}`)
      }

      return (await response.json()) || []
    } catch (error) {
      console.error('Erro ao buscar execucoes do n8n:', error)
      return []
    }
  },

  workflows: {
    async gerarIdeias(canalId: string, quantidade = 5) {
      return n8nApi.executeWorkflow('gerar-ideias', {
        canal_id: canalId,
        quantidade,
      })
    },

    async gerarRoteiro(ideiaId: string) {
      return n8nApi.executeWorkflow('gerar-roteiro', {
        ideia_id: ideiaId,
      })
    },

    async gerarAudio(roteiroId: string) {
      return n8nApi.executeWorkflow('gerar-audio', {
        roteiro_id: roteiroId,
      })
    },

    async agendarPublicacao(
      pipelineId: string,
      dataHora: string,
      plataformas: string[],
    ) {
      return n8nApi.executeWorkflow('agendar-publicacao', {
        pipeline_id: pipelineId,
        data_hora_publicacao: dataHora,
        plataformas,
      })
    },

    async publicarAgora(pipelineIds: string[], plataformas: string[]) {
      return n8nApi.executeWorkflow('publicar-agora', {
        pipeline_ids: pipelineIds,
        plataformas,
      })
    },
  },
}
