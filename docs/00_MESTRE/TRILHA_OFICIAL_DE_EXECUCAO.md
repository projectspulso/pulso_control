# Trilha Oficial de Execucao

## Objetivo

Este documento define a ordem oficial para um humano:

- entender o projeto
- configurar ambiente
- validar banco
- alinhar app com n8n
- executar o primeiro fluxo funcional
- decidir se o MVP segue ou para

## Regra zero

Antes de qualquer acao:

1. nao rodar lotes cegos de SQL
2. nao confiar em doc antigo sem confrontar com `app/`, `lib/` e `supabase/migrations/`
3. nao usar scripts com host, token ou chave hardcoded sem revisao manual

Arquivos que exigem revisao manual antes de rodar:

- `database/scripts/integracoes/test-workflows.js`
- `database/scripts/integracoes/update-n8n-config.js`
- `database/scripts/integracoes/test-n8n-query.js`
- `database/scripts/validacao_app/test-frontend-exact.js`

## Resultado esperado da trilha

Ao fim desta trilha, a equipe deve ter:

- `.env.local` preenchido e coerente com o codigo
- app abrindo com Supabase configurado
- diagnostico real do banco concluido
- lote minimo de migrations definido
- workflows n8n importados e alinhados com o app
- fluxo `ideia -> roteiro -> audio -> video -> publicacao assistida` validado ao menos uma vez
- decisao objetiva de `go`, `ajustar` ou `kill`

## Fase 1 - Alinhamento e leitura

Ler nesta ordem:

1. `docs/README.md`
2. `docs/00_MESTRE/ESTADO_ATUAL_E_FONTES_DE_VERDADE.md`
3. `docs/40_PRODUTO/README.md`
4. `docs/20_BANCO/README.md`
5. `docs/30_AUTOMACAO/README.md`
6. `docs/50_BLUEPRINTS/README.md`
7. `docs/90_LEGADO/MAPA_DA_DOCUMENTACAO_ANTIGA.md`

Saida obrigatoria desta fase:

- entendimento comum de que o projeto e um sistema interno de operacao editorial
- entendimento comum de que a tese correta hoje e `faceless original com humano no loop`
- clareza sobre o que e doc curado e o que e legado

## Fase 2 - Preparar acesso e ambiente

### 2.1 Criar `.env.local`

Usar `.env.example` como base.

Variaveis minimas obrigatorias para o app:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `N8N_URL`
- `N8N_API_KEY`
- `N8N_WEBHOOK_APROVAR_IDEIA`
- `N8N_WEBHOOK_APROVAR_ROTEIRO`
- `WEBHOOK_SECRET`

Variaveis opcionais, mas esperadas por partes do repo:

- `NEXT_PUBLIC_N8N_URL`
- `NEXT_PUBLIC_N8N_API_KEY`
- `SUPABASE_ANON_KEY`
- `N8N_LOCAL_URL`
- `YOUTUBE_API_KEY`
- `TIKTOK_API_KEY`
- `POSTGRES_PASSWORD`

### 2.2 Verificar coerencia das variaveis

Checar no codigo:

- `lib/supabase/client.ts`
- `lib/supabase/server.ts`
- `lib/api/n8n.ts`
- `app/api/ideias/[id]/aprovar/route.ts`
- `app/api/ideias/[id]/gerar-roteiro/route.ts`
- `app/api/roteiros/[id]/aprovar/route.ts`
- `app/api/webhooks/workflow-completed/route.ts`

### 2.3 Validar ambiente de forma rapida

Rodar:

```bash
npm install
npm run dev
```

Depois abrir:

- `/`
- `/ideias`
- `/roteiros`
- `/producao`
- `/calendario`
- `/assets`
- `/publicar`
- `/monitor`
- `/workflows`
- `/settings`
- `/api/debug/env`

Saida obrigatoria desta fase:

- app sobe
- frontend encontra Supabase
- rotas server reconhecem as variaveis essenciais

## Fase 3 - Diagnostico do banco antes de mexer

Ler:

1. `docs/20_BANCO/MIGRATIONS_NECESSARIAS.md`
2. `docs/20_BANCO/INVESTIGACOES_BANCO.md`
3. `docs/20_BANCO/PEDIDO_INVESTIGACAO_RUNTIME_MVP.md`
4. `docs/20_BANCO/RESULTADO_INVESTIGACAO_RUNTIME_MVP_20260311.md`
5. `database/README.md`
6. `database/sql/README.md`
7. `supabase/migrations/README_CLASSIFICACAO.md`

