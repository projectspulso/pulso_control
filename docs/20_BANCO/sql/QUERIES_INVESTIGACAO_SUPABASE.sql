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
| schemaname | viewname | definition | | ---------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| public | ideias |
SELECT id,
    canal_id,
    serie_id,
    titulo,
    descricao,
    origem,
    prioridade,
    status,
    tags,
    linguagem,
    criado_por,
    metadata,
    created_at,
    updated_at
FROM pulso_content.ideias;
| -- Se retornar vazio, a view NÃO existe
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
| grantee | privilege_type | is_grantable | | ------------- | -------------- | ------------ |
| anon | DELETE | NO | | anon |
INSERT | NO | | anon | REFERENCES | NO | | anon |
SELECT | NO | | anon | TRIGGER | NO | | anon | TRUNCATE | NO | | anon |
UPDATE | NO | | authenticated | DELETE | NO | | authenticated |
INSERT | NO | | authenticated | REFERENCES | NO | | authenticated |
SELECT | NO | | authenticated | TRIGGER | NO | | authenticated | TRUNCATE | NO | | authenticated |
UPDATE | NO | | postgres | DELETE | YES | | postgres |
INSERT | YES | | postgres | REFERENCES | YES | | postgres |
SELECT | YES | | postgres | TRIGGER | YES | | postgres | TRUNCATE | YES | | postgres |
UPDATE | YES | | service_role | DELETE | NO | | service_role |
INSERT | NO | | service_role | REFERENCES | NO | | service_role |
SELECT | NO | | service_role | TRIGGER | NO | | service_role | TRUNCATE | NO | | service_role |
UPDATE | NO | -- Procure por:
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
| table_schema | table_name | column_name | data_type | is_nullable | | ------------- | ---------- | ----------- | --------------------------- | ----------- |
| pulso_content | ideias | id | uuid | NO | | pulso_content | ideias | canal_id | uuid | YES | | pulso_content | ideias | serie_id | uuid | YES | | pulso_content | ideias | titulo | character varying | NO | | pulso_content | ideias | descricao | text | YES | | pulso_content | ideias | origem | character varying | YES | | pulso_content | ideias | prioridade | integer | YES | | pulso_content | ideias | status | USER - DEFINED | NO | | pulso_content | ideias | tags | ARRAY | YES | | pulso_content | ideias | linguagem | character varying | YES | | pulso_content | ideias | criado_por | uuid | YES | | pulso_content | ideias | metadata | jsonb | YES | | pulso_content | ideias | created_at | timestamp without time zone | YES | | pulso_content | ideias | updated_at | timestamp without time zone | YES | -- ========================================
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
Success.No rows returned -- ========================================
-- 5. TESTAR UPDATE MANUAL
-- ========================================
-- IMPORTANTE: Substitua o UUID pela ideia real
UPDATE public.ideias
SET status = 'APROVADA'
WHERE id = '2b226a1e-0f4f-4208-bfaf-0e41e95db6d6'
RETURNING *;
| id | canal_id | serie_id | titulo | descricao | origem | prioridade | status | tags | linguagem | criado_por | metadata | created_at | updated_at | | ------------------------------------ | ------------------------------------ | ------------------------------------ | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------ | ---------- | -------- | -------------------------------------- | --------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- | -------------------------- |
| 2b226a1e-0f4f-4208-bfaf-0e41e95db6d6 | 6212146f-a152-4909-852b-c4043451f4df | a8ada321-a31c-4490-a96c-4b9b5aad996d | 'Seja a mudança': Gandhi e o impacto pessoal | Entenda como a famosa citação de Gandhi pode ser aplicada no seu dia a dia para promover mudanças significativas em sua vida.| null | 3 | APROVADA | ["Gandhi","mudança pessoal","impacto"] | pt - BR | null | { "gerado_em" :"2025-12-02 06:00:23.674565+00",
"modelo_ia" :"gpt-4o",
"gerado_por_ia" :true,
"justificativa" :"Citações de figuras históricas têm grande apelo e são facilmente compartilháveis.",
"gancho_sugerido" :"'Seja a mudança que você quer ver no mundo' - já ouviu isso?",
"potencial_viral" :7,
"duracao_estimada" :"50s",
"fontes_referencia" :["fonte1","fonte2"] } | 2025 -12 -02 06 :00 :23.674565 | 2025 -12 -02 06 :00 :23.674565 | -- Se der erro 42501, confirma problema de permissão
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
| grantee | privilege_type | | ------------- | -------------- |
| service_role |
UPDATE | | authenticated |
UPDATE | | anon |
UPDATE | | postgres |
UPDATE | -- ========================================
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
| current_user | current_role | | ------------ | ------------ |
| postgres | postgres | -- Se retornar "postgres" ou "service_role", está correto
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
| schemaname | viewname | viewowner | | ---------- | ---------------------------------- | --------- |
| public | assets | postgres | | public | canais | postgres | | public | canais_plataformas | postgres | | public | configuracoes | postgres | | public | conteudo_variantes | postgres | | public | conteudo_variantes_assets | postgres | | public | conteudos | postgres | | public | conteudos_producao | postgres | | public | eventos | postgres | | public | ideias | postgres | | public | logs_workflows | postgres | | public | metricas_diarias | postgres | | public | n8n_roteiro_completo | postgres | | public | pipeline_producao | postgres | | public | plataformas | postgres | | public | plataformas_conectadas | postgres | | public | posts | postgres | | public | posts_logs | postgres | | public | publicacoes | postgres | | public | roteiros | postgres | | public | series | postgres | | public | tags | postgres | | public | usuarios_internos | postgres | | public | vw_agenda_publicacao_detalhada | postgres | | public | vw_pulso_calendario_publicacao_v2 | postgres | | public | vw_pulso_canais | postgres | | public | vw_pulso_conteudo_variantes_assets | postgres | | public | vw_pulso_pipeline_base | postgres | | public | vw_pulso_pipeline_com_assets | postgres | | public | vw_pulso_pipeline_com_assets_v2 | postgres | | public | vw_pulso_posts_metricas_diarias | postgres | | public | vw_pulso_workflow_execucoes | postgres | | public | vw_pulso_workflows | postgres | | public | vw_roteiros | postgres | | public | vw_roteiros_pendentes_audio | postgres | | public | vw_roteiros_pendentes_video | postgres | | public | vw_roteiros_prontos_para_render | postgres | | public | workflow_execucoes | postgres | | public | workflows | postgres | -- ========================================
-- 10. RESULTADO ESPERADO
-- ========================================
-- Após executar as queries acima, você deve saber:
-- ✅ A view public.ideias existe?
-- ✅ Ela tem permissão de UPDATE?
-- ✅ Existe alguma policy RLS bloqueando?
-- ✅ O UPDATE manual funciona?
-- ✅ Qual a definição exata da view?