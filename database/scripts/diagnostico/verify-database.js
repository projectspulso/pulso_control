// Script completo de verificação do banco Supabase
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://nlcisbfdiokmipyihtuz.supabase.co'
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

// Tabelas esperadas no schema public (views)
const publicViews = [
  'canais',
  'series', 
  'ideias',
  'roteiros',
  'pipeline_producao',
  'conteudos_producao',
  'publicacoes',
  'plataformas'
]

// Tabelas esperadas no schema pulso_content
const coreSchema = 'pulso_content'
const coreTables = [
  'canais',
  'series',
  'ideias', 
  'roteiros',
  'conteudos_producao'
]

async function verifyDatabase() {
  console.log('🔍 VERIFICAÇÃO COMPLETA DO BANCO SUPABASE\n')
  console.log('=' .repeat(60))
  console.log('URL:', supabaseUrl)
  console.log('=' .repeat(60))
  console.log('')

  let hasErrors = false

  // 1. Verificar todas as views/tabelas no public
  console.log('📋 1. VERIFICANDO VIEWS NO SCHEMA PUBLIC\n')
  for (const table of publicViews) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: false })
        .limit(5)
      
      if (error) {
        console.log(`   ❌ ${table.padEnd(25)} | ERRO: ${error.message}`)
        console.log(`      Código: ${error.code} | Detalhes: ${error.details || 'N/A'}`)
        hasErrors = true
      } else {
        const recordCount = data?.length || 0
        const status = recordCount > 0 ? '✅' : '⚠️ '
        console.log(`   ${status} ${table.padEnd(25)} | ${recordCount} registros`)
        
        // Mostrar primeira linha se tiver dados
        if (data && data[0]) {
          const keys = Object.keys(data[0]).slice(0, 5).join(', ')
          console.log(`      Colunas: ${keys}...`)
        }
      }
    } catch (err) {
      console.log(`   ❌ ${table.padEnd(25)} | EXCEÇÃO: ${err.message}`)
      hasErrors = true
    }
  }
  console.log('')

  // 2. Verificar tabelas no schema pulso_content
  console.log('📦 2. VERIFICANDO TABELAS NO SCHEMA pulso_content\n')
  for (const table of coreTables) {
    try {
      const { data, error } = await supabase
        .schema(coreSchema)
        .from(table)
        .select('*', { count: 'exact' })
        .limit(5)
      
      if (error) {
        console.log(`   ❌ ${table.padEnd(25)} | ERRO: ${error.message}`)
        hasErrors = true
      } else {
        const recordCount = data?.length || 0
        const status = recordCount > 0 ? '✅' : '⚠️ '
        console.log(`   ${status} ${table.padEnd(25)} | ${recordCount} registros`)
      }
    } catch (err) {
      console.log(`   ❌ ${table.padEnd(25)} | EXCEÇÃO: ${err.message}`)
      hasErrors = true
    }
  }
  console.log('')

  // 3. Testar relações (joins)
  console.log('🔗 3. VERIFICANDO RELAÇÕES\n')
  
  // Ideias com canais e séries
  try {
    const { data, error } = await supabase
      .from('ideias')
      .select(`
        id,
        titulo,
        canais!inner (
          id,
          nome,
          slug
        ),
        series!inner (
          id,
          nome,
          slug
        )
      `)
      .limit(3)
    
    if (error) {
      console.log('   ❌ Relação ideias → canais → series | ERRO:', error.message)
      hasErrors = true
    } else {
      console.log(`   ✅ Relação ideias → canais → series | ${data?.length || 0} registros`)
      if (data && data[0]) {
        console.log(`      Exemplo: "${data[0].titulo}" no canal "${data[0].canais?.nome}"`)
      }
    }
  } catch (err) {
    console.log('   ❌ Relação ideias → canais → series | EXCEÇÃO:', err.message)
    hasErrors = true
  }
  console.log('')

  // Conteúdos produção com ideias/roteiros
  try {
    const { data, error } = await supabase
      .from('conteudos_producao')
      .select(`
        id,
        titulo,
        status,
        ideias (titulo),
        roteiros (titulo)
      `)
      .limit(3)
    
    if (error) {
      console.log('   ❌ Relação conteudos_producao → ideias/roteiros | ERRO:', error.message)
      hasErrors = true
    } else {
      console.log(`   ✅ Relação conteudos_producao → ideias/roteiros | ${data?.length || 0} registros`)
    }
  } catch (err) {
    console.log('   ❌ Relação conteudos_producao → ideias/roteiros | EXCEÇÃO:', err.message)
    hasErrors = true
  }
  console.log('')

  // 4. Verificar dados básicos
  console.log('📊 4. RESUMO DE DADOS\n')
  
  const tables = ['canais', 'series', 'ideias', 'roteiros', 'conteudos_producao', 'publicacoes']
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
      
      if (!error) {
        const status = count > 0 ? '✅' : '⚠️  VAZIO'
        console.log(`   ${status} ${table.padEnd(25)} | Total: ${count || 0}`)
      }
    } catch (err) {
      console.log(`   ❌ ${table.padEnd(25)} | ERRO: ${err.message}`)
    }
  }
  console.log('')

  // 5. Verificar estrutura de colunas
  console.log('🏗️  5. ESTRUTURA DAS TABELAS PRINCIPAIS\n')
  
  for (const table of ['canais', 'series', 'ideias']) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1)
      
      if (!error && data && data[0]) {
        const columns = Object.keys(data[0])
        console.log(`   ✅ ${table}:`)
        console.log(`      Colunas (${columns.length}): ${columns.join(', ')}`)
      } else if (!error) {
        console.log(`   ⚠️  ${table}: Sem dados para verificar estrutura`)
      }
    } catch (err) {
      console.log(`   ❌ ${table}: ${err.message}`)
    }
    console.log('')
  }

  // 6. Resumo final
  console.log('=' .repeat(60))
  if (hasErrors) {
    console.log('⚠️  VERIFICAÇÃO CONCLUÍDA COM ERROS')
    console.log('Verifique os erros acima e corrija as views/tabelas no Supabase')
  } else {
    console.log('✅ VERIFICAÇÃO CONCLUÍDA COM SUCESSO!')
    console.log('Todas as views e tabelas estão acessíveis')
  }
  console.log('=' .repeat(60))
}

verifyDatabase().catch(err => {
  console.error('💥 ERRO FATAL:', err.message)
  console.error(err)
  process.exit(1)
})
