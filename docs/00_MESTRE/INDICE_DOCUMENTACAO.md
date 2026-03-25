# Indice da Documentacao PULSO

Atualizado em: 2026-03-24

Este documento e o indice completo de toda a documentacao do projeto PULSO, organizado por area.

---

## 00_MESTRE — Documentos mestres

Ponto de entrada. Em caso de conflito, estes documentos tem prioridade.

| Arquivo                                | Descricao                                                   |
|----------------------------------------|-------------------------------------------------------------|
| `README.md`                            | Ponto de entrada da pasta, ordem de leitura                 |
| `TRILHA_OFICIAL_DE_EXECUCAO.md`        | Ordem oficial para ler, validar e executar o projeto        |
| `CHECKLIST_DA_TRILHA_OFICIAL.md`       | Lista rapida para marcar progresso da execucao              |
| `ESTADO_ATUAL_E_FONTES_DE_VERDADE.md`  | O que e fonte de verdade hoje                               |
| `EXECUCAO_ATUAL_MVP.md`               | Estado atual da execucao do MVP                             |
| `00_MAPA_COMPLETO_PULSO.md`           | Mapa estrutural amplo do sistema                            |
| `FLUXO_PRODUCAO_COMPLETO.md`          | Fluxo editorial completo (ideia ate publicacao)             |
| `basedo_app.md`                        | Resumo antigo do app real                                   |
| `PLANO_IMPLANTACAO_COWORK.md`          | Plano completo da automacao AI-native (CoWork)              |
| `INDICE_DOCUMENTACAO.md`              | Este arquivo — indice geral                                  |

---

## 10_SETUP — Configuracao

Guias de setup e testes do ambiente.

| Arquivo                    | Descricao                                                |
|----------------------------|----------------------------------------------------------|
| `README.md`                | Ponto de entrada da pasta                                |
| `SETUP.md`                 | Guia principal de setup do projeto                       |
| `SETUP_VIEWS.md`           | Como configurar as views publicas no Supabase            |
| `CENTRO_DE_COMANDO.md`     | Centro de comando do operador                            |
| `EXECUTAR_NO_SUPABASE.md`  | Como executar SQL no Supabase Dashboard                  |
| `VERCEL_ENV_SETUP.md`      | Configuracao de variaveis de ambiente na Vercel          |
| `TESTE_RAPIDO.md`          | Teste rapido para validar que tudo funciona              |
| `test-approval-flow.sh`    | Script de teste do fluxo de aprovacao                    |

---

## 20_BANCO — Banco de dados

Documentacao do banco PostgreSQL/Supabase.

| Arquivo                                            | Descricao                                                   |
|----------------------------------------------------|-------------------------------------------------------------|
| `README.md`                                        | Ponto de entrada, estrutura da pasta                        |
| `ESTADO_BANCO_20260324.md`                         | Estado completo do banco apos migrations de 2026-03-24      |
| `banco_de_dados.md`                                | Consolidado antigo de banco                                 |
| `MIGRATIONS_NECESSARIAS.md`                        | Migrations pendentes para o app atual                       |
| `INVESTIGACOES_BANCO.md`                           | Perguntas e trilha de investigacao do banco                  |
| `MAPA_CONSUMO_RUNTIME_MVP.md`                      | O que o app realmente consome do banco                      |
| `PEDIDO_INVESTIGACAO_RUNTIME_MVP.md`               | Pacote objetivo para validar o banco real                   |
| `RESULTADO_INVESTIGACAO_RUNTIME_MVP_20260311.md`   | Conclusao da investigacao de runtime                        |
| `RESULTADO_INVESTIGACAO_STORAGE_ASSETS_20260311.md`| Conclusao da investigacao do storage de assets              |
| `RESULTADO_VALIDACAO_WORKFLOW_QUEUE_20260311.md`   | Confirmacao da criacao/validacao da fila de workflows       |
| `VALIDACAO_POS_MIGRATION_WORKFLOW_QUEUE.md`        | Como validar a migration de workflow queue                  |
| `INVESTIGACAO_STORAGE_ASSETS_MVP.md`               | Trilha para investigar bucket ausente de assets             |

