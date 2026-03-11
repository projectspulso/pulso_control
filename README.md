# PULSO Control

Centro de comando para operar videos curtos faceless com pipeline editorial, producao, publicacao assistida e integracoes com Supabase e n8n.

## Comece por aqui

- Documentacao mestre: [docs/README.md](./docs/README.md)
- Trilha oficial: [docs/00_MESTRE/TRILHA_OFICIAL_DE_EXECUCAO.md](./docs/00_MESTRE/TRILHA_OFICIAL_DE_EXECUCAO.md)
- Banco de dados: [database/README.md](./database/README.md)

## Estrutura principal

- `app/` -> app Next.js
- `components/` -> componentes de interface
- `lib/` -> hooks, APIs e integracoes
- `automation/` -> docs e materiais de n8n
- `n8n-workflows/` -> exports JSON dos workflows
- `database/` -> schema, seeds, scripts e investigacoes de banco
- `docs/` -> documentacao curada e acervo legado

## Leitura recomendada

1. `docs/README.md`
2. `docs/00_MESTRE/TRILHA_OFICIAL_DE_EXECUCAO.md`
3. `docs/00_MESTRE/ESTADO_ATUAL_E_FONTES_DE_VERDADE.md`
4. `docs/40_PRODUTO/README.md`
5. `docs/20_BANCO/MIGRATIONS_NECESSARIAS.md`

## Observacao

O repositorio ja tem bastante implementacao real de app e operacao, mas a documentacao antiga ainda convive com a nova camada curada. Para evitar ruido, use `docs/README.md` como ponto de entrada e `database/README.md` como ponto de entrada do banco.
