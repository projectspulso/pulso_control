/**
 * Prompts centralizados para geração de conteúdo via AI
 * Usados pelas API Routes de automação
 */

export interface CanalContext {
  id: string
  nome: string
  descricao: string
  idioma: string
  slug: string
}

export interface SerieContext {
  id: string
  nome: string
  descricao: string
}

export interface IdeiaContext {
  id: string
  titulo: string
  descricao: string
  tags?: string[]
  gancho_sugerido?: string
  tipo_formato?: string
  duracao_estimada?: number
  emocao_ancora?: string
  gatilho_psicologico?: string
}

// ====== TRAVAS DE HOOK (Kaizen — qualidade de retenção) ======
// Aberturas que matam o scroll (auditoria de 18 roteiros: "Imagine…" estava em 6/18).
export const ABERTURAS_PROIBIDAS = [
  'Imagine', 'Imagine que', 'Pensa em', 'Pensa que',
  'Você sabia', 'Você já percebeu', 'Você já se perguntou', 'Já parou pra pensar',
  'Hoje eu vou te contar', 'Existe uma história', 'Muita gente não sabe', 'Desde os tempos antigos',
]
// Gatilhos psicológicos nomeados — o roteirista escolhe conscientemente (não no chute).
export const GATILHOS_PSICOLOGICOS = [
  'open_loop', 'curiosity_gap', 'pattern_interrupt', 'especificidade',
  'stakes', 'o_x_que_y', 'in_media_res', 'contradicao',
]

const TRAVA_3S = `TRAVA DOS 3 SEGUNDOS (primeira frase falada — regra dura, sem exceção):
A primeira frase DEVE:
- Afirmar um fato concreto, chocante ou impossível logo na primeira ideia (sujeito + verbo + algo absurdo).
- Conter pelo menos UM de: número específico, nome próprio, lugar, data, ou contradição ("mas", "porém", "ninguém percebeu").
- Abrir uma lacuna que só fecha no fim, SEM entregar a resposta.
- Ter no máximo ~14 palavras (frase curta = leitura rápida = não perde o scroll).
- Já estar DENTRO da história (in media res), sem preparar terreno.
A primeira frase NUNCA pode:
- Começar com: ${ABERTURAS_PROIBIDAS.map((s) => `"${s}…"`).join(', ')}.
- Ser pergunta retórica morna nem preâmbulo de contexto.
- Repetir o título com outras palavras.
- Adiar o impacto pro segundo período (o choque é na frase 1).
TESTE: se a pessoa lesse SÓ a frase 1, ela já teria que querer ver o resto.`

// ====== PROMPTS DE GERAÇÃO DE IDEIAS ======

