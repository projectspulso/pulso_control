const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://nlcisbfdiokmipyihtuz.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5sY2lzYmZkaW9rbWlweWlodHV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1ODk0OTksImV4cCI6MjA3OTE2NTQ5OX0.-Cfzv9ebOYB8I93zNLghWTszawJk4G3rXwiTTY9PpOI'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testarConexao() {
  console.log('=== TESTE DE CONEXÃO SUPABASE ===\n')
  
  // Teste 1: Canais
  console.log('1. Testando public.canais...')
  const { data: canais, error: erroCanais } = await supabase
    .from('canais')
    .select('id, nome')
    .limit(3)
  
  if (erroCanais) {
    console.log('❌ ERRO:', erroCanais.message)
    console.log('Código:', erroCanais.code)
    console.log('Detalhes:', erroCanais.details)
    console.log('Hint:', erroCanais.hint)
  } else {
    console.log('✅ Sucesso! Total:', canais?.length || 0)
    console.log('Dados:', JSON.stringify(canais, null, 2))
  }
  
  console.log('\n2. Testando public.ideias...')
  const { data: ideias, error: erroIdeias } = await supabase
    .from('ideias')
    .select('id, titulo, status')
    .limit(3)
  
  if (erroIdeias) {
    console.log('❌ ERRO:', erroIdeias.message)
    console.log('Código:', erroIdeias.code)
    console.log('Detalhes:', erroIdeias.details)
  } else {
    console.log('✅ Sucesso! Total:', ideias?.length || 0)
    console.log('Dados:', JSON.stringify(ideias, null, 2))
  }
  
  console.log('\n3. Testando public.vw_pulso_calendario_publicacao_v2...')
  const { data: calendario, error: erroCalendario } = await supabase
    .from('vw_pulso_calendario_publicacao_v2')
    .select('*')
    .limit(3)
  
  if (erroCalendario) {
    console.log('❌ ERRO:', erroCalendario.message)
    console.log('Código:', erroCalendario.code)
    console.log('Detalhes:', erroCalendario.details)
  } else {
    console.log('✅ Sucesso! Total:', calendario?.length || 0)
    console.log('Dados:', JSON.stringify(calendario, null, 2))
  }
  
  console.log('\n4. Testando public.series...')
  const { data: series, error: erroSeries } = await supabase
    .from('series')
    .select('id, nome')
    .limit(3)
  
  if (erroSeries) {
    console.log('❌ ERRO:', erroSeries.message)
    console.log('Código:', erroSeries.code)
  } else {
    console.log('✅ Sucesso! Total:', series?.length || 0)
    console.log('Dados:', JSON.stringify(series, null, 2))
  }
}

testarConexao().catch(console.error)
