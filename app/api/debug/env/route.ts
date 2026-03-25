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
    automation: {
      openai_api_key: Boolean(process.env.OPENAI_API_KEY),
      anthropic_api_key: Boolean(process.env.ANTHROPIC_API_KEY),
      webhook_secret: Boolean(process.env.WEBHOOK_SECRET),
      tts_provider: process.env.TTS_PROVIDER || 'openai',
      manus_webhook_url: Boolean(process.env.MANUS_WEBHOOK_URL),
    },
    node_env: process.env.NODE_ENV,
    debug_api_enabled: true,
  })
}
