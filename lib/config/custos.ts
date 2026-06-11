// Custos estimados de produção por vídeo (editar aqui quando os planos mudarem).
// Fonte: lote de lançamento 10/06/2026 — ~200 créditos Higgsfield/vídeo (5-6 cenas Seedance),
// ~1.100 caracteres ElevenLabs/vídeo, ideias+roteiro via GPT-4o.
export const CUSTO_POR_VIDEO = {
  higgsfieldCreditos: 200,
  higgsfieldBRL: 12.0, // estimativa: créditos do plano Plus rateados
  elevenlabsBRL: 1.2, // ~1.1k chars no plano atual
  openaiBRL: 0.35, // ideias + roteiro (GPT-4o)
  totalBRL: 13.55,
} as const

export const ASSINATURAS_MENSAIS_BRL = {
  higgsfield: 0, // preencher com o valor real do plano Plus
  elevenlabs: 0,
  openai: 0, // pay-as-you-go
} as const
