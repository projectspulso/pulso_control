-- =====================================================================
-- PARTE 5: POSTGREST CONFIG — Expor todos os schemas pulso_*
-- Banco: nlcisbfdiokmipyihtuz
-- IMPORTANTE: Executar este script para que o Supabase Client
--             consiga acessar tabelas em schemas customizados
-- =====================================================================

-- Expor todos os schemas via PostgREST
ALTER ROLE authenticator SET pgrst.db_schemas = 'public, graphql_public, pulso_core, pulso_content, pulso_assets, pulso_distribution, pulso_automation, pulso_analytics';

-- Forçar reload do PostgREST (necessário após ALTER ROLE)
NOTIFY pgrst, 'reload config';
NOTIFY pgrst, 'reload schema';

-- =====================================================================
-- FIM PARTE 5
-- Após executar, aguarde ~10 segundos e teste:
--   supabase.schema('pulso_automation').from('automation_queue').select('*')
-- =====================================================================
