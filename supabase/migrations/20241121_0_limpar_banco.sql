-- =====================================================
-- LIMPAR TUDO ANTES DE RECRIAR
-- =====================================================
-- Dropar views públicas existentes
DROP VIEW IF EXISTS public.pipeline_producao CASCADE;
DROP VIEW IF EXISTS public.roteiros CASCADE;
DROP VIEW IF EXISTS public.ideias CASCADE;
DROP VIEW IF EXISTS public.series CASCADE;
DROP VIEW IF EXISTS public.canais CASCADE;
-- Dropar views do schema content
DROP VIEW IF EXISTS content.vw_pipeline_completo CASCADE;
-- Dropar tabelas (CASCADE remove dependências)
DROP TABLE IF EXISTS content.pipeline_producao CASCADE;
DROP TABLE IF EXISTS assets.videos CASCADE;
DROP TABLE IF EXISTS assets.audios CASCADE;
DROP TABLE IF EXISTS content.roteiros CASCADE;
DROP TABLE IF EXISTS content.ideias CASCADE;
DROP TABLE IF EXISTS core.series CASCADE;
DROP TABLE IF EXISTS core.canais CASCADE;
-- Dropar função de trigger se existir
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
-- =====================================================
-- AGORA EXECUTE A MIGRATION PRINCIPAL
-- (20241121_create_pipeline_producao.sql)
-- =====================================================