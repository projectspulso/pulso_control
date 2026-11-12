// Allowlist de acesso ao PULSO Control. Só estes e-mails podem registrar/entrar.
// papel: 'admin' vê tudo (incl. /financeiro) · 'operador' vê tudo MENOS financeiro ·
// 'revisor' só lê (revisor do TikTok, 12/11/2026): a guarda de API barra tudo que não é GET e o banco
// (migration 094) não deixa gravar.
// Para liberar o cowork: adicione o e-mail dele aqui com papel 'operador'.
export type Papel = 'admin' | 'operador' | 'revisor'

export const ALLOWLIST: Record<string, { papel: Papel; nome: string }> = {
  'junior@oticastatymello.com.br': { papel: 'admin', nome: 'Junior (super admin)' },
  'oticastatymello@gmail.com': { papel: 'admin', nome: 'Junior (dono)' },
  'revisor.tiktok@digiai.app.br': { papel: 'revisor', nome: 'Revisor do TikTok (só leitura)' },
  // 'email-do-cowork@gmail.com': { papel: 'operador', nome: 'Cowork' },
}

export function papelDoEmail(email: string | null | undefined): Papel | null {
  if (!email) return null
  return ALLOWLIST[email.toLowerCase()]?.papel ?? null
}

export function emailAutorizado(email: string | null | undefined): boolean {
  return papelDoEmail(email) !== null
}
