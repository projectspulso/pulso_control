-- Q1: Schemas "relevantes" (ignorando os internos do Postgres)
SELECT nspname AS schema*name
FROM pg_namespace
WHERE nspname NOT LIKE 'pg*%'
AND nspname NOT IN ('information_schema', 'pg_toast')
ORDER BY nspname;

| schema_name        |
| ------------------ |
| auth               |
| extensions         |
| graphql            |
| graphql_public     |
| public             |
| pulso_analytics    |
| pulso_assets       |
| pulso_automation   |
| pulso_content      |
| pulso_core         |
| pulso_distribution |
| realtime           |
| storage            |
| vault              |

-- Q2: Todas as tabelas de schemas de usuário
SELECT
table_schema,
table_name
FROM information_schema.tables
WHERE table_type = 'BASE TABLE'
AND table_schema NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
ORDER BY table_schema, table_name;

| table_schema       | table_name                 |
| ------------------ | -------------------------- |
| auth               | audit_log_entries          |
| auth               | flow_state                 |
| auth               | identities                 |
| auth               | instances                  |
| auth               | mfa_amr_claims             |
| auth               | mfa_challenges             |
| auth               | mfa_factors                |
| auth               | oauth_authorizations       |
| auth               | oauth_clients              |
| auth               | oauth_consents             |
| auth               | one_time_tokens            |
| auth               | refresh_tokens             |
| auth               | saml_providers             |
| auth               | saml_relay_states          |
| auth               | schema_migrations          |
| auth               | sessions                   |
| auth               | sso_domains                |
| auth               | sso_providers              |
| auth               | users                      |
| pulso_analytics    | eventos                    |
| pulso_analytics    | metricas_diarias           |
| pulso_assets       | assets                     |
| pulso_assets       | conteudo_variantes_assets  |
| pulso_automation   | workflow_execucoes         |
| pulso_automation   | workflows                  |
| pulso_content      | conteudo_variantes         |
| pulso_content      | conteudos                  |
| pulso_content      | ideias                     |
| pulso_content      | roteiros                   |
| pulso_core         | canais                     |
| pulso_core         | canais_plataformas         |
| pulso_core         | plataformas                |
| pulso_core         | series                     |
| pulso_core         | series_tags                |
| pulso_core         | tags                       |
| pulso_core         | usuarios_internos          |
| pulso_distribution | posts                      |
| pulso_distribution | posts_logs                 |
| realtime           | messages                   |
| realtime           | schema_migrations          |
| realtime           | subscription               |
| storage            | buckets                    |
| storage            | buckets_analytics          |
| storage            | buckets_vectors            |
| storage            | migrations                 |
| storage            | objects                    |
| storage            | prefixes                   |
| storage            | s3_multipart_uploads       |
| storage            | s3_multipart_uploads_parts |
| storage            | vector_indexes             |
| vault              | secrets                    |

-- Q3: Visão rápida de tamanho das tabelas
SELECT
schemaname AS schema_name,
relname AS table_name,
n_live_tup AS approx_rows
FROM pg_stat_user_tables
ORDER BY schemaname, relname;

| schema_name        | table_name                 | approx_rows |
| ------------------ | -------------------------- | ----------- |
| auth               | audit_log_entries          | 0           |
| auth               | flow_state                 | 0           |
| auth               | identities                 | 0           |
| auth               | instances                  | 0           |
| auth               | mfa_amr_claims             | 0           |
| auth               | mfa_challenges             | 0           |
| auth               | mfa_factors                | 0           |
| auth               | oauth_authorizations       | 0           |
| auth               | oauth_clients              | 0           |
| auth               | oauth_consents             | 0           |
| auth               | one_time_tokens            | 0           |
| auth               | refresh_tokens             | 0           |
| auth               | saml_providers             | 0           |
| auth               | saml_relay_states          | 0           |
| auth               | schema_migrations          | 69          |
| auth               | sessions                   | 0           |
| auth               | sso_domains                | 0           |
| auth               | sso_providers              | 0           |
| auth               | users                      | 0           |
| pulso_analytics    | eventos                    | 0           |
| pulso_analytics    | metricas_diarias           | 0           |
| pulso_assets       | assets                     | 0           |
| pulso_assets       | conteudo_variantes_assets  | 0           |
| pulso_automation   | workflow_execucoes         | 0           |
| pulso_automation   | workflows                  | 0           |
| pulso_content      | conteudo_variantes         | 0           |
| pulso_content      | conteudos                  | 0           |
| pulso_content      | ideias                     | 0           |
| pulso_content      | roteiros                   | 0           |
| pulso_core         | canais                     | 1           |
| pulso_core         | canais_plataformas         | 0           |
| pulso_core         | plataformas                | 6           |
| pulso_core         | series                     | 2           |
| pulso_core         | series_tags                | 0           |
| pulso_core         | tags                       | 6           |
| pulso_core         | usuarios_internos          | 0           |
| pulso_distribution | posts                      | 0           |
| pulso_distribution | posts_logs                 | 0           |
| realtime           | messages                   | 0           |
| realtime           | schema_migrations          | 65          |
| realtime           | subscription               | 0           |
| storage            | buckets                    | 0           |
| storage            | buckets_analytics          | 0           |
| storage            | buckets_vectors            | 0           |
| storage            | migrations                 | 49          |
| storage            | objects                    | 0           |
| storage            | prefixes                   | 0           |
| storage            | s3_multipart_uploads       | 0           |
| storage            | s3_multipart_uploads_parts | 0           |
| storage            | vector_indexes             | 0           |
| vault              | secrets                    | 0           |

