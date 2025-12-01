-- =====================================================
-- CORRIGIR VIEWS FALTANTES NO PUBLIC
-- Execute este script no Supabase SQL Editor
-- =====================================================
-- 1. Verificar se view base existe nos schemas pulso_*
DO $$ BEGIN -- Verificar vw_pulso_pipeline_base_v2 em pulso_content
IF NOT EXISTS (
    SELECT 1
    FROM pg_views
    WHERE schemaname = 'pulso_content'
        AND viewname = 'vw_pulso_pipeline_base_v2'
) THEN RAISE NOTICE 'AVISO: vw_pulso_pipeline_base_v2 não existe em pulso_content!';
END IF;
END $$;
-- 2. Criar vw_pulso_canais em public (se não existir)
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
-- 3. Criar vw_agenda_publicacao_detalhada em public
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
-- 4. Garantir permissões nas novas views
GRANT SELECT ON public.vw_pulso_canais TO anon,
    authenticated;
GRANT SELECT ON public.vw_agenda_publicacao_detalhada TO anon,
    authenticated;
-- 5. Recarregar schema cache do PostgREST
NOTIFY pgrst,
'reload schema';
-- 6. Verificação final
SELECT CASE
        WHEN EXISTS (
            SELECT 1
            FROM pg_views
            WHERE schemaname = 'public'
                AND viewname = 'vw_pulso_canais'
        ) THEN '✓ vw_pulso_canais CRIADA'
        ELSE '✗ vw_pulso_canais FALHOU'
    END as status_vw_pulso_canais,
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM pg_views
            WHERE schemaname = 'public'
                AND viewname = 'vw_agenda_publicacao_detalhada'
        ) THEN '✓ vw_agenda_publicacao_detalhada CRIADA'
        ELSE '✗ vw_agenda_publicacao_detalhada FALHOU'
    END as status_vw_agenda_publicacao_detalhada;
-- 7. Testar acesso às views como anon
DO $$
DECLARE cnt INTEGER;
BEGIN -- Testar vw_pulso_canais
BEGIN EXECUTE 'SELECT COUNT(*) FROM public.vw_pulso_canais' INTO cnt;
RAISE NOTICE '✓ vw_pulso_canais acessível: % registros',
cnt;
EXCEPTION
WHEN OTHERS THEN RAISE NOTICE '✗ vw_pulso_canais ERRO: %',
SQLERRM;
END;
-- Testar vw_agenda_publicacao_detalhada
BEGIN EXECUTE 'SELECT COUNT(*) FROM public.vw_agenda_publicacao_detalhada' INTO cnt;
RAISE NOTICE '✓ vw_agenda_publicacao_detalhada acessível: % registros',
cnt;
EXCEPTION
WHEN OTHERS THEN RAISE NOTICE '✗ vw_agenda_publicacao_detalhada ERRO: %',
SQLERRM;
END;
END $$;