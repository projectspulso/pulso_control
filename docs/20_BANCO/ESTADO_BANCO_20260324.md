# Estado do Banco de Dados — 2026-03-24

Snapshot completo do estado do banco Supabase/PostgreSQL apos todas as migrations ate esta data.

---

## 1. Schemas

| Schema               | Descricao                                                  |
|----------------------|------------------------------------------------------------|
| `pulso_core`         | Base do ecossistema: canais, plataformas, series, tags, usuarios |
| `pulso_content`      | Pipeline de conteudo: ideias, roteiros, conteudos, variantes |
| `pulso_assets`       | Arquivos de midia: assets, vinculos com variantes          |
| `pulso_distribution` | Publicacao: posts em plataformas, logs de API              |
| `pulso_automation`   | Automacao: fila de tarefas, workflows, execucoes, config IA |
| `pulso_analytics`    | Metricas: eventos brutos, metricas diarias agregadas       |
| `public`             | Views publicas expostas via PostgREST/Supabase Client      |

---

## 2. Tabelas por Schema

### 2.1 `pulso_core` — Base

| Tabela                | Descricao                                                                 |
|-----------------------|---------------------------------------------------------------------------|
| `canais`              | Canais logicos do ecossistema (ex: Pulso Dark PT). Campos: nome, slug, descricao, idioma, status, metadata |
| `plataformas`         | Tipos de plataformas suportadas (YouTube Shorts, TikTok, etc.)            |
| `canais_plataformas`  | Mapeia canal PULSO a contas especificas em cada plataforma (channel_id, @username) |
| `series`              | Colecoes de episodios dentro de um canal (ex: Curiosidades Dark)          |
| `tags`                | Tags gerais para classificacao de conteudo                                |
| `series_tags`         | Ligacao N:N entre series e tags                                           |
| `usuarios_internos`   | Perfis internos (roteirista, editor, gestor). Opcional ligacao com auth.users |

### 2.2 `pulso_content` — Conteudo

| Tabela                | Descricao                                                                 |
|-----------------------|---------------------------------------------------------------------------|
| `ideias`              | Banco de ideias brutas. Campos: titulo, descricao, origem (MANUAL/IA/TREND), prioridade, status, tags, linguagem |
| `roteiros`            | Roteiros derivados das ideias. Suporta versionamento. Campos: conteudo_md, duracao_estimado_segundos, status |
| `conteudos`           | Pecas de conteudo (episodios) ligadas a roteiros/series/canais            |
| `conteudo_variantes`  | Variacoes de um conteudo (A/B, cortes, adaptacoes por plataforma). Campos: titulo_publico, legenda, hashtags |

### 2.3 `pulso_assets` — Midia

| Tabela                        | Descricao                                                         |
|-------------------------------|-------------------------------------------------------------------|
| `assets`                      | Cadastro de todos os assets de midia (audio, video, thumbnails). Campos: tipo, caminho_storage, provedor, duracao, tamanho |
| `conteudo_variantes_assets`   | Vinculo N:N entre variantes de conteudo e assets. Campo `papel`: VIDEO_PRINCIPAL, AUDIO_TTS, THUMBNAIL, LEGENDAS |

### 2.4 `pulso_distribution` — Publicacao

| Tabela       | Descricao                                                                 |
|--------------|---------------------------------------------------------------------------|
| `posts`      | Cada linha = 1 publicacao em 1 plataforma. Campos: status, titulo_publicado, url_publicacao, data_agendada, data_publicacao |
| `posts_logs` | Logs de retorno de APIs / erros de publicacao. Campos: tipo (REQUEST/RESPONSE/ERRO), mensagem, payload |

### 2.5 `pulso_automation` — Automacao

| Tabela                | Descricao                                                                 |
|-----------------------|---------------------------------------------------------------------------|
| `automation_queue`    | Fila central de automacao AI-native (substitui n8n). Ver doc AUTOMACAO_AI_NATIVE.md |
| `ai_config`           | Configuracao centralizada de parametros de IA (modelo, vozes, thresholds)  |
| `workflows`           | Workflows cadastrados (legado n8n). Campos: nome, slug, origem, referencia_externa, configuracao |
| `workflow_execucoes`  | Historico de execucoes de workflows. Campos: entidade_tipo, entidade_id, status, payload_entrada/saida |

### 2.6 `pulso_analytics` — Metricas

