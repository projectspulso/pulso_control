'use client'

import { useEffect, useState } from 'react'

import { papelDoEmail } from '@/lib/auth/allowlist'
import { getSupabaseBrowser } from '@/lib/supabase/browser'

export interface UsuarioAtual {
  email: string | null
  papel: 'admin' | 'operador' | null
  carregando: boolean
}

export function useUsuario(): UsuarioAtual {
  const [estado, setEstado] = useState<UsuarioAtual>({ email: null, papel: null, carregando: true })

  useEffect(() => {
    const supabase = getSupabaseBrowser()
    supabase.auth.getUser().then(({ data }) => {
      const email = data.user?.email ?? null
      setEstado({ email, papel: papelDoEmail(email), carregando: false })
    })
  }, [])

  return estado
}
