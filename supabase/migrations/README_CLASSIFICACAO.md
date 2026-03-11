# Classificacao das Migrations

Nao trate esta pasta como uma trilha linear e confiavel.

Hoje ela mistura:

- migracoes estruturais
- fixs pontuais
- scripts de limpeza
- seeds
- diagnosticos

## Regra principal

Antes de executar qualquer script aqui:

1. ler `docs/README.md`
2. ler `docs/20_BANCO/MIGRATIONS_NECESSARIAS.md`
3. ler `docs/20_BANCO/INVESTIGACOES_BANCO.md`

## Leitura rapida por categoria

### Estrutura/candidatas essenciais

Exemplos:

- `20241121_create_pipeline_producao.sql`
- `20241121_views_publicas.sql`
- `20241127_cleanup_and_create_views_v2.sql`
- `20241127_fix_views_v2_com_fallback.sql`
- `create_plataformas_e_configuracoes.sql`
- `create_logs_workflows.sql`
- `create_workflow_queue.sql`

### Diagnostico

Exemplos:

- `check_enum_values.sql`
- `diagnostico_views.sql`
- `validar_estado_real.sql`
- `verificar_ids.sql`

### Seed

Exemplos:

- `seed_completo.sql`
- `seed_pipeline.sql`
- `seed_roteiros.sql`
- `seed_calendario.sql`

### Fix perigoso

Exemplos:

- `cleanup_duplicate_schemas.sql`
- `fix_complete_final.sql`
- `fix_503_errors_final.sql`
- `limpar_duplicatas_v2.sql`
- `recriar_views_publicas.sql`

## Recomendacao

Nao mover os arquivos ainda.

Primeiro:

- investigar
- congelar a trilha oficial
- so depois consolidar em uma pasta limpa nova