-- Q4: Estrutura de TODAS as tabelas dos schemas pulso*\*
SELECT
table_schema,
table_name,
column_name,
data_type,
is_nullable,
column_default
FROM information_schema.columns
WHERE table_schema LIKE 'pulso*%'
ORDER BY table_schema, table_name, ordinal_position;

| table_schema       | table_name                | column_name               | data_type                   | is_nullable | column_default                       |
| ------------------ | ------------------------- | ------------------------- | --------------------------- | ----------- | ------------------------------------ |
| pulso_analytics    | eventos                   | id                        | uuid                        | NO          | gen_random_uuid()                    |
| pulso_analytics    | eventos                   | post_id                   | uuid                        | YES         | null                                 |
| pulso_analytics    | eventos                   | plataforma_id             | uuid                        | YES         | null                                 |
| pulso_analytics    | eventos                   | tipo                      | USER-DEFINED                | NO          | null                                 |
| pulso_analytics    | eventos                   | quantidade                | integer                     | NO          | 1                                    |
| pulso_analytics    | eventos                   | valor_numerico            | numeric                     | YES         | null                                 |
| pulso_analytics    | eventos                   | metadata                  | jsonb                       | YES         | '{}'::jsonb                          |
| pulso_analytics    | eventos                   | registrado_em             | timestamp without time zone | YES         | timezone('utc'::text, now())         |
| pulso_analytics    | eventos                   | data_evento               | date                        | NO          | (timezone('utc'::text, now()))::date |
| pulso_analytics    | metricas_diarias          | id                        | uuid                        | NO          | gen_random_uuid()                    |
| pulso_analytics    | metricas_diarias          | post_id                   | uuid                        | NO          | null                                 |
| pulso_analytics    | metricas_diarias          | plataforma_id             | uuid                        | YES         | null                                 |
| pulso_analytics    | metricas_diarias          | data_ref                  | date                        | NO          | null                                 |
| pulso_analytics    | metricas_diarias          | views                     | bigint                      | YES         | 0                                    |
| pulso_analytics    | metricas_diarias          | likes                     | bigint                      | YES         | 0                                    |
| pulso_analytics    | metricas_diarias          | deslikes                  | bigint                      | YES         | 0                                    |
| pulso_analytics    | metricas_diarias          | comentarios               | bigint                      | YES         | 0                                    |
| pulso_analytics    | metricas_diarias          | compartilhamentos         | bigint                      | YES         | 0                                    |
| pulso_analytics    | metricas_diarias          | cliques_link              | bigint                      | YES         | 0                                    |
| pulso_analytics    | metricas_diarias          | inscricoes                | bigint                      | YES         | 0                                    |
| pulso_analytics    | metricas_diarias          | watch_time_segundos       | bigint                      | YES         | 0                                    |
| pulso_analytics    | metricas_diarias          | metadata                  | jsonb                       | YES         | '{}'::jsonb                          |
| pulso_analytics    | metricas_diarias          | created_at                | timestamp without time zone | YES         | timezone('utc'::text, now())         |
| pulso_analytics    | metricas_diarias          | updated_at                | timestamp without time zone | YES         | timezone('utc'::text, now())         |
| pulso_assets       | assets                    | id                        | uuid                        | NO          | gen_random_uuid()                    |
| pulso_assets       | assets                    | tipo                      | USER-DEFINED                | NO          | null                                 |
| pulso_assets       | assets                    | nome                      | character varying           | YES         | null                                 |
| pulso_assets       | assets                    | descricao                 | text                        | YES         | null                                 |
| pulso_assets       | assets                    | caminho_storage           | text                        | NO          | null                                 |
| pulso_assets       | assets                    | provedor                  | character varying           | YES         | 'SUPABASE'::character varying        |
| pulso_assets       | assets                    | duracao_segundos          | integer                     | YES         | null                                 |
| pulso_assets       | assets                    | largura_px                | integer                     | YES         | null                                 |
| pulso_assets       | assets                    | altura_px                 | integer                     | YES         | null                                 |
| pulso_assets       | assets                    | tamanho_bytes             | bigint                      | YES         | null                                 |
| pulso_assets       | assets                    | hash_arquivo              | character varying           | YES         | null                                 |
| pulso_assets       | assets                    | metadata                  | jsonb                       | YES         | '{}'::jsonb                          |
| pulso_assets       | assets                    | criado_por                | uuid                        | YES         | null                                 |
| pulso_assets       | assets                    | created_at                | timestamp without time zone | YES         | timezone('utc'::text, now())         |
| pulso_assets       | assets                    | updated_at                | timestamp without time zone | YES         | timezone('utc'::text, now())         |
| pulso_assets       | conteudo_variantes_assets | conteudo_variantes_id     | uuid                        | NO          | null                                 |
| pulso_assets       | conteudo_variantes_assets | asset_id                  | uuid                        | NO          | null                                 |
| pulso_assets       | conteudo_variantes_assets | papel                     | character varying           | NO          | null                                 |
| pulso_assets       | conteudo_variantes_assets | ordem                     | integer                     | YES         | 1                                    |
| pulso_automation   | workflow_execucoes        | id                        | uuid                        | NO          | gen_random_uuid()                    |
| pulso_automation   | workflow_execucoes        | workflow_id               | uuid                        | NO          | null                                 |
| pulso_automation   | workflow_execucoes        | entidade_tipo             | character varying           | YES         | null                                 |
| pulso_automation   | workflow_execucoes        | entidade_id               | uuid                        | YES         | null                                 |
| pulso_automation   | workflow_execucoes        | status                    | character varying           | NO          | null                                 |
| pulso_automation   | workflow_execucoes        | mensagem                  | text                        | YES         | null                                 |
| pulso_automation   | workflow_execucoes        | payload_entrada           | jsonb                       | YES         | null                                 |
| pulso_automation   | workflow_execucoes        | payload_saida             | jsonb                       | YES         | null                                 |
| pulso_automation   | workflow_execucoes        | inicio_em                 | timestamp without time zone | YES         | timezone('utc'::text, now())         |
| pulso_automation   | workflow_execucoes        | fim_em                    | timestamp without time zone | YES         | null                                 |
| pulso_automation   | workflow_execucoes        | criado_por                | uuid                        | YES         | null                                 |
| pulso_automation   | workflows                 | id                        | uuid                        | NO          | gen_random_uuid()                    |
| pulso_automation   | workflows                 | nome                      | character varying           | NO          | null                                 |
| pulso_automation   | workflows                 | slug                      | character varying           | NO          | null                                 |
| pulso_automation   | workflows                 | descricao                 | text                        | YES         | null                                 |
| pulso_automation   | workflows                 | origem                    | character varying           | YES         | 'N8N'::character varying             |
| pulso_automation   | workflows                 | referencia_externa        | character varying           | YES         | null                                 |
| pulso_automation   | workflows                 | ativo                     | boolean                     | NO          | true                                 |
| pulso_automation   | workflows                 | configuracao              | jsonb                       | YES         | '{}'::jsonb                          |
| pulso_automation   | workflows                 | created_at                | timestamp without time zone | YES         | timezone('utc'::text, now())         |
| pulso_automation   | workflows                 | updated_at                | timestamp without time zone | YES         | timezone('utc'::text, now())         |
| pulso_content      | conteudo_variantes        | id                        | uuid                        | NO          | gen_random_uuid()                    |
| pulso_content      | conteudo_variantes        | conteudo_id               | uuid                        | NO          | null                                 |
| pulso_content      | conteudo_variantes        | nome_variacao             | character varying           | NO          | null                                 |
| pulso_content      | conteudo_variantes        | plataforma_tipo           | USER-DEFINED                | YES         | null                                 |
| pulso_content      | conteudo_variantes        | status                    | USER-DEFINED                | NO          | 'RASCUNHO'::pulso_status_conteudo    |
| pulso_content      | conteudo_variantes        | titulo_publico            | character varying           | YES         | null                                 |
| pulso_content      | conteudo_variantes        | descricao_publica         | text                        | YES         | null                                 |
| pulso_content      | conteudo_variantes        | legenda                   | text                        | YES         | null                                 |
| pulso_content      | conteudo_variantes        | hashtags                  | ARRAY                       | YES         | null                                 |
| pulso_content      | conteudo_variantes        | linguagem                 | character varying           | YES         | 'pt-BR'::character varying           |
| pulso_content      | conteudo_variantes        | ordem_exibicao            | integer                     | YES         | null                                 |
| pulso_content      | conteudo_variantes        | metadata                  | jsonb                       | YES         | '{}'::jsonb                          |
| pulso_content      | conteudo_variantes        | created_at                | timestamp without time zone | YES         | timezone('utc'::text, now())         |
| pulso_content      | conteudo_variantes        | updated_at                | timestamp without time zone | YES         | timezone('utc'::text, now())         |
| pulso_content      | conteudos                 | id                        | uuid                        | NO          | gen_random_uuid()                    |
| pulso_content      | conteudos                 | canal_id                  | uuid                        | YES         | null                                 |
| pulso_content      | conteudos                 | serie_id                  | uuid                        | YES         | null                                 |
| pulso_content      | conteudos                 | roteiro_id                | uuid                        | YES         | null                                 |
| pulso_content      | conteudos                 | titulo_interno            | character varying           | NO          | null                                 |
| pulso_content      | conteudos                 | sinopse                   | text                        | YES         | null                                 |
| pulso_content      | conteudos                 | status                    | USER-DEFINED                | NO          | 'RASCUNHO'::pulso_status_conteudo    |
| pulso_content      | conteudos                 | linguagem                 | character varying           | YES         | 'pt-BR'::character varying           |
| pulso_content      | conteudos                 | ordem_na_serie            | integer                     | YES         | null                                 |
| pulso_content      | conteudos                 | tags                      | ARRAY                       | YES         | null                                 |
| pulso_content      | conteudos                 | metadata                  | jsonb                       | YES         | '{}'::jsonb                          |
| pulso_content      | conteudos                 | criado_por                | uuid                        | YES         | null                                 |
| pulso_content      | conteudos                 | created_at                | timestamp without time zone | YES         | timezone('utc'::text, now())         |
| pulso_content      | conteudos                 | updated_at                | timestamp without time zone | YES         | timezone('utc'::text, now())         |
| pulso_content      | ideias                    | id                        | uuid                        | NO          | gen_random_uuid()                    |
| pulso_content      | ideias                    | canal_id                  | uuid                        | YES         | null                                 |
| pulso_content      | ideias                    | serie_id                  | uuid                        | YES         | null                                 |
| pulso_content      | ideias                    | titulo                    | character varying           | NO          | null                                 |
| pulso_content      | ideias                    | descricao                 | text                        | YES         | null                                 |
| pulso_content      | ideias                    | origem                    | character varying           | YES         | null                                 |
| pulso_content      | ideias                    | prioridade                | integer                     | YES         | 3                                    |
| pulso_content      | ideias                    | status                    | USER-DEFINED                | NO          | 'RASCUNHO'::pulso_status_ideia       |
| pulso_content      | ideias                    | tags                      | ARRAY                       | YES         | null                                 |
| pulso_content      | ideias                    | linguagem                 | character varying           | YES         | 'pt-BR'::character varying           |
| pulso_content      | ideias                    | criado_por                | uuid                        | YES         | null                                 |
| pulso_content      | ideias                    | metadata                  | jsonb                       | YES         | '{}'::jsonb                          |
| pulso_content      | ideias                    | created_at                | timestamp without time zone | YES         | timezone('utc'::text, now())         |
| pulso_content      | ideias                    | updated_at                | timestamp without time zone | YES         | timezone('utc'::text, now())         |
| pulso_content      | roteiros                  | id                        | uuid                        | NO          | gen_random_uuid()                    |
| pulso_content      | roteiros                  | ideia_id                  | uuid                        | YES         | null                                 |
| pulso_content      | roteiros                  | titulo                    | character varying           | NO          | null                                 |
| pulso_content      | roteiros                  | versao                    | integer                     | NO          | 1                                    |
| pulso_content      | roteiros                  | conteudo_md               | text                        | NO          | null                                 |
| pulso_content      | roteiros                  | duracao_estimado_segundos | integer                     | YES         | null                                 |
| pulso_content      | roteiros                  | status                    | USER-DEFINED                | NO          | 'RASCUNHO'::pulso_status_roteiro     |
| pulso_content      | roteiros                  | linguagem                 | character varying           | YES         | 'pt-BR'::character varying           |
| pulso_content      | roteiros                  | criado_por                | uuid                        | YES         | null                                 |
| pulso_content      | roteiros                  | revisado_por              | uuid                        | YES         | null                                 |
| pulso_content      | roteiros                  | metadata                  | jsonb                       | YES         | '{}'::jsonb                          |
| pulso_content      | roteiros                  | created_at                | timestamp without time zone | YES         | timezone('utc'::text, now())         |
| pulso_content      | roteiros                  | updated_at                | timestamp without time zone | YES         | timezone('utc'::text, now())         |
| pulso_core         | canais                    | id                        | uuid                        | NO          | gen_random_uuid()                    |
| pulso_core         | canais                    | nome                      | character varying           | NO          | null                                 |
| pulso_core         | canais                    | slug                      | character varying           | NO          | null                                 |
| pulso_core         | canais                    | descricao                 | text                        | YES         | null                                 |
| pulso_core         | canais                    | idioma                    | character varying           | YES         | 'pt-BR'::character varying           |
| pulso_core         | canais                    | status                    | USER-DEFINED                | NO          | 'ATIVO'::pulso_status_geral          |
| pulso_core         | canais                    | metadata                  | jsonb                       | YES         | '{}'::jsonb                          |
| pulso_core         | canais                    | created_at                | timestamp without time zone | YES         | timezone('utc'::text, now())         |
| pulso_core         | canais                    | updated_at                | timestamp without time zone | YES         | timezone('utc'::text, now())         |
| pulso_core         | canais_plataformas        | id                        | uuid                        | NO          | gen_random_uuid()                    |
| pulso_core         | canais_plataformas        | canal_id                  | uuid                        | NO          | null                                 |
| pulso_core         | canais_plataformas        | plataforma_id             | uuid                        | NO          | null                                 |
| pulso_core         | canais_plataformas        | identificador_externo     | character varying           | NO          | null                                 |
| pulso_core         | canais_plataformas        | nome_exibicao             | character varying           | YES         | null                                 |
| pulso_core         | canais_plataformas        | url_canal                 | text                        | YES         | null                                 |
| pulso_core         | canais_plataformas        | ativo                     | boolean                     | NO          | true                                 |
| pulso_core         | canais_plataformas        | configuracoes             | jsonb                       | YES         | '{}'::jsonb                          |
| pulso_core         | canais_plataformas        | created_at                | timestamp without time zone | YES         | timezone('utc'::text, now())         |
| pulso_core         | canais_plataformas        | updated_at                | timestamp without time zone | YES         | timezone('utc'::text, now())         |
| pulso_core         | plataformas               | id                        | uuid                        | NO          | gen_random_uuid()                    |
| pulso_core         | plataformas               | tipo                      | USER-DEFINED                | NO          | null                                 |
| pulso_core         | plataformas               | nome_exibicao             | character varying           | NO          | null                                 |
| pulso_core         | plataformas               | descricao                 | text                        | YES         | null                                 |
| pulso_core         | plataformas               | ativo                     | boolean                     | NO          | true                                 |
| pulso_core         | plataformas               | created_at                | timestamp without time zone | YES         | timezone('utc'::text, now())         |
| pulso_core         | plataformas               | updated_at                | timestamp without time zone | YES         | timezone('utc'::text, now())         |
| pulso_core         | series                    | id                        | uuid                        | NO          | gen_random_uuid()                    |
| pulso_core         | series                    | canal_id                  | uuid                        | NO          | null                                 |
| pulso_core         | series                    | nome                      | character varying           | NO          | null                                 |
| pulso_core         | series                    | slug                      | character varying           | NO          | null                                 |
| pulso_core         | series                    | descricao                 | text                        | YES         | null                                 |
| pulso_core         | series                    | status                    | USER-DEFINED                | NO          | 'ATIVO'::pulso_status_geral          |
| pulso_core         | series                    | ordem_padrao              | integer                     | YES         | null                                 |
| pulso_core         | series                    | metadata                  | jsonb                       | YES         | '{}'::jsonb                          |
| pulso_core         | series                    | created_at                | timestamp without time zone | YES         | timezone('utc'::text, now())         |
| pulso_core         | series                    | updated_at                | timestamp without time zone | YES         | timezone('utc'::text, now())         |
| pulso_core         | series_tags               | serie_id                  | uuid                        | NO          | null                                 |
| pulso_core         | series_tags               | tag_id                    | uuid                        | NO          | null                                 |
| pulso_core         | tags                      | id                        | uuid                        | NO          | gen_random_uuid()                    |
| pulso_core         | tags                      | nome                      | character varying           | NO          | null                                 |
| pulso_core         | tags                      | slug                      | character varying           | NO          | null                                 |
| pulso_core         | tags                      | descricao                 | text                        | YES         | null                                 |
| pulso_core         | tags                      | created_at                | timestamp without time zone | YES         | timezone('utc'::text, now())         |
| pulso_core         | usuarios_internos         | id                        | uuid                        | NO          | gen_random_uuid()                    |
| pulso_core         | usuarios_internos         | auth_user_id              | uuid                        | YES         | null                                 |
| pulso_core         | usuarios_internos         | nome                      | character varying           | NO          | null                                 |
| pulso_core         | usuarios_internos         | email                     | character varying           | YES         | null                                 |
| pulso_core         | usuarios_internos         | papel                     | character varying           | YES         | null                                 |
| pulso_core         | usuarios_internos         | ativo                     | boolean                     | NO          | true                                 |
| pulso_core         | usuarios_internos         | created_at                | timestamp without time zone | YES         | timezone('utc'::text, now())         |
| pulso_core         | usuarios_internos         | updated_at                | timestamp without time zone | YES         | timezone('utc'::text, now())         |
| pulso_distribution | posts                     | id                        | uuid                        | NO          | gen_random_uuid()                    |
| pulso_distribution | posts                     | conteudo_variantes_id     | uuid                        | NO          | null                                 |
| pulso_distribution | posts                     | canal_plataforma_id       | uuid                        | NO          | null                                 |
| pulso_distribution | posts                     | status                    | USER-DEFINED                | NO          | 'AGENDADO'::pulso_status_post        |
| pulso_distribution | posts                     | titulo_publicado          | character varying           | YES         | null                                 |
| pulso_distribution | posts                     | descricao_publicada       | text                        | YES         | null                                 |
| pulso_distribution | posts                     | legenda_publicada         | text                        | YES         | null                                 |
| pulso_distribution | posts                     | url_publicacao            | text                        | YES         | null                                 |
| pulso_distribution | posts                     | identificador_externo     | character varying           | YES         | null                                 |
| pulso_distribution | posts                     | data_agendada             | timestamp without time zone | YES         | null                                 |
| pulso_distribution | posts                     | data_publicacao           | timestamp without time zone | YES         | null                                 |
| pulso_distribution | posts                     | data_remocao              | timestamp without time zone | YES         | null                                 |
| pulso_distribution | posts                     | metadata                  | jsonb                       | YES         | '{}'::jsonb                          |
| pulso_distribution | posts                     | criado_por                | uuid                        | YES         | null                                 |
| pulso_distribution | posts                     | created_at                | timestamp without time zone | YES         | timezone('utc'::text, now())         |
| pulso_distribution | posts                     | updated_at                | timestamp without time zone | YES         | timezone('utc'::text, now())         |
| pulso_distribution | posts_logs                | id                        | uuid                        | NO          | gen_random_uuid()                    |
| pulso_distribution | posts_logs                | post_id                   | uuid                        | NO          | null                                 |
| pulso_distribution | posts_logs                | tipo                      | character varying           | NO          | null                                 |
| pulso_distribution | posts_logs                | mensagem                  | text                        | YES         | null                                 |
| pulso_distribution | posts_logs                | payload                   | jsonb                       | YES         | null                                 |
| pulso_distribution | posts_logs                | created_at                | timestamp without time zone | YES         | timezone('utc'::text, now())         |