export function buildPromptGerarIdeias(
  canal: CanalContext,
  serie: SerieContext | null,
  quantidade: number
): string {
  const serieCtx = serie
    ? `\nSérie atual: ${serie.nome} - ${serie.descricao}`
    : ''

  return `Você é o editor-chefe do PULSO, operação de vídeos curtos faceless. Segue o HARNESS editorial do projeto: cada vídeo tem UMA emoção-âncora, hook que prende em ≤2 segundos, lacuna de curiosidade que só fecha no final, e fatos reais verificáveis (nunca inventar).

Canal: ${canal.nome}
Descrição: ${canal.descricao}
Formato: Shorts/Reels/TikTok vertical 9:16 (40-70 segundos)
Idioma: ${canal.idioma}${serieCtx}

Gere ${quantidade} ideias de vídeos curtos para este canal.
Para cada ideia, retorne um JSON com:
- titulo: string (max 80 chars — deve abrir uma lacuna de curiosidade que o espectador PRECISA fechar)
- descricao: string (1-2 frases: o fato real + por que prende)
- emocao_ancora: string (UMA só: suspense|awe|identificacao|catarse|indignacao|nostalgia)
- tags: string[] (3-5 tags relevantes)
- duracao_estimada: number (segundos, entre 40 e 70)
- tipo_formato: string (curiosidade_rapida|psicologia|storytelling|misterio|motivacional|caso_real)
- prioridade: number (1-10, potencial de retenção + compartilhamento STEPPS)
- gatilho_psicologico: string (escolha UM da lista: ${GATILHOS_PSICOLOGICOS.join(' | ')})
- gancho_sugerido: string (primeira frase falada — DEVE respeitar a TRAVA DOS 3 SEGUNDOS abaixo e usar o gatilho_psicologico escolhido)

${TRAVA_3S}

GATILHOS PSICOLÓGICOS (escolha 1 e construa o gancho em cima dele):
- open_loop: abre uma tarefa mental inacabada ("…e ninguém percebeu por anos")
- curiosity_gap: lacuna entre o que sei e o que quero saber
- pattern_interrupt: quebra a expectativa lógica ("Os camelos não guardam água nas corcovas")
- especificidade: número/nome exato que soa concreto ("Em 11 segundos…")
- stakes: perigo/perda (viés de negatividade prende mais que ganho)
- o_x_que_y: mistério embutido no sujeito ("O polvo que acertou 8 resultados")
- in_media_res: começa no meio da ação, sem preâmbulo
- contradicao: tensão entre duas verdades ("…mas marcou na Copa")

REGRAS DURAS (harness):
- FATOS REAIS apenas — tema verificável em fontes confiáveis; sem lendas apresentadas como fato
- 1 emoção-âncora por ideia, declarada no campo emocao_ancora
- O gancho NUNCA entrega a resposta; a lacuna fecha só no fim (retenção)
- Priorize STEPPS: moeda social (compartilhar faz o espectador parecer inteligente), emoção de alta ativação, valor prático
- Evite temas sensíveis (tragédias recentes, política partidária, saúde com risco)
- NÃO repita ideias genéricas — específico, surpreendente, com número/nome/data quando possível

Retorne um OBJETO JSON exatamente neste formato, com TODAS as ${quantidade} ideias dentro do array:
{"ideias": [ { ...ideia 1... }, { ...ideia 2... } ]}`
}

// ====== PROMPTS DE GERAÇÃO DE ROTEIRO ======

