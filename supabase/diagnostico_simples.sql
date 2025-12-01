-- =====================================================
-- DIAGNÓSTICO SIMPLES - TESTAR VIEWS DIRETAMENTE
-- Execute no Supabase SQL Editor
-- =====================================================
-- TESTE 1: Ver se as tabelas BASE têm dados
SELECT 'TABELAS BASE' as categoria;
SELECT 'pulso_core.canais' as tabela,
    COUNT(*) as total
FROM pulso_core.canais;
SELECT 'pulso_core.series' as tabela,
    COUNT(*) as total
FROM pulso_core.series;
SELECT 'pulso_content.ideias' as tabela,
    COUNT(*) as total
FROM pulso_content.ideias;
SELECT 'pulso_content.roteiros' as tabela,
    COUNT(*) as total
FROM pulso_content.roteiros;
SELECT 'pulso_content.pipeline_producao' as tabela,
    COUNT(*) as total
FROM pulso_content.pipeline_producao;
-- TESTE 2: Ver se as VIEWS em public conseguem ler os dados
SELECT 'VIEWS PUBLIC' as categoria;
SELECT 'public.canais' as view_name,
    COUNT(*) as total
FROM public.canais;
SELECT 'public.series' as view_name,
    COUNT(*) as total
FROM public.series;
SELECT 'public.ideias' as view_name,
    COUNT(*) as total
FROM public.ideias;
SELECT 'public.roteiros' as view_name,
    COUNT(*) as total
FROM public.roteiros;
SELECT 'public.pipeline_producao' as view_name,
    COUNT(*) as total
FROM public.pipeline_producao;
-- TESTE 3: Tentar SELECT como usuário ANON (o que o frontend usa)
SELECT 'TESTE COMO ANON' as categoria;
SET ROLE anon;
SELECT 'anon - pulso_core.canais' as teste,
    COUNT(*) as total
FROM pulso_core.canais;
SELECT 'anon - pulso_content.ideias' as teste,
    COUNT(*) as total
FROM pulso_content.ideias;
SELECT 'anon - public.canais' as teste,
    COUNT(*) as total
FROM public.canais;
SELECT 'anon - public.ideias' as teste,
    COUNT(*) as total
FROM public.ideias;
RESET ROLE;
-- TESTE 4: Verificar RLS nas tabelas base
SELECT 'VERIFICAR RLS' as categoria;
SELECT schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname IN ('pulso_core', 'pulso_content')
ORDER BY schemaname,
    tablename;
-- TESTE 5: Ver sample de dados
SELECT 'SAMPLE DE DADOS' as categoria;
SELECT id,
    nome
FROM pulso_core.canais
LIMIT 3;
SELECT id,
    titulo
FROM pulso_content.ideias
LIMIT 3;