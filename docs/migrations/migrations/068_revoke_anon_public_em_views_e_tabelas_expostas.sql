-- 068 — anon/PUBLIC fora de TODAS as views de public e de TODAS as tabelas/views dos schemas
-- pulso_* expostos pelo PostgREST, exceto as 2 views do hub (2026-09-08 14:48–14:49 BRT)
-- Contexto: as migrations 062/064–067 trancaram as tabelas de pulso_content por RLS restritiva
-- (agente do Pulso). Medição do orquestrador geral por chamada real com a anon key:
--   /rest/v1/ideias?select=metadata → 200 (view public.ideias, sem security_invoker, grant anon)
--   /rest/v1/roteiros?select=conteudo_md → 200 (220 roteiros inteiros)
--   Accept-Profile: pulso_core → usuarios_internos 200, plataforma_credenciais 200,
--   configuracoes 200; pulso_automation.workflows 200; pulso_analytics.metricas_diarias 200.
-- O PostgREST deste projeto expõe public, pulso_core, pulso_content, pulso_assets,
-- pulso_distribution, pulso_automation, pulso_analytics: grant a anon em qualquer um deles
-- é porta, com ou sem RLS na tabela de baixo (view definer ignora RLS).
-- Consumidor anon legítimo = só o pulso_hub, que lê pulso_content.vw_hub_videos e vw_hub_links
-- (provado por edge_logs pelo agente do Pulso). O app usa sessão; o motor usa service key.
-- Idempotente. Rollback: grant select de volta na relação que algum consumidor provar precisar.
do $$ declare r record; begin
  for r in select c.relname t from pg_class c join pg_namespace n on n.oid=c.relnamespace
           where n.nspname='public' and c.relkind='v' loop
    execute format('revoke all on public.%I from public', r.t);
    execute format('revoke all on public.%I from anon', r.t);
  end loop;
  for r in select n.nspname s, c.relname t from pg_class c join pg_namespace n on n.oid=c.relnamespace
           where n.nspname like 'pulso%' and c.relkind in ('r','v','m')
             and not (n.nspname='pulso_content' and c.relname in ('vw_hub_links','vw_hub_videos')) loop
    execute format('revoke all on %I.%I from anon', r.s, r.t);
    execute format('revoke all on %I.%I from public', r.s, r.t);
  end loop;
end $$;
-- Prova (08/09 14:49): 401 em ideias/roteiros/pipeline_producao/logs_workflows (public) e em
-- pulso_core.usuarios_internos/plataforma_credenciais/configuracoes, pulso_automation.workflows,
-- pulso_analytics.metricas_diarias; 200 em vw_hub_videos/vw_hub_links; hub 200, /v/1 200, app 200.