| Tabela             | Descricao                                                                 |
|--------------------|---------------------------------------------------------------------------|
| `eventos`          | Eventos brutos coletados via APIs / webhooks. Campos: tipo, quantidade, valor_numerico, data_evento |
| `metricas_diarias` | Metricas agregadas diarias por post + plataforma. Campos: views, likes, deslikes, comentarios, compartilhamentos, watch_time |

---

## 3. Enums (8 tipos)

| Enum                          | Valores                                                                            |
|-------------------------------|------------------------------------------------------------------------------------|
| `pulso_status_geral`          | ATIVO, INATIVO, ARQUIVADO                                                          |
| `pulso_status_ideia`          | RASCUNHO, EM_DESENVOLVIMENTO, APROVADA, DESCARTADA                                 |
| `pulso_status_roteiro`        | RASCUNHO, EM_REVISAO, APROVADO, PUBLICADO, ARQUIVADO                               |
| `pulso_tipo_asset`            | AUDIO, VIDEO, IMAGEM, TEXTO, OUTRO                                                 |
| `pulso_status_conteudo`       | RASCUNHO, PRONTO_PARA_PRODUCAO, EM_PRODUCAO, PRONTO_PARA_PUBLICACAO, PUBLICADO, PAUSADO, ARQUIVADO |
| `pulso_plataforma_tipo`       | YOUTUBE_SHORTS, YOUTUBE_LONGO, TIKTOK, INSTAGRAM_REELS, INSTAGRAM_FEED, FACEBOOK_REELS, KWAI, OUTRO |
| `pulso_status_post`           | AGENDADO, PUBLICADO, ERRO_PUBLICACAO, CANCELADO                                    |
| `pulso_tipo_evento_analytics` | VIEW, LIKE, DESLIKE, COMENTARIO, COMPARTILHAMENTO, CLIQUES_LINK, INSCRICAO, OUTRO  |

---

## 4. Views Publicas (14 views)

### Views de dados (schema public, fonte: 002_pulso_views.sql)

| View                                    | Descricao                                                     |
|-----------------------------------------|---------------------------------------------------------------|
| `vw_pulso_canais`                       | Canais com todos os campos                                    |
| `vw_pulso_series`                       | Series com nome do canal (JOIN canais)                        |
| `vw_pulso_ideias`                       | Ideias com canal, serie, criado_por (JOINs)                   |
| `vw_pulso_roteiros`                     | Roteiros com ideia, canal, serie, criado_por, revisado_por    |
| `vw_pulso_conteudos`                    | Conteudos (episodios) com roteiro, serie, canal               |
| `vw_pulso_conteudo_variantes`           | Variantes com conteudo, canal, serie                          |
| `vw_pulso_conteudo_variantes_assets`    | Assets vinculados a variantes (JOIN completo)                 |
| `vw_pulso_posts`                        | Posts com variante, conteudo, canal, plataforma               |
| `vw_pulso_posts_metricas_diarias`       | Metricas diarias com dados do post e plataforma               |
| `vw_pulso_posts_resumo`                 | Resumo de performance agregado por post (totais)              |
| `vw_pulso_workflows`                    | Workflows cadastrados                                         |
| `vw_pulso_workflow_execucoes`           | Execucoes de workflows com nome do workflow                   |

### Views de automacao (fonte: 20260324_create_automation_native.sql)

| View                    | Descricao                                                                |
|-------------------------|--------------------------------------------------------------------------|
| `vw_automation_queue`   | Fila de automacao com campo calculado `duracao_segundos`. Ordenada por created_at DESC |
| `vw_automation_stats`   | Resumo por tipo nos ultimos 7 dias: pendentes, processando, sucesso, erros, retry, total, ultima_execucao_ok, duracao_media_seg |

---

## 5. Triggers (3 triggers)

| Trigger                | Tabela                            | Evento            | Descricao                                          |
|------------------------|-----------------------------------|--------------------|-----------------------------------------------------|
| `trg_ideia_aprovada`   | `pulso_content.ideias`            | AFTER UPDATE(status) | Ideia aprovada --> enfileira GERAR_ROTEIRO         |
| `trg_roteiro_aprovado` | `pulso_content.roteiros`          | AFTER UPDATE(status) | Roteiro aprovado --> enfileira GERAR_AUDIO         |
| `trg_aq_updated_at`    | `pulso_automation.automation_queue` | BEFORE UPDATE      | Atualiza updated_at automaticamente                |

---

## 6. pg_cron (8 jobs)

