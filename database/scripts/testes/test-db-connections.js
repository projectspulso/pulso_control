const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://nlcisbfdiokmipyihtuz.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5sY2lzYmZkaW9rbWlweWlodHV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1ODk0OTksImV4cCI6MjA3OTE2NTQ5OX0.-Cfzv9ebOYB8I93zNLghWTszawJk4G3rXwiTTY9PpOI'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testarConexoes() {
  console.log('🔍 TESTANDO CONEXÕES COM O BANCO...\n')

  const testes = [
    { nome: 'Canais (public)', query: () => supabase.from('canais').select('id, nome').limit(3) },
    { nome: 'Ideias (public)', query: () => supabase.from('ideias').select('id, titulo, status').limit(3) },
    { nome: 'Roteiros (public)', query: () => supabase.from('roteiros').select('id, titulo, status').limit(3) },
    { nome: 'Audios (pulso_content)', query: () => supabase.schema('pulso_content').from('audios').select('id, status').limit(3) },
    { nome: 'Pipeline (pulso_content)', query: () => supabase.schema('pulso_content').from('pipeline_producao').select('id, status').limit(3) },
    { nome: 'View n8n_roteiro_completo', query: () => supabase.from('n8n_roteiro_completo').select('roteiro_id, roteiro_titulo').limit(2) },
    { nome: 'View Calendário', query: () => supabase.from('vw_pulso_calendario_publicacao_v2').select('pipeline_id, ideia, pipeline_status').limit(3) },
  ]

  let sucessos = 0
  let falhas = 0

  for (const teste of testes) {
    try {
      const { data, error } = await teste.query()
      
      if (error) {
        console.log(`❌ ${teste.nome}:`, error.message)
        falhas++
      } else {
        console.log(`✅ ${teste.nome}: ${data?.length || 0} registro(s)`)
        if (data && data.length > 0) {
          console.log(`   Exemplo:`, JSON.stringify(data[0], null, 2).substring(0, 150) + '...')
        }
        sucessos++
      }
    } catch (err) {
      console.log(`❌ ${teste.nome}:`, err.message)
      falhas++
    }
    console.log('')
  }

  console.log('\n' + '='.repeat(60))
  console.log(`📊 RESULTADO: ${sucessos} sucessos, ${falhas} falhas`)
  console.log('='.repeat(60))

  if (falhas === 0) {
    console.log('\n✅ TODAS AS CONEXÕES ESTÃO FUNCIONANDO!')
  } else {
    console.log(`\n⚠️  ${falhas} problema(s) encontrado(s)`)
  }
}

testarConexoes()
