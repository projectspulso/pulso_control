const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://nlcisbfdiokmipyihtuz.supabase.co'
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkCanaisColumns() {
  console.log('Checking columns in public.canais...\n')
  
  const { data, error } = await supabase
    .from('canais')
    .select('*')
    .limit(1)

  if (error) {
    console.error('Error:', error)
  } else {
    console.log('Columns found:', Object.keys(data[0] || {}))
  }
}

checkCanaisColumns()