-- Q5.1: canais
SELECT \*
FROM pulso_core.canais
ORDER BY created_at NULLS LAST, id
LIMIT 10;

| id                                   | nome          | slug          | descricao                                      | idioma | status | metadata | created_at                 | updated_at                 |
| ------------------------------------ | ------------- | ------------- | ---------------------------------------------- | ------ | ------ | -------- | -------------------------- | -------------------------- |
| c89417ab-ceb0-4a07-9eaf-9293219330e8 | Pulso Dark PT | pulso-dark-pt | Canal principal de conteúdos dark em português | pt-BR  | ATIVO  | {}       | 2025-11-19 23:21:51.658758 | 2025-11-19 23:21:51.658758 |

-- Q5.2: plataformas
SELECT \*
FROM pulso_core.plataformas
ORDER BY created_at NULLS LAST, id
LIMIT 10;

| id                                   | tipo            | nome_exibicao   | descricao                    | ativo | created_at                 | updated_at                 |
| ------------------------------------ | --------------- | --------------- | ---------------------------- | ----- | -------------------------- | -------------------------- |
| 02b97345-02c6-4e04-a654-1cbcb1a879f0 | INSTAGRAM_REELS | Instagram Reels | Reels do Instagram           | true  | 2025-11-19 23:21:51.658758 | 2025-11-19 23:21:51.658758 |
| 15b09439-1ce8-4952-89b6-9e94808c4900 | YOUTUBE_SHORTS  | YouTube Shorts  | Vídeos curtos do YouTube     | true  | 2025-11-19 23:21:51.658758 | 2025-11-19 23:21:51.658758 |
| 19ae3c55-1647-4389-8d2c-47f1461cb60b | YOUTUBE_LONGO   | YouTube         | Vídeos longos do YouTube     | true  | 2025-11-19 23:21:51.658758 | 2025-11-19 23:21:51.658758 |
| 62ef8a74-3d4e-425c-b9e4-a46cfa3a1f37 | KWAI            | Kwai            | Plataforma de vídeos curtos  | true  | 2025-11-19 23:21:51.658758 | 2025-11-19 23:21:51.658758 |
| 786f0628-42a2-47aa-8ef7-caf89a443468 | FACEBOOK_REELS  | Facebook Reels  | Reels do Facebook            | true  | 2025-11-19 23:21:51.658758 | 2025-11-19 23:21:51.658758 |
| cf51935a-02ec-48a9-8822-cfd86bb6e902 | TIKTOK          | TikTok          | Rede social de vídeos curtos | true  | 2025-11-19 23:21:51.658758 | 2025-11-19 23:21:51.658758 |

