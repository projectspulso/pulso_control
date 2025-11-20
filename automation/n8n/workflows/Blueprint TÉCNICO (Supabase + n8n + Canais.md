# PULSO – Blueprint Técnico V1 (Supabase + n8n + Canais Dark)

## 1. Visão Técnica

- Banco de dados: **Supabase (PostgreSQL)**
- Orquestrador: **n8n**
- Alvos de publicação:
  - YouTube (Shorts)
  - TikTok
  - Instagram Reels
  - Kwai
- Filosofia:
  - Tudo registrado no banco (ideias, roteiros, áudios, vídeos, publicações, métricas).
  - n8n faz a ponte entre IA, banco e plataformas.
  - Fácil de auditar, escalar e automatizar.

---

## 2. Organização por Schemas (Sugestão)

### 2.1. Schemas

- `pulso_core`  
  Configurações gerais do sistema, usuários internos, canais, plataformas.

- `pulso_conteudo`  
  Ideias, roteiros, assets, publicações.

- `pulso_metrica`  
  Métricas por vídeo, por canal, por plataforma.

---

## 3. Tabelas Principais (Modelo Conceitual)

### 3.1. Tabela `pulso_core.canais`

- Descrição: cada “canal dark” que vamos operar.
- Campos sugeridos:
  - `id` (uuid, PK)
  - `nome` (text) – ex.: “PULSO Curiosidades”
  - `slug` (text, unique) – ex.: `pulso_curiosidades`
  - `descricao` (text)
  - `ativo` (boolean, default true)
  - `created_at`
  - `updated_at`

---

### 3.2. Tabela `pulso_core.plataformas`

- Ex.: YouTube, TikTok, Instagram, Kwai.
- Campos sugeridos:
  - `id` (uuid, PK)
  - `nome` (text) – “YouTube”, “TikTok”
  - `tipo` (text) – “short_video”
  - `slug` (text, unique) – `youtube`, `tiktok`
  - `api_config` (jsonb) – chaves, tokens, urls
  - `ativo` (boolean)
  - `created_at`
  - `updated_at`

---

### 3.3. Tabela `pulso_conteudo.ideias`

- Função: backlog de temas.
- Campos sugeridos:
  - `id` (uuid, PK)
  - `canal_id` (uuid, FK → `pulso_core.canais`)
  - `tipo` (text) – ex.: `curiosidade`, `psicologia`, `storytelling`
  - `titulo_bruto` (text) – ideia resumida
  - `descricao_bruta` (text) – descrição mais detalhada
  - `prioridade` (integer) – 1 a 5
  - `status` (text) – `nova`, `roteiro_gerado`, `descartada`
  - `tags` (text[] ou jsonb)
  - `created_at`
  - `updated_at`

---

### 3.4. Tabela `pulso_conteudo.roteiros`

- Função: roteiros já estruturados prontos para TTS/vídeo.
- Campos sugeridos:
  - `id` (uuid, PK)
  - `ideia_id` (uuid, FK → `pulso_conteudo.ideias`)
  - `canal_id` (uuid, FK)
  - `titulo_video` (text)
  - `roteiro_texto` (text) – texto completo para narração
  - `tipo` (text) – mesmo tipo da ideia
  - `duracao_estimada_seg` (integer)
  - `lingua` (text) – `pt-BR` inicialmente
  - `status` (text) – `gerado`, `aprovado`, `rejeitado`
  - `meta` (jsonb) – espaço para extras (ex.: persona de voz)
  - `created_at`
  - `updated_at`

---

### 3.5. Tabela `pulso_conteudo.assets_audio`

- Função: arquivos de áudio gerados por TTS.
- Campos sugeridos:
  - `id` (uuid, PK)
  - `roteiro_id` (uuid, FK)
  - `url_arquivo` (text) – storage Supabase ou outro
  - `tts_engine` (text) – `gcp`, `elevenlabs`, etc.
  - `voz` (text) – `voz_masculina_calma`, etc.
  - `duracao_seg` (integer)
  - `status` (text) – `gerado`, `erro`, `publicado`
  - `created_at`
  - `updated_at`

---

### 3.6. Tabela `pulso_conteudo.assets_video`

- Função: vídeos prontos retornados por IA ou template.
- Campos sugeridos:
  - `id` (uuid, PK)
  - `roteiro_id` (uuid, FK)
  - `audio_id` (uuid, FK → `assets_audio`)
  - `formato` (text) – ex.: `9x16`
  - `resolucao` (text) – `1080x1920`
  - `duracao_seg` (integer)
  - `url_arquivo` (text)
  - `engine` (text) – `kling`, `capcut`, etc.
  - `status` (text) – `gerado`, `aprovado`, `publicado`
  - `created_at`
  - `updated_at`

---

### 3.7. Tabela `pulso_conteudo.publicacoes`

- Função: registrar cada publicação em cada plataforma.
- Campos sugeridos:
  - `id` (uuid, PK)
  - `video_id` (uuid, FK → `assets_video`)
  - `canal_id` (uuid, FK → `pulso_core.canais`)
  - `plataforma_id` (uuid, FK → `pulso_core.plataformas`)
  - `titulo_publicado` (text)
  - `descricao_publicada` (text)
  - `tags_publicadas` (text[])
  - `url_publicacao` (text)
  - `id_externo` (text) – ID do vídeo na plataforma
  - `status` (text) – `agendado`, `publicado`, `erro`
  - `data_agendada` (timestamp)
  - `data_publicada` (timestamp)
  - `created_at`
  - `updated_at`

---

### 3.8. Tabela `pulso_metrica.metrica_publicacao`

- Função: armazenar métricas que o n8n vai buscar periodicamente.
- Campos sugeridos:
  - `id` (uuid, PK)
  - `publicacao_id` (uuid, FK → `pulso_conteudo.publicacoes`)
  - `plataforma_id` (uuid, FK)
  - `views` (bigint)
  - `likes` (bigint)
  - `comentarios` (bigint)
  - `compartilhamentos` (bigint)
  - `inscritos_gerados` (integer) – quando a API permitir
  - `watchtime_segundos` (bigint)
  - `capturado_em` (timestamp) – data/hora da captura
  - `created_at`

---

## 4. Fluxos no n8n (Workflows)

### 4.1. Workflow 01 – IDEIAS → ROTEIROS

**Objetivo:** Pegar ideias “nova” e gerar roteiros prontos.

Passo a passo:

1. **Trigger**:
   - Type: Cron (por ex.: a cada 15 minutos).
2. **Node: Postgres (Supabase) – Buscar ideias**
   - Query:
     - Selecionar X ideias com `status = 'nova'`.
3. **Node: Split In Batches**
   - Processar 1 por vez.
4. **Node: HTTP Request (IA / LLM)**
   - Envia a `descricao_bruta`, `tipo` e recebe `roteiro_texto`, `titulo_sugerido`, `duracao_estimada`.
5. **Node: Postgres – Inserir em roteiros**
   - Insere em `pulso_conteudo.roteiros`.
6. **Node: Postgres – Atualizar ideia**
   - Atualiza `status = 'roteiro_gerado'`.

---

### 4.2. Workflow 02 – ROTEIROS → ÁUDIO (TTS)

**Objetivo:** Transformar roteiros aprovados em áudio.

Passos:

1. Trigger (cron).
2. Postgres – buscar `roteiros` com `status = 'aprovado'` e sem `assets_audio`.
3. Para cada roteiro:
   - HTTP Request → TTS (Google / ElevenLabs / outro).
   - Salvar arquivo no storage (Supabase Storage).
   - Postgres → inserir em `assets_audio`.
   - Atualizar `roteiros.status = 'audio_gerado'`.

---

### 4.3. Workflow 03 – ÁUDIO → VÍDEO

**Objetivo:** Gerar vídeo com base no áudio + template.

Passos:

1. Trigger (cron ou manual).
2. Postgres – buscar `assets_audio` com status `gerado` sem vídeo associado.
3. Para cada:
   - HTTP Request → serviço de vídeo (IA ou template).
   - Receber `url_video`.
   - Salvar metadata em `assets_video`.
   - Atualizar `assets_audio.status = 'usado'` ou similar.

---

### 4.4. Workflow 04 – VÍDEO → PUBLICAÇÃO

**Objetivo:** Publicar ou agendar nas plataformas.

Passos:

1. Trigger (cron).
2. Postgres – buscar `assets_video` com `status = 'aprovado'` e sem `publicacoes`.
3. Para cada vídeo:
   - Buscar `canal` e lista de `plataformas` ativas.
   - Montar payload (título, descrição, tags) com base no `roteiro`.
   - Enviar via HTTP Request para API da plataforma (ou registrar para upload manual).
   - Salvar em `publicacoes` com `url_publicacao`, `id_externo`.
   - Atualizar `assets_video.status = 'publicado'`.

Observação:

- Se APIs completas não estiverem disponíveis, esse workflow pode apenas:
  - Gerar descrições, títulos e tags.
  - Marcar no banco como “pronto para upload manual”.
  - Gerar um dashboard de “pendentes de upload”.

---

### 4.5. Workflow 05 – MÉTRICAS → SUPABASE

**Objetivo:** Atualizar métricas de desempenho.

Passos:

1. Trigger (cron diário ou a cada X horas).
2. Postgres – buscar `publicacoes` com `status = 'publicado'`.
3. Para cada:
   - HTTP Request → API da plataforma (YouTube, TikTok etc.).
   - Receber métricas (views, likes, etc.).
   - Inserir linha em `pulso_metrica.metrica_publicacao`.
4. Opcional:
   - Criar view agregada no Supabase para dashboards.
   - Ex.: `view_metrica_resumo_canal`.

---

## 5. Convenções de Nome & Organização no n8n

- Nome dos workflows:

  - `PULSO_01_Ideias_para_Roteiros`
  - `PULSO_02_Roteiros_para_Audio`
  - `PULSO_03_Audio_para_Video`
  - `PULSO_04_Video_para_Publicacao`
  - `PULSO_05_Metricas_para_Supabase`

- Pastas no n8n:
  - `/PULSO/01_Backlog`
  - `/PULSO/02_Producao`
  - `/PULSO/03_Publicacao`
  - `/PULSO/04_Metricas`

---

## 6. Roadmap Técnico Enxuto

1. Criar schema e tabelas no Supabase (mínimo: `canais`, `plataformas`, `ideias`, `roteiros`).
2. Criar Workflow 01 (ideias → roteiros) com IA.
3. Validar geração de roteiros manualmente.
4. Implementar TTS (Workflow 02).
5. Implementar geração de vídeo (Workflow 03) – mesmo que inicialmente com serviços simples.
6. Implementar workflow de publicação (nem que seja só para preparar título/descrição).
7. Implementar coleta de métricas (Workflow 05).
8. Construir dashboards simples (a partir de views).

---

## 7. Próximos Passos a partir deste Script

- Detalhar DDL (CREATE TABLE) completo de todas as tabelas.
- Definir quais serviços de:
  - IA de texto
  - TTS
  - Vídeo
  - Integração com YouTube/TikTok
- Mapear limites de API e custos para cada serviço.
- Conectar esse blueprint ao blueprint de conteúdo (Script 1).
