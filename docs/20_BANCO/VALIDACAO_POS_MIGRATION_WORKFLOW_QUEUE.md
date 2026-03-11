# Validacao Pos-Migration da Workflow Queue

Data de referencia: 11 de marco de 2026

## Objetivo

Validar de forma objetiva se a unica migration confirmada do runtime do MVP foi aplicada corretamente:

- `database/sql/migrations/20260311_create_workflow_queue_runtime_mvp.sql`

## Ordem de execucao

1. aplicar `database/sql/migrations/20260311_create_workflow_queue_runtime_mvp.sql`
2. rodar `database/sql/investigacao/20260311_validar_workflow_queue_pos_migration.sql`
3. confirmar os resultados abaixo

## O que precisa acontecer

### 1. O objeto precisa existir

Esperado:

- `to_regclass('pulso_content.workflow_queue')` retorna `pulso_content.workflow_queue`

### 2. As colunas precisam bater

Esperado:

- `id`
- `workflow_name`
- `payload`
- `tentativas`
- `max_tentativas`
- `proximo_retry`
- `erro_ultimo`
- `status`
- `created_at`

### 3. O status precisa aceitar o contrato do app

Esperado:

- `pendente`
- `processando`
- `falha`
- `sucesso`

### 4. O teste transacional precisa funcionar

Esperado:

- `insert` funciona
- `select` funciona
- `rollback` limpa o teste

### 5. As roles do app precisam enxergar a tabela

Esperado:

- `anon` consegue `select`, `insert`, `update` e `delete`
- `authenticated` consegue `select`, `insert`, `update` e `delete`

## Se algo falhar

### Se o objeto nao existir

Leitura:

- a migration nao foi aplicada
- ou foi aplicada em outro projeto/schema

### Se o insert falhar

Leitura:

- problema de policy, grant ou exposicao do schema
- revisar a propria migration e a exposicao do schema `pulso_content`

### Se o select falhar no app, mas funcionar no SQL Editor

Leitura:

- o problema nao e o objeto
- o problema passa a ser PostgREST, permissao por role ou drift de ambiente

## Proximo passo depois de validar

1. abrir `/monitor`
2. validar a superficie da fila no app
3. revisar se ainda existe qualquer erro ligado a `workflow_queue`
4. atualizar ou regenerar `lib/supabase/database.types.ts` quando a trilha de tipos for consolidada
