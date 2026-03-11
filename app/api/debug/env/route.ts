import { NextResponse } from 'next/server'

function isDebugEndpointEnabled() {
  return process.env.NODE_ENV === 'development' || process.env.ENABLE_DEBUG_API === 'true'
}

export async function GET() {
  if (!isDebugEndpointEnabled()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({
    supabase: {
      url: Boolean(process.env.SUPABASE_URL),
      anon_key: Boolean(process.env.SUPABASE_ANON_KEY),
      service_role_key: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      next_public_url: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      next_public_anon: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    },
    n8n: {
      webhook_ideia: Boolean(process.env.N8N_WEBHOOK_APROVAR_IDEIA),
      webhook_roteiro: Boolean(process.env.N8N_WEBHOOK_APROVAR_ROTEIRO),
      webhook_secret: Boolean(process.env.WEBHOOK_SECRET),
    },
    node_env: process.env.NODE_ENV,
    debug_api_enabled: true,
  })
}
