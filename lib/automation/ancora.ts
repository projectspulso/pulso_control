/**
 * ÂNCORA — a identidade DECLARADA de um vídeo, no lugar da identidade inferida.
 *
 * O PROBLEMA QUE ISTO RESOLVE. Até 02/09/2026 a pergunta "esse vídeo já existe?" era respondida
 * por um LLM olhando 266 títulos num prompt só. Três defeitos nascem daí: degrada conforme o
 * acervo cresce, custa uma chamada por lote e é não-determinística — a mesma pergunta pode ter
 * respostas diferentes. E, pior, ela só via o TÍTULO.
 *
 * O que passou por essa trava, medido na varredura de 02/09 (dois vídeos JÁ RENDERIZADOS e
 * agendados, achados com 10% de similaridade de título):
 *   #156 "Em 2134 a.C., um eclipse solar levou dois astrônomos chineses à execução."
 *   #175 "Em 2134 a.C., um eclipse quase custou a vida de dois astrônomos chineses."
 *   #86  "...a psicóloga Bluma Zeigarnik percebeu que os garçons lembravam..."
 *   #165 "Em 1927, a psicóloga Bluma Zeigarnik descobriu que tarefas inacabadas..."
 *
 * A ÂNCORA é o caso concreto no centro da história — a pessoa, o lugar, o objeto ou o evento COM
 * NOME: `bluma-zeigarnik-1927`, `eclipse-2134ac-astronomos-chineses`, `roy-sullivan`,
 * `mary-celeste`. Declarada no nascimento da ideia e reextraída do roteiro pronto, ela transforma
 * a checagem em CONSULTA: instantânea, de graça, auditável, e igual toda vez.
 *
 * ONDE ELA MORA: `ideias.metadata.ancora`. Não virou coluna de propósito — âncora não comporta
 * índice único, porque dois vídeos legítimos podem orbitar o mesmo caso por ângulos diferentes.
 * Quem decide continua sendo o código; a âncora só torna a decisão barata.
 */

/**
 * Reduz a âncora à sua forma comparável: sem acento, sem pontuação, sem palavra vazia.
 * "Bluma Zeigarnik (1927)" e "a psicóloga Bluma Zeigarnik, 1927" caem no mesmo lugar.
 */
const VAZIAS = new Set(
  ('a o e de da do das dos que com para por um uma no na em ao aos se os as the of and ' +
    'sobre entre seu sua caso historia efeito misterio enigma').split(' ')
)

export function normalizarAncora(texto: string | null | undefined): string {
  const limpo = (texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
  const partes = limpo.split(/\s+/).filter((w) => w.length > 1 && !VAZIAS.has(w))
  return partes.sort().join('-')
}

/** Duas âncoras batem quando compartilham a maior parte dos termos — não só quando são idênticas.
 *  `bluma-zeigarnik-1927` × `bluma-zeigarnik` batem; `roy-sullivan` × `mary-celeste` não. */
export function ancorasBatem(a: string, b: string): boolean {
  if (!a || !b) return false
  if (a === b) return true
  const A = new Set(a.split('-'))
  const B = new Set(b.split('-'))
  let inter = 0
  for (const t of A) if (B.has(t)) inter++
  // proporção sobre o MENOR conjunto: "zeigarnik" sozinho ainda bate com "bluma-zeigarnik-1927"
  return inter / Math.min(A.size, B.size) >= 0.75
}

const PROMPT_EXTRACAO = [
  'Você recebe o roteiro de um vídeo curto. Devolva a ÂNCORA dele.',
  '',
  'ÂNCORA = o caso concreto no centro da história, com nome próprio, lugar, data ou termo técnico.',
  'NÃO é o tema, NÃO é o gênero, NÃO é o título. É o QUE especificamente está sendo contado.',
  '',
  'Exemplos:',
  '- roteiro sobre a psicóloga Bluma Zeigarnik e tarefas inacabadas (1927) → "Bluma Zeigarnik 1927"',
  '- roteiro sobre o eclipse de 2134 a.C. e os astrônomos chineses Hi e Ho → "eclipse 2134 a.C. astronomos chineses"',
  '- roteiro sobre Roy Sullivan, o guarda florestal atingido por raios → "Roy Sullivan"',
  '- roteiro sobre o navio Mary Celeste achado à deriva → "Mary Celeste"',
  '- roteiro sobre a cidade submersa de Pavlopetri → "Pavlopetri"',
  '',
  'Se o roteiro não tiver um caso concreto (fala de um fenômeno geral), devolva o fenômeno com',
  'o máximo de especificidade que houver — nunca invente um nome que não está no texto.',
  '',
  'Responda APENAS JSON: {"ancora":"<3 a 8 palavras>"}',
].join('\n')

/**
 * Extrai a âncora de um roteiro. Devolve null quando a checagem não pôde ser feita — e null aqui
 * é AUSÊNCIA DE RESPOSTA, nunca "não tem âncora": quem chama precisa tratar os dois diferente,
 * senão a falha de IA vira, calada, um "pode passar".
 */
export async function extrairAncora(
  corpo: string,
  callLLM: (prompt: string) => Promise<string>
): Promise<string | null> {
  const texto = (corpo || '').slice(0, 2500)
  if (!texto.trim()) return null
  try {
    const bruto = await callLLM(`${PROMPT_EXTRACAO}\n\nROTEIRO:\n${texto}`)
    const j = JSON.parse(bruto) as { ancora?: string }
    const a = (j.ancora || '').trim()
    return a.length >= 2 ? a : null
  } catch {
    return null
  }
}

export interface ColisaoAncora {
  ancora: string
  colideCom: { id: string; titulo: string; ancora: string }
}

/** Procura a primeira âncora existente que bate com a candidata. */
export function acharColisao(
  candidata: string,
  existentes: Array<{ id: string; titulo: string | null; ancora?: string | null }>
): ColisaoAncora | null {
  const alvo = normalizarAncora(candidata)
  if (!alvo) return null
  for (const e of existentes) {
    const outra = normalizarAncora(e.ancora)
    if (outra && ancorasBatem(alvo, outra)) {
      return { ancora: alvo, colideCom: { id: e.id, titulo: e.titulo || '(sem título)', ancora: outra } }
    }
  }
  return null
}
