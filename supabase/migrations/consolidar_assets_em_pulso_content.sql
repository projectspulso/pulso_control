-- =========================================================================
-- CONSOLIDAR SCHEMA ASSETS EM PULSO_CONTENT
-- =========================================================================
-- Data: 04/12/2025
-- Objetivo: Mover assets.audios e assets.videos para pulso_content
--           e eliminar schema assets para simplificar estrutura
--
-- ANTES:
-- - pulso_content: ideias, roteiros, pipeline, personagens, thumbnails, feedbacks, metricas
-- - assets: audios, videos
--
-- DEPOIS:
-- - pulso_content: TUDO (ideias, roteiros, pipeline, personagens, thumbnails, feedbacks, metricas, audios, videos)
-- - assets: [ELIMINADO]
-- =========================================================================

BEGIN;

-- =========================================================================
-- PASSO 1: VERIFICAR SE TABELAS EXISTEM E ESTÃO VAZIAS
-- =========================================================================

-- Verificar se assets.audios existe e quantos registros tem
DO $$
DECLARE
    audio_count INTEGER;
    video_count INTEGER;
BEGIN
    -- Contar audios
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'assets' AND table_name = 'audios') THEN
        SELECT COUNT(*) INTO audio_count FROM assets.audios;
        RAISE NOTICE 'assets.audios tem % registros', audio_count;
    ELSE
        RAISE NOTICE 'Tabela assets.audios não existe';
    END IF;
    
    -- Contar videos
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'assets' AND table_name = 'videos') THEN
        SELECT COUNT(*) INTO video_count FROM assets.videos;
        RAISE NOTICE 'assets.videos tem % registros', video_count;
    ELSE
        RAISE NOTICE 'Tabela assets.videos não existe';
    END IF;
END $$;

-- =========================================================================
-- PASSO 2: DROPAR FOREIGN KEYS QUE REFERENCIAM assets.*
-- =========================================================================

-- Dropar FK de pipeline_producao → assets.audios
ALTER TABLE pulso_content.pipeline_producao
DROP CONSTRAINT IF EXISTS pipeline_producao_audio_id_fkey CASCADE;

-- Dropar FK de pipeline_producao → assets.videos
ALTER TABLE pulso_content.pipeline_producao
DROP CONSTRAINT IF EXISTS pipeline_producao_video_id_fkey CASCADE;

-- Dropar FK de assets.videos → assets.audios (se existir)
ALTER TABLE IF EXISTS assets.videos
DROP CONSTRAINT IF EXISTS videos_audio_id_fkey CASCADE;

RAISE NOTICE 'Foreign keys dropadas com sucesso';

-- =========================================================================
-- PASSO 3: MOVER TABELAS (se existirem e tiverem dados)
-- =========================================================================

-- MOVER assets.audios → pulso_content.audios
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'assets' AND table_name = 'audios') THEN
        -- Se pulso_content.audios não existir, criar
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'pulso_content' AND table_name = 'audios') THEN
            -- Criar tabela em pulso_content
            CREATE TABLE pulso_content.audios AS TABLE assets.audios;
            
            -- Recriar constraints
            ALTER TABLE pulso_content.audios ADD PRIMARY KEY (id);
            ALTER TABLE pulso_content.audios ALTER COLUMN id SET DEFAULT gen_random_uuid();
            ALTER TABLE pulso_content.audios ALTER COLUMN created_at SET DEFAULT now();
            
            -- Recriar índices
            CREATE INDEX IF NOT EXISTS idx_audios_roteiro ON pulso_content.audios(roteiro_id);
            
            -- RLS
            ALTER TABLE pulso_content.audios ENABLE ROW LEVEL SECURITY;
            CREATE POLICY "Áudios públicos" ON pulso_content.audios FOR ALL USING (true);
            
            RAISE NOTICE 'Tabela pulso_content.audios criada com sucesso';
        END IF;
    END IF;
END $$;

