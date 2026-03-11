// Simula exatamente o que o frontend faz, mas sem hardcodes sensiveis.
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('ERRO: defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY antes de rodar este script.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
})

console.log('=== TESTE EXATO DO FRONTEND ===\n')
console.log('URL:', supabaseUrl)
console.log('Key (primeiros 12 chars):', `${supabaseAnonKey.substring(0, 12)}...\n`)

async function testarComoFrontend() {
  console.log('1. Testando vw_pulso_calendario_publicacao_v2 (usado pelo calendario)...')
  const { data: calendario, error: erroCalendario, status: statusCalendario } = await supabase
    .from('vw_pulso_calendario_publicacao_v2')
    .select('*')
    .limit(5)

  console.log('Status HTTP:', statusCalendario)
  if (erroCalendario) {
    console.log('ERRO:', erroCalendario)
    console.log('Mensagem:', erroCalendario.message)
    console.log('Code:', erroCalendario.code)
    console.log('Details:', erroCalendario.details)
    console.log('Hint:', erroCalendario.hint)
  } else {
    console.log('OK: Sucesso! Registros:', calendario?.length || 0)
    if (calendario && calendario.length > 0) {
      console.log('Primeiro registro:', JSON.stringify(calendario[0], null, 2))
    }
  }

  console.log('\n2. Testando public.ideias...')
  const { data: ideias, error: erroIdeias, count } = await supabase
    .from('ideias')
    .select('*', { count: 'exact' })
    .limit(3)

  if (erroIdeias) {
    console.log('ERRO:', erroIdeias.message)
  } else {
    console.log('OK: Sucesso! Total no banco:', count)
    console.log('Registros retornados:', ideias?.length || 0)
    if (ideias && ideias.length > 0) {
      console.log('Primeiro:', ideias[0].titulo)
    }
  }

  console.log('\n3. Testando public.canais...')
  const { data: canais, error: erroCanais } = await supabase
    .from('canais')
    .select('id, nome')

  if (erroCanais) {
    console.log('ERRO:', erroCanais.message)
  } else {
    console.log('OK: Sucesso! Total:', canais?.length || 0)
    console.log('Canais:', canais?.map((canal) => canal.nome).join(', '))
  }

  console.log('\n=== RESUMO ===')
  console.log('Se todos os testes passaram, o problema nao e de conexao/permissao.')
  console.log('Se falhou com PGRST002, o problema pode estar no servidor Supabase.')
  console.log('Se retornou 0 registros mas sem erro, o problema pode ser RLS nas tabelas base.')
}

testarComoFrontend().catch(console.error)
