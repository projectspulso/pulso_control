import { getSupabaseAdminClient } from '@/lib/supabase/server'

export type WorkflowTriggerKey =
  | 'gerar-ideias'
  | 'gerar-roteiro'
  | 'gerar-audio'
  | 'agendar-publicacao'
  | 'publicar-agora'

interface N8nConfigMap {
  n8n_url?: string
  n8n_api_key?: string
  n8n_webhook_base_url?: string
  n8n_webhook_aprovar_ideia?: string
  n8n_webhook_aprovar_roteiro?: string
}

interface TriggerResult {
  success: boolean
  status: number
  url?: string
  data?: unknown
  error?: string
  details?: unknown
  tried_urls: string[]
}

const WORKFLOW_PATH_CANDIDATES: Record<WorkflowTriggerKey, string[]> = {
  'gerar-ideias': ['gerar-ideias', 'wf00-gerar-ideias'],
  'gerar-roteiro': ['gerar-roteiro', 'ideia-aprovada', 'wf01-gerar-roteiro'],
  'gerar-audio': ['gerar-audio', 'roteiro-aprovado', 'wf02-gerar-audio'],
  'agendar-publicacao': [
    'agendar-publicacao',
    'publicar-conteudo',
    'wf04-agendar-publicacao',
  ],
  'publicar-agora': [
    'publicar-agora',
    'publicar-conteudo',
    'wf04-publicar-agora',
  ],
}

function stripTrailingSlash(value?: string | null) {
  return value?.replace(/\/+$/, '') || ''
}

function parseUnknownJson(rawBody: string) {
  if (!rawBody) {
    return null
  }

  try {
    return JSON.parse(rawBody)
  } catch {
    return rawBody
  }
}

async function getDatabaseN8nConfig(): Promise<N8nConfigMap> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = getSupabaseAdminClient() as any

    const { data, error } = await supabase
      .schema('pulso_core')
      .from('configuracoes')
      .select('chave, valor')
      .eq('categoria', 'n8n')
      .in('chave', [
        'n8n_url',
        'n8n_api_key',
        'n8n_webhook_base_url',
        'n8n_webhook_aprovar_ideia',
        'n8n_webhook_aprovar_roteiro',
      ])

    if (error || !data) {
      return {}
    }

    return data.reduce((acc: N8nConfigMap, item: { chave: string; valor: string }) => {
      acc[item.chave as keyof N8nConfigMap] = item.valor
      return acc
    }, {})
  } catch {
    return {}
  }
}

export async function getN8nRuntimeConfig() {
  const dbConfig = await getDatabaseN8nConfig()

  const baseUrl =
    process.env.N8N_MCP_URL ||
    process.env.N8N_URL ||
    dbConfig.n8n_url ||
    process.env.NEXT_PUBLIC_N8N_URL ||
    ''

  const apiKey =
    process.env.N8N_API_KEY ||
    dbConfig.n8n_api_key ||
    process.env.NEXT_PUBLIC_N8N_API_KEY ||
    ''

  const webhookBaseUrl =
    process.env.N8N_WEBHOOK_BASE_URL ||
    dbConfig.n8n_webhook_base_url ||
    (baseUrl ? `${stripTrailingSlash(baseUrl)}/webhook` : '')

  return {
    baseUrl: stripTrailingSlash(baseUrl),
    apiKey,
    webhookBaseUrl: stripTrailingSlash(webhookBaseUrl),
    webhookSecret: process.env.WEBHOOK_SECRET || '',
    explicitIdeiaWebhook:
      process.env.N8N_WEBHOOK_APROVAR_IDEIA || dbConfig.n8n_webhook_aprovar_ideia || '',
    explicitRoteiroWebhook:
      process.env.N8N_WEBHOOK_APROVAR_ROTEIRO ||
      dbConfig.n8n_webhook_aprovar_roteiro ||
      '',
  }
}

function buildCandidateWebhookUrls(
  workflow: WorkflowTriggerKey,
  config: Awaited<ReturnType<typeof getN8nRuntimeConfig>>,
) {
  const urls = new Set<string>()

  if (workflow === 'gerar-roteiro' && config.explicitIdeiaWebhook) {
    urls.add(config.explicitIdeiaWebhook)
  }

  if (workflow === 'gerar-audio' && config.explicitRoteiroWebhook) {
    urls.add(config.explicitRoteiroWebhook)
  }

  const webhookBaseUrl = stripTrailingSlash(config.webhookBaseUrl)

  for (const path of WORKFLOW_PATH_CANDIDATES[workflow]) {
    if (webhookBaseUrl) {
      urls.add(`${webhookBaseUrl}/${path}`)
    }
  }

  return Array.from(urls)
}

export async function triggerN8nWorkflow(
  workflow: WorkflowTriggerKey,
  payload: unknown,
): Promise<TriggerResult> {
  const config = await getN8nRuntimeConfig()
  const triedUrls: string[] = []
  const candidateUrls = buildCandidateWebhookUrls(workflow, config)

  if (candidateUrls.length === 0) {
    return {
      success: false,
      status: 500,
      error: 'n8n nao configurado para este workflow',
      details:
        'Configure N8N_URL/N8N_WEBHOOK_BASE_URL ou registre a configuracao correspondente no banco.',
      tried_urls: triedUrls,
    }
  }

  for (const url of candidateUrls) {
    triedUrls.push(url)

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.webhookSecret
            ? { 'x-webhook-secret': config.webhookSecret }
            : {}),
        },
        body: JSON.stringify(payload),
      })

      const rawBody = await response.text()
      const parsedBody = parseUnknownJson(rawBody)

      if (response.ok) {
        return {
          success: true,
          status: response.status,
          url,
          data: parsedBody,
          tried_urls: triedUrls,
        }
      }

      if (response.status !== 404) {
        return {
          success: false,
          status: response.status,
          url,
          error: `Webhook retornou ${response.status}`,
          details: parsedBody,
          tried_urls: triedUrls,
        }
      }
    } catch (error) {
      return {
        success: false,
        status: 500,
        url,
        error: error instanceof Error ? error.message : 'Falha ao chamar n8n',
        tried_urls: triedUrls,
      }
    }
  }

  return {
    success: false,
    status: 404,
    error: 'Nenhum webhook compativel respondeu',
    details: `Caminhos tentados: ${triedUrls.join(', ')}`,
    tried_urls: triedUrls,
  }
}

export async function listN8nWorkflows() {
  const config = await getN8nRuntimeConfig()

  if (!config.baseUrl || !config.apiKey) {
    return []
  }

  const response = await fetch(`${config.baseUrl}/api/v1/workflows`, {
    headers: {
      'X-N8N-API-KEY': config.apiKey,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`n8n API error: ${response.status}`)
  }

  const result = await response.json()
  return result.data || []
}

export async function listN8nExecutions(workflowId: string, limit = 20) {
  const config = await getN8nRuntimeConfig()

  if (!config.baseUrl || !config.apiKey || !workflowId) {
    return []
  }

  const response = await fetch(
    `${config.baseUrl}/api/v1/executions?workflowId=${workflowId}&limit=${limit}`,
    {
      headers: {
        'X-N8N-API-KEY': config.apiKey,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    },
  )

  if (!response.ok) {
    throw new Error(`n8n API error: ${response.status}`)
  }

  const result = await response.json()
  return result.data || []
}
