/**
 * CLASSIFICADOR DE TEMA — o único sinal de assunto que sobreviveu ao teste.
 *
 * MEDIDO sobre as 95 publicações de Facebook (48 dias). Remedido em 30/07 com o dicionário
 * ampliado — os números mudaram, a conclusão não:
 *
 *   tema                        n   mediana FB   estouros (≥3k)
 *   história/arqueologia       16        1.160      6 de 6  ← monopólio
 *   natureza/animais            3        1.134           0
 *   corpo/cérebro               8          521           0
 *   (outros)                   58          399           0
 *   produtividade/motivacional  6          253           0
 *   tecnologia/IA               6          176           0
 *
 * O DADO QUE DECIDE não é a mediana, é o monopólio: TODOS os 6 estouros de 48 dias são
 * história/arqueologia — 6 dos 16 vídeos do tema viraram estouro, contra ZERO nos outros 79.
 * A mediana caiu de 2.919 para 1.160 só porque o dicionário passou a reconhecer 4 vídeos
 * medianos que antes caíam em "outros"; ampliar o recall diluiu a média sem tocar no sinal.
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

/** Ordem importa: o primeiro tema que casa vence. Por isso história/arqueologia vem antes —
 *  "navio" e "castelo" pertencem a ela mesmo quando o título também fala de natureza. */
const DICIONARIO: Array<{ tema: Tema; termos: string[] }> = [
  {
    tema: 'história/arqueologia',
    termos: [
      'fóssil', 'fossil', 'cidade perdida', 'ruína', 'ruina', 'arqueolog', 'antig', 'século',
      'seculo', 'império', 'imperio', 'guerra', 'faraó', 'farao', 'múmia', 'mumia',
      'civilização', 'civilizacao', 'navio', 'naufrág', 'naufrag', 'tumba', 'templo',
      'medieval', 'colônia', 'colonia', 'ouro preto', 'saara', 'rota da seda', 'igreja',
      'pirâmide', 'piramide', 'dinastia', 'rei ', 'rainha', 'batalha', 'expedição', 'expedicao',
      // AMPLIADO EM 30/07: o dicionário não reconhecia vocabulário óbvio e a agenda mostrava
      // "0 de 40 no tema que sorteia" com o estoque cheio de arqueologia. "Os manuscritos que
      // revelaram um segredo milenar" caía em "outros" — e o roteador não prioriza o que não
      // reconhece. Precisão no topo já era perfeita (os 6 estouros acertados); faltava recall.
      'manuscrito', 'pergaminho', 'hieróglif', 'hieroglif', 'inscrição', 'inscricao',
      'milenar', 'ancestral', 'relíquia', 'reliquia', 'artefato', 'escavaç', 'escavac',
      'submers', 'catacumba', 'castelo', 'fortaleza', 'muralha', 'tesouro',
      'a.c.', 'd.c.', 'idade média', 'idade media', 'sarcófago', 'sarcofago',
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

/**
 * Mediana de views no Facebook por tema. REMEDIDO em 30/07/2026 depois de ampliar o dicionário —
 * história/arqueologia foi de 12 para 16 vídeos e a mediana caiu de 2.919 para 1.160, porque
 * entraram 4 vídeos medianos que antes ficavam em "outros".
 *
 * A mediana caiu, o SINAL não: os 6 estouros (>=3k) de 48 dias continuam TODOS em
 * história/arqueologia, e nenhum outro tema jamais produziu um. É essa a informação que decide —
 * a mediana serve só pra dar escala na tela.
 */
export const MEDIANA_FB_MEDIDA: Record<Tema, number> = {
  'história/arqueologia': 1160,
  'natureza/animais': 1134,
  'corpo/cérebro': 521,
  outros: 399,
  'produtividade/motivacional': 253,
  'tecnologia/IA': 176,
}

/**
 * Termos curtos precisam casar como PALAVRA INTEIRA. Com `includes` puro, o token "ia " marcava
 * "teor**ia** científica" como tecnologia/IA — e a agenda passou a rebaixar um vídeo de ciência
 * achando que era tema morto. O mesmo valia para "rei " dentro de outras palavras. Termos longos
 * seguem por substring de propósito: "arqueolog" precisa pegar arqueologia/arqueólogo/arqueológico.
 */
const RE_PALAVRA_INTEIRA = /^[a-z]{1,4}\s?$/i

/**
 * Tira acento dos DOIS lados da comparação. Sem isto, "arque**ó**logos" não casava com o termo
 * `arqueolog` do dicionário e "A máscara enigmática que confundiu os arqueólogos" caía em
 * "outros" — arqueologia pura classificada como tema neutro, e o roteador da agenda deixando de
 * priorizar o único tema que estoura no Facebook. Achado em 31/07 ao ranquear o que publicar.
 */
const semAcento = (x: string) => x.normalize('NFD').replace(/[̀-ͯ]/g, '')

export function classificarTema(tituloRaw: string | null): Tema {
  const t = semAcento((tituloRaw || '').toLowerCase())
  if (!t.trim()) return 'outros'
  for (const d of DICIONARIO) {
    const casou = d.termos.some((termoRaw) => {
      const termo = semAcento(termoRaw.toLowerCase())
      if (RE_PALAVRA_INTEIRA.test(termo)) {
        return new RegExp(`(^|[^a-z0-9])${termo.trim()}([^a-z0-9]|$)`, 'i').test(t)
      }
      return t.includes(termo)
    })
    if (casou) return d.tema
  }
  return 'outros'
}

/** Frase curta do porquê — o dono precisa poder discordar da classificação. */
export function motivoDoTema(tema: Tema): string {
  const papel = PAPEL_NO_FACEBOOK[tema]
  const med = MEDIANA_FB_MEDIDA[tema]
  if (papel === 'sorteia') return `os 6 estouros de 48 dias saíram deste tema (mediana ${med} no FB)`
  if (papel === 'morto') return `mediana ${med} no FB e zero estouros em 48 dias`
  return `mediana ${med} no FB, sem estouro registrado`
}
