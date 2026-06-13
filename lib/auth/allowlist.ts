// Allowlist de acesso ao PULSO Control. Só estes e-mails podem registrar/entrar.
// papel: 'admin' vê tudo (incl. /financeiro) · 'operador' vê tudo MENOS financeiro.
// Para liberar o cowork: adicione o e-mail dele aqui com papel 'operador'.
export const ALLOWLIST: Record<string, { papel: 'admin' | 'operador'; nome: string }> = {
  'oticastatymello@gmail.com': { papel: 'admin', nome: 'Junior (dono)' },
  // 'email-do-cowork@gmail.com': { papel: 'operador', nome: 'Cowork' },
}

export function papelDoEmail(email: string | null | undefined): 'admin' | 'operador' | null {
  if (!email) return null
  return ALLOWLIST[email.toLowerCase()]?.papel ?? null
}

export function emailAutorizado(email: string | null | undefined): boolean {
  return papelDoEmail(email) !== null
}
