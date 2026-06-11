-- ============================================================
-- ESPELHO DE SCHEMA — pulso_control  (projeto Supabase: projectspulso's Project / region sa-east-1)
-- Snapshot estrutural gerado via Management API. Read-only.
-- Para o DDL EXATO (constraints/índices/triggers), a fonte canônica é ./migrations/.
-- Regenerar: node Cockpit/scripts/dump-db-mirror.mjs pulso_control
-- ============================================================

CREATE TABLE pulso_analytics.eventos (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    post_id uuid,
    plataforma_id uuid,
    tipo pulso_tipo_evento_analytics NOT NULL,
    quantidade integer NOT NULL DEFAULT 1,
    valor_numerico numeric,
    metadata jsonb DEFAULT '{}'::jsonb,
    registrado_em timestamp without time zone DEFAULT timezone('utc'::text, now()),
    data_evento date NOT NULL DEFAULT (timezone('utc'::text, now()))::date
);

CREATE TABLE pulso_analytics.metricas_diarias (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    post_id uuid NOT NULL,
    plataforma_id uuid,
    data_ref date NOT NULL,
    views bigint DEFAULT 0,
    likes bigint DEFAULT 0,
    deslikes bigint DEFAULT 0,
    comentarios bigint DEFAULT 0,
    compartilhamentos bigint DEFAULT 0,
    cliques_link bigint DEFAULT 0,
    inscricoes bigint DEFAULT 0,
    watch_time_segundos bigint DEFAULT 0,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp without time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE pulso_assets.assets (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    tipo pulso_tipo_asset NOT NULL,
    nome character varying(255),
    descricao text,
    caminho_storage text NOT NULL,
    provedor character varying(100) DEFAULT 'SUPABASE'::character varying,
    duracao_segundos integer,
    largura_px integer,
    altura_px integer,
    tamanho_bytes bigint,
    hash_arquivo character varying(255),
    metadata jsonb DEFAULT '{}'::jsonb,
    criado_por uuid,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp without time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE pulso_assets.conteudo_variantes_assets (
    conteudo_variantes_id uuid NOT NULL,
    asset_id uuid NOT NULL,
    papel character varying(50) NOT NULL,
    ordem integer DEFAULT 1
);

CREATE TABLE pulso_automation.ai_config (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    chave text NOT NULL,
    valor jsonb NOT NULL,
    descricao text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE pulso_automation.automation_queue (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    tipo text NOT NULL,
    payload jsonb NOT NULL DEFAULT '{}'::jsonb,
    status text NOT NULL DEFAULT 'PENDENTE'::text,
    tentativas integer NOT NULL DEFAULT 0,
    max_tentativas integer NOT NULL DEFAULT 3,
    proximo_retry timestamp with time zone,
    erro_ultimo text,
    erro_historico jsonb DEFAULT '[]'::jsonb,
    scheduled_at timestamp with time zone NOT NULL DEFAULT now(),
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    resultado jsonb,
    origem text DEFAULT 'pg_cron'::text,
    referencia_id uuid,
    referencia_tipo text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE pulso_automation.workflow_execucoes (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    workflow_id uuid NOT NULL,
    entidade_tipo character varying(50),
    entidade_id uuid,
    status character varying(50) NOT NULL,
    mensagem text,
    payload_entrada jsonb,
    payload_saida jsonb,
    inicio_em timestamp without time zone DEFAULT timezone('utc'::text, now()),
    fim_em timestamp without time zone,
    criado_por uuid
);

CREATE TABLE pulso_automation.workflows (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    nome character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    descricao text,
    origem character varying(50) DEFAULT 'N8N'::character varying,
    referencia_externa character varying(255),
    ativo boolean NOT NULL DEFAULT true,
    configuracao jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp without time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE pulso_content.audios (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    ideia_id uuid NOT NULL,
    roteiro_id uuid,
    storage_path text NOT NULL,
    public_url text NOT NULL,
    duracao_segundos integer,
    linguagem text DEFAULT 'pt-BR'::text,
    formato text DEFAULT 'audio/mp3'::text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    canal_id uuid,
    tipo text,
    url text NOT NULL,
    status text,
    personagem_id uuid,
    qualidade_voz_ia numeric,
    tamanho_bytes bigint,
    voz_id text
);

CREATE TABLE pulso_content.canais_personagens (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    canal_id uuid NOT NULL,
    personagem_id uuid NOT NULL,
    funcao text NOT NULL,
    ordem smallint NOT NULL DEFAULT 1,
    ativo boolean NOT NULL DEFAULT true
);

CREATE TABLE pulso_content.conteudo_variantes (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    conteudo_id uuid NOT NULL,
    nome_variacao character varying(100) NOT NULL,
    plataforma_tipo pulso_plataforma_tipo,
    status pulso_status_conteudo NOT NULL DEFAULT 'RASCUNHO'::pulso_status_conteudo,
    titulo_publico character varying(255),
    descricao_publica text,
    legenda text,
    hashtags text[],
    linguagem character varying(10) DEFAULT 'pt-BR'::character varying,
    ordem_exibicao integer,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp without time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE pulso_content.conteudos (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    canal_id uuid,
    serie_id uuid,
    roteiro_id uuid,
    titulo_interno character varying(255) NOT NULL,
    sinopse text,
    status pulso_status_conteudo NOT NULL DEFAULT 'RASCUNHO'::pulso_status_conteudo,
    linguagem character varying(10) DEFAULT 'pt-BR'::character varying,
    ordem_na_serie integer,
    tags text[],
    metadata jsonb DEFAULT '{}'::jsonb,
    criado_por uuid,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp without time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE pulso_content.feedbacks (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    entidade_tipo text NOT NULL,
    entidade_id uuid NOT NULL,
    avaliador_tipo text,
    avaliador_id text,
    nota numeric,
    aprovado boolean,
    qualidade_conteudo numeric,
    potencial_viral numeric,
    originalidade numeric,
    clareza numeric,
    engajamento_esperado numeric,
    comentario text,
    sugestoes text,
    pontos_fortes text[],
    pontos_fracos text[],
    tags text[],
    categoria_feedback text,
    views_reais integer,
    likes_reais integer,
    shares_reais integer,
    comentarios_reais integer,
    tempo_medio_visualizacao numeric,
    taxa_retencao numeric,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE pulso_content.ideias (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    canal_id uuid,
    serie_id uuid,
    titulo character varying(255) NOT NULL,
    descricao text,
    origem character varying(100),
    prioridade integer DEFAULT 3,
    status pulso_status_ideia NOT NULL DEFAULT 'RASCUNHO'::pulso_status_ideia,
    tags text[],
    linguagem character varying(10) DEFAULT 'pt-BR'::character varying,
    criado_por uuid,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp without time zone DEFAULT timezone('utc'::text, now()),
    personagem_sugerido_id uuid,
    nota_ia_inicial numeric,
    potencial_viral_ia numeric
);

CREATE TABLE pulso_content.logs_workflows (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    workflow_name text NOT NULL,
    status text NOT NULL,
    detalhes jsonb DEFAULT '{}'::jsonb,
    erro_mensagem text,
    tempo_execucao_ms integer,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE pulso_content.metricas_publicacao (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    ideia_id uuid,
    roteiro_id uuid,
    plataforma text NOT NULL,
    url_publicacao text,
    post_id text,
    data_publicacao timestamp with time zone NOT NULL,
    hora_publicacao text,
    dia_semana integer,
    views integer DEFAULT 0,
    likes integer DEFAULT 0,
    dislikes integer DEFAULT 0,
    shares integer DEFAULT 0,
    comentarios integer DEFAULT 0,
    saves integer DEFAULT 0,
    tempo_medio_visualizacao numeric,
    taxa_retencao numeric,
    taxa_cliques numeric,
    taxa_conversao numeric,
    views_24h integer,
    views_7dias integer,
    views_30dias integer,
    performance_vs_media text,
    percentil integer,
    pais_principal text,
    idade_principal text,
    genero_principal text,
    receita_estimada numeric,
    cpm numeric,
    metadata jsonb DEFAULT '{}'::jsonb,
    ultima_atualizacao timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE pulso_content.personagens (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    nome text NOT NULL,
    slug text NOT NULL,
    tipo text NOT NULL,
    genero text,
    idioma text DEFAULT 'pt-BR'::text,
    tom text,
    idade_aproximada text,
    voz_id text,
    avatar_id text,
    provedor text,
    metadata jsonb DEFAULT '{}'::jsonb,
    total_usos integer DEFAULT 0,
    ultima_utilizacao timestamp with time zone,
    ativo boolean DEFAULT true,
    custo_por_uso numeric,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE pulso_content.pipeline_producao (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    ideia_id uuid NOT NULL,
    roteiro_id uuid,
    audio_id uuid,
    video_id uuid,
    status text NOT NULL DEFAULT 'AGUARDANDO_ROTEIRO'::text,
    prioridade integer DEFAULT 5,
    data_prevista timestamp with time zone,
    data_publicacao timestamp with time zone,
    responsavel text,
    observacoes text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    data_lancamento date,
    data_publicacao_planejada timestamp without time zone,
    is_piloto boolean NOT NULL DEFAULT false,
    conteudo_variantes_id uuid
);

CREATE TABLE pulso_content.pipeline_producao_backup_20251126 (
    id uuid,
    ideia_id uuid,
    roteiro_id uuid,
    audio_id uuid,
    video_id uuid,
    status text,
    prioridade integer,
    data_prevista timestamp with time zone,
    data_publicacao timestamp with time zone,
    responsavel text,
    observacoes text,
    metadata jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    data_lancamento date,
    data_publicacao_planejada timestamp without time zone
);

CREATE TABLE pulso_content.plano_publicacao (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    canal_id uuid NOT NULL,
    serie_id uuid,
    data_inicio date NOT NULL DEFAULT '2025-12-01'::date,
    intervalo_dias integer NOT NULL DEFAULT 2,
    hora_publicacao time without time zone NOT NULL DEFAULT '20:00:00'::time without time zone,
    ativo boolean NOT NULL DEFAULT true
);

CREATE TABLE pulso_content.roteiros (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    ideia_id uuid,
    titulo character varying(255) NOT NULL,
    versao integer NOT NULL DEFAULT 1,
    conteudo_md text NOT NULL,
    duracao_estimado_segundos integer,
    status pulso_status_roteiro NOT NULL DEFAULT 'RASCUNHO'::pulso_status_roteiro,
    linguagem character varying(10) DEFAULT 'pt-BR'::character varying,
    criado_por uuid,
    revisado_por uuid,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp without time zone DEFAULT timezone('utc'::text, now()),
    canal_id uuid,
    categoria_metadata text,
    personagem_id uuid,
    nota_qualidade_ia numeric
);

CREATE TABLE pulso_content.roteiros_renders (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    roteiro_id uuid NOT NULL,
    asset_id uuid,
    tipo_render text NOT NULL,
    provedor text NOT NULL,
    status text NOT NULL DEFAULT 'PENDENTE'::text,
    created_at timestamp without time zone NOT NULL DEFAULT now(),
    updated_at timestamp without time zone NOT NULL DEFAULT now(),
    detalhes jsonb DEFAULT '{}'::jsonb
);

CREATE TABLE pulso_content.thumbnails (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    ideia_id uuid,
    roteiro_id uuid,
    storage_path text NOT NULL,
    public_url text,
    bucket_name text DEFAULT 'thumbnails'::text,
    largura_px integer,
    altura_px integer,
    formato text,
    tamanho_bytes bigint,
    tipo_geracao text,
    prompt_usado text,
    modelo_ia text,
    provedor text,
    titulo_texto text,
    estilo text,
    cores_principais text[],
    versao integer DEFAULT 1,
    variante text,
    is_principal boolean DEFAULT false,
    metadata jsonb DEFAULT '{}'::jsonb,
    clicks integer DEFAULT 0,
    impressoes integer DEFAULT 0,
    ctr numeric,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE pulso_content.videos (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    ideia_id uuid NOT NULL,
    roteiro_id uuid,
    storage_path text NOT NULL,
    public_url text NOT NULL,
    duracao_segundos integer,
    resolucao text,
    formato text DEFAULT 'video/mp4'::text,
    plataforma_foco text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    canal_id uuid,
    tipo text,
    url text NOT NULL,
    status text,
    audio_id uuid,
    tamanho_bytes bigint,
    thumbnail_url text
);

CREATE TABLE pulso_content.workflow_queue (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    workflow_name text NOT NULL,
    payload jsonb NOT NULL,
    tentativas integer NOT NULL DEFAULT 0,
    max_tentativas integer NOT NULL DEFAULT 3,
    proximo_retry timestamp with time zone,
    erro_ultimo text,
    status text NOT NULL DEFAULT 'pendente'::text,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE pulso_core.canais (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    nome character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    descricao text,
    idioma character varying(10) DEFAULT 'pt-BR'::character varying,
    status pulso_status_geral NOT NULL DEFAULT 'ATIVO'::pulso_status_geral,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp without time zone DEFAULT timezone('utc'::text, now()),
    ordem_exibicao integer,
    eh_canal_principal boolean DEFAULT false,
    personagem_padrao_id uuid
);

CREATE TABLE pulso_core.canais_plataformas (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    canal_id uuid NOT NULL,
    plataforma_id uuid NOT NULL,
    identificador_externo character varying(255) NOT NULL,
    nome_exibicao character varying(255),
    url_canal text,
    ativo boolean NOT NULL DEFAULT true,
    configuracoes jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp without time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE pulso_core.configuracoes (
    chave text NOT NULL,
    valor text,
    tipo text,
    descricao text,
    categoria text,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by uuid
);

CREATE TABLE pulso_core.plataforma_credenciais (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    plataforma_id uuid NOT NULL,
    oauth_client_id text,
    oauth_client_secret text,
    access_token text,
    refresh_token text,
    token_expira_em timestamp with time zone,
    api_key text,
    api_secret text,
    webhook_url text,
    escopo text[],
    usuario_conectado text,
    data_autorizacao timestamp with time zone,
    ativo boolean DEFAULT true,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE pulso_core.plataformas (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    tipo pulso_plataforma_tipo NOT NULL,
    nome_exibicao character varying(255) NOT NULL,
    descricao text,
    ativo boolean NOT NULL DEFAULT true,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp without time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE pulso_core.series (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    canal_id uuid NOT NULL,
    nome character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    descricao text,
    status pulso_status_geral NOT NULL DEFAULT 'ATIVO'::pulso_status_geral,
    ordem_padrao integer,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp without time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE pulso_core.series_tags (
    serie_id uuid NOT NULL,
    tag_id uuid NOT NULL
);

CREATE TABLE pulso_core.tags (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    nome character varying(100) NOT NULL,
    slug character varying(150) NOT NULL,
    descricao text,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE pulso_core.usuarios_internos (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    auth_user_id uuid,
    nome character varying(200) NOT NULL,
    email character varying(200),
    papel character varying(100),
    ativo boolean NOT NULL DEFAULT true,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp without time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE pulso_distribution.posts (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    conteudo_variantes_id uuid NOT NULL,
    canal_plataforma_id uuid NOT NULL,
    status pulso_status_post NOT NULL DEFAULT 'AGENDADO'::pulso_status_post,
    titulo_publicado character varying(255),
    descricao_publicada text,
    legenda_publicada text,
    url_publicacao text,
    identificador_externo character varying(255),
    data_agendada timestamp without time zone,
    data_publicacao timestamp without time zone,
    data_remocao timestamp without time zone,
    metadata jsonb DEFAULT '{}'::jsonb,
    criado_por uuid,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp without time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE pulso_distribution.posts_logs (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    post_id uuid NOT NULL,
    tipo character varying(50) NOT NULL,
    mensagem text,
    payload jsonb,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now())
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
-- RLS HABILITADO (7): pulso_automation.ai_config, pulso_automation.automation_queue, pulso_content.audios, pulso_content.logs_workflows, pulso_content.workflow_queue, pulso_core.configuracoes, pulso_core.plataforma_credenciais
-- RLS DESABILITADO (29): pulso_analytics.eventos, pulso_analytics.metricas_diarias, pulso_assets.assets, pulso_assets.conteudo_variantes_assets, pulso_automation.workflow_execucoes, pulso_automation.workflows, pulso_content.canais_personagens, pulso_content.conteudo_variantes, pulso_content.conteudos, pulso_content.feedbacks, pulso_content.ideias, pulso_content.metricas_publicacao, pulso_content.personagens, pulso_content.pipeline_producao, pulso_content.pipeline_producao_backup_20251126, pulso_content.plano_publicacao, pulso_content.roteiros, pulso_content.roteiros_renders, pulso_content.thumbnails, pulso_content.videos, pulso_core.canais, pulso_core.canais_plataformas, pulso_core.plataformas, pulso_core.series, pulso_core.series_tags, pulso_core.tags, pulso_core.usuarios_internos, pulso_distribution.posts, pulso_distribution.posts_logs

-- POLICIES (20):
--   pulso_automation.ai_config  [SELECT]  ai_config_read
--   pulso_automation.ai_config  [ALL]  ai_config_write
--   pulso_automation.automation_queue  [SELECT]  automation_queue_read
--   pulso_automation.automation_queue  [ALL]  automation_queue_write
--   pulso_content.audios  [SELECT]  audios_select
--   pulso_content.ideias  [ALL]  Permitir tudo para todos
--   pulso_content.logs_workflows  [ALL]  Logs públicos escrita
--   pulso_content.logs_workflows  [SELECT]  Logs públicos leitura
--   pulso_content.pipeline_producao  [ALL]  Permitir tudo para todos
--   pulso_content.pipeline_producao  [ALL]  Pipeline público escrita
--   pulso_content.pipeline_producao  [SELECT]  Pipeline público leitura
--   pulso_content.roteiros  [ALL]  Permitir tudo para todos
--   pulso_content.workflow_queue  [ALL]  Fila publica escrita
--   pulso_content.workflow_queue  [SELECT]  Fila publica leitura
--   pulso_core.canais  [SELECT]  Permitir SELECT para todos
--   pulso_core.configuracoes  [ALL]  Configurações editáveis para authenticated
--   pulso_core.configuracoes  [SELECT]  Configurações visíveis para authenticated
--   pulso_core.plataforma_credenciais  [ALL]  Credenciais editáveis apenas para authenticated
--   pulso_core.plataforma_credenciais  [SELECT]  Credenciais visíveis apenas para authenticated
--   pulso_core.series  [SELECT]  Permitir SELECT para todos