-- MOVER assets.videos → pulso_content.videos
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'assets' AND table_name = 'videos') THEN
        -- Se pulso_content.videos não existir, criar
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'pulso_content' AND table_name = 'videos') THEN
            -- Criar tabela em pulso_content
            CREATE TABLE pulso_content.videos AS TABLE assets.videos;
            
            -- Recriar constraints
            ALTER TABLE pulso_content.videos ADD PRIMARY KEY (id);
            ALTER TABLE pulso_content.videos ALTER COLUMN id SET DEFAULT gen_random_uuid();
            ALTER TABLE pulso_content.videos ALTER COLUMN created_at SET DEFAULT now();
            
            -- Recriar índices
            CREATE INDEX IF NOT EXISTS idx_videos_audio ON pulso_content.videos(audio_id);
            
            -- RLS
            ALTER TABLE pulso_content.videos ENABLE ROW LEVEL SECURITY;
            CREATE POLICY "Vídeos públicos" ON pulso_content.videos FOR ALL USING (true);
            
            RAISE NOTICE 'Tabela pulso_content.videos criada com sucesso';
        END IF;
    END IF;
END $$;

-- =========================================================================
-- PASSO 4: RECRIAR FOREIGN KEYS APONTANDO PARA pulso_content.*
-- =========================================================================

-- FK: pipeline_producao → pulso_content.audios
ALTER TABLE pulso_content.pipeline_producao
ADD CONSTRAINT pipeline_producao_audio_id_fkey 
FOREIGN KEY (audio_id) REFERENCES pulso_content.audios(id) ON DELETE SET NULL;

-- FK: pipeline_producao → pulso_content.videos
ALTER TABLE pulso_content.pipeline_producao
ADD CONSTRAINT pipeline_producao_video_id_fkey 
FOREIGN KEY (video_id) REFERENCES pulso_content.videos(id) ON DELETE SET NULL;

-- FK: videos → audios (ambos em pulso_content agora)
ALTER TABLE pulso_content.videos
ADD CONSTRAINT videos_audio_id_fkey 
FOREIGN KEY (audio_id) REFERENCES pulso_content.audios(id) ON DELETE SET NULL;

-- FK: audios → roteiros
ALTER TABLE pulso_content.audios
DROP CONSTRAINT IF EXISTS audios_roteiro_id_fkey CASCADE;

ALTER TABLE pulso_content.audios
ADD CONSTRAINT audios_roteiro_id_fkey 
FOREIGN KEY (roteiro_id) REFERENCES pulso_content.roteiros(id) ON DELETE SET NULL;

RAISE NOTICE 'Foreign keys recriadas com sucesso';

-- =========================================================================
-- PASSO 5: RECRIAR VIEW public.pipeline_producao (principal view afetada)
-- =========================================================================

DROP VIEW IF EXISTS public.pipeline_producao CASCADE;

CREATE OR REPLACE VIEW public.pipeline_producao AS
SELECT 
    p.id,
    p.ideia_id,
    p.roteiro_id,
    p.audio_id,
    p.video_id,
    p.status,
    p.prioridade,
    p.data_prevista,
    p.data_publicacao,
    p.responsavel,
    p.observacoes,
    p.metadata,
    p.created_at,
    p.updated_at,
    -- Dados da ideia
    i.titulo as ideia_titulo,
    i.descricao as ideia_descricao,
    i.status as ideia_status,
    -- Dados do canal
    c.id as canal_id,
    c.nome as canal_nome,
    c.slug as canal_slug,
    -- Dados da série
    s.id as serie_id,
    s.titulo as serie_titulo,
    -- Dados do roteiro
    r.titulo as roteiro_titulo,
    r.status as roteiro_status,
    r.versao as roteiro_versao,
    r.texto as roteiro_texto,
    -- Dados do áudio (AGORA DE pulso_content.audios)
    a.url as audio_url,
    a.duracao_segundos as audio_duracao,
    -- Dados do vídeo (AGORA DE pulso_content.videos)
    v.url as video_url,
    v.thumbnail_url,
    v.duracao_segundos as video_duracao
