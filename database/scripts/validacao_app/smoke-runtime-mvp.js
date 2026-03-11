// Smoke test do runtime do MVP usando a mesma chave publica do app.
// Uso:
//   node database/scripts/validacao_app/smoke-runtime-mvp.js
//
// Requer:
// - .env.local com NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY
//   ou variaveis equivalentes no ambiente atual.

const path = require('path')
const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'ERRO: defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY em .env.local ou no ambiente atual.',
  )
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
})

function summarizeError(error) {
  if (!error) {
    return null
  }

  return {
    code: error.code || null,
    message: error.message || 'Erro sem mensagem',
  }
}

async function queryWithFallback() {
  const publicLogs = await supabase
    .from('logs_workflows')
    .select('id, workflow_name, status, created_at')
    .limit(5)

  if (!publicLogs.error) {
    return {
      source: 'public.logs_workflows',
      result: publicLogs,
    }
  }

  const privateLogs = await supabase
    .schema('pulso_content')
    .from('logs_workflows')
    .select('id, workflow_name, status, created_at')
    .limit(5)

  return {
    source: 'pulso_content.logs_workflows',
    result: privateLogs,
  }
}

async function main() {
  console.log('=== SMOKE RUNTIME MVP ===\n')

  const ideias = await supabase
    .from('ideias')
    .select('id, titulo, status', { count: 'exact' })
    .limit(5)

  const queue = await supabase
    .schema('pulso_content')
    .from('workflow_queue')
    .select('id, workflow_name, status, tentativas, max_tentativas, created_at')
    .limit(5)

  const configs = await supabase
    .schema('pulso_core')
    .from('configuracoes')
    .select('chave, categoria, updated_at')
    .limit(5)

  const logs = await queryWithFallback()

  const summary = {
    ideias: {
      ok: !ideias.error,
      count: ideias.count ?? ideias.data?.length ?? 0,
      error: summarizeError(ideias.error),
    },
    workflow_queue: {
      ok: !queue.error,
      rows: queue.data?.length ?? 0,
      error: summarizeError(queue.error),
    },
    configuracoes_core: {
      ok: !configs.error,
      rows: configs.data?.length ?? 0,
      error: summarizeError(configs.error),
    },
    logs_workflows: {
      ok: !logs.result.error,
      source: logs.source,
      rows: logs.result.data?.length ?? 0,
      error: summarizeError(logs.result.error),
    },
  }

  console.log(JSON.stringify(summary, null, 2))

  const hasFailure = Object.values(summary).some((item) => !item.ok)

  if (hasFailure) {
    process.exit(1)
  }
}

main().catch((error) => {
  console.error(error.message || error)
  process.exit(1)
})
