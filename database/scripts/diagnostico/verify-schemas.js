const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://nlcisbfdiokmipyihtuz.supabase.co'
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function verifySchemas() {
  console.log('Verifying access to schemas...')

  // Try accessing pulso_content.roteiros
  console.log('\nAttempting to access pulso_content.roteiros...')
  const { data: contentData, error: contentError } = await supabase
    .schema('pulso_content')
    .from('roteiros')
    .select('id')
    .limit(1)

  if (contentError) {
    console.error('❌ Error accessing pulso_content.roteiros:', contentError.message)
  } else {
    console.log('✅ Successfully accessed pulso_content.roteiros')
  }

  // Try accessing pulso_core.canais
  console.log('\nAttempting to access pulso_core.canais...')
  const { data: coreData, error: coreError } = await supabase
    .schema('pulso_core')
    .from('canais')
    .select('id')
    .limit(1)

  if (coreError) {
    console.error('❌ Error accessing pulso_core.canais:', coreError.message)
  } else {
    console.log('✅ Successfully accessed pulso_core.canais')
  }
}

verifySchemas()
