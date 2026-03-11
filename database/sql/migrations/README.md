# Migrations - Linha database/sql

Esta pasta guarda migracoes antigas da linha `database/sql`.

## Importante

Ela nao e a mesma coisa que `supabase/migrations/`.

- `database/sql/migrations/` -> historico antigo e pontual desta linha
- `supabase/migrations/` -> historico operacional que o app foi exigindo

## Antes de usar

Ler:

1. `../../../docs/20_BANCO/MIGRATIONS_NECESSARIAS.md`
2. `../../../docs/20_BANCO/INVESTIGACOES_BANCO.md`
3. `../../../supabase/migrations/README_CLASSIFICACAO.md`

## Estado atual do runtime do MVP

A unica migration nova confirmada pela investigacao real de 11 de marco de 2026 e:

- `20260311_create_workflow_queue_runtime_mvp.sql`

Depois dela, validar:

- `../investigacao/20260311_validar_workflow_queue_pos_migration.sql`
