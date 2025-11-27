const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://nlcisbfdiokmipyihtuz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5sY2lzYmZkaW9rbWlweWlodHV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1ODk0OTksImV4cCI6MjA3OTE2NTQ5OX0.-Cfzv9ebOYB8I93zNLghWTszawJk4G3rXwiTTY9PpOI'
)

async function atualizarN8nConfig() {
  console.log('🔧 Atualizando configurações do n8n...\n')

  // Usar RPC para atualizar diretamente na tabela pulso_core.configuracoes
  const updates = [
    { chave: 'n8n_url', valor: 'https://pulsoprojects.app.n8n.cloud/mcp-server/http' },
    { chave: 'n8n_api_key', valor: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzZmYzNmJhMy1lMzM1LTRlYWItYmEyNi03NGVkM2YwOTIyN2IiLCJpc3MiOiJuOG4iLCJhdWQiOiJtY3Atc2VydmVyLWFwaSIsImp0aSI6IjUyZjIzOWI1LTM0NDQtNDllYS05N2Y2LTU5NzQ3MDQxNmVlYyIsImlhdCI6MTc2NDE5NzYzN30.Owq98NDZKQoDlzjuO4pfx-qU6fevyJG0jYds3hj5F-w' },
    { chave: 'n8n_webhook_base_url', valor: 'https://pulsoprojects.app.n8n.cloud/webhook' }
  ]

  for (const update of updates) {
    const { error } = await supabase.rpc('exec', {
      query: `UPDATE pulso_core.configuracoes SET valor = '${update.valor}' WHERE chave = '${update.chave}'`
    })
    
    if (error) {
      console.log(`❌ Erro ao atualizar ${update.chave}:`, error.message)
    } else {
      console.log(`✅ ${update.chave} atualizado`)
    }
  }

  // Verificar configurações
  console.log('\n📋 Configurações atuais:')
  const { data: configs, error: configError } = await supabase
    .from('configuracoes')
    .select('*')
    .eq('categoria', 'n8n')

  if (configError) {
    console.log('❌ Erro ao buscar configs:', configError.message)
  } else {
    configs.forEach(c => {
      console.log(`   ${c.chave}: ${c.valor}`)
    })
  }

  console.log('\n✅ Configuração do n8n concluída!')
}

atualizarN8nConfig().catch(console.error)
