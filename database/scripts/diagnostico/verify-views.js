const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://nlcisbfdiokmipyihtuz.supabase.co',
  process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function verificarViews() {
  console.log('🔍 Verificando views e dados...\n')

  // 1. Testar view de agenda (CRÍTICO para Kanban/Calendário)
  console.log('1️⃣ Testando vw_agenda_publicacao_detalhada...')
  const { data: agenda, error: agendaError } = await supabase
    .from('vw_agenda_publicacao_detalhada')
    .select('*')
    .limit(3)

  if (agendaError) {
    console.log('❌ ERRO - View não existe ou sem acesso:', agendaError.message)
    console.log('   👉 Execute: create_public_view_agenda.sql')
  } else {
    console.log(`✅ View OK - ${agenda.length} registros encontrados`)
    if (agenda.length > 0) {
      console.log('   Exemplo:', {
        canal: agenda[0].canal,
        serie: agenda[0].serie,
        status: agenda[0].pipeline_status
      })
    }
  }

  // 2. Testar plataformas conectadas
  console.log('\n2️⃣ Testando plataformas_conectadas...')
  const { data: plat, error: platError } = await supabase
    .from('plataformas_conectadas')
    .select('*')

  if (platError) {
    console.log('❌ ERRO:', platError.message)
  } else {
    const conectadas = plat.filter(p => p.tem_credenciais)
    console.log(`✅ View OK - ${plat.length} plataformas, ${conectadas.length} conectadas`)
  }

  // 3. Testar configurações
  console.log('\n3️⃣ Testando configuracoes...')
  const { data: configs, error: configError } = await supabase
    .from('configuracoes')
    .select('*')
    .eq('categoria', 'n8n')

  if (configError) {
    console.log('❌ ERRO:', configError.message)
  } else {
    console.log(`✅ Configurações OK - ${configs.length} configs n8n`)
    configs.forEach(c => {
      console.log(`   ${c.chave}: ${c.valor}`)
    })
  }

  console.log('\n✅ Verificação concluída!')
}

verificarViews().catch(console.error)
