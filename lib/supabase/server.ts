import 'server-only'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import type { Database } from './database.types'

let adminClient: SupabaseClient<Database> | null = null

function getServerSupabaseConfig() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url) {
    throw new Error('SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_URL nao configurada')
  }

  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY nao configurada')
  }

  return { url, serviceRoleKey }
}

export function getSupabaseAdminClient() {
  if (adminClient) {
    return adminClient
  }

  const { url, serviceRoleKey } = getServerSupabaseConfig()

  adminClient = createClient<Database>(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })

  return adminClient
}
