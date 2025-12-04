-- =========================================================================
-- ADICIONAR COLUNAS FALTANTES EM AUDIOS E VIDEOS
-- =========================================================================
-- Data: 04/12/2025
-- Objetivo: Completar estrutura de pulso_content.audios e pulso_content.videos
-- =========================================================================
BEGIN;
-- =========================================================================
-- AUDIOS: Adicionar colunas faltantes
-- =========================================================================
ALTER TABLE pulso_content.audios
ADD COLUMN IF NOT EXISTS url TEXT,
    ADD COLUMN IF NOT EXISTS duracao_segundos INTEGER,
    ADD COLUMN IF NOT EXISTS formato TEXT,
    ADD COLUMN IF NOT EXISTS tamanho_bytes BIGINT,
    ADD COLUMN IF NOT EXISTS voz_id TEXT,
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
-- Tornar url obrigatório apenas se não for null
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'pulso_content'
        AND table_name = 'audios'
        AND column_name = 'url'
        AND is_nullable = 'YES'
) THEN -- Preencher NULLs existentes antes de tornar NOT NULL
UPDATE pulso_content.audios
SET url = ''
WHERE url IS NULL;
ALTER TABLE pulso_content.audios
ALTER COLUMN url
SET NOT NULL;
END IF;
END $$;
RAISE NOTICE '✅ Colunas de audios adicionadas';
-- =========================================================================
-- VIDEOS: Adicionar colunas faltantes  
-- =========================================================================
ALTER TABLE pulso_content.videos
ADD COLUMN IF NOT EXISTS audio_id UUID REFERENCES pulso_content.audios(id) ON DELETE
SET NULL,
    ADD COLUMN IF NOT EXISTS url TEXT,
    ADD COLUMN IF NOT EXISTS duracao_segundos INTEGER,
    ADD COLUMN IF NOT EXISTS formato TEXT,
    ADD COLUMN IF NOT EXISTS resolucao TEXT,
    ADD COLUMN IF NOT EXISTS tamanho_bytes BIGINT,
    ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
-- Tornar url obrigatório apenas se não for null
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'pulso_content'
        AND table_name = 'videos'
        AND column_name = 'url'
        AND is_nullable = 'YES'
) THEN -- Preencher NULLs existentes antes de tornar NOT NULL
UPDATE pulso_content.videos
SET url = ''
WHERE url IS NULL;
ALTER TABLE pulso_content.videos
ALTER COLUMN url
SET NOT NULL;
END IF;
END $$;
-- Criar índice para audio_id se não existir
CREATE INDEX IF NOT EXISTS idx_videos_audio_id ON pulso_content.videos(audio_id);
DO $$ BEGIN RAISE NOTICE '✅ Colunas de videos adicionadas';
END $$;
-- =========================================================================
-- RECRIAR VIEW COM JOINS COMPLETOS
-- =========================================================================
DROP VIEW IF EXISTS public.pipeline_producao CASCADE;
CREATE OR REPLACE VIEW public.pipeline_producao AS
SELECT p.id,
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
    s.nome as serie_nome,
    -- Dados do roteiro
    r.titulo as roteiro_titulo,
    r.status as roteiro_status,
    r.versao as roteiro_versao,
    r.conteudo_md as roteiro_conteudo,
    -- Dados do áudio
    a.url as audio_url,
    a.duracao_segundos as audio_duracao,
    a.formato as audio_formato,
    a.voz_id as audio_voz_id,
    -- Dados do vídeo
    v.url as video_url,
    v.duracao_segundos as video_duracao,
    v.formato as video_formato,
    v.resolucao as video_resolucao,
    v.thumbnail_url as video_thumbnail_url
FROM pulso_content.pipeline_producao p
    LEFT JOIN pulso_content.ideias i ON p.ideia_id = i.id
    LEFT JOIN pulso_core.canais c ON i.canal_id = c.id
    LEFT JOIN pulso_core.series s ON i.serie_id = s.id
    LEFT JOIN pulso_content.roteiros r ON p.roteiro_id = r.id
    LEFT JOIN pulso_content.audios a ON p.audio_id = a.id
    LEFT JOIN pulso_content.videos v ON p.video_id = v.id;
GRANT SELECT ON public.pipeline_producao TO anon,
    authenticated;
COMMENT ON VIEW public.pipeline_producao IS 'View completa do pipeline com todos os assets (audios, videos)';
DO $$ BEGIN RAISE NOTICE '✅ View public.pipeline_producao recriada com JOINs completos';
END $$;
-- =========================================================================
-- VERIFICAÇÃO FINAL
-- =========================================================================
DO $$
DECLARE audios_cols INTEGER;
videos_cols INTEGER;
BEGIN -- Contar colunas de audios
SELECT COUNT(*) INTO audios_cols
FROM information_schema.columns
WHERE table_schema = 'pulso_content'
    AND table_name = 'audios'
    AND column_name IN ('url', 'duracao_segundos', 'formato', 'voz_id');
-- Contar colunas de videos
SELECT COUNT(*) INTO videos_cols
FROM information_schema.columns
WHERE table_schema = 'pulso_content'
    AND table_name = 'videos'
    AND column_name IN (
        'url',
        'duracao_segundos',
        'formato',
        'thumbnail_url',
        'audio_id'
    );
RAISE NOTICE 'Audios: % colunas essenciais encontradas',
audios_cols;
RAISE NOTICE 'Videos: % colunas essenciais encontradas',
videos_cols;
IF audios_cols >= 4
AND videos_cols >= 5 THEN RAISE NOTICE '✅ Estrutura completa!';
ELSE RAISE WARNING '❌ Estrutura incompleta';
END IF;
END $$;
COMMIT;
-- =========================================================================
-- RESULTADO:
-- =========================================================================
-- ✅ pulso_content.audios com todas as colunas (url, duracao_segundos, formato, voz_id, etc)
-- ✅ pulso_content.videos com todas as colunas (url, duracao_segundos, thumbnail_url, audio_id, etc)
-- ✅ View public.pipeline_producao com JOINs completos
-- =========================================================================