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
  'prova_social', 'autoridade', 'negatividade', 'novidade',
]

// Tipos de hook (estado da arte short-form faceless 2024-26) — escolhe 1 por roteiro.
export const TIPOS_HOOK = `TIPOS DE HOOK (escolha 1 e combine com 2 gatilhos psicológicos):
- bold_claim: afirmação ousada/contraintuitiva logo de cara ("A maioria usa o carregador errado a vida toda")
- curiosity_gap: lacuna de conhecimento que o cérebro precisa fechar ("Tem um motivo de você esquecer sonhos em 5 minutos")
- micro_historia: começa no meio da ação, in media res ("Em 1845 um navio sumiu — 170 anos depois acharam")
- pergunta_identificadora: o espectador se reconhece ("Você também faz isso sem perceber?")
- promessa_especifica: resultado mensurável e concreto ("Esse detalhe de 5 segundos mudou tudo")
- pattern_interrupt: quebra de expectativa / estatística absurda no frame 1`

// ====== HARNESS EDITORIAL "DO MOMENTO" (raia de atualidades com guardrails) ======
// Surfa o assunto em alta pelo ângulo educativo/histórico/científico — nunca a desgraça.
export const HARNESS_DO_MOMENTO = `HARNESS EDITORIAL "DO MOMENTO" (raia de atualidades — regra dura, sem exceção):
O PULSO surfa o ASSUNTO em alta, mas NUNCA a desgraça. O ângulo é SEMPRE educativo: o "porquê", a ciência, a história por trás do que está no noticiário.
PODE:
- Explicar o fenômeno por trás da notícia (terremoto → por que o Círculo de Fogo treme, relação com o El Niño; tensão geopolítica → a raiz histórica milenar do conflito).
- Trazer contexto histórico, científico, geográfico ou cultural — sempre fato consolidado e verificável.
- Conectar o evento atual a uma curiosidade atemporal (a parte "que ninguém te conta").
NUNCA:
- Surfar tragédia / morte / sofrimento como espetáculo: nada de contagem de vítimas, imagem chocante, tom sensacionalista ou apelo mórbido.
- Tomar posição política, partidária ou religiosa: sem "lado certo", sem opinião — só o histórico/factual neutro.
- Inventar, especular como se fosse fato, usar boato ou notícia não confirmada. Dado não verificável → NÃO usa.
- Prever desdobramentos, dar conselho, ou parecer que está "cobrindo a notícia" — o PULSO não é jornal, é o "porquê" por trás.
VERIFICAÇÃO: todo número, nome, data e afirmação histórica precisa ser fato consolidado. Na dúvida, escolha o ângulo mais atemporal e seguro (a história/ciência), não o evento quente em si.`

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
JANELA REAL: o espectador decide continuar em <2 segundos — o gancho falado tem que CABER em ~2,5s (frase curta). 50-60% saem nos 3 primeiros segundos; a meta é segurar 70%+.
FUNCIONA MUDO: 60%+ assistem sem som — a frase 1 precisa fazer sentido lida na legenda, sozinha, sem áudio.
TESTE: se a pessoa lesse SÓ a frase 1 (sem som), ela já teria que querer ver o resto.`

// ====== PROMPTS DE GERAÇÃO DE IDEIAS ======

export function buildPromptGerarIdeias(
  canal: CanalContext,
  serie: SerieContext | null,
  quantidade: number,
  aprendizado?: string
): string {
  const serieCtx = serie
    ? `\nSérie atual: ${serie.nome} - ${serie.descricao}`
    : ''
  const aprendizadoCtx = aprendizado ? `\n\n${aprendizado}` : ''

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
- tipo_hook: string (escolha UM tipo: bold_claim|curiosity_gap|micro_historia|pergunta_identificadora|promessa_especifica|pattern_interrupt)
- gancho_sugerido: string (primeira frase falada — DEVE respeitar a TRAVA DOS 3 SEGUNDOS, usar o tipo_hook e combinar 2 gatilhos psicológicos)

${TRAVA_3S}

${TIPOS_HOOK}${aprendizadoCtx}

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

// ====== PROMPT "DO MOMENTO" (assunto em alta → ideia no DNA PULSO, com guardrails) ======

/**
 * Transforma um ASSUNTO EM ALTA num vídeo PULSO pelo ângulo educativo/atemporal.
 * Saída no mesmo shape de buildPromptGerarIdeias (flui pro pipeline de roteiro),
 * + campo precisa_revisao pra travar revisão humana em tema sensível.
 */
export function buildPromptDoMomento(assunto: string, canal: CanalContext): string {
  return `Você é o editor-chefe do PULSO na raia "DO MOMENTO". Recebeu um ASSUNTO EM ALTA e precisa transformá-lo num vídeo curto faceless no DNA do PULSO: curiosidade / história / ciência — o "porquê" por trás, NUNCA a manchete.

