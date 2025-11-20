Visão geral dos schemas

Vou usar prefixo pulso\_ pra não bater com outros projetos que você já tem:

pulso_core → coisas centrais (canais, plataformas, séries, tags, perfis internos)

pulso_content → ideias, roteiros, conteúdos, variantes

pulso_assets → assets de áudio/vídeo/thumbs e vínculo com conteúdos

pulso_distribution → posts em cada plataforma, agendamentos, retornos de publicação

pulso_automation → workflows (n8n), execuções, logs

pulso_analytics → eventos brutos + métricas diárias agregadas

Você pode salvar o script abaixo em algo tipo:
database/sql/schema/001_pulso_schemas.sql

SCRIPT COMPLETO (criação de schemas + tabelas)
-- =====================================================================
-- PULSO – ESTRUTURA DE BANCO (SCHEMAS + TABELAS)
-- =====================================================================
-- Assumindo Supabase/Postgres com gen_random_uuid() disponível.
-- Se não estiver, ative a extensão pgcrypto ou ajuste para uuid_generate_v4().
-- =====================================================================

---

-- 1. CRIAÇÃO DOS SCHEMAS

---

create schema if not exists pulso_core;
create schema if not exists pulso_content;
create schema if not exists pulso_assets;
create schema if not exists pulso_distribution;
create schema if not exists pulso_automation;
create schema if not exists pulso_analytics;

---

-- 2. ENUMS / TIPOS AUXILIARES

---

-- situação de registro genérica
do $$
begin
  if not exists (select 1 from pg_type where typname = 'pulso_status_geral') then
    create type pulso_status_geral as enum ('ATIVO', 'INATIVO', 'ARQUIVADO');
  end if;
end$$;

-- status de ideia
do $$
begin
  if not exists (select 1 from pg_type where typname = 'pulso_status_ideia') then
    create type pulso_status_ideia as enum ('RASCUNHO', 'EM_DESENVOLVIMENTO', 'APROVADA', 'DESCARTADA');
  end if;
end$$;

-- status de roteiro
do $$
begin
  if not exists (select 1 from pg_type where typname = 'pulso_status_roteiro') then
    create type pulso_status_roteiro as enum ('RASCUNHO', 'EM_REVISAO', 'APROVADO', 'PUBLICADO', 'ARQUIVADO');
  end if;
end$$;

-- tipo de asset
do $$
begin
  if not exists (select 1 from pg_type where typname = 'pulso_tipo_asset') then
    create type pulso_tipo_asset as enum ('AUDIO', 'VIDEO', 'IMAGEM', 'TEXTO', 'OUTRO');
  end if;
end$$;

-- status de variante / peça de conteúdo
do $$
begin
  if not exists (select 1 from pg_type where typname = 'pulso_status_conteudo') then
    create type pulso_status_conteudo as enum (
      'RASCUNHO',
      'PRONTO_PARA_PRODUCAO',
      'EM_PRODUCAO',
      'PRONTO_PARA_PUBLICACAO',
      'PUBLICADO',
      'PAUSADO',
      'ARQUIVADO'
    );
  end if;
end$$;

-- plataformas suportadas (lógico, não o canal específico)
do $$
begin
  if not exists (select 1 from pg_type where typname = 'pulso_plataforma_tipo') then
    create type pulso_plataforma_tipo as enum (
      'YOUTUBE_SHORTS',
      'YOUTUBE_LONGO',
      'TIKTOK',
      'INSTAGRAM_REELS',
      'INSTAGRAM_FEED',
      'FACEBOOK_REELS',
      'KWAI',
      'OUTRO'
    );
  end if;
end$$;

-- status de post em plataforma
do $$
begin
  if not exists (select 1 from pg_type where typname = 'pulso_status_post') then
    create type pulso_status_post as enum (
      'AGENDADO',
      'PUBLICADO',
      'ERRO_PUBLICACAO',
      'CANCELADO'
    );
  end if;