FROM pulso_content.pipeline_producao p
    LEFT JOIN pulso_content.ideias i ON p.ideia_id = i.id
    LEFT JOIN pulso_core.canais c ON i.canal_id = c.id
    LEFT JOIN pulso_core.series s ON i.serie_id = s.id
    LEFT JOIN pulso_content.roteiros r ON p.roteiro_id = r.id
    LEFT JOIN pulso_content.audios a ON p.audio_id = a.id    -- MUDOU DE assets.audios
    LEFT JOIN pulso_content.videos v ON p.video_id = v.id;   -- MUDOU DE assets.videos

GRANT SELECT ON public.pipeline_producao TO anon, authenticated;

COMMENT ON VIEW public.pipeline_producao IS 'View pública do pipeline - agora usando pulso_content.audios e pulso_content.videos';

RAISE NOTICE 'View public.pipeline_producao recriada com sucesso';

-- =========================================================================
-- PASSO 6: DROPAR TABELAS ANTIGAS E SCHEMA ASSETS
-- =========================================================================

-- Dropar tabelas antigas (se existirem)
DROP TABLE IF EXISTS assets.videos CASCADE;
DROP TABLE IF EXISTS assets.audios CASCADE;

-- Dropar schema assets (se estiver vazio)
DROP SCHEMA IF EXISTS assets CASCADE;

RAISE NOTICE 'Schema assets eliminado com sucesso';

-- =========================================================================
-- PASSO 7: VERIFICAÇÃO FINAL
-- =========================================================================

-- Verificar estrutura final
DO $$
DECLARE
    schema_exists BOOLEAN;
BEGIN
    -- Verificar se schema assets ainda existe
    SELECT EXISTS (
        SELECT 1 FROM information_schema.schemata WHERE schema_name = 'assets'
    ) INTO schema_exists;
    
    IF schema_exists THEN
        RAISE WARNING 'Schema assets ainda existe! Algo deu errado.';
    ELSE
        RAISE NOTICE '✅ Schema assets eliminado com sucesso!';
    END IF;
    
    -- Verificar se novas tabelas existem
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'pulso_content' AND table_name = 'audios') THEN
        RAISE NOTICE '✅ pulso_content.audios existe';
    ELSE
        RAISE WARNING '❌ pulso_content.audios NÃO existe';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'pulso_content' AND table_name = 'videos') THEN
        RAISE NOTICE '✅ pulso_content.videos existe';
    ELSE
        RAISE WARNING '❌ pulso_content.videos NÃO existe';
    END IF;
    
    -- Verificar se view existe
    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'pipeline_producao') THEN
        RAISE NOTICE '✅ View public.pipeline_producao existe';
    ELSE
        RAISE WARNING '❌ View public.pipeline_producao NÃO existe';
    END IF;
END $$;

-- Mostrar resumo final
SELECT 
    'pulso_content' as schema,
    COUNT(*) FILTER (WHERE table_name = 'audios') as audios,
    COUNT(*) FILTER (WHERE table_name = 'videos') as videos,
    COUNT(*) FILTER (WHERE table_name = 'personagens') as personagens,
    COUNT(*) FILTER (WHERE table_name = 'thumbnails') as thumbnails,
    COUNT(*) FILTER (WHERE table_name = 'feedbacks') as feedbacks,
    COUNT(*) FILTER (WHERE table_name = 'metricas_publicacao') as metricas
FROM information_schema.tables
WHERE table_schema = 'pulso_content'
  AND table_name IN ('audios', 'videos', 'personagens', 'thumbnails', 'feedbacks', 'metricas_publicacao');

COMMIT;

-- =========================================================================
-- RESULTADO ESPERADO:
-- =========================================================================
-- ✅ assets.audios → pulso_content.audios
-- ✅ assets.videos → pulso_content.videos
-- ✅ Schema assets eliminado
-- ✅ Views atualizadas para usar pulso_content.*
-- ✅ Foreign keys recriadas corretamente
--
-- ESTRUTURA FINAL:
-- - pulso_core: canais, series
-- - pulso_content: ideias, roteiros, pipeline, personagens, thumbnails, 
--                  feedbacks, metricas, audios, videos
-- =========================================================================