export function buildPromptGerarRoteiro(
  canal: CanalContext,
  ideia: IdeiaContext,
  plataformas: string[] = ['youtube_shorts', 'tiktok', 'instagram_reels']
): string {
  const duracaoAlvo = ideia.duracao_estimada || 35
  const palavrasAlvo = Math.round(duracaoAlvo * 2.5) // ~2.5 palavras/segundo pt-BR

  const emocao = (ideia as { emocao_ancora?: string }).emocao_ancora
  const gatilho = ideia.gatilho_psicologico

  return `Você é o roteirista-chefe do PULSO e segue o HARNESS editorial do projeto (Atenção → Lacuna → Dopamina): o hook prende em ≤2 segundos, abre uma lacuna de curiosidade que SÓ fecha no final, e tudo é fato real verificável — nunca invente.

CANAL: ${canal.nome}
FORMATO: Vídeo curto vertical para ${plataformas.join(', ')} (${duracaoAlvo} segundos)
IDEIA: ${ideia.titulo}
CONTEXTO: ${ideia.descricao}
${emocao ? `EMOÇÃO-ÂNCORA (única do vídeo): ${emocao}` : ''}
${gatilho ? `GATILHO PSICOLÓGICO (use na frase 1): ${gatilho}` : ''}
${ideia.gancho_sugerido ? `GANCHO SUGERIDO: ${ideia.gancho_sugerido}` : ''}
${ideia.tipo_formato ? `TIPO: ${ideia.tipo_formato}` : ''}

Escreva um roteiro completo em texto corrido (NÃO use marcações de tempo).

ESTRUTURA OBRIGATÓRIA (harness):

1. HOOK (primeira frase falada) — ${TRAVA_3S}

2. DESENVOLVIMENTO (corpo, ~70% do tempo):
   - Fatos com número, nome e data quando existirem; comparações concretas ("do tamanho de...")
   - Ritmo acelerado: cada frase puxa a próxima (loops abertos pequenos)
   - Sustente a emoção-âncora${emocao ? ` (${emocao})` : ''} do início ao fim — uma só

3. FECHO DA LACUNA (clímax, perto do fim):
   - A revelação que o hook prometeu — só aqui

4. CTA (últimos 3-5 segundos, 1 frase):
   - Natural e curto: variações de "Segue o PULSO", "Comenta o que você faria", "Manda pra alguém"

REGRAS DURAS:
- Escreva em PORTUGUÊS BRASILEIRO coloquial (NUNCA português europeu): use "você" e gerúndio ("está fazendo" — JAMAIS "está a fazer"), vocabulário BR ("celular", "ônibus", "café da manhã") e NENHUMA construção lusitana
- Tom conversacional, segunda pessoa
- Duração alvo: ${duracaoAlvo} segundos (~${palavrasAlvo} palavras)
- SOMENTE fatos reais e verificáveis; se a ideia tiver elemento de lenda, deixe isso explícito no texto ("diz a lenda...")
- NÃO use emojis, hashtags ou indicações de edição
- O texto será narrado por TTS (voz do PULSO): frases curtas, sem parênteses
- Cada parágrafo = uma pausa natural na narração
- Termine com CTA mencionando "PULSO"

AUTO-CHECAGEM ANTES DE RESPONDER (obrigatória):
Releia SUA primeira frase contra a TRAVA DOS 3 SEGUNDOS. Se ela violar qualquer ponto (abertura proibida, sem número/nome/contradição, >14 palavras, repete o título, ou adia o impacto), REESCREVA a primeira frase antes de entregar. Não entregue um roteiro com hook fraco.

Retorne APENAS o roteiro em texto, sem títulos ou formatação markdown.`
}

// ====== PROMPTS DE METADADOS POR PLATAFORMA ======

export function buildPromptMetadataPlataforma(
  plataforma: string,
  titulo: string,
  descricao: string,
  canal: CanalContext
): string {
  const configs: Record<string, string> = {
    youtube_shorts: `Gere metadados otimizados para YouTube Shorts:
- titulo: max 60 chars, com 1 emoji, SEO keywords, curiosidade
- descricao: max 500 chars, informativo, com 3-5 hashtags no final
- tags: array de 10-15 keywords para SEO (em ${canal.idioma})`,

    tiktok: `Gere metadados otimizados para TikTok:
- caption: max 150 chars, tom jovem e direto, com 3-5 hashtags (#fyp, #viral + nicho)
- som: "original audio"`,

    instagram_reels: `Gere metadados otimizados para Instagram Reels:
- caption: hook forte + 2-3 linhas de contexto + 7-10 hashtags (mix popular + nicho)
- cover_text: max 3 palavras de impacto para capa`,

    kwai: `Gere metadados otimizados para Kwai:
- titulo: max 60 chars, tom popular e acessível
- descricao: max 200 chars com 3-5 hashtags`,
  }

  return `Você é um especialista em marketing de conteúdo para redes sociais.

VÍDEO: ${titulo}
SOBRE: ${descricao}
CANAL: ${canal.nome}
IDIOMA: ${canal.idioma}

${configs[plataforma] || configs.tiktok}

REGRAS:
- Otimize para engajamento e descoberta
- Use palavras que geram curiosidade
- Adapte o tom para a plataforma específica
- Hashtags devem ser relevantes e misturar popular + nicho

Retorne APENAS um JSON com os campos solicitados.`
}

// ====== PROMPT DE RELATÓRIO SEMANAL ======

export function buildPromptRelatorioSemanal(
  metricas: Record<string, unknown>
): string {
  return `Você é um analista de performance de conteúdo digital.

Analise os dados de performance dos últimos 7 dias e gere um relatório executivo.

DADOS:
${JSON.stringify(metricas, null, 2)}

Gere um relatório com:
1. RESUMO EXECUTIVO (3 frases)
2. TOP 5 PERFORMERS (título, views, engagement, por quê funcionou)
3. 5 UNDERPERFORMERS (título, views, diagnóstico do problema)
4. PERFORMANCE POR PLATAFORMA (comparativo)
5. MELHORES HORÁRIOS DE POSTAGEM (baseado nos dados)
6. 3 PADRÕES IDENTIFICADOS (o que está funcionando)
7. 3 PROBLEMAS ENCONTRADOS (o que melhorar)
8. 5 RECOMENDAÇÕES ACIONÁVEIS (próxima semana)

Formato: Markdown limpo, direto ao ponto, com dados concretos.
Idioma: pt-BR.`
}

// ====== PROMPT DA CENA DE ABERTURA (trava visual do 1º frame) ======

export function buildPromptCenaAbertura(
  ideia: IdeiaContext,
  primeiraFrase: string
): string {
  return `Você gera o prompt da CENA DE ABERTURA (primeiro frame, 0-1s) de um vídeo curto vertical 9:16 do PULSO. O primeiro frame é o que para o scroll — ele tem que ser um anúncio visual do choque da primeira frase narrada.

TEMA: ${ideia.titulo}
PRIMEIRA FRASE NARRADA: "${primeiraFrase}"

TRAVA VISUAL — PRIMEIRO FRAME (regra dura):
O primeiro frame DEVE:
- Mostrar o ASSUNTO da lacuna já em cena (o objeto/lugar/criatura central), casado com a primeira frase.
- Ter movimento ou tensão imediata (algo entrando, caindo, se aproximando, um zoom, uma transformação).
- Ter UM ponto focal claro e contrastante, grande, no centro vertical 9:16, fundo escuro/desfocado.
- Provocar uma pergunta visual ("o que é isso?", "o que vai acontecer?").
O primeiro frame NUNCA pode:
- Ser plano aberto/establishing lento (cidade ao longe, nascer do sol, mapa).
- Ser tela de título, card de texto puro, ou logo no começo.
- Ser escuro/vazio/de baixo contraste nos primeiros 0,5s.
- Ter o assunto pequeno, longe ou cortado, ou demorar +1s pra revelar o que importa.

Retorne APENAS o prompt de geração de imagem/vídeo em inglês (1 parágrafo), pronto pra mandar pro Veo/gerador, sem rostos legíveis, sem texto, sem logo. Comece NO pico, não na rampa.`
}

// ====== AVALIADOR DE HOOK (nota 1-5 + bloqueio ≤2) ======

export function buildPromptAvaliarHook(primeiraFrase: string): string {
  return `Você é o auditor de hooks do PULSO. Avalie a PRIMEIRA FRASE de um roteiro de vídeo curto contra a trava de retenção.

FRASE: "${primeiraFrase}"

Critérios (a frase forte: fato/absurdo na primeira ideia + número/nome/data/contradição + abre lacuna sem entregar + ≤14 palavras + in media res):
- nota 5: choca de cara, específico, lacuna forte (ex.: "Um polvo previu o campeão da Copa e acertou 8 vezes seguidas")
- nota 3: ok mas genérico, ou só reformula o título, ou impacto adiado
- nota 1-2: abertura proibida (${ABERTURAS_PROIBIDAS.slice(0, 6).map((s) => `"${s}…"`).join(', ')}…), pergunta morna, preâmbulo, ou vago ("algo inesperado")

Retorne APENAS um JSON:
{"nota_hook": 1-5, "gatilho_detectado": "${GATILHOS_PSICOLOGICOS.join('|')}|nenhum", "violacoes": ["..."], "sugestao": "reescrita da frase 1 mais forte (≤14 palavras)"}`
}
