const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const n8nBaseUrl = process.env.N8N_URL
const n8nApiKey = process.env.N8N_API_KEY
const n8nMcpUrl = process.env.N8N_MCP_URL || n8nBaseUrl
const n8nWebhookBaseUrl =
  process.env.N8N_WEBHOOK_BASE_URL || (n8nBaseUrl ? `${n8nBaseUrl.replace(/\/$/, '')}/webhook` : '')

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('ERRO: defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY antes de rodar este script.')
  process.exit(1)
}

if (!n8nMcpUrl || !n8nApiKey || !n8nWebhookBaseUrl) {
  console.error('ERRO: defina N8N_MCP_URL ou N8N_URL, N8N_API_KEY e N8N_WEBHOOK_BASE_URL.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function atualizarN8nConfig() {
  console.log('Atualizando configuracoes do n8n...\n')

  const updates = [
    { chave: 'n8n_url', valor: n8nMcpUrl },
    { chave: 'n8n_api_key', valor: n8nApiKey },
    { chave: 'n8n_webhook_base_url', valor: n8nWebhookBaseUrl },
  ]

  for (const update of updates) {
    const { error } = await supabase
      .from('configuracoes')
      .update({ valor: update.valor })
      .eq('categoria', 'n8n')
      .eq('chave', update.chave)

    if (error) {
      console.log(`ERRO ao atualizar ${update.chave}:`, error.message)
    } else {
      console.log(`OK: ${update.chave} atualizado`)
    }
  }

  console.log('\nConfiguracoes atuais:')
  const { data: configs, error: configError } = await supabase
    .from('configuracoes')
    .select('chave, valor')
    .eq('categoria', 'n8n')

  if (configError) {
    console.log('ERRO ao buscar configs:', configError.message)
  } else {
    configs.forEach((config) => {
      console.log(`   ${config.chave}: ${config.valor}`)
    })
  }

  console.log('\nConfiguracao do n8n concluida.')
}

atualizarN8nConfig().catch(console.error)
