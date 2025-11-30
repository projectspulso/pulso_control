const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://nlcisbfdiokmipyihtuz.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5sY2lzYmZkaW9rbWlweWlodHV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1ODk0OTksImV4cCI6MjA3OTE2NTQ5OX0.-Cfzv9ebOYB8I93zNLghWTszawJk4G3rXwiTTY9PpOI'

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