end$$;

-- tipo de evento de analytics
do $$
begin
  if not exists (select 1 from pg_type where typname = 'pulso_tipo_evento_analytics') then
    create type pulso_tipo_evento_analytics as enum (
      'VIEW',
      'LIKE',
      'DESLIKE',
      'COMENTARIO',
      'COMPARTILHAMENTO',
      'CLIQUES_LINK',
      'INSCRICAO',
      'OUTRO'
    );
  end if;
end$$;

---

-- 3. SCHEMA pulso_core – base do ecossistema

---

-- canais lógicos (ex: Pulso Curiosidades PT, Pulso EN, etc.)
create table if not exists pulso_core.canais (
id uuid primary key default gen_random_uuid(),
nome varchar(255) not null,
slug varchar(255) not null unique,
descricao text,
idioma varchar(10) default 'pt-BR',
status pulso_status_geral not null default 'ATIVO',
metadata jsonb default '{}'::jsonb,
created_at timestamp without time zone default timezone('utc', now()),
updated_at timestamp without time zone default timezone('utc', now())
);

comment on table pulso_core.canais is 'Canais lógicos do ecossistema PULSO (ex.: Pulso PT, Pulso EN, etc.)';

-- plataformas (tipo + nome amigável)
create table if not exists pulso_core.plataformas (
id uuid primary key default gen_random_uuid(),
tipo pulso_plataforma_tipo not null,
nome_exibicao varchar(255) not null,
descricao text,
ativo boolean not null default true,
created_at timestamp without time zone default timezone('utc', now()),
updated_at timestamp without time zone default timezone('utc', now()),
unique (tipo, nome_exibicao)
);

comment on table pulso_core.plataformas is 'Tipos de plataformas suportadas (YouTube, TikTok, etc.).';

-- contas em plataformas (ex: canal do YouTube, conta do TikTok, etc.)
create table if not exists pulso_core.canais_plataformas (
id uuid primary key default gen_random_uuid(),
canal_id uuid not null references pulso_core.canais (id) on delete cascade,
plataforma_id uuid not null references pulso_core.plataformas (id) on delete restrict,
identificador_externo varchar(255) not null, -- ex: channel_id, @username, page_id
nome_exibicao varchar(255),
url_canal text,
ativo boolean not null default true,
configuracoes jsonb default '{}'::jsonb, -- tokens, escopos, etc. (guardar só o necessário)
created_at timestamp without time zone default timezone('utc', now()),
updated_at timestamp without time zone default timezone('utc', now()),
unique (plataforma_id, identificador_externo)
);

comment on table pulso_core.canais_plataformas is 'Mapeia um canal PULSO a contas específicas em cada plataforma.';

-- séries (coleções de episódios / temporadas)
create table if not exists pulso_core.series (
id uuid primary key default gen_random_uuid(),
canal_id uuid not null references pulso_core.canais (id) on delete cascade,
nome varchar(255) not null,
slug varchar(255) not null,
descricao text,
status pulso_status_geral not null default 'ATIVO',
ordem_padrao integer,
metadata jsonb default '{}'::jsonb,
created_at timestamp without time zone default timezone('utc', now()),
updated_at timestamp without time zone default timezone('utc', now()),
unique (canal_id, slug)
);

-- tags gerais para classificação
create table if not exists pulso_core.tags (
id uuid primary key default gen_random_uuid(),
nome varchar(100) not null unique,
slug varchar(150) not null unique,
descricao text,
created_at timestamp without time zone default timezone('utc', now())
);

-- ligação many-to-many série ↔ tags
create table if not exists pulso_core.series_tags (
serie_id uuid not null references pulso_core.series (id) on delete cascade,
tag_id uuid not null references pulso_core.tags (id) on delete cascade,
primary key (serie_id, tag_id)
);

