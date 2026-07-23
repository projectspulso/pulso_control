/**
 * CÓDIGO DE LIGAÇÃO ENTRE REDES — `#pulsoNNN`
 *
 * O mesmo vídeo vive em 4-5 redes (YouTube, Instagram, Facebook, TikTok, Kwai) e hoje se
 * perde a ligação entre elas — principalmente no Kwai, que é publicado à mão. Este código
 * discreto no fim da legenda/descrição deixa qualquer pessoa achar o mesmo conteúdo nas
 * outras redes. O número vem SEMPRE de `metadata.numero` (a sequência canônica do vídeo);
 * nunca é inventado nem aleatório — sem número, não há código.
 *
 * É idempotente: se a legenda já tem um `#pulsoNNN`, não duplica nem troca.
 */

const RE_CODIGO = /#pulso\d{2,}/i

export function pulsoCodigo(numero: number | null | undefined): string | null {
  const n = Number(numero)
  if (!Number.isFinite(n) || n <= 0) return null
  return `#pulso${String(Math.trunc(n)).padStart(3, '0')}`
}

/** Anexa `#pulsoNNN` ao fim do texto, de forma discreta e idempotente. */
export function withPulsoCodigo(texto: string, numero: number | null | undefined): string {
  const codigo = pulsoCodigo(numero)
  const base = texto || ''
  if (!codigo) return base
  if (RE_CODIGO.test(base)) return base // já tem um código — não duplica
  return base.trimEnd().length ? `${base.trimEnd()}\n${codigo}` : codigo
}
