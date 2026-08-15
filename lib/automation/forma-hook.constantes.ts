/**
 * As formas de gancho, sem `server-only` — o painel do navegador também precisa da lista.
 * A lógica de rodízio e as instruções do prompt ficam em forma-hook.ts, que é só do servidor.
 */
export const FORMAS_HOOK = [
  'bold_claim',
  'curiosity_gap',
  'micro_historia',
  'pergunta_identificadora',
  'promessa_especifica',
  'pattern_interrupt',
] as const

export type FormaHook = (typeof FORMAS_HOOK)[number]

/** Rótulo curto em português — o nome técnico não diz nada numa tabela. */
export const ROTULO_FORMA: Record<FormaHook, string> = {
  bold_claim: 'Afirmação ousada',
  curiosity_gap: 'Lacuna de curiosidade',
  micro_historia: 'Micro-história',
  pergunta_identificadora: 'Pergunta que identifica',
  promessa_especifica: 'Promessa específica',
  pattern_interrupt: 'Quebra de padrão',
}