Rodar ou revisar primeiro:

- `database/sql/investigacao/20260311_validacao_runtime_mvp.sql`
- `supabase/migrations/diagnostico_views.sql`
- `supabase/migrations/validar_estado_real.sql`
- `supabase/migrations/check_pipeline_structure.sql`
- `supabase/migrations/check_enum_values.sql`
- `supabase/migrations/verificar_ids.sql`
- `database/scripts/testes/test-db-connections.js`
- `database/scripts/testes/test-postgrest-health.js`
- `database/scripts/testes/test-supabase.js`
- `database/scripts/diagnostico/verify-database.js`
- `database/scripts/diagnostico/verify-views.js`

Responder antes de qualquer migration:

1. quais views o app consome de verdade
2. quais tabelas sao reais e quais sao views publicas
3. se `logs_workflows` e `workflow_queue` existem e aceitam escrita
4. se o modelo de assets usado hoje e `pulso_assets` ou `pulso_content`
5. se o pipeline oficial ja esta consolidado

Saida obrigatoria desta fase:

- inventario de tabelas/views realmente usadas
- lista de lacunas do banco atual
- decisao de quais migrations entram no lote minimo

Estado atual ja confirmado pela investigacao executada:

- `plataformas`, `configuracoes`, `logs_workflows`, `pipeline_producao`, `audios` e views principais existem
- a unica lacuna critica confirmada hoje e `pulso_content.workflow_queue`

## Fase 4 - Congelar o lote minimo de banco

### 4.1 Base estrutural de referencia

Usar como referencia conceitual:

1. `database/sql/schema/001_pulso_schemas.sql`
2. `database/sql/schema/002_pulso_views.sql`
3. `database/sql/seeds/001_initial_data.sql`

### 4.2 Lote minimo confirmado hoje

Aplicar:

1. `database/sql/migrations/20260311_create_workflow_queue_runtime_mvp.sql`

### 4.3 Validacao pos-migration

Rodar em seguida:

1. `database/sql/investigacao/20260311_validar_workflow_queue_pos_migration.sql`
2. `docs/20_BANCO/VALIDACAO_POS_MIGRATION_WORKFLOW_QUEUE.md`

### 4.4 Trilha historica que nao entra agora

O lote abaixo continua sendo apenas referencia historica, nao ordem oficial de execucao:

1. `20241121_create_pipeline_producao.sql`
2. `20241121_views_publicas.sql`
3. `20241127_cleanup_and_create_views_v2.sql`
4. `20241127_fix_views_v2_com_fallback.sql`
5. `create_plataformas_e_configuracoes.sql`
6. `create_logs_workflows.sql`
7. `create_workflow_queue.sql`
8. `create_public_view_agenda.sql`
9. `adicionar_colunas_audios_videos.sql`
10. `criar_estrutura_completa_assets_feedback.sql`
11. `consolidar_assets_em_pulso_content.sql`
12. `trigger_auto_agendar_publicacao.sql`
13. `update_views_pipeline_kanban.sql`

### 4.5 O que fica fora do primeiro lote

Nao entram no primeiro lote sem caso concreto:

- scripts de limpeza
- scripts de duplicidade
- `fix_complete_final.sql`
- `fix_503_errors_final.sql`
- `cleanup_duplicate_schemas.sql`
- `recriar_views_publicas.sql`

### 4.6 Permissoes e exposicao

So revisar depois do diagnostico:

- `add_grants_all_views.sql`
- `expor_schemas_api.sql`
- `fix_rls_and_permissions.sql`

Saida obrigatoria desta fase:

- lista fechada de migrations a executar
- ordem de execucao documentada
- lista de scripts bloqueados
- validacao objetiva da `workflow_queue`

## Fase 5 - Seeds e dados minimos

Executar seeds so depois do lote minimo de banco.

Ordem recomendada:

1. `database/sql/seeds/001_initial_data.sql`
2. seeds especificas apenas se faltarem dados minimos para teste

Seeds que exigem cuidado extra:

- `seed_completo.sql`
- `seed_pipeline.sql`
- `seed_pipeline_producao.sql`
- `seed_roteiros.sql`
- `seed_calendario.sql`

Saida obrigatoria desta fase:

- canais, ideias e pipeline suficientes para testar o app
- nenhum seed massivo rodado no escuro

