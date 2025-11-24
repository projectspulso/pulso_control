// Script para verificar duplicidades via Supabase SDK
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function checkDuplicates() {
  console.log('🔍 Verificando duplicidades...\n')

  // 1. Contar total de registros
  const { data: ideias } = await supabase.from('ideias').select('id', { count: 'exact' })
  const { data: roteiros } = await supabase.from('roteiros').select('id', { count: 'exact' })
  const { data: pipeline } = await supabase.from('pipeline_producao').select('id', { count: 'exact' })

  console.log('📊 Totais:')
  console.log(`  - Ideias: ${ideias?.length || 0}`)
  console.log(`  - Roteiros: ${roteiros?.length || 0}`)
  console.log(`  - Pipeline: ${pipeline?.length || 0}\n`)

  // 2. Ver roteiros
  const { data: allRoteiros } = await supabase
    .from('roteiros')
    .select('id, titulo, canal_nome, status')
    .order('created_at', { ascending: false })

  console.log('📝 Primeiros 10 roteiros:')
  allRoteiros?.slice(0, 10).forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.titulo || 'SEM TÍTULO'} - ${r.canal_nome || 'sem canal'} - ${r.status}`)
  })

  console.log('\n✅ Verificação completa!')
}

checkDuplicates().catch(console.error)
