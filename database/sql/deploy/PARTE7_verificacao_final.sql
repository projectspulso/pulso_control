-- =====================================================================
-- PARTE 7: VERIFICAÇÃO FINAL
-- Banco: nlcisbfdiokmipyihtuz
-- Execute após todas as partes anteriores
-- =====================================================================

-- 1. Schemas existentes
SELECT '1. SCHEMAS' AS secao;
SELECT schema_name FROM information_schema.schemata
WHERE schema_name LIKE 'pulso_%'
ORDER BY schema_name;

-- 2. Tabelas por schema
SELECT '2. TABELAS POR SCHEMA' AS secao;
SELECT schemaname, tablename
FROM pg_tables
WHERE schemaname LIKE 'pulso_%'
ORDER BY schemaname, tablename;

-- 3. Views públicas
SELECT '3. VIEWS PÚBLICAS' AS secao;
SELECT table_name FROM information_schema.views
WHERE table_schema = 'public'
  AND (table_name LIKE 'vw_pulso%' OR table_name LIKE 'vw_automation%')
ORDER BY table_name;

-- 4. Enums
SELECT '4. ENUMS' AS secao;
SELECT typname FROM pg_type
WHERE typname LIKE 'pulso_%'
ORDER BY typname;

-- 5. Triggers
SELECT '5. TRIGGERS' AS secao;
SELECT trigger_name, event_object_schema || '.' || event_object_table AS tabela, event_manipulation
FROM information_schema.triggers
WHERE trigger_name LIKE 'trg_%'
ORDER BY trigger_name;

-- 6. pg_cron jobs
SELECT '6. PG_CRON JOBS' AS secao;
SELECT jobid, jobname, schedule, active
FROM cron.job
ORDER BY jobname;

-- 7. Extensões
SELECT '7. EXTENSÕES' AS secao;
SELECT extname, extversion
FROM pg_extension
WHERE extname IN ('pg_cron', 'pg_net')
ORDER BY extname;

-- 8. PostgREST schemas expostos
SELECT '8. POSTGREST CONFIG' AS secao;
SELECT current_setting('pgrst.db_schemas', true) AS schemas_expostos;

-- 9. Contagens de dados
SELECT '9. CONTAGENS' AS secao;
SELECT 'canais' AS tabela, COUNT(*) AS registros FROM pulso_core.canais
UNION ALL SELECT 'plataformas', COUNT(*) FROM pulso_core.plataformas
UNION ALL SELECT 'series', COUNT(*) FROM pulso_core.series
UNION ALL SELECT 'tags', COUNT(*) FROM pulso_core.tags
UNION ALL SELECT 'ideias', COUNT(*) FROM pulso_content.ideias
UNION ALL SELECT 'roteiros', COUNT(*) FROM pulso_content.roteiros
UNION ALL SELECT 'workflows', COUNT(*) FROM pulso_automation.workflows
UNION ALL SELECT 'automation_queue', COUNT(*) FROM pulso_automation.automation_queue
UNION ALL SELECT 'ai_config', COUNT(*) FROM pulso_automation.ai_config
ORDER BY tabela;
