// Script de teste direto do Supabase
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://nlcisbfdiokmipyihtuz.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5sY2lzYmZkaW9rbWlweWlodHV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1ODk0OTksImV4cCI6MjA3OTE2NTQ5OX0.-Cfzv9ebOYB8I93zNLghWTszawJk4G3rXwiTTY9PpOI'

console.log('🔍 Testando conexão Supabase...\n')
console.log('URL:', supabaseUrl)
console.log('Key:', supabaseKey.substring(0, 20) + '...')
console.log('')

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    console.log('📊 Testando queries...\n')

    // Teste 1: Views no public
    console.log('1️⃣ Testando view public.ideias:')
    const { data: ideiasPublic, error: errorPublic } = await supabase
      .from('ideias')
      .select('*', { count: 'exact' })
    
    if (errorPublic) {
      console.log('   ❌ Erro:', errorPublic.message)
      console.log('   Código:', errorPublic.code)
      console.log('   Detalhes:', errorPublic.details)
    } else {
      console.log('   ✅ Sucesso! Total:', ideiasPublic?.length || 0)
      if (ideiasPublic?.[0]) {
        console.log('   Primeira ideia:', ideiasPublic[0].titulo)
      }
    }
    console.log('')

    // Teste 2: Schema direto
    console.log('2️⃣ Testando tabela pulso_content.ideias direto:')
    const { data: ideiasSchema, error: errorSchema } = await supabase
      .schema('pulso_content')
      .from('ideias')
      .select('*', { count: 'exact' })
    
    if (errorSchema) {
      console.log('   ❌ Erro:', errorSchema.message)
    } else {
      console.log('   ✅ Sucesso! Total:', ideiasSchema?.length || 0)
    }
    console.log('')

    // Teste 3: Canais
    console.log('3️⃣ Testando canais:')
    const { data: canais, error: errorCanais } = await supabase
      .from('canais')
      .select('*')
    
    if (errorCanais) {
      console.log('   ❌ Erro:', errorCanais.message)
    } else {
      console.log('   ✅ Canais:', canais?.length || 0)
      canais?.forEach(c => console.log('      -', c.nome, `(${c.slug})`))
    }
    console.log('')

    // Teste 4: Séries
    console.log('4️⃣ Testando séries:')
    const { data: series, error: errorSeries } = await supabase
      .from('series')
      .select('*')
    
    if (errorSeries) {
      console.log('   ❌ Erro:', errorSeries.message)
    } else {
      console.log('   ✅ Séries:', series?.length || 0)
      series?.forEach(s => console.log('      -', s.nome, `(${s.slug})`))
    }
    console.log('')

    // Teste 5: SQL direto via RPC (se houver)
    console.log('5️⃣ Listando schemas disponíveis:')
    const { data: schemas, error: errorSchemas } = await supabase
      .rpc('exec_sql', { 
        query: `SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'pulso_%' ORDER BY schema_name` 
      })
      .catch(() => ({ data: null, error: { message: 'RPC não disponível' } }))
    
    if (errorSchemas) {
      console.log('   ⚠️  RPC não disponível (normal)')
    } else {
      console.log('   ✅ Schemas:', schemas)
    }

  } catch (err) {
    console.error('💥 Erro fatal:', err.message)
  }
}

testConnection()
