-- ============================================================================
-- CRIAR VIEWS FALTANTES NO SCHEMA PUBLIC
-- Para workflows e workflow_execucoes
-- ============================================================================
-- 1. View para workflows
DROP VIEW IF EXISTS public.workflows CASCADE;
CREATE VIEW public.workflows AS
SELECT *
FROM pulso_automation.workflows;
-- 2. View para workflow_execucoes
DROP VIEW IF EXISTS public.workflow_execucoes CASCADE;
CREATE VIEW public.workflow_execucoes AS
SELECT *
FROM pulso_automation.workflow_execucoes;
-- 3. View para conteudos (caso não exista)
DROP VIEW IF EXISTS public.conteudos CASCADE;
CREATE VIEW public.conteudos AS
SELECT *
FROM pulso_content.conteudos;
-- 4. View para conteudo_variantes
DROP VIEW IF EXISTS public.conteudo_variantes CASCADE;
CREATE VIEW public.conteudo_variantes AS
SELECT *
FROM pulso_content.conteudo_variantes;
-- 5. View para posts
DROP VIEW IF EXISTS public.posts CASCADE;
CREATE VIEW public.posts AS
SELECT *
FROM pulso_distribution.posts;
-- 6. View para posts_logs
DROP VIEW IF EXISTS public.posts_logs CASCADE;
CREATE VIEW public.posts_logs AS
SELECT *
FROM pulso_distribution.posts_logs;
-- 7. View para canais_plataformas
DROP VIEW IF EXISTS public.canais_plataformas CASCADE;
CREATE VIEW public.canais_plataformas AS
SELECT *
FROM pulso_core.canais_plataformas;
-- 8. View para assets
DROP VIEW IF EXISTS public.assets CASCADE;
CREATE VIEW public.assets AS
SELECT *
FROM pulso_assets.assets;
-- 9. View para eventos
DROP VIEW IF EXISTS public.eventos CASCADE;
CREATE VIEW public.eventos AS
SELECT *
FROM pulso_analytics.eventos;
-- Confirmar criação
SELECT schemaname,
    viewname
FROM pg_views
WHERE schemaname = 'public'
    AND viewname IN (
        'workflows',
        'workflow_execucoes',
        'conteudos',
        'conteudo_variantes',
        'posts',
        'canais_plataformas',
        'assets',
        'eventos'
    )
ORDER BY viewname;