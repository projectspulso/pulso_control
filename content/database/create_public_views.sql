-- =====================================================================
-- PULSO - VIEWS NO SCHEMA PUBLIC
-- =====================================================================
-- O Supabase usa o schema PUBLIC por padrão para PostgREST API
-- Precisamos criar views que apontem para nossas tabelas nos schemas pulso_*
-- =====================================================================
-- =====================================================================
-- PULSO_CORE - Views básicas
-- =====================================================================
-- View: canais
DROP VIEW IF EXISTS public.canais CASCADE;
CREATE VIEW public.canais AS
SELECT *
FROM pulso_core.canais;
-- View: plataformas
DROP VIEW IF EXISTS public.plataformas CASCADE;
CREATE VIEW public.plataformas AS
SELECT *
FROM pulso_core.plataformas;
-- View: series
DROP VIEW IF EXISTS public.series CASCADE;
CREATE VIEW public.series AS
SELECT *
FROM pulso_core.series;
-- View: tags
DROP VIEW IF EXISTS public.tags CASCADE;
CREATE VIEW public.tags AS
SELECT *
FROM pulso_core.tags;
-- View: canais_plataformas
DROP VIEW IF EXISTS public.canais_plataformas CASCADE;
CREATE VIEW public.canais_plataformas AS
SELECT *
FROM pulso_core.canais_plataformas;
-- View: usuarios_internos
DROP VIEW IF EXISTS public.usuarios_internos CASCADE;
CREATE VIEW public.usuarios_internos AS
SELECT *
FROM pulso_core.usuarios_internos;
-- =====================================================================
-- PULSO_CONTENT - Views de conteúdo
-- =====================================================================
-- View: ideias
DROP VIEW IF EXISTS public.ideias CASCADE;
CREATE VIEW public.ideias AS
SELECT *
FROM pulso_content.ideias;
-- View: roteiros
DROP VIEW IF EXISTS public.roteiros CASCADE;
CREATE VIEW public.roteiros AS
SELECT *
FROM pulso_content.roteiros;
-- View: conteudos
DROP VIEW IF EXISTS public.conteudos CASCADE;
CREATE VIEW public.conteudos AS
SELECT *
FROM pulso_content.conteudos;
-- View: conteudo_variantes
DROP VIEW IF EXISTS public.conteudo_variantes CASCADE;
CREATE VIEW public.conteudo_variantes AS
SELECT *
FROM pulso_content.conteudo_variantes;
-- =====================================================================
-- PULSO_ASSETS - Views de assets
-- =====================================================================
-- View: assets
DROP VIEW IF EXISTS public.assets CASCADE;
CREATE VIEW public.assets AS
SELECT *
FROM pulso_assets.assets;
-- View: conteudo_variantes_assets
DROP VIEW IF EXISTS public.conteudo_variantes_assets CASCADE;
CREATE VIEW public.conteudo_variantes_assets AS
SELECT *
FROM pulso_assets.conteudo_variantes_assets;
-- =====================================================================
-- PULSO_DISTRIBUTION - Views de distribuição
-- =====================================================================
-- View: posts
DROP VIEW IF EXISTS public.posts CASCADE;
CREATE VIEW public.posts AS
SELECT *
FROM pulso_distribution.posts;
-- View: posts_logs
DROP VIEW IF EXISTS public.posts_logs CASCADE;
CREATE VIEW public.posts_logs AS
SELECT *
FROM pulso_distribution.posts_logs;
-- =====================================================================
-- PULSO_ANALYTICS - Views de analytics
-- =====================================================================
-- View: metricas_diarias
DROP VIEW IF EXISTS public.metricas_diarias CASCADE;
CREATE VIEW public.metricas_diarias AS
SELECT *
FROM pulso_analytics.metricas_diarias;
-- View: eventos
DROP VIEW IF EXISTS public.eventos CASCADE;
CREATE VIEW public.eventos AS
SELECT *
FROM pulso_analytics.eventos;
-- =====================================================================
-- PULSO_AUTOMATION - Views de automação
-- =====================================================================
-- View: workflows
DROP VIEW IF EXISTS public.workflows CASCADE;
CREATE VIEW public.workflows AS
SELECT *
FROM pulso_automation.workflows;
-- View: workflow_execucoes
DROP VIEW IF EXISTS public.workflow_execucoes CASCADE;
CREATE VIEW public.workflow_execucoes AS
SELECT *
FROM pulso_automation.workflow_execucoes;
-- =====================================================================
-- PERMISSÕES - Permitir acesso anônimo (apenas leitura)
-- =====================================================================
GRANT USAGE ON SCHEMA public TO anon,
    authenticated;
-- PULSO_CORE
GRANT SELECT ON public.canais TO anon,
    authenticated;
GRANT SELECT ON public.plataformas TO anon,
    authenticated;
GRANT SELECT ON public.series TO anon,
    authenticated;
GRANT SELECT ON public.tags TO anon,
    authenticated;
GRANT SELECT ON public.canais_plataformas TO anon,
    authenticated;
GRANT SELECT ON public.usuarios_internos TO anon,
    authenticated;
-- PULSO_CONTENT
GRANT SELECT ON public.ideias TO anon,
    authenticated;
GRANT SELECT ON public.roteiros TO anon,
    authenticated;
GRANT SELECT ON public.conteudos TO anon,
    authenticated;
GRANT SELECT ON public.conteudo_variantes TO anon,
    authenticated;
-- PULSO_ASSETS
GRANT SELECT ON public.assets TO anon,
    authenticated;
GRANT SELECT ON public.conteudo_variantes_assets TO anon,
    authenticated;
-- PULSO_DISTRIBUTION
GRANT SELECT ON public.posts TO anon,
    authenticated;
GRANT SELECT ON public.posts_logs TO anon,
    authenticated;
-- PULSO_ANALYTICS
GRANT SELECT ON public.metricas_diarias TO anon,
    authenticated;
GRANT SELECT ON public.eventos TO anon,
    authenticated;
-- PULSO_AUTOMATION
GRANT SELECT ON public.workflows TO anon,
    authenticated;
GRANT SELECT ON public.workflow_execucoes TO anon,
    authenticated;
-- =====================================================================
-- VERIFICAÇÃO
-- =====================================================================
-- Execute para verificar as views criadas:
-- SELECT table_name FROM information_schema.views WHERE table_schema = 'public' ORDER BY table_name;