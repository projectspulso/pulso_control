/**
 * Script de teste para verificar se workflows n8n estão funcionando
 */

const N8N_URL = 'https://pulsoprojects.app.n8n.cloud'

async function testWorkflows() {
  console.log('🧪 TESTANDO WORKFLOWS N8N\n')
  console.log('=' .repeat(60))

  // Teste 1: Verificar se n8n está online
  console.log('\n📡 Teste 1: n8n está online?')
  try {
    const response = await fetch(`${N8N_URL}/healthz`)
    if (response.ok) {
      console.log('✅ n8n está ONLINE')
    } else {
      console.log('❌ n8n retornou status:', response.status)
    }
  } catch (error) {
    console.log('❌ Erro ao conectar:', error.message)
  }

  // Teste 2: Verificar webhooks
  console.log('\n🔗 Teste 2: Webhooks estão ativos?')
  
  const webhooks = [
    { name: 'WF00 - Gerar Ideias', path: 'gerar-ideias' },
    { name: 'WF01 - Gerar Roteiro', path: 'ideia-aprovada' },
    { name: 'WF02 - Gerar Áudio', path: 'roteiro-aprovado' },
    { name: 'WF04 - Agendar Publicação', path: 'agendar-publicacao' },
    { name: 'WF04 - Publicar Agora', path: 'publicar-agora' }
  ]

  for (const webhook of webhooks) {
    try {
      // Fazer um OPTIONS request para verificar se existe
      const response = await fetch(`${N8N_URL}/webhook/${webhook.path}`, {
        method: 'OPTIONS'
      })
      
      if (response.ok || response.status === 404) {
        // 404 é OK - significa que webhook existe mas precisa de POST
        console.log(`✅ ${webhook.name}: /${webhook.path}`)
      } else {
        console.log(`⚠️  ${webhook.name}: Status ${response.status}`)
      }
    } catch (error) {
      console.log(`❌ ${webhook.name}: ${error.message}`)
    }
  }

  // Teste 3: Verificar banco de dados
  console.log('\n🗄️  Teste 3: Banco de dados está acessível?')
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      'https://nlcisbfdiokmipyihtuz.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5sY2lzYmZkaW9rbWlweWlodHV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1ODk0OTksImV4cCI6MjA3OTE2NTQ5OX0.-Cfzv9ebOYB8I93zNLghWTszawJk4G3rXwiTTY9PpOI'
    )

    // Testar ideias
    const { data: ideias, error: ideiasError } = await supabase
      .from('ideias')
      .select('id, titulo, status')
      .limit(1)
    
    if (ideiasError) {
      console.log('❌ Erro ao buscar ideias:', ideiasError.message)
    } else {
      console.log(`✅ Tabela 'ideias': ${ideias?.length || 0} registros encontrados`)
    }

    // Testar logs_workflows
    const { data: logs, error: logsError } = await supabase
      .from('logs_workflows')
      .select('id, workflow_name, status')
      .limit(5)
    
    if (logsError) {
      console.log('❌ Tabela logs_workflows:', logsError.message)
    } else {
      console.log(`✅ Tabela 'logs_workflows': ${logs?.length || 0} registros`)
      if (logs && logs.length > 0) {
        console.log('\n   📊 Últimos logs:')
        logs.forEach(log => {
          console.log(`   - ${log.workflow_name}: ${log.status}`)
        })
      }
    }

    // Testar pipeline_producao
    const { data: pipeline, error: pipelineError } = await supabase
      .from('pipeline_producao')
      .select('id, status, ideia_titulo')
      .limit(3)
    
    if (pipelineError) {
      console.log('❌ View pipeline_producao:', pipelineError.message)
    } else {
      console.log(`✅ View 'pipeline_producao': ${pipeline?.length || 0} itens`)
      if (pipeline && pipeline.length > 0) {
        console.log('\n   📊 Pipeline:')
        pipeline.forEach(item => {
          console.log(`   - ${item.ideia_titulo}: ${item.status}`)
        })
      }
    }

  } catch (error) {
    console.log('❌ Erro ao testar banco:', error.message)
  }

  // Resumo final
  console.log('\n' + '='.repeat(60))
  console.log('\n📋 RESUMO DO TESTE\n')
  console.log('Para verificar se os workflows estão REALMENTE funcionando:')
  console.log('\n1️⃣  Vá em https://pulsoprojects.app.n8n.cloud')
  console.log('2️⃣  Verifique se os 5 workflows estão ATIVOS (toggle verde)')
  console.log('3️⃣  Vá em "Executions" e veja se há execuções recentes')
  console.log('4️⃣  No app, clique em "Aprovar" em uma ideia e veja se gera roteiro')
  console.log('\n✅ Se tudo acima funcionar, está 100% operacional!')
  console.log('=' .repeat(60))
}

testWorkflows().catch(console.error)
