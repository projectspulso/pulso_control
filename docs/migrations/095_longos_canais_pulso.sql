-- 095 · leituras dos cortes nos canais DO PULSO (dono, 12/11/2026)
-- Os cortes também saem nos canais Cortes PULSO Histórias e Bastidores PULSO Histórias (YouTube,
-- Instagram, Facebook). O canal da leitura passa a aceitar o id do destino desses canais.
-- 'cortes' continua sendo o canal de cortes da DIGIAI (@bastidoresdigiaicortes).
alter table pulso_analytics.leituras_longos drop constraint leituras_longos_canal_check;
alter table pulso_analytics.leituras_longos add constraint leituras_longos_canal_check
  check (canal = any (array['principal', 'cortes', 'digiai', 'pulso_cortes', 'pulso_bastidores']));
alter table pulso_analytics.seguidores_longos drop constraint seguidores_longos_canal_check;
alter table pulso_analytics.seguidores_longos add constraint seguidores_longos_canal_check
  check (canal = any (array['principal', 'cortes', 'digiai', 'pulso_cortes', 'pulso_bastidores']));
-- a leitura de 11/11 do corte 3 no Bastidores PULSO foi gravada como 'cortes' (canal da DIGIAI): corrige
update pulso_analytics.leituras_longos l set canal = p.destino
  from pulso_content.corte_publicacoes p
  where l.peca_id = p.id and p.destino in ('pulso_cortes', 'pulso_bastidores') and l.canal <> p.destino;