-- Q5.3: séries
SELECT \*
FROM pulso_core.series
ORDER BY created_at NULLS LAST, id
LIMIT 10;

| id                                   | canal_id                             | nome              | slug              | descricao                                                   | status | ordem_padrao | metadata | created_at                 | updated_at                 |
| ------------------------------------ | ------------------------------------ | ----------------- | ----------------- | ----------------------------------------------------------- | ------ | ------------ | -------- | -------------------------- | -------------------------- |
| ad0bb742-cd0b-4d17-98bf-e0a1c6ed7ae9 | c89417ab-ceb0-4a07-9eaf-9293219330e8 | Mistérios Urbanos | misterios-urbanos | Casos inexplicáveis e lendas urbanas                        | ATIVO  | 2            | {}       | 2025-11-19 23:21:51.658758 | 2025-11-19 23:21:51.658758 |
| bafbe38f-1a2d-4c36-82c9-52ca8bb19eab | c89417ab-ceb0-4a07-9eaf-9293219330e8 | Curiosidades Dark | curiosidades-dark | Série sobre fatos curiosos e obscuros da história e ciência | ATIVO  | 1            | {}       | 2025-11-19 23:21:51.658758 | 2025-11-19 23:21:51.658758 |

-- Q5.4: tags
SELECT \*
FROM pulso_core.tags
ORDER BY created_at NULLS LAST, id
LIMIT 20;

| id                                   | nome        | slug        | descricao                        | created_at                 |
| ------------------------------------ | ----------- | ----------- | -------------------------------- | -------------------------- |
| 4d2ee52e-e399-44bb-b162-0a2c8c44a1d7 | Cultura Pop | cultura-pop | Entretenimento e cultura         | 2025-11-19 23:21:51.658758 |
| 767667a4-2a48-42de-88bd-d39dce6515ed | Mistério    | misterio    | Casos e enigmas não resolvidos   | 2025-11-19 23:21:51.658758 |
| 9f242eb8-52b5-4ae3-a1db-343448453013 | Tecnologia  | tecnologia  | Tech e inovação                  | 2025-11-19 23:21:51.658758 |
| ade45710-3214-498e-ba2b-12affa8c9495 | História    | historia    | Conteúdos históricos             | 2025-11-19 23:21:51.658758 |
| b10523ee-f057-4348-9ac1-e7849daba954 | Ciência     | ciencia     | Fatos e curiosidades científicas | 2025-11-19 23:21:51.658758 |
| d1ed9aac-d10e-4d5f-8978-66a2086a3619 | True Crime  | true-crime  | Crimes reais                     | 2025-11-19 23:21:51.658758 |

-- Q6: Constraints das tabelas PULSO (PK, FK, UNIQUE)
SELECT
n.nspname AS schema*name,
c.relname AS table_name,
con.conname AS constraint_name,
con.contype AS constraint_type,
pg_get_constraintdef(con.oid) AS definition
FROM pg_constraint con
JOIN pg_class c ON c.oid = con.conrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname LIKE 'pulso*%'
ORDER BY schema_name, table_name, constraint_type, constraint_name;

