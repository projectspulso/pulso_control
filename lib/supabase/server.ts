import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

// Cliente Supabase para uso no servidor (API routes, Server Components)
// Usa variáveis de ambiente do servidor (sem NEXT_PUBLIC_)
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

console.log('🔧 Inicializando Supabase Server Client...')
console.log(`   URL: ${supabaseUrl ? '✅ configurada' : '❌ FALTANDO'}`)
console.log(`   KEY: ${supabaseKey ? '✅ configurada' : '❌ FALTANDO'}`)

if (!supabaseUrl || !supabaseKey) {
  const errorMsg = 'Missing Supabase environment variables'
  console.error(`❌ ${errorMsg}`)
  console.error('Variáveis disponíveis:', Object.keys(process.env).filter(k => k.includes('SUPABASE')))
  throw new Error(errorMsg)
}

export const supabaseServer = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
})

console.log('✅ Supabase Server Client criado com sucesso')
