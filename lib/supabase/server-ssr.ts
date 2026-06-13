import 'server-only'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Cliente Supabase para Server Components/Layouts — lê a sessão dos cookies.
export async function getSupabaseServerSSR() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {
          // Server Components não escrevem cookies — o refresh ocorre no middleware.
        },
      },
    }
  )
}
