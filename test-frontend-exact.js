// Simular exatamente o que o frontend faz
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nlcisbfdiokmipyihtuz.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5sY2lzYmZkaW9rbWlweWlodHV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1ODk0OTksImV4cCI6MjA3OTE2NTQ5OX0.-Cfzv9ebOYB8I93zNLghWTszawJk4G3rXwiTTY9PpOI'

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false
  }
})

console.log('=== TESTE EXATO DO FRONTEND ===\n')
console.log('URL:', supabaseUrl)
console.log('Key (primeiros 50 chars):', supabaseAnonKey.substring(0, 50) + '...\n')

async function testarComoFrontend() {
  // Teste 1: Query simples como o hook useCalendario faz
  console.log('1. Testando vw_pulso_calendario_publicacao_v2 (usado pelo calendario)...')
  const { data: calendario, error: erroCalendario, status: statusCalendario } = await supabase
    .from('vw_pulso_calendario_publicacao_v2')
    .select('*')
    .limit(5)
  
  console.log('Status HTTP:', statusCalendario)
  if (erroCalendario) {
    console.log('❌ ERRO:', erroCalendario)
    console.log('Mensagem:', erroCalendario.message)
    console.log('Code:', erroCalendario.code)
    console.log('Details:', erroCalendario.details)
    console.log('Hint:', erroCalendario.hint)
  } else {
    console.log('✅ Sucesso! Registros:', calendario?.length || 0)
    if (calendario && calendario.length > 0) {
      console.log('Primeiro registro:', JSON.stringify(calendario[0], null, 2))
    }
  }
  
  // Teste 2: Query em ideias
  console.log('\n2. Testando public.ideias...')
  const { data: ideias, error: erroIdeias, count } = await supabase
    .from('ideias')
    .select('*', { count: 'exact' })
    .limit(3)
  
  if (erroIdeias) {
    console.log('❌ ERRO:', erroIdeias.message)
  } else {
    console.log('✅ Sucesso! Total no banco:', count)
    console.log('Registros retornados:', ideias?.length || 0)
    if (ideias && ideias.length > 0) {
      console.log('Primeiro:', ideias[0].titulo)
    }
  }
  
  // Teste 3: Query em canais
  console.log('\n3. Testando public.canais...')
  const { data: canais, error: erroCanais } = await supabase
    .from('canais')
    .select('id, nome')
  
  if (erroCanais) {
    console.log('❌ ERRO:', erroCanais.message)
  } else {
    console.log('✅ Sucesso! Total:', canais?.length || 0)
    console.log('Canais:', canais?.map(c => c.nome).join(', '))
  }
  
  console.log('\n=== RESUMO ===')
  console.log('Se todos os testes passaram, o problema NÃO é de conexão/permissão.')
  console.log('Se falhou com PGRST002, o problema é do servidor Supabase.')
  console.log('Se retornou 0 registros mas sem erro, o problema é RLS nas tabelas base.')
}

testarComoFrontend().catch(console.error)
