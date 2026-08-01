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

/**
 * O título sozinho é uma amostra pobre demais. "A Misteriosa Biblioteca Subterrânea de Paris" caía
 * em "outros" — e o roteiro dela é "antigas catacumbas", Segunda Guerra, documento histórico:
 * arqueologia pura. Com o rótulo errado, a agenda deixava de priorizar o único tema que estoura no
 * Facebook, e a tela dizia "0 de 12 prontos no tema que sorteia" quando havia pelo menos 1.
 *
 * O CORPO ENTRA, MAS SÓ COM PROVA. A primeira tentativa foi ingênua — "se o título não decidir,
 * vale o primeiro termo que casar no roteiro" — e reclassificou 66 das 198 ideias, quase todas
 * errado: "O jogador que dançava na bandeirinha" virou corpo/cérebro por citar "corpo" uma vez,
 * "Sertanejo Universitário" virou tecnologia/IA. Roteiro é prosa de 1.500 caracteres; qualquer
 * palavra de passagem ganhava sozinha.
 *
 * A regra que sobrou, calibrada contra as 198 ideias do banco: conta TERMOS DISTINTOS por tema no
 * corpo, e o vencedor só vale com 3+ e à frente do segundo colocado. Menção solta não classifica;
 * insistência sim. O título continua sendo o voto forte — o corpo só é lido quando ele não diz nada.
 *
 * E o corpo NUNCA rotula tema MORTO. O dano é assimétrico: rotular de morto tira 35 pontos do
 * candidato na agenda, e com piso 3 os cinco únicos erros que sobravam eram exatamente isso —
 * "sucuris e carrapatos" e "teoria científica que ninguém provou" viravam produtividade por citar
 * 'método' e 'estudo' de passagem, e iam pro fim da fila. Deixar em "outros" (neutro) não decide
 * nada errado; rebaixar por prova fraca, sim.
 *
 * @param corpoRaw roteiro (conteudo_md) ou descrição — opcional; quando ausente, nada muda
 */
const MIN_TERMOS_NO_CORPO = 3

export function classificarTema(tituloRaw: string | null, corpoRaw?: string | null): Tema {
  const doTitulo = classificarTexto(tituloRaw)
  if (doTitulo !== 'outros') return doTitulo
  return classificarCorpo(corpoRaw ?? null)
}

function casa(texto: string, termoRaw: string): boolean {
  const termo = semAcento(termoRaw.toLowerCase())
  if (RE_PALAVRA_INTEIRA.test(termo)) {
    return new RegExp(`(^|[^a-z0-9])${termo.trim()}([^a-z0-9]|$)`, 'i').test(texto)
  }
  return texto.includes(termo)
}

/** Título: o primeiro tema que casar vence (a ordem do DICIONARIO é a prioridade). */
function classificarTexto(raw: string | null): Tema {
  const t = semAcento((raw || '').toLowerCase())
  if (!t.trim()) return 'outros'
  for (const d of DICIONARIO) if (d.termos.some((termo) => casa(t, termo))) return d.tema
  return 'outros'
}

/** Corpo: vence quem tiver mais termos DISTINTOS, com piso de 2 e sem empate no topo. */
function classificarCorpo(raw: string | null): Tema {
  const t = semAcento((raw || '').toLowerCase())
  if (!t.trim()) return 'outros'
  const placar = DICIONARIO.map((d) => ({
    tema: d.tema,
    n: d.termos.filter((termo) => casa(t, termo)).length,
  })).sort((a, b) => b.n - a.n)
  const campeao = placar[0]
  const vice = placar[1]
  if (!campeao || campeao.n < MIN_TERMOS_NO_CORPO) return 'outros'
  if (vice && vice.n >= campeao.n) return 'outros'
  if (PAPEL_NO_FACEBOOK[campeao.tema] === 'morto') return 'outros'
  return campeao.tema
}

/** Frase curta do porquê — o dono precisa poder discordar da classificação. */
export function motivoDoTema(tema: Tema): string {
  const papel = PAPEL_NO_FACEBOOK[tema]
  const med = MEDIANA_FB_MEDIDA[tema]
  if (papel === 'sorteia') return `os 6 estouros de 48 dias saíram deste tema (mediana ${med} no FB)`
  if (papel === 'morto') return `mediana ${med} no FB e zero estouros em 48 dias`
  return `mediana ${med} no FB, sem estouro registrado`
}
