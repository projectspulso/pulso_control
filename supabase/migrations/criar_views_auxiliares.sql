-- =====================================================
-- VIEWS AUXILIARES FALTANTES
-- Execute este script APÓS verificar o diagnóstico
-- =====================================================
-- Verificar se views auxiliares existem em pulso_content primeiro
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_views
    WHERE schemaname = 'pulso_content'
        AND viewname = 'vw_pulso_calendario_publicacao_v2'
) THEN RAISE NOTICE 'AVISO: vw_pulso_calendario_publicacao_v2 não existe em pulso_content. Será criada com definição básica.';
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM pg_views
    WHERE schemaname = 'pulso_content'
        AND viewname = 'vw_pulso_pipeline_com_assets'
) THEN RAISE NOTICE 'AVISO: vw_pulso_pipeline_com_assets não existe em pulso_content. Será criada com definição básica.';
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM pg_views
    WHERE schemaname = 'pulso_content'
        AND viewname = 'vw_pulso_pipeline_com_assets_v2'
) THEN RAISE NOTICE 'AVISO: vw_pulso_pipeline_com_assets_v2 não existe em pulso_content. Será criada com definição básica.';
END IF;
END $$;
-- =============================================================================
-- 1. VIEW: vw_pulso_calendario_publicacao_v2
-- =============================================================================
-- Primeiro criar em pulso_content se não existir
CREATE OR REPLACE VIEW pulso_content.vw_pulso_calendario_publicacao_v2 AS
SELECT p.id as pipeline_id,
    p.titulo as pipeline_titulo,
    p.status as pipeline_status,
    p.prioridade,
    p.data_entrega_prevista,
    p.data_gravacao,
    p.data_edicao,
    p.data_finalizacao,
    i.id as ideia_id,
    i.titulo as ideia,
    i.descricao as ideia_descricao,
    i.status as ideia_status,
    r.id as roteiro_id,
    r.titulo as roteiro_titulo,
    r.status as roteiro_status,
    r.versao as roteiro_versao,
    c.id as canal_id,
    c.nome as canal_nome,
    c.slug as canal_slug,
    s.id as serie_id,
    s.nome as serie_nome,
    s.slug as serie_slug
FROM pulso_content.pipeline_producao p
    LEFT JOIN pulso_content.ideias i ON p.ideia_id = i.id
    LEFT JOIN pulso_content.roteiros r ON p.roteiro_id = r.id
    LEFT JOIN pulso_core.canais c ON i.canal_id = c.id
    LEFT JOIN pulso_core.series s ON i.serie_id = s.id;
-- Depois criar em public
CREATE OR REPLACE VIEW public.vw_pulso_calendario_publicacao_v2 AS
SELECT *
FROM pulso_content.vw_pulso_calendario_publicacao_v2;
GRANT SELECT ON public.vw_pulso_calendario_publicacao_v2 TO anon,
    authenticated;
-- =============================================================================
-- 2. VIEW: vw_pulso_pipeline_com_assets (se não existir em pulso_content)
-- =============================================================================
CREATE OR REPLACE VIEW pulso_content.vw_pulso_pipeline_com_assets AS
SELECT p.*,
    COALESCE(
        (
            SELECT COUNT(*)
            FROM pulso_assets.assets a
            WHERE a.pipeline_id = p.id
        ),
        0
    ) as total_assets
FROM pulso_content.pipeline_producao p;
-- Já existe em public via recriar_views_publicas.sql
-- Mas garantir permissões
GRANT SELECT ON pulso_content.vw_pulso_pipeline_com_assets TO anon,
    authenticated;
-- =============================================================================
-- 3. VIEW: vw_pulso_pipeline_com_assets_v2 (se não existir em pulso_content)
-- =============================================================================
CREATE OR REPLACE VIEW pulso_content.vw_pulso_pipeline_com_assets_v2 AS
SELECT p.*,
    i.titulo as ideia_titulo,
    i.descricao as ideia_descricao,
    c.nome as canal_nome,
    s.nome as serie_nome,
    COALESCE(
        (
            SELECT json_agg(
                    json_build_object(
                        'id',
                        a.id,
                        'tipo',
                        a.tipo,
                        'status',
                        a.status,
                        'url',
                        a.url_original
                    )
                )
            FROM pulso_assets.assets a
            WHERE a.pipeline_id = p.id
        ),
        '[]'::json
    ) as assets
FROM pulso_content.pipeline_producao p
    LEFT JOIN pulso_content.ideias i ON p.ideia_id = i.id
    LEFT JOIN pulso_core.canais c ON i.canal_id = c.id
    LEFT JOIN pulso_core.series s ON i.serie_id = s.id;
-- Já existe em public via recriar_views_publicas.sql
-- Mas garantir permissões
GRANT SELECT ON pulso_content.vw_pulso_pipeline_com_assets_v2 TO anon,
    authenticated;
