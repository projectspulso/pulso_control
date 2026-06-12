// Custos REAIS de produção por vídeo — calibrados 12/06/2026 com dados do painel Higgsfield.
// Fonte: lote 3 = 38 gerações Seedance 2.0 (45 créditos/cena) para 5 vídeos finais
// (~7,6 gerações/vídeo com retries) · top-up de 12/06: R$ 1.000 = 1.000 créditos (R$ 1,00/cr).
// Travas de orçamento: pulso_core.configuracoes (orcamento_travas) + guard D:/tmp/pulso_guard.py.
export const CREDITO_HIGGSFIELD_BRL = 1.0

export const CUSTO_POR_CENA = {
  seedance_2_0_10s: 45, // créditos — padrão atual
  seedance_2_0_5s: 22.5,
  kling2_6_10s: 20, // teste de qualidade pendente (13/06)
  grok_video_10s: 15, // teste de qualidade pendente (13/06)
} as const

export const CUSTO_POR_VIDEO = {
  // realidade do lote 3 (receita antiga: 7 cenas + retries, tudo Seedance 2.0)
  higgsfieldCreditos: 342,
  higgsfieldBRL: 342.0,
  elevenlabsBRL: 1.2, // ~1.3k chars/vídeo
  openaiBRL: 0.4, // ideias + roteiro (GPT-4o)
  totalBRL: 343.6,
  // meta da receita enxuta (5 cenas novas máx + ≥1 do banco de clips, modelo barato):
  metaCreditos: 100,
  metaBRL: 102.0,
} as const

export const ASSINATURAS_MENSAIS_BRL = {
  higgsfield: 0, // plano Plus — preencher valor da assinatura; top-ups entram no ledger
  elevenlabs: 0,
  openai: 0, // pay-as-you-go
} as const
