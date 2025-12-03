import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas!')
  console.error('Certifique-se de ter NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function verificarAssets() {
  console.log('\n🔍 VERIFICAÇÃO DA ESTRUTURA DE ASSETS\n')
  
  // 1. Verificar tabela assets
  console.log('1️⃣ Testando tabela pulso_assets.assets...')
  const { data: assets, error: assetsError } = await supabase
    .from('assets')
    .select('*')
    .limit(5)
  
  if (assetsError) {
    console.log('❌ Erro ao acessar assets:', assetsError.message)
  } else {
    console.log(`✅ Assets encontrados: ${assets?.length || 0}`)
    if (assets && assets.length > 0) {
      console.log('   Campos:', Object.keys(assets[0]))
    }
  }
  
  // 2. Verificar view vw_pulso_pipeline_com_assets
  console.log('\n2️⃣ Testando view vw_pulso_pipeline_com_assets...')
  const { data: pipelineAssets, error: pipelineError } = await supabase
    .from('vw_pulso_pipeline_com_assets')
    .select('*')
    .limit(5)
  
  if (pipelineError) {
    console.log('❌ Erro ao acessar view pipeline_com_assets:', pipelineError.message)
  } else {
    console.log(`✅ Registros na view: ${pipelineAssets?.length || 0}`)
    if (pipelineAssets && pipelineAssets.length > 0) {
      console.log('   Campos:', Object.keys(pipelineAssets[0]))
    }
  }
  
  // 3. Verificar tabela conteudo_variantes
  console.log('\n3️⃣ Testando tabela conteudo_variantes...')
  const { data: variantes, error: variantesError } = await supabase
    .from('conteudo_variantes')
    .select('*')
    .limit(5)
  
  if (variantesError) {
    console.log('❌ Erro ao acessar conteudo_variantes:', variantesError.message)
  } else {
    console.log(`✅ Variantes encontradas: ${variantes?.length || 0}`)
    if (variantes && variantes.length > 0) {
      console.log('   Campos:', Object.keys(variantes[0]))
    }
  }
  
  // 4. Verificar tabela conteudo_variantes_assets
  console.log('\n4️⃣ Testando tabela conteudo_variantes_assets...')
  const { data: vinculos, error: vinculosError } = await supabase
    .from('conteudo_variantes_assets')
    .select('*')
    .limit(5)
  
  if (vinculosError) {
    console.log('❌ Erro ao acessar conteudo_variantes_assets:', vinculosError.message)
  } else {
    console.log(`✅ Vínculos encontrados: ${vinculos?.length || 0}`)
    if (vinculos && vinculos.length > 0) {
      console.log('   Campos:', Object.keys(vinculos[0]))
    }
  }
  
  // 5. Verificar audios na pipeline
  console.log('\n5️⃣ Testando áudios na pipeline...')
  const { data: audios, error: audiosError } = await supabase
    .schema('pulso_content')
    .from('audios')
    .select('*')
    .limit(5)
  
  if (audiosError) {
    console.log('❌ Erro ao acessar audios:', audiosError.message)
  } else {
    console.log(`✅ Áudios encontrados: ${audios?.length || 0}`)
    if (audios && audios.length > 0) {
      console.log('   Campos:', Object.keys(audios[0]))
      console.log('   Primeiro áudio:', {
        id: audios[0].id,
        roteiro_id: audios[0].roteiro_id,
        caminho_arquivo: audios[0].caminho_arquivo
      })
    }
  }
  
  // 6. Verificar schema do assets
  console.log('\n6️⃣ Verificando schema correto...')
  const { data: assetsSchema, error: schemaError } = await supabase
    .schema('pulso_assets')
    .from('assets')
    .select('*')
    .limit(1)
  
  if (schemaError) {
    console.log('❌ Erro ao acessar pulso_assets.assets:', schemaError.message)
  } else {
    console.log(`✅ Schema pulso_assets.assets acessível: ${assetsSchema?.length || 0} registros`)
  }
  
  // 7. Estatísticas gerais
  console.log('\n📊 ESTATÍSTICAS GERAIS')
  
  const { count: totalAssets } = await supabase
    .schema('pulso_assets')
    .from('assets')
    .select('*', { count: 'exact', head: true })
  console.log(`Total de assets: ${totalAssets || 0}`)
  
  const { count: totalVariantes } = await supabase
    .schema('pulso_assets')
    .from('conteudo_variantes')
    .select('*', { count: 'exact', head: true })
  console.log(`Total de variantes: ${totalVariantes || 0}`)
  
  const { count: totalVinculos } = await supabase
    .schema('pulso_assets')
    .from('conteudo_variantes_assets')
    .select('*', { count: 'exact', head: true })
  console.log(`Total de vínculos variantes-assets: ${totalVinculos || 0}`)
  
  const { count: totalAudios } = await supabase
    .schema('pulso_content')
    .from('audios')
    .select('*', { count: 'exact', head: true })
  console.log(`Total de áudios: ${totalAudios || 0}`)
  
  console.log('\n✅ Verificação concluída!\n')
}

verificarAssets().catch(console.error)
