# SQL - Ponto de Entrada

Esta pasta agrupa a linha estrutural antiga de banco.

## Estrutura

- `schema/` -> schemas, tabelas, views-base
- `seeds/` -> populacao e scripts auxiliares
- `migrations/` -> migracoes antigas desta linha
- `investigacao/` -> SQLs de diagnostico copiados para organizacao

## Ler primeiro

1. `../../docs/20_BANCO/RESULTADO_INVESTIGACAO_RUNTIME_MVP_20260311.md`
2. `../../docs/20_BANCO/VALIDACAO_POS_MIGRATION_WORKFLOW_QUEUE.md`
3. `schema/001_pulso_schemas.sql`
4. `schema/002_pulso_views.sql`
5. `seeds/001_initial_data.sql`

## Regra

Esta pasta explica a intencao estrutural, mas nao substitui `supabase/migrations/` como retrato do ambiente operacional.
