// Custos REAIS de produção por vídeo — calibrados 12/06/2026 na tela de Usage do Higgsfield.
// Oficial: $1 = 20 créditos (US$ 0,05/cr) · câmbio ~5,40 → R$ 0,27/crédito.
// Auto-refill (US$50 = 1.000 cr quando saldo < 100) foi DESATIVADO em 12/06 — trava-mestra.
// Travas: pulso_core.configuracoes (orcamento_travas) + guard D:/tmp/pulso_guard.py + /financeiro.
export const CREDITO_HIGGSFIELD_BRL = 0.27

export const CUSTO_POR_CENA = {
  seedance_2_0_10s: 45, // créditos (R$ 12,15) — padrão atual
  seedance_2_0_5s: 22.5,
  kling2_6_10s: 20, // R$ 5,40 — teste de qualidade pendente (13/06)
  grok_video_10s: 15, // R$ 4,05 — teste de qualidade pendente (13/06)
} as const

export const CUSTO_POR_VIDEO = {
  // realidade do lote 3 (receita antiga: 7 cenas + retries, tudo Seedance 2.0 via CLI)
  higgsfieldCreditos: 342,
  higgsfieldBRL: 92.3, // 342 cr × R$ 0,27
  elevenlabsBRL: 1.2, // ~1.3k chars/vídeo
  openaiBRL: 0.4, // ideias + roteiro (GPT-4o)
  totalBRL: 93.9,
  // meta da receita enxuta (≤5 cenas novas + ≥1 clip do banco + modelo barato/unlimited via site):
  metaCreditos: 100,
  metaBRL: 28.6,
} as const

export const ASSINATURAS_MENSAIS_BRL = {
  higgsfield: 265.0, // plano Plus ~US$49/mês (inclui 1.000 cr/mês + modelos unlimited VIA SITE)
  elevenlabs: 0, // preencher com o plano real
  openai: 0, // pay-as-you-go
} as const
