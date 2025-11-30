const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://nlcisbfdiokmipyihtuz.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5sY2lzYmZkaW9rbWlweWlodHV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1ODk0OTksImV4cCI6MjA3OTE2NTQ5OX0.-Cfzv9ebOYB8I93zNLghWTszawJk4G3rXwiTTY9PpOI'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkIdeias() {
  console.log('Checking pulso_content.ideias...')
  const { data, error } = await supabase
    .schema('pulso_content')
    .from('ideias')
    .select('id')
    .limit(1)

  if (error) {
    console.log('❌ Error:', error.message)
  } else {
    console.log('✅ Found pulso_content.ideias')
  }
}

checkIdeias()
