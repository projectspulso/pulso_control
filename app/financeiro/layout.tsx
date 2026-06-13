import { redirect } from 'next/navigation'

import { papelDoEmail } from '@/lib/auth/allowlist'
import { getSupabaseServerSSR } from '@/lib/supabase/server-ssr'

// Gate de papel: só admin acessa o Financeiro (enforçado no servidor, não só na UI).
export default async function FinanceiroLayout({ children }: { children: React.ReactNode }) {
  const supabase = await getSupabaseServerSSR()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (papelDoEmail(user?.email) !== 'admin') {
    redirect('/?sem_permissao=financeiro')
  }

  return <>{children}</>
}
