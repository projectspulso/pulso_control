const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkData() {
  console.log('🔍 Verificando dados no banco...\n')
  
  // Canais
  const { data: canais, error: eCanais } = await supabase
    .from('canais')
    .select('nome, slug, status')
    .order('nome')
  
  console.log('📺 CANAIS:', canais?.length || 0)
  if (eCanais) console.log('   Erro:', eCanais.message)
  canais?.forEach((c, i) => {
    console.log(`   ${i + 1}. ${c.nome} (${c.slug}) [${c.status}]`)
  })
  
  // Séries
  const { data: series, error: eSeries } = await supabase
    .from('series')
    .select('nome, canal_id, status')
  
  console.log('\n📚 SÉRIES:', series?.length || 0)
  if (eSeries) console.log('   Erro:', eSeries.message)
  
  // Séries por canal
  const seriesPorCanal = {}
  for (const canal of canais || []) {
    const count = series?.filter(s => s.canal_id === canal.id).length || 0
    seriesPorCanal[canal.id] = count
  }
  
  // Ideias
  const { data: ideias, error: eIdeias } = await supabase
    .from('ideias')
    .select('status, canal_id')
  
  console.log('\n💡 IDEIAS:', ideias?.length || 0)
  if (eIdeias) console.log('   Erro:', eIdeias.message)
  
  const ideiasStats = ideias?.reduce((acc, i) => {
    acc[i.status] = (acc[i.status] || 0) + 1
    return acc
  }, {})
  console.log('   Por status:', ideiasStats)
  
  // Ideias por canal
  const ideiasPerCanal = {}
  for (const canal of canais || []) {
    const count = ideias?.filter(i => i.canal_id === canal.id).length || 0
    ideiasPerCanal[canal.id] = count
  }
  
  console.log('\n📊 RESUMO POR CANAL:')
  canais?.forEach(canal => {
    const series = seriesPorCanal?.[canal.id] || 0
    const ideias = ideiasPerCanal?.[canal.id] || 0
    console.log(`   ${canal.nome}:`)
    console.log(`      Séries: ${series}`)
    console.log(`      Ideias: ${ideias}`)
  })
  
  console.log('\n✅ Verificação concluída!')
}

checkData()
