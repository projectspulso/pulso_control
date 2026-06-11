-- =====================================================
-- FIX 503 ERRORS - RECRIAR TODAS AS VIEWS NA ORDEM CORRETA
-- Execute este script no Supabase SQL Editor
-- =====================================================
-- PASSO 1: Dropar views dependentes em public (CASCADE)
DROP VIEW IF EXISTS public.vw_pulso_calendario_publicacao_v2 CASCADE;
DROP VIEW IF EXISTS public.vw_pulso_pipeline_com_assets_v2 CASCADE;
DROP VIEW IF EXISTS public.vw_pulso_canais CASCADE;
DROP VIEW IF EXISTS public.vw_agenda_publicacao_detalhada CASCADE;
-- PASSO 2: Dropar views dependentes em pulso_content
DROP VIEW IF EXISTS pulso_content.vw_pulso_pipeline_com_assets_v2 CASCADE;
DROP VIEW IF EXISTS pulso_content.vw_pulso_pipeline_base_v2 CASCADE;
-- PASSO 3: Recriar view BASE em pulso_content
CREATE OR REPLACE VIEW pulso_content.vw_pulso_pipeline_base_v2 AS
SELECT p.id as pipeline_id,
    p.conteudo_variantes_id,
    -- Canal com fallback
    COALESCE(
        ca.nome,
        i.metadata->>'canal_nome',
        'Canal não definido'
    ) as canal_nome,
    -- Série com fallback
    COALESCE(s.nome, i.metadata->>'serie_nome', 'Sem série') as serie_nome,
    -- Ideia / título exibido
    COALESCE(i.titulo, 'Sem título') as ideia_titulo,
    -- Status da ideia e do pipeline
    COALESCE(i.status::text, 'RASCUNHO') as ideia_status,
    p.status as pipeline_status,
    -- Campos do pipeline
    p.is_piloto,
    p.data_prevista,
    p.data_publicacao_planejada,
    (p.data_publicacao_planejada::time) as hora_publicacao,
    p.prioridade,
    p.metadata as pipeline_metadata
FROM pulso_content.pipeline_producao p
    LEFT JOIN pulso_content.ideias i ON i.id = p.ideia_id
    LEFT JOIN pulso_core.canais ca ON ca.id = i.canal_id
    LEFT JOIN pulso_core.series s ON s.id = i.serie_id;
-- PASSO 4: Recriar view COM ASSETS em pulso_content
CREATE OR REPLACE VIEW pulso_content.vw_pulso_pipeline_com_assets_v2 AS
SELECT b.pipeline_id,
    b.conteudo_variantes_id,
    b.canal_nome,
    b.serie_nome,
    b.ideia_titulo,
    b.ideia_status,
    b.pipeline_status,
    b.is_piloto,
    b.data_prevista,
    b.data_publicacao_planejada,
    b.hora_publicacao,
    b.prioridade,
    b.pipeline_metadata,
    -- Dados do asset (se existir schema pulso_assets)
    NULL::uuid as asset_id,
    NULL::text as asset_tipo,
    NULL::text as caminho_storage,
    NULL::text as provedor,
    NULL::integer as duracao_segundos,
    NULL::integer as largura_px,
    NULL::integer as altura_px,
    NULL::bigint as tamanho_bytes,
    NULL::jsonb as asset_metadata,
    NULL::text as asset_papel,
    NULL::integer as asset_ordem
FROM pulso_content.vw_pulso_pipeline_base_v2 b;
-- PASSO 5: Recriar views em PUBLIC
CREATE OR REPLACE VIEW public.vw_pulso_calendario_publicacao_v2 AS
SELECT pipeline_id,
    canal_nome as canal,
    serie_nome as serie,
    ideia_titulo as ideia,
    ideia_status,
    pipeline_status,
    is_piloto,
    data_prevista,
    data_publicacao_planejada,
    hora_publicacao,
    prioridade,
    pipeline_metadata as metadata
FROM pulso_content.vw_pulso_pipeline_base_v2;
CREATE OR REPLACE VIEW public.vw_pulso_pipeline_com_assets_v2 AS
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
-- PASSO 6: Criar vw_pulso_canais
CREATE OR REPLACE VIEW public.vw_pulso_canais AS
SELECT c.id,
    c.nome,
    c.slug,
    c.descricao,
    c.idioma,
    c.status,
    c.metadata,
    c.created_at,
    c.updated_at,
    COUNT(DISTINCT s.id) as total_series,
    COUNT(DISTINCT i.id) as total_ideias,
    COUNT(DISTINCT p.id) as total_pipeline
FROM pulso_core.canais c
    LEFT JOIN pulso_core.series s ON s.canal_id = c.id
    LEFT JOIN pulso_content.ideias i ON i.canal_id = c.id
    LEFT JOIN pulso_content.pipeline_producao p ON p.ideia_id IN (
        SELECT id
        FROM pulso_content.ideias
        WHERE canal_id = c.id
    )
GROUP BY c.id,
    c.nome,
    c.slug,
    c.descricao,
    c.idioma,
    c.status,
    c.metadata,
    c.created_at,
    c.updated_at;