### 20_BANCO/acervo_detalhado

| Arquivo                            | Descricao                                       |
|------------------------------------|--------------------------------------------------|
| `README.md`                        | Indice do acervo detalhado                       |
| `banco_completo_estrutura.md`      | Estrutura completa do banco (legado)             |
| `estrutura inicial completa.md`    | Estrutura inicial do banco                       |
| `melhoria_no_banco.md`            | Propostas de melhorias                           |
| `pipeline_no_banco.md`            | Pipeline de conteudo no banco                    |
| `RELATORIO_VERIFICACAO_BANCO.md`  | Relatorio de verificacao                         |
| `view_calendario_editorial.md`    | View do calendario editorial                     |
| `views_pipeline_kanba.md`         | Views do pipeline kanban                         |

### 20_BANCO/apoio

| Arquivo                         | Descricao                                         |
|---------------------------------|----------------------------------------------------|
| `PROBLEMA_SCHEMA_SUPABASE.md`   | Problema conhecido com schemas no Supabase         |
| `QUERY_CANAL_DIA_CORRIGIDA.md`  | Query corrigida para canal x dia                   |
| `RELATORIO_TESTES_DB.md`        | Relatorio de testes do banco                       |
| `SQL_EXECUTAR_SUPABASE.md`      | SQLs prontos para executar                         |
| `views.md`                      | Documentacao de views                              |

### 20_BANCO/sql

| Arquivo                            | Descricao                                       |
|------------------------------------|--------------------------------------------------|
| `FIX_PERMISSOES_SCHEMA.sql`       | Fix de permissoes nos schemas                    |
| `QUERIES_INVESTIGACAO_SUPABASE.sql`| Queries de investigacao do Supabase              |

---

## 30_AUTOMACAO — Automacao

Sistema de automacao (AI-native e legado n8n).

| Arquivo                                     | Descricao                                                |
|---------------------------------------------|----------------------------------------------------------|
| `README.md`                                 | Ponto de entrada da pasta                                |
| `AUTOMACAO_AI_NATIVE.md`                    | Referencia completa do sistema de automacao AI-native    |
| `INVESTIGACOES_AUTOMACAO_E_PUBLICACAO.md`   | Perguntas e trilha de investigacao                       |

### 30_AUTOMACAO/apoio

Documentacao operacional do sistema legado (n8n) e apoio tecnico.

| Arquivo                              | Descricao                                              |
|--------------------------------------|--------------------------------------------------------|
| `ANALISE_WORKFLOWS_MELHORIAS.md`     | Analise de melhorias nos workflows                     |
| `ASSETS_CONFIGURACAO_FINAL.md`       | Configuracao final de assets                           |
| `BLUEPRINT_PULSO_N8N.md`            | Blueprint da integracao n8n                            |
| `CONFIGURAR_WEBHOOKS_N8N.md`        | Como configurar webhooks no n8n                        |
| `DEBUG_WEBHOOK_N8N.md`              | Debug de webhooks n8n                                  |
| `FLUXO_APROVACAO_IDEIAS.md`         | Fluxo de aprovacao de ideias                           |
| `IMPLEMENTACAO_FEEDBACK_RETRY.md`   | Implementacao de feedback e retry                      |
| `INTEGRACOES_ATIVAS.md`             | Integracoes ativas no sistema                          |
| `N8N_API_PROBLEMA.md`               | Problema conhecido com API do n8n                      |
| `n8n_workflows_setup.md`            | Setup dos workflows n8n                                |
| `NOVA_ESTRUTURA_APROVACAO.md`       | Nova estrutura de aprovacao                            |
| `OAUTH_FACEBOOK_INSTAGRAM.md`       | Configuracao OAuth para Facebook/Instagram             |
| `pipeline_calendario_setup.md`      | Setup do pipeline e calendario                         |
| `SISTEMA_FEEDBACK_IA.md`            | Sistema de feedback com IA                             |
| `TRIGGER_AUTO_AGENDAMENTO.md`       | Trigger de auto-agendamento                            |
| `WF99_RECOVERY_RETRY.md`            | Workflow de recovery e retry                           |