-- perfis internos (opcional – para controle de responsável, autor etc.)
-- pode referenciar auth.users se quiser integrar login do Supabase
create table if not exists pulso_core.usuarios_internos (
id uuid primary key default gen_random_uuid(),
auth_user_id uuid, -- references auth.users (id) on delete set null,
nome varchar(200) not null,
email varchar(200),
papel varchar(100), -- ex.: 'ROTEIRISTA', 'EDITOR', 'GESTOR', etc.
ativo boolean not null default true,
created_at timestamp without time zone default timezone('utc', now()),
updated_at timestamp without time zone default timezone('utc', now())
);

---

-- 4. SCHEMA pulso_content – ideias, roteiros, conteúdos

---

-- ideias brutas de conteúdo
create table if not exists pulso_content.ideias (
id uuid primary key default gen_random_uuid(),
canal_id uuid references pulso_core.canais (id) on delete set null,
serie_id uuid references pulso_core.series (id) on delete set null,
titulo varchar(255) not null,
descricao text,
origem varchar(100), -- ex.: 'MANUAL', 'IA', 'TREND', etc.
prioridade integer default 3, -- 1 = alta, 5 = baixa
status pulso_status_ideia not null default 'RASCUNHO',
tags text[], -- tags livres (além de pulso_core.tags)
linguagem varchar(10) default 'pt-BR',
criado_por uuid references pulso_core.usuarios_internos (id) on delete set null,
metadata jsonb default '{}'::jsonb,
created_at timestamp without time zone default timezone('utc', now()),
updated_at timestamp without time zone default timezone('utc', now())
);

comment on table pulso_content.ideias is 'Banco de ideias brutas de conteúdo para os canais PULSO.';

-- roteiros (cada ideia pode ter 0..N roteiros)
create table if not exists pulso_content.roteiros (
id uuid primary key default gen_random_uuid(),
ideia_id uuid references pulso_content.ideias (id) on delete set null,
titulo varchar(255) not null,
versao integer not null default 1,
conteudo_md text not null, -- roteiro em markdown
duracao_estimado_segundos integer, -- previsão de duração
status pulso_status_roteiro not null default 'RASCUNHO',
linguagem varchar(10) default 'pt-BR',
criado_por uuid references pulso_core.usuarios_internos (id) on delete set null,
revisado_por uuid references pulso_core.usuarios_internos (id) on delete set null,
metadata jsonb default '{}'::jsonb,
created_at timestamp without time zone default timezone('utc', now()),
updated_at timestamp without time zone default timezone('utc', now()),
unique (ideia_id, versao)
);

comment on table pulso_content.roteiros is 'Roteiros derivados das ideias. Suporta versionamento por campo versao.';

-- "conteudo" = peça lógica, ex.: Episódio X da série Y
create table if not exists pulso_content.conteudos (
id uuid primary key default gen_random_uuid(),
canal_id uuid references pulso_core.canais (id) on delete set null,
serie_id uuid references pulso_core.series (id) on delete set null,
roteiro_id uuid references pulso_content.roteiros (id) on delete set null,
titulo_interno varchar(255) not null,
sinopse text,
status pulso_status_conteudo not null default 'RASCUNHO',
linguagem varchar(10) default 'pt-BR',
ordem_na_serie integer,
tags text[],
metadata jsonb default '{}'::jsonb,
criado_por uuid references pulso_core.usuarios_internos (id) on delete set null,
created_at timestamp without time zone default timezone('utc', now()),
updated_at timestamp without time zone default timezone('utc', now())
);

comment on table pulso_content.conteudos is 'Peças de conteúdo (episódios) ligadas a roteiros/séries/canais.';

