-- =====================================================
-- FIX CRÍTICO PGRST002 - SCHEMA CACHE
-- Execute este script no Supabase SQL Editor URGENTE
-- =====================================================
-- PASSO 1: Verificar se o role authenticator existe
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_roles
    WHERE rolname = 'authenticator'
) THEN CREATE ROLE authenticator NOINHERIT LOGIN;
END IF;
END $$;
-- PASSO 2: Garantir que anon e authenticated herdam do authenticator
GRANT anon TO authenticator;
GRANT authenticated TO authenticator;
-- PASSO 3: Conceder USAGE nos schemas para todos os roles
GRANT USAGE ON SCHEMA public TO anon,
    authenticated,
    authenticator;
GRANT USAGE ON SCHEMA pulso_core TO anon,
    authenticated,
    authenticator;
GRANT USAGE ON SCHEMA pulso_content TO anon,
    authenticated,
    authenticator;
GRANT USAGE ON SCHEMA information_schema TO anon,
    authenticated,
    authenticator;
-- PASSO 4: Permitir acesso ao catálogo do sistema para anon
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
-- PASSO 5: Desabilitar RLS em TODAS as tabelas base dos schemas
ALTER TABLE IF EXISTS pulso_core.canais DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pulso_core.series DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pulso_content.ideias DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pulso_content.roteiros DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pulso_content.pipeline_producao DISABLE ROW LEVEL SECURITY;
-- PASSO 6: Garantir SELECT em TODAS as tabelas para anon
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon,
    authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA pulso_core TO anon,
    authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA pulso_content TO anon,
    authenticated;
-- PASSO 7: Garantir que as funções dos triggers são executáveis
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon,
    authenticated;
-- PASSO 8: Re-grant específico nas views principais
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
-- Garantir SELECT nas views auxiliares
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
-- PASSO 9: Garantir acesso às tabelas base nos schemas pulso_*
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
-- PASSO 10: Criar política RLS permissiva para TODAS as tabelas (fallback)
-- Canais
DROP POLICY IF EXISTS "Permitir SELECT para todos" ON pulso_core.canais;
CREATE POLICY "Permitir SELECT para todos" ON pulso_core.canais FOR
SELECT USING (true);
ALTER TABLE pulso_core.canais ENABLE ROW LEVEL SECURITY;
-- Series
DROP POLICY IF EXISTS "Permitir SELECT para todos" ON pulso_core.series;
CREATE POLICY "Permitir SELECT para todos" ON pulso_core.series FOR
SELECT USING (true);
ALTER TABLE pulso_core.series ENABLE ROW LEVEL SECURITY;
-- Ideias
DROP POLICY IF EXISTS "Permitir tudo para todos" ON pulso_content.ideias;
CREATE POLICY "Permitir tudo para todos" ON pulso_content.ideias FOR ALL USING (true);
ALTER TABLE pulso_content.ideias ENABLE ROW LEVEL SECURITY;
-- Roteiros
DROP POLICY IF EXISTS "Permitir tudo para todos" ON pulso_content.roteiros;
CREATE POLICY "Permitir tudo para todos" ON pulso_content.roteiros FOR ALL USING (true);
ALTER TABLE pulso_content.roteiros ENABLE ROW LEVEL SECURITY;
-- Pipeline
DROP POLICY IF EXISTS "Permitir tudo para todos" ON pulso_content.pipeline_producao;
CREATE POLICY "Permitir tudo para todos" ON pulso_content.pipeline_producao FOR ALL USING (true);
ALTER TABLE pulso_content.pipeline_producao ENABLE ROW LEVEL SECURITY;
-- PASSO 11: Recarregar cache do PostgREST
NOTIFY pgrst,
'reload schema';
NOTIFY pgrst,
'reload config';
-- PASSO 12: Verificar status
SELECT '=== VERIFICAÇÃO FINAL ===' as status;
-- Verificar roles
SELECT rolname,
    rolcanlogin,
    rolinherit
FROM pg_roles
WHERE rolname IN (
        'anon',
        'authenticated',
        'authenticator',
        'postgres'
    )
ORDER BY rolname;
-- Verificar grants nos schemas
SELECT n.nspname as schema,
    r.rolname as role,
    has_schema_privilege(r.oid, n.oid, 'USAGE') as has_usage
FROM pg_namespace n
    CROSS JOIN pg_roles r
WHERE n.nspname IN ('public', 'pulso_core', 'pulso_content')
    AND r.rolname IN ('anon', 'authenticated')
ORDER BY n.nspname,
    r.rolname;
-- Verificar RLS status
SELECT schemaname,
    tablename,
    rowsecurity as rls_enabled,
    (
        SELECT count(*)
        FROM pg_policies
        WHERE schemaname = t.schemaname
            AND tablename = t.tablename
    ) as policies_count
FROM pg_tables t
WHERE schemaname IN ('pulso_core', 'pulso_content')
ORDER BY schemaname,
    tablename;
-- Teste final como anon
SET ROLE anon;
SELECT 'Teste como ANON - Canais:' as teste,
    COUNT(*) as total
FROM pulso_core.canais;
SELECT 'Teste como ANON - Ideias:' as teste,
    COUNT(*) as total
FROM pulso_content.ideias;
SELECT 'Teste como ANON - View Canais:' as teste,
    COUNT(*) as total
FROM public.canais;
SELECT 'Teste como ANON - View Ideias:' as teste,
    COUNT(*) as total
FROM public.ideias;
RESET ROLE;
SELECT 'Script executado com sucesso! Teste novamente o frontend.' as resultado;