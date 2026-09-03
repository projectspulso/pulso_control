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

/**
 * Duas âncoras batem quando compartilham a maior parte dos termos E pelo menos um termo que
 * DISTINGUE — o nome próprio, o lugar, a data.
 *
 * A segunda condição nasceu do teste em produção (02/09/2026), que acusou como iguais:
 *   "cidade submersa perto de Cádiz 2021"  ×  "cidade submersa Yonaguni 2021"
 * São duas cidades diferentes, em dois países diferentes. O que sobrou em comum — `cidade`,
 * `submersa`, `2021` — é o VOCABULÁRIO do canal, não a identidade da história; e como ele
 * preenchia o conjunto menor inteiro, a proporção dava 100%. O termo que separava (Cádiz ×
 * Yonaguni) foi voto vencido.
 *
 * `raro` responde quantos itens do acervo usam aquele termo. Sem essa função (chamada solta,
 * fora de um acervo) o comportamento antigo continua — é o caso de comparar duas âncoras isoladas.
 */
export function ancorasBatem(a: string, b: string, raro?: (termo: string) => boolean): boolean {
  if (!a || !b) return false
  if (a === b) return true
  const A = new Set(a.split('-'))
  const B = new Set(b.split('-'))
  const comuns: string[] = []
  for (const t of A) if (B.has(t)) comuns.push(t)
  if (!raro) return comuns.length / Math.min(A.size, B.size) >= 0.75

  const raros = comuns.filter(raro)

  // SEGUNDA VIA — dois termos distintivos iguais nos dois lados são um NOME, e nome não coincide
  // por acaso. Sem ela, "Roy Cleveland Sullivan" e "Roy Sullivan Parque Nacional de Shenandoah"
  // não casavam: a proporção dava 0,67 (dois termos em comum sobre três) e ficava abaixo do corte.
  // É a MESMA PESSOA, e o par tinha virado vídeo duas vezes.
  //
  // O veto por termo exclusivo NÃO se aplica aqui, de propósito: é justamente o sobrenome extra de
  // um lado e o lugar do outro que fazem a proporção falhar.
  //
  // Medido no acervo: a segunda via leva as colisões de 3 para 7, ganhando três repetições reais
  // (Roy Sullivan #8/#108, Rota da Seda #113/#111, Dia dos Pais #139/#140) e um falso positivo
  // conhecido — "biblioteca secreta Paris Segunda Guerra Mundial" × "carta de amor Segunda Guerra
  // Mundial 1975", que dividem uma ÉPOCA e não um caso. A troca é deliberada e segue a assimetria
  // do módulo de dedup: errar pra mais custa uma aprovação manual, errar pra menos custa um render
  // duplicado.
  if (raros.length >= 2) return true

  if (comuns.length / Math.min(A.size, B.size) < 0.75) return false

  // VETO POR TERMO EXCLUSIVO — o sinal mais forte, e o mais barato.
  // Quando CADA lado carrega um termo distintivo que o outro não tem, isso não é ausência de
  // prova: é prova de que são casos diferentes. `cadiz` de um lado e `yonaguni` do outro dizem,
  // sozinhos, que são duas cidades submersas — não a mesma contada duas vezes.
  // Não vale quando um lado é subconjunto do outro ("pavlopetri-1967" ⊂ "pavlopetri-1967-cidade
  // -submersa"): aí o lado curto não tem nada exclusivo, e o par continua sendo o mesmo caso.
  const exclusivoRaro = (X: Set<string>, Y: Set<string>) => [...X].some((t) => !Y.has(t) && raro(t))
  if (exclusivoRaro(A, B) && exclusivoRaro(B, A)) return false

  return raros.length >= 1
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

/**
 * Em quantas âncoras do acervo um termo pode aparecer e ainda ser considerado distintivo.
 *
 * Medido nas 189 âncoras do acervo em 02/09/2026: 472 termos aparecem em uma âncora só, 62 em
 * duas, 23 em três e 12 em quatro ou mais. O corte em 3 deixava passar `submersa` (3 âncoras), e
 * foi por ele que "cidade submersa Cádiz" casou com "cidade submersa Yonaguni". Em 2, `submersa`
 * vira vocabulário e os nomes que importam continuam distintivos: `pavlopetri` (2), `nino` (2),
 * `gpt` (2).
 */
const RARO_MAX = 2

/**
 * Procura a primeira âncora existente que bate com a candidata.
 *
 * A raridade de cada termo é medida NO PRÓPRIO ACERVO, não numa lista fixa de palavras genéricas:
 * o que é vocabulário comum depende do canal. Num canal de arqueologia submarina, `submersa` é
 * ruído; num de psicologia, seria um sinal e tanto.
 */
export function acharColisao(
  candidata: string,
  existentes: Array<{ id: string; titulo: string | null; ancora?: string | null }>
): ColisaoAncora | null {
  const alvo = normalizarAncora(candidata)
  if (!alvo) return null

  const freq = new Map<string, number>()
  const normalizadas: Array<{ e: (typeof existentes)[number]; n: string }> = []
  for (const e of existentes) {
    const n = normalizarAncora(e.ancora)
    if (!n) continue
    normalizadas.push({ e, n })
    for (const t of new Set(n.split('-'))) freq.set(t, (freq.get(t) || 0) + 1)
  }
  const raro = (t: string) => (freq.get(t) || 0) <= RARO_MAX

  for (const { e, n } of normalizadas) {
    if (ancorasBatem(alvo, n, raro)) {
      return { ancora: alvo, colideCom: { id: e.id, titulo: e.titulo || '(sem título)', ancora: n } }
    }
  }
  return null
}
