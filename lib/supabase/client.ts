import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseBrowser } from './browser'

// ÚNICO client de dados do app. Agora carrega a SESSÃO do usuário (cookie),
// então as escritas vão como `authenticated` — `anon` virou read-only após o
// revoke de segurança (29/06). Reusa o singleton de browser.ts (1 só GoTrueClient,
// mata o warning "Multiple GoTrueClient instances").
//
// Proxy lazy: o client só é criado no browser, no 1º acesso a uma propriedade
// (SSR-safe — createBrowserClient não roda no servidor durante o SSR dos client
// components). A superfície `supabase.from(...)`, `.auth`, etc. continua igual.
// Sem generic <Database> de propósito: as tabelas vivem em schemas pulso_* (não no
// public tipado), então mantemos a tipagem solta como o client antigo (sem regressão).
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const real = getSupabaseBrowser() as unknown as SupabaseClient
    const value = Reflect.get(real as object, prop, receiver)
    return typeof value === 'function' ? value.bind(real) : value
  },
})
