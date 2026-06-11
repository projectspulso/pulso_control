-- =====================================================
-- FIX DEFINITIVO PGRST002 - Schema Cache Access
-- O problema é que o role 'anon' não tem permissão para
-- ler o catálogo do sistema (pg_catalog)
-- =====================================================
-- PASSO 1: Conceder SELECT nas tabelas do catálogo do sistema
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
-- PASSO 2: Conceder USAGE nos schemas
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
-- PASSO 3: Conceder SELECT em TODAS as tabelas e views
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon,
    authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA pulso_core TO anon,
    authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA pulso_content TO anon,
    authenticated;
-- PASSO 4: Conceder permissões de modificação nas tabelas base
GRANT INSERT,
    UPDATE,
    DELETE ON pulso_content.ideias TO anon,
    authenticated;
GRANT INSERT,
    UPDATE,
    DELETE ON pulso_content.roteiros TO anon,
    authenticated;
GRANT INSERT,
    UPDATE,
    DELETE ON pulso_content.pipeline_producao TO anon,
    authenticated;
-- PASSO 5: Conceder permissões de modificação nas views public
GRANT INSERT,
    UPDATE,
    DELETE ON public.ideias TO anon,
    authenticated;
GRANT INSERT,
    UPDATE,
    DELETE ON public.roteiros TO anon,
    authenticated;
GRANT INSERT,
    UPDATE,
    DELETE ON public.pipeline_producao TO anon,
    authenticated;
GRANT INSERT,
    UPDATE,
    DELETE ON public.conteudos_producao TO anon,
    authenticated;
-- PASSO 6: Garantir execução das funções trigger
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon,
    authenticated;
-- PASSO 7: Desabilitar RLS nas tabelas base
ALTER TABLE pulso_core.canais DISABLE ROW LEVEL SECURITY;
ALTER TABLE pulso_core.series DISABLE ROW LEVEL SECURITY;
ALTER TABLE pulso_content.ideias DISABLE ROW LEVEL SECURITY;
ALTER TABLE pulso_content.roteiros DISABLE ROW LEVEL SECURITY;
ALTER TABLE pulso_content.pipeline_producao DISABLE ROW LEVEL SECURITY;
-- PASSO 8: Recarregar cache do PostgREST
NOTIFY pgrst,
'reload schema';
NOTIFY pgrst,
'reload config';
-- PASSO 9: Verificação
SELECT '=== TESTE DE PERMISSÕES ===' as status;
-- Testar acesso ao catálogo
SET ROLE anon;
SELECT 'Teste catálogo - pg_namespace' as teste,
    COUNT(*)
FROM pg_namespace
WHERE nspname IN ('public', 'pulso_core', 'pulso_content');
SELECT 'Teste catálogo - pg_class' as teste,
    COUNT(*)
FROM pg_class
WHERE relnamespace IN (
        SELECT oid
        FROM pg_namespace
        WHERE nspname = 'public'
    );
RESET ROLE;
-- Testar acesso às tabelas
SET ROLE anon;
SELECT 'Canais (tabela base)' as teste,
    COUNT(*)
FROM pulso_core.canais;
SELECT 'Ideias (tabela base)' as teste,
    COUNT(*)
FROM pulso_content.ideias;
SELECT 'Canais (view public)' as teste,
    COUNT(*)
FROM public.canais;
SELECT 'Ideias (view public)' as teste,
    COUNT(*)
FROM public.ideias;
RESET ROLE;
SELECT 'Script executado! Aguarde 5 segundos e teste o endpoint novamente.' as resultado;