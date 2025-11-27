-- LIMPEZA COMPLETA: Dropar todas as views antigas em public para evitar conflitos
-- Depois criar apenas as views V2 limpas
-- 1. DROPAR TODAS AS VIEWS ANTIGAS EM PUBLIC
DROP VIEW IF EXISTS public.vw_pipeline_calendario_publicacao CASCADE;
DROP VIEW IF EXISTS public.vw_pipeline_kanban CASCADE;
DROP VIEW IF EXISTS public.pipeline_producao CASCADE;
DROP VIEW IF EXISTS public.conteudos_producao CASCADE;
DROP VIEW IF EXISTS public.vw_agenda_publicacao_detalhada CASCADE;
-- 2. DROPAR VIEWS V2 ANTIGAS SE EXISTIREM (para recriar do zero)
DROP VIEW IF EXISTS public.vw_pulso_calendario_publicacao_v2 CASCADE;
DROP VIEW IF EXISTS public.vw_pulso_pipeline_com_assets_v2 CASCADE;
DROP VIEW IF EXISTS pulso_content.vw_pulso_pipeline_com_assets_v2 CASCADE;
DROP VIEW IF EXISTS pulso_content.vw_pulso_pipeline_base_v2 CASCADE;
-- 3. CRIAR VIEW BASE V2 NO SCHEMA pulso_content (com fallback para ideias)
CREATE OR REPLACE VIEW pulso_content.vw_pulso_pipeline_base_v2 AS
SELECT p.id as pipeline_id,
    p.conteudo_variantes_id,
    -- Canal com fallback
    COALESCE(
        ca.nome,
        p.metadata->>'canal_nome'
    ) as canal_nome,
    -- Série com fallback
    COALESCE(
        s.nome,
        p.metadata->>'serie_nome',
        co.metadata->>'serie_nome'
    ) as serie_nome,
    -- Título: usa titulo_publico da variante OU titulo da ideia
    COALESCE(cv.titulo_publico, i.titulo) as ideia_titulo,
    -- Status: prioriza conteudo, depois ideia (convertendo para text)
    COALESCE(co.status::text, i.status::text) as ideia_status,
    p.status::text as pipeline_status,
    -- Campos do pipeline
    p.is_piloto as is_piloto,
    p.data_prevista as data_prevista,
    p.data_publicacao_planejada as data_publicacao_planejada,
    (p.data_publicacao_planejada::time) as hora_publicacao,
    p.prioridade as prioridade,
    p.metadata as pipeline_metadata
FROM pulso_content.pipeline_producao p
    LEFT JOIN pulso_content.conteudo_variantes cv ON cv.id = p.conteudo_variantes_id
    LEFT JOIN pulso_content.conteudos co ON co.id = cv.conteudo_id
    LEFT JOIN pulso_core.canais ca ON ca.id = co.canal_id
    LEFT JOIN pulso_core.series s ON s.id = co.serie_id -- FALLBACK: join com ideias para pegar titulo e status se variante não existir
    LEFT JOIN pulso_content.ideias i ON i.id = p.ideia_id;
-- 4. CRIAR VIEW COM ASSETS NO SCHEMA pulso_content
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
    -- Dados do asset
    a.id as asset_id,
    a.tipo as asset_tipo,
    a.caminho_storage,
    a.provedor,
    a.duracao_segundos,
    a.largura_px,
    a.altura_px,
    a.tamanho_bytes,
    a.metadata as asset_metadata,
    cva.papel as asset_papel,
    cva.ordem as asset_ordem
FROM pulso_content.vw_pulso_pipeline_base_v2 b
    LEFT JOIN pulso_assets.conteudo_variantes_assets cva ON cva.conteudo_variantes_id = b.conteudo_variantes_id
    LEFT JOIN pulso_assets.assets a ON a.id = cva.asset_id;
-- 5. CRIAR VIEW PÚBLICA PARA CALENDÁRIO (sem assets)
CREATE OR REPLACE VIEW public.vw_pulso_calendario_publicacao_v2 AS
SELECT b.pipeline_id,
    b.canal_nome as canal,
    b.serie_nome as serie,
    b.ideia_titulo as ideia,
    b.ideia_status,
    b.pipeline_status,
    b.is_piloto,
    b.data_prevista,
    b.data_publicacao_planejada,
    b.hora_publicacao,
    b.prioridade,
    b.pipeline_metadata as metadata
FROM pulso_content.vw_pulso_pipeline_base_v2 b;
-- 6. CRIAR VIEW PÚBLICA COM ASSETS
CREATE OR REPLACE VIEW public.vw_pulso_pipeline_com_assets_v2 AS
SELECT pa.pipeline_id,
    pa.canal_nome as canal,
    pa.serie_nome as serie,
    pa.ideia_titulo as ideia,
    pa.ideia_status,
    pa.pipeline_status,
    pa.is_piloto,
    pa.data_prevista,
    pa.data_publicacao_planejada,
    pa.hora_publicacao,
    pa.prioridade,
    pa.pipeline_metadata as metadata,
    pa.asset_id,
    pa.asset_tipo,
    pa.caminho_storage,
    pa.provedor,
    pa.duracao_segundos,
    pa.largura_px,
    pa.altura_px,
    pa.tamanho_bytes,
    pa.asset_metadata,
    pa.asset_papel,
    pa.asset_ordem
FROM pulso_content.vw_pulso_pipeline_com_assets_v2 pa;
-- 7. GARANTIR PERMISSÕES
GRANT USAGE ON SCHEMA public TO anon,
    authenticated;
GRANT SELECT ON public.vw_pulso_calendario_publicacao_v2 TO anon,
    authenticated;
GRANT SELECT ON public.vw_pulso_pipeline_com_assets_v2 TO anon,
    authenticated;
-- 8. COMENTÁRIOS PARA DOCUMENTAÇÃO
COMMENT ON VIEW public.vw_pulso_calendario_publicacao_v2 IS 'View V2 para calendário editorial - usa conteudo_variantes.titulo_publico com fallback para ideias.titulo';
COMMENT ON VIEW public.vw_pulso_pipeline_com_assets_v2 IS 'View V2 completa com assets - inclui thumbnails, vídeos, áudios vinculados às variantes';