---

## 40_PRODUTO — Produto

Documentacao de produto (posicionamento, personas, MVP, roadmap).

| Arquivo                                     | Descricao                                           |
|---------------------------------------------|-----------------------------------------------------|
| `README.md`                                 | Ponto de entrada da pasta                           |
| `01_POSICIONAMENTO_OFICIAL.md`              | Posicionamento oficial do produto                   |
| `02_PROBLEMA_E_TESE.md`                     | Problema identificado e tese de solucao             |
| `03_ICP_E_PERSONAS.md`                      | ICP e personas                                      |
| `04_JTBD_E_CASOS_DE_USO.md`                | Jobs to be done e casos de uso                      |
| `05_MVP_OFICIAL.md`                         | Definicao oficial do MVP                            |
| `06_FLUXOS_DO_PRODUTO.md`                   | Fluxos do produto                                   |
| `07_BACKLOG_PRIORIZADO.md`                  | Backlog priorizado                                  |
| `08_METRICAS_E_CRITERIOS_DE_DECISAO.md`    | Metricas e criterios de decisao                     |
| `09_RISCOS_LIMITES_E_NAO_PROMESSAS.md`     | Riscos, limites e nao-promessas                     |
| `10_ROADMAP_30_DIAS.md`                     | Roadmap de 30 dias                                  |
| `11_PITCH_E_MENSAGENS.md`                   | Pitch e mensagens de comunicacao                    |
| `12_PRD_DO_MVP.md`                          | PRD (Product Requirements Document) do MVP          |
| `13_FAQ_DO_PRODUTO.md`                      | FAQ do produto                                      |
| `14_GLOSSARIO_DO_PRODUTO.md`                | Glossario de termos do produto                      |
| `15_CHECKLIST_DE_LANCAMENTO_DO_MVP.md`      | Checklist de lancamento do MVP                      |

### 40_PRODUTO/90_APOIO

| Arquivo                                              | Descricao                                    |
|------------------------------------------------------|----------------------------------------------|
| `README.md`                                          | Ponto de entrada do apoio                    |
| `CRITICA_VIABILIDADE_CANAIS_DARK_2026.md`           | Analise de viabilidade dos canais dark       |
| `estrategia/PERSONAGEM_PULSO.md`                    | Definicao do personagem PULSO                |
| `estrategia/plano_de_Criacoes.md`                   | Plano de criacoes de conteudo                |

---

## 50_BLUEPRINTS — Blueprints

Blueprints de arquitetura e design do sistema.

| Arquivo                          | Descricao                                        |
|----------------------------------|--------------------------------------------------|
| `README.md`                      | Ponto de entrada da pasta                        |
| `00_ECOSSISTEMA_COMPLETO.md`    | Visao completa do ecossistema PULSO              |
| `01_CANAIS_SERIES.md`           | Blueprint de canais e series                     |
| `02_WORKFLOWS_N8N.md`           | Blueprint de workflows n8n (legado)              |
| `03_BANCO_DE_DADOS.md`          | Blueprint do banco de dados                      |
| `04_FLUXO_CONTEUDO.md`          | Blueprint do fluxo de conteudo                   |
| `05_GUIA_FASE_1.md`             | Guia da Fase 1                                   |
| `06_CONTEUDO_EDITORIAL.md`      | Blueprint de conteudo editorial                  |
| `07_ARQUITETURA_TECNICA.md`     | Blueprint de arquitetura tecnica                 |
| `_DUVIDAS_ESCLARECIDAS.md`      | Duvidas esclarecidas durante o projeto           |

---

## 90_LEGADO — Documentacao legada

Documentos historicos mantidos para referencia. Nao sao fonte de verdade.

| Arquivo                                           | Descricao                                        |
|---------------------------------------------------|--------------------------------------------------|
| `README.md`                                       | Ponto de entrada                                 |
| `MAPA_DA_DOCUMENTACAO_ANTIGA.md`                 | Mapa da documentacao antiga                      |
| `analises/ANALISE_INTEGRACAO_COMPLETA.md`        | Analise de integracao completa                   |
| `analises/IMPLEMENTACAO_COMPLETA.md`             | Estado da implementacao (historico)              |
| `analises/O_QUE_FALTA_CENTRO_COMANDO.md`        | O que faltava no centro de comando               |
| `checklists/CHECKLIST_APROVACAO.md`              | Checklist de aprovacao (legado)                  |
| `checklists/CHECKLIST_ATIVACAO_WF01.md`          | Checklist de ativacao do WF01                    |
| `checklists/CHECKLIST_COMPLETO.md`               | Checklist completo (legado)                      |
| `checklists/CHECKLIST_IMPLEMENTACAO.md`          | Checklist de implementacao                       |
| `checklists/CHECKLIST_WORKFLOWS.md`              | Checklist de workflows                           |
| `operacao/AJUSTE_DATAS_INICIO.md`                | Ajuste de datas de inicio                        |
| `operacao/CONTROLES_FRONTEND.md`                 | Controles do frontend                            |
| `operacao/GUIA_RAPIDO_AJUSTE_DATAS.md`           | Guia rapido de ajuste de datas                   |
| `operacao/GUIA_TESTE_APROVACAO.md`               | Guia de teste de aprovacao                       |
| `relatorios/TESTES_FINAIS.md`                    | Relatorio de testes finais                       |
| `status_e_resumos/RESUMO_ANALISE.md`             | Resumo de analise                                |
| `status_e_resumos/RESUMO_IMPLEMENTACOES.md`      | Resumo de implementacoes                         |
| `status_e_resumos/STATUS_APP.md`                 | Status do app (historico)                        |
| `status_e_resumos/STATUS_WORKFLOWS_N8N.md`       | Status dos workflows n8n                         |
| `status_e_resumos/status_assets.md`              | Status dos assets                                |

---

## Mapa do App (Rotas)

### Paginas (Frontend)

| Rota                    | Arquivo                                | Descricao                                           |
|-------------------------|----------------------------------------|-----------------------------------------------------|
| `/`                     | `app/page.tsx`                         | Dashboard principal                                 |
| `/ideias`               | `app/ideias/page.tsx`                  | Lista de ideias de conteudo                         |
| `/ideias/nova`          | `app/ideias/nova/page.tsx`             | Criar nova ideia                                    |
| `/ideias/[id]`          | `app/ideias/[id]/page.tsx`             | Detalhe de uma ideia                                |
| `/roteiros`             | `app/roteiros/page.tsx`                | Lista de roteiros                                   |
| `/roteiros/[id]`        | `app/roteiros/[id]/page.tsx`           | Detalhe de um roteiro                               |
| `/producao`             | `app/producao/page.tsx`                | Pipeline de producao (kanban)                       |
| `/calendario`           | `app/calendario/page.tsx`              | Calendario editorial                                |
| `/assets`               | `app/assets/page.tsx`                  | Gerenciamento de assets de midia                    |
| `/publicar`             | `app/publicar/page.tsx`                | Publicacao de conteudo                              |
| `/monitor`              | `app/monitor/page.tsx`                 | Monitor de sistema e workflows                      |
| `/workflows`            | `app/workflows/page.tsx`               | Lista de workflows                                  |
| `/workflows/queue`      | `app/workflows/queue/page.tsx`         | Fila de workflows (legado)                          |
| `/automacao`            | `app/automacao/page.tsx`               | Dashboard de automacao AI-native                    |
| `/settings`             | `app/settings/page.tsx`                | Configuracoes do sistema                            |
| `/integracoes`          | `app/integracoes/page.tsx`             | Integracoes externas                                |
| `/canais`               | `app/canais/page.tsx`                  | Lista de canais                                     |
| `/canais/[slug]`        | `app/canais/[slug]/page.tsx`           | Detalhe de um canal                                 |
| `/conteudo`             | `app/conteudo/page.tsx`                | Conteudos (episodios)                               |
| `/analytics`            | `app/analytics/page.tsx`               | Dashboard de analytics                              |
| `/organograma`          | `app/organograma/page.tsx`             | Organograma do projeto                              |

### API Routes

| Rota                                              | Metodo | Descricao                                                |
|---------------------------------------------------|--------|----------------------------------------------------------|
| `/api/ideias/[id]/status`                         | PATCH  | Atualizar status de uma ideia                            |
| `/api/ideias/[id]/aprovar`                        | POST   | Aprovar uma ideia                                        |
| `/api/ideias/[id]/gerar-roteiro`                  | POST   | Gerar roteiro para uma ideia                             |
| `/api/roteiros/[id]/aprovar`                      | POST   | Aprovar um roteiro                                       |
| `/api/automation/orchestrator`                    | POST   | Processa fila de automacao (FIFO, ate 5 itens)           |
| `/api/automation/gerar-ideias`                    | POST   | Gera ideias via GPT-4o                                   |
| `/api/automation/gerar-roteiro`                   | POST   | Gera roteiro via GPT-4o com validacao de qualidade       |
| `/api/automation/gerar-audio`                     | POST   | Gera audio TTS via OpenAI                                |
| `/api/automation/publicar`                        | POST   | Publica conteudo (API direta ou Manus)                   |
| `/api/automation/coletar-metricas`                | POST   | Coleta metricas das plataformas sociais                  |
| `/api/automation/relatorio`                       | POST   | Gera relatorio semanal via Claude/GPT                    |
| `/api/automation/webhooks/manus-callback`         | POST   | Callback do Manus apos publicacao                        |
| `/api/n8n/workflows`                              | GET    | Lista workflows n8n (legado)                             |
| `/api/n8n/executions`                             | GET    | Lista execucoes n8n (legado)                             |
| `/api/n8n/trigger`                                | POST   | Trigger de workflow n8n (legado)                         |
| `/api/webhooks/workflow-completed`                | POST   | Webhook de workflow completado (legado)                  |
| `/api/debug/env`                                  | GET    | Debug de variaveis de ambiente                           |

---

## Libs Importantes

| Arquivo                           | Descricao                                                         |
|-----------------------------------|-------------------------------------------------------------------|
| `lib/api/automation.ts`           | Client de API de automacao (types, CRUD da fila, triggers manuais) |
| `lib/automation/prompts.ts`       | Prompts de IA para geracao de ideias, roteiros, metadados, relatorios |
| `lib/automation/ai-clients.ts`    | Clientes de IA: callOpenAI, callClaude, callOpenAITTS, validarRoteiro, limparParaTTS, splitTextForTTS |
| `lib/hooks/use-automation.ts`     | React Query hooks para automacao (fila, stats, mutations)         |
| `lib/supabase/server.ts`         | Client Supabase server-side (getSupabaseAdminClient)              |

---

## Arquivos SQL

| Arquivo                                                              | Descricao                                       |
|----------------------------------------------------------------------|--------------------------------------------------|
| `database/sql/schema/001_pulso_schemas.sql`                          | Schema completo: 6 schemas, 8 enums, todas as tabelas |
| `database/sql/schema/002_pulso_views.sql`                            | 12 views publicas                                |
| `database/sql/seeds/001_initial_data.sql`                            | Seeds: 1 canal, 2 series, 6 plataformas, 6 tags |
| `database/sql/seeds/seed_complete_project.sql`                       | Seed completo de projeto                         |
| `database/sql/migrations/20260324_create_automation_native.sql`      | Migration: automation_queue, ai_config, triggers, views |
| `database/sql/migrations/20260324_setup_pg_cron_jobs.sql`            | 8 pg_cron jobs                                   |
| `database/sql/migrations/20260311_create_workflow_queue_runtime_mvp.sql` | Migration legada: fila de workflows          |
| `database/sql/maintenance/force-postgrest-reload.sql`                | Forcar reload do PostgREST                       |
| `database/sql/permissions/verificar-permissoes.sql`                  | Verificar permissoes nos schemas                 |
