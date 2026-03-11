# Database - Ponto de Entrada

Esta pasta concentra tudo o que e banco, SQL, seeds, scripts de verificacao e apoio operacional.

## Estrutura

- `sql/README.md` -> mapa da linha SQL
- `sql/schema/` -> modelagem estrutural base
- `sql/seeds/` -> seeds e populacao
- `sql/migrations/` -> migracoes antigas da linha `database/sql`
- `sql/investigacao/` -> SQLs de apoio e verificacao
- `scripts/README.md` -> mapa da linha de scripts
- `scripts/diagnostico/` -> scripts JS/MJS para investigar banco
- `scripts/testes/` -> testes de conexao e acesso
- `scripts/integracoes/` -> testes e utilitarios de integracao
- `scripts/validacao_app/` -> validacoes ligadas ao app
- `../supabase/migrations/` -> migracoes operacionais reais usadas pelo projeto

## Ler primeiro

1. `../docs/00_MESTRE/TRILHA_OFICIAL_DE_EXECUCAO.md`
2. `../docs/20_BANCO/MIGRATIONS_NECESSARIAS.md`
3. `../docs/20_BANCO/INVESTIGACOES_BANCO.md`
4. `../docs/20_BANCO/PEDIDO_INVESTIGACAO_RUNTIME_MVP.md`
5. `../docs/20_BANCO/RESULTADO_INVESTIGACAO_RUNTIME_MVP_20260311.md`
6. `../docs/20_BANCO/VALIDACAO_POS_MIGRATION_WORKFLOW_QUEUE.md`
7. `../docs/20_BANCO/RESULTADO_VALIDACAO_WORKFLOW_QUEUE_20260311.md`
8. `sql/schema/001_pulso_schemas.sql`
9. `sql/schema/002_pulso_views.sql`
10. `sql/seeds/001_initial_data.sql`

## Regra

Nao assumir que `supabase/migrations/` e `database/sql/` contam a mesma historia sem conflito. Usar os docs em `docs/20_BANCO/` antes de executar qualquer lote.
