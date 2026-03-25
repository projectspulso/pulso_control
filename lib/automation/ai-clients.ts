/**
 * Clientes AI centralizados para automação
 * OpenAI (GPT + TTS) e Claude (alternativa)
 */

// ====== OPENAI CLIENT ======

interface OpenAIChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface OpenAIChatResponse {
  choices: { message: { content: string } }[]
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number }
}

export async function callOpenAI(
  prompt: string,
  options?: {
    model?: string
    temperature?: number
    max_tokens?: number
    json_mode?: boolean
  }
): Promise<{ content: string; usage: OpenAIChatResponse['usage'] }> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY não configurada')

  const messages: OpenAIChatMessage[] = [{ role: 'user', content: prompt }]

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: options?.model || 'gpt-4o',
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.max_tokens || 4096,
      ...(options?.json_mode ? { response_format: { type: 'json_object' } } : {}),
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenAI API error ${response.status}: ${error}`)
  }

  const data: OpenAIChatResponse = await response.json()
  return {
    content: data.choices[0]?.message?.content || '',
    usage: data.usage,
  }
}

// ====== OPENAI TTS ======

export async function callOpenAITTS(
  text: string,
  options?: {
    model?: string
    voice?: string
    speed?: number
    response_format?: string
  }
): Promise<ArrayBuffer> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY não configurada')

  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: options?.model || 'tts-1-hd',
      input: text,
      voice: options?.voice || 'alloy',
      speed: options?.speed || 1.0,
      response_format: options?.response_format || 'mp3',
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenAI TTS error ${response.status}: ${error}`)
  }

  return response.arrayBuffer()
}

// ====== CLAUDE CLIENT ======

export async function callClaude(
  prompt: string,
  options?: {
    model?: string
    max_tokens?: number
    temperature?: number
  }
): Promise<{ content: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY não configurada')

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: options?.model || 'claude-sonnet-4-6',
      max_tokens: options?.max_tokens || 4096,
      temperature: options?.temperature ?? 0.7,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Claude API error ${response.status}: ${error}`)
  }

  const data = await response.json()
  const textBlock = data.content?.find((b: { type: string }) => b.type === 'text')
  return { content: textBlock?.text || '' }
}

// ====== HELPERS ======

/**
 * Limpa texto para TTS (remove markdown, normaliza pronúncia)
 */
export function limparParaTTS(texto: string): string {
  return texto
    .replace(/#{1,6}\s/g, '')                    // Remove markdown headers
    .replace(/\*\*(.*?)\*\*/g, '$1')             // Remove bold
    .replace(/\*(.*?)\*/g, '$1')                 // Remove italic
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')     // Links → texto
    .replace(/\n{3,}/g, '\n\n')                  // Normaliza quebras
    .replace(/(\d+)%/g, '$1 por cento')          // Porcentagens
    .replace(/R\$\s?(\d+)/g, '$1 reais')         // Moeda BRL
    .replace(/US\$\s?(\d+)/g, '$1 dólares')      // Moeda USD
    .replace(/https?:\/\/\S+/g, '')              // Remove URLs
    .replace(/\.\.\./g, '...')                   // Reticências
    .replace(/—/g, ', ')                         // Em-dash → vírgula
    .replace(/–/g, ', ')                         // En-dash → vírgula
    .trim()
}

/**
 * Divide texto em chunks para TTS (max 4000 chars por chunk)
 */
export function splitTextForTTS(text: string, maxChars = 4000): string[] {
  if (text.length <= maxChars) return [text]

  const paragraphs = text.split('\n\n')
  const chunks: string[] = []
  let current = ''

  for (const para of paragraphs) {
    if ((current + '\n\n' + para).length > maxChars) {
      if (current) chunks.push(current.trim())
      current = para
    } else {
      current = current ? current + '\n\n' + para : para
    }
  }
  if (current) chunks.push(current.trim())

  return chunks
}

/**
 * Valida qualidade de um roteiro gerado
 */
export function validarRoteiro(
  roteiro: string,
  duracaoAlvo: number
): {
  score: number
  tem_hook: boolean
  tem_cta: boolean
  duracao_adequada: boolean
  tamanho_ok: boolean
  palavras: number
  duracao_estimada: number
} {
  const palavras = roteiro.split(/\s+/).length
  const paragrafos = roteiro.split('\n\n').filter(Boolean).length
  const duracaoEstimada = Math.round(palavras / 2.5)

  const tem_hook = paragrafos >= 2
  const tem_cta = /segue|comenta|salva|marca|pulso|canal/i.test(roteiro)
  const duracao_adequada = Math.abs(duracaoEstimada - duracaoAlvo) < 20
  const tamanho_ok = palavras >= 40 && palavras <= 600

  let score = 0
  if (tem_hook) score += 25
  if (tem_cta) score += 25
  if (duracao_adequada) score += 25
  if (tamanho_ok) score += 15
  if (paragrafos >= 3 && paragrafos <= 8) score += 10

  return {
    score,
    tem_hook,
    tem_cta,
    duracao_adequada,
    tamanho_ok,
    palavras,
    duracao_estimada: duracaoEstimada,
  }
}
