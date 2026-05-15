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

| schema_name        |
| ------------------ |
| pulso_analytics    |
| pulso_assets       |
| pulso_automation   |
| pulso_content      |
| pulso_core         |
| pulso_distribution |


-- 2. Tabelas por schema
SELECT '2. TABELAS POR SCHEMA' AS secao;
SELECT schemaname, tablename
FROM pg_tables
WHERE schemaname LIKE 'pulso_%'
ORDER BY schemaname, tablename;

| schemaname         | tablename                         |
| ------------------ | --------------------------------- |
| pulso_analytics    | eventos                           |
| pulso_analytics    | metricas_diarias                  |
| pulso_assets       | assets                            |
| pulso_assets       | conteudo_variantes_assets         |
| pulso_automation   | ai_config                         |
| pulso_automation   | automation_queue                  |
| pulso_automation   | workflow_execucoes                |
| pulso_automation   | workflows                         |
| pulso_content      | audios                            |
| pulso_content      | canais_personagens                |
| pulso_content      | conteudo_variantes                |
| pulso_content      | conteudos                         |
| pulso_content      | feedbacks                         |
| pulso_content      | ideias                            |
| pulso_content      | logs_workflows                    |
| pulso_content      | metricas_publicacao               |
| pulso_content      | personagens                       |
| pulso_content      | pipeline_producao                 |
| pulso_content      | pipeline_producao_backup_20251126 |
| pulso_content      | plano_publicacao                  |
| pulso_content      | roteiros                          |
| pulso_content      | roteiros_renders                  |
| pulso_content      | thumbnails                        |
| pulso_content      | videos                            |
| pulso_content      | workflow_queue                    |
| pulso_core         | canais                            |
| pulso_core         | canais_plataformas                |
| pulso_core         | configuracoes                     |
| pulso_core         | plataforma_credenciais            |
| pulso_core         | plataformas                       |
| pulso_core         | series                            |
| pulso_core         | series_tags                       |
| pulso_core         | tags                              |
| pulso_core         | usuarios_internos                 |
| pulso_distribution | posts                             |
| pulso_distribution | posts_logs                        |

-- 3. Views públicas
SELECT '3. VIEWS PÚBLICAS' AS secao;
SELECT table_name FROM information_schema.views
WHERE table_schema = 'public'
  AND (table_name LIKE 'vw_pulso%' OR table_name LIKE 'vw_automation%')
ORDER BY table_name;

| table_name                         |
| ---------------------------------- |
| vw_automation_queue                |
| vw_automation_stats                |
| vw_pulso_calendario_publicacao_v2  |
| vw_pulso_canais                    |
| vw_pulso_conteudo_variantes        |
| vw_pulso_conteudo_variantes_assets |
| vw_pulso_conteudos                 |
| vw_pulso_ideias                    |
| vw_pulso_pipeline_base             |
| vw_pulso_pipeline_com_assets       |
| vw_pulso_pipeline_com_assets_v2    |
| vw_pulso_posts                     |
| vw_pulso_posts_metricas_diarias    |
| vw_pulso_posts_resumo              |
| vw_pulso_roteiros                  |
| vw_pulso_series                    |
| vw_pulso_workflow_execucoes        |
| vw_pulso_workflows                 |


-- 4. Enums
SELECT '4. ENUMS' AS secao;
SELECT typname FROM pg_type
WHERE typname LIKE 'pulso_%'
ORDER BY typname;

| typname                     |
| --------------------------- |
| pulso_plataforma_tipo       |
| pulso_status_conteudo       |
| pulso_status_geral          |
| pulso_status_ideia          |
| pulso_status_post           |
| pulso_status_roteiro        |
| pulso_tipo_asset            |
| pulso_tipo_evento_analytics |

-- 5. Triggers
SELECT '5. TRIGGERS' AS secao;
SELECT trigger_name, event_object_schema || '.' || event_object_table AS tabela, event_manipulation
FROM information_schema.triggers
WHERE trigger_name LIKE 'trg_%'
ORDER BY trigger_name;

| trigger_name                        | tabela                            | event_manipulation |
| ----------------------------------- | --------------------------------- | ------------------ |
| trg_aq_updated_at                   | pulso_automation.automation_queue | UPDATE             |
| trg_ideia_aprovada                  | pulso_content.ideias              | UPDATE             |
| trg_roteiro_aprovado                | pulso_content.roteiros            | UPDATE             |
| trg_roteiros_renders_set_updated_at | pulso_content.roteiros_renders    | UPDATE             |
| trg_sync_pipeline_from_audio        | pulso_content.audios              | INSERT             |
| trg_sync_pipeline_from_audio        | pulso_content.audios              | UPDATE             |
| trg_sync_pipeline_from_roteiro      | pulso_content.roteiros            | INSERT             |
| trg_sync_pipeline_from_roteiro      | pulso_content.roteiros            | UPDATE             |
| trg_sync_pipeline_from_video        | pulso_content.videos              | UPDATE             |
| trg_sync_pipeline_from_video        | pulso_content.videos              | INSERT             |

-- 6. pg_cron jobs
SELECT '6. PG_CRON JOBS' AS secao;
SELECT jobid, jobname, schedule, active
FROM cron.job
ORDER BY jobname;

| jobid | jobname                  | schedule        | active |
| ----- | ------------------------ | --------------- | ------ |
| 3     | check-audios-pendentes   | */10 * * * *    | true   |
| 2     | check-roteiros-pendentes | */5 * * * *     | true   |
| 6     | coletar-metricas         | 0 22 * * *      | true   |
| 1     | gerar-ideias-diario      | 0 3 * * *       | true   |
| 8     | limpar-queue-antiga      | 0 4 * * 0       | true   |
| 5     | processar-retry-queue    | */30 * * * *    | true   |
| 4     | publicar-conteudos       | 0 6,12,18 * * * | true   |
| 7     | relatorio-semanal        | 0 9 * * 1       | true   |

-- 7. Extensões
SELECT '7. EXTENSÕES' AS secao;
SELECT extname, extversion
FROM pg_extension
WHERE extname IN ('pg_cron', 'pg_net')
ORDER BY extname;

| extname | extversion |
| ------- | ---------- |
| pg_cron | 1.6.4      |
| pg_net  | 0.19.5     |


-- 8. PostgREST schemas expostos
SELECT '8. POSTGREST CONFIG' AS secao;
SELECT current_setting('pgrst.db_schemas', true) AS schemas_expostos;

| schemas_expostos |
| ---------------- |
| null             |


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


| tabela           | registros |
| ---------------- | --------- |
| ai_config        | 9         |
| automation_queue | 0         |
| canais           | 10        |
| ideias           | 131       |
| plataformas      | 6         |
| roteiros         | 3         |
| series           | 20        |
| tags             | 17        |
| workflows        | 5         |

