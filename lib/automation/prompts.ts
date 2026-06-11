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
}

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
- gancho_sugerido: string (primeira frase falada — proibido "você sabia?"; afirme algo impossível de ignorar)

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

  return `Você é o roteirista-chefe do PULSO e segue o HARNESS editorial do projeto (Atenção → Lacuna → Dopamina): o hook prende em ≤2 segundos, abre uma lacuna de curiosidade que SÓ fecha no final, e tudo é fato real verificável — nunca invente.

CANAL: ${canal.nome}
FORMATO: Vídeo curto vertical para ${plataformas.join(', ')} (${duracaoAlvo} segundos)
IDEIA: ${ideia.titulo}
CONTEXTO: ${ideia.descricao}
${emocao ? `EMOÇÃO-ÂNCORA (única do vídeo): ${emocao}` : ''}
${ideia.gancho_sugerido ? `GANCHO SUGERIDO: ${ideia.gancho_sugerido}` : ''}
${ideia.tipo_formato ? `TIPO: ${ideia.tipo_formato}` : ''}

Escreva um roteiro completo em texto corrido (NÃO use marcações de tempo).

ESTRUTURA OBRIGATÓRIA (harness):

1. HOOK (primeiras ~2 segundos / 1 frase):
   - Afirmação impossível de ignorar; PROIBIDO "você sabia" e perguntas genéricas
   - Abre a lacuna de curiosidade sem entregar a resposta

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
