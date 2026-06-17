import { createBrowserClient } from '@supabase/ssr'

// Cliente de navegador com sessão em cookie (compartilhada com o middleware).
// Usado pelo login/registro e pelo hook de usuário. Os hooks de DADOS continuam
// no client anon de lib/supabase/client.ts.
// Singleton: uma única instância por contexto do browser. Sem isso, cada chamada
// criava um GoTrueClient novo na mesma chave de sessão (sb-<ref>-auth-token),
// gerando "Multiple GoTrueClient instances" e escritas com auth instável (400 fantasma).
function criar() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

let client: ReturnType<typeof criar> | null = null

export function getSupabaseBrowser() {
  if (!client) {
    client = criar()
  }
  return client
}
