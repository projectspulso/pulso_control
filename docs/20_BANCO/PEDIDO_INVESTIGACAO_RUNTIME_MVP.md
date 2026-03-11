# Pedido de Investigacao do Runtime do MVP

Data de referencia: 11 de marco de 2026

## Motivo

O app atual entrou em um ponto em que a principal incerteza nao e mais frontend.

A incerteza agora e drift entre:

- `database/sql/schema/*`
- `supabase/migrations/*`
- `lib/supabase/database.types.ts`
- o que o app realmente consome em runtime

## Achados locais antes de mexer no banco

### 1. O schema base conceitual esta desatualizado para o app atual

Exemplo de drift de status:

- `database/sql/schema/001_pulso_schemas.sql` modela `ideias` com `EM_DESENVOLVIMENTO` e `DESCARTADA`
- o app atual usa `RASCUNHO`, `APROVADA`, `EM_PRODUCAO`, `CONCLUIDA`, `ARQUIVADA`

Outro exemplo:

- o schema base modela `roteiros` com `EM_REVISAO`, `PUBLICADO`, `ARQUIVADO`
- o app atual usa `RASCUNHO`, `REVISAO`, `APROVADO`, `PRODUCAO`, `CONCLUIDO`

Conclusao:

- a linha `database/sql/schema/*` hoje nao pode mais ser tratada como espelho do runtime

### 2. O app usa objetos que nao estao claros na trilha base

Objetos criticos consumidos hoje:

- `public.ideias`
- `public.roteiros`
- `public.logs_workflows`
- `public.configuracoes`
- `public.plataformas_conectadas`
- `public.vw_pulso_calendario_publicacao_v2`
- `public.vw_pulso_pipeline_com_assets`
- `public.vw_pulso_pipeline_com_assets_v2`
- `pulso_content.pipeline_producao`
- `pulso_content.audios`
- `pulso_content.logs_workflows`
- `pulso_content.workflow_queue`
- `pulso_core.configuracoes`
- `pulso_core.plataforma_credenciais`

### 3. Os tipos gerados do Supabase parecem incompletos para o runtime atual

Sinais:

- `lib/supabase/database.types.ts` tipa bem `ideias`, `roteiros`, `workflows`, `workflow_execucoes`, `metricas_diarias`
- mas nao mostrou correspondencia clara para `pipeline_producao`, `audios`, `logs_workflows` e `workflow_queue`

Leitura prudente:

- pode haver objetos no banco fora do tipo gerado atual
- ou o tipo gerado esta desatualizado
- ou ambos

### 4. Existe uma duvida concreta em assets/pipeline

O app ainda consome:

- `public.vw_pulso_pipeline_com_assets`

Mas a linha mais recente de migration parece focar em:

- `public.vw_pulso_pipeline_com_assets_v2`
- `public.vw_pulso_calendario_publicacao_v2`

Conclusao:

- precisamos confirmar se a view sem `_v2` ainda existe no banco real
- se nao existir, ha duas saidas:
  - criar compatibilidade no banco
  - alinhar o app para `_v2`

## O que preciso que seja rodado no banco

Rodar no Supabase SQL Editor:

- [20260311_validacao_runtime_mvp.sql](/D:/projetos/diferentes/pulso_control/database/sql/investigacao/20260311_validacao_runtime_mvp.sql)

## O que eu preciso receber de volta

Idealmente, o retorno das secoes:

1. `POSTGREST E SCHEMAS EXPOSTOS`
2. `INVENTARIO DE OBJETOS CRITICOS DO RUNTIME`
3. `COLUNAS DOS OBJETOS MAIS SENSIVEIS`
4. `STATUS REAIS EM DADOS/TABELAS`
5. `PERMISSOES E ACESSO VIA POSTGREST`
6. `COMPATIBILIDADE DA VIEW DE ASSETS`

Se for mais facil, pode me mandar:

- print das tabelas de resultado
- ou copiar e colar os resultados principais

## Como vou decidir depois do retorno

### Se faltarem `plataformas_conectadas`, `configuracoes` ou `plataforma_credenciais`

Migracao candidata:

- `supabase/migrations/create_plataformas_e_configuracoes.sql`

### Se faltar `logs_workflows`

Migracao candidata:

- `supabase/migrations/create_logs_workflows.sql`

### Se faltar `workflow_queue`

Migracao candidata:

- `supabase/migrations/create_workflow_queue.sql`

### Se faltarem `vw_pulso_calendario_publicacao_v2` ou `vw_pulso_pipeline_com_assets_v2`

Migracao candidata:

- `supabase/migrations/20241127_fix_views_v2_com_fallback.sql`

### Se faltar `pipeline_producao` ou `audios`

Nao rodar nada no escuro.

Motivo:

- existem migrations antigas usando `content` e `assets`
- existem outras usando `pulso_content`
- aqui eu prefiro consolidar uma trilha nova em vez de mandar executar script historico conflitante

## Pedido objetivo para o humano

Rodar o SQL de investigacao e me devolver os resultados.

Com isso eu consigo te dizer, com muito menos risco:

1. quais migrations realmente precisamos
2. quais nao devemos executar
3. se o proximo passo e banco, tipos gerados ou ajuste do app
