const https = require('https')

// Testar endpoint direto do PostgREST
const options = {
  hostname: 'nlcisbfdiokmipyihtuz.supabase.co',
  port: 443,
  path: '/rest/v1/',
  method: 'GET',
  headers: {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5sY2lzYmZkaW9rbWlweWlodHV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1ODk0OTksImV4cCI6MjA3OTE2NTQ5OX0.-Cfzv9ebOYB8I93zNLghWTszawJk4G3rXwiTTY9PpOI'
  }
}

console.log('=== TESTE DE CONECTIVIDADE SUPABASE ===\n')
console.log('1. Testando endpoint raiz do PostgREST...')

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`)
  console.log('Headers:', JSON.stringify(res.headers, null, 2))
  
  let data = ''
  res.on('data', (chunk) => {
    data += chunk
  })
  
  res.on('end', () => {
    console.log('\nResposta:', data)
    
    if (res.statusCode === 503) {
      console.log('\n❌ SERVIDOR SUPABASE ESTÁ COM PROBLEMA!')
      console.log('O PostgREST não está conseguindo se conectar ao banco.')
      console.log('\nPossíveis causas:')
      console.log('1. O projeto Supabase está pausado ou com problemas')
      console.log('2. Há um problema de configuração no servidor')
      console.log('3. O banco de dados não está respondendo')
    } else if (res.statusCode === 200) {
      console.log('\n✅ PostgREST está funcionando!')
    }
  })
})

req.on('error', (error) => {
  console.error('❌ Erro de conexão:', error.message)
})

req.end()