| Job                        | Schedule          | Descricao                                          |
|----------------------------|-------------------|----------------------------------------------------|
| `gerar-ideias-diario`      | `0 3 * * *`       | Gerar ideias para canais ativos (rotacao diaria)   |
| `check-roteiros-pendentes` | `*/5 * * * *`     | Safety net: ideias aprovadas sem roteiro           |
| `check-audios-pendentes`   | `*/10 * * * *`    | Safety net: roteiros aprovados sem audio           |
| `publicar-conteudos`       | `0 6,12,18 * * *` | Publicar conteudos prontos (3x/dia)               |
| `processar-retry-queue`    | `*/30 * * * *`    | Reativar itens em RETRY                            |
| `coletar-metricas`         | `0 22 * * *`      | Coletar metricas das plataformas                   |
| `relatorio-semanal`        | `0 9 * * 1`       | Gerar relatorio semanal                            |
| `limpar-queue-antiga`      | `0 4 * * 0`       | Limpeza de itens antigos (>30 dias)                |

---

## 7. Extensions Ativas

| Extensao    | Versao  | Descricao                                        |
|-------------|---------|--------------------------------------------------|
| `pg_cron`   | v1.6.4  | Agendamento de jobs SQL periodicos               |
| `pg_net`    | v0.19.5 | Chamadas HTTP/HTTPS de dentro do banco           |

---

## 8. Seeds Iniciais

Dados inseridos via `database/sql/seeds/001_initial_data.sql`:

| Entidade     | Quantidade | Detalhes                                                          |
|--------------|------------|-------------------------------------------------------------------|
| Canal        | 1          | Pulso Dark PT (slug: `pulso-dark-pt`, idioma: pt-BR, status: ATIVO) |
| Series       | 2          | Curiosidades Dark, Misterios Urbanos                               |
| Plataformas  | 6          | YouTube Shorts, YouTube, TikTok, Instagram Reels, Kwai, Facebook Reels |
| Tags         | 6          | Historia, Ciencia, Misterio, Tecnologia, Cultura Pop, True Crime   |

Dados inseridos via `20260324_create_automation_native.sql`:

| Entidade     | Quantidade | Detalhes                                                          |
|--------------|------------|-------------------------------------------------------------------|
| AI Config    | 9          | openai_model, tts_provider, tts_model, tts_voice_default, tts_voices, auto_approve_roteiro, auto_approve_threshold, max_ideias_por_dia, publicacao_horarios |

---

## 9. RLS (Row Level Security)

Todas as tabelas tem RLS habilitado com politicas **permissivas** para o MVP:

- **Padrao geral:** `FOR SELECT USING (true)` e `FOR ALL USING (true) WITH CHECK (true)`
- Grants para `anon`, `authenticated`, `service_role`
- Motivo: MVP prioriza funcionalidade. Politicas restritivas serao implementadas antes do lancamento publico.

Tabelas com RLS confirmado:
- `pulso_automation.automation_queue` — read (SELECT true), write (ALL true/true)
- `pulso_automation.ai_config` — read (SELECT true), write (ALL true/true)
- Demais tabelas seguem o mesmo padrao via grants amplos

---

## 10. PostgREST Config

Os schemas customizados sao expostos via configuracao `pgrst.db_schemas` no Supabase:

```sql
-- Expor schemas via PostgREST
ALTER ROLE authenticator SET pgrst.db_schemas = 'public, pulso_core, pulso_content, pulso_assets, pulso_distribution, pulso_automation, pulso_analytics';
```

Todas as views no schema `public` sao acessiveis diretamente pelo Supabase Client (`.from('vw_pulso_ideias')` etc.).

Para acessar tabelas em schemas customizados, o frontend usa `.schema('pulso_content').from('ideias')`.

---

## Arquivos SQL Relevantes

- **Schema principal:** `database/sql/schema/001_pulso_schemas.sql`
- **Views publicas:** `database/sql/schema/002_pulso_views.sql`
- **Seeds iniciais:** `database/sql/seeds/001_initial_data.sql`
- **Migration automacao:** `database/sql/migrations/20260324_create_automation_native.sql`
- **pg_cron jobs:** `database/sql/migrations/20260324_setup_pg_cron_jobs.sql`
- **Migration workflow queue (legado):** `database/sql/migrations/20260311_create_workflow_queue_runtime_mvp.sql`
- **Maintenance:** `database/sql/maintenance/force-postgrest-reload.sql`
- **Permissoes:** `database/sql/permissions/verificar-permissoes.sql`