-- PASSO 7: Criar vw_agenda_publicacao_detalhada
CREATE OR REPLACE VIEW public.vw_agenda_publicacao_detalhada AS
SELECT p.id as pipeline_id,
    p.ideia_id,
    p.roteiro_id,
    p.status as pipeline_status,
    p.prioridade,
    p.data_prevista,
    p.data_publicacao,
    p.data_publicacao_planejada,
    p.data_lancamento,
    p.is_piloto,
    p.responsavel,
    p.observacoes,
    p.metadata as pipeline_metadata,
    p.created_at as pipeline_created_at,
    p.updated_at as pipeline_updated_at,
    -- Dados da ideia
    i.titulo as ideia_titulo,
    i.descricao as ideia_descricao,
    i.status as ideia_status,
    i.prioridade as ideia_prioridade,
    i.tags as ideia_tags,
    i.canal_id,
    i.serie_id,
    -- Dados do canal
    c.nome as canal_nome,
    c.slug as canal_slug,
    c.descricao as canal_descricao,
    c.idioma as canal_idioma,
    c.status as canal_status,
    -- Dados da série
    s.nome as serie_nome,
    s.slug as serie_slug,
    s.descricao as serie_descricao,
    s.status as serie_status,
    -- Dados do roteiro
    r.titulo as roteiro_titulo,
    r.versao as roteiro_versao,
    r.status as roteiro_status,
    r.duracao_estimado_segundos
FROM pulso_content.pipeline_producao p
    LEFT JOIN pulso_content.ideias i ON i.id = p.ideia_id
    LEFT JOIN pulso_core.canais c ON c.id = i.canal_id
    LEFT JOIN pulso_core.series s ON s.id = i.serie_id
    LEFT JOIN pulso_content.roteiros r ON r.id = p.roteiro_id
ORDER BY COALESCE(
        p.data_publicacao_planejada,
        p.data_prevista,
        p.created_at
    ) ASC;
-- PASSO 8: Garantir permissões
GRANT SELECT ON pulso_content.vw_pulso_pipeline_base_v2 TO anon,
    authenticated;
GRANT SELECT ON pulso_content.vw_pulso_pipeline_com_assets_v2 TO anon,
    authenticated;
GRANT SELECT ON public.vw_pulso_calendario_publicacao_v2 TO anon,
    authenticated;
GRANT SELECT ON public.vw_pulso_pipeline_com_assets_v2 TO anon,
    authenticated;
GRANT SELECT ON public.vw_pulso_canais TO anon,
    authenticated;
GRANT SELECT ON public.vw_agenda_publicacao_detalhada TO anon,
    authenticated;
-- PASSO 9: Recarregar schema cache do PostgREST
NOTIFY pgrst,
'reload schema';
-- PASSO 10: Verificação final
SELECT '=== VERIFICAÇÃO DE VIEWS ===' as status;
SELECT CASE
        WHEN EXISTS (
            SELECT 1
            FROM pg_views
            WHERE schemaname = 'pulso_content'
                AND viewname = 'vw_pulso_pipeline_base_v2'
        ) THEN '✓ EXISTE'
        ELSE '✗ FALTA'
    END as vw_pulso_pipeline_base_v2,
    CASE
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
                AND viewname = 'vw_pulso_pipeline_com_assets_v2'
        ) THEN '✓ EXISTE'
        ELSE '✗ FALTA'
    END as vw_pulso_pipeline_com_assets_v2,
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
    END as vw_agenda_publicacao_detalhada;
-- PASSO 11: Testar acesso às views como anon
DO $$
DECLARE cnt INTEGER;
BEGIN -- Testar vw_pulso_calendario_publicacao_v2
BEGIN EXECUTE 'SELECT COUNT(*) FROM public.vw_pulso_calendario_publicacao_v2' INTO cnt;
RAISE NOTICE '✓ vw_pulso_calendario_publicacao_v2: % registros',
cnt;
EXCEPTION
WHEN OTHERS THEN RAISE NOTICE '✗ vw_pulso_calendario_publicacao_v2 ERRO: %',
SQLERRM;
END;
-- Testar vw_pulso_pipeline_com_assets_v2
BEGIN EXECUTE 'SELECT COUNT(*) FROM public.vw_pulso_pipeline_com_assets_v2' INTO cnt;
RAISE NOTICE '✓ vw_pulso_pipeline_com_assets_v2: % registros',
cnt;
EXCEPTION
WHEN OTHERS THEN RAISE NOTICE '✗ vw_pulso_pipeline_com_assets_v2 ERRO: %',
SQLERRM;
END;
-- Testar vw_pulso_canais
BEGIN EXECUTE 'SELECT COUNT(*) FROM public.vw_pulso_canais' INTO cnt;
RAISE NOTICE '✓ vw_pulso_canais: % registros',
cnt;
EXCEPTION
WHEN OTHERS THEN RAISE NOTICE '✗ vw_pulso_canais ERRO: %',
SQLERRM;
END;
-- Testar vw_agenda_publicacao_detalhada
BEGIN EXECUTE 'SELECT COUNT(*) FROM public.vw_agenda_publicacao_detalhada' INTO cnt;
RAISE NOTICE '✓ vw_agenda_publicacao_detalhada: % registros',
cnt;
EXCEPTION
WHEN OTHERS THEN RAISE NOTICE '✗ vw_agenda_publicacao_detalhada ERRO: %',
SQLERRM;
END;
END $$;
-- PASSO 12: Teste final de SELECT
SELECT '=== TESTE DE DADOS ===' as status;
SELECT COUNT(*) as total_calendario
FROM public.vw_pulso_calendario_publicacao_v2;
SELECT COUNT(*) as total_pipeline_assets
FROM public.vw_pulso_pipeline_com_assets_v2;
SELECT COUNT(*) as total_canais
FROM public.vw_pulso_canais;
SELECT COUNT(*) as total_agenda
FROM public.vw_agenda_publicacao_detalhada;