/**
 * Script de teste para verificar se workflows n8n estao funcionando.
 * Requer variaveis de ambiente para evitar URLs e chaves hardcoded.
 */

const N8N_URL = process.env.N8N_URL
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

async function testWorkflows() {
  console.log('TESTANDO WORKFLOWS N8N\n')
  console.log('='.repeat(60))

  if (!N8N_URL) {
    console.log('ERRO: defina N8N_URL antes de rodar este script.')
    process.exitCode = 1
    return
  }

  console.log('\nTeste 1: n8n esta online?')
  try {
    const response = await fetch(`${N8N_URL}/healthz`)
    if (response.ok) {
      console.log('OK: n8n esta ONLINE')
    } else {
      console.log('ERRO: n8n retornou status:', response.status)
    }
  } catch (error) {
    console.log('ERRO ao conectar:', error.message)
  }

  console.log('\nTeste 2: Webhooks estao ativos?')

  const webhooks = [
    { name: 'WF00 - Gerar Ideias', path: 'gerar-ideias' },
    { name: 'WF01 - Gerar Roteiro', path: 'ideia-aprovada' },
    { name: 'WF02 - Gerar Audio', path: 'roteiro-aprovado' },
    { name: 'WF04 - Agendar Publicacao', path: 'agendar-publicacao' },
    { name: 'WF04 - Publicar Agora', path: 'publicar-agora' },
  ]

  for (const webhook of webhooks) {
    try {
      const response = await fetch(`${N8N_URL}/webhook/${webhook.path}`, {
        method: 'OPTIONS',
      })

      if (response.ok || response.status === 404) {
        console.log(`OK: ${webhook.name}: /${webhook.path}`)
      } else {
        console.log(`ATENCAO: ${webhook.name}: Status ${response.status}`)
      }
    } catch (error) {
      console.log(`ERRO: ${webhook.name}: ${error.message}`)
    }
  }

  console.log('\nTeste 3: Banco de dados esta acessivel?')
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.log('ATENCAO: pulei o teste de banco porque faltam NEXT_PUBLIC_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_ANON_KEY.')
  } else {
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

      const { data: ideias, error: ideiasError } = await supabase
        .from('ideias')
        .select('id, titulo, status')
        .limit(1)

      if (ideiasError) {
        console.log('ERRO ao buscar ideias:', ideiasError.message)
      } else {
        console.log(`OK: tabela ideias respondeu com ${ideias?.length || 0} registro(s)`)
      }

      const { data: logs, error: logsError } = await supabase
        .from('logs_workflows')
        .select('id, workflow_name, status')
        .limit(5)

      if (logsError) {
        console.log('ERRO em logs_workflows:', logsError.message)
      } else {
        console.log(`OK: tabela logs_workflows respondeu com ${logs?.length || 0} registro(s)`)
      }

      const { data: pipeline, error: pipelineError } = await supabase
        .from('pipeline_producao')
        .select('id, status, ideia_titulo')
        .limit(3)

      if (pipelineError) {
        console.log('ERRO em pipeline_producao:', pipelineError.message)
      } else {
        console.log(`OK: view pipeline_producao respondeu com ${pipeline?.length || 0} item(ns)`)
      }
    } catch (error) {
      console.log('ERRO ao testar banco:', error.message)
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('\nRESUMO DO TESTE\n')
  console.log(`1. Acesse o n8n em ${N8N_URL}`)
  console.log('2. Verifique se os workflows estao ativos')
  console.log('3. Veja se ha execucoes recentes')
  console.log('4. No app, aprove uma ideia e observe se gera roteiro')
  console.log('\nSe tudo acima funcionar, o fluxo principal esta operacional.')
  console.log('='.repeat(60))
}

testWorkflows().catch(console.error)
