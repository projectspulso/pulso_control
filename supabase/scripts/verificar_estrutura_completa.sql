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
| status_schema | | ------------------------------------- |
| ✅ Schema assets eliminado com sucesso | -- 2. Verificar tabelas em pulso_content
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
| table_name | total_colunas | | --------------------------------- | ------------- |
| audios | 19 | | canais_personagens | 6 | | conteudo_variantes | 14 | | conteudos | 14 | | feedbacks | 27 | | ideias | 17 | | logs_workflows | 7 | | metricas_publicacao | 32 | | personagens | 18 | | pipeline_producao | 18 | | pipeline_producao_backup_20251126 | 16 | | plano_publicacao | 7 | | roteiros | 17 | | roteiros_renders | 9 | | thumbnails | 26 | | videos | 19 | -- 3. Verificar colunas de audios
SELECT column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'pulso_content'
    AND table_name = 'audios'
ORDER BY ordinal_position;
| column_name | data_type | is_nullable | column_default | | ---------------- | ------------------------ | ----------- | ----------------- |
| id | uuid | NO | gen_random_uuid() | | ideia_id | uuid | NO | null | | roteiro_id | uuid | YES | null | | storage_path | text | NO | null | | public_url | text | NO | null | | duracao_segundos | integer | YES | null | | linguagem | text | YES | 'pt-BR'::text | | formato | text | YES | 'audio/mp3'::text | | metadata | jsonb | YES | '{}'::jsonb | | created_at | timestamp with time zone | YES | now() | | updated_at | timestamp with time zone | YES | now() | | canal_id | uuid | YES | null | | tipo | text | YES | null | | url | text | NO | null | | status | text | YES | null | | personagem_id | uuid | YES | null | | qualidade_voz_ia | numeric | YES | null | | tamanho_bytes | bigint | YES | null | | voz_id | text | YES | null | -- 4. Verificar colunas de videos
SELECT column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'pulso_content'
    AND table_name = 'videos'
ORDER BY ordinal_position;
| column_name | data_type | is_nullable | column_default | | ---------------- | ------------------------ | ----------- | ----------------- |
| id | uuid | NO | gen_random_uuid() | | ideia_id | uuid | NO | null | | roteiro_id | uuid | YES | null | | storage_path | text | NO | null | | public_url | text | NO | null | | duracao_segundos | integer | YES | null | | resolucao | text | YES | null | | formato | text | YES | 'video/mp4'::text | | plataforma_foco | text | YES | null | | metadata | jsonb | YES | '{}'::jsonb | | created_at | timestamp with time zone | YES | now() | | updated_at | timestamp with time zone | YES | now() | | canal_id | uuid | YES | null | | tipo | text | YES | null | | url | text | NO | null | | status | text | YES | null | | audio_id | uuid | YES | null | | tamanho_bytes | bigint | YES | null | | thumbnail_url | text | YES | null | -- 5. Verificar se a view existe e funciona
SELECT CASE
        WHEN COUNT(*) > 0 THEN '✅ View public.pipeline_producao existe'
        ELSE '❌ View não encontrada'
    END as status_view
FROM information_schema.views
WHERE table_schema = 'public'
    AND table_name = 'pipeline_producao';
| status_view | | -------------------------------------- |
| ✅ View public.pipeline_producao existe | -- 6. Testar SELECT na view (deve retornar sem erro, mesmo vazia)
SELECT id,
    status,
    audio_url,
    audio_duracao,
    audio_voz_id,
    video_url,
    video_thumbnail_url
FROM public.pipeline_producao
LIMIT 1;
| id | status | audio_url | audio_duracao | audio_voz_id | video_url | video_thumbnail_url | | ------------------------------------ | ------------------ | --------- | ------------- | ------------ | --------- | ------------------- |
| 2e47c6e9-dacd-41c9-a913-dc5f60d4db83 | AGUARDANDO_ROTEIRO | null | null | null | null | null | -- 7. Verificar personagem Pulso
SELECT nome,
    slug,
    tipo,
    ativo,
    jsonb_pretty(metadata) as metadata_formatada
FROM pulso_content.personagens
WHERE slug = 'pulso';
| nome | slug | tipo | ativo | metadata_formatada | | ----- | ----- | ------ | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pulso | pulso | AVATAR | true | { "voz": { "modelo": "tts-1-hd",
"provedor": "openai",
"voz_base_id": "alloy" },
"branding": { "tagline": "Seu guia adaptável pelo conhecimento",
"filosofia": "Um personagem, infinitas formas. O Pulso se transforma para se conectar melhor com cada tema.",
"identidade": "Mantém a essência mas adapta forma e tom ao contexto" },
"conceito": "Personagem metamórfico que se adapta ao canal",
"variacoes": { "default": { "voz": { "pitch": 0.0,
"speed": 1.0,
"estilo": "equilibrado",
"stability": 0.7 },
"cores": [
                "#6366F1",
                "#8B5CF6",
                "#EC4899"
            ],
"visual": "pulso_default.png",
"descricao": "Forma padrão do Pulso para canais sem variação específica.",
"expressao": "neutro, versátil" },
"psicologia": { "voz": { "pitch": -0.1,
"speed": 0.9,
"estilo": "reflexivo",
"stability": 0.8 },
"cores": [
                "#8B7355",
                "#D4A574",
                "#F5E6D3"
            ],
"visual": "pulso_psicologia.png",
"descricao": "Pulso assume uma forma calma e acolhedora, com cores terrosas. Voz pausada e reflexiva para conteúdos de psicologia.",
"expressao": "calmo, sábio, acolhedor" },
"tecnologia": { "voz": { "pitch": 0.0,
"speed": 1.0,
"estilo": "profissional",
"stability": 0.7 },
"cores": [
                "#667EEA",
                "#764BA2",
                "#00D4FF"
            ],
"visual": "pulso_tecnologia.png",
"descricao": "Pulso assume forma futurista com cores tech (azul/roxo). Voz moderna e precisa para conteúdos de tecnologia.",
"expressao": "confiante, moderno, inovador" },
"fatos_inusitados": { "voz": { "pitch": 0.1,
"speed": 1.1,
"estilo": "empolgado",
"stability": 0.5 },
"cores": [
                "#FF6B35",
                "#F7931E",
                "#FDC830"
            ],
"visual": "pulso_fatos_inusitados.png",
"descricao": "Pulso fica empolgado e curioso, com cores vibrantes. Voz rápida e animada para surpreender com fatos inusitados.",
"expressao": "curioso, empolgado, surpreso" } } } | -- =========================================================================
-- RESULTADO ESPERADO:
-- =========================================================================
-- ✅ Schema assets eliminado
-- ✅ pulso_content.audios com 10+ colunas
-- ✅ pulso_content.videos com 12+ colunas  
-- ✅ View public.pipeline_producao com campos audio_url, video_url
-- ✅ Pulso com 4 variações no metadata
-- =========================================================================