| schema_name        | table_name                | constraint_name                                            | constraint_type | definition                                                                                             |
| ------------------ | ------------------------- | ---------------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------ |
| pulso_analytics    | eventos                   | eventos_plataforma_id_fkey                                 | f               | FOREIGN KEY (plataforma_id) REFERENCES pulso_core.plataformas(id) ON DELETE SET NULL                   |
| pulso_analytics    | eventos                   | eventos_post_id_fkey                                       | f               | FOREIGN KEY (post_id) REFERENCES pulso_distribution.posts(id) ON DELETE SET NULL                       |
| pulso_analytics    | eventos                   | eventos_pkey                                               | p               | PRIMARY KEY (id)                                                                                       |
| pulso_analytics    | metricas_diarias          | metricas_diarias_plataforma_id_fkey                        | f               | FOREIGN KEY (plataforma_id) REFERENCES pulso_core.plataformas(id) ON DELETE SET NULL                   |
| pulso_analytics    | metricas_diarias          | metricas_diarias_post_id_fkey                              | f               | FOREIGN KEY (post_id) REFERENCES pulso_distribution.posts(id) ON DELETE CASCADE                        |
| pulso_analytics    | metricas_diarias          | metricas_diarias_pkey                                      | p               | PRIMARY KEY (id)                                                                                       |
| pulso_analytics    | metricas_diarias          | metricas_diarias_post_id_data_ref_key                      | u               | UNIQUE (post_id, data_ref)                                                                             |
| pulso_assets       | assets                    | assets_criado_por_fkey                                     | f               | FOREIGN KEY (criado_por) REFERENCES pulso_core.usuarios_internos(id) ON DELETE SET NULL                |
| pulso_assets       | assets                    | assets_pkey                                                | p               | PRIMARY KEY (id)                                                                                       |
| pulso_assets       | conteudo_variantes_assets | conteudo_variantes_assets_asset_id_fkey                    | f               | FOREIGN KEY (asset_id) REFERENCES pulso_assets.assets(id) ON DELETE CASCADE                            |
| pulso_assets       | conteudo_variantes_assets | conteudo_variantes_assets_conteudo_variantes_id_fkey       | f               | FOREIGN KEY (conteudo_variantes_id) REFERENCES pulso_content.conteudo_variantes(id) ON DELETE CASCADE  |
| pulso_assets       | conteudo_variantes_assets | conteudo_variantes_assets_pkey                             | p               | PRIMARY KEY (conteudo_variantes_id, asset_id, papel)                                                   |
| pulso_automation   | workflow_execucoes        | workflow_execucoes_criado_por_fkey                         | f               | FOREIGN KEY (criado_por) REFERENCES pulso_core.usuarios_internos(id) ON DELETE SET NULL                |
| pulso_automation   | workflow_execucoes        | workflow_execucoes_workflow_id_fkey                        | f               | FOREIGN KEY (workflow_id) REFERENCES pulso_automation.workflows(id) ON DELETE CASCADE                  |
| pulso_automation   | workflow_execucoes        | workflow_execucoes_pkey                                    | p               | PRIMARY KEY (id)                                                                                       |
| pulso_automation   | workflows                 | workflows_pkey                                             | p               | PRIMARY KEY (id)                                                                                       |
| pulso_automation   | workflows                 | workflows_slug_key                                         | u               | UNIQUE (slug)                                                                                          |
| pulso_content      | conteudo_variantes        | conteudo_variantes_conteudo_id_fkey                        | f               | FOREIGN KEY (conteudo_id) REFERENCES pulso_content.conteudos(id) ON DELETE CASCADE                     |
| pulso_content      | conteudo_variantes        | conteudo_variantes_pkey                                    | p               | PRIMARY KEY (id)                                                                                       |
| pulso_content      | conteudos                 | conteudos_canal_id_fkey                                    | f               | FOREIGN KEY (canal_id) REFERENCES pulso_core.canais(id) ON DELETE SET NULL                             |
| pulso_content      | conteudos                 | conteudos_criado_por_fkey                                  | f               | FOREIGN KEY (criado_por) REFERENCES pulso_core.usuarios_internos(id) ON DELETE SET NULL                |
| pulso_content      | conteudos                 | conteudos_roteiro_id_fkey                                  | f               | FOREIGN KEY (roteiro_id) REFERENCES pulso_content.roteiros(id) ON DELETE SET NULL                      |
| pulso_content      | conteudos                 | conteudos_serie_id_fkey                                    | f               | FOREIGN KEY (serie_id) REFERENCES pulso_core.series(id) ON DELETE SET NULL                             |
| pulso_content      | conteudos                 | conteudos_pkey                                             | p               | PRIMARY KEY (id)                                                                                       |
| pulso_content      | ideias                    | ideias_canal_id_fkey                                       | f               | FOREIGN KEY (canal_id) REFERENCES pulso_core.canais(id) ON DELETE SET NULL                             |
| pulso_content      | ideias                    | ideias_criado_por_fkey                                     | f               | FOREIGN KEY (criado_por) REFERENCES pulso_core.usuarios_internos(id) ON DELETE SET NULL                |
| pulso_content      | ideias                    | ideias_serie_id_fkey                                       | f               | FOREIGN KEY (serie_id) REFERENCES pulso_core.series(id) ON DELETE SET NULL                             |
| pulso_content      | ideias                    | ideias_pkey                                                | p               | PRIMARY KEY (id)                                                                                       |
| pulso_content      | roteiros                  | roteiros_criado_por_fkey                                   | f               | FOREIGN KEY (criado_por) REFERENCES pulso_core.usuarios_internos(id) ON DELETE SET NULL                |
| pulso_content      | roteiros                  | roteiros_ideia_id_fkey                                     | f               | FOREIGN KEY (ideia_id) REFERENCES pulso_content.ideias(id) ON DELETE SET NULL                          |
| pulso_content      | roteiros                  | roteiros_revisado_por_fkey                                 | f               | FOREIGN KEY (revisado_por) REFERENCES pulso_core.usuarios_internos(id) ON DELETE SET NULL              |
| pulso_content      | roteiros                  | roteiros_pkey                                              | p               | PRIMARY KEY (id)                                                                                       |
| pulso_content      | roteiros                  | roteiros_ideia_id_versao_key                               | u               | UNIQUE (ideia_id, versao)                                                                              |
| pulso_core         | canais                    | canais_pkey                                                | p               | PRIMARY KEY (id)                                                                                       |
| pulso_core         | canais                    | canais_slug_key                                            | u               | UNIQUE (slug)                                                                                          |
| pulso_core         | canais_plataformas        | canais_plataformas_canal_id_fkey                           | f               | FOREIGN KEY (canal_id) REFERENCES pulso_core.canais(id) ON DELETE CASCADE                              |
| pulso_core         | canais_plataformas        | canais_plataformas_plataforma_id_fkey                      | f               | FOREIGN KEY (plataforma_id) REFERENCES pulso_core.plataformas(id) ON DELETE RESTRICT                   |
| pulso_core         | canais_plataformas        | canais_plataformas_pkey                                    | p               | PRIMARY KEY (id)                                                                                       |
| pulso_core         | canais_plataformas        | canais_plataformas_plataforma_id_identificador_externo_key | u               | UNIQUE (plataforma_id, identificador_externo)                                                          |
| pulso_core         | plataformas               | plataformas_pkey                                           | p               | PRIMARY KEY (id)                                                                                       |
| pulso_core         | plataformas               | plataformas_tipo_nome_exibicao_key                         | u               | UNIQUE (tipo, nome_exibicao)                                                                           |
| pulso_core         | series                    | series_canal_id_fkey                                       | f               | FOREIGN KEY (canal_id) REFERENCES pulso_core.canais(id) ON DELETE CASCADE                              |
| pulso_core         | series                    | series_pkey                                                | p               | PRIMARY KEY (id)                                                                                       |
| pulso_core         | series                    | series_canal_id_slug_key                                   | u               | UNIQUE (canal_id, slug)                                                                                |
| pulso_core         | series_tags               | series_tags_serie_id_fkey                                  | f               | FOREIGN KEY (serie_id) REFERENCES pulso_core.series(id) ON DELETE CASCADE                              |
| pulso_core         | series_tags               | series_tags_tag_id_fkey                                    | f               | FOREIGN KEY (tag_id) REFERENCES pulso_core.tags(id) ON DELETE CASCADE                                  |
| pulso_core         | series_tags               | series_tags_pkey                                           | p               | PRIMARY KEY (serie_id, tag_id)                                                                         |
| pulso_core         | tags                      | tags_pkey                                                  | p               | PRIMARY KEY (id)                                                                                       |
| pulso_core         | tags                      | tags_nome_key                                              | u               | UNIQUE (nome)                                                                                          |
| pulso_core         | tags                      | tags_slug_key                                              | u               | UNIQUE (slug)                                                                                          |
| pulso_core         | usuarios_internos         | usuarios_internos_pkey                                     | p               | PRIMARY KEY (id)                                                                                       |
| pulso_distribution | posts                     | posts_canal_plataforma_id_fkey                             | f               | FOREIGN KEY (canal_plataforma_id) REFERENCES pulso_core.canais_plataformas(id) ON DELETE RESTRICT      |
| pulso_distribution | posts                     | posts_conteudo_variantes_id_fkey                           | f               | FOREIGN KEY (conteudo_variantes_id) REFERENCES pulso_content.conteudo_variantes(id) ON DELETE RESTRICT |
| pulso_distribution | posts                     | posts_criado_por_fkey                                      | f               | FOREIGN KEY (criado_por) REFERENCES pulso_core.usuarios_internos(id) ON DELETE SET NULL                |
| pulso_distribution | posts                     | posts_pkey                                                 | p               | PRIMARY KEY (id)                                                                                       |
| pulso_distribution | posts_logs                | posts_logs_post_id_fkey                                    | f               | FOREIGN KEY (post_id) REFERENCES pulso_distribution.posts(id) ON DELETE CASCADE                        |
| pulso_distribution | posts_logs                | posts_logs_pkey                                            | p               | PRIMARY KEY (id)                                                                                       |
