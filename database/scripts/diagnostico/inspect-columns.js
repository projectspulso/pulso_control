const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://nlcisbfdiokmipyihtuz.supabase.co'
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function inspectColumns() {
  const tables = ['roteiros', 'ideias', 'canais']

  for (const table of tables) {
    console.log(`\n--- Inspecting ${table} ---`)
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(1)

    if (error) {
      console.error(`Error fetching ${table}:`, error.message)
    } else if (data && data.length > 0) {
      console.log('Columns:', Object.keys(data[0]).join(', '))
    } else {
      console.log(`Table ${table} is empty or not accessible.`)
    }
  }
}

inspectColumns()
