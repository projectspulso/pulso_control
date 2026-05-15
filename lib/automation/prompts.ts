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

  return `Você é um produtor de conteúdo especializado em vídeos curtos virais.

Canal: ${canal.nome}
Descrição: ${canal.descricao}
Formato: Shorts/Reels/TikTok (15-60 segundos)
Idioma: ${canal.idioma}${serieCtx}

Gere ${quantidade} ideias de vídeos curtos para este canal.
Para cada ideia, retorne um JSON com:
- titulo: string (max 80 chars, gancho forte)
- descricao: string (1-2 frases com hook + contexto)
- tags: string[] (3-5 tags relevantes)
- duracao_estimada: number (segundos, entre 15 e 60)
- tipo_formato: string (curiosidade_rapida|psicologia|storytelling|misterio|motivacional)
- prioridade: number (1-10, baseado em potencial viral)
- gancho_sugerido: string (frase de abertura do vídeo)

REGRAS:
- Cada título deve gerar curiosidade imediata
- A descrição deve ser um mini-pitch que "vende" a ideia
- Priorize temas que geram comentários e compartilhamentos
- Evite temas sensíveis ou polêmicos demais
- Pense em retenção: os primeiros 3 segundos decidem tudo
- NÃO repita ideias genéricas — seja específico e surpreendente

Retorne APENAS o JSON array, sem explicações ou markdown.`
}

// ====== PROMPTS DE GERAÇÃO DE ROTEIRO ======

export function buildPromptGerarRoteiro(
  canal: CanalContext,
  ideia: IdeiaContext,
  plataformas: string[] = ['youtube_shorts', 'tiktok', 'instagram_reels']
): string {
  const duracaoAlvo = ideia.duracao_estimada || 35
  const palavrasAlvo = Math.round(duracaoAlvo * 2.5) // ~2.5 palavras/segundo pt-BR

  return `Você é um roteirista profissional de vídeos curtos virais.

CANAL: ${canal.nome}
FORMATO: Vídeo curto para ${plataformas.join(', ')} (${duracaoAlvo} segundos)
IDEIA: ${ideia.titulo}
CONTEXTO: ${ideia.descricao}
${ideia.gancho_sugerido ? `GANCHO SUGERIDO: ${ideia.gancho_sugerido}` : ''}
${ideia.tipo_formato ? `TIPO: ${ideia.tipo_formato}` : ''}

Escreva um roteiro completo em texto corrido (NÃO use marcações de tempo).

ESTRUTURA OBRIGATÓRIA:

1. HOOK (primeiros 3 segundos):
   - Frase de impacto que PRENDE atenção
   - Deve gerar curiosidade ou choque leve

2. DESENVOLVIMENTO (corpo, 70% do tempo):
   - Informação entregue de forma envolvente
   - Use storytelling, dados surpreendentes, comparações
   - Mantenha ritmo rápido, sem enrolação

3. TWIST/CLÍMAX (momento de pico):
   - Revelação surpreendente ou insight poderoso

4. CTA (últimos 3-5 segundos):
   - Chamada para ação natural: "Segue o PULSO", "Comenta", "Salva esse vídeo"

REGRAS:
- Escreva em ${canal.idioma}, tom conversacional e direto
- Duração alvo: ${duracaoAlvo} segundos (~${palavrasAlvo} palavras)
- NÃO use emojis, hashtags ou indicações de edição
- O texto será lido por uma voz narrada (TTS)
- Cada parágrafo = uma pausa natural na narração
- Termine com CTA mencionando o canal "${canal.nome}"

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
