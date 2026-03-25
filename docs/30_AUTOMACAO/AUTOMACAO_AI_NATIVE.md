# Automacao AI-Native — Referencia Completa

Data: 2026-03-24
Status: Implementado (MVP)

---

## 1. Visao Geral

O sistema de automacao AI-native substitui o n8n como motor de automacao do PULSO. Toda a orquestracao passa a ser feita via:

- **Supabase (PostgreSQL)** — fila de tarefas (`automation_queue`), triggers automaticos, configuracao de IA
- **pg_cron** — agendamento de tarefas periodicas diretamente no banco
- **API Routes (Next.js)** — workers que processam cada tipo de tarefa
- **APIs de IA** — OpenAI GPT-4o (texto), OpenAI TTS (audio), Claude API (relatorios)

### Comparativo

| Antes (n8n)                    | Depois (AI-Native)                              |
|--------------------------------|--------------------------------------------------|
| n8n Cloud ($20-50/mes)         | Supabase Edge Functions (gratis no Pro)           |
| CRON triggers no n8n           | pg_cron nativo do Supabase                        |
| Polling a cada 5-10min         | Triggers instantaneos no banco                    |
| Workflows visuais              | Codigo em TypeScript (API Routes)                 |
| Retry manual                   | Fila automation_queue com retry automatico         |
| 1 ponto de falha (n8n)         | Zero dependencia externa extra                    |

### Papel de cada agente de IA

| Agente         | Papel                                                           |
|----------------|-----------------------------------------------------------------|
| Claude (Opus)  | Arquiteto. Cria codigo, queries, analisa metricas, otimiza prompts |
| GPT-4o         | Motor de geracao de conteudo (ideias, roteiros, titulos, hashtags) |
| OpenAI TTS     | Gera audio narrado dos roteiros (MP3)                            |
| Manus          | Publicacao em plataformas via browser automation                  |
| Claude API     | Alternativa ao GPT. Analise de qualidade. Relatorio semanal      |

---

## 2. Arquitetura

```
                              pg_cron (8 jobs agendados)
                                       |
                                       v
                      +-------------------------------+
                      | pulso_automation.automation_queue |
                      |   (fila FIFO com status)        |
                      +-------------------------------+
                                       |
                             (pg_net ou cron externo)
                                       |
                                       v
                      +-------------------------------+
                      | /api/automation/orchestrator   |
                      | (processa fila, despacha       |
                      |  para workers por tipo)        |
                      +-------------------------------+
                         |        |        |        |
                         v        v        v        v
                    gerar-    gerar-    gerar-   publicar
                    ideias    roteiro   audio
                    (GPT-4o)  (GPT-4o)  (TTS)    (API/Manus)
                         |        |        |        |
                         v        v        v        v
                      +-------------------------------+
                      | Banco (pulso_content,          |
                      |  pulso_assets, pulso_distribution) |
                      +-------------------------------+

   Triggers automaticos:
   ideias.status='APROVADA'  --> enfileira GERAR_ROTEIRO
   roteiros.status='APROVADO' --> enfileira GERAR_AUDIO
```

---

## 3. Tabelas do Banco

### 3.1 `pulso_automation.automation_queue`

Fila central de automacao. Cada linha representa uma tarefa a ser processada.

| Coluna            | Tipo          | Default           | Descricao                                                |
|-------------------|---------------|-------------------|----------------------------------------------------------|
| `id`              | UUID          | gen_random_uuid() | Identificador unico                                      |
| `tipo`            | TEXT (CHECK)  | —                 | Tipo de tarefa (ver valores abaixo)                      |
| `payload`         | JSONB         | '{}'              | Dados de entrada flexiveis para o worker                 |
| `status`          | TEXT (CHECK)  | 'PENDENTE'        | Estado da execucao (ver valores abaixo)                  |
| `tentativas`      | INTEGER       | 0                 | Numero de tentativas ja realizadas                       |
| `max_tentativas`  | INTEGER       | 3                 | Maximo de tentativas antes de marcar como ERRO           |
| `proximo_retry`   | TIMESTAMPTZ   | NULL              | Quando tentar novamente (se status=RETRY)                |
| `erro_ultimo`     | TEXT          | NULL              | Mensagem do ultimo erro                                  |
| `erro_historico`  | JSONB         | '[]'              | Array com historico de erros (tentativa, erro, timestamp) |
| `scheduled_at`    | TIMESTAMPTZ   | NOW()             | Quando a tarefa deve ser processada                      |
| `started_at`      | TIMESTAMPTZ   | NULL              | Quando o processamento iniciou                           |
| `completed_at`    | TIMESTAMPTZ   | NULL              | Quando o processamento terminou                          |
| `resultado`       | JSONB         | NULL              | Resultado da execucao (retorno do worker)                |
| `origem`          | TEXT          | 'pg_cron'         | Quem criou: 'pg_cron', 'trigger', 'manual'               |
| `referencia_id`   | UUID          | NULL              | ID da entidade relacionada (ideia, roteiro, etc.)        |
| `referencia_tipo` | TEXT          | NULL              | Tipo da entidade ('ideia', 'roteiro', etc.)              |
| `created_at`      | TIMESTAMPTZ   | NOW()             | Data de criacao                                          |
| `updated_at`      | TIMESTAMPTZ   | NOW()             | Data da ultima atualizacao (trigger automatico)          |

**Valores de `tipo`:**
- `GERAR_IDEIAS` — Gerar ideias de conteudo via GPT-4o
- `GERAR_ROTEIRO` — Gerar roteiro a partir de ideia aprovada
- `GERAR_AUDIO` — Gerar audio TTS a partir de roteiro aprovado
- `PREPARAR_VIDEO` — Preparar video final (futuro)
- `PUBLICAR` — Publicar conteudo nas plataformas
- `COLETAR_METRICAS` — Coletar metricas das plataformas sociais
- `RELATORIO_SEMANAL` — Gerar relatorio semanal com IA
- `PROCESSAR_FILA` — Processar a fila (orchestrator)
- `CUSTOM` — Tarefa customizada

**Valores de `status`:**
- `PENDENTE` — Aguardando processamento
- `PROCESSANDO` — Em execucao pelo worker
- `SUCESSO` — Concluido com sucesso
- `ERRO` — Falhou apos todas as tentativas
- `RETRY` — Aguardando proximo retry
- `CANCELADO` — Cancelado manualmente

**Indices:**
- `idx_aq_status` — status
- `idx_aq_tipo` — tipo
- `idx_aq_scheduled` — scheduled_at (parcial: status='PENDENTE')
- `idx_aq_retry` — proximo_retry (parcial: status='RETRY')
- `idx_aq_referencia` — referencia_id, referencia_tipo
- `idx_aq_created` — created_at DESC

### 3.2 `pulso_automation.ai_config`

Configuracao centralizada de parametros de IA.

| Coluna       | Tipo        | Default           | Descricao                         |
|--------------|-------------|-------------------|-----------------------------------|
| `id`         | UUID        | gen_random_uuid() | Identificador unico               |
| `chave`      | TEXT UNIQUE | —                 | Chave da configuracao             |
| `valor`      | JSONB       | —                 | Valor da configuracao (flexivel)  |
| `descricao`  | TEXT        | NULL              | Descricao legivel da configuracao |
| `created_at` | TIMESTAMPTZ | NOW()             | Data de criacao                   |
| `updated_at` | TIMESTAMPTZ | NOW()             | Data da ultima atualizacao        |

**Seeds iniciais:**

| Chave                   | Valor                                                                 | Descricao                               |
|-------------------------|-----------------------------------------------------------------------|-----------------------------------------|
| `openai_model`          | `"gpt-4o"`                                                            | Modelo OpenAI para geracao de texto     |
| `tts_provider`          | `"openai"`                                                            | Provider de TTS: openai ou elevenlabs   |
| `tts_model`             | `"tts-1-hd"`                                                          | Modelo de TTS da OpenAI                 |
| `tts_voice_default`     | `"alloy"`                                                             | Voz padrao para pt-BR                   |
| `tts_voices`            | `{"pulso-curiosidades":"alloy","pulso-misterios":"onyx",...}`         | Mapeamento de vozes por canal           |
| `auto_approve_roteiro`  | `false`                                                               | Auto-aprovar roteiros com score > 80    |
| `auto_approve_threshold`| `80`                                                                  | Threshold de quality score              |
| `max_ideias_por_dia`    | `10`                                                                  | Maximo de ideias por dia por canal      |
| `publicacao_horarios`   | `["06:00","12:00","18:00"]`                                           | Horarios de publicacao UTC              |

### 3.3 Views publicas

**`public.vw_automation_queue`** — View da fila para o frontend. Inclui todos os campos da `automation_queue` mais `duracao_segundos` (campo calculado: `completed_at - started_at`). Ordenada por `created_at DESC`.

**`public.vw_automation_stats`** — Resumo para dashboard. Agrega por `tipo` nos ultimos 7 dias:
- `pendentes`, `processando`, `sucesso`, `erros`, `retry`, `total`
- `ultima_execucao_ok` — timestamp do ultimo sucesso
- `duracao_media_seg` — media de duracao em segundos

---

## 4. Triggers Automaticos

### 4.1 `trg_ideia_aprovada`

- **Tabela:** `pulso_content.ideias`
- **Evento:** AFTER UPDATE OF status
- **Funcao:** `pulso_automation.on_ideia_aprovada()`
- **Comportamento:** Quando `status` muda para `'APROVADA'`, insere automaticamente um item na `automation_queue` com `tipo='GERAR_ROTEIRO'`, referenciando a ideia.
- **Protecao anti-duplicata:** Verifica se ja existe item PENDENTE ou PROCESSANDO para a mesma ideia antes de inserir.

### 4.2 `trg_roteiro_aprovado`

- **Tabela:** `pulso_content.roteiros`
- **Evento:** AFTER UPDATE OF status
- **Funcao:** `pulso_automation.on_roteiro_aprovado()`
- **Comportamento:** Quando `status` muda para `'APROVADO'`, insere automaticamente um item na `automation_queue` com `tipo='GERAR_AUDIO'`, referenciando o roteiro.
- **Protecao anti-duplicata:** Verifica se ja existe item PENDENTE ou PROCESSANDO para o mesmo roteiro antes de inserir.

### 4.3 `trg_aq_updated_at`

- **Tabela:** `pulso_automation.automation_queue`
- **Evento:** BEFORE UPDATE
- **Funcao:** `pulso_automation.set_updated_at()`
- **Comportamento:** Atualiza `updated_at` automaticamente em qualquer UPDATE.

---

## 5. pg_cron Jobs (8 jobs)

| Job                        | Cron             | Horario (UTC)     | Descricao                                                       |
|----------------------------|------------------|-------------------|-----------------------------------------------------------------|
| `gerar-ideias-diario`      | `0 3 * * *`      | 03:00 diario      | Enfileira GERAR_IDEIAS para canais ativos (rotacao por dia)     |
| `check-roteiros-pendentes` | `*/5 * * * *`    | A cada 5 min      | Backup: detecta ideias aprovadas sem roteiro e enfileira        |
| `check-audios-pendentes`   | `*/10 * * * *`   | A cada 10 min     | Backup: detecta roteiros aprovados sem audio e enfileira        |
| `publicar-conteudos`       | `0 6,12,18 * * *`| 06:00, 12:00, 18:00 | Enfileira PUBLICAR para conteudos prontos                    |
| `processar-retry-queue`    | `*/30 * * * *`   | A cada 30 min     | Reativa itens em RETRY cujo `proximo_retry` ja passou           |
| `coletar-metricas`         | `0 22 * * *`     | 22:00 diario      | Enfileira COLETAR_METRICAS                                      |
| `relatorio-semanal`        | `0 9 * * 1`      | Seg 09:00         | Enfileira RELATORIO_SEMANAL                                     |
| `limpar-queue-antiga`      | `0 4 * * 0`      | Dom 04:00         | Deleta itens SUCESSO/CANCELADO com mais de 30 dias              |

**Detalhes relevantes:**

- `gerar-ideias-diario`: Seleciona canais ativos com rotacao baseada em hash do ID do canal vs dia da semana. Limita a 2 canais por execucao, 5 ideias cada.
- `check-roteiros-pendentes`: Safety net. Se o trigger `trg_ideia_aprovada` falhar ou a ideia for aprovada por via diferente, este job garante que o roteiro sera gerado. Limita a 5 ideias por execucao.
- `check-audios-pendentes`: Safety net similar para audios. Limita a 3 roteiros por execucao.
- `processar-retry-queue`: Muda status de RETRY para PENDENTE quando `proximo_retry <= NOW()` e `tentativas < max_tentativas`.

---

## 6. Workers (API Routes)

Todos os workers seguem o padrao:
- Autenticacao via header `x-webhook-secret`
- Recebem payload via POST JSON
- Retornam JSON com `{ success: true, ... }` ou `{ error: "..." }`

### 6.1 `/api/automation/orchestrator`

**Arquivo:** `app/api/automation/orchestrator/route.ts`

Processa itens pendentes na `automation_queue`. Busca ate 5 itens PENDENTES (FIFO por `created_at`), marca como PROCESSANDO, chama o worker correspondente, e atualiza o resultado.

Mapeamento de workers:
- `GERAR_IDEIAS` -> `/api/automation/gerar-ideias`
- `GERAR_ROTEIRO` -> `/api/automation/gerar-roteiro`
- `GERAR_AUDIO` -> `/api/automation/gerar-audio`
- `PUBLICAR` -> `/api/automation/publicar`

Se o worker falhar, aplica retry com backoff exponencial (ver secao 10).

### 6.2 `/api/automation/gerar-ideias`

**Arquivo:** `app/api/automation/gerar-ideias/route.ts`

Gera ideias de conteudo para um canal via GPT-4o.

- **Payload:** `{ canal_id?: string, quantidade?: number }`
- Se `canal_id` nao fornecido, seleciona automaticamente o canal ativo com menos ideias recentes
- Busca serie ativa do canal para contexto
- Chama GPT-4o com `temperature=0.8` e `json_mode=true`
- Salva ideias em `pulso_content.ideias` com `origem='IA'` e `status='RASCUNHO'`
- Metadata inclui: `ai_modelo`, `tokens_usados`, `duracao_estimada`, `gancho_sugerido`

### 6.3 `/api/automation/gerar-roteiro`

**Arquivo:** `app/api/automation/gerar-roteiro/route.ts`

Gera roteiro a partir de uma ideia aprovada via GPT-4o.

- **Payload:** `{ ideia_id: string, canal_id?: string }`
- Verifica se ja existe roteiro para a ideia (evita duplicata — retorna 409)
- Chama GPT-4o com `temperature=0.7` e `max_tokens=2048`
- Valida qualidade do roteiro (funcao `validarRoteiro`): verifica tamanho, estrutura, duracao estimada
- Se `auto_approve_roteiro=true` e `quality_score >= 80` (threshold configuravel), aprova automaticamente
- Salva em `pulso_content.roteiros` com metadata de qualidade
- Se auto-aprovado, o trigger `trg_roteiro_aprovado` enfileira geracao de audio automaticamente

### 6.4 `/api/automation/gerar-audio`

**Arquivo:** `app/api/automation/gerar-audio/route.ts`

Gera audio TTS a partir de roteiro aprovado.

- **Payload:** `{ roteiro_id: string, canal_id?: string }`
- Verifica se ja existe audio para o roteiro (evita duplicata — retorna 409)
- Busca configuracao de voz na `ai_config` (mapeamento canal -> voz)
- Limpa texto Markdown para TTS (funcao `limparParaTTS`)
- Divide texto em chunks se necessario (funcao `splitTextForTTS`)
- Gera audio via OpenAI TTS-1-HD (modelo `tts-1-hd`)
- Upload MP3 para Supabase Storage (bucket `pulso-assets`, path: `audio/{canal}/{roteiro_id}_{timestamp}.mp3`)
- Cria registro em `pulso_content.audios` com URL publica, duracao, tamanho, voz, modelo

### 6.5 `/api/automation/publicar`

**Arquivo:** `app/api/automation/publicar/route.ts`

Publica conteudo nas plataformas.

- **Payload:** `{ pipeline_ids?: string[], plataformas?: string[] }`
- Busca conteudos com status PRONTO_PARA_PUBLICACAO ou PRONTO
- Para cada conteudo x plataforma:
  - Gera metadados otimizados via GPT-4o (`temperature=0.6`, `json_mode=true`) — titulo, descricao, hashtags adaptados
  - **Plataformas com API (ex: YouTube):** Publicacao direta (em implementacao)
  - **Plataformas sem API (Kwai, Facebook Reels, etc.):** Dispara Manus (browser automation) com callback
- Plataformas alvo padrao: `youtube_shorts`, `tiktok`, `instagram_reels`, `kwai`

### 6.6 `/api/automation/coletar-metricas`

**Arquivo:** `app/api/automation/coletar-metricas/route.ts`

Coleta metricas das plataformas sociais.

- **Payload:** `{ post_ids?: string[], dias_atras?: number }`
- Busca posts com status PUBLICADO nos ultimos N dias (default: 30)
- Coletores por plataforma:
  - **YouTube:** YouTube Data API v3 (statistics, contentDetails)
  - **TikTok:** TikTok Research API v2 (video query)
  - **Instagram:** Instagram Graph API v19.0 (media + insights)
  - **Kwai, Facebook, outros:** Marcados como coleta manual
- Upsert em `pulso_analytics.metricas_diarias` (chave: `post_id + data_ref`)
- Metricas coletadas: visualizacoes, likes, comentarios, compartilhamentos, salvamentos, impressoes, alcance

### 6.7 `/api/automation/relatorio`

**Arquivo:** `app/api/automation/relatorio/route.ts`

Gera relatorio semanal de performance via IA.

- **Payload:** `{ semanas?: number }`
- Agrega dados de todas as tabelas do pipeline:
  - Ideias (geradas, aprovadas, descartadas)
  - Roteiros (gerados, aprovados)
  - Audios gerados
  - Posts publicados
  - Automation queue (sucesso, erros, retries)
  - Metricas diarias agregadas (views, likes, comentarios, etc.)
- Gera relatorio via Claude API (preferencial) ou GPT-4o (fallback)
- Claude usa `claude-sonnet-4-6`, `temperature=0.4`, `max_tokens=4096`
- Salva resultado na `automation_queue`

### 6.8 `/api/automation/webhooks/manus-callback`

**Arquivo:** `app/api/automation/webhooks/manus-callback/route.ts`

Callback chamado pelo Manus apos publicacao via browser.

- **Payload esperado:**
  ```json
  {
    "success": true,
    "plataforma": "tiktok",
    "post_url": "https://...",
    "post_id_externo": "...",
    "metadata": { "pipeline_id": "...", "roteiro_id": "...", "canal_id": "..." },
    "error": null
  }
  ```
- Se sucesso: registra post em `pulso_distribution.posts`, atualiza queue
- Se falha: marca queue como ERRO
- Registra log em `logs_workflows`

---

## 7. Frontend

### 7.1 `lib/api/automation.ts`

Client de API para o frontend. Exporta:

- **Tipos:** `AutomationTipo`, `AutomationStatus`, `AutomationQueueItem`, `AutomationStats`
- **`automationApi.getQueue(filters?)`** — Busca itens da fila via `vw_automation_queue`
- **`automationApi.getStats()`** — Busca estatisticas via `vw_automation_stats`
- **`automationApi.gerarIdeias(canalId, quantidade)`** — Insere GERAR_IDEIAS na fila
- **`automationApi.aprovarIdeia(ideiaId)`** — Atualiza status da ideia para APROVADA (trigger enfileira roteiro)
- **`automationApi.gerarRoteiro(ideiaId, canalId?)`** — Insere GERAR_ROTEIRO na fila manualmente
- **`automationApi.aprovarRoteiro(roteiroId)`** — Atualiza status do roteiro para APROVADO (trigger enfileira audio)
- **`automationApi.gerarAudio(roteiroId, canalId?)`** — Insere GERAR_AUDIO na fila manualmente
- **`automationApi.publicar(pipelineIds, plataformas)`** — Insere PUBLICAR na fila
- **`automationApi.cancelar(id)`** — Cancela item pendente
- **`automationApi.retry(id)`** — Retry manual (reseta tentativas e status para PENDENTE)
- Triggers manuais: `triggerGerarIdeias`, `triggerPublicar`, `triggerColetarMetricas`, `triggerRelatorio`, `triggerProcessarFila`

### 7.2 `lib/hooks/use-automation.ts`

React Query hooks (TanStack Query):

- **`useAutomationQueue(filters?)`** — Lista fila com refetch a cada 10s
- **`useAutomationStats()`** — Estatisticas com staleTime e refetch a cada 30s
- **`useGerarIdeias()`** — Mutation para gerar ideias
- **`useAprovarIdeia()`** — Mutation para aprovar ideia (invalida queries de ideias, automation, roteiros)
- **`useGerarRoteiro()`** — Mutation para gerar roteiro manualmente
- **`useAprovarRoteiro()`** — Mutation para aprovar roteiro (invalida queries de roteiros, automation, pipeline)
- **`useGerarAudio()`** — Mutation para gerar audio manualmente
- **`usePublicar()`** — Mutation para publicar (invalida automation, pipeline, calendario)
- **`useCancelarAutomation()`** — Mutation para cancelar item
- **`useRetryAutomation()`** — Mutation para retry manual

### 7.3 Pagina `/automacao`

**Arquivo:** `app/automacao/page.tsx`

Dashboard de automacao com visao da fila, estatisticas por tipo, e acoes manuais (gerar ideias, processar fila, etc.).

---

## 8. Variaveis de Ambiente

### Obrigatorias

| Variavel                        | Descricao                                       |
|---------------------------------|-------------------------------------------------|
| `NEXT_PUBLIC_SUPABASE_URL`      | URL do projeto Supabase                         |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anon do Supabase                          |
| `SUPABASE_SERVICE_ROLE_KEY`     | Chave service_role (usada pelos workers)        |
| `WEBHOOK_SECRET`                | Segredo compartilhado entre app e automacao     |
| `OPENAI_API_KEY`                | Chave da API OpenAI (GPT-4o + TTS)             |

### Opcionais

| Variavel                  | Descricao                                          |
|---------------------------|----------------------------------------------------|
| `ANTHROPIC_API_KEY`       | Chave da API Anthropic (Claude, para relatorios)   |
| `ELEVENLABS_API_KEY`      | Chave ElevenLabs (TTS premium alternativo)         |
| `TTS_PROVIDER`            | Provider de TTS: `openai` (default) ou `elevenlabs`|
| `MANUS_WEBHOOK_URL`       | URL do webhook do Manus (browser automation)       |
| `MANUS_API_KEY`           | Chave de autenticacao do Manus                     |
| `YOUTUBE_API_KEY`         | Chave YouTube Data API v3 (coleta de metricas)     |
| `YOUTUBE_CLIENT_ID`       | Client ID OAuth YouTube (publicacao direta)        |
| `YOUTUBE_CLIENT_SECRET`   | Client Secret OAuth YouTube                        |
| `TIKTOK_API_KEY`          | Chave TikTok Research API                          |
| `INSTAGRAM_ACCESS_TOKEN`  | Token de acesso Instagram Graph API                |

---

## 9. Pipeline Completo

Fluxo passo a passo de uma ideia ate a publicacao:

```
1. GERACAO DE IDEIAS
   pg_cron (03:00 UTC) --> insere GERAR_IDEIAS na queue
   orchestrator --> chama /api/automation/gerar-ideias
   GPT-4o gera 5 ideias --> salva em pulso_content.ideias (status=RASCUNHO)

2. APROVACAO DE IDEIA
   Humano revisa ideia no dashboard /ideias
   Clica "Aprovar" --> status muda para APROVADA
   Trigger trg_ideia_aprovada --> insere GERAR_ROTEIRO na queue

3. GERACAO DE ROTEIRO
   orchestrator --> chama /api/automation/gerar-roteiro
   GPT-4o gera roteiro --> validacao de qualidade (score 0-100)
   Se auto_approve=true e score>=80: status=APROVADO (pula etapa 4)
   Se nao: status=RASCUNHO (aguarda revisao humana)
   Salva em pulso_content.roteiros

4. APROVACAO DE ROTEIRO
   Humano revisa roteiro no dashboard /roteiros
   Clica "Aprovar" --> status muda para APROVADO
   Trigger trg_roteiro_aprovado --> insere GERAR_AUDIO na queue

5. GERACAO DE AUDIO
   orchestrator --> chama /api/automation/gerar-audio
   Limpa markdown para TTS, divide em chunks se necessario
   OpenAI TTS-1-HD gera audio MP3 (voz configurada por canal)
   Upload para Supabase Storage (bucket pulso-assets)
   Salva registro em pulso_content.audios

6. PUBLICACAO
   pg_cron (06:00, 12:00, 18:00 UTC) --> insere PUBLICAR na queue
   orchestrator --> chama /api/automation/publicar
   GPT-4o gera metadados otimizados por plataforma
   Plataformas com API: publicacao direta (em implementacao)
   Plataformas sem API: Manus (browser automation) + callback

7. COLETA DE METRICAS
   pg_cron (22:00 UTC) --> insere COLETAR_METRICAS na queue
   orchestrator --> chama /api/automation/coletar-metricas
   Coleta via YouTube API, TikTok API, Instagram API
   Salva em pulso_analytics.metricas_diarias

8. RELATORIO SEMANAL
   pg_cron (Seg 09:00 UTC) --> insere RELATORIO_SEMANAL na queue
   Agrega metricas de todas as tabelas
   Claude API (ou GPT-4o fallback) gera analise
```

---

## 10. Retry Logic

O orchestrator implementa backoff exponencial para tarefas que falham:

| Tentativa | Delay         | Formula                |
|-----------|---------------|------------------------|
| 1a        | ~5 minutos    | 3^1 * 5min = 15min (*) |
| 2a        | ~15 minutos   | 3^2 * 5min = 45min     |
| 3a (max)  | ~45 minutos   | 3^3 * 5min = 135min    |

(*) A formula exata e `Math.pow(3, tentativas) * 5 * 60 * 1000` milissegundos, onde `tentativas` e o numero apos o incremento.

**Fluxo de retry:**

1. Worker falha -> orchestrator incrementa `tentativas`
2. Se `tentativas < max_tentativas` (default: 3):
   - Status muda para `RETRY`
   - Calcula `proximo_retry` com backoff exponencial
   - Salva erro no `erro_historico` (array JSONB)
3. Se `tentativas >= max_tentativas`:
   - Status muda para `ERRO` (permanente)
   - `completed_at` e preenchido
4. Job `processar-retry-queue` (a cada 30min): reativa itens cujo `proximo_retry <= NOW()`
5. Retry manual: via frontend (`automationApi.retry(id)`) reseta tentativas para 0 e status para PENDENTE

---

## Arquivos Relevantes

- **Migration:** `database/sql/migrations/20260324_create_automation_native.sql`
- **pg_cron:** `database/sql/migrations/20260324_setup_pg_cron_jobs.sql`
- **Orchestrator:** `app/api/automation/orchestrator/route.ts`
- **Workers:** `app/api/automation/gerar-ideias/route.ts`, `gerar-roteiro/route.ts`, `gerar-audio/route.ts`, `publicar/route.ts`, `coletar-metricas/route.ts`, `relatorio/route.ts`
- **Callback:** `app/api/automation/webhooks/manus-callback/route.ts`
- **API Client:** `lib/api/automation.ts`
- **Hooks:** `lib/hooks/use-automation.ts`
- **Prompts IA:** `lib/automation/prompts.ts`
- **Clientes IA:** `lib/automation/ai-clients.ts`
- **Supabase Server:** `lib/supabase/server.ts`
