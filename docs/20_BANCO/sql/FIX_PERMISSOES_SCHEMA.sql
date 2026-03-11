-- 🔧 FIX: Permissões no Schema pulso_content
-- O problema: A view public.ideias redireciona para pulso_content.ideias
-- Mas o service_role não tem permissão UPDATE em pulso_content.ideias
-- ========================================
-- SOLUÇÃO: Dar permissões na tabela REAL
-- ========================================
-- 1. Permissões na tabela pulso_content.ideias
GRANT SELECT,
    INSERT,
    UPDATE,
    DELETE ON pulso_content.ideias TO service_role;
GRANT SELECT,
    INSERT,
    UPDATE,
    DELETE ON pulso_content.ideias TO authenticated;
GRANT SELECT ON pulso_content.ideias TO anon;
-- 2. Permissões na tabela pulso_content.roteiros (para o endpoint gerar-roteiro)
GRANT SELECT,
    INSERT,
    UPDATE,
    DELETE ON pulso_content.roteiros TO service_role;
GRANT SELECT,
    INSERT,
    UPDATE,
    DELETE ON pulso_content.roteiros TO authenticated;
GRANT SELECT ON pulso_content.roteiros TO anon;
-- 3. Permissões de USAGE no schema (necessário para acessar objetos dentro do schema)
GRANT USAGE ON SCHEMA pulso_content TO service_role;
GRANT USAGE ON SCHEMA pulso_content TO authenticated;
GRANT USAGE ON SCHEMA pulso_content TO anon;
-- ========================================
-- VERIFICAR SE FUNCIONOU
-- ========================================
-- Ver permissões na tabela ideias
SELECT grantee,
    privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'pulso_content'
    AND table_name = 'ideias'
ORDER BY grantee,
    privilege_type;
-- Ver permissões no schema
SELECT nspname,
    nspowner,
    has_schema_privilege('service_role', nspname, 'USAGE') as service_role_usage,
    has_schema_privilege('authenticated', nspname, 'USAGE') as authenticated_usage
FROM pg_namespace
WHERE nspname = 'pulso_content';