ASSUNTO EM ALTA: ${assunto}
CANAL: ${canal.nome}
FORMATO: Shorts/Reels/TikTok vertical 9:16 (40-70s), pt-BR.

${HARNESS_DO_MOMENTO}

Sua tarefa: achar O ÂNGULO ATEMPORAL desse assunto (o fenômeno, a origem histórica, a ciência) e gerar UMA ideia de vídeo em cima dele — não sobre a notícia, sobre o "porquê" que ela desperta.

Retorne APENAS um JSON:
- titulo: string (max 80 — abre lacuna de curiosidade que o espectador PRECISA fechar)
- angulo: string (1 frase: qual história/ciência/"porquê" vamos contar — explicitamente o ângulo atemporal, NÃO a notícia)
- descricao: string (1-2 frases: o fato real + por que prende)
- emocao_ancora: string (awe|suspense|nostalgia|identificacao|catarse — EVITE indignacao em tema sensível)
- tags: string[] (3-5)
- duracao_estimada: number (40-70)
- tipo_formato: string (curiosidade_rapida|misterio|storytelling|caso_real|psicologia)
- prioridade: number (1-10)
- gatilho_psicologico: string (UM da lista: ${GATILHOS_PSICOLOGICOS.join(' | ')})
- gancho_sugerido: string (primeira frase falada — respeita a TRAVA DOS 3 SEGUNDOS abaixo)
- precisa_revisao: boolean (true se o assunto tocar guerra ativa, desastre recente, religião ou política — exige revisão humana antes de publicar)
- motivo_revisao: string (se precisa_revisao=true, 1 frase do porquê; senão "")

${TRAVA_3S}

Se NÃO houver um ângulo educativo/atemporal seguro pra esse assunto (ex.: só faz sentido falando da tragédia em si), retorne {"descartar": true, "motivo": "..."} em vez da ideia.`
}

// ====== PROMPTS DE GERAÇÃO DE ROTEIRO ======

export function buildPromptGerarRoteiro(
  canal: CanalContext,
  ideia: IdeiaContext,
  plataformas: string[] = ['youtube_shorts', 'tiktok', 'instagram_reels'],
  aprendizado?: string
): string {
  const duracaoAlvo = ideia.duracao_estimada || 35
  const palavrasAlvo = Math.round(duracaoAlvo * 2.5) // ~2.5 palavras/segundo pt-BR

  const emocao = (ideia as { emocao_ancora?: string }).emocao_ancora
  const gatilho = ideia.gatilho_psicologico
  const aprendizadoCtx = aprendizado ? `\n\n${aprendizado}` : ''
  // promessa de série pra o CTA = o tema do canal (motivo concreto pra seguir)
  const promessaSerie = canal.nome.replace(/^PULSO\s*/i, '').trim() || 'histórias que ninguém te conta'

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

ESTRUTURA OBRIGATÓRIA (Hook → Body → Payoff — estado da arte short-form):

1. HOOK (primeira frase falada, 1-3s) — ${TRAVA_3S}

2. BODY (desenvolvimento, ~70-80% do tempo):
   - Fatos com número, nome e data quando existirem; comparações concretas ("do tamanho de...")
   - RE-HOOK a cada 5-7 segundos: uma frase de transição que reabre tensão ("Mas tem uma coisa...", "E aí que fica estranho..."), um mini open-loop, ou um marcador de progresso. NUNCA deixe um trecho longo morno.
   - Cada frase puxa a próxima; sustente UMA emoção-âncora${emocao ? ` (${emocao})` : ''} do início ao fim
   - Mantenha o open-loop do hook ABERTO — não entregue a resposta aqui (efeito Zeigarnik)

3. PAYOFF (clímax, ~10-20% final):
   - A revelação que o hook prometeu — só aqui, e que valha a espera
   - FECHE EM LOOP: a última frase deve ecoar/responder o gancho de um jeito que dá vontade de rever o começo (replay impulsiona distribuição)

4. CTA (1 frase, atrelado a promessa de série — NÃO um "tchau"):
   - UM só CTA de seguir, com MOTIVO concreto e promessa do canal: ex. "Segue o PULSO pra mais ${promessaSerie} que ninguém te conta."
   - O CTA dá uma razão pra voltar (a série continua), não uma despedida genérica
   - PROIBIDO engagement bait (penalizado pelas redes): nada de "comenta SIM", "comenta uma palavra/emoji", "marca 3 amigos", cliffhanger oco só pra forçar comentário

REGRAS DURAS:
- Escreva em PORTUGUÊS BRASILEIRO coloquial (NUNCA português europeu): use "você" e gerúndio ("está fazendo" — JAMAIS "está a fazer"), vocabulário BR ("celular", "ônibus", "café da manhã") e NENHUMA construção lusitana
- Tom conversacional, segunda pessoa
- Duração alvo: ${duracaoAlvo} segundos (~${palavrasAlvo} palavras)
- SOMENTE fatos reais e verificáveis; se a ideia tiver elemento de lenda, deixe isso explícito no texto ("diz a lenda...")
- NÃO use emojis, hashtags ou indicações de edição
- O texto será narrado por TTS (voz do PULSO): frases curtas, sem parênteses
- Cada parágrafo = uma pausa natural na narração
- Termine com CTA mencionando "PULSO"

${aprendizadoCtx}

AUTO-CHECAGEM ANTES DE RESPONDER (obrigatória):
Releia SUA primeira frase contra a TRAVA DOS 3 SEGUNDOS. Se ela violar qualquer ponto (abertura proibida, sem número/nome/contradição, >14 palavras, repete o título, ou adia o impacto), REESCREVA a primeira frase antes de entregar. Não entregue um roteiro com hook fraco.

Retorne APENAS o roteiro em texto, sem títulos ou formatação markdown.`
}

