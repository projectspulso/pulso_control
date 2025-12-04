-- =========================================================================
-- VERIFICAÇÃO DE ESTRUTURA COMPLETA
-- =========================================================================
-- Execute no Supabase SQL Editor para confirmar que tudo está correto
-- =========================================================================
-- 1. Verificar se schema assets foi eliminado
SELECT CASE
        WHEN COUNT(*) = 0 THEN '✅ Schema assets eliminado com sucesso'
        ELSE '❌ Schema assets ainda existe'
    END as status_schema
FROM information_schema.schemata
WHERE schema_name = 'assets';
-- 2. Verificar tabelas em pulso_content
SELECT table_name,
    (
        SELECT COUNT(*)
        FROM information_schema.columns
        WHERE table_schema = 'pulso_content'
            AND c.table_name = table_name
    ) as total_colunas
FROM information_schema.tables c
WHERE table_schema = 'pulso_content'
    AND table_type = 'BASE TABLE'
ORDER BY table_name;
-- 3. Verificar colunas de audios
SELECT column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'pulso_content'
    AND table_name = 'audios'
ORDER BY ordinal_position;
-- 4. Verificar colunas de videos
SELECT column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'pulso_content'
    AND table_name = 'videos'
ORDER BY ordinal_position;
-- 5. Verificar se a view existe e funciona
SELECT CASE
        WHEN COUNT(*) > 0 THEN '✅ View public.pipeline_producao existe'
        ELSE '❌ View não encontrada'
    END as status_view
FROM information_schema.views
WHERE table_schema = 'public'
    AND table_name = 'pipeline_producao';
-- 6. Testar SELECT na view (deve retornar sem erro, mesmo vazia)
SELECT id,
    status,
    audio_url,
    audio_duracao,
    audio_voz_id,
    video_url,
    video_thumbnail_url
FROM public.pipeline_producao
LIMIT 1;
-- 7. Verificar personagem Pulso
SELECT nome,
    slug,
    tipo,
    ativo,
    jsonb_pretty(metadata) as metadata_formatada
FROM pulso_content.personagens
WHERE slug = 'pulso';
-- =========================================================================
-- RESULTADO ESPERADO:
-- =========================================================================
-- ✅ Schema assets eliminado
-- ✅ pulso_content.audios com 10+ colunas
-- ✅ pulso_content.videos com 12+ colunas  
-- ✅ View public.pipeline_producao com campos audio_url, video_url
-- ✅ Pulso com 4 variações no metadata
-- =========================================================================