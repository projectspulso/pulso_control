# Banco - Ponto de Entrada

Esta pasta organiza a parte de banco em quatro camadas:

- leitura curada
- investigacao
- apoio tecnico
- acervo detalhado antigo

## Ler primeiro

1. `../00_MESTRE/TRILHA_OFICIAL_DE_EXECUCAO.md`
2. `MIGRATIONS_NECESSARIAS.md`
3. `INVESTIGACOES_BANCO.md`
4. `../../database/README.md`
5. `../../supabase/migrations/README_CLASSIFICACAO.md`

## Estrutura

- `MIGRATIONS_NECESSARIAS.md` -> o que parece necessario para o app atual
- `INVESTIGACOES_BANCO.md` -> perguntas e trilha de investigacao
- `PEDIDO_INVESTIGACAO_RUNTIME_MVP.md` -> pacote objetivo para validar o banco real do MVP
- `MAPA_CONSUMO_RUNTIME_MVP.md` -> o que o app realmente consome hoje
- `RESULTADO_INVESTIGACAO_RUNTIME_MVP_20260311.md` -> conclusao da investigacao ja executada
- `VALIDACAO_POS_MIGRATION_WORKFLOW_QUEUE.md` -> como validar a unica migration confirmada do runtime
- `RESULTADO_VALIDACAO_WORKFLOW_QUEUE_20260311.md` -> confirmacao de que a fila foi criada e validada no banco real
- `banco_de_dados.md` -> consolidado antigo de banco
- `apoio/` -> docs e SQLs de apoio
- `sql/` -> SQLs documentais que ficaram no acervo de docs
- `acervo_detalhado/` -> material detalhado legado de modelagem e verificacao

## Regra

Se houver conflito entre `database/sql/` e `supabase/migrations/`, nao executar nada no escuro. Primeiro usar os docs desta pasta para descobrir qual e a trilha oficial do ambiente.
