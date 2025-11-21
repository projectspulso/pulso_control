-- =====================================================
-- CRIAR APENAS TABELA PIPELINE_PRODUCAO
-- (Não mexe nas tabelas existentes: canais, series, ideias, roteiros)
-- =====================================================
-- Criar schema se não existir (usar os schemas existentes)
CREATE SCHEMA IF NOT EXISTS pulso_content;
CREATE SCHEMA IF NOT EXISTS pulso_core;
CREATE SCHEMA IF NOT EXISTS assets;
-- Tabela de áudios (se não existir)
CREATE TABLE IF NOT EXISTS assets.audios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    roteiro_id UUID REFERENCES pulso_content.roteiros(id) ON DELETE
    SET NULL,
        url TEXT NOT NULL,
        duracao_segundos INTEGER,
        formato TEXT,
        tamanho_bytes BIGINT,
        voz_id TEXT,
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT now()
);
-- Tabela de vídeos (se não existir)
CREATE TABLE IF NOT EXISTS assets.videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audio_id UUID REFERENCES assets.audios(id) ON DELETE
    SET NULL,
        url TEXT NOT NULL,
        duracao_segundos INTEGER,
        formato TEXT,
        resolucao TEXT,
        tamanho_bytes BIGINT,
        thumbnail_url TEXT,
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT now()
);
-- Tabela pipeline_producao
CREATE TABLE IF NOT EXISTS pulso_content.pipeline_producao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ideia_id UUID NOT NULL REFERENCES pulso_content.ideias(id) ON DELETE CASCADE,
    roteiro_id UUID REFERENCES pulso_content.roteiros(id) ON DELETE
    SET NULL,
        audio_id UUID REFERENCES assets.audios(id) ON DELETE
    SET NULL,
        video_id UUID REFERENCES assets.videos(id) ON DELETE
    SET NULL,
        status TEXT NOT NULL DEFAULT 'AGUARDANDO_ROTEIRO' CHECK (
            status IN (
                'AGUARDANDO_ROTEIRO',
                'ROTEIRO_PRONTO',
                'AUDIO_GERADO',
                'EM_EDICAO',
                'PRONTO_PUBLICACAO',
                'PUBLICADO'
            )
        ),
        prioridade INTEGER DEFAULT 5 CHECK (
            prioridade BETWEEN 1 AND 10
        ),
        data_prevista TIMESTAMPTZ,
        data_publicacao TIMESTAMPTZ,
        responsavel TEXT,
        observacoes TEXT,
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
);
-- Índices
CREATE INDEX IF NOT EXISTS idx_pipeline_status ON pulso_content.pipeline_producao(status);
CREATE INDEX IF NOT EXISTS idx_pipeline_data_prevista ON pulso_content.pipeline_producao(data_prevista);
CREATE INDEX IF NOT EXISTS idx_pipeline_prioridade ON pulso_content.pipeline_producao(prioridade DESC);
CREATE INDEX IF NOT EXISTS idx_pipeline_ideia ON pulso_content.pipeline_producao(ideia_id);
-- RLS
ALTER TABLE pulso_content.pipeline_producao ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets.audios ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets.videos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Pipeline público leitura" ON pulso_content.pipeline_producao;
CREATE POLICY "Pipeline público leitura" ON pulso_content.pipeline_producao FOR
SELECT USING (true);
DROP POLICY IF EXISTS "Pipeline público escrita" ON pulso_content.pipeline_producao;
CREATE POLICY "Pipeline público escrita" ON pulso_content.pipeline_producao FOR ALL USING (true);
DROP POLICY IF EXISTS "Áudios públicos" ON assets.audios;
CREATE POLICY "Áudios públicos" ON assets.audios FOR ALL USING (true);
DROP POLICY IF EXISTS "Vídeos públicos" ON assets.videos;
CREATE POLICY "Vídeos públicos" ON assets.videos FOR ALL USING (true);
-- Trigger
CREATE OR REPLACE FUNCTION update_pipeline_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS update_pipeline_updated_at ON pulso_content.pipeline_producao;
CREATE TRIGGER update_pipeline_updated_at BEFORE
UPDATE ON pulso_content.pipeline_producao FOR EACH ROW EXECUTE FUNCTION update_pipeline_updated_at();
-- View pública do pipeline
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
    i.tags as ideia_tags,
    i.status as ideia_status,
    -- Dados do canal
    c.id as canal_id,
    c.nome as canal_nome,
    -- Dados da série
    s.id as serie_id,
    s.nome as serie_nome,
    -- Dados do roteiro
    r.titulo as roteiro_titulo,
    r.conteudo_md as roteiro_conteudo,
    r.duracao_estimado_segundos,
    r.status as roteiro_status,
    -- Dados do áudio
    a.url as audio_url,
    a.duracao_segundos as audio_duracao,
    a.formato as audio_formato,
    -- Dados do vídeo
    v.url as video_url,
    v.thumbnail_url,
    v.duracao_segundos as video_duracao
FROM pulso_content.pipeline_producao p
    LEFT JOIN pulso_content.ideias i ON p.ideia_id = i.id
    LEFT JOIN pulso_core.canais c ON i.canal_id = c.id
    LEFT JOIN pulso_core.series s ON i.serie_id = s.id
    LEFT JOIN pulso_content.roteiros r ON p.roteiro_id = r.id
    LEFT JOIN assets.audios a ON p.audio_id = a.id
    LEFT JOIN assets.videos v ON p.video_id = v.id;
-- GRANT
GRANT SELECT ON public.pipeline_producao TO anon,
    authenticated;
-- Comentários
COMMENT ON TABLE pulso_content.pipeline_producao IS 'Pipeline de produção - Kanban de conteúdos';
COMMENT ON VIEW public.pipeline_producao IS 'View pública do pipeline para uso no frontend';