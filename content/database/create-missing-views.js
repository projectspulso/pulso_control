const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

require('dotenv').config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function createMissingViews() {
  console.log('🔧 Criando views faltantes no schema public...\n')
  
  const views = [
    { name: 'workflows', source: 'pulso_automation.workflows' },
    { name: 'workflow_execucoes', source: 'pulso_automation.workflow_execucoes' },
    { name: 'conteudos', source: 'pulso_content.conteudos' },
    { name: 'conteudo_variantes', source: 'pulso_content.conteudo_variantes' },
    { name: 'posts', source: 'pulso_distribution.posts' },
    { name: 'posts_logs', source: 'pulso_distribution.posts_logs' },
    { name: 'canais_plataformas', source: 'pulso_core.canais_plataformas' },
    { name: 'assets', source: 'pulso_assets.assets' },
    { name: 'eventos', source: 'pulso_analytics.eventos' }
  ]
  
  console.log('📝 Views a serem criadas:')
  views.forEach(v => console.log(`   - public.${v.name} → ${v.source}`))
  console.log()
  
  console.log('⚠️  IMPORTANTE:')
  console.log('   Este script NÃO pode criar views via API do Supabase.')
  console.log('   Você precisa executar manualmente no SQL Editor:\n')
  console.log('   1. Abra o Supabase Dashboard')
  console.log('   2. Vá em SQL Editor')
  console.log('   3. Cole o seguinte SQL:\n')
  
  views.forEach(v => {
    console.log(`DROP VIEW IF EXISTS public.${v.name} CASCADE;`)
    console.log(`CREATE VIEW public.${v.name} AS SELECT * FROM ${v.source};`)
    console.log()
  })
  
  console.log('\n💡 Ou copie o arquivo: content/database/create_missing_views.sql')
  console.log('\n✅ Depois de executar o SQL, recarregue o dashboard!')
}

createMissingViews()