## Fase 6 - Subir e validar o app

Com banco minimo pronto:

1. abrir `/ideias` e listar ideias
2. abrir `/roteiros` e listar roteiros
3. abrir `/producao` e conferir pipeline
4. abrir `/calendario` e conferir agenda
5. abrir `/assets` e conferir biblioteca
6. abrir `/monitor` e conferir monitoramento
7. abrir `/publicar` e conferir area de publicacao assistida
8. rodar `database/scripts/validacao_app/smoke-runtime-mvp.js`

Rotas server que precisam responder:

- `POST /api/ideias/[id]/aprovar`
- `POST /api/ideias/[id]/gerar-roteiro`
- `POST /api/roteiros/[id]/aprovar`
- `POST /api/webhooks/workflow-completed`

Saida obrigatoria desta fase:

- leitura de dados funcionando
- rotas de aprovacao funcionando
- webhooks configuraveis a partir do app

## Fase 7 - Importar e alinhar o n8n

Ler:

1. `automation/n8n/docs/00_VISAO_GERAL_WORKFLOWS.md`
2. `automation/n8n/docs/01_ideia_para_roteiro.md`
3. `automation/n8n/docs/02_roteiro_para_producao.md`
4. `automation/n8n/docs/03_publicacao_plataformas.md`
5. `n8n-workflows/GUIA_IMPORTACAO_COMPLETO.md`

Importar em ordem:

1. `WF00_Gerar_Ideias.json`
2. `WF01_Gerar_Roteiro.json`
3. `WF02_Gerar_Audio.json`
4. `WF03_Preparar_Video.json`
5. `WF04_Publicar.json`
6. `WF99_Retry_Recovery.json`

Alinhamentos obrigatorios:

- `N8N_URL` precisa responder a `/api/v1/workflows`
- `N8N_API_KEY` precisa listar execucoes
- `N8N_WEBHOOK_APROVAR_IDEIA` precisa apontar para o webhook real do WF01
- `N8N_WEBHOOK_APROVAR_ROTEIRO` precisa apontar para o webhook real do WF02
- `WEBHOOK_SECRET` precisa ser igual entre app e n8n

Saida obrigatoria desta fase:

- workflows importados
- credenciais conectadas
- webhooks reais copiados para `.env.local`

## Fase 8 - Validacao ponta a ponta

Executar o fluxo oficial:

1. gerar ou criar uma ideia
2. aprovar a ideia em `/ideias`
3. confirmar disparo do WF01
4. validar roteiro criado em `/roteiros`
5. aprovar o roteiro
6. confirmar disparo do WF02
7. validar audio salvo
8. executar WF03
9. montar e subir video manualmente
10. validar entrada em `/publicar`
11. confirmar criacao de variantes e logs

Pontos de observacao:

- status da ideia muda para `APROVADA`
- roteiro nasce sem duplicidade para a mesma ideia
- audio fica persistido e rastreavel
- logs aparecem em `logs_workflows`
- queue de retry aparece quando ha falha controlada

## Fase 9 - Gate de MVP

O MVP pode seguir apenas se:

- 1 canal consegue fechar o fluxo completo
- o humano consegue revisar ideias e roteiros sem quebrar o processo
- o banco nao depende de fix manual a cada etapa
- app e n8n usam os mesmos webhooks e mesmos dados-base
- publicacao assistida gera itens acionaveis mesmo sem auto-post total

O MVP deve parar e voltar para investigacao se:

- views principais nao existirem ou mudarem a cada ambiente
- o app depender de scripts perigosos para funcionar
- o n8n nao conseguir receber ou devolver eventos de forma previsivel
- a equipe nao conseguir repetir o fluxo duas vezes seguidas

## Fase 10 - O que manter atualizado

Depois de qualquer mudanca relevante, atualizar:

- `docs/00_MESTRE/TRILHA_OFICIAL_DE_EXECUCAO.md`
- `docs/20_BANCO/MIGRATIONS_NECESSARIAS.md`
- `docs/20_BANCO/INVESTIGACOES_BANCO.md`
- `docs/30_AUTOMACAO/INVESTIGACOES_AUTOMACAO_E_PUBLICACAO.md`
- `.env.example`

## Regra final

Se uma etapa da trilha falhar, nao pular para a proxima. Corrigir a etapa quebrada, registrar a decisao e so depois continuar.
