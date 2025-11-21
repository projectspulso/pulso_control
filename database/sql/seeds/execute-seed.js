const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

require('dotenv').config({ path: path.join(__dirname, '../../../.env') })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devem estar no .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
})

async function executeSeed() {
  console.log('🚀 Executando seed completo do projeto PULSO...\n')
  
  const sqlFile = path.join(__dirname, 'seed_complete_project.sql')
  const sql = fs.readFileSync(sqlFile, 'utf-8')
  
  // Dividir o SQL em statements (aproximado)
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--') && s.length > 10)
  
  console.log(`📝 Encontrados ${statements.length} comandos SQL\n`)
  
  let successCount = 0
  let errorCount = 0
  
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i] + ';'
    
    // Pular comentários de bloco
    if (stmt.includes('/*') || stmt.includes('*/')) continue
    if (stmt.startsWith('DO $$')) {
      console.log(`⏭️  Pulando bloco DO (executar manualmente no Supabase SQL Editor)`)
      continue
    }
    
    try {
      console.log(`⏳ [${i + 1}/${statements.length}] Executando...`)
      
      const { error } = await supabase.rpc('exec_sql', { sql_query: stmt }).catch(() => {
        // Se não tiver a função exec_sql, tentar via HTTP direto
        return { error: 'Função exec_sql não disponível' }
      })
      
      if (error && !error.message?.includes('já existe')) {
        console.log(`⚠️  Aviso: ${error.message || error}`)
        errorCount++
      } else {
        successCount++
        console.log(`✅ Sucesso`)
      }
    } catch (err) {
      console.log(`❌ Erro: ${err.message}`)
      errorCount++
    }
  }
  
  console.log('\n========================================')
  console.log(`✅ Comandos executados com sucesso: ${successCount}`)
  console.log(`⚠️  Comandos com aviso/erro: ${errorCount}`)
  console.log('========================================')
  console.log('\n💡 Para executar o seed completo:')
  console.log('   1. Abra o Supabase Dashboard')
  console.log('   2. Vá em SQL Editor')
  console.log('   3. Cole o conteúdo de seed_complete_project.sql')
  console.log('   4. Execute (Run)')
}

executeSeed().catch(console.error)
