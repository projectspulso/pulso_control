-- =====================================================
-- FIX COMPLETO E DEFINITIVO - RESOLVER PGRST002
-- Execute TODO este script no Supabase SQL Editor
-- =====================================================
-- PARTE 1: Conceder acesso ao catálogo do sistema (CRÍTICO para PGRST002)
GRANT SELECT ON pg_namespace TO anon,
    authenticated;
GRANT SELECT ON pg_class TO anon,
    authenticated;
GRANT SELECT ON pg_attribute TO anon,
    authenticated;
GRANT SELECT ON pg_type TO anon,
    authenticated;
GRANT SELECT ON pg_proc TO anon,
    authenticated;
GRANT SELECT ON pg_description TO anon,
    authenticated;
GRANT SELECT ON pg_index TO anon,
    authenticated;
GRANT SELECT ON pg_constraint TO anon,
    authenticated;
-- PARTE 2: Garantir USAGE nos schemas
GRANT USAGE ON SCHEMA public TO anon,
    authenticated;
GRANT USAGE ON SCHEMA pulso_core TO anon,
    authenticated;
GRANT USAGE ON SCHEMA pulso_content TO anon,
    authenticated;
GRANT USAGE ON SCHEMA pg_catalog TO anon,
    authenticated;
GRANT USAGE ON SCHEMA information_schema TO anon,
    authenticated;
-- PARTE 3: Desabilitar RLS nas tabelas base
ALTER TABLE pulso_core.canais DISABLE ROW LEVEL SECURITY;
ALTER TABLE pulso_core.series DISABLE ROW LEVEL SECURITY;
ALTER TABLE pulso_content.ideias DISABLE ROW LEVEL SECURITY;
ALTER TABLE pulso_content.roteiros DISABLE ROW LEVEL SECURITY;
ALTER TABLE pulso_content.pipeline_producao DISABLE ROW LEVEL SECURITY;
-- PARTE 4: Conceder SELECT nas tabelas base
GRANT SELECT ON pulso_core.canais TO anon,
    authenticated;
GRANT SELECT ON pulso_core.series TO anon,
    authenticated;
GRANT SELECT,
    INSERT,
    UPDATE,
    DELETE ON pulso_content.ideias TO anon,
    authenticated;
GRANT SELECT,
    INSERT,
    UPDATE,
    DELETE ON pulso_content.roteiros TO anon,
    authenticated;
GRANT SELECT,
    INSERT,
    UPDATE,
    DELETE ON pulso_content.pipeline_producao TO anon,
    authenticated;
-- PARTE 5: Conceder permissões em TODAS as views do public
GRANT SELECT,
    INSERT,
    UPDATE,
    DELETE ON public.canais TO anon,
    authenticated;
GRANT SELECT,
    INSERT,
    UPDATE,
    DELETE ON public.series TO anon,
    authenticated;
GRANT SELECT,
    INSERT,
    UPDATE,
    DELETE ON public.ideias TO anon,
    authenticated;
GRANT SELECT,
    INSERT,
    UPDATE,
    DELETE ON public.roteiros TO anon,
    authenticated;
GRANT SELECT,
    INSERT,
    UPDATE,
    DELETE ON public.pipeline_producao TO anon,
    authenticated;
GRANT SELECT,
    INSERT,
    UPDATE,
    DELETE ON public.conteudos_producao TO anon,
    authenticated;
-- Views auxiliares
GRANT SELECT ON public.vw_pulso_calendario_publicacao_v2 TO anon,
    authenticated;
GRANT SELECT ON public.vw_pulso_pipeline_com_assets_v2 TO anon,
    authenticated;
GRANT SELECT ON public.vw_pulso_canais TO anon,
    authenticated;
GRANT SELECT ON public.vw_agenda_publicacao_detalhada TO anon,
    authenticated;
GRANT SELECT ON public.n8n_roteiro_completo TO anon,
    authenticated;
GRANT SELECT ON public.vw_pulso_pipeline_com_assets TO anon,
    authenticated;
GRANT SELECT ON public.vw_pulso_pipeline_base TO anon,
    authenticated;
-- Outras views
GRANT SELECT ON public.assets TO anon,
    authenticated;
GRANT SELECT ON public.canais_plataformas TO anon,
    authenticated;
GRANT SELECT ON public.configuracoes TO anon,
    authenticated;
GRANT SELECT ON public.conteudo_variantes TO anon,
    authenticated;
GRANT SELECT ON public.conteudo_variantes_assets TO anon,
    authenticated;
GRANT SELECT ON public.conteudos TO anon,
    authenticated;
GRANT SELECT ON public.eventos TO anon,
    authenticated;
GRANT SELECT ON public.logs_workflows TO anon,
    authenticated;
GRANT SELECT ON public.metricas_diarias TO anon,
    authenticated;
GRANT SELECT ON public.plataformas TO anon,
    authenticated;
GRANT SELECT ON public.plataformas_conectadas TO anon,
    authenticated;
GRANT SELECT ON public.posts TO anon,
    authenticated;
GRANT SELECT ON public.posts_logs TO anon,
    authenticated;
GRANT SELECT ON public.publicacoes TO anon,
    authenticated;
GRANT SELECT ON public.tags TO anon,
    authenticated;
GRANT SELECT ON public.usuarios_internos TO anon,
    authenticated;
GRANT SELECT ON public.vw_pulso_conteudo_variantes_assets TO anon,
    authenticated;
GRANT SELECT ON public.vw_pulso_posts_metricas_diarias TO anon,
    authenticated;
GRANT SELECT ON public.vw_pulso_workflow_execucoes TO anon,
    authenticated;
GRANT SELECT ON public.vw_pulso_workflows TO anon,
    authenticated;
GRANT SELECT ON public.vw_roteiros TO anon,
    authenticated;
GRANT SELECT ON public.vw_roteiros_pendentes_audio TO anon,
    authenticated;
GRANT SELECT ON public.vw_roteiros_pendentes_video TO anon,
    authenticated;
GRANT SELECT ON public.vw_roteiros_prontos_para_render TO anon,
    authenticated;
GRANT SELECT ON public.workflow_execucoes TO anon,
    authenticated;
GRANT SELECT ON public.workflows TO anon,
    authenticated;
-- PARTE 6: Garantir execução das funções trigger
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon,
    authenticated;
-- PARTE 7: Recarregar cache do PostgREST (MUITO IMPORTANTE!)
NOTIFY pgrst,
'reload schema';
NOTIFY pgrst,
'reload config';
-- PARTE 8: Verificação
SELECT '=== TESTE DE PERMISSÕES ===' as status;
-- Testar como anon
SET ROLE anon;
SELECT 'anon - pg_namespace' as teste,
    COUNT(*)
FROM pg_namespace
WHERE nspname IN ('public', 'pulso_core', 'pulso_content');
SELECT 'anon - pulso_core.canais' as teste,
    COUNT(*)
FROM pulso_core.canais;
SELECT 'anon - pulso_content.ideias' as teste,
    COUNT(*)
FROM pulso_content.ideias;
SELECT 'anon - public.canais' as teste,
    COUNT(*)
FROM public.canais;
SELECT 'anon - public.ideias' as teste,
    COUNT(*)
FROM public.ideias;
RESET ROLE;
SELECT 'Script executado! Aguarde 10 segundos e teste: node test-frontend-exact.js' as resultado;