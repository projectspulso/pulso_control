import { NextRequest, NextResponse } from 'next/server'

import { ALLOWLIST, papelDoEmail } from '@/lib/auth/allowlist'
import { getSupabaseAdminClient } from '@/lib/supabase/server'

/**
 * POST /api/auth/registrar — self-registration allowlisted.
 * O usuário fornece o PRÓPRIO e-mail+senha (allowlist controla quem pode).
 * Cria o auth user já confirmado e vincula o papel em pulso_core.usuarios_internos.
 */
export async function POST(request: NextRequest) {
  const { email, password } = await request.json().catch(() => ({}))
  const e = (email || '').toLowerCase().trim()

  const papel = papelDoEmail(e)
  if (!papel) {
    return NextResponse.json({ error: 'E-mail não autorizado a acessar o PULSO Control.' }, { status: 403 })
  }
  if (!password || password.length < 8) {
    return NextResponse.json({ error: 'A senha precisa ter ao menos 8 caracteres.' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseAdminClient() as any

  const { data: criado, error: errCreate } = await supabase.auth.admin.createUser({
    email: e,
    password,
    email_confirm: true,
  })

  if (errCreate) {
    const msg = String(errCreate.message || '')
    if (msg.toLowerCase().includes('already')) {
      return NextResponse.json({ error: 'Esse e-mail já tem acesso. Use a tela de login.' }, { status: 409 })
    }
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  const authUserId = criado?.user?.id
  await supabase
    .schema('pulso_core')
    .from('usuarios_internos')
    .upsert(
      {
        auth_user_id: authUserId,
        email: e,
        nome: ALLOWLIST[e].nome,
        papel,
        ativo: true,
      },
      { onConflict: 'email' }
    )

  return NextResponse.json({ ok: true, papel })
}
