import { createBrowserClient } from '@supabase/ssr'

// Cliente de navegador com sessão em cookie (compartilhada com o middleware).
// Usado pelo login/registro e pelo hook de usuário. Os hooks de DADOS continuam
// no client anon de lib/supabase/client.ts.
export function getSupabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
