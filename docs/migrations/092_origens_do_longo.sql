-- ============================================================
-- 092 — De onde vêm as views do longo (YouTube Analytics, insightTrafficSourceType)
-- Pedido: dono, 06/11/2026 (o longo sai no PULSO Histórias, que já tem o acesso ao Analytics). É o funil do
-- Analytics dos Longos: quanto chega dos Shorts, da busca, de sites externos (Instagram, TikTok), da página do canal.
-- Regras: [x] coluna em tabela do domínio (pulso_analytics)  [x] sem PII  [x] reversão
-- Reversão: alter table pulso_analytics.leituras_longos drop column origens;
-- ============================================================
begin;
alter table pulso_analytics.leituras_longos add column if not exists origens jsonb;  -- {"SHORTS":120,"YT_SEARCH":40,...} views por origem
commit;
