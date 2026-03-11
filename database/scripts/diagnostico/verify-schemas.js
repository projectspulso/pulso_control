const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://nlcisbfdiokmipyihtuz.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5sY2lzYmZkaW9rbWlweWlodHV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1ODk0OTksImV4cCI6MjA3OTE2NTQ5OX0.-Cfzv9ebOYB8I93zNLghWTszawJk4G3rXwiTTY9PpOI'

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
