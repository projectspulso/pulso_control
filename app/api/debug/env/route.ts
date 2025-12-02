import { NextResponse } from 'next/server'

export async function GET() {
  // ATENÇÃO: REMOVER ESTE ENDPOINT EM PRODUÇÃO!
  // Este endpoint é APENAS para debug local
  
  const envVars = {
    supabase: {
      url: !!process.env.SUPABASE_URL,
      anon_key: !!process.env.SUPABASE_ANON_KEY,
      service_role_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      next_public_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      next_public_anon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    },
    n8n: {
      webhook_ideia: !!process.env.N8N_WEBHOOK_APROVAR_IDEIA,
      webhook_roteiro: !!process.env.N8N_WEBHOOK_APROVAR_ROTEIRO,
      webhook_secret: !!process.env.WEBHOOK_SECRET
    },
    node_env: process.env.NODE_ENV,
    all_env_keys: Object.keys(process.env).filter(k => 
      k.includes('SUPABASE') || k.includes('N8N') || k.includes('WEBHOOK')
    )
  }

  return NextResponse.json(envVars)
}