// ====== PROMPT DE LEGENDAS DE PUBLICAÇÃO (multi-rede) ======

/**
 * Gera as legendas de publicação para todas as redes a partir do roteiro pronto.
 * O /publicar lê legenda_ig_fb de pipeline_producao.metadata.caption.
 */
export function buildPromptLegendas(
  canal: CanalContext,
  ideia: IdeiaContext,
  roteiroTexto: string
): string {
  return `Você é o social media do PULSO, operação de vídeos curtos faceless (curiosidades e histórias reais). Escreva as LEGENDAS de publicação deste vídeo para cada rede, no tom PULSO: curioso, direto, instigante, em PORTUGUÊS BRASILEIRO (nunca europeu). Sem inventar fatos.

CANAL: ${canal.nome}
TÍTULO: ${ideia.titulo}
SOBRE: ${ideia.descricao}

ROTEIRO NARRADO:
${roteiroTexto}

Gere os campos abaixo, cada um adaptado à sua rede:
- legenda_ig_fb: 2 a 4 linhas que abrem uma lacuna de curiosidade (sem entregar o final), terminando com o CTA "Segue o Pulso" e 6 a 8 hashtags relevantes (mix popular + nicho) no fim.
- titulo_yt: até 80 caracteres, com gancho de curiosidade, terminando com #shorts.
- descricao_yt: 2 linhas curtas sobre o vídeo + algumas hashtags no fim.
- legenda_tiktok: 1 linha curta e instigante + 4 a 5 hashtags incluindo #fyp.

REGRAS:
- PT-BR coloquial, segunda pessoa.
- A legenda NUNCA entrega o final do vídeo — provoca o clique/assistir.
- Hashtags em minúsculas, sem espaço, relevantes ao tema.
- Nada de aspas envolvendo o texto, nada de markdown.

Retorne SOMENTE um JSON exatamente neste formato:
{"legenda_ig_fb": "...", "titulo_yt": "...", "descricao_yt": "...", "legenda_tiktok": "..."}`
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

// ====== REFAZER HOOK (reescreve só a 1ª frase) ======

export function buildPromptRefazerHook(titulo: string, roteiro: string): string {
  return `Você é o roteirista-chefe do PULSO. O roteiro abaixo (vídeo curto faceless, pt-BR) tem um HOOK FRACO na primeira frase.

TEMA: ${titulo}
ROTEIRO:
${roteiro}

${TRAVA_3S}

Sua tarefa: reescrever APENAS a primeira frase, seguindo a trava acima, mantendo o tema e o resto do roteiro intactos. Use fato concreto + número/nome/data ou contradição.

EMENDA (importante): a nova frase precisa fluir naturalmente com a SEGUNDA frase do roteiro acima. NÃO repita informação que a 2ª frase já diz (não duplique o mesmo lugar/número/data). Se a 2ª frase for uma referência de volta ("Foi o que aconteceu...", "Isso..."), a nova 1ª frase deve dar o gancho sem redundância.

Retorne SOMENTE a nova primeira frase (uma frase, no máximo ~14 palavras), em português do Brasil, sem aspas e sem nenhuma explicação.`
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
