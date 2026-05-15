-- =====================================================================
-- PARTE 1: SCHEMAS + TABELAS (idempotente — CREATE IF NOT EXISTS)
-- Banco: nlcisbfdiokmipyihtuz
-- Data: 2026-03-24
-- =====================================================================
-- Executar no Supabase Dashboard > SQL Editor
-- Este script é seguro para re-executar (não destrói dados existentes)
-- =====================================================================

-- 1. SCHEMAS
CREATE SCHEMA IF NOT EXISTS pulso_core;
CREATE SCHEMA IF NOT EXISTS pulso_content;
CREATE SCHEMA IF NOT EXISTS pulso_assets;
CREATE SCHEMA IF NOT EXISTS pulso_distribution;
CREATE SCHEMA IF NOT EXISTS pulso_automation;
CREATE SCHEMA IF NOT EXISTS pulso_analytics;

-- Grants para todos os schemas
GRANT USAGE ON SCHEMA pulso_core TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA pulso_content TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA pulso_assets TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA pulso_distribution TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA pulso_automation TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA pulso_analytics TO anon, authenticated, service_role;

-- 2. ENUMS
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'pulso_status_geral'
) THEN CREATE TYPE pulso_status_geral AS ENUM ('ATIVO', 'INATIVO', 'ARQUIVADO');
END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'pulso_status_ideia'
) THEN CREATE TYPE pulso_status_ideia AS ENUM ('RASCUNHO', 'EM_DESENVOLVIMENTO', 'APROVADA', 'DESCARTADA');
END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'pulso_status_roteiro'
) THEN CREATE TYPE pulso_status_roteiro AS ENUM ('RASCUNHO', 'EM_REVISAO', 'APROVADO', 'PUBLICADO', 'ARQUIVADO');
END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'pulso_tipo_asset'
) THEN CREATE TYPE pulso_tipo_asset AS ENUM ('AUDIO', 'VIDEO', 'IMAGEM', 'TEXTO', 'OUTRO');
END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'pulso_status_conteudo'
) THEN CREATE TYPE pulso_status_conteudo AS ENUM (
    'RASCUNHO', 'PRONTO_PARA_PRODUCAO', 'EM_PRODUCAO', 'PRONTO_PARA_PUBLICACAO', 'PUBLICADO', 'PAUSADO', 'ARQUIVADO'
); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'pulso_plataforma_tipo'
) THEN CREATE TYPE pulso_plataforma_tipo AS ENUM (
    'YOUTUBE_SHORTS', 'YOUTUBE_LONGO', 'TIKTOK', 'INSTAGRAM_REELS', 'INSTAGRAM_FEED', 'FACEBOOK_REELS', 'KWAI', 'OUTRO'
); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'pulso_status_post'
) THEN CREATE TYPE pulso_status_post AS ENUM ('AGENDADO', 'PUBLICADO', 'ERRO_PUBLICACAO', 'CANCELADO');
END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'pulso_tipo_evento_analytics'
) THEN CREATE TYPE pulso_tipo_evento_analytics AS ENUM (
    'VIEW', 'LIKE', 'DESLIKE', 'COMENTARIO', 'COMPARTILHAMENTO', 'CLIQUES_LINK', 'INSCRICAO', 'OUTRO'
); END IF; END $$;

-- 3. TABELAS pulso_core
CREATE TABLE IF NOT EXISTS pulso_core.canais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    descricao TEXT,
    idioma VARCHAR(10) DEFAULT 'pt-BR',
    status pulso_status_geral NOT NULL DEFAULT 'ATIVO',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS pulso_core.plataformas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo pulso_plataforma_tipo NOT NULL,
    nome_exibicao VARCHAR(255) NOT NULL,
    descricao TEXT,
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc', now()),
    UNIQUE (tipo, nome_exibicao)
);

CREATE TABLE IF NOT EXISTS pulso_core.canais_plataformas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    canal_id UUID NOT NULL REFERENCES pulso_core.canais (id) ON DELETE CASCADE,
    plataforma_id UUID NOT NULL REFERENCES pulso_core.plataformas (id) ON DELETE RESTRICT,
    identificador_externo VARCHAR(255) NOT NULL,
    nome_exibicao VARCHAR(255),
    url_canal TEXT,
    ativo BOOLEAN NOT NULL DEFAULT true,
    configuracoes JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc', now()),
    UNIQUE (plataforma_id, identificador_externo)
);

