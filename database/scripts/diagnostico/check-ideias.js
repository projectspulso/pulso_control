const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://nlcisbfdiokmipyihtuz.supabase.co'
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

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
