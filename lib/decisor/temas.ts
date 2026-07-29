/**
 * CLASSIFICADOR DE TEMA — o único sinal de assunto que sobreviveu ao teste.
 *
 * MEDIDO em 29/07/2026 sobre as 95 publicações de Facebook (48 dias de operação):
 *
 *   tema                        n   mediana FB   estouros (≥3k)
 *   história/arqueologia       12        2.919      6 de 6  ← monopólio
 *   natureza/animais            3        1.134           0
 *   corpo/cérebro               7          551           0
 *   (outros)                   51          446           0
 *   tecnologia/IA              14          268           0
 *   produtividade/motivacional  8          252           0
 *
 * Lift de 10,9× entre o topo e o fundo, e — o dado mais forte — TODOS os 6 estouros do
 * Facebook em 48 dias são história/arqueologia. Nenhum outro tema jamais passou de 3k.
 *
 * O QUE FOI TESTADO E REFUTADO (não voltar a isso sem dado novo): a tese de que "âncora
 * concreta no título" (ano, duração, nome próprio) prevê sucesso. Medida nas mesmas 95
 * publicações, deu lift 0,56× — títulos COM ano foram PIORES. A tese havia sido construída
 * sobre 2 vídeos virais que por coincidência tinham ano no título; é narrativa em cima de
 * outlier, exatamente o erro que este módulo existe para evitar.
 *
 * O Facebook é LOTERIA, não gradiente: 3 vídeos acima de 10k, 3 entre 3k e 10k, e 71 dos 95
 * abaixo de 1.000. ~6% dos vídeos carregam o crescimento inteiro. Por isso a decisão certa não
 * é "melhorar a média" — é comprar mais bilhete no tema que sorteia e reagir rápido quando um
 * pega (ver radarDeEstouro em ./fatos).
 */

export type Tema =
  | 'história/arqueologia'
  | 'natureza/animais'
  | 'corpo/cérebro'
  | 'tecnologia/IA'
  | 'produtividade/motivacional'
  | 'outros'

/** Palavras que classificaram os 95 vídeos no teste de 29/07. Ordem importa: o primeiro que casa vence. */
const DICIONARIO: Array<{ tema: Tema; termos: string[] }> = [
  {
    tema: 'história/arqueologia',
    termos: [
      'fóssil', 'fossil', 'cidade perdida', 'ruína', 'ruina', 'arqueolog', 'antig', 'século',
      'seculo', 'império', 'imperio', 'guerra', 'faraó', 'farao', 'múmia', 'mumia',
      'civilização', 'civilizacao', 'navio', 'naufrág', 'naufrag', 'tumba', 'templo',
      'medieval', 'colônia', 'colonia', 'ouro preto', 'saara', 'rota da seda', 'igreja',
      'pirâmide', 'piramide', 'dinastia', 'rei ', 'rainha', 'batalha', 'expedição', 'expedicao',
    ],
  },
  {
    tema: 'tecnologia/IA',
    termos: [
      'robô', 'robo', 'inteligência artificial', 'inteligencia artificial', 'ia ', 'algoritmo',
      'computador', 'digital', 'software', 'chatgpt', 'internet', 'criptografia', 'aplicativo',
    ],
  },
  {
    tema: 'produtividade/motivacional',
    termos: [
      'foco', 'estudo', 'estudar', 'produtiv', 'hábito', 'habito', 'disciplina', 'sucesso',
      'carreira', 'emprego', 'método', 'metodo', 'memoriz', 'motivac', 'motivaç',
    ],
  },
  {
    tema: 'natureza/animais',
    termos: [
      'planta', 'animal', 'animais', 'floresta', 'formiga', 'camelo', 'pássaro', 'passaro',
      'oceano', 'vulcão', 'vulcao', 'inseto', 'espécie', 'especie', 'árvore', 'arvore',
    ],
  },
  {
    tema: 'corpo/cérebro',
    termos: [
      'cérebro', 'cerebro', 'corpo', 'sono', 'dormir', 'memória', 'memoria', 'célula', 'celula',
      'sangue', 'coração', 'coracao', 'psicolog', 'mente', 'neurô', 'neuro',
    ],
  },
]

/** Papel do tema no Facebook — a rede que traz seguidor. Vem da medição, não de opinião. */
export const PAPEL_NO_FACEBOOK: Record<Tema, 'sorteia' | 'neutro' | 'morto'> = {
  'história/arqueologia': 'sorteia',
  'natureza/animais': 'neutro',
  'corpo/cérebro': 'neutro',
  outros: 'neutro',
  'tecnologia/IA': 'morto',
  'produtividade/motivacional': 'morto',
}

/** Mediana de views no Facebook medida por tema (29/07/2026) — só para exibir o porquê na tela. */
export const MEDIANA_FB_MEDIDA: Record<Tema, number> = {
  'história/arqueologia': 2919,
  'natureza/animais': 1134,
  'corpo/cérebro': 551,
  outros: 446,
  'tecnologia/IA': 268,
  'produtividade/motivacional': 252,
}

export function classificarTema(tituloRaw: string | null): Tema {
  const t = (tituloRaw || '').toLowerCase()
  if (!t.trim()) return 'outros'
  for (const d of DICIONARIO) {
    if (d.termos.some((termo) => t.includes(termo))) return d.tema
  }
  return 'outros'
}

/** Frase curta do porquê — o dono precisa poder discordar da classificação. */
export function motivoDoTema(tema: Tema): string {
  const papel = PAPEL_NO_FACEBOOK[tema]
  const med = MEDIANA_FB_MEDIDA[tema]
  if (papel === 'sorteia') return `mediana ${med} no FB e os 6 estouros de 48 dias saíram daqui`
  if (papel === 'morto') return `mediana ${med} no FB e zero estouros em 48 dias`
  return `mediana ${med} no FB, sem estouro registrado`
}
