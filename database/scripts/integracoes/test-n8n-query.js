const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const testRoteiroId = Number(process.env.TEST_ROTEIRO_ID || 1)

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('ERRO: defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY antes de rodar este script.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testQuery() {
  console.log('Testing direct SQL query via RPC...\n')

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
    `,
  })

  if (error) {
    console.error('ERRO executing query:', error)
  } else {
    console.log('OK: Query executed successfully!')
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
    `,
  })

  if (error2) {
    console.error('ERRO with search_path:', error2)
  } else {
    console.log('OK: Query with search_path executed successfully!')
    console.log('Result:', JSON.stringify(data2, null, 2))
  }
}

testQuery().catch(console.error)
