-- Validacao pos-migration da workflow_queue
-- Data de referencia: 11 de marco de 2026
-- Execute depois de aplicar 20260311_create_workflow_queue_runtime_mvp.sql

-- =====================================================
-- 1. EXISTENCIA DO OBJETO
-- =====================================================
select
  to_regclass('pulso_content.workflow_queue') as workflow_queue_regclass;

-- Esperado:
-- workflow_queue_regclass = pulso_content.workflow_queue
| workflow_queue_regclass      |
| ---------------------------- |
| pulso_content.workflow_queue |

-- =====================================================
-- 2. COLUNAS E TIPOS
-- =====================================================
select
  column_name,
  data_type,
  udt_name,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'pulso_content'
  and table_name = 'workflow_queue'
order by ordinal_position;

-- Esperado:
-- id, workflow_name, payload, tentativas, max_tentativas,
-- proximo_retry, erro_ultimo, status, created_at

| column_name    | data_type                | udt_name    | is_nullable | column_default    |
| -------------- | ------------------------ | ----------- | ----------- | ----------------- |
| id             | uuid                     | uuid        | NO          | gen_random_uuid() |
| workflow_name  | text                     | text        | NO          | null              |
| payload        | jsonb                    | jsonb       | NO          | null              |
| tentativas     | integer                  | int4        | NO          | 0                 |
| max_tentativas | integer                  | int4        | NO          | 3                 |
| proximo_retry  | timestamp with time zone | timestamptz | YES         | null              |
| erro_ultimo    | text                     | text        | YES         | null              |
| status         | text                     | text        | NO          | 'pendente'::text  |
| created_at     | timestamp with time zone | timestamptz | NO          | now()             |


-- =====================================================
-- 3. PRIVILEGIOS BASICOS
-- =====================================================
select
  'anon' as role_name,
  has_table_privilege('anon', 'pulso_content.workflow_queue', 'select') as can_select,
  has_table_privilege('anon', 'pulso_content.workflow_queue', 'insert') as can_insert,
  has_table_privilege('anon', 'pulso_content.workflow_queue', 'update') as can_update,
  has_table_privilege('anon', 'pulso_content.workflow_queue', 'delete') as can_delete
union all
select
  'authenticated' as role_name,
  has_table_privilege('authenticated', 'pulso_content.workflow_queue', 'select') as can_select,
  has_table_privilege('authenticated', 'pulso_content.workflow_queue', 'insert') as can_insert,
  has_table_privilege('authenticated', 'pulso_content.workflow_queue', 'update') as can_update,
  has_table_privilege('authenticated', 'pulso_content.workflow_queue', 'delete') as can_delete;

-- Esperado:
-- privilegios coerentes com o uso do app no ambiente atual
| role_name     | can_select | can_insert | can_update | can_delete |
| ------------- | ---------- | ---------- | ---------- | ---------- |
| anon          | true       | true       | true       | true       |
| authenticated | true       | true       | true       | true       |

-- =====================================================
-- 4. TESTE TRANSACIONAL DE ESCRITA E LEITURA
-- =====================================================
begin;

insert into pulso_content.workflow_queue (
  workflow_name,
  payload,
  status
)
values (
  'WF_TESTE_RUNTIME_MVP',
  jsonb_build_object('origem', 'validacao_pos_migration', 'data_ref', now()),
  'pendente'
)
returning *;

select
  id,
  workflow_name,
  status,
  tentativas,
  max_tentativas,
  proximo_retry,
  erro_ultimo,
  created_at
from pulso_content.workflow_queue
where workflow_name = 'WF_TESTE_RUNTIME_MVP'
order by created_at desc
limit 1;

rollback;

-- Esperado:
-- insert e select funcionam sem erro
-- rollback remove o dado de teste

| id                                   | workflow_name        | status   | tentativas | max_tentativas | proximo_retry | erro_ultimo | created_at                    |
| ------------------------------------ | -------------------- | -------- | ---------- | -------------- | ------------- | ----------- | ----------------------------- |
| 8ed9db74-b91c-4422-a16d-9e37c3b18b69 | WF_TESTE_RUNTIME_MVP | pendente | 0          | 3              | null          | null        | 2026-03-11 11:56:04.667456+00 |


-- =====================================================
-- 5. CONTAGEM FINAL
-- =====================================================
select count(*) as total_itens_fila
from pulso_content.workflow_queue;

| total_itens_fila |
| ---------------- |
| 0                |