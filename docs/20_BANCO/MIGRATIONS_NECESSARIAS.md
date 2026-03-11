# Migracoes Necessarias

## Objetivo

Separar:

- o que e base estrutural
- o que e necessario para o app atual
- o que e diagnostico
- o que e seed
- o que nao deve ser executado sem investigacao

## Regra principal

Nao existe hoje uma trilha unica e limpa de banco.

Temos duas linhas:

- `database/sql/` = modelagem base e intencao original
- `supabase/migrations/` = correcoes e evolucoes do ambiente real

Por isso, antes de executar qualquer lote, validar o estado atual do banco.

## Grupo 1 - Base estrutural recomendada

Arquivos que descrevem a fundacao conceitual:

1. `database/sql/schema/001_pulso_schemas.sql`
2. `database/sql/schema/002_pulso_views.sql`
3. `database/sql/seeds/001_initial_data.sql`

Uso recomendado:

- bootstrap conceitual
- entender schemas, enums, tabelas e views-base

Observacao:

- esses arquivos nao cobrem sozinhos toda a realidade do app atual

## Grupo 2 - Candidatas a migracoes essenciais para o app atual

Arquivos que provavelmente fazem parte da camada necessaria para o sistema atual:

- `20241121_create_pipeline_producao.sql`
- `20241121_views_publicas.sql`
- `20241127_cleanup_and_create_views_v2.sql`
- `20241127_fix_views_v2_com_fallback.sql`
- `create_plataformas_e_configuracoes.sql`
- `create_logs_workflows.sql`
- `create_workflow_queue.sql`
- `create_public_view_agenda.sql`
- `adicionar_colunas_audios_videos.sql`
- `criar_estrutura_completa_assets_feedback.sql`
- `consolidar_assets_em_pulso_content.sql`
- `trigger_auto_agendar_publicacao.sql`
- `update_views_pipeline_kanban.sql`

Uso recomendado:

- considerar como lote de trabalho principal do banco atual
- revisar dependencias antes de aplicar em ambiente limpo

Observacao critica:

- esta lista e "provavelmente necessaria"
- ela ainda depende da investigacao em `INVESTIGACOES_BANCO.md`

## Atualizacao apos investigacao real do runtime

Com base no retorno registrado em `RESULTADO_INVESTIGACAO_RUNTIME_MVP_20260311.md`:

- `plataformas`, `configuracoes`, `plataformas_conectadas` e `plataforma_credenciais` ja existem
- `logs_workflows` ja existe
- `vw_pulso_calendario_publicacao_v2` e as duas views de assets ja existem
- `pipeline_producao` e `audios` ja existem
- o unico objeto critico ausente confirmado foi `pulso_content.workflow_queue`

### Lote minimo confirmado hoje

Aplicar primeiro:

1. `database/sql/migrations/20260311_create_workflow_queue_runtime_mvp.sql`

Validar logo depois:

1. `database/sql/investigacao/20260311_validar_workflow_queue_pos_migration.sql`
2. `docs/20_BANCO/VALIDACAO_POS_MIGRATION_WORKFLOW_QUEUE.md`

Status atual:

- a migration foi aplicada
- a validacao retornou sucesso
- a fila esta pronta no banco real

### O que nao precisa rodar agora

Nao ha necessidade comprovada, neste momento, de aplicar:

- `create_plataformas_e_configuracoes.sql`
- `create_logs_workflows.sql`
- `20241127_fix_views_v2_com_fallback.sql`

### O que ainda pede cuidado

Mesmo com o banco real validado:

- nao usar a pasta `supabase/migrations/` como trilha linear de execucao
- manter `pipeline_producao` e `audios` fora de execucao cega, porque a historia de schema nesses objetos continua ruidosa

## Grupo 3 - Seeds e populacao

Arquivos de seed ou dados de teste:

- `20241121_popular_dados_teste.sql`
- `seed_completo.sql`
- `seed_calendario.sql`
- `seed_pipeline.sql`
- `seed_pipeline_producao.sql`
- `seed_roteiros.sql`
- `criar_roteiro_teste.sql`

Uso recomendado:

- usar so depois de confirmar estrutura e views
- nunca usar cegamente em ambiente com dados reais

## Grupo 4 - Diagnostico e verificacao

Arquivos de diagnostico:

- `check_enum_values.sql`
- `check_pipeline_structure.sql`
- `check_status_constraint.sql`
- `debug_roteiros.sql`
- `diagnostico_duplicatas.sql`
- `diagnostico_views.sql`
- `encontrar_ids_reais.sql`
- `validar_ajuste_datas.sql`
- `validar_estado_real.sql`
- `verificar_duplicidades.sql`
- `verificar_ids.sql`
- `verificar_plataformas.sql`

Uso recomendado:

- usar para entender o ambiente
- usar antes de rodar fixs destrutivos

## Grupo 5 - Fixs e scripts perigosos

Arquivos que nao devem ser executados sem investigacao previa:

- `20241121_0_limpar_banco.sql`
- `cleanup_duplicate_schemas.sql`
- `corrigir_pipeline_faltantes.sql`
- `corrigir_status_mock.sql`
- `corrigir_views_faltantes.sql`
- `deletar_duplicatas_final.sql`
- `fix_503_errors_final.sql`
- `fix_complete_final.sql`
- `fix_missing_views.sql`
- `fix_pgrst002_critical.sql`
- `fix_pgrst002_definitivo.sql`
- `fix_pipeline_view_with_joins.sql`
- `fix_rls_and_permissions.sql`
- `fix_roteiros_canal.sql`
- `fix_view_pipeline.sql`
- `limpar_dados_mock.sql`
- `limpar_duplicatas.sql`
- `limpar_duplicatas_v2.sql`
- `recriar_views_publicas.sql`

Motivo:

- esses scripts parecem responder a incidentes especificos
- alguns podem sobrescrever ou mascarar a fonte de verdade
- alguns podem ser redundantes ou contraditorios entre si

## Grupo 6 - Material de apoio

- `README_PROBLEMA_VIEWS.md`
- `README_SEED.md`
- `update_n8n_config.sql`

## Decisao operacional recomendada

### Nao fazer

- nao tentar "rodar tudo"
- nao tratar `supabase/migrations/` como historico linear confiavel

### Fazer

1. investigar o estado real do banco
2. congelar uma trilha minima oficial de banco
3. separar o que e bootstrap, o que e fix e o que e seed
4. depois criar um pacote novo e limpo de migracoes consolidadas

## Meta futura

Criar uma pasta nova de migracoes consolidadas e limpas, derivada das investigacoes, para substituir a leitura caotica atual.
