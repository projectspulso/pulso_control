import type { TemasMedidos } from './temas'

/** Lê a medição diária de temas (gravada por /api/automation/aprender). Falha → null → tudo neutro. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function carregarTemasMedidos(supabase: any): Promise<TemasMedidos | null> {
  const { data } = await supabase.schema('pulso_core').from('configuracoes').select('valor').eq('chave', 'temas_medidos').maybeSingle()
  if (!data?.valor) return null
  try {
    return (typeof data.valor === 'string' ? JSON.parse(data.valor) : data.valor) as TemasMedidos
  } catch {
    return null
  }
}
