-- =====================================================
-- FIX RLS E PERMISSÕES - RESOLVER ERRO PGRST002
-- Execute este script no Supabase SQL Editor
-- =====================================================
-- PASSO 1: Desabilitar RLS nas TABELAS BASE (não views)
-- Views não têm RLS, apenas as tabelas base
ALTER TABLE IF EXISTS pulso_core.canais DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pulso_core.series DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pulso_content.ideias DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pulso_content.roteiros DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pulso_content.pipeline_producao DISABLE ROW LEVEL SECURITY;
-- PASSO 2: Garantir que o role anon tem acesso ao schema public
GRANT USAGE ON SCHEMA public TO anon,
    authenticated;
GRANT USAGE ON SCHEMA pulso_core TO anon,
    authenticated;
GRANT USAGE ON SCHEMA pulso_content TO anon,
    authenticated;
-- PASSO 3: Garantir permissões em TODAS as sequences
GRANT USAGE,
    SELECT ON ALL SEQUENCES IN SCHEMA public TO anon,
    authenticated;
GRANT USAGE,
    SELECT ON ALL SEQUENCES IN SCHEMA pulso_core TO anon,
    authenticated;
GRANT USAGE,
    SELECT ON ALL SEQUENCES IN SCHEMA pulso_content TO anon,
    authenticated;
-- PASSO 4: Garantir permissões em TODAS as tables e views
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon,
    authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA pulso_core TO anon,
    authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA pulso_content TO anon,
    authenticated;
-- PASSO 5: Permissões específicas de INSERT/UPDATE/DELETE nas views principais
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
-- PASSO 6: Garantir que o schema public está exposto no PostgREST
-- Verificar configuração atual
DO $$ BEGIN -- Tentar atualizar a configuração do PostgREST
EXECUTE 'ALTER DATABASE postgres SET pgrst.db_schemas = ''public''';
EXCEPTION
WHEN OTHERS THEN RAISE NOTICE 'Não foi possível alterar pgrst.db_schemas: %',
SQLERRM;
END $$;
-- PASSO 7: Verificar e corrigir owner das views
ALTER VIEW IF EXISTS public.canais OWNER TO postgres;
ALTER VIEW IF EXISTS public.series OWNER TO postgres;
ALTER VIEW IF EXISTS public.ideias OWNER TO postgres;
ALTER VIEW IF EXISTS public.roteiros OWNER TO postgres;
ALTER VIEW IF EXISTS public.pipeline_producao OWNER TO postgres;
ALTER VIEW IF EXISTS public.conteudos_producao OWNER TO postgres;
ALTER VIEW IF EXISTS public.vw_pulso_calendario_publicacao_v2 OWNER TO postgres;
ALTER VIEW IF EXISTS public.vw_pulso_pipeline_com_assets_v2 OWNER TO postgres;
ALTER VIEW IF EXISTS public.vw_pulso_canais OWNER TO postgres;
ALTER VIEW IF EXISTS public.vw_agenda_publicacao_detalhada OWNER TO postgres;
-- PASSO 8: Recarregar cache do PostgREST
NOTIFY pgrst,
'reload schema';
NOTIFY pgrst,
'reload config';
-- PASSO 9: Verificar permissões
SELECT schemaname,
    tablename,
    tableowner,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
SELECT schemaname,
    viewname,
    viewowner
FROM pg_views
WHERE schemaname = 'public'
ORDER BY viewname;
-- PASSO 10: Verificar grants para anon
SELECT grantee,
    table_schema,
    table_name,
    string_agg(privilege_type, ', ') as privileges
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
    AND grantee IN ('anon', 'authenticated')
    AND table_name IN (
        'ideias',
        'canais',
        'series',
        'roteiros',
        'pipeline_producao'
    )
GROUP BY grantee,
    table_schema,
    table_name
ORDER BY table_name,
    grantee;
-- PASSO 11: Testar SELECT direto
SET ROLE anon;
SELECT COUNT(*) as total_canais
FROM public.canais;
SELECT COUNT(*) as total_ideias
FROM public.ideias;
SELECT COUNT(*) as total_series
FROM public.series;
RESET ROLE;
SELECT 'Script de correção de RLS e permissões executado com sucesso!' as status;