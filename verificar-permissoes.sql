-- Verificar se as permissões foram aplicadas corretamente
-- Execute este script no Supabase SQL Editor
-- 1. Verificar permissões no pg_catalog
SELECT 'pg_namespace' as tabela,
    has_table_privilege('anon', 'pg_catalog.pg_namespace', 'SELECT') as anon_select,
    has_table_privilege(
        'authenticated',
        'pg_catalog.pg_namespace',
        'SELECT'
    ) as authenticated_select;
| tabela | anon_select | authenticated_select | | ------------ | ----------- | -------------------- |
| pg_namespace | true | true |
SELECT 'pg_class' as tabela,
    has_table_privilege('anon', 'pg_catalog.pg_class', 'SELECT') as anon_select,
    has_table_privilege('authenticated', 'pg_catalog.pg_class', 'SELECT') as authenticated_select;
| tabela | anon_select | authenticated_select | | -------- | ----------- | -------------------- |
| pg_class | true | true | -- 2. Verificar USAGE nos schemas
SELECT nspname,
    has_schema_privilege('anon', nspname, 'USAGE') as anon_usage,
    has_schema_privilege('authenticated', nspname, 'USAGE') as authenticated_usage
FROM pg_namespace
WHERE nspname IN (
        'public',
        'pulso_core',
        'pulso_content',
        'pg_catalog'
    );
| nspname | anon_usage | authenticated_usage | | ------------- | ---------- | ------------------- |
| pg_catalog | true | true | | pulso_content | true | true | | pulso_core | true | true | | public | true | true | -- 3. Verificar permissões nas tabelas base
SELECT 'pulso_core.canais' as tabela,
    has_table_privilege('anon', 'pulso_core.canais', 'SELECT') as anon_select;
| tabela | anon_select | | ----------------- | ----------- |
| pulso_core.canais | true |
SELECT 'pulso_content.ideias' as tabela,
    has_table_privilege('anon', 'pulso_content.ideias', 'SELECT') as anon_select;
| tabela | anon_select | | -------------------- | ----------- |
| pulso_content.ideias | true | -- 4. Verificar permissões nas views
SELECT 'public.canais' as view,
    has_table_privilege('anon', 'public.canais', 'SELECT') as anon_select;
| view | anon_select | | ------------- | ----------- |
| public.canais | true |
SELECT 'public.vw_pulso_calendario_publicacao_v2' as view,
    has_table_privilege(
        'anon',
        'public.vw_pulso_calendario_publicacao_v2',
        'SELECT'
    ) as anon_select;
| view | anon_select | | ---------------------------------------- | ----------- |
| public.vw_pulso_calendario_publicacao_v2 | true | -- 5. Testar acesso direto como anon
SET ROLE anon;
SELECT 'Teste como anon: pg_namespace' as teste,
    COUNT(*)
FROM pg_namespace;
| teste | count | | ----------------------------- | ----- |
| Teste como anon: pg_namespace | 136 |
SELECT 'Teste como anon: pulso_core.canais' as teste,
    COUNT(*)
FROM pulso_core.canais;
| teste | count | | ---------------------------------- | ----- |
| Teste como anon: pulso_core.canais | 10 |
SELECT 'Teste como anon: public.canais' as teste,
    COUNT(*)
FROM public.canais;
| teste | count | | ------------------------------ | ----- |
| Teste como anon: public.canais | 10 | RESET ROLE;