CREATE TABLE IF NOT EXISTS pulso_core.series (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    canal_id UUID NOT NULL REFERENCES pulso_core.canais (id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    descricao TEXT,
    status pulso_status_geral NOT NULL DEFAULT 'ATIVO',
    ordem_padrao INTEGER,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc', now()),
    UNIQUE (canal_id, slug)
);

CREATE TABLE IF NOT EXISTS pulso_core.tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(150) NOT NULL UNIQUE,
    descricao TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS pulso_core.series_tags (
    serie_id UUID NOT NULL REFERENCES pulso_core.series (id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES pulso_core.tags (id) ON DELETE CASCADE,
    PRIMARY KEY (serie_id, tag_id)
);

CREATE TABLE IF NOT EXISTS pulso_core.usuarios_internos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID,
    nome VARCHAR(200) NOT NULL,
    email VARCHAR(200),
    papel VARCHAR(100),
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc', now())
);

-- 4. TABELAS pulso_content
CREATE TABLE IF NOT EXISTS pulso_content.ideias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    canal_id UUID REFERENCES pulso_core.canais (id) ON DELETE SET NULL,
    serie_id UUID REFERENCES pulso_core.series (id) ON DELETE SET NULL,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    origem VARCHAR(100),
    prioridade INTEGER DEFAULT 3,
    status pulso_status_ideia NOT NULL DEFAULT 'RASCUNHO',
    tags TEXT[],
    linguagem VARCHAR(10) DEFAULT 'pt-BR',
    criado_por UUID REFERENCES pulso_core.usuarios_internos (id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS pulso_content.roteiros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ideia_id UUID REFERENCES pulso_content.ideias (id) ON DELETE SET NULL,
    titulo VARCHAR(255) NOT NULL,
    versao INTEGER NOT NULL DEFAULT 1,
    conteudo_md TEXT NOT NULL,
    duracao_estimado_segundos INTEGER,
    status pulso_status_roteiro NOT NULL DEFAULT 'RASCUNHO',
    linguagem VARCHAR(10) DEFAULT 'pt-BR',
    criado_por UUID REFERENCES pulso_core.usuarios_internos (id) ON DELETE SET NULL,
    revisado_por UUID REFERENCES pulso_core.usuarios_internos (id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc', now()),
    UNIQUE (ideia_id, versao)
);

CREATE TABLE IF NOT EXISTS pulso_content.conteudos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    canal_id UUID REFERENCES pulso_core.canais (id) ON DELETE SET NULL,
    serie_id UUID REFERENCES pulso_core.series (id) ON DELETE SET NULL,
    roteiro_id UUID REFERENCES pulso_content.roteiros (id) ON DELETE SET NULL,
    titulo_interno VARCHAR(255) NOT NULL,
    sinopse TEXT,
    status pulso_status_conteudo NOT NULL DEFAULT 'RASCUNHO',
    linguagem VARCHAR(10) DEFAULT 'pt-BR',
    ordem_na_serie INTEGER,
    tags TEXT[],
    metadata JSONB DEFAULT '{}'::jsonb,
    criado_por UUID REFERENCES pulso_core.usuarios_internos (id) ON DELETE SET NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS pulso_content.conteudo_variantes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conteudo_id UUID NOT NULL REFERENCES pulso_content.conteudos (id) ON DELETE CASCADE,
    nome_variacao VARCHAR(100) NOT NULL,
    plataforma_tipo pulso_plataforma_tipo,
    status pulso_status_conteudo NOT NULL DEFAULT 'RASCUNHO',
    titulo_publico VARCHAR(255),
    descricao_publica TEXT,
    legenda TEXT,
    hashtags TEXT[],
    linguagem VARCHAR(10) DEFAULT 'pt-BR',
    ordem_exibicao INTEGER,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc', now())
);

-- 5. TABELAS pulso_assets
CREATE TABLE IF NOT EXISTS pulso_assets.assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo pulso_tipo_asset NOT NULL,
    nome VARCHAR(255),
    descricao TEXT,
    caminho_storage TEXT NOT NULL,
    provedor VARCHAR(100) DEFAULT 'SUPABASE',
    duracao_segundos INTEGER,
    largura_px INTEGER,
    altura_px INTEGER,
    tamanho_bytes BIGINT,
    hash_arquivo VARCHAR(255),
    metadata JSONB DEFAULT '{}'::jsonb,
    criado_por UUID REFERENCES pulso_core.usuarios_internos (id) ON DELETE SET NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS pulso_assets.conteudo_variantes_assets (
    conteudo_variantes_id UUID NOT NULL REFERENCES pulso_content.conteudo_variantes (id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES pulso_assets.assets (id) ON DELETE CASCADE,
    papel VARCHAR(50) NOT NULL,
    ordem INTEGER DEFAULT 1,
    PRIMARY KEY (conteudo_variantes_id, asset_id, papel)
);

-- 6. TABELAS pulso_distribution
CREATE TABLE IF NOT EXISTS pulso_distribution.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conteudo_variantes_id UUID NOT NULL REFERENCES pulso_content.conteudo_variantes (id) ON DELETE RESTRICT,
    canal_plataforma_id UUID NOT NULL REFERENCES pulso_core.canais_plataformas (id) ON DELETE RESTRICT,
    status pulso_status_post NOT NULL DEFAULT 'AGENDADO',
    titulo_publicado VARCHAR(255),
    descricao_publicada TEXT,
    legenda_publicada TEXT,
    url_publicacao TEXT,
    identificador_externo VARCHAR(255),
    data_agendada TIMESTAMP WITHOUT TIME ZONE,
    data_publicacao TIMESTAMP WITHOUT TIME ZONE,
    data_remocao TIMESTAMP WITHOUT TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb,
    criado_por UUID REFERENCES pulso_core.usuarios_internos (id) ON DELETE SET NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_posts_conteudo_var ON pulso_distribution.posts (conteudo_variantes_id);
CREATE INDEX IF NOT EXISTS idx_posts_canal_plat ON pulso_distribution.posts (canal_plataforma_id);
CREATE INDEX IF NOT EXISTS idx_posts_status ON pulso_distribution.posts (status);
CREATE INDEX IF NOT EXISTS idx_posts_data_pub ON pulso_distribution.posts (data_publicacao);

CREATE TABLE IF NOT EXISTS pulso_distribution.posts_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES pulso_distribution.posts (id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL,
    mensagem TEXT,
    payload JSONB,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_posts_logs_post_id ON pulso_distribution.posts_logs (post_id);

-- 7. TABELAS pulso_automation (workflows legado)
CREATE TABLE IF NOT EXISTS pulso_automation.workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    descricao TEXT,
    origem VARCHAR(50) DEFAULT 'N8N',
    referencia_externa VARCHAR(255),
    ativo BOOLEAN NOT NULL DEFAULT true,
    configuracao JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS pulso_automation.workflow_execucoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES pulso_automation.workflows (id) ON DELETE CASCADE,
    entidade_tipo VARCHAR(50),
    entidade_id UUID,
    status VARCHAR(50) NOT NULL,
    mensagem TEXT,
    payload_entrada JSONB,
    payload_saida JSONB,
    inicio_em TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc', now()),
    fim_em TIMESTAMP WITHOUT TIME ZONE,
    criado_por UUID REFERENCES pulso_core.usuarios_internos (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_execucoes_workflow ON pulso_automation.workflow_execucoes (workflow_id);
CREATE INDEX IF NOT EXISTS idx_execucoes_entidade ON pulso_automation.workflow_execucoes (entidade_tipo, entidade_id);

-- 8. TABELAS pulso_analytics
CREATE TABLE IF NOT EXISTS pulso_analytics.eventos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES pulso_distribution.posts (id) ON DELETE SET NULL,
    plataforma_id UUID REFERENCES pulso_core.plataformas (id) ON DELETE SET NULL,
    tipo pulso_tipo_evento_analytics NOT NULL,
    quantidade INTEGER NOT NULL DEFAULT 1,
    valor_numerico NUMERIC(18, 4),
    metadata JSONB DEFAULT '{}'::jsonb,
    registrado_em TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc', now()),
    data_evento DATE NOT NULL DEFAULT (timezone('utc', now())::date)
);

CREATE INDEX IF NOT EXISTS idx_eventos_post_id ON pulso_analytics.eventos (post_id);
CREATE INDEX IF NOT EXISTS idx_eventos_tipo_data ON pulso_analytics.eventos (tipo, data_evento);

CREATE TABLE IF NOT EXISTS pulso_analytics.metricas_diarias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES pulso_distribution.posts (id) ON DELETE CASCADE,
    plataforma_id UUID REFERENCES pulso_core.plataformas (id) ON DELETE SET NULL,
    data_ref DATE NOT NULL,
    views BIGINT DEFAULT 0,
    likes BIGINT DEFAULT 0,
    deslikes BIGINT DEFAULT 0,
    comentarios BIGINT DEFAULT 0,
    compartilhamentos BIGINT DEFAULT 0,
    cliques_link BIGINT DEFAULT 0,
    inscricoes BIGINT DEFAULT 0,
    watch_time_segundos BIGINT DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc', now()),
    UNIQUE (post_id, data_ref)
);

CREATE INDEX IF NOT EXISTS idx_metricas_diarias_post_data ON pulso_analytics.metricas_diarias (post_id, data_ref);

-- 9. GRANTS amplos para todas as tabelas (MVP)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA pulso_core TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA pulso_content TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA pulso_assets TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA pulso_distribution TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA pulso_automation TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA pulso_analytics TO anon, authenticated, service_role;

-- =====================================================================
-- FIM PARTE 1 — Verificação rápida:
-- =====================================================================
SELECT schemaname, COUNT(*) as tabelas
FROM pg_tables
WHERE schemaname LIKE 'pulso_%'
GROUP BY schemaname
ORDER BY schemaname;
