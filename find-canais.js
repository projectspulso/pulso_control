const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://nlcisbfdiokmipyihtuz.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5sY2lzYmZkaW9rbWlweWlodHV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1ODk0OTksImV4cCI6MjA3OTE2NTQ5OX0.-Cfzv9ebOYB8I93zNLghWTszawJk4G3rXwiTTY9PpOI'

const supabase = createClient(supabaseUrl, supabaseKey)

async function findCanais() {
  console.log('Searching for table "canais"...')

  // Check public.canais
  console.log('\nChecking public.canais...')
  const { data: publicData, error: publicError } = await supabase
    .from('canais') // defaults to public
    .select('id')
    .limit(1)

  if (publicError) {
    console.log('❌ Not found in public (or error):', publicError.message)
  } else {
    console.log('✅ Found in public.canais')
  }

  // Check pulso_content.canais
  console.log('\nChecking pulso_content.canais...')
  const { data: contentData, error: contentError } = await supabase
    .schema('pulso_content')
    .from('canais')
    .select('id')
    .limit(1)

  if (contentError) {
    console.log('❌ Not found in pulso_content (or error):', contentError.message)
  } else {
    console.log('✅ Found in pulso_content.canais')
  }
}

findCanais()
