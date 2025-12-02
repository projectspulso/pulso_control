import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

// Função para criar cliente Supabase server-side (lazy initialization)
export function getSupabaseServer() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

  if (!supabaseUrl) {
    throw new Error('Missing SUPABASE_URL environment variable')
  }

  if (!supabaseKey) {
    throw new Error('Missing Supabase key (SERVICE_ROLE_KEY or ANON_KEY)')
  }

  return createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  })
}

// Export singleton instance (criado na primeira chamada)
export const supabaseServer = getSupabaseServer()
