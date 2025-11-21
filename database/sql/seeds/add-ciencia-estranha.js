const { createClient } = require('@supabase/supabase-js')
const path = require('path')

// Carregar .env da raiz do projeto
require('dotenv').config({ path: path.join(__dirname, '../../../.env') })

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

async function addCienciaEstranha() {
  console.log('🔬 Adicionando série: Ciência Estranha...\n')
  
  try {
    // 1. Buscar canal Pulso Dark PT
    const { data: canal, error: canalError } = await supabase
      .from('canais')
      .select('id, nome')
      .eq('slug', 'pulso-dark-pt')
      .single()
    
    if (canalError) throw canalError
    
    console.log('✅ Canal encontrado:', canal.nome)
    
    // 2. Verificar se série já existe
    const { data: serieExiste } = await supabase
      .from('series')
      .select('id, nome')
      .eq('canal_id', canal.id)
      .eq('slug', 'ciencia-estranha')
      .maybeSingle()
    
    if (serieExiste) {
      console.log('⚠️  Série já existe:', serieExiste.nome)
      return
    }
    
    // 3. Criar nova série
    const { data: novaSerie, error: serieError } = await supabase
      .from('series')
      .insert({
        canal_id: canal.id,
        nome: 'Ciência Estranha',
        slug: 'ciencia-estranha',
        descricao: 'Curiosidades científicas bizarras, limite entre ciência e absurdo.',
        ordem_padrao: 3,
        metadata: {
          tipo: 'CIENCIA_DARK',
          formato: '15-40s'
        }
      })
      .select()
      .single()
    
    if (serieError) throw serieError
    
    console.log('✅ Série criada:', novaSerie.nome)
    console.log('   Slug:', novaSerie.slug)
    console.log('   Ordem:', novaSerie.ordem_padrao)
    console.log('   Tipo:', novaSerie.metadata.tipo)
    
    // 4. Listar todas as séries do canal
    console.log('\n📋 Séries do canal Pulso Dark PT:')
    const { data: todasSeries } = await supabase
      .from('series')
      .select('nome, slug, ordem_padrao, metadata')
      .eq('canal_id', canal.id)
      .order('ordem_padrao')
    
    todasSeries?.forEach((s, i) => {
      console.log(`   ${i + 1}. ${s.nome} (${s.slug})`)
      console.log(`      Tipo: ${s.metadata?.tipo || 'N/A'}`)
    })
    
    console.log('\n✨ Concluído!')
    
  } catch (error) {
    console.error('❌ Erro:', error.message)
    process.exit(1)
  }
}

addCienciaEstranha()
