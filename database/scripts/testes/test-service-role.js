const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://nlcisbfdiokmipyihtuz.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5sY2lzYmZkaW9rbWlweWlodHV6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzU4OTQ5OSwiZXhwIjoyMDc5MTY1NDk5fQ.kcWYlOZ8Jn_c4Hb1uw-SVkzW-eXUkr-k2zFiEn7vHQ4'

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

async function testarComServiceRole() {
  console.log('=== TESTE COM SERVICE ROLE KEY ===\n')
  console.log('Service Role tem permissões TOTAIS, bypassa RLS completamente.\n')
  
  console.log('1. Testando public.canais com SERVICE ROLE...')
  const { data: canais, error: erroCanais } = await supabaseAdmin
    .from('canais')
    .select('id, nome')
    .limit(3)
  
  if (erroCanais) {
    console.log('❌ ERRO:', erroCanais.message)
    console.log('Código:', erroCanais.code)
    console.log('\n⚠️  PROBLEMA CRÍTICO: Até SERVICE ROLE está falhando!')
    console.log('Isso indica que o PostgREST do Supabase não consegue conectar ao banco.')
    console.log('\nSOLUÇÕES:')
    console.log('1. Vá ao painel do Supabase: https://app.supabase.com/')
    console.log('2. Verifique se o projeto está ATIVO (não pausado)')
    console.log('3. Vá em Settings > API > Restart')
    console.log('4. Aguarde 30 segundos e teste novamente')
  } else {
    console.log('✅ Sucesso! Total:', canais?.length || 0)
    console.log('Dados:', JSON.stringify(canais, null, 2))
    console.log('\n✅ SERVICE ROLE FUNCIONA!')
    console.log('O problema é específico do role ANON.')
  }
  
  console.log('\n2. Testando public.ideias com SERVICE ROLE...')
  const { data: ideias, error: erroIdeias } = await supabaseAdmin
    .from('ideias')
    .select('id, titulo')
    .limit(3)
  
  if (erroIdeias) {
    console.log('❌ ERRO:', erroIdeias.message)
  } else {
    console.log('✅ Sucesso! Total:', ideias?.length || 0)
    console.log('Dados:', JSON.stringify(ideias, null, 2))
  }
}

testarComServiceRole().catch(console.error)
