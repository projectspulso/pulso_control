-- =====================================================
-- DIAGNÓSTICO COMPLETO - Views e Permissões
-- Execute este script no Supabase SQL Editor
-- =====================================================
-- 1. LISTAR TODAS AS VIEWS NO SCHEMA PUBLIC
SELECT 'VIEW' as tipo,
    schemaname,
    viewname as nome,
    viewowner as owner
FROM pg_views
WHERE schemaname = 'public'
ORDER BY viewname;
| tipo | schemaname | nome | owner | | ---- | ---------- | ---------------------------------- | -------- |
| VIEW | public | assets | postgres | | VIEW | public | canais | postgres | | VIEW | public | canais_plataformas | postgres | | VIEW | public | configuracoes | postgres | | VIEW | public | conteudo_variantes | postgres | | VIEW | public | conteudo_variantes_assets | postgres | | VIEW | public | conteudos | postgres | | VIEW | public | conteudos_producao | postgres | | VIEW | public | eventos | postgres | | VIEW | public | ideias | postgres | | VIEW | public | logs_workflows | postgres | | VIEW | public | metricas_diarias | postgres | | VIEW | public | n8n_roteiro_completo | postgres | | VIEW | public | pipeline_producao | postgres | | VIEW | public | plataformas | postgres | | VIEW | public | plataformas_conectadas | postgres | | VIEW | public | posts | postgres | | VIEW | public | posts_logs | postgres | | VIEW | public | publicacoes | postgres | | VIEW | public | roteiros | postgres | | VIEW | public | series | postgres | | VIEW | public | tags | postgres | | VIEW | public | usuarios_internos | postgres | | VIEW | public | vw_pulso_calendario_publicacao_v2 | postgres | | VIEW | public | vw_pulso_conteudo_variantes_assets | postgres | | VIEW | public | vw_pulso_pipeline_base | postgres | | VIEW | public | vw_pulso_pipeline_com_assets | postgres | | VIEW | public | vw_pulso_pipeline_com_assets_v2 | postgres | | VIEW | public | vw_pulso_posts_metricas_diarias | postgres | | VIEW | public | vw_pulso_workflow_execucoes | postgres | | VIEW | public | vw_pulso_workflows | postgres | | VIEW | public | vw_roteiros | postgres | | VIEW | public | vw_roteiros_pendentes_audio | postgres | | VIEW | public | vw_roteiros_pendentes_video | postgres | | VIEW | public | vw_roteiros_prontos_para_render | postgres | | VIEW | public | workflow_execucoes | postgres | | VIEW | public | workflows | postgres | -- 2. LISTAR TODAS AS TABELAS NO SCHEMA PUBLIC
SELECT 'TABLE' as tipo,
    schemaname,
    tablename as nome,
    tableowner as owner
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
nenhuma -- 3. VERIFICAR PERMISSÕES DAS VIEWS PRINCIPAIS
SELECT grantee,
    table_schema,
    table_name,
    string_agg(privilege_type, ', ') as privileges
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
    AND table_name IN (
        'ideias',
        'roteiros',
        'canais',
        'series',
        'pipeline_producao'
    )
    AND grantee IN ('anon', 'authenticated', 'postgres')
GROUP BY grantee,
    table_schema,
    table_name
ORDER BY table_name,
    grantee;
| grantee | table_schema | table_name | privileges | | ------------- | ------------ | ----------------- | ------------------------------------------------------------- |
| anon | public | canais |
INSERT,
    TRIGGER,
    REFERENCES,
    TRUNCATE,
    DELETE,
    UPDATE,
    SELECT | | authenticated | public | canais |
INSERT,
    TRIGGER,
    REFERENCES,
    TRUNCATE,
    DELETE,
    UPDATE,
    SELECT | | postgres | public | canais | REFERENCES,
    INSERT,
    SELECT,
    UPDATE,
    DELETE,
    TRUNCATE,
    TRIGGER | | anon | public | ideias | TRIGGER,
    INSERT,
    SELECT,
    UPDATE,
    DELETE,
    TRUNCATE,
    REFERENCES | | authenticated | public | ideias |
UPDATE,
    INSERT,
    SELECT,
    DELETE,
    TRUNCATE,
    REFERENCES,
    TRIGGER | | postgres | public | ideias |
SELECT,
    REFERENCES,
    TRIGGER,
    INSERT,
    TRUNCATE,
    DELETE,
    UPDATE | | anon | public | pipeline_producao | TRIGGER,
    INSERT,
    SELECT,
    UPDATE,
    DELETE,
    TRUNCATE,
    REFERENCES | | authenticated | public | pipeline_producao | TRIGGER,
    INSERT,
    SELECT,
    UPDATE,
    DELETE,
    TRUNCATE,
    REFERENCES | | postgres | public | pipeline_producao |
INSERT,
    SELECT,
    UPDATE,
    DELETE,
    TRUNCATE,
    REFERENCES,
    TRIGGER | | anon | public | roteiros |
SELECT,
    TRIGGER,
    REFERENCES,
    TRUNCATE,
    DELETE,
    UPDATE,
    INSERT | | authenticated | public | roteiros | TRIGGER,
    INSERT,
    SELECT,
    UPDATE,
    DELETE,
    TRUNCATE,
    REFERENCES | | postgres | public | roteiros |
INSERT,
    TRIGGER,
    REFERENCES,
    TRUNCATE,
    DELETE,
    UPDATE,
    SELECT | | anon | public | series |
SELECT,
    TRIGGER,
    REFERENCES,
    TRUNCATE,
    DELETE,
    UPDATE,
    INSERT | | authenticated | public | series |
INSERT,
    SELECT,
    UPDATE,
    DELETE,
    TRUNCATE,
    REFERENCES,
    TRIGGER | | postgres | public | series | REFERENCES,
    INSERT,
    SELECT,
    UPDATE,
    DELETE,
    TRUNCATE,
    TRIGGER | -- 4. TESTAR ACESSO DIRETO ÀS VIEWS
    DO $$
DECLARE rec RECORD;
cnt INTEGER;
BEGIN FOR rec IN
SELECT viewname
FROM pg_views
WHERE schemaname = 'public'
    AND viewname IN (
        'ideias',
        'canais',
        'series',
        'roteiros',
        'pipeline_producao'
    ) LOOP BEGIN EXECUTE format('SELECT COUNT(*) FROM public.%I', rec.viewname) INTO cnt;
RAISE NOTICE 'View %.% - OK (% registros)',
'public',
rec.viewname,
cnt;
EXCEPTION
WHEN OTHERS THEN RAISE NOTICE 'View %.% - ERRO: %',
'public',
rec.viewname,
SQLERRM;
END;
END LOOP;
END $$;
nada -- 5. VERIFICAR SE VIEWS APONTAM PARA SCHEMAS CORRETOS
SELECT v.schemaname,
    v.viewname,
    v.definition
FROM pg_views v
WHERE v.schemaname = 'public'
    AND v.viewname IN (
        'ideias',
        'canais',
        'series',
        'roteiros',
        'pipeline_producao',
        'vw_pulso_pipeline_com_assets',
        'vw_pulso_pipeline_com_assets_v2',
        'vw_pulso_calendario_publicacao_v2',
        'n8n_roteiro_completo'
    )
ORDER BY v.viewname;
| schemaname | viewname | definition | | ---------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| public | canais |
SELECT id,
    nome,
    slug,
    descricao,
    idioma,
    status,
    metadata,
    created_at,
    updated_at
FROM pulso_core.canais;
| | public | ideias |
SELECT id,
    canal_id,
    serie_id,
    titulo,
    descricao,
    origem,
    prioridade,
    status,
    tags,
    linguagem,
    criado_por,
    metadata,
    created_at,
    updated_at
FROM pulso_content.ideias;
| | public | n8n_roteiro_completo |
SELECT roteiro_id,
    ideia_id,
    roteiro_titulo,
    conteudo_md,
    duracao_estimado_segundos,
    roteiro_status,
    metadata_roteiro,
    roteiro_created_at,
    roteiro_updated_at,
    canal_id,
    ideia_titulo,
    ideia_descricao,
    metadata_ideia,
    canal_nome,
    canal_slug,
    canal_descricao,
    canal_idioma,
    canal_status,
    metadata_canal
FROM pulso_content.n8n_roteiro_completo;
| | public | pipeline_producao |
SELECT id,
    ideia_id,
    roteiro_id,
    audio_id,
    video_id,
    status,
    prioridade,
    data_prevista,
    data_publicacao,
    responsavel,
    observacoes,
    metadata,
    created_at,
    updated_at,
    data_lancamento,
    data_publicacao_planejada,
    is_piloto,
    conteudo_variantes_id
FROM pulso_content.pipeline_producao;
| | public | roteiros |
SELECT id,
    ideia_id,
    titulo,
    versao,
    conteudo_md,
    duracao_estimado_segundos,
    status,
    linguagem,
    criado_por,
    revisado_por,
    metadata,
    created_at,
    updated_at,
    canal_id,
    categoria_metadata
FROM pulso_content.roteiros;
| | public | series |
SELECT id,
    canal_id,
    nome,
    slug,
    descricao,
    status,
    ordem_padrao,
    metadata,
    created_at,
    updated_at
FROM pulso_core.series;
| | public | vw_pulso_calendario_publicacao_v2 |
SELECT pipeline_id,
    canal_nome AS canal,
    serie_nome AS serie,
    ideia_titulo AS ideia,
    ideia_status,
    pipeline_status,
    is_piloto,
    data_prevista,
    data_publicacao_planejada,
    hora_publicacao,
    prioridade,
    pipeline_metadata AS metadata
FROM pulso_content.vw_pulso_pipeline_base_v2 b;
| | public | vw_pulso_pipeline_com_assets |
SELECT pipeline_id,
    ideia_id,
    roteiro_id,
    audio_id,
    video_id,
    conteudo_variantes_id,
    pipeline_status,
    prioridade,
    data_prevista,
    data_publicacao,
    data_publicacao_planejada,
    hora_publicacao,
    data_lancamento,
    responsavel,
    observacoes,
    pipeline_metadata,
    pipeline_created_at,
    pipeline_updated_at,
    ideia_titulo,
    ideia_descricao,
    ideia_origem,
    ideia_status,
    ideia_prioridade,
    ideia_tags,
    ideia_linguagem,
    canal_id,
    serie_id,
    ideia_criado_por,
    ideia_metadata,
    ideia_created_at,
    ideia_updated_at,
    canal_nome,
    canal_slug,
    canal_descricao,
    canal_idioma,
    canal_status,
    canal_metadata,
    canal_created_at,
    canal_updated_at,
    serie_id_real,
    serie_nome,
    serie_slug,
    serie_descricao,
    serie_status,
    serie_ordem_padrao,
    serie_metadata,
    serie_created_at,
    serie_updated_at,
    conteudo_variantes_id_real,
    conteudo_id,
    nome_variacao,
    plataforma_tipo,
    variante_status,
    titulo_publico,
    descricao_publica,
    legenda,
    hashtags,
    variante_linguagem,
    ordem_exibicao,
    variante_metadata,
    variante_created_at,
    variante_updated_at,
    asset_id,
    asset_papel,
    asset_ordem,
    asset_tipo,
    asset_nome,
    asset_descricao,
    caminho_storage,
    provedor,
    duracao_segundos,
    largura_px,
    altura_px,
    tamanho_bytes,
    hash_arquivo,
    asset_metadata,
    asset_criado_por,
    asset_created_at,
    asset_updated_at
FROM pulso_content.vw_pulso_pipeline_com_assets;
| | public | vw_pulso_pipeline_com_assets_v2 |
SELECT pipeline_id,
    conteudo_variantes_id,
    canal_nome,
    serie_nome,
    ideia_titulo,
    ideia_status,
    pipeline_status,
    is_piloto,
    data_prevista,
    data_publicacao_planejada,
    hora_publicacao,
    prioridade,
    pipeline_metadata,
    asset_id,
    asset_tipo,
    caminho_storage,
    provedor,
    duracao_segundos,
    largura_px,
    altura_px,
    tamanho_bytes,
    asset_metadata,
    asset_papel,
    asset_ordem
FROM pulso_content.vw_pulso_pipeline_com_assets_v2;
| -- 6. VERIFICAR TRIGGERS NAS VIEWS
SELECT trigger_schema,
    trigger_name,
    event_object_table,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
    AND event_object_table IN (
        'ideias',
        'roteiros',
        'pipeline_producao',
        'conteudos_producao'
    )
ORDER BY event_object_table,
    trigger_name;
| trigger_schema | trigger_name | event_object_table | event_manipulation | action_statement | | -------------- | --------------------------------- | ------------------ | ------------------ | ------------------------------------------- |
| public | conteudos_producao_delete_trigger | conteudos_producao | DELETE | EXECUTE FUNCTION pipeline_producao_delete() | | public | conteudos_producao_insert_trigger | conteudos_producao |
INSERT | EXECUTE FUNCTION pipeline_producao_insert() | | public | conteudos_producao_update_trigger | conteudos_producao |
UPDATE | EXECUTE FUNCTION pipeline_producao_update() | | public | ideias_delete_trigger | ideias | DELETE | EXECUTE FUNCTION ideias_delete() | | public | ideias_insert_trigger | ideias |
INSERT | EXECUTE FUNCTION ideias_insert() | | public | ideias_update_trigger | ideias |
UPDATE | EXECUTE FUNCTION ideias_update() | | public | pipeline_producao_delete_trigger | pipeline_producao | DELETE | EXECUTE FUNCTION pipeline_producao_delete() | | public | pipeline_producao_insert_trigger | pipeline_producao |
INSERT | EXECUTE FUNCTION pipeline_producao_insert() | | public | pipeline_producao_update_trigger | pipeline_producao |
UPDATE | EXECUTE FUNCTION pipeline_producao_update() | | public | roteiros_delete_trigger | roteiros | DELETE | EXECUTE FUNCTION roteiros_delete() | | public | roteiros_insert_trigger | roteiros |
INSERT | EXECUTE FUNCTION roteiros_insert() | | public | roteiros_update_trigger | roteiros |
UPDATE | EXECUTE FUNCTION roteiros_update() | -- 7. VERIFICAR SE SCHEMAS PULSO_* EXISTEM E TÊM DADOS
SELECT n.nspname as schema_name,
    CASE
        WHEN n.nspname = 'pulso_core' THEN (
            SELECT COUNT(*)
            FROM pulso_core.canais
        )
        WHEN n.nspname = 'pulso_content' THEN (
            SELECT COUNT(*)
            FROM pulso_content.ideias
        )
        WHEN n.nspname = 'pulso_assets' THEN 0
        ELSE 0
    END as sample_count
FROM pg_namespace n
WHERE n.nspname LIKE 'pulso_%'
ORDER BY n.nspname;
| schema_name | sample_count | | ------------------ | ------------ |
| pulso_analytics | 0 | | pulso_assets | 0 | | pulso_automation | 0 | | pulso_content | 114 | | pulso_core | 10 | | pulso_distribution | 0 | -- 8. VERIFICAR VIEWS AUXILIARES FALTANTES
SELECT CASE
        WHEN EXISTS (
            SELECT 1
            FROM pg_views
            WHERE schemaname = 'public'
                AND viewname = 'vw_pulso_calendario_publicacao_v2'
        ) THEN '✓ EXISTE'
        ELSE '✗ FALTA'
    END as vw_pulso_calendario_publicacao_v2,
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM pg_views
            WHERE schemaname = 'public'
                AND viewname = 'vw_pulso_canais'
        ) THEN '✓ EXISTE'
        ELSE '✗ FALTA'
    END as vw_pulso_canais,
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM pg_views
            WHERE schemaname = 'public'
                AND viewname = 'vw_agenda_publicacao_detalhada'
        ) THEN '✓ EXISTE'
        ELSE '✗ FALTA'
    END as vw_agenda_publicacao_detalhada,
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM pg_views
            WHERE schemaname = 'public'
                AND viewname = 'n8n_roteiro_completo'
        ) THEN '✓ EXISTE'
        ELSE '✗ FALTA'
    END as n8n_roteiro_completo;
| vw_pulso_calendario_publicacao_v2 | vw_pulso_canais | vw_agenda_publicacao_detalhada | n8n_roteiro_completo | | --------------------------------- | --------------- | ------------------------------ | -------------------- |
| ✓ EXISTE | ✗ FALTA | ✗ FALTA | ✓ EXISTE | -- 9. TESTAR SELECT DIRETO COMO ANON (simulação)
SET ROLE anon;
SELECT 'Teste como anon' as contexto;
SELECT COUNT(*) as total_ideias
FROM public.ideias;
SELECT COUNT(*) as total_canais
FROM public.canais;
RESET ROLE;
| total_canais | | ------------ |
| 10 | -- 10. VERIFICAR CONFIGURAÇÃO DO POSTGREST
SELECT current_setting('pgrst.db_schemas', true) as exposed_schemas;
| exposed_schemas | | --------------- |
| null |
SELECT current_setting('pgrst.db_anon_role', true) as anon_role;
| anon_role | | --------- |
| null |