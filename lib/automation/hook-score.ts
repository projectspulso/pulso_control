import { ABERTURAS_PROIBIDAS } from './prompts'

/**
 * Avaliador de HOOK (nota 1-5) — heurístico, determinístico e sem custo de LLM.
 * Checa a primeira frase do roteiro contra a TRAVA DOS 3 SEGUNDOS (ver prompts.ts).
 * Usado pra: (a) gravar nota_hook ao gerar roteiro, (b) bloquear hook fraco (<=2) no kanban.
 */
export interface HookAvaliacao {
  nota: number // 1 (fraco) a 5 (forte)
  motivos: string[]
}

export function primeiraFrase(texto: string): string {
  const limpo = (texto || '').trim()
  const corte = limpo.split(/(?<=[.!?])\s|\n/)[0] || limpo
  return corte.trim()
}

export function avaliarHook(texto: string): HookAvaliacao {
  const frase = primeiraFrase(texto)
  const lower = frase.toLowerCase()
  const motivos: string[] = []
  let nota = 3

  // abertura proibida = hook fraco de saída
  if (ABERTURAS_PROIBIDAS.some((a) => lower.startsWith(a.toLowerCase()))) {
    motivos.push('abertura proibida (ex.: "Imagine…")')
    nota = 1
  }
  // pergunta retórica morna
  if (frase.includes('?') && /^(você|voce|já|alguma vez|quem|o que|por que|porque|sera|será)\b/.test(lower)) {
    motivos.push('pergunta retórica morna')
    nota = Math.min(nota, 2)
  }

  if (nota > 1) {
    const palavras = frase.split(/\s+/).filter(Boolean)
    const temNumero = /\d/.test(frase)
    const temNomeProprio = palavras.slice(1).some((w) => /^[A-ZÀ-Ý][a-zà-ÿ]{2,}/.test(w))
    const temContradicao = /\b(mas|porém|porem|nunca|ninguém|ninguem|sem|nenhum|antes de)\b/.test(lower)

    if (temNumero) { nota += 1; motivos.push('tem número/data') }
    else if (temNomeProprio) { nota += 1; motivos.push('tem nome próprio') }
    if (temContradicao) { nota += 1; motivos.push('contradição/stakes') }
    if (palavras.length > 18) { nota -= 1; motivos.push('frase longa (>18 palavras)') }
    else if (palavras.length <= 14) { motivos.push('curta e direta') }
  }

  nota = Math.max(1, Math.min(5, nota))
  return { nota, motivos }
}