-- =============================================================================
-- 4. VIEW: n8n_roteiro_completo
-- =============================================================================
CREATE OR REPLACE VIEW pulso_content.n8n_roteiro_completo AS
SELECT r.id as roteiro_id,
    r.titulo as roteiro_titulo,
    r.conteudo_md as roteiro_conteudo,
    r.versao as roteiro_versao,
    r.status as roteiro_status,
    r.duracao_estimado_segundos,
    i.id as ideia_id,
    i.titulo as ideia_titulo,
    i.descricao as ideia_descricao,
    i.status as ideia_status,
    i.tags as ideia_tags,
    c.id as canal_id,
    c.nome as canal_nome,
    c.slug as canal_slug,
    s.id as serie_id,
    s.nome as serie_nome,
    s.slug as serie_slug,
    r.created_at,
    r.updated_at
FROM pulso_content.roteiros r
    JOIN pulso_content.ideias i ON r.ideia_id = i.id
    LEFT JOIN pulso_core.canais c ON i.canal_id = c.id
    LEFT JOIN pulso_core.series s ON i.serie_id = s.id;
CREATE OR REPLACE VIEW public.n8n_roteiro_completo AS
SELECT *
FROM pulso_content.n8n_roteiro_completo;
GRANT SELECT ON public.n8n_roteiro_completo TO anon,
    authenticated;
-- =============================================================================
-- 5. VIEW: vw_pulso_canais
-- =============================================================================
CREATE OR REPLACE VIEW pulso_core.vw_pulso_canais AS
SELECT c.*,
    COALESCE(
        (
            SELECT COUNT(*)
            FROM pulso_core.series
            WHERE canal_id = c.id
        ),
        0
    ) as total_series,
    COALESCE(
        (
            SELECT COUNT(*)
            FROM pulso_content.ideias
            WHERE canal_id = c.id
        ),
        0
    ) as total_ideias
FROM pulso_core.canais c;
CREATE OR REPLACE VIEW public.vw_pulso_canais AS
SELECT *
FROM pulso_core.vw_pulso_canais;
GRANT SELECT ON public.vw_pulso_canais TO anon,
    authenticated;
-- =============================================================================
-- 6. VIEW: vw_agenda_publicacao_detalhada
-- =============================================================================
CREATE OR REPLACE VIEW pulso_content.vw_agenda_publicacao_detalhada AS
SELECT p.id as pipeline_id,
    p.titulo,
    p.status,
    p.prioridade,
    p.data_entrega_prevista,
    p.data_gravacao,
    p.data_edicao,
    p.data_finalizacao,
    i.titulo as ideia_titulo,
    c.nome as canal_nome,
    s.nome as serie_nome,
    p.responsavel_gravacao,
    p.responsavel_edicao,
    p.notas_producao,
    CASE
        WHEN p.status = 'publicado' THEN p.data_finalizacao
        WHEN p.status = 'editando' THEN p.data_edicao
        WHEN p.status = 'gravando' THEN p.data_gravacao
        ELSE p.data_entrega_prevista
    END as data_referencia
FROM pulso_content.pipeline_producao p
    LEFT JOIN pulso_content.ideias i ON p.ideia_id = i.id
    LEFT JOIN pulso_core.canais c ON i.canal_id = c.id
    LEFT JOIN pulso_core.series s ON i.serie_id = s.id
WHERE p.status IN (
        'aguardando',
        'gravando',
        'editando',
        'aprovacao'
    )
ORDER BY data_referencia ASC NULLS LAST;
CREATE OR REPLACE VIEW public.vw_agenda_publicacao_detalhada AS
SELECT *
FROM pulso_content.vw_agenda_publicacao_detalhada;
GRANT SELECT ON public.vw_agenda_publicacao_detalhada TO anon,
    authenticated;
-- =============================================================================
-- 7. RECARREGAR CACHE DO POSTGREST
-- =============================================================================
NOTIFY pgrst,
'reload schema';
-- =============================================================================
-- 8. VERIFICAÇÃO FINAL
-- =============================================================================
SELECT 'Views auxiliares criadas com sucesso!' as status;
-- Listar todas as views criadas
SELECT schemaname,
    viewname,
    CASE
        WHEN viewname IN (
            'vw_pulso_calendario_publicacao_v2',
            'vw_pulso_pipeline_com_assets',
            'vw_pulso_pipeline_com_assets_v2',
            'n8n_roteiro_completo',
            'vw_pulso_canais',
            'vw_agenda_publicacao_detalhada'
        ) THEN '✓ CRIADA'
        ELSE '  outras'
    END as status
FROM pg_views
WHERE schemaname = 'public'
    AND viewname LIKE 'vw_%'
    OR viewname LIKE 'n8n_%'
ORDER BY status DESC,
    viewname;