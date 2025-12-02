-- 🔍 QUERIES DE INVESTIGAÇÃO DO SUPABASE
-- Execute estas queries no Supabase SQL Editor
-- ========================================
-- 1. VERIFICAR SE VIEW PUBLIC.IDEIAS EXISTE
-- ========================================
SELECT schemaname,
    viewname,
    definition
FROM pg_views
WHERE schemaname = 'public'
    AND viewname = 'ideias';
-- Se retornar vazio, a view NÃO existe
-- Se retornar resultado, copie a "definition" para ver como está criada
-- ========================================
-- 2. VERIFICAR PERMISSÕES DA VIEW
-- ========================================
SELECT grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
    AND table_name = 'ideias'
ORDER BY grantee,
    privilege_type;
-- Procure por:
-- - authenticated: SELECT, UPDATE?
-- - service_role: SELECT, UPDATE, INSERT, DELETE?
-- ========================================
-- 3. VERIFICAR ESTRUTURA DA TABELA REAL
-- ========================================
SELECT table_schema,
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'pulso_content'
    AND table_name = 'ideias'
ORDER BY ordinal_position;
-- ========================================
-- 4. VERIFICAR RLS (Row Level Security)
-- ========================================
SELECT schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename = 'ideias';
-- ========================================
-- 5. TESTAR UPDATE MANUAL
-- ========================================
-- IMPORTANTE: Substitua o UUID pela ideia real
UPDATE public.ideias
SET status = 'APROVADA'
WHERE id = '2b226a1e-0f4f-4208-bfaf-0e41e95db6d6'
RETURNING *;
-- Se der erro 42501, confirma problema de permissão
-- Se funcionar, o problema está na API (service_role_key incorreta?)
-- ========================================
-- 6. SOLUÇÃO: HABILITAR UPDATE NA VIEW
-- ========================================
-- Execute SE a view existir mas não tiver UPDATE
GRANT UPDATE ON public.ideias TO authenticated;
GRANT UPDATE ON public.ideias TO service_role;
GRANT UPDATE ON public.ideias TO anon;
-- Verificar se funcionou
SELECT grantee,
    privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
    AND table_name = 'ideias'
    AND privilege_type = 'UPDATE';
-- ========================================
-- 7. ALTERNATIVA: CRIAR VIEW SE NÃO EXISTIR
-- ========================================
-- Execute SE a view NÃO existir
CREATE OR REPLACE VIEW public.ideias AS
SELECT *
FROM pulso_content.ideias;
-- Dar permissões
GRANT SELECT,
    INSERT,
    UPDATE,
    DELETE ON public.ideias TO authenticated;
GRANT SELECT,
    INSERT,
    UPDATE,
    DELETE ON public.ideias TO service_role;
GRANT SELECT ON public.ideias TO anon;
-- ========================================
-- 8. VERIFICAR SERVICE_ROLE_KEY
-- ========================================
-- Verificar qual role está sendo usado
SELECT current_user,
    current_role;
-- Se retornar "postgres" ou "service_role", está correto
-- Se retornar "authenticated" ou "anon", a key está errada
-- ========================================
-- 9. VERIFICAR TODAS AS VIEWS DO PUBLIC
-- ========================================
SELECT schemaname,
    viewname,
    viewowner
FROM pg_views
WHERE schemaname = 'public'
ORDER BY viewname;
-- ========================================
-- 10. RESULTADO ESPERADO
-- ========================================
-- Após executar as queries acima, você deve saber:
-- ✅ A view public.ideias existe?
-- ✅ Ela tem permissão de UPDATE?
-- ✅ Existe alguma policy RLS bloqueando?
-- ✅ O UPDATE manual funciona?
-- ✅ Qual a definição exata da view?