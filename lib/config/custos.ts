// Custos REAIS de produção por vídeo — calibrados 12/06/2026 na tela de Usage do Higgsfield.
// Oficial: $1 = 20 créditos (US$ 0,05/cr) · câmbio ~5,40 → R$ 0,27/crédito.
// Auto-refill (US$50 = 1.000 cr quando saldo < 100) foi DESATIVADO em 12/06 — trava-mestra.
// Travas: pulso_core.configuracoes (orcamento_travas) + guard D:/tmp/pulso_guard.py + /financeiro.
export const CREDITO_HIGGSFIELD_BRL = 0.27

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

export const ASSINATURAS_MENSAIS_BRL = {
  higgsfield: 265.0, // plano Plus ~US$49/mês (inclui 1.000 cr/mês + modelos unlimited VIA SITE)
  elevenlabs: 119.0, // Creator US$22/mês · 131k créditos/mês · renova dia 5
  openai: 0, // pay-as-you-go (~R$ 3/mês; budget nativo US$120/mês na org pulso control)
} as const
