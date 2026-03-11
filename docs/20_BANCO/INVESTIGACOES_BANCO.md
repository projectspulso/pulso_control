# Investigacoes de Banco

## Objetivo

Responder, de forma fria, o que realmente existe no banco e o que o app realmente usa.

## Perguntas que precisam ser respondidas

### 1. Qual e a trilha oficial do banco?

Precisamos decidir:

- `database/sql/schema/*` e a base oficial?
- `supabase/migrations/*` e a base oficial?
- ou vamos consolidar ambas em uma terceira trilha limpa?

### 2. Quais views o app usa de verdade?

Investigar:

- `ideias`
- `roteiros`
- `canais`
- `series`
- `workflow_execucoes`
- `logs_workflows`
- `pipeline_producao`

Pergunta:

- isso e tabela real?
- view publica?
- view em schema privado?

### 3. O app depende de schemas privados ou views publicas?

Hoje existem sinais dos dois.

Precisamos mapear:

- o que o frontend acessa direto
- o que o server acessa
- o que exige RLS
- o que depende de service role

### 4. O modelo de assets esta consolidado ou duplicado?

Arquivos que indicam duvida:

- `adicionar_colunas_audios_videos.sql`
- `criar_estrutura_completa_assets_feedback.sql`
- `consolidar_assets_em_pulso_content.sql`

Pergunta:

- assets vivem em `pulso_assets`?
- assets foram puxados para `pulso_content`?
- o app atual espera qual modelo?

### 5. O pipeline atual e um so?

Arquivos que sugerem historico de mudanca:

- `20241121_apenas_pipeline.sql`
- `20241121_create_pipeline_producao.sql`
- `fix_pipeline_view_with_joins.sql`
- `fix_view_pipeline.sql`
- `update_views_pipeline_kanban.sql`

Pergunta:

- existe um pipeline oficial?
- ou ha varias geracoes de modelagem?

## Roteiro de investigacao

### Etapa 1 - Mapear o que o app consome

Ler:

- `lib/api/`
- `lib/hooks/`
- `app/api/`

Saida esperada:

- tabela/view usada
- schema
- operacao feita
- se exige insert/update/delete

### Etapa 2 - Validar existencia real no banco

Rodar ou revisar:

- `diagnostico_views.sql`
- `validar_estado_real.sql`
- `check_pipeline_structure.sql`
- `check_enum_values.sql`
- `verificar_ids.sql`

Saida esperada:

- inventario real de tabelas e views
- enums reais
- colunas reais usadas pelo app

### Etapa 3 - Validar politicas e permissoes

Revisar:

- `fix_rls_and_permissions.sql`
- `add_grants_all_views.sql`
- `expor_schemas_api.sql`

Perguntas:

- `logs_workflows` aceita insert por rota server?
- `workflow_queue` aceita leitura/escrita do que precisa?
- o frontend deveria acessar tudo com anon key?

### Etapa 4 - Congelar a trilha minima oficial

Ao final, produzir:

- uma lista unica de migracoes base
- uma lista unica de migracoes de fix
- uma lista unica de seeds
- uma lista unica de scripts de diagnostico

## Entregaveis esperados desta investigacao

1. mapa de consumo do app
2. mapa real de tabelas/views
3. trilha oficial do banco
4. lista de scripts perigosos
5. proposta de consolidacao futura

