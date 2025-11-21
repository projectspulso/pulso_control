-- =====================================================
-- MIGRATION COMPLETA: Pipeline de Produção
-- =====================================================
-- Criar schemas
CREATE SCHEMA IF NOT EXISTS core;
CREATE SCHEMA IF NOT EXISTS content;
CREATE SCHEMA IF NOT EXISTS assets;
CREATE SCHEMA IF NOT EXISTS distribution;
CREATE SCHEMA IF NOT EXISTS analytics;
-- =====================================================
-- 1. CORE SCHEMA - Tabelas base
-- =====================================================
-- Tabela de canais
CREATE TABLE IF NOT EXISTS core.canais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (
        tipo IN (
            'YOUTUBE',
            'TIKTOK',
            'INSTAGRAM',
            'KWAI',
            'PODCAST'
        )
    ),
    descricao TEXT,
    url TEXT,
    ativo BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
-- Tabela de séries
CREATE TABLE IF NOT EXISTS core.series (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    canal_id UUID NOT NULL REFERENCES core.canais(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    descricao TEXT,
    ativo BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
-- =====================================================
-- 2. CONTENT SCHEMA - Ideias e Roteiros
-- =====================================================
-- Tabela de ideias
CREATE TABLE IF NOT EXISTS content.ideias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo TEXT NOT NULL,
    descricao TEXT,
    canal_id UUID REFERENCES core.canais(id) ON DELETE
    SET NULL,
        serie_id UUID REFERENCES core.series(id) ON DELETE
    SET NULL,
        status TEXT DEFAULT 'RASCUNHO' CHECK (
            status IN (
                'RASCUNHO',
                'NOVA',
                'EM_ANALISE',
                'APROVADA',
                'REJEITADA',
                'EM_PRODUCAO',
                'PAUSADA',
                'ARQUIVADA',
                'PUBLICADA'
            )
        ),
        prioridade INTEGER DEFAULT 5 CHECK (
            prioridade BETWEEN 1 AND 10
        ),
        origem TEXT DEFAULT 'MANUAL' CHECK (
            origem IN ('MANUAL', 'IA', 'FEEDBACK', 'TRENDING')
        ),
        tags TEXT [] DEFAULT ARRAY []::TEXT [],
        linguagem TEXT DEFAULT 'pt-BR',
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
);
-- Tabela de roteiros
CREATE TABLE IF NOT EXISTS content.roteiros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ideia_id UUID REFERENCES content.ideias(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    conteudo_md TEXT NOT NULL,
    versao INTEGER DEFAULT 1,
    status TEXT DEFAULT 'RASCUNHO' CHECK (
        status IN (
            'RASCUNHO',
            'EM_REVISAO',
            'APROVADO',
            'REJEITADO',
            'EM_PRODUCAO'
        )
    ),
    duracao_minutos INTEGER,
    palavras_chave TEXT [] DEFAULT ARRAY []::TEXT [],
    linguagem TEXT DEFAULT 'pt-BR',
    criado_por TEXT CHECK (criado_por IN ('IA', 'MANUAL')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
-- =====================================================
-- 3. ASSETS SCHEMA - Mídia
-- =====================================================
-- Tabela de áudios
CREATE TABLE IF NOT EXISTS assets.audios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    roteiro_id UUID REFERENCES content.roteiros(id) ON DELETE
    SET NULL,
        url TEXT NOT NULL,
        duracao_segundos INTEGER,
        formato TEXT,
        tamanho_bytes BIGINT,
        voz_id TEXT,
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT now()
);
-- Tabela de vídeos
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
-- =====================================================
-- 4. PIPELINE DE PRODUÇÃO
-- =====================================================
-- Tabela principal do pipeline
CREATE TABLE IF NOT EXISTS content.pipeline_producao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ideia_id UUID NOT NULL REFERENCES content.ideias(id) ON DELETE CASCADE,
    roteiro_id UUID REFERENCES content.roteiros(id) ON DELETE
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
-- =====================================================
-- 5. ÍNDICES
-- =====================================================
-- Índices core
CREATE INDEX IF NOT EXISTS idx_canais_tipo ON core.canais(tipo);
CREATE INDEX IF NOT EXISTS idx_series_canal ON core.series(canal_id);
-- Índices content
CREATE INDEX IF NOT EXISTS idx_ideias_status ON content.ideias(status);
CREATE INDEX IF NOT EXISTS idx_ideias_canal ON content.ideias(canal_id);
CREATE INDEX IF NOT EXISTS idx_roteiros_ideia ON content.roteiros(ideia_id);
-- Índices pipeline
CREATE INDEX IF NOT EXISTS idx_pipeline_status ON content.pipeline_producao(status);
CREATE INDEX IF NOT EXISTS idx_pipeline_data_prevista ON content.pipeline_producao(data_prevista);
CREATE INDEX IF NOT EXISTS idx_pipeline_prioridade ON content.pipeline_producao(prioridade DESC);
CREATE INDEX IF NOT EXISTS idx_pipeline_ideia ON content.pipeline_producao(ideia_id);
-- =====================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- =====================================================
-- Core
ALTER TABLE core.canais ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.series ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Canais públicos" ON core.canais FOR
SELECT USING (true);
CREATE POLICY "Canais editáveis" ON core.canais FOR ALL USING (true);
CREATE POLICY "Séries públicas" ON core.series FOR
SELECT USING (true);
CREATE POLICY "Séries editáveis" ON core.series FOR ALL USING (true);
-- Content
ALTER TABLE content.ideias ENABLE ROW LEVEL SECURITY;
ALTER TABLE content.roteiros ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ideias públicas" ON content.ideias FOR
SELECT USING (true);
CREATE POLICY "Ideias editáveis" ON content.ideias FOR ALL USING (true);
CREATE POLICY "Roteiros públicos" ON content.roteiros FOR
SELECT USING (true);
CREATE POLICY "Roteiros editáveis" ON content.roteiros FOR ALL USING (true);
-- Assets
ALTER TABLE assets.audios ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets.videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Áudios públicos" ON assets.audios FOR
SELECT USING (true);
CREATE POLICY "Áudios editáveis" ON assets.audios FOR ALL USING (true);
CREATE POLICY "Vídeos públicos" ON assets.videos FOR
SELECT USING (true);
CREATE POLICY "Vídeos editáveis" ON assets.videos FOR ALL USING (true);
-- Pipeline
ALTER TABLE content.pipeline_producao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pipeline público leitura" ON content.pipeline_producao FOR
SELECT USING (true);
CREATE POLICY "Pipeline público escrita" ON content.pipeline_producao FOR ALL USING (true);
-- =====================================================
-- 7. TRIGGERS
-- =====================================================
-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Triggers de updated_at
CREATE TRIGGER update_canais_updated_at BEFORE
UPDATE ON core.canais FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_series_updated_at BEFORE
UPDATE ON core.series FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ideias_updated_at BEFORE
UPDATE ON content.ideias FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_roteiros_updated_at BEFORE
UPDATE ON content.roteiros FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pipeline_updated_at BEFORE
UPDATE ON content.pipeline_producao FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- =====================================================
-- 8. VIEWS CONSOLIDADAS
-- =====================================================
-- View do pipeline completo (schema content)
CREATE OR REPLACE VIEW content.vw_pipeline_completo AS
SELECT p.*,
    i.titulo as ideia_titulo,
    i.descricao as ideia_descricao,
    i.tags as ideia_tags,
    c.nome as canal_nome,
    c.tipo as canal_tipo,
    s.nome as serie_nome,
    r.titulo as roteiro_titulo,
    r.conteudo_md as roteiro_conteudo,
    r.duracao_minutos,
    a.url as audio_url,
    a.duracao_segundos as audio_duracao,
    v.url as video_url,
    v.thumbnail_url
FROM content.pipeline_producao p
    LEFT JOIN content.ideias i ON p.ideia_id = i.id
    LEFT JOIN core.canais c ON i.canal_id = c.id
    LEFT JOIN core.series s ON i.serie_id = s.id
    LEFT JOIN content.roteiros r ON p.roteiro_id = r.id
    LEFT JOIN assets.audios a ON p.audio_id = a.id
    LEFT JOIN assets.videos v ON p.video_id = v.id;
-- =====================================================
-- VIEWS NO SCHEMA PUBLIC (para frontend)
-- =====================================================
-- View de canais no public
CREATE OR REPLACE VIEW public.canais AS
SELECT *
FROM core.canais;
-- View de séries no public
CREATE OR REPLACE VIEW public.series AS
SELECT s.*,
    c.nome as canal_nome,
    c.tipo as canal_tipo
FROM core.series s
    LEFT JOIN core.canais c ON s.canal_id = c.id;
-- View de ideias no public
CREATE OR REPLACE VIEW public.ideias AS
SELECT i.*,
    c.nome as canal_nome,
    c.tipo as canal_tipo,
    s.nome as serie_nome
FROM content.ideias i
    LEFT JOIN core.canais c ON i.canal_id = c.id
    LEFT JOIN core.series s ON i.serie_id = s.id;
-- View de roteiros no public
CREATE OR REPLACE VIEW public.roteiros AS
SELECT r.*,
    i.titulo as ideia_titulo,
    i.canal_id,
    c.nome as canal_nome
FROM content.roteiros r
    LEFT JOIN content.ideias i ON r.ideia_id = i.id
    LEFT JOIN core.canais c ON i.canal_id = c.id;
-- View de pipeline_producao no public (PRINCIPAL)
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
    c.tipo as canal_tipo,
    -- Dados da série
    s.id as serie_id,
    s.nome as serie_nome,
    -- Dados do roteiro
    r.titulo as roteiro_titulo,
    r.conteudo_md as roteiro_conteudo,
    r.duracao_minutos,
    r.status as roteiro_status,
    -- Dados do áudio
    a.url as audio_url,
    a.duracao_segundos as audio_duracao,
    a.formato as audio_formato,
    -- Dados do vídeo
    v.url as video_url,
    v.thumbnail_url,
    v.duracao_segundos as video_duracao
FROM content.pipeline_producao p
    LEFT JOIN content.ideias i ON p.ideia_id = i.id
    LEFT JOIN core.canais c ON i.canal_id = c.id
    LEFT JOIN core.series s ON i.serie_id = s.id
    LEFT JOIN content.roteiros r ON p.roteiro_id = r.id
    LEFT JOIN assets.audios a ON p.audio_id = a.id
    LEFT JOIN assets.videos v ON p.video_id = v.id;
-- GRANT de acesso público às views
GRANT SELECT ON public.canais TO anon,
    authenticated;
GRANT SELECT ON public.series TO anon,
    authenticated;
GRANT SELECT ON public.ideias TO anon,
    authenticated;
GRANT SELECT ON public.roteiros TO anon,
    authenticated;
GRANT SELECT ON public.pipeline_producao TO anon,
    authenticated;
-- =====================================================
-- 9. COMENTÁRIOS
-- =====================================================
COMMENT ON SCHEMA core IS 'Schema principal - canais e séries';
COMMENT ON SCHEMA content IS 'Schema de conteúdo - ideias, roteiros';
COMMENT ON SCHEMA assets IS 'Schema de assets - áudios, vídeos';
COMMENT ON TABLE content.pipeline_producao IS 'Pipeline de produção - Kanban de conteúdos';
COMMENT ON VIEW content.vw_pipeline_completo IS 'View consolidada do pipeline com todos os relacionamentos';
COMMENT ON VIEW public.pipeline_producao IS 'View pública do pipeline para uso no frontend';
COMMENT ON VIEW public.canais IS 'View pública de canais';
COMMENT ON VIEW public.ideias IS 'View pública de ideias';
COMMENT ON VIEW public.roteiros IS 'View pública de roteiros';