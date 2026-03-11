# Scripts - Ponto de Entrada

Esta pasta organiza os scripts operacionais e de investigacao.

## Estrutura

- `diagnostico/` -> investigacao de schemas, colunas, views e canais
- `testes/` -> conexao, healthcheck e acessos ao banco
- `integracoes/` -> testes ligados a n8n e integracoes
- `validacao_app/` -> scripts de validacao ligados ao app

## Script recomendado agora

Depois da validacao da `workflow_queue`, usar:

- `validacao_app/smoke-runtime-mvp.js`

Objetivo:

- testar leitura com a mesma chave publica do app
- validar `ideias`, `workflow_queue`, `configuracoes` e `logs_workflows`
- detectar rapidamente drift entre banco real e runtime do frontend

## Regra

Antes de executar scripts daqui, confirmar variaveis de ambiente e o alvo certo do banco para nao misturar ambiente local, Supabase e producao.

## Revisao manual obrigatoria

Alguns scripts desta pasta carregam URLs, hosts ou valores fixos e nao devem ser executados no escuro:

- `integracoes/test-workflows.js`
- `integracoes/update-n8n-config.js`
- `integracoes/test-n8n-query.js`
- `validacao_app/test-frontend-exact.js`
