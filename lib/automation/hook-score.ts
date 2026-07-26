import { ABERTURAS_PROIBIDAS } from './prompts'

/**
 * Avaliador de HOOK (nota 1-5) — heurístico, determinístico e sem custo de LLM.
 * Checa a abertura do roteiro contra a TRAVA DOS 3 SEGUNDOS (ver prompts.ts).
 * Usado pra: (a) gravar nota_hook ao gerar roteiro, (b) bloquear hook fraco (<=2) no kanban.
 *
 * RÉGUA REVISADA 25/07/2026 — o #43 ("Um brinquedo foi inventado por um menino") e o #44
 * ("Os camelos NÃO armazenam água nas corcovas! Mas o que tem lá?") tiravam a MESMA nota 3,
 * embora o #44 prenda e o #43 não. O avaliador antigo não pontuava os dois sinais que separam
 * um do outro, e que os campeões de retenção têm em comum:
 *   1) QUEBRA DE CRENÇA (myth-bust): "não é o que você pensa", "ao contrário", "ninguém sabe".
 *      É o sinal mais forte — contradizer o que a pessoa acredita para o dedo.
 *   2) LAÇO ABERTO (open loop): promete uma resposta que só vem no fim ("mas o que tem lá?").
 * Estes dois agora pesam. "Como/Por que a história de X" (explicação sem tensão) continua fraco.
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

/** Primeiras 2 frases — o hook costuma ser "afirmação! então pergunta?" (myth-bust + laço). */
function primeirasDuas(texto: string): string {
  const limpo = (texto || '').trim()
  const partes = limpo.split(/(?<=[.!?])\s|\n/).filter(Boolean)
  return partes.slice(0, 2).join(' ').trim()
}

export function avaliarHook(texto: string): HookAvaliacao {
  const frase = primeiraFrase(texto)
  const lower = frase.toLowerCase()
  const lowerDuas = primeirasDuas(texto).toLowerCase()
  const motivos: string[] = []
  let nota = 3

  // abertura proibida = hook fraco de saída
  if (ABERTURAS_PROIBIDAS.some((a) => lower.startsWith(a.toLowerCase()))) {
    motivos.push('abertura proibida (ex.: "Imagine…")')
    nota = 1
  }
  // pergunta retórica MORNA = a que ABRE o hook com genérico ("Você já se perguntou…?").
  // Diferente do laço aberto, que FECHA uma quebra de crença — esse é premiado abaixo.
  if (frase.includes('?') && /^(você|voce|já|alguma vez|quem|o que|por que|porque|sera|será)\b/.test(lower)) {
    motivos.push('pergunta retórica morna')
    nota = Math.min(nota, 2)
  }

  if (nota > 1) {
    const palavras = frase.split(/\s+/).filter(Boolean)
    const temNumero = /\d/.test(frase)
    const temNomeProprio = palavras.slice(1).some((w) => /^[A-ZÀ-Ý][a-zà-ÿ]{2,}/.test(w))
    const temContradicao = /\b(mas|porém|porem|nunca|ninguém|ninguem|sem|nenhum|antes de)\b/.test(lower)

    // QUEBRA DE CRENÇA — o sinal mais forte. "não" + verbo de fato ("não é/são/tem/precisa/
    // armazena…") ou marcadores de reviravolta. É o que o #44 tem e o #43 não.
    const quebraCrenca =
      /\b(não|nao)\s+(é|e|são|sao|foi|era|tem|têm|tinha|precisa|existe|existia|significa|armazena|armazenam|funciona|serve|nasceu|veio|aconteceu)\b/.test(
        lowerDuas
      ) ||
      /\b(ao contrário|na verdade|na realidade|esqueç[ae]|mentira|errado|não é bem|todo mundo (acha|pensa|acredita|achava)|ninguém (sabe|sabia|imagina|imaginava|esperava))\b/.test(
        lowerDuas
      )

    // LAÇO ABERTO — promete resposta retida (só nas 2 primeiras frases, junto de uma afirmação).
    const lacoAberto =
      /\b(mas\b[^?]*\?|então[^?]*\?|o que\b[^?]*\?)/.test(lowerDuas) ||
      /\b(o segredo|o motivo|a razão|o verdadeiro motivo|até hoje ninguém|e ninguém|o que ninguém)\b/.test(lowerDuas)

    if (quebraCrenca) { nota += 2; motivos.push('QUEBRA DE CRENÇA (prende)') }
    if (lacoAberto) { nota += 1; motivos.push('laço aberto (curiosidade)') }

    if (temNumero) { nota += 1; motivos.push('tem número/data') }
    else if (temNomeProprio) { nota += 1; motivos.push('tem nome próprio') }
    if (temContradicao) { nota += 1; motivos.push('contradição/stakes') }
    if (palavras.length > 18) { nota -= 1; motivos.push('frase longa (>18 palavras)') }
    else if (palavras.length <= 14) { motivos.push('curta e direta') }

    // Sem NENHUM sinal de tensão (nem quebra, nem laço, nem número/nome/contradição) = explicação
    // morna tipo "Como um menino inventou um brinquedo". É o caso do #43: rebaixa.
    if (!quebraCrenca && !lacoAberto && !temNumero && !temNomeProprio && !temContradicao) {
      nota -= 1
      motivos.push('explicação sem tensão (sem quebra/laço/fato)')
    }
  }

  nota = Math.max(1, Math.min(5, nota))
  return { nota, motivos }
}
