import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function testarQueryCanais() {
  console.log('\n📊 TESTANDO ESTRUTURA DE CANAIS E IDEIAS\n')
  
  // 1. Verificar estrutura da tabela canais
  console.log('1️⃣ ESTRUTURA DE CANAIS:')
  const { data: canais, error: erroCanais } = await supabase
    .from('canais')
    .select('*')
    .limit(1)
  
  if (erroCanais) {
    console.log(`   ❌ Erro ao buscar canais: ${erroCanais.message}`)
  } else if (canais && canais.length > 0) {
    console.log(`   ✅ Campos disponíveis:`, Object.keys(canais[0]))
    console.log(`   📋 Exemplo:`, canais[0])
  }
  
  // 2. Verificar estrutura da tabela ideias
  console.log('\n2️⃣ ESTRUTURA DE IDEIAS:')
  const { data: ideias, error: erroIdeias } = await supabase
    .schema('pulso_content')
    .from('ideias')
    .select('id, canal_id, titulo, created_at')
    .limit(1)
  
  if (erroIdeias) {
    console.log(`   ❌ Erro ao buscar ideias: ${erroIdeias.message}`)
  } else if (ideias && ideias.length > 0) {
    console.log(`   ✅ Campos disponíveis:`, Object.keys(ideias[0]))
    console.log(`   📋 Exemplo:`, ideias[0])
  }
  
  // 3. Testar se coluna 'status' existe em canais
  console.log('\n3️⃣ VERIFICAR COLUNA STATUS EM CANAIS:')
  const { data: canaisStatus, error: erroStatus } = await supabase
    .from('canais')
    .select('id, nome, status')
    .limit(1)
  
  if (erroStatus) {
    console.log(`   ❌ Coluna 'status' não existe: ${erroStatus.message}`)
    
    // Tentar com 'ativo'
    const { data: canaisAtivo, error: erroAtivo } = await supabase
      .from('canais')
      .select('id, nome, ativo')
      .limit(1)
    
    if (!erroAtivo && canaisAtivo) {
      console.log(`   ✅ Coluna 'ativo' existe! Usar isso no lugar de 'status'`)
    }
  } else {
    console.log(`   ✅ Coluna 'status' existe!`)
  }
  
  // 4. Verificar se existe coluna 'idioma' ou 'linguagem'
  console.log('\n4️⃣ VERIFICAR COLUNA IDIOMA/LINGUAGEM:')
  const { data: canaisIdioma, error: erroIdioma } = await supabase
    .from('canais')
    .select('id, nome, metadata')
    .limit(1)
  
  if (!erroIdioma && canaisIdioma && canaisIdioma.length > 0) {
    const metadata = canaisIdioma[0].metadata as any
    console.log(`   📋 Metadata do canal:`, metadata)
    if (metadata?.idioma) {
      console.log(`   ✅ idioma está em metadata.idioma`)
    }
    if (metadata?.linguagem) {
      console.log(`   ✅ linguagem está em metadata.linguagem`)
    }
  }
  
  // 5. Listar todos os canais
  console.log('\n5️⃣ TODOS OS CANAIS:')
  const { data: todosCanais } = await supabase
    .from('canais')
    .select('id, nome, ativo, metadata')
    .order('created_at')
  
  if (todosCanais) {
    todosCanais.forEach((canal, idx) => {
      console.log(`   ${idx + 1}. ${canal.nome} (ativo: ${canal.ativo})`)
    })
  }
  
  // 6. Contar ideias por canal na última semana
  console.log('\n6️⃣ IDEIAS POR CANAL (ÚLTIMA SEMANA):')
  const { data: ideiasCanais } = await supabase
    .schema('pulso_content')
    .from('ideias')
    .select('canal_id, id')
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
  
  if (ideiasCanais) {
    const contagemPorCanal = ideiasCanais.reduce((acc, ideia) => {
      const canalId = ideia.canal_id || 'SEM_CANAL'
      acc[canalId] = (acc[canalId] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    console.log(`   📊 Contagem:`, contagemPorCanal)
  }
  
  console.log('\n✅ Análise concluída!\n')
}

testarQueryCanais().catch(console.error)
