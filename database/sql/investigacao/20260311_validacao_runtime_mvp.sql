-- Pacote de investigacao do runtime do MVP
-- Data de referencia: 11 de marco de 2026
-- Objetivo: validar o que o app atual realmente precisa no banco real
-- Execute no Supabase SQL Editor e compartilhe os resultados por secao.

-- =====================================================
-- 1. POSTGREST E SCHEMAS EXPOSTOS
-- =====================================================
select
  current_setting('pgrst.db_schemas', true) as postgrest_schemas,
  current_setting('pgrst.db_extra_search_path', true) as postgrest_extra_search_path;

| postgrest_schemas | postgrest_extra_search_path |
| ----------------- | --------------------------- |
| null              | null                        |

-- =====================================================
-- 2. INVENTARIO DE OBJETOS CRITICOS DO RUNTIME
-- =====================================================
with objetos(schema_name, object_name, required_by) as (
  values
    ('public', 'canais', 'frontend core'),
    ('public', 'series', 'frontend core'),
    ('public', 'plataformas', 'settings'),
    ('public', 'plataformas_conectadas', 'settings'),
    ('public', 'configuracoes', 'settings'),
    ('public', 'tags', 'frontend core'),
    ('public', 'ideias', 'frontend CRUD'),
    ('public', 'roteiros', 'frontend CRUD'),
    ('public', 'workflows', 'monitor/workflows'),
    ('public', 'workflow_execucoes', 'monitor/workflows'),
    ('public', 'logs_workflows', 'monitor/analytics/webhook'),
    ('public', 'metricas_diarias', 'analytics MVP'),
    ('public', 'vw_pulso_calendario_publicacao_v2', 'calendario/analytics'),
    ('public', 'vw_pulso_pipeline_com_assets', 'assets legado em uso'),
    ('public', 'vw_pulso_pipeline_com_assets_v2', 'calendario/assets v2'),
    ('pulso_content', 'ideias', 'tabela base'),
    ('pulso_content', 'roteiros', 'tabela base'),
    ('pulso_content', 'pipeline_producao', 'pipeline MVP'),
    ('pulso_content', 'audios', 'assets/audio MVP'),
    ('pulso_content', 'logs_workflows', 'logs n8n'),
    ('pulso_content', 'workflow_queue', 'fila retry'),
    ('pulso_automation', 'workflows', 'automacao'),
    ('pulso_automation', 'workflow_execucoes', 'automacao'),
    ('pulso_analytics', 'metricas_diarias', 'analytics'),
    ('pulso_core', 'configuracoes', 'settings base'),
    ('pulso_core', 'plataforma_credenciais', 'oauth/credenciais')
)
select
  o.schema_name,
  o.object_name,
  case c.relkind
    when 'r' then 'table'
    when 'v' then 'view'
    when 'm' then 'materialized_view'
    when 'f' then 'foreign_table'
    else null
  end as object_type,
  case when c.oid is null then 'MISSING' else 'OK' end as status,
  o.required_by
from objetos o
left join pg_namespace n
  on n.nspname = o.schema_name
left join pg_class c
  on c.relnamespace = n.oid
 and c.relname = o.object_name
order by o.schema_name, o.object_name;

| schema_name      | object_name                       | object_type | status  | required_by               |
| ---------------- | --------------------------------- | ----------- | ------- | ------------------------- |
| public           | canais                            | view        | OK      | frontend core             |
| public           | configuracoes                     | view        | OK      | settings                  |
| public           | ideias                            | view        | OK      | frontend CRUD             |
| public           | logs_workflows                    | view        | OK      | monitor/analytics/webhook |
| public           | metricas_diarias                  | view        | OK      | analytics MVP             |
| public           | plataformas                       | view        | OK      | settings                  |
| public           | plataformas_conectadas            | view        | OK      | settings                  |
| public           | roteiros                          | view        | OK      | frontend CRUD             |
| public           | series                            | view        | OK      | frontend core             |
| public           | tags                              | view        | OK      | frontend core             |
| public           | vw_pulso_calendario_publicacao_v2 | view        | OK      | calendario/analytics      |
| public           | vw_pulso_pipeline_com_assets      | view        | OK      | assets legado em uso      |
| public           | vw_pulso_pipeline_com_assets_v2   | view        | OK      | calendario/assets v2      |
| public           | workflow_execucoes                | view        | OK      | monitor/workflows         |
| public           | workflows                         | view        | OK      | monitor/workflows         |
| pulso_analytics  | metricas_diarias                  | table       | OK      | analytics                 |
| pulso_automation | workflow_execucoes                | table       | OK      | automacao                 |
| pulso_automation | workflows                         | table       | OK      | automacao                 |
| pulso_content    | audios                            | table       | OK      | assets/audio MVP          |
| pulso_content    | ideias                            | table       | OK      | tabela base               |
| pulso_content    | logs_workflows                    | table       | OK      | logs n8n                  |
| pulso_content    | pipeline_producao                 | table       | OK      | pipeline MVP              |
| pulso_content    | roteiros                          | table       | OK      | tabela base               |
| pulso_content    | workflow_queue                    | null        | MISSING | fila retry                |
| pulso_core       | configuracoes                     | table       | OK      | settings base             |
| pulso_core       | plataforma_credenciais            | table       | OK      | oauth/credenciais         |


-- =====================================================
-- 3. COLUNAS DOS OBJETOS MAIS SENSIVEIS
-- =====================================================
with alvo(schema_name, table_name) as (
  values
    ('pulso_content', 'ideias'),
    ('pulso_content', 'roteiros'),
    ('pulso_content', 'pipeline_producao'),
    ('pulso_content', 'audios'),
    ('pulso_content', 'logs_workflows'),
    ('pulso_content', 'workflow_queue'),
    ('pulso_core', 'configuracoes'),
    ('pulso_core', 'plataforma_credenciais')
)
select
  a.schema_name,
  a.table_name,
  c.column_name,
  c.data_type,
  c.udt_name,
  c.is_nullable
from alvo a
left join information_schema.columns c
  on c.table_schema = a.schema_name
 and c.table_name = a.table_name
order by a.schema_name, a.table_name, c.ordinal_position;

| schema_name   | table_name             | column_name               | data_type                   | udt_name             | is_nullable |
| ------------- | ---------------------- | ------------------------- | --------------------------- | -------------------- | ----------- |
| pulso_content | audios                 | id                        | uuid                        | uuid                 | NO          |
| pulso_content | audios                 | ideia_id                  | uuid                        | uuid                 | NO          |
| pulso_content | audios                 | roteiro_id                | uuid                        | uuid                 | YES         |
| pulso_content | audios                 | storage_path              | text                        | text                 | NO          |
| pulso_content | audios                 | public_url                | text                        | text                 | NO          |
| pulso_content | audios                 | duracao_segundos          | integer                     | int4                 | YES         |
| pulso_content | audios                 | linguagem                 | text                        | text                 | YES         |
| pulso_content | audios                 | formato                   | text                        | text                 | YES         |
| pulso_content | audios                 | metadata                  | jsonb                       | jsonb                | YES         |
| pulso_content | audios                 | created_at                | timestamp with time zone    | timestamptz          | YES         |
| pulso_content | audios                 | updated_at                | timestamp with time zone    | timestamptz          | YES         |
| pulso_content | audios                 | canal_id                  | uuid                        | uuid                 | YES         |
| pulso_content | audios                 | tipo                      | text                        | text                 | YES         |
| pulso_content | audios                 | url                       | text                        | text                 | NO          |
| pulso_content | audios                 | status                    | text                        | text                 | YES         |
| pulso_content | audios                 | personagem_id             | uuid                        | uuid                 | YES         |
| pulso_content | audios                 | qualidade_voz_ia          | numeric                     | numeric              | YES         |
| pulso_content | audios                 | tamanho_bytes             | bigint                      | int8                 | YES         |
| pulso_content | audios                 | voz_id                    | text                        | text                 | YES         |
| pulso_content | ideias                 | id                        | uuid                        | uuid                 | NO          |
| pulso_content | ideias                 | canal_id                  | uuid                        | uuid                 | YES         |
| pulso_content | ideias                 | serie_id                  | uuid                        | uuid                 | YES         |
| pulso_content | ideias                 | titulo                    | character varying           | varchar              | NO          |
| pulso_content | ideias                 | descricao                 | text                        | text                 | YES         |
| pulso_content | ideias                 | origem                    | character varying           | varchar              | YES         |
| pulso_content | ideias                 | prioridade                | integer                     | int4                 | YES         |
| pulso_content | ideias                 | status                    | USER-DEFINED                | pulso_status_ideia   | NO          |
| pulso_content | ideias                 | tags                      | ARRAY                       | _text                | YES         |
| pulso_content | ideias                 | linguagem                 | character varying           | varchar              | YES         |
| pulso_content | ideias                 | criado_por                | uuid                        | uuid                 | YES         |
| pulso_content | ideias                 | metadata                  | jsonb                       | jsonb                | YES         |
| pulso_content | ideias                 | created_at                | timestamp without time zone | timestamp            | YES         |
| pulso_content | ideias                 | updated_at                | timestamp without time zone | timestamp            | YES         |
| pulso_content | ideias                 | personagem_sugerido_id    | uuid                        | uuid                 | YES         |
| pulso_content | ideias                 | nota_ia_inicial           | numeric                     | numeric              | YES         |
| pulso_content | ideias                 | potencial_viral_ia        | numeric                     | numeric              | YES         |
| pulso_content | logs_workflows         | id                        | uuid                        | uuid                 | NO          |
| pulso_content | logs_workflows         | workflow_name             | text                        | text                 | NO          |
| pulso_content | logs_workflows         | status                    | text                        | text                 | NO          |
| pulso_content | logs_workflows         | detalhes                  | jsonb                       | jsonb                | YES         |
| pulso_content | logs_workflows         | erro_mensagem             | text                        | text                 | YES         |
| pulso_content | logs_workflows         | tempo_execucao_ms         | integer                     | int4                 | YES         |
| pulso_content | logs_workflows         | created_at                | timestamp with time zone    | timestamptz          | YES         |
| pulso_content | pipeline_producao      | id                        | uuid                        | uuid                 | NO          |
| pulso_content | pipeline_producao      | ideia_id                  | uuid                        | uuid                 | NO          |
| pulso_content | pipeline_producao      | roteiro_id                | uuid                        | uuid                 | YES         |
| pulso_content | pipeline_producao      | audio_id                  | uuid                        | uuid                 | YES         |
| pulso_content | pipeline_producao      | video_id                  | uuid                        | uuid                 | YES         |
| pulso_content | pipeline_producao      | status                    | text                        | text                 | NO          |
| pulso_content | pipeline_producao      | prioridade                | integer                     | int4                 | YES         |
| pulso_content | pipeline_producao      | data_prevista             | timestamp with time zone    | timestamptz          | YES         |
| pulso_content | pipeline_producao      | data_publicacao           | timestamp with time zone    | timestamptz          | YES         |
| pulso_content | pipeline_producao      | responsavel               | text                        | text                 | YES         |
| pulso_content | pipeline_producao      | observacoes               | text                        | text                 | YES         |
| pulso_content | pipeline_producao      | metadata                  | jsonb                       | jsonb                | YES         |
| pulso_content | pipeline_producao      | created_at                | timestamp with time zone    | timestamptz          | YES         |
| pulso_content | pipeline_producao      | updated_at                | timestamp with time zone    | timestamptz          | YES         |
| pulso_content | pipeline_producao      | data_lancamento           | date                        | date                 | YES         |
| pulso_content | pipeline_producao      | data_publicacao_planejada | timestamp without time zone | timestamp            | YES         |
| pulso_content | pipeline_producao      | is_piloto                 | boolean                     | bool                 | NO          |
| pulso_content | pipeline_producao      | conteudo_variantes_id     | uuid                        | uuid                 | YES         |
| pulso_content | roteiros               | id                        | uuid                        | uuid                 | NO          |
| pulso_content | roteiros               | ideia_id                  | uuid                        | uuid                 | YES         |
| pulso_content | roteiros               | titulo                    | character varying           | varchar              | NO          |
| pulso_content | roteiros               | versao                    | integer                     | int4                 | NO          |
| pulso_content | roteiros               | conteudo_md               | text                        | text                 | NO          |
| pulso_content | roteiros               | duracao_estimado_segundos | integer                     | int4                 | YES         |
| pulso_content | roteiros               | status                    | USER-DEFINED                | pulso_status_roteiro | NO          |
| pulso_content | roteiros               | linguagem                 | character varying           | varchar              | YES         |
| pulso_content | roteiros               | criado_por                | uuid                        | uuid                 | YES         |
| pulso_content | roteiros               | revisado_por              | uuid                        | uuid                 | YES         |
| pulso_content | roteiros               | metadata                  | jsonb                       | jsonb                | YES         |
| pulso_content | roteiros               | created_at                | timestamp without time zone | timestamp            | YES         |
| pulso_content | roteiros               | updated_at                | timestamp without time zone | timestamp            | YES         |
| pulso_content | roteiros               | canal_id                  | uuid                        | uuid                 | YES         |
| pulso_content | roteiros               | categoria_metadata        | text                        | text                 | YES         |
| pulso_content | roteiros               | personagem_id             | uuid                        | uuid                 | YES         |
| pulso_content | roteiros               | nota_qualidade_ia         | numeric                     | numeric              | YES         |
| pulso_content | workflow_queue         | null                      | null                        | null                 | null        |
| pulso_core    | configuracoes          | chave                     | text                        | text                 | NO          |
| pulso_core    | configuracoes          | valor                     | text                        | text                 | YES         |
| pulso_core    | configuracoes          | tipo                      | text                        | text                 | YES         |
| pulso_core    | configuracoes          | descricao                 | text                        | text                 | YES         |
| pulso_core    | configuracoes          | categoria                 | text                        | text                 | YES         |
| pulso_core    | configuracoes          | updated_at                | timestamp with time zone    | timestamptz          | YES         |
| pulso_core    | configuracoes          | updated_by                | uuid                        | uuid                 | YES         |
| pulso_core    | plataforma_credenciais | id                        | uuid                        | uuid                 | NO          |
| pulso_core    | plataforma_credenciais | plataforma_id             | uuid                        | uuid                 | NO          |
| pulso_core    | plataforma_credenciais | oauth_client_id           | text                        | text                 | YES         |
| pulso_core    | plataforma_credenciais | oauth_client_secret       | text                        | text                 | YES         |
| pulso_core    | plataforma_credenciais | access_token              | text                        | text                 | YES         |
| pulso_core    | plataforma_credenciais | refresh_token             | text                        | text                 | YES         |
| pulso_core    | plataforma_credenciais | token_expira_em           | timestamp with time zone    | timestamptz          | YES         |
| pulso_core    | plataforma_credenciais | api_key                   | text                        | text                 | YES         |
| pulso_core    | plataforma_credenciais | api_secret                | text                        | text                 | YES         |
| pulso_core    | plataforma_credenciais | webhook_url               | text                        | text                 | YES         |
| pulso_core    | plataforma_credenciais | escopo                    | ARRAY                       | _text                | YES         |
| pulso_core    | plataforma_credenciais | usuario_conectado         | text                        | text                 | YES         |
| pulso_core    | plataforma_credenciais | data_autorizacao          | timestamp with time zone    | timestamptz          | YES         |
| pulso_core    | plataforma_credenciais | ativo                     | boolean                     | bool                 | YES         |
| pulso_core    | plataforma_credenciais | metadata                  | jsonb                       | jsonb                | YES         |
| pulso_core    | plataforma_credenciais | created_at                | timestamp with time zone    | timestamptz          | YES         |
| pulso_core    | plataforma_credenciais | updated_at                | timestamp with time zone    | timestamptz          | YES         |


-- =====================================================
-- 4. STATUS REAIS EM DADOS/TABELAS
-- =====================================================
create temp table if not exists tmp_status_inventory (
  origem text,
  status text,
  total bigint
);

truncate table tmp_status_inventory;

do $$
begin
  if to_regclass('pulso_content.ideias') is not null then
    execute '
      insert into tmp_status_inventory (origem, status, total)
      select ''pulso_content.ideias'', status::text, count(*)
      from pulso_content.ideias
      group by status
    ';
  else
    insert into tmp_status_inventory values ('pulso_content.ideias', '__MISSING__', null);
  end if;

  if to_regclass('pulso_content.roteiros') is not null then
    execute '
      insert into tmp_status_inventory (origem, status, total)
      select ''pulso_content.roteiros'', status::text, count(*)
      from pulso_content.roteiros
      group by status
    ';
  else
    insert into tmp_status_inventory values ('pulso_content.roteiros', '__MISSING__', null);
  end if;

  if to_regclass('pulso_content.pipeline_producao') is not null then
    execute '
      insert into tmp_status_inventory (origem, status, total)
      select ''pulso_content.pipeline_producao'', status::text, count(*)
      from pulso_content.pipeline_producao
      group by status
    ';
  else
    insert into tmp_status_inventory values ('pulso_content.pipeline_producao', '__MISSING__', null);
  end if;

  if to_regclass('pulso_content.audios') is not null then
    execute '
      insert into tmp_status_inventory (origem, status, total)
      select ''pulso_content.audios'', status::text, count(*)
      from pulso_content.audios
      group by status
    ';
  else
    insert into tmp_status_inventory values ('pulso_content.audios', '__MISSING__', null);
  end if;
end $$;

select origem, status, total
from tmp_status_inventory
order by origem, status;

| origem                          | status             | total |
| ------------------------------- | ------------------ | ----- |
| pulso_content.audios            | OK                 | 1     |
| pulso_content.ideias            | APROVADA           | 122   |
| pulso_content.ideias            | RASCUNHO           | 9     |
| pulso_content.pipeline_producao | AGUARDANDO_ROTEIRO | 126   |
| pulso_content.pipeline_producao | AUDIO_GERADO       | 1     |
| pulso_content.pipeline_producao | ROTEIRO_PRONTO     | 2     |
| pulso_content.roteiros          | APROVADO           | 3     |


-- =====================================================
-- 5. PERMISSOES E ACESSO VIA POSTGREST
-- =====================================================
with privilegios(schema_name, object_name, privilege_target) as (
  values
    ('public', 'ideias', 'select'),
    ('public', 'roteiros', 'select'),
    ('public', 'logs_workflows', 'select'),
    ('public', 'configuracoes', 'select'),
    ('public', 'plataformas_conectadas', 'select'),
    ('public', 'vw_pulso_calendario_publicacao_v2', 'select'),
    ('public', 'vw_pulso_pipeline_com_assets', 'select'),
    ('public', 'vw_pulso_pipeline_com_assets_v2', 'select'),
    ('pulso_content', 'pipeline_producao', 'select'),
    ('pulso_content', 'audios', 'select'),
    ('pulso_content', 'logs_workflows', 'insert'),
    ('pulso_content', 'workflow_queue', 'select')
)
select
  p.schema_name,
  p.object_name,
  p.privilege_target,
  has_schema_privilege('anon', p.schema_name, 'USAGE') as anon_schema_usage,
  case
    when to_regclass(format('%I.%I', p.schema_name, p.object_name)) is null then null
    else has_table_privilege(
      'anon',
      format('%I.%I', p.schema_name, p.object_name),
      upper(p.privilege_target)
    )
  end as anon_has_privilege,
  case
    when to_regclass(format('%I.%I', p.schema_name, p.object_name)) is null then null
    else has_table_privilege(
      'authenticated',
      format('%I.%I', p.schema_name, p.object_name),
      upper(p.privilege_target)
    )
  end as authenticated_has_privilege
from privilegios p
order by p.schema_name, p.object_name, p.privilege_target;

Error: Failed to run sql query: ERROR: 42P01: relation "pulso_content.workflow_queue" does not exist




-- =====================================================
-- 6. COMPATIBILIDADE DA VIEW DE ASSETS
-- =====================================================
select
  table_schema,
  table_name,
  column_name
from information_schema.columns
where (table_schema, table_name) in (
  ('public', 'vw_pulso_pipeline_com_assets'),
  ('public', 'vw_pulso_pipeline_com_assets_v2')
)
order by table_schema, table_name, ordinal_position;

| table_schema | table_name                      | column_name                |
| ------------ | ------------------------------- | -------------------------- |
| public       | vw_pulso_pipeline_com_assets    | pipeline_id                |
| public       | vw_pulso_pipeline_com_assets    | ideia_id                   |
| public       | vw_pulso_pipeline_com_assets    | roteiro_id                 |
| public       | vw_pulso_pipeline_com_assets    | audio_id                   |
| public       | vw_pulso_pipeline_com_assets    | video_id                   |
| public       | vw_pulso_pipeline_com_assets    | conteudo_variantes_id      |
| public       | vw_pulso_pipeline_com_assets    | pipeline_status            |
| public       | vw_pulso_pipeline_com_assets    | prioridade                 |
| public       | vw_pulso_pipeline_com_assets    | data_prevista              |
| public       | vw_pulso_pipeline_com_assets    | data_publicacao            |
| public       | vw_pulso_pipeline_com_assets    | data_publicacao_planejada  |
| public       | vw_pulso_pipeline_com_assets    | hora_publicacao            |
| public       | vw_pulso_pipeline_com_assets    | data_lancamento            |
| public       | vw_pulso_pipeline_com_assets    | responsavel                |
| public       | vw_pulso_pipeline_com_assets    | observacoes                |
| public       | vw_pulso_pipeline_com_assets    | pipeline_metadata          |
| public       | vw_pulso_pipeline_com_assets    | pipeline_created_at        |
| public       | vw_pulso_pipeline_com_assets    | pipeline_updated_at        |
| public       | vw_pulso_pipeline_com_assets    | ideia_titulo               |
| public       | vw_pulso_pipeline_com_assets    | ideia_descricao            |
| public       | vw_pulso_pipeline_com_assets    | ideia_origem               |
| public       | vw_pulso_pipeline_com_assets    | ideia_status               |
| public       | vw_pulso_pipeline_com_assets    | ideia_prioridade           |
| public       | vw_pulso_pipeline_com_assets    | ideia_tags                 |
| public       | vw_pulso_pipeline_com_assets    | ideia_linguagem            |
| public       | vw_pulso_pipeline_com_assets    | canal_id                   |
| public       | vw_pulso_pipeline_com_assets    | serie_id                   |
| public       | vw_pulso_pipeline_com_assets    | ideia_criado_por           |
| public       | vw_pulso_pipeline_com_assets    | ideia_metadata             |
| public       | vw_pulso_pipeline_com_assets    | ideia_created_at           |
| public       | vw_pulso_pipeline_com_assets    | ideia_updated_at           |
| public       | vw_pulso_pipeline_com_assets    | canal_nome                 |
| public       | vw_pulso_pipeline_com_assets    | canal_slug                 |
| public       | vw_pulso_pipeline_com_assets    | canal_descricao            |
| public       | vw_pulso_pipeline_com_assets    | canal_idioma               |
| public       | vw_pulso_pipeline_com_assets    | canal_status               |
| public       | vw_pulso_pipeline_com_assets    | canal_metadata             |
| public       | vw_pulso_pipeline_com_assets    | canal_created_at           |
| public       | vw_pulso_pipeline_com_assets    | canal_updated_at           |
| public       | vw_pulso_pipeline_com_assets    | serie_id_real              |
| public       | vw_pulso_pipeline_com_assets    | serie_nome                 |
| public       | vw_pulso_pipeline_com_assets    | serie_slug                 |
| public       | vw_pulso_pipeline_com_assets    | serie_descricao            |
| public       | vw_pulso_pipeline_com_assets    | serie_status               |
| public       | vw_pulso_pipeline_com_assets    | serie_ordem_padrao         |
| public       | vw_pulso_pipeline_com_assets    | serie_metadata             |
| public       | vw_pulso_pipeline_com_assets    | serie_created_at           |
| public       | vw_pulso_pipeline_com_assets    | serie_updated_at           |
| public       | vw_pulso_pipeline_com_assets    | conteudo_variantes_id_real |
| public       | vw_pulso_pipeline_com_assets    | conteudo_id                |
| public       | vw_pulso_pipeline_com_assets    | nome_variacao              |
| public       | vw_pulso_pipeline_com_assets    | plataforma_tipo            |
| public       | vw_pulso_pipeline_com_assets    | variante_status            |
| public       | vw_pulso_pipeline_com_assets    | titulo_publico             |
| public       | vw_pulso_pipeline_com_assets    | descricao_publica          |
| public       | vw_pulso_pipeline_com_assets    | legenda                    |
| public       | vw_pulso_pipeline_com_assets    | hashtags                   |
| public       | vw_pulso_pipeline_com_assets    | variante_linguagem         |
| public       | vw_pulso_pipeline_com_assets    | ordem_exibicao             |
| public       | vw_pulso_pipeline_com_assets    | variante_metadata          |
| public       | vw_pulso_pipeline_com_assets    | variante_created_at        |
| public       | vw_pulso_pipeline_com_assets    | variante_updated_at        |
| public       | vw_pulso_pipeline_com_assets    | asset_id                   |
| public       | vw_pulso_pipeline_com_assets    | asset_papel                |
| public       | vw_pulso_pipeline_com_assets    | asset_ordem                |
| public       | vw_pulso_pipeline_com_assets    | asset_tipo                 |
| public       | vw_pulso_pipeline_com_assets    | asset_nome                 |
| public       | vw_pulso_pipeline_com_assets    | asset_descricao            |
| public       | vw_pulso_pipeline_com_assets    | caminho_storage            |
| public       | vw_pulso_pipeline_com_assets    | provedor                   |
| public       | vw_pulso_pipeline_com_assets    | duracao_segundos           |
| public       | vw_pulso_pipeline_com_assets    | largura_px                 |
| public       | vw_pulso_pipeline_com_assets    | altura_px                  |
| public       | vw_pulso_pipeline_com_assets    | tamanho_bytes              |
| public       | vw_pulso_pipeline_com_assets    | hash_arquivo               |
| public       | vw_pulso_pipeline_com_assets    | asset_metadata             |
| public       | vw_pulso_pipeline_com_assets    | asset_criado_por           |
| public       | vw_pulso_pipeline_com_assets    | asset_created_at           |
| public       | vw_pulso_pipeline_com_assets    | asset_updated_at           |
| public       | vw_pulso_pipeline_com_assets_v2 | pipeline_id                |
| public       | vw_pulso_pipeline_com_assets_v2 | conteudo_variantes_id      |
| public       | vw_pulso_pipeline_com_assets_v2 | canal_nome                 |
| public       | vw_pulso_pipeline_com_assets_v2 | serie_nome                 |
| public       | vw_pulso_pipeline_com_assets_v2 | ideia_titulo               |
| public       | vw_pulso_pipeline_com_assets_v2 | ideia_status               |
| public       | vw_pulso_pipeline_com_assets_v2 | pipeline_status            |
| public       | vw_pulso_pipeline_com_assets_v2 | is_piloto                  |
| public       | vw_pulso_pipeline_com_assets_v2 | data_prevista              |
| public       | vw_pulso_pipeline_com_assets_v2 | data_publicacao_planejada  |
| public       | vw_pulso_pipeline_com_assets_v2 | hora_publicacao            |
| public       | vw_pulso_pipeline_com_assets_v2 | prioridade                 |
| public       | vw_pulso_pipeline_com_assets_v2 | pipeline_metadata          |
| public       | vw_pulso_pipeline_com_assets_v2 | asset_id                   |
| public       | vw_pulso_pipeline_com_assets_v2 | asset_tipo                 |
| public       | vw_pulso_pipeline_com_assets_v2 | caminho_storage            |
| public       | vw_pulso_pipeline_com_assets_v2 | provedor                   |
| public       | vw_pulso_pipeline_com_assets_v2 | duracao_segundos           |
| public       | vw_pulso_pipeline_com_assets_v2 | largura_px                 |
| public       | vw_pulso_pipeline_com_assets_v2 | altura_px                  |
| public       | vw_pulso_pipeline_com_assets_v2 | tamanho_bytes              |
| public       | vw_pulso_pipeline_com_assets_v2 | asset_metadata             |
| public       | vw_pulso_pipeline_com_assets_v2 | asset_papel                |
| public       | vw_pulso_pipeline_com_assets_v2 | asset_ordem                |

-- =====================================================
-- 7. CONTAGENS RAPIDAS
-- =====================================================
create temp table if not exists tmp_quick_counts (
  origem text,
  total bigint
);

truncate table tmp_quick_counts;

do $$
begin
  if to_regclass('public.ideias') is not null then
    execute 'insert into tmp_quick_counts select ''public.ideias'', count(*) from public.ideias';
  else
    insert into tmp_quick_counts values ('public.ideias', null);
  end if;

  if to_regclass('public.roteiros') is not null then
    execute 'insert into tmp_quick_counts select ''public.roteiros'', count(*) from public.roteiros';
  else
    insert into tmp_quick_counts values ('public.roteiros', null);
  end if;

  if to_regclass('public.logs_workflows') is not null then
    execute 'insert into tmp_quick_counts select ''public.logs_workflows'', count(*) from public.logs_workflows';
  else
    insert into tmp_quick_counts values ('public.logs_workflows', null);
  end if;

  if to_regclass('pulso_content.pipeline_producao') is not null then
    execute 'insert into tmp_quick_counts select ''pulso_content.pipeline_producao'', count(*) from pulso_content.pipeline_producao';
  else
    insert into tmp_quick_counts values ('pulso_content.pipeline_producao', null);
  end if;

  if to_regclass('pulso_content.audios') is not null then
    execute 'insert into tmp_quick_counts select ''pulso_content.audios'', count(*) from pulso_content.audios';
  else
    insert into tmp_quick_counts values ('pulso_content.audios', null);
  end if;
end $$;

select origem, total
from tmp_quick_counts
order by origem;

| origem                          | total |
| ------------------------------- | ----- |
| public.ideias                   | 131   |
| public.logs_workflows           | 77    |
| public.roteiros                 | 3     |
| pulso_content.audios            | 1     |
| pulso_content.pipeline_producao | 129   |