-- variantes de conteúdo (A/B, cortes, versão PLATAFORMA)
create table if not exists pulso_content.conteudo_variantes (
id uuid primary key default gen_random_uuid(),
conteudo_id uuid not null references pulso_content.conteudos (id) on delete cascade,
nome_variacao varchar(100) not null, -- ex.: "Versão A", "Hook forte", "Corte 1"
plataforma_tipo pulso_plataforma_tipo, -- pode ser null se ainda não definido
status pulso_status_conteudo not null default 'RASCUNHO',
titulo_publico varchar(255),
descricao_publica text,
legenda text, -- texto final que vai na legenda da plataforma
hashtags text[],
linguagem varchar(10) default 'pt-BR',
ordem_exibicao integer,
metadata jsonb default '{}'::jsonb,
created_at timestamp without time zone default timezone('utc', now()),
updated_at timestamp without time zone default timezone('utc', now())
);

comment on table pulso_content.conteudo_variantes is 'Variações de um mesmo conteúdo (A/B, cortes, adaptações por plataforma).';

---

-- 5. SCHEMA pulso_assets – arquivos de mídia e vínculos

---

-- assets de mídia (armazenados no storage do Supabase, drive, etc.)
create table if not exists pulso_assets.assets (
id uuid primary key default gen_random_uuid(),
tipo pulso_tipo_asset not null,
nome varchar(255),
descricao text,
caminho_storage text not null, -- ex: path no Supabase Storage ou URL externa
provedor varchar(100) default 'SUPABASE', -- SUPABASE, DRIVE, EXTERNO, etc.
duracao_segundos integer, -- se for audio/video
largura_px integer,
altura_px integer,
tamanho_bytes bigint,
hash_arquivo varchar(255),
metadata jsonb default '{}'::jsonb,
criado_por uuid references pulso_core.usuarios_internos (id) on delete set null,
created_at timestamp without time zone default timezone('utc', now()),
updated_at timestamp without time zone default timezone('utc', now())
);

comment on table pulso_assets.assets is 'Cadastro de todos os assets de mídia (áudio, vídeo, thumbnails, etc.).';

-- vínculo entre variantes de conteúdo e assets
create table if not exists pulso_assets.conteudo_variantes_assets (
conteudo_variantes_id uuid not null references pulso_content.conteudo_variantes (id) on delete cascade,
asset_id uuid not null references pulso_assets.assets (id) on delete cascade,
papel varchar(50) not null, -- ex.: 'VIDEO_PRINCIPAL', 'AUDIO_TTS', 'THUMBNAIL', 'LEGENDAS'
ordem integer default 1,
primary key (conteudo_variantes_id, asset_id, papel)
);

---

-- 6. SCHEMA pulso_distribution – publicação em plataformas

---

-- posts em plataformas (cada linha = 1 publicação em 1 plataforma)
create table if not exists pulso_distribution.posts (
id uuid primary key default gen_random_uuid(),
conteudo_variantes_id uuid not null references pulso_content.conteudo_variantes (id) on delete restrict,
canal_plataforma_id uuid not null references pulso_core.canais_plataformas (id) on delete restrict,
status pulso_status_post not null default 'AGENDADO',
titulo_publicado varchar(255),
descricao_publicada text,
legenda_publicada text,
url_publicacao text,
identificador_externo varchar(255), -- id do vídeo/post na plataforma
data_agendada timestamp without time zone,
data_publicacao timestamp without time zone,
data_remocao timestamp without time zone,
metadata jsonb default '{}'::jsonb,
criado_por uuid references pulso_core.usuarios_internos (id) on delete set null,
created_at timestamp without time zone default timezone('utc', now()),
updated_at timestamp without time zone default timezone('utc', now())
);

comment on table pulso_distribution.posts is 'Registro de cada publicação concreta em uma plataforma.';

create index if not exists idx_posts_conteudo_var on pulso_distribution.posts (conteudo_variantes_id);
create index if not exists idx_posts_canal_plat on pulso_distribution.posts (canal_plataforma_id);
create index if not exists idx_posts_status on pulso_distribution.posts (status);
create index if not exists idx_posts_data_pub on pulso_distribution.posts (data_publicacao);

-- logs de retorno de APIs / erros de publicação
create table if not exists pulso_distribution.posts_logs (
id uuid primary key default gen_random_uuid(),
post_id uuid not null references pulso_distribution.posts (id) on delete cascade,
tipo varchar(50) not null, -- ex.: 'REQUEST', 'RESPONSE', 'ERRO'
mensagem text,
payload jsonb,
created_at timestamp without time zone default timezone('utc', now())
);

create index if not exists idx_posts_logs_post_id on pulso_distribution.posts_logs (post_id);

---

-- 7. SCHEMA pulso_automation – workflows e execuções

---

-- workflows cadastrados (espelho do n8n, mas sob controle do banco)
create table if not exists pulso_automation.workflows (
id uuid primary key default gen_random_uuid(),
nome varchar(255) not null,
slug varchar(255) not null unique,
descricao text,
origem varchar(50) default 'N8N', -- N8N, OUTRO
referencia_externa varchar(255), -- id do workflow no n8n
ativo boolean not null default true,
configuracao jsonb default '{}'::jsonb,
created_at timestamp without time zone default timezone('utc', now()),
updated_at timestamp without time zone default timezone('utc', now())
);

-- execuções de workflow (histórico)
create table if not exists pulso_automation.workflow_execucoes (
id uuid primary key default gen_random_uuid(),
workflow_id uuid not null references pulso_automation.workflows (id) on delete cascade,
entidade_tipo varchar(50), -- IDEIA, ROTEIRO, CONTEUDO, POST, etc.
entidade_id uuid,
status varchar(50) not null, -- SUCESSO, ERRO, EM_ANDAMENTO...
mensagem text,
payload_entrada jsonb,
payload_saida jsonb,
inicio_em timestamp without time zone default timezone('utc', now()),
fim_em timestamp without time zone,
criado_por uuid references pulso_core.usuarios_internos (id) on delete set null
);

create index if not exists idx_execucoes_workflow on pulso_automation.workflow_execucoes (workflow_id);
create index if not exists idx_execucoes_entidade on pulso_automation.workflow_execucoes (entidade_tipo, entidade_id);

---

-- 8. SCHEMA pulso_analytics – eventos e métricas

---

-- eventos brutos (coletados via APIs das plataformas / webhooks)
create table if not exists pulso_analytics.eventos (
id uuid primary key default gen_random_uuid(),
post_id uuid references pulso_distribution.posts (id) on delete set null,
plataforma_id uuid references pulso_core.plataformas (id) on delete set null,
tipo pulso_tipo_evento_analytics not null,
quantidade integer not null default 1,
valor_numerico numeric(18,4), -- para watch time, CTR, etc. se necessário
metadata jsonb default '{}'::jsonb,
registrado_em timestamp without time zone default timezone('utc', now()),
data_evento date not null default (timezone('utc', now())::date)
);

create index if not exists idx_eventos_post_id on pulso_analytics.eventos (post_id);
create index if not exists idx_eventos_tipo_data on pulso_analytics.eventos (tipo, data_evento);

-- métricas agregadas diárias por post + plataforma
create table if not exists pulso_analytics.metricas_diarias (
id uuid primary key default gen_random_uuid(),
post_id uuid not null references pulso_distribution.posts (id) on delete cascade,
plataforma_id uuid references pulso_core.plataformas (id) on delete set null,
data_ref date not null,
views bigint default 0,
likes bigint default 0,
deslikes bigint default 0,
comentarios bigint default 0,
compartilhamentos bigint default 0,
cliques_link bigint default 0,
inscricoes bigint default 0,
watch_time_segundos bigint default 0,
metadata jsonb default '{}'::jsonb,
created_at timestamp without time zone default timezone('utc', now()),
updated_at timestamp without time zone default timezone('utc', now()),
unique (post_id, data_ref)
);

create index if not exists idx_metricas_diarias_post_data on pulso_analytics.metricas_diarias (post_id, data_ref);

-- =====================================================================
-- FIM DO SCRIPT INICIAL DE SCHEMAS / TABELAS PULSO
-- =====================================================================
