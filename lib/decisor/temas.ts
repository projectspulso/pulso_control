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

/*
 * ATUALIZAÇÃO 30/09/2026 — O QUE ESTÁ ACIMA ENVELHECEU, E POR ISSO O NÚMERO SAIU DO CÓDIGO.
 * Remedido sobre 221 publicações de Facebook: de 31/07 a 30/09 história/arqueologia fez ZERO
 * estouros em 43 vídeos (mediana 1.193 → 530 → 779), e os dois ≥3k do período caíram em "outros"
 * — que era metade do acervo (114 de 221), incluindo a Máquina de Antikythera (3.552, o maior de
 * setembro). A agenda seguia dando o bônus máximo a um tema "que sorteia" que tinha parado de
 * sortear, com a frase de julho na tela.
 *
 * Mudou: (1) o papel de cada tema (sorteia/neutro/morto) e as medianas são MEDIDOS toda manhã por
 * `medirTemas` (rotina /api/automation/aprender → configuracoes.temas_medidos) sobre janela móvel
 * de 90 dias; sem medição, todo tema é neutro — número velho não decide mais nada. (2) o
 * dicionário ganhou os temas que viviam escondidos em "outros": espaço, games, esporte/Copa,
 * terra/clima e mistério/inexplicável.
 */

export type Tema =
  | 'história/arqueologia'
  | 'espaço/universo'
  | 'games'
  | 'esporte/Copa'
  | 'terra/clima'
  | 'natureza/animais'
  | 'corpo/cérebro'
  | 'tecnologia/IA'
  | 'produtividade/motivacional'
  | 'mistério/inexplicável'
  | 'outros'

export const TEMAS: Tema[] = [
  'história/arqueologia', 'espaço/universo', 'games', 'esporte/Copa', 'terra/clima', 'natureza/animais',
  'corpo/cérebro', 'tecnologia/IA', 'produtividade/motivacional', 'mistério/inexplicável', 'outros',
]

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
      // 30/09: nomes de sítios e povos antigos que caíam em "outros" (Antikythera era o maior
      // Facebook de setembro rotulado como tema neutro)
      'antikythera', 'petra', 'atlântida', 'atlantida', 'pré-históri', 'pre-histori', 'pompeia',
      'viking', 'egito', 'egípci', 'egipci', 'babilôn', 'babilon', 'asteca', 'maias', 'romanos',
    ],
  },
  {
    tema: 'espaço/universo',
    termos: [
      'buraco negro', 'estrela', 'planeta', 'galáxia', 'galaxia', 'universo', 'no espaço', 'no espaco',
      'sistema solar', 'lua', 'eclipse', 'asteroide', 'cometa', 'nasa', 'astronaut', 'marte',
      'satélite', 'satelite', 'cosmo', 'meteor',
    ],
  },
  {
    tema: 'games',
    termos: [
      'game', 'games', 'videogame', 'nintendo', 'console', 'tetris', 'zelda', 'mario', 'vice city',
      'easter egg', 'playstation', 'sega', 'atari', 'fliperama',
    ],
  },
  {
    tema: 'esporte/Copa',
    termos: [
      'copa', 'gol', 'estádio', 'estadio', 'seleção', 'selecao', 'maracan', 'jogador', 'futebol',
      'campeonato', 'eliminatória', 'eliminatoria', 'olimpíad', 'olimpiad', 'torcida', 'apito',
    ],
  },
  {
    tema: 'terra/clima',
    termos: [
      'terremoto', 'treme', 'sísm', 'sism', 'el niño', 'el nino', 'clima', 'chuva', 'furacão',
      'furacao', 'tornado', 'relâmpago', 'relampago', 'raio', 'glaciar', 'geleira', 'tsunami',
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
      'aranha', 'cacto', 'pinguim', 'sucuri', 'lagosta', 'polvo', 'baleia', 'elefante', 'zebra',
      'castor', 'tubarão', 'tubarao', 'abelha', 'cobra',
    ],
  },
  {
    tema: 'corpo/cérebro',
    termos: [
      'cérebro', 'cerebro', 'corpo', 'sono', 'dormir', 'memória', 'memoria', 'célula', 'celula',
      'sangue', 'coração', 'coracao', 'psicolog', 'mente', 'neurô', 'neuro',
    ],
  },
  {
    // POR ÚLTIMO de propósito: "mistério" aparece em quase todo título do PULSO. Só rotula quando
    // nenhum assunto concreto casou — "O Mistério do Voo 19", "O diário que previu desastres".
    tema: 'mistério/inexplicável',
    termos: [
      'mistério', 'misterio', 'enigma', 'inexplic', 'sem explicação', 'sem explicacao', 'desaparec',
      'sumiu', 'sumiram', 'previu', 'profecia', 'maldição', 'maldicao', 'assombr', 'indecifr',
      'proibido', 'sobrenatural', 'fantasma', 'reencarna', 'estranho caso', 'ninguém sabe',
      'ninguem sabe', 'sem solução', 'sem solucao', 'bermudas',
    ],
  },
]

export type PapelTema = 'sorteia' | 'neutro' | 'morto'

/** O corpo do roteiro nunca decide estes: prova fraca custa caro (morto tira pontos na agenda) e
 *  "mistério" está em quase toda prosa do PULSO. Só o título rotula. */
const CORPO_NAO_DECIDE: Tema[] = ['tecnologia/IA', 'produtividade/motivacional', 'mistério/inexplicável']

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
  if (CORPO_NAO_DECIDE.includes(campeao.tema)) return 'outros'
  return campeao.tema
}


// ====== TEMAS MEDIDOS (o papel vem do dado de agora, não de julho) ======

export const LIMITE_ESTOURO_FB = 3000
const LIMITE_ACERTO_FB = 1000
const AMOSTRA_MINIMA = 5

export interface MedidaTema {
  n: number
  mediana: number
  estouros: number
  /** fração dos vídeos do tema que passaram de 1.000 no Facebook */
  taxaAcerto: number
  papel: PapelTema
  porque: string
  /** mediana nas outras redes, para o gerador mirar a rede certa */
  porRede: Record<string, { n: number; mediana: number }>
}

export interface TemasMedidos {
  atualizadoEm: string
  janelaDias: number
  geral: { n: number; mediana: number; taxaAcerto: number; estouros: number }
  porTema: Partial<Record<Tema, MedidaTema>>
}

export interface PublicacaoParaMedir {
  ideiaId: string
  plataforma: string
  views: number | null
  dataPublicacao: string | null
}

const mediana = (a: number[]) => {
  if (!a.length) return 0
  const s = [...a].sort((x, y) => x - y)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

/**
 * Mede cada tema no Facebook (a rede que sorteia) numa janela móvel. Regras:
 *   sorteia = amostra ≥5, mediana ≥ a geral, e (estourou ao menos 1× OU acerta ≥1,5× a taxa geral)
 *   morto   = amostra ≥5, zero estouro, acerta ≤ metade da taxa geral e mediana ≤ 70% da geral
 *   neutro  = o resto, inclusive amostra pequena (sem prova, não decide)
 * Vídeo com menos de 3 dias fica fora: ainda está subindo.
 */
export function medirTemas(
  pubs: PublicacaoParaMedir[],
  titulos: Map<string, string>,
  corpos: Map<string, string | null> | undefined,
  hojeISO: string,
  janelaDias = 90
): TemasMedidos {
  const hoje = new Date(`${hojeISO}T12:00:00Z`).getTime()
  const inicio = new Date(hoje - janelaDias * 86_400_000).toISOString().slice(0, 10)
  const maduro = new Date(hoje - 3 * 86_400_000).toISOString().slice(0, 10)
  const temaDe = new Map<string, Tema>()
  const tema = (id: string) => {
    if (!temaDe.has(id)) temaDe.set(id, classificarTema(titulos.get(id) || '', corpos?.get(id)))
    return temaDe.get(id)!
  }
  const valores = new Map<string, number[]>() // `${rede}|${tema}`
  const fbGeral: number[] = []
  for (const p of pubs) {
    const d = (p.dataPublicacao || '').slice(0, 10)
    if (!d || d < inicio || d > maduro || !titulos.has(p.ideiaId)) continue
    const v = p.views ?? 0
    const k = `${p.plataforma}|${tema(p.ideiaId)}`
    if (!valores.has(k)) valores.set(k, [])
    valores.get(k)!.push(v)
    if (p.plataforma === 'facebook') fbGeral.push(v)
  }
  const taxa = (a: number[]) => (a.length ? a.filter((v) => v >= LIMITE_ACERTO_FB).length / a.length : 0)
  const geral = {
    n: fbGeral.length,
    mediana: Math.round(mediana(fbGeral)),
    taxaAcerto: taxa(fbGeral),
    estouros: fbGeral.filter((v) => v >= LIMITE_ESTOURO_FB).length,
  }
  const porTema: Partial<Record<Tema, MedidaTema>> = {}
  for (const t of TEMAS) {
    const fb = valores.get(`facebook|${t}`) || []
    const porRede: Record<string, { n: number; mediana: number }> = {}
    for (const [k, arr] of valores) {
      const [rede, tt] = k.split('|')
      if (tt === t) porRede[rede] = { n: arr.length, mediana: Math.round(mediana(arr)) }
    }
    if (!Object.keys(porRede).length) continue
    const m = Math.round(mediana(fb))
    const estouros = fb.filter((v) => v >= LIMITE_ESTOURO_FB).length
    const tx = taxa(fb)
    let papel: PapelTema = 'neutro'
    let porque = `mediana ${m} no FB (geral ${geral.mediana}), n=${fb.length} em ${janelaDias} dias`
    if (fb.length < AMOSTRA_MINIMA) {
      porque = `amostra pequena (${fb.length} no FB em ${janelaDias} dias) — não decide`
    } else if (m >= geral.mediana && (estouros > 0 || (geral.taxaAcerto > 0 && tx >= 1.5 * geral.taxaAcerto))) {
      papel = 'sorteia'
      porque = estouros > 0
        ? `${estouros} estouro${estouros > 1 ? 's' : ''} ≥3k em ${janelaDias} dias, mediana ${m} no FB (geral ${geral.mediana})`
        : `${Math.round(tx * 100)}% passam de 1k no FB (geral ${Math.round(geral.taxaAcerto * 100)}%), mediana ${m}`
    } else if (estouros === 0 && tx <= 0.5 * geral.taxaAcerto && m <= 0.7 * geral.mediana) {
      papel = 'morto'
      porque = `mediana ${m} no FB (geral ${geral.mediana}) e zero estouros em ${janelaDias} dias`
    }
    porTema[t] = { n: fb.length, mediana: m, estouros, taxaAcerto: tx, papel, porque, porRede }
  }
  return { atualizadoEm: new Date().toISOString(), janelaDias, geral, porTema }
}

/** Sem medição (config vazia ou tema sem amostra) o tema é neutro: número velho não decide. */
export function papelDoTema(tema: Tema, m?: TemasMedidos | null): PapelTema {
  return m?.porTema[tema]?.papel ?? 'neutro'
}

export function medianaFbDoTema(tema: Tema, m?: TemasMedidos | null): number | null {
  return m?.porTema[tema]?.mediana ?? null
}

/** Frase curta do porquê — o dono precisa poder discordar da classificação. */
export function motivoDoTema(tema: Tema, m?: TemasMedidos | null): string {
  return m?.porTema[tema]?.porque ?? 'sem medição recente deste tema'
}
