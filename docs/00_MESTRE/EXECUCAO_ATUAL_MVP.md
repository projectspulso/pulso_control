# Execucao Atual do MVP

Data de referencia: 11 de marco de 2026

## Estado atual medido

### Dependencias

- `npm install` executado com sucesso
- 598 pacotes instalados
- 6 vulnerabilidades reportadas pelo `npm audit`

### Build

- `npm run build` executado com sucesso
- o app gera build de producao
- as rotas principais do app foram compiladas

### Lint

- `npm run lint` executado com sucesso
- resultado atual: `0 erros / 81 warnings`
- os warnings restantes ficaram concentrados em tipagem frouxa, imports sobrando e paginas nao centrais do MVP

## Decisao tecnica tomada

Para estabilizacao inicial do MVP:

- `any` foi rebaixado para warning no TypeScript do app
- arquivos gerados do Supabase passaram a ter tratamento especifico
- scripts legados, apoio tecnico e paginas de teste ficaram fora da trilha principal do lint

Motivo:

- separar bloqueador real de MVP de divida tecnica historica
- manter erro para problemas estruturais do app principal
- impedir que o legado esconda os problemas reais da superficie do produto

## Ajustes executados nesta etapa

- baseline tecnico completo rodado
- `app/page.tsx` ajustado para remover problema de `setState` em efeito
- `lib/supabase/server.ts` criado como cliente server unico com `SERVICE_ROLE_KEY`
- rotas server de ideias, roteiros e webhook migradas para o cliente server unico
- `app/api/debug/env/route.ts` deixou de ficar exposto fora de desenvolvimento, salvo override explicito
- `app/publicar/page.tsx` saiu do modo "auto-post total" e entrou em "publicacao assistida" com feedback inline
- `app/analytics/page.tsx` deixou de ser placeholder e virou painel minimo de validacao do MVP
- `components/ui/feedback-banner.tsx` e `components/ui/confirm-dialog.tsx` criados para padronizar feedback e confirmacoes
- `app/assets/page.tsx` deixou de depender de URL hardcoded de storage
- `app/ideias/[id]/page.tsx` saiu de `alert/confirm/prompt` e alinhou a rejeicao com o schema real via `ARQUIVADA`
- `app/roteiros/[id]/page.tsx` saiu de `alert/confirm/prompt` e alinhou a rejeicao com o schema real via `REVISAO`
- `app/ideias/nova/page.tsx` ganhou criacao manual mais consistente, com pre-selecao opcional de canal e feedback inline
- `app/canais/[slug]/page.tsx` ganhou filtro tipado, disparo assistido de geracao de ideias e navegacao direta para criar/abrir ideias
- `app/canais/page.tsx` foi alinhado ao schema real de canais
- `app/api/webhooks/workflow-completed/route.ts` passou a gravar direto em `pulso_content.logs_workflows`
- `lib/supabase/runtime-access.ts` passou a ter fallback seguro para leitura de logs
- `lib/hooks/use-workflow-queue.ts` foi alinhado ao contrato real esperado da fila e agora degrada sem quebrar o monitor enquanto a tabela nao existir
- `lib/hooks/use-plataformas.ts` passou a gravar configuracoes e credenciais nas tabelas reais de `pulso_core`
- `eslint.config.mjs` ajustado para foco na superficie do MVP
- scripts criticos de integracao e validacao deixaram de carregar URL/chave hardcoded
- `.env.example` passou a cobrir variaveis usadas por esses scripts
- a investigacao real do banco confirmou que a unica lacuna critica do runtime e `pulso_content.workflow_queue`
- `database/sql/migrations/20260311_create_workflow_queue_runtime_mvp.sql` foi criada como migration limpa e oficial desta etapa
- `database/sql/investigacao/20260311_validar_workflow_queue_pos_migration.sql` foi criado como pacote de validacao pos-migration
- a migration `workflow_queue` foi aplicada e validada no banco real
- a integracao com n8n saiu do browser direto e passou a ser roteada pelo servidor em `app/api/n8n/*`
- o runtime de webhook agora tenta caminhos compativeis do n8n antes de concluir que houve `404`
- a investigacao de storage mostrou que o bucket `audios` existe; o problema atual dos assets vem de `storage_path/public_url` gravados como `undefined`

## Leitura honesta

O produto esta mais perto do MVP do que parecia.

Nao por estar limpo, mas porque:

- a build passa
- o app principal compila
- os gargalos agora sao de estabilizacao e confiabilidade, nao de inexistencia
- a superficie principal deixou de depender de dialogs nativos do navegador para operacao critica

## Proximos bloqueadores P0

1. validar runtime real do app em `/monitor` e `/settings`
2. validar fluxo ponta a ponta com ambiente real de banco e n8n
3. corrigir a origem dos registros invalidos em `pulso_content.audios`
4. reduzir warnings de tipagem e limpeza nas paginas e hooks ainda nao tratados
5. registrar historico de aprovacoes, retries e sinais operacionais do workflow
