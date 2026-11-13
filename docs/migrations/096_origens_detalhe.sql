-- 096 · De onde vêm as views (dono, 12/11/2026: "devemos ter ideia de onde virá views").
-- origens (já existente) guarda o tipo de tráfego do YouTube Analytics; origens_detalhe guarda o detalhe
-- de cada tipo: o site externo (EXT_URL) e o vídeo que levou ao episódio (RELATED_VIDEO, YT_CHANNEL...).
-- Formato: {"EXT_URL": {"facebook.com": 3}, "RELATED_VIDEO": {"<video_id>": 5}}
-- Reversão: alter table pulso_analytics.leituras_longos drop column origens_detalhe;
alter table pulso_analytics.leituras_longos add column if not exists origens_detalhe jsonb;
comment on column pulso_analytics.leituras_longos.origens_detalhe is 'detalhe por tipo de tráfego do YouTube Analytics (site externo, vídeo de origem)';
