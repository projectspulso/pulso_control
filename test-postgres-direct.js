const { Pool } = require('pg')

// Usando as mesmas credenciais do n8n
const pool = new Pool({
  host: 'db.nlcisbfdiokmipyihtuz.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: process.env.POSTGRES_PASSWORD,
  ssl: { rejectUnauthorized: false }
})

console.log('Connecting to: db.nlcisbfdiokmipyihtuz.supabase.co:5432')

async function testDirectQuery() {
  const client = await pool.connect()
  
  try {
    console.log('✅ Connected to PostgreSQL\n')

    // Test 1: Check schemas
    console.log('1. Checking available schemas...')
    const schemasResult = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name IN ('pulso_content', 'pulso_core', 'public')
      ORDER BY schema_name
    `)
    console.log('Available schemas:', schemasResult.rows)

    // Test 2: Check if tables exist
    console.log('\n2. Checking if tables exist...')
    const tablesResult = await client.query(`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_name IN ('roteiros', 'ideias', 'canais')
      ORDER BY table_schema, table_name
    `)
    console.log('Available tables:', tablesResult.rows)

    // Test 3: Try the actual query
    console.log('\n3. Testing the actual query with parameter...')
    const testRoteiroId = 1 // Ajuste conforme necessário
    
    const queryResult = await client.query(`
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
      WHERE r.id = $1
    `, [testRoteiroId])

    console.log('✅ Query executed successfully!')
    console.log('Rows returned:', queryResult.rowCount)
    console.log('Data:', JSON.stringify(queryResult.rows, null, 2))

  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error('Error details:', error)
  } finally {
    client.release()
    await pool.end()
  }
}

testDirectQuery()
