# Resultado da Investigacao do Runtime do MVP

Data de referencia: 11 de marco de 2026

## Veredito

O banco real esta muito mais proximo do runtime do app do que a documentacao antiga sugeria.

O unico objeto critico claramente ausente no banco real, segundo a investigacao executada, e:

- `pulso_content.workflow_queue`

## O que foi confirmado como existente

### Views publicas usadas pelo app

- `public.canais`
- `public.series`
- `public.plataformas`
- `public.plataformas_conectadas`
- `public.configuracoes`
- `public.ideias`
- `public.roteiros`
- `public.logs_workflows`
- `public.metricas_diarias`
- `public.workflows`
- `public.workflow_execucoes`
- `public.vw_pulso_calendario_publicacao_v2`
- `public.vw_pulso_pipeline_com_assets`
- `public.vw_pulso_pipeline_com_assets_v2`

### Tabelas reais em schema privado

- `pulso_content.ideias`
- `pulso_content.roteiros`
- `pulso_content.pipeline_producao`
- `pulso_content.audios`
- `pulso_content.logs_workflows`
- `pulso_core.configuracoes`
- `pulso_core.plataforma_credenciais`
- `pulso_automation.workflows`
- `pulso_automation.workflow_execucoes`
- `pulso_analytics.metricas_diarias`

## O que foi confirmado como ausente

- `pulso_content.workflow_queue`

## Confirmacoes importantes do dominio

### Status reais

`ideias`

- `APROVADA`
- `RASCUNHO`

`roteiros`

- `APROVADO`

`pipeline_producao`

- `AGUARDANDO_ROTEIRO`
- `ROTEIRO_PRONTO`
- `AUDIO_GERADO`

`audios`

- `OK`

### Assets/pipeline

As duas views existem:

- `public.vw_pulso_pipeline_com_assets`
- `public.vw_pulso_pipeline_com_assets_v2`

Leitura:

- nao ha bloqueio imediato nessa area
- a view antiga segue viva
- a V2 existe para uso de calendario/pipeline mais novo

### Pipeline

`pulso_content.pipeline_producao` tem os campos esperados para o app atual, incluindo:

- `conteudo_variantes_id`
- `data_publicacao_planejada`
- `is_piloto`
- `audio_id`
- `video_id`

### Audios

`pulso_content.audios` tem os campos esperados pelo app atual, incluindo:

- `storage_path`
- `public_url`
- `duracao_segundos`
- `tipo`
- `status`

## Decisao tecnica

### Migration necessaria agora

Aplicar a migration limpa:

- [20260311_create_workflow_queue_runtime_mvp.sql](/D:/projetos/diferentes/pulso_control/database/sql/migrations/20260311_create_workflow_queue_runtime_mvp.sql)

Validar em seguida com:

- [20260311_validar_workflow_queue_pos_migration.sql](/D:/projetos/diferentes/pulso_control/database/sql/investigacao/20260311_validar_workflow_queue_pos_migration.sql)
- [VALIDACAO_POS_MIGRATION_WORKFLOW_QUEUE.md](/D:/projetos/diferentes/pulso_control/docs/20_BANCO/VALIDACAO_POS_MIGRATION_WORKFLOW_QUEUE.md)

### Migrations que nao precisam ser executadas agora

Nao ha evidencia atual de necessidade imediata para rodar:

- `create_plataformas_e_configuracoes.sql`
- `create_logs_workflows.sql`
- `20241127_fix_views_v2_com_fallback.sql`

Motivo:

- os objetos correspondentes ja existem no banco real

### Proximo passo depois da migration

1. validar se `workflow_queue` passou a existir
2. testar tela/monitor da fila
3. regenerar `database.types.ts`
4. revisar warnings restantes ligados a drift de tipos

## Atualizacao apos aplicacao da migration

Com base no retorno registrado em `20260311_validar_workflow_queue_pos_migration.sql`:

- `pulso_content.workflow_queue` agora existe no banco real
- as colunas do contrato esperado bateram
- `anon` e `authenticated` receberam os privilegios necessarios
- o teste transacional de escrita e leitura funcionou
- o rollback limpou o dado de teste

Registro complementar:

- [RESULTADO_VALIDACAO_WORKFLOW_QUEUE_20260311.md](/D:/projetos/diferentes/pulso_control/docs/20_BANCO/RESULTADO_VALIDACAO_WORKFLOW_QUEUE_20260311.md)

## Leitura honesta

O caos maior nao era "banco inexistente".

O caos maior era:

- documentacao desatualizada
- trilha de migrations historica e ruidosa
- tipos gerados incompletos para o estado real

Agora a trilha ficou objetiva:

1. `workflow_queue` criada e validada
2. validar runtime do app em `/monitor` e `settings`
3. validar integracao real com n8n
4. regenerar tipos
