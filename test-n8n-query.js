const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://nlcisbfdiokmipyihtuz.supabase.co'
// Using service role key for full access (como o n8n provavelmente está usando)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5sY2lzYmZkaW9rbWlweWlodHV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1ODk0OTksImV4cCI6MjA3OTE2NTQ5OX0.-Cfzv9ebOYB8I93zNLghWTszawJk4G3rXwiTTY9PpOI'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testQuery() {
  console.log('Testing direct SQL query via RPC...\n')

  const testRoteiroId = 1 // Ajuste se necessário

  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      SELECT 
          r.id as roteiro_id,
          r.ideia_id,
          r.titulo as roteiro_titulo,
          r.conteudo_md,
          r.duracao_estimado_segundos,
          r.status as roteiro_status,
          r.metadata as metadata_roteiro,
          i.canal_id,
          c.nome as canal_nome,
          i.titulo as ideia_titulo,
          i.metadata as metadata_ideia
      FROM pulso_content.roteiros r
      JOIN pulso_content.ideias i ON i.id = r.ideia_id
      LEFT JOIN pulso_core.canais c ON c.id = i.canal_id
      WHERE r.id = ${testRoteiroId}
    `
  })

  if (error) {
    console.error('❌ Error executing query:', error)
  } else {
    console.log('✅ Query executed successfully!')
    console.log('Result:', JSON.stringify(data, null, 2))
  }

  console.log('\n---\nAlternative: Testing with explicit search_path...\n')
  
  const { data: data2, error: error2 } = await supabase.rpc('exec_sql', {
    query: `
      SET search_path TO pulso_content, pulso_core, public;
      SELECT 
          r.id as roteiro_id,
          r.ideia_id,
          r.titulo as roteiro_titulo,
          r.conteudo_md,
          r.duracao_estimado_segundos,
          r.status as roteiro_status,
          r.metadata as metadata_roteiro,
          i.canal_id,
          c.nome as canal_nome,
          i.titulo as ideia_titulo,
          i.metadata as metadata_ideia
      FROM roteiros r
      JOIN ideias i ON i.id = r.ideia_id
      LEFT JOIN canais c ON c.id = i.canal_id
      WHERE r.id = ${testRoteiroId}
    `
  })

  if (error2) {
    console.error('❌ Error with search_path:', error2)
  } else {
    console.log('✅ Query with search_path executed successfully!')
    console.log('Result:', JSON.stringify(data2, null, 2))
  }
}

testQuery()
