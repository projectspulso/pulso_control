# Mapa de Consumo do Banco pelo Runtime do MVP

Data de referencia: 11 de marco de 2026

## Leitura curta

O app atual consome o banco em tres camadas:

1. views publicas simples para CRUD editorial
2. tabelas/schema direto para pipeline, audios e fila
3. views publicas especializadas para calendario, assets e monitoramento

## Objetos mais criticos do runtime

### CRUD editorial

- `public.canais`
- `public.series`
- `public.tags`
- `public.ideias`
- `public.roteiros`

### Pipeline e assets

- `pulso_content.pipeline_producao`
- `pulso_content.audios`
- `public.vw_pulso_calendario_publicacao_v2`
- `public.vw_pulso_pipeline_com_assets`
- `public.vw_pulso_pipeline_com_assets_v2`

### Automacao e monitoramento

- `public.workflows`
- `public.workflow_execucoes`
- `public.logs_workflows`
- `pulso_content.logs_workflows`
- `pulso_content.workflow_queue`

### Settings e integracoes

- `public.plataformas`
- `public.plataformas_conectadas`
- `public.configuracoes`
- `pulso_core.configuracoes`
- `pulso_core.plataforma_credenciais`

### Analytics MVP

- `public.metricas_diarias`

## Drift local identificado

### 1. Schema base antigo nao representa mais o runtime

Os enums e fluxos de `ideias` e `roteiros` em `database/sql/schema/001_pulso_schemas.sql`
nao batem com o app atual.

### 2. O runtime mistura public views e schema direto

Isso significa que:

- nem toda falha de banco vai aparecer no `database.types.ts`
- nem todo objeto importante esta documentado na linha conceitual antiga

### 3. Assets ainda tem ambiguidade de view

O runtime hoje ainda menciona:

- `vw_pulso_pipeline_com_assets`

Enquanto a trilha mais nova do banco gira mais em torno de:

- `vw_pulso_pipeline_com_assets_v2`

### 4. Fila de workflow tinha drift de contrato

O hook do app estava em ingles e a migration candidata esta em portugues.

Correcao local aplicada:

- o app agora conversa com `pulso_content.workflow_queue`
- e faz o mapeamento do contrato para o formato que a UI espera

## Correcoes locais aplicadas no app

- escrita de webhook movida para `pulso_content.logs_workflows`
- leitura de logs ganhou fallback entre view publica e tabela no schema
- atualizacao de `pipeline_producao` ficou explicita no schema `pulso_content`
- fila de workflow foi alinhada ao contrato da migration candidata

## O que ainda depende do banco real

1. confirmar existencia dos objetos
2. confirmar schemas expostos no PostgREST
3. confirmar colunas reais de `audios`, `pipeline_producao`, `logs_workflows` e `workflow_queue`
4. confirmar qual view de assets e a oficial hoje
5. regenerar tipos do Supabase depois da estabilizacao
