// Custos REAIS de produção por vídeo — calibrados 12/06/2026 na tela de Usage do Higgsfield.
// Câmbio USD→BRL conferido 25/06/2026 (Investing.com ~5,20). Pack atual: $1 = ~20 cr (US$ 0,049/cr).
// Auto-refill (US$50 = 1.000 cr quando saldo < 100) foi DESATIVADO em 12/06 — trava-mestra.
// Travas: pulso_core.configuracoes (orcamento_travas) + guard D:/tmp/pulso_guard.py + /financeiro.
export const CAMBIO_USD_BRL = 5.2
export const CREDITO_HIGGSFIELD_BRL = 0.25 // US$ 0,049/cr × 5,20

// Custo por cena de B-roll (decidido 14/06 após teste de qualidade lado a lado).
export const CUSTO_POR_CENA = {
  veo_3_1_lite_8s: 12, // R$ 3,24 — B-ROLL PADRÃO (8s, áudio nativo, mais cinematográfico)
  kling_3_0_5s: 30, // R$ 8,10 — hero shot 4K (só quando quiser resolução máxima)
  seedance_2_0_10s: 45, // R$ 12,15 — LEGADO (lotes 1-3), não usar mais
} as const

export const CUSTO_POR_VIDEO = {
  // MOLDE ATUAL (bolha, 14/06): mascote lip-sync R$ 0 (sem Higgsfield) + B-roll Veo (3 cenas) + narração.
  brollCenas: 3,
  higgsfieldCreditos: 36, // 3 × Veo 12 cr
  higgsfieldBRL: 9.72, // 36 cr × R$ 0,27
  elevenlabsBRL: 1.28, // ~1.3k chars/vídeo (Creator: US$22/121k créditos)
  openaiBRL: 0.18, // ideias + roteiro (org pulso control)
  totalBRL: 11.18,
  // referência histórica: lote 3 era Seedance via CLI (7 cenas + retries) = R$ 93,80/vídeo
  historicoBRL: 93.8,
  // meta enxuta (2 cenas Veo + 1 clip do banco): ainda mais barato
  metaCreditos: 24,
  metaBRL: 6.66,
} as const

// AUDITADO nos sites em 25/06/2026 (login do dono). Câmbio 5,20.
export const ASSINATURAS = [
  { servico: 'Higgsfield', plano: 'Plus · 1.000 cr/mês', usd: 49, brl: 254.8, renova: 'mensal', uso: 'vídeo (Veo)' },
  { servico: 'ElevenLabs', plano: 'Creator · 121k cr/mês', usd: 22, brl: 114.4, renova: 'dia 5', uso: 'voz / TTS' },
  { servico: 'OpenAI', plano: 'Pay-as-you-go', usd: 0.8, brl: 4.16, renova: 'por uso', uso: 'GPT (roteiro/legenda)' },
  { servico: 'Supabase', plano: 'Free · 1 projeto', usd: 0, brl: 0, renova: '—', uso: 'backend / DB' },
  { servico: 'Vercel', plano: 'Hobby (free)', usd: 0, brl: 0, renova: '—', uso: 'hospedagem' },
] as const

export const ASSINATURAS_TOTAL_BRL = ASSINATURAS.reduce((a, s) => a + s.brl, 0) // ~R$ 373/mês

// compat (analytics soma este mapa) — valores reais auditados 25/06
export const ASSINATURAS_MENSAIS_BRL = {
  higgsfield: 254.8, // Plus US$49/mês (1.000 cr + modelos unlimited via site)
  elevenlabs: 114.4, // Creator US$22/mês · renova dia 5
  openai: 4.16, // pay-as-you-go (~US$0,80 em junho; teto US$120/mês)
} as const
