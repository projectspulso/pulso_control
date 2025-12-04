-- =====================================================
-- ESTRUTURA COMPLETA: ASSETS, FEEDBACK E PERSONAGENS
-- =====================================================
-- Este arquivo adiciona as tabelas que faltam para:
-- 1. Gerenciar personagens (vozes, avatares, estilos)
-- 2. Armazenar thumbnails e outros assets visuais
-- 3. Coletar feedback e métricas de performance
-- 4. Treinar e melhorar a IA baseado em resultados
-- =====================================================
BEGIN;
-- =====================================================
-- 1. TABELA DE PERSONAGENS
-- =====================================================
-- Armazena personagens/vozes/estilos usados na produção
CREATE TABLE IF NOT EXISTS pulso_content.personagens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Identificação
    nome TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    tipo TEXT NOT NULL CHECK (
        tipo IN ('VOZ', 'AVATAR', 'APRESENTADOR', 'NARRADOR')
    ),
    -- Características
    genero TEXT CHECK (genero IN ('MASCULINO', 'FEMININO', 'NEUTRO')),
    idioma TEXT DEFAULT 'pt-BR',
    tom TEXT,
    -- calmo, energético, misterioso, etc.
    idade_aproximada TEXT,
    -- jovem, adulto, idoso
    -- Configurações técnicas
    voz_id TEXT,
    -- ID da voz no provedor (OpenAI, ElevenLabs, etc.)
    avatar_id TEXT,
    -- ID do avatar (D-ID, HeyGen, etc.)
    provedor TEXT,
    -- openai, elevenlabs, azure, etc.
    -- Metadados e configurações
    metadata JSONB DEFAULT '{}'::jsonb,
    -- Exemplo metadata: {
    --   "voz_config": {"speed": 1.0, "pitch": 0, "stability": 0.5},
    --   "avatar_config": {"expression": "neutral", "style": "professional"},
    --   "uso_recomendado": ["terror", "mistério", "documentário"]
    -- }
    -- Estatísticas de uso
    total_usos INTEGER DEFAULT 0,
    ultima_utilizacao TIMESTAMPTZ,
    -- Status e controle
    ativo BOOLEAN DEFAULT true,
    custo_por_uso NUMERIC(10, 4),
    -- custo em créditos/reais
    -- Auditoria
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Índices para personagens
CREATE INDEX IF NOT EXISTS idx_personagens_tipo ON pulso_content.personagens(tipo);
CREATE INDEX IF NOT EXISTS idx_personagens_idioma ON pulso_content.personagens(idioma);
CREATE INDEX IF NOT EXISTS idx_personagens_ativo ON pulso_content.personagens(ativo);
CREATE INDEX IF NOT EXISTS idx_personagens_provedor ON pulso_content.personagens(provedor);
-- =====================================================
-- 2. TABELA DE THUMBNAILS
-- =====================================================
-- Armazena thumbnails geradas (A/B testing, múltiplas versões)
CREATE TABLE IF NOT EXISTS pulso_content.thumbnails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Relacionamentos
    ideia_id UUID REFERENCES pulso_content.ideias(id) ON DELETE CASCADE,
    roteiro_id UUID REFERENCES pulso_content.roteiros(id) ON DELETE
    SET NULL,
        -- Armazenamento
        storage_path TEXT NOT NULL,
        -- caminho no Supabase Storage
        public_url TEXT,
        -- URL pública se disponível
        bucket_name TEXT DEFAULT 'thumbnails',
        -- Metadados da imagem
        largura_px INTEGER,
        altura_px INTEGER,
        formato TEXT,
        -- jpg, png, webp
        tamanho_bytes BIGINT,
        -- Informações de geração
        tipo_geracao TEXT CHECK (tipo_geracao IN ('IA', 'MANUAL', 'TEMPLATE')),
        prompt_usado TEXT,
        -- se gerado por IA (DALL-E, Midjourney, etc.)
        modelo_ia TEXT,
        -- dall-e-3, midjourney-v6, etc.
        provedor TEXT,
        -- openai, midjourney, stable-diffusion, etc.
        -- Elementos visuais
        titulo_texto TEXT,
        -- texto que aparece na thumb
        estilo TEXT,
        -- dark, minimalista, colorido, dramático, etc.
        cores_principais TEXT [],
        -- ['#FF0000', '#00FF00']
        -- Versão e testes
        versao INTEGER DEFAULT 1,
        variante TEXT,
        -- A, B, C (para A/B testing)
        is_principal BOOLEAN DEFAULT false,
        -- thumb escolhida para publicação
        -- Metadados adicionais
        metadata JSONB DEFAULT '{}'::jsonb,
        -- Exemplo: {
        --   "elementos": ["texto_grande", "imagem_fundo", "emoji"],
        --   "template_usado": "template_terror_v2",
        --   "clicks_estimados": 1500
        -- }
        -- Performance (preenchido após publicação)
        clicks INTEGER DEFAULT 0,
        impressoes INTEGER DEFAULT 0,
        ctr NUMERIC(5, 2),
        -- Click-through rate
        -- Auditoria
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Índices para thumbnails
CREATE INDEX IF NOT EXISTS idx_thumbnails_ideia ON pulso_content.thumbnails(ideia_id);
CREATE INDEX IF NOT EXISTS idx_thumbnails_roteiro ON pulso_content.thumbnails(roteiro_id);
CREATE INDEX IF NOT EXISTS idx_thumbnails_principal ON pulso_content.thumbnails(is_principal)
WHERE is_principal = true;
CREATE INDEX IF NOT EXISTS idx_thumbnails_variante ON pulso_content.thumbnails(variante);
-- =====================================================
-- 3. TABELA DE FEEDBACK E AVALIAÇÕES
-- =====================================================
-- Armazena feedback humano e métricas para treinar a IA
CREATE TABLE IF NOT EXISTS pulso_content.feedbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- O que está sendo avaliado
    entidade_tipo TEXT NOT NULL CHECK (
        entidade_tipo IN (
            'IDEIA',
            'ROTEIRO',
            'AUDIO',
            'VIDEO',
            'THUMBNAIL'
        )
    ),
    entidade_id UUID NOT NULL,
    -- ID da ideia, roteiro, etc.
    -- Quem avaliou
    avaliador_tipo TEXT CHECK (
        avaliador_tipo IN ('HUMANO', 'IA', 'METRICAS_REAIS')
    ),
    avaliador_id TEXT,
    -- user_id ou nome do modelo de IA
    -- Avaliação
    nota NUMERIC(3, 1) CHECK (
        nota BETWEEN 0 AND 10
    ),
    -- 0.0 a 10.0
    aprovado BOOLEAN,
    -- Aspectos específicos (0-10 cada)
    qualidade_conteudo NUMERIC(3, 1),
    potencial_viral NUMERIC(3, 1),
    originalidade NUMERIC(3, 1),
    clareza NUMERIC(3, 1),
    engajamento_esperado NUMERIC(3, 1),
    -- Feedback textual
    comentario TEXT,
    sugestoes TEXT,
    pontos_fortes TEXT [],
    pontos_fracos TEXT [],
    -- Categorização
    tags TEXT [],
    -- ["muito_bom", "precisa_melhorar", "viral"]
    categoria_feedback TEXT,
    -- POSITIVO, NEGATIVO, NEUTRO, MISTO
    -- Métricas reais (preenchido após publicação)
    views_reais INTEGER,
    likes_reais INTEGER,
    shares_reais INTEGER,
    comentarios_reais INTEGER,
    tempo_medio_visualizacao NUMERIC(5, 2),
    -- segundos
    taxa_retencao NUMERIC(5, 2),
    -- porcentagem
    -- Metadados
    metadata JSONB DEFAULT '{}'::jsonb,
    -- Exemplo: {
    --   "plataforma": "youtube",
    --   "comparacao_esperado_real": {"views_esperado": 10000, "views_real": 15000},
    --   "aprendizados": ["gancho funcionou muito bem", "thumbnail precisa mais contraste"]
    -- }
    -- Auditoria
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Índices para feedbacks
CREATE INDEX IF NOT EXISTS idx_feedbacks_entidade ON pulso_content.feedbacks(entidade_tipo, entidade_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_aprovado ON pulso_content.feedbacks(aprovado);
CREATE INDEX IF NOT EXISTS idx_feedbacks_nota ON pulso_content.feedbacks(nota DESC);
CREATE INDEX IF NOT EXISTS idx_feedbacks_avaliador ON pulso_content.feedbacks(avaliador_tipo, avaliador_id);
-- =====================================================
-- 4. TABELA DE MÉTRICAS DE PERFORMANCE
-- =====================================================
-- Consolida métricas de todos os assets publicados
CREATE TABLE IF NOT EXISTS pulso_content.metricas_publicacao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Relacionamentos
    ideia_id UUID REFERENCES pulso_content.ideias(id) ON DELETE CASCADE,
    roteiro_id UUID REFERENCES pulso_content.roteiros(id) ON DELETE
    SET NULL,
        -- Identificação da publicação
        plataforma TEXT NOT NULL,
        -- youtube, tiktok, instagram, etc.
        url_publicacao TEXT,
        post_id TEXT,
        -- ID na plataforma
        -- Data de publicação
        data_publicacao TIMESTAMPTZ NOT NULL,
        hora_publicacao TEXT,
        -- formato HH:MM para análise de melhor horário
        dia_semana INTEGER,
        -- 0-6 para análise de melhor dia
        -- Métricas de engajamento
        views INTEGER DEFAULT 0,
        likes INTEGER DEFAULT 0,
        dislikes INTEGER DEFAULT 0,
        shares INTEGER DEFAULT 0,
        comentarios INTEGER DEFAULT 0,
        saves INTEGER DEFAULT 0,
        -- salvamentos (Instagram, TikTok)
        -- Métricas avançadas
        tempo_medio_visualizacao NUMERIC(5, 2),
        -- segundos
        taxa_retencao NUMERIC(5, 2),
        -- porcentagem
        taxa_cliques NUMERIC(5, 2),
        -- CTR
        taxa_conversao NUMERIC(5, 2),
        -- se houver CTA
        -- Crescimento ao longo do tempo
        views_24h INTEGER,
        views_7dias INTEGER,
        views_30dias INTEGER,
        -- Performance relativa
        performance_vs_media TEXT CHECK (
            performance_vs_media IN (
                'MUITO_ACIMA',
                'ACIMA',
                'MEDIA',
                'ABAIXO',
                'MUITO_ABAIXO'
            )
        ),
        percentil INTEGER CHECK (
            percentil BETWEEN 0 AND 100
        ),
        -- top 10%, top 50%, etc.
        -- Dados demográficos
        pais_principal TEXT,
        idade_principal TEXT,
        -- 18-24, 25-34, etc.
        genero_principal TEXT,
        -- Monetização
        receita_estimada NUMERIC(10, 2),
        cpm NUMERIC(10, 2),
        -- custo por mil impressões
        -- Metadados
        metadata JSONB DEFAULT '{}'::jsonb,
        -- Exemplo: {
        --   "origem_trafego": {"busca": 40, "sugeridos": 35, "externo": 25},
        --   "momentos_pico_retencao": [5, 15, 30],
        --   "palavras_chave_ranqueadas": ["mistério", "terror", "curiosidade"]
        -- }
        -- Última atualização
        ultima_atualizacao TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Índices para métricas
CREATE INDEX IF NOT EXISTS idx_metricas_ideia ON pulso_content.metricas_publicacao(ideia_id);
CREATE INDEX IF NOT EXISTS idx_metricas_plataforma ON pulso_content.metricas_publicacao(plataforma);
CREATE INDEX IF NOT EXISTS idx_metricas_data ON pulso_content.metricas_publicacao(data_publicacao DESC);
CREATE INDEX IF NOT EXISTS idx_metricas_views ON pulso_content.metricas_publicacao(views DESC);
CREATE INDEX IF NOT EXISTS idx_metricas_performance ON pulso_content.metricas_publicacao(performance_vs_media);
-- =====================================================
-- 5. ATUALIZAR TABELAS EXISTENTES (adicionar colunas)
-- =====================================================
-- Adicionar colunas em ideias para feedback
ALTER TABLE pulso_content.ideias
ADD COLUMN IF NOT EXISTS personagem_sugerido_id UUID REFERENCES pulso_content.personagens(id);
ALTER TABLE pulso_content.ideias
ADD COLUMN IF NOT EXISTS nota_ia_inicial NUMERIC(3, 1);
ALTER TABLE pulso_content.ideias
ADD COLUMN IF NOT EXISTS potencial_viral_ia NUMERIC(3, 1);
-- Adicionar colunas em roteiros para personagem usado
ALTER TABLE pulso_content.roteiros
ADD COLUMN IF NOT EXISTS personagem_id UUID REFERENCES pulso_content.personagens(id);
ALTER TABLE pulso_content.roteiros
ADD COLUMN IF NOT EXISTS nota_qualidade_ia NUMERIC(3, 1);
-- Adicionar colunas em audios (se não existirem)
DO $$ BEGIN -- Verificar se tabela audios existe no schema correto
IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'pulso_content'
        AND table_name = 'audios'
) THEN
ALTER TABLE pulso_content.audios
ADD COLUMN IF NOT EXISTS personagem_id UUID REFERENCES pulso_content.personagens(id);
ALTER TABLE pulso_content.audios
ADD COLUMN IF NOT EXISTS qualidade_voz_ia NUMERIC(3, 1);
END IF;
END $$;
-- =====================================================
-- 6. TRIGGERS DE ATUALIZAÇÃO
-- =====================================================
-- Atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS update_personagens_updated_at ON pulso_content.personagens;
CREATE TRIGGER update_personagens_updated_at BEFORE
UPDATE ON pulso_content.personagens FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_thumbnails_updated_at ON pulso_content.thumbnails;
CREATE TRIGGER update_thumbnails_updated_at BEFORE
UPDATE ON pulso_content.thumbnails FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_feedbacks_updated_at ON pulso_content.feedbacks;
CREATE TRIGGER update_feedbacks_updated_at BEFORE
UPDATE ON pulso_content.feedbacks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- =====================================================
-- 7. VIEWS PARA ANÁLISE
-- =====================================================
-- View: Performance agregada por tipo de conteúdo
CREATE OR REPLACE VIEW pulso_content.vw_performance_por_tipo AS
SELECT i.tags [1] as tipo_conteudo,
    COUNT(DISTINCT m.id) as total_publicacoes,
    AVG(m.views) as media_views,
    AVG(m.likes) as media_likes,
    AVG(m.taxa_retencao) as media_retencao,
    AVG(m.tempo_medio_visualizacao) as media_tempo_visualizacao,
    SUM(m.receita_estimada) as receita_total
FROM pulso_content.ideias i
    LEFT JOIN pulso_content.metricas_publicacao m ON m.ideia_id = i.id
WHERE m.id IS NOT NULL
GROUP BY i.tags [1]
ORDER BY media_views DESC;
-- View: Melhores personagens por performance
CREATE OR REPLACE VIEW pulso_content.vw_personagens_performance AS
SELECT p.id,
    p.nome,
    p.tipo,
    p.tom,
    p.total_usos,
    AVG(f.nota) as nota_media,
    AVG(m.views) as media_views_conteudo,
    AVG(m.taxa_retencao) as media_retencao_conteudo,
    COUNT(DISTINCT m.id) as total_publicacoes_com_metricas
FROM pulso_content.personagens p
    LEFT JOIN pulso_content.roteiros r ON r.personagem_id = p.id
    LEFT JOIN pulso_content.metricas_publicacao m ON m.roteiro_id = r.id
    LEFT JOIN pulso_content.feedbacks f ON f.entidade_id = r.id
    AND f.entidade_tipo = 'ROTEIRO'
WHERE p.ativo = true
GROUP BY p.id,
    p.nome,
    p.tipo,
    p.tom,
    p.total_usos
ORDER BY media_views_conteudo DESC NULLS LAST;
-- View: Thumbnails com melhor performance
CREATE OR REPLACE VIEW pulso_content.vw_thumbnails_performance AS
SELECT t.id,
    t.ideia_id,
    t.tipo_geracao,
    t.estilo,
    t.variante,
    t.clicks,
    t.impressoes,
    t.ctr,
    m.views as views_video,
    m.taxa_retencao,
    t.cores_principais,
    t.metadata
FROM pulso_content.thumbnails t
    LEFT JOIN pulso_content.metricas_publicacao m ON m.ideia_id = t.ideia_id
    AND t.is_principal = true
WHERE t.impressoes > 0
ORDER BY t.ctr DESC NULLS LAST;
-- =====================================================
-- 8. COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================
COMMENT ON TABLE pulso_content.personagens IS 'Personagens, vozes e avatares usados na produção de conteúdo';
COMMENT ON TABLE pulso_content.thumbnails IS 'Thumbnails geradas para vídeos, com suporte a A/B testing';
COMMENT ON TABLE pulso_content.feedbacks IS 'Feedback humano e de IA para treinar e melhorar o sistema';
COMMENT ON TABLE pulso_content.metricas_publicacao IS 'Métricas de performance de conteúdos publicados nas plataformas';
COMMENT ON COLUMN pulso_content.personagens.voz_id IS 'ID da voz no provedor (ex: alloy, nova, fable no OpenAI)';
COMMENT ON COLUMN pulso_content.feedbacks.nota IS 'Nota de 0.0 a 10.0 da qualidade do conteúdo';
COMMENT ON COLUMN pulso_content.metricas_publicacao.percentil IS 'Percentil de performance (ex: top 10% = 90)';
COMMIT;
-- =====================================================
-- FIM DO SCRIPT
-- =====================================================
-- Este script adiciona estrutura completa para:
-- ✅ Gerenciar personagens e vozes
-- ✅ Armazenar e testar thumbnails
-- ✅ Coletar feedback para IA
-- ✅ Medir performance real
-- ✅ Comparar expectativa vs realidade
-- ✅ Treinar modelos baseado em dados reais
-- =====================================================