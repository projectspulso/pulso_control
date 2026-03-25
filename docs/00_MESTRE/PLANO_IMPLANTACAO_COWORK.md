# Plano de Implantação CoWork — Automação AI-Native (sem n8n)

## Visão Geral

Este documento é o guia COMPLETO para o CoWork (Claude + GPT + Manus) assumir toda a automação do PULSO, substituindo o n8n por uma arquitetura AI-native baseada em Supabase + Edge Functions + pg_cron.

### O que muda

| Antes (n8n) | Depois (AI-Native) |
|---|---|
| n8n Cloud ($20-50/mês) | Supabase Edge Functions (grátis no Pro) |
| CRON triggers no n8n | pg_cron nativo do Supabase |
| Polling a cada 5-10min | Triggers instantâneos no banco |
| Workflows visuais | Código em TypeScript (Edge Functions) |
| Retry manual | Fila automation_queue com retry automático |
| 1 ponto de falha (n8n) | Zero dependência externa extra |

### Papel de cada AI no CoWork

| Agente | Papel | Trigger |
|---|---|---|
| **Claude (Opus)** | Arquiteto. Cria código, queries, Edge Functions. Analisa métricas. Otimiza prompts. | Claude Code / API |
| **GPT-4o** | Motor de geração de conteúdo (ideias, roteiros, títulos, hashtags). | Chamado via API pelas Edge Functions |
| **OpenAI TTS** | Gera áudio narrado dos roteiros. | Chamado via API pela Edge Function gerar-audio |
| **Manus** | Publicação em plataformas via browser automation. Coleta métricas visuais. | Webhook quando conteúdo está PRONTO_PUBLICACAO |
| **Claude API** | Alternativa ao GPT. Análise de qualidade. Review de roteiros. | Edge Function |

---

## Arquitetura Final

```
┌─────────────────────────────────────────────────────────────────┐
│                     SUPABASE (Cérebro Central)                   │
│                                                                   │
│  ┌─ pg_cron ──────────────────────────────────────────────────┐  │
│  │  03:00 UTC  → INSERT automation_queue (GERAR_IDEIAS)       │  │
│  │  */5min     → INSERT automation_queue (GERAR_ROTEIRO)      │  │
│  │  */10min    → INSERT automation_queue (GERAR_AUDIO)         │  │
│  │  06,12,18h  → INSERT automation_queue (PUBLICAR)            │  │
│  │  */30min    → INSERT automation_queue (PROCESSAR_FILA)      │  │
│  │  22:00 UTC  → INSERT automation_queue (COLETAR_METRICAS)   │  │
│  │  SEG 09:00  → INSERT automation_queue (RELATORIO_SEMANAL)  │  │
│  └────────────────────────────────────────────────────────────┘  │
│                              │                                    │
│                              ▼                                    │
│  ┌─ automation_queue ─────────────────────────────────────────┐  │
│  │ id | tipo | payload | status | scheduled_at | tentativas   │  │
│  └────────────────────────────────────────────────────────────┘  │
│                              │                                    │
│  ┌─ Database Triggers ───────┴────────────────────────────────┐  │
│  │  ON INSERT automation_queue → pg_net.http_post(Edge Fn)    │  │
│  │  ON UPDATE ideias (status=APROVADA) → queue GERAR_ROTEIRO  │  │
│  │  ON UPDATE roteiros (status=APROVADO) → queue GERAR_AUDIO  │  │
│  │  ON UPDATE pipeline (status=PRONTO) → queue PUBLICAR       │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌─ Storage ──────────────────────────────────────────────────┐  │
│  │  /pulso-assets/audio/{canal}/{id}.mp3                      │  │
│  │  /pulso-assets/video/{canal}/{id}.mp4                      │  │
│  │  /pulso-assets/thumb/{canal}/{id}.jpg                      │  │
│  └────────────────────────────────────────────────────────────┘  │
└───────────────────────────┬───────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│              SUPABASE EDGE FUNCTIONS (Workers)                    │
│                                                                   │
│  /functions/orchestrator      → Processa itens da fila           │
│  /functions/gerar-ideias      → GPT-4o → ideias no banco        │
│  /functions/gerar-roteiro     → GPT-4o/Claude → roteiro no banco│
│  /functions/gerar-audio       → OpenAI TTS → MP3 no Storage     │
│  /functions/preparar-video    → (futuro) Runway/Kling → MP4     │
│  /functions/publicar          → API direta ou → trigger Manus   │
│  /functions/coletar-metricas  → YouTube/TikTok APIs → banco     │
│  /functions/relatorio         → Claude API → análise semanal    │
└───────────────────────────┬───────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PUBLICAÇÃO (Multi-canal)                       │
│                                                                   │
│  ┌─ APIs Diretas ──────────────────────────────────────────┐    │
│  │  YouTube Data API v3  → upload + metadata               │    │
│  │  TikTok API           → upload (quando aprovado)        │    │
│  │  Instagram Graph API  → upload via Business account     │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ┌─ Manus (Browser Automation) ────────────────────────────┐    │
│  │  Kwai          → navega, posta, copia link              │    │
│  │  Facebook      → fallback quando API falha              │    │
│  │  Qualquer      → plataforma sem API disponível          │    │
│  │                                                          │    │
│  │  Trigger: webhook POST com payload:                      │    │
│  │  {                                                       │    │
│  │    "task": "publicar",                                   │    │
│  │    "plataforma": "kwai",                                 │    │
│  │    "video_url": "https://storage.../video.mp4",          │    │
│  │    "titulo": "...",                                      │    │
│  │    "descricao": "...",                                   │    │
│  │    "hashtags": ["..."],                                  │    │
│  │    "callback_url": "https://app/api/webhooks/publish-ok" │    │
│  │  }                                                       │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Pipeline Completo: Ideia → Publicação

### Etapa 0: Geração de Ideias (automática)

**Trigger**: pg_cron diário às 03:00 UTC
**Worker**: Edge Function `gerar-ideias`
**Processo**:
1. Consulta canal do dia (rotação por dia da semana)
2. Busca série ativa do canal
3. Monta prompt com contexto do canal + série + formato
4. Chama GPT-4o com prompt estruturado
5. Recebe JSON com 5-10 ideias
6. Salva em `pulso_content.ideias` (status: RASCUNHO)
7. Registra execução em `automation_queue` (status: sucesso)

**Prompt GPT para ideias**:
```
Você é um produtor de conteúdo especializado em vídeos curtos virais.

Canal: {canal.nome}
Descrição: {canal.descricao}
Formato: Shorts/Reels/TikTok (15-60 segundos)
Idioma: {canal.idioma}
Série atual: {serie.nome} - {serie.descricao}

Gere {quantidade} ideias de vídeos curtos para este canal.
Para cada ideia, retorne um JSON com:
- titulo: string (max 80 chars, gancho forte)
- descricao: string (1-2 frases com hook + contexto)
- tags: string[] (3-5 tags relevantes)
- duracao_estimada: number (segundos)
- tipo_formato: string (curiosidade_rapida|psicologia|storytelling|misterio|motivacional)
- prioridade: number (1-10, baseado em potencial viral)
- gancho_sugerido: string (frase de abertura do vídeo)

REGRAS:
- Cada título deve gerar curiosidade imediata
- A descrição deve ser um mini-pitch que "vende" a ideia
- Priorize temas que geram comentários e compartilhamentos
- Evite temas sensíveis ou polêmicos demais
- Pense em retenção: os primeiros 3 segundos decidem tudo

Retorne APENAS o JSON array, sem explicações.
```

### Etapa 1: Geração de Roteiro

**Trigger**:
- Automático: trigger no banco quando ideia.status muda para APROVADA
- CRON: a cada 5 minutos (backup para ideias que passaram sem trigger)
**Worker**: Edge Function `gerar-roteiro`
**Processo**:
1. Busca ideias APROVADAS sem roteiro vinculado
2. Para cada ideia, monta prompt com contexto completo
3. Chama GPT-4o ou Claude
4. Valida estrutura do roteiro (tem hook? tem CTA? duração OK?)
5. Salva em `pulso_content.roteiros` (status: RASCUNHO ou APROVADO se auto_approve)
6. Cria entrada em `pulso_content.pipeline_producao` se não existir

**Prompt GPT para roteiros**:
```
Você é um roteirista profissional de vídeos curtos virais.

CANAL: {canal.nome}
FORMATO: Vídeo curto para {plataformas} ({duracao_alvo} segundos)
IDEIA: {ideia.titulo}
CONTEXTO: {ideia.descricao}
GANCHO SUGERIDO: {ideia.gancho_sugerido}
TIPO: {ideia.tipo_formato}

Escreva um roteiro completo em texto corrido (NÃO use marcações de tempo).

ESTRUTURA OBRIGATÓRIA:

1. HOOK (primeiros 3 segundos):
   - Frase de impacto que PRENDE atenção
   - Deve gerar curiosidade ou choque leve
   - Exemplos: "Você sabia que...", "Isso vai mudar como você pensa sobre..."

2. DESENVOLVIMENTO (corpo, 70% do tempo):
   - Informação entregue de forma envolvente
   - Use storytelling, dados surpreendentes, comparações
   - Mantenha ritmo rápido, sem enrolação
   - Cada frase deve agregar valor

3. TWIST/CLÍMAX (momento de pico):
   - Revelação surpreendente ou insight poderoso
   - O "momento wow" que faz a pessoa querer compartilhar

4. CTA (últimos 3-5 segundos):
   - Chamada para ação natural e não forçada
   - Variações: "Segue o PULSO", "Comenta", "Salva esse vídeo", "Marca alguém"

REGRAS:
- Escreva em {idioma}, tom conversacional e direto
- Duração alvo: {duracao_alvo} segundos (~{palavras_alvo} palavras)
- NÃO use emojis no roteiro
- NÃO use hashtags no roteiro
- NÃO inclua indicações de edição de vídeo
- O texto será lido por uma voz narrada (TTS)
- Cada parágrafo = uma pausa natural na narração

Retorne APENAS o roteiro em texto, sem títulos ou marcações.
```

**Validação automática**:
```typescript
function validarRoteiro(roteiro: string, duracaoAlvo: number): QualityScore {
  const palavras = roteiro.split(/\s+/).length
  const caracteres = roteiro.length
  const paragrafos = roteiro.split('\n\n').filter(Boolean).length
  const duracaoEstimada = palavras / 2.5 // ~2.5 palavras/segundo pt-BR

  return {
    tem_hook: paragrafos >= 2, // primeiro parágrafo é o hook
    tem_cta: /segue|comenta|salva|marca|pulso/i.test(roteiro),
    duracao_adequada: Math.abs(duracaoEstimada - duracaoAlvo) < 15,
    tamanho_ok: palavras >= 50 && palavras <= 500,
    paragrafos_ok: paragrafos >= 3,
    score: calculateScore(...) // 0-100
  }
}
```

### Etapa 2: Geração de Áudio (TTS)

**Trigger**:
- Automático: trigger no banco quando roteiro.status muda para APROVADO
- CRON: a cada 10 minutos (backup)
**Worker**: Edge Function `gerar-audio`
**Processo**:
1. Busca roteiros APROVADOS sem áudio vinculado
2. Limpa texto (remove markdown, normaliza pronúncia)
3. Divide em chunks se > 4000 caracteres
4. Chama OpenAI TTS-1-HD (ou ElevenLabs)
5. Se múltiplos chunks, concatena áudios
6. Upload para Supabase Storage: `/pulso-assets/audio/{canal_slug}/{roteiro_id}.mp3`
7. Cria registro em `pulso_content.audios`
8. Atualiza pipeline_producao

**Config TTS**:
```typescript
const TTS_CONFIG = {
  provider: 'openai', // ou 'elevenlabs'
  openai: {
    model: 'tts-1-hd',
    voice: 'alloy', // para pt-BR
    speed: 1.0,
    response_format: 'mp3',
  },
  elevenlabs: {
    voice_id: '{configurável}',
    model_id: 'eleven_multilingual_v2',
    stability: 0.5,
    similarity_boost: 0.75,
  },
  // Mapeamento de vozes por canal (futuro)
  vozes_por_canal: {
    'pulso-curiosidades': 'alloy',
    'pulso-misterios': 'onyx', // voz mais grave
    'pulso-motivacional': 'nova', // voz energética
    'pulso-psicologia': 'shimmer', // voz calma
  }
}
```

**Limpeza de texto para TTS**:
```typescript
function limparParaTTS(texto: string): string {
  return texto
    .replace(/#{1,6}\s/g, '')          // Remove markdown headers
    .replace(/\*\*(.*?)\*\*/g, '$1')   // Remove bold
    .replace(/\*(.*?)\*/g, '$1')       // Remove italic
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links → texto
    .replace(/\n{3,}/g, '\n\n')        // Normaliza quebras
    .replace(/(\d+)%/g, '$1 por cento') // Números
    .replace(/R\$\s?(\d+)/g, '$1 reais') // Moeda
    .replace(/https?:\/\/\S+/g, '')    // Remove URLs
    .trim()
}
```

### Etapa 3: Preparação de Vídeo

**Fase 1 (atual)**: Manual via CapCut
- CoWork prepara metadados (título, descrição, hashtags por plataforma)
- Humano edita vídeo no CapCut com áudio + B-roll + legendas
- Upload manual para Storage

**Fase 2 (futuro)**: Automação parcial
- Edge Function gera legendas automáticas (Whisper)
- Edge Function seleciona B-roll de biblioteca
- Montagem via template CapCut ou Shotstack API

**Fase 3 (futuro)**: Full automation
- Runway/Kling/Pika API para gerar vídeo a partir do áudio
- Overlay automático de legendas
- Branding automático (intro, logo, cores do canal)

### Etapa 4: Publicação

**Trigger**: CRON às 06h, 12h, 18h UTC
**Worker**: Edge Function `publicar`
**Processo**:
1. Busca variantes com status PRONTO_PUBLICACAO
2. Para cada variante, verifica plataforma alvo
3. Gera título/descrição otimizado por plataforma via GPT
4. Se plataforma tem API → upload direto
5. Se plataforma não tem API → trigger Manus

**Geração de metadados por plataforma**:
```
Prompt para YouTube Shorts:
- Título: max 60 chars, com emoji, SEO keywords
- Descrição: max 500 chars, com 3-5 hashtags
- Tags: 10-15 keywords para SEO

Prompt para TikTok:
- Caption: max 150 chars, tom jovem e direto
- Hashtags: 3-5 (#fyp, #viral + nicho)
- Som: "original audio"

Prompt para Instagram Reels:
- Caption: hook + 2-3 linhas + 7-10 hashtags (mix popular + nicho)
- Cover text: max 3 palavras de impacto

Prompt para Kwai:
- Similar TikTok, adaptado para público BR
```

**Integração Manus para publicação browser**:
```typescript
interface ManusPublishPayload {
  task: 'publicar'
  plataforma: 'kwai' | 'facebook' | 'tiktok_fallback'
  video_url: string          // URL pública do vídeo no Storage
  titulo: string
  descricao: string
  hashtags: string[]
  conta: string              // identificador da conta
  callback_url: string       // URL para Manus reportar sucesso/erro
  metadata: {
    conteudo_id: string
    variante_id: string
    post_id: string
  }
}

// Manus executa:
// 1. Abre browser
// 2. Loga na plataforma (credenciais no vault do Manus)
// 3. Navega até upload
// 4. Preenche título, descrição, hashtags
// 5. Faz upload do vídeo
// 6. Confirma publicação
// 7. Copia link do post publicado
// 8. Chama callback_url com resultado
```

### Etapa 5: Coleta de Métricas

**Trigger**: CRON diário às 22:00 UTC
**Worker**: Edge Function `coletar-metricas`
**Processo**:
1. Busca posts PUBLICADOS (últimos 30 dias)
2. Para cada plataforma:
   - YouTube: chama Analytics API v2 → views, likes, comments, watch_time
   - TikTok: chama Research API → views, likes, shares
   - Instagram: chama Graph API Insights → reach, impressions, engagement
   - Kwai: Manus coleta via browser (screen scraping)
3. Normaliza dados e salva em `pulso_analytics.metricas_diarias`
4. Detecta anomalias (viral >10k views, low <100 views em 7 dias)
5. Se anomalia detectada → notificação

### Etapa 6: Relatório Semanal

**Trigger**: pg_cron toda segunda às 09:00 UTC
**Worker**: Edge Function `relatorio`
**Processo**:
1. Agrega métricas dos últimos 7 dias
2. Identifica top 5 performers e 5 underperformers
3. Chama Claude API com dados para análise
4. Gera relatório com:
   - Performance por canal
   - Performance por plataforma
   - Melhores horários de postagem
   - Padrões identificados
   - 5 recomendações acionáveis
5. Salva relatório e (futuro) envia via Discord/email

---

## Banco de Dados — Tabelas Necessárias

### Tabelas que JÁ EXISTEM e funcionam:
- `pulso_content.ideias` ✅
- `pulso_content.roteiros` ✅
- `pulso_content.workflow_queue` ✅
- `pulso_content.pipeline_producao` ✅
- `pulso_content.audios` ✅
- `pulso_core.configuracoes` ✅
- `pulso_core.plataformas` ✅
- `vw_pulso_canais` (view pública) ✅
- `logs_workflows` ✅

### Tabela NOVA: automation_queue (substitui n8n)

```sql
-- Fila central de automação AI-native
CREATE TABLE IF NOT EXISTS pulso_automation.automation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Tipo de tarefa
  tipo TEXT NOT NULL CHECK (tipo IN (
    'GERAR_IDEIAS',
    'GERAR_ROTEIRO',
    'GERAR_AUDIO',
    'PREPARAR_VIDEO',
    'PUBLICAR',
    'COLETAR_METRICAS',
    'RELATORIO_SEMANAL',
    'PROCESSAR_FILA',
    'CUSTOM'
  )),

  -- Payload da tarefa (JSON flexível)
  payload JSONB NOT NULL DEFAULT '{}',

  -- Controle de execução
  status TEXT NOT NULL DEFAULT 'PENDENTE' CHECK (status IN (
    'PENDENTE',
    'PROCESSANDO',
    'SUCESSO',
    'ERRO',
    'RETRY',
    'CANCELADO'
  )),

  -- Retry logic
  tentativas INTEGER NOT NULL DEFAULT 0,
  max_tentativas INTEGER NOT NULL DEFAULT 3,
  proximo_retry TIMESTAMPTZ,
  erro_ultimo TEXT,
  erro_historico JSONB DEFAULT '[]',

  -- Scheduling
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Resultado
  resultado JSONB,

  -- Rastreabilidade
  origem TEXT DEFAULT 'pg_cron', -- pg_cron, trigger, manual, api
  referencia_id UUID, -- ideia_id, roteiro_id, etc.
  referencia_tipo TEXT, -- 'ideia', 'roteiro', 'audio', 'video', 'post'

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_aq_status ON pulso_automation.automation_queue(status);
CREATE INDEX idx_aq_tipo ON pulso_automation.automation_queue(tipo);
CREATE INDEX idx_aq_scheduled ON pulso_automation.automation_queue(scheduled_at)
  WHERE status = 'PENDENTE';
CREATE INDEX idx_aq_retry ON pulso_automation.automation_queue(proximo_retry)
  WHERE status = 'RETRY';
CREATE INDEX idx_aq_referencia ON pulso_automation.automation_queue(referencia_id, referencia_tipo);
```

### Triggers automáticos no banco

```sql
-- Trigger: quando ideia é aprovada → enfileira geração de roteiro
CREATE OR REPLACE FUNCTION pulso_automation.on_ideia_aprovada()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'APROVADA' AND (OLD.status IS NULL OR OLD.status != 'APROVADA') THEN
    INSERT INTO pulso_automation.automation_queue (tipo, payload, referencia_id, referencia_tipo, origem)
    VALUES (
      'GERAR_ROTEIRO',
      jsonb_build_object('ideia_id', NEW.id, 'canal_id', NEW.canal_id),
      NEW.id,
      'ideia',
      'trigger'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ideia_aprovada
  AFTER UPDATE OF status ON pulso_content.ideias
  FOR EACH ROW
  EXECUTE FUNCTION pulso_automation.on_ideia_aprovada();

-- Trigger: quando roteiro é aprovado → enfileira geração de áudio
CREATE OR REPLACE FUNCTION pulso_automation.on_roteiro_aprovado()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'APROVADO' AND (OLD.status IS NULL OR OLD.status != 'APROVADO') THEN
    INSERT INTO pulso_automation.automation_queue (tipo, payload, referencia_id, referencia_tipo, origem)
    VALUES (
      'GERAR_AUDIO',
      jsonb_build_object('roteiro_id', NEW.id, 'canal_id', NEW.canal_id, 'ideia_id', NEW.ideia_id),
      NEW.id,
      'roteiro',
      'trigger'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_roteiro_aprovado
  AFTER UPDATE OF status ON pulso_content.roteiros
  FOR EACH ROW
  EXECUTE FUNCTION pulso_automation.on_roteiro_aprovado();
```

### pg_cron Jobs

```sql
-- Ativar extensão (rodar uma vez no Supabase Dashboard → SQL Editor)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- WF00: Gerar ideias diariamente às 03:00 UTC
SELECT cron.schedule(
  'gerar-ideias-diario',
  '0 3 * * *',
  $$
  INSERT INTO pulso_automation.automation_queue (tipo, payload, origem)
  VALUES ('GERAR_IDEIAS', '{"quantidade": 5}'::jsonb, 'pg_cron');
  $$
);

-- Backup WF01: Verificar ideias aprovadas sem roteiro a cada 5 min
SELECT cron.schedule(
  'check-roteiros-pendentes',
  '*/5 * * * *',
  $$
  INSERT INTO pulso_automation.automation_queue (tipo, payload, referencia_id, referencia_tipo, origem)
  SELECT 'GERAR_ROTEIRO',
         jsonb_build_object('ideia_id', i.id, 'canal_id', i.canal_id),
         i.id, 'ideia', 'pg_cron'
  FROM pulso_content.ideias i
  WHERE i.status = 'APROVADA'
    AND NOT EXISTS (
      SELECT 1 FROM pulso_content.roteiros r WHERE r.ideia_id = i.id
    )
    AND NOT EXISTS (
      SELECT 1 FROM pulso_automation.automation_queue q
      WHERE q.referencia_id = i.id
        AND q.tipo = 'GERAR_ROTEIRO'
        AND q.status IN ('PENDENTE', 'PROCESSANDO')
    )
  LIMIT 5;
  $$
);

-- Backup WF02: Verificar roteiros aprovados sem áudio a cada 10 min
SELECT cron.schedule(
  'check-audios-pendentes',
  '*/10 * * * *',
  $$
  INSERT INTO pulso_automation.automation_queue (tipo, payload, referencia_id, referencia_tipo, origem)
  SELECT 'GERAR_AUDIO',
         jsonb_build_object('roteiro_id', r.id, 'canal_id', r.canal_id),
         r.id, 'roteiro', 'pg_cron'
  FROM pulso_content.roteiros r
  WHERE r.status = 'APROVADO'
    AND NOT EXISTS (
      SELECT 1 FROM pulso_content.audios a WHERE a.roteiro_id = r.id
    )
    AND NOT EXISTS (
      SELECT 1 FROM pulso_automation.automation_queue q
      WHERE q.referencia_id = r.id
        AND q.tipo = 'GERAR_AUDIO'
        AND q.status IN ('PENDENTE', 'PROCESSANDO')
    )
  LIMIT 3;
  $$
);

-- WF04: Publicar conteúdos prontos 3x/dia
SELECT cron.schedule(
  'publicar-conteudos',
  '0 6,12,18 * * *',
  $$
  INSERT INTO pulso_automation.automation_queue (tipo, payload, origem)
  VALUES ('PUBLICAR', '{}'::jsonb, 'pg_cron');
  $$
);

-- Processar fila de retry a cada 30 min
SELECT cron.schedule(
  'processar-retry-queue',
  '*/30 * * * *',
  $$
  UPDATE pulso_automation.automation_queue
  SET status = 'PENDENTE', updated_at = NOW()
  WHERE status = 'RETRY'
    AND proximo_retry <= NOW()
    AND tentativas < max_tentativas;
  $$
);

-- Coletar métricas diariamente às 22:00 UTC
SELECT cron.schedule(
  'coletar-metricas',
  '0 22 * * *',
  $$
  INSERT INTO pulso_automation.automation_queue (tipo, payload, origem)
  VALUES ('COLETAR_METRICAS', '{}'::jsonb, 'pg_cron');
  $$
);

-- Relatório semanal toda segunda às 09:00 UTC
SELECT cron.schedule(
  'relatorio-semanal',
  '0 9 * * 1',
  $$
  INSERT INTO pulso_automation.automation_queue (tipo, payload, origem)
  VALUES ('RELATORIO_SEMANAL', '{}'::jsonb, 'pg_cron');
  $$
);
```

---

## Edge Functions — Implementação

### Estrutura de diretórios

```
supabase/functions/
├── _shared/
│   ├── supabase-client.ts    # Cliente Supabase para Edge Functions
│   ├── openai-client.ts      # Cliente OpenAI (GPT + TTS)
│   ├── claude-client.ts      # Cliente Claude API
│   ├── prompts.ts            # Todos os prompts centralizados
│   ├── validators.ts         # Validação de roteiros, ideias
│   └── types.ts              # Tipos compartilhados
├── orchestrator/
│   └── index.ts              # Processa itens da automation_queue
├── gerar-ideias/
│   └── index.ts
├── gerar-roteiro/
│   └── index.ts
├── gerar-audio/
│   └── index.ts
├── publicar/
│   └── index.ts
├── coletar-metricas/
│   └── index.ts
└── relatorio/
    └── index.ts
```

### Alternativa: API Routes Next.js (mais simples para MVP)

Se Edge Functions forem complexas demais para o momento, o mesmo pode ser feito via API Routes do Next.js que já existem:

```
app/api/automation/
├── orchestrator/route.ts     # Processa fila
├── gerar-ideias/route.ts     # Gera ideias via GPT
├── gerar-roteiro/route.ts    # Gera roteiro via GPT
├── gerar-audio/route.ts      # Gera áudio via TTS
├── publicar/route.ts         # Publica conteúdo
└── webhooks/
    ├── manus-callback/route.ts  # Callback do Manus
    └── process-queue/route.ts   # Endpoint para pg_net chamar
```

Vantagem: mesmo stack, mesmo deploy (Vercel), mais fácil de debugar.
Desvantagem: cold start da Vercel, timeout de 10s no free tier.

---

## Frontend — Mudanças Necessárias

### Substituir: `lib/api/n8n.ts` → `lib/api/automation.ts`

```typescript
// lib/api/automation.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const automationApi = {
  // Enfileirar tarefa de geração de ideias
  async gerarIdeias(canalId: string, quantidade = 5) {
    return supabase.schema('pulso_automation').from('automation_queue').insert({
      tipo: 'GERAR_IDEIAS',
      payload: { canal_id: canalId, quantidade },
      origem: 'manual'
    })
  },

  // Enfileirar geração de roteiro (ou usar trigger automático)
  async gerarRoteiro(ideiaId: string) {
    // Opção 1: Atualizar status da ideia → trigger automático enfileira
    return supabase.schema('pulso_content').from('ideias')
      .update({ status: 'APROVADA' })
      .eq('id', ideiaId)

    // Opção 2: Enfileirar diretamente
    // return supabase.schema('pulso_automation').from('automation_queue').insert(...)
  },

  // Consultar fila de automação
  async getQueue(limit = 50) {
    return supabase.schema('pulso_automation').from('automation_queue')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
  },

  // Consultar execuções por tipo
  async getExecutions(tipo?: string) {
    let query = supabase.schema('pulso_automation').from('automation_queue')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (tipo) query = query.eq('tipo', tipo)
    return query
  },

  // Cancelar tarefa pendente
  async cancelar(id: string) {
    return supabase.schema('pulso_automation').from('automation_queue')
      .update({ status: 'CANCELADO' })
      .eq('id', id)
      .in('status', ['PENDENTE', 'RETRY'])
  },

  // Retry manual
  async retry(id: string) {
    return supabase.schema('pulso_automation').from('automation_queue')
      .update({ status: 'PENDENTE', tentativas: 0 })
      .eq('id', id)
  }
}
```

### Substituir hooks: `lib/hooks/use-n8n.ts` → `lib/hooks/use-automation.ts`

Os hooks mantêm a mesma interface para o frontend, mas chamam `automationApi` em vez de `n8nApi`.

---

## Variáveis de Ambiente — Novas

```env
# AI APIs (necessárias para Edge Functions)
OPENAI_API_KEY=sk-...                    # GPT-4o + TTS
ANTHROPIC_API_KEY=sk-ant-...             # Claude API (alternativa)

# TTS Config
TTS_PROVIDER=openai                       # openai | elevenlabs
ELEVENLABS_API_KEY=...                    # Se usar ElevenLabs

# Manus (publicação browser)
MANUS_WEBHOOK_URL=https://...             # Endpoint do Manus
MANUS_API_KEY=...                         # Auth do Manus

# Platform APIs (para publicação direta)
YOUTUBE_API_KEY=...
YOUTUBE_CLIENT_ID=...
YOUTUBE_CLIENT_SECRET=...
TIKTOK_API_KEY=...
INSTAGRAM_ACCESS_TOKEN=...

# Supabase (já existem)
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

---

## Ordem de Execução — Fases

### Fase 1: Foundation (Dia 1-2)

**Objetivo**: Criar infraestrutura de automação no banco

1. [ ] Criar schema `pulso_automation` se não existir
2. [ ] Criar tabela `automation_queue`
3. [ ] Criar triggers `on_ideia_aprovada` e `on_roteiro_aprovado`
4. [ ] Ativar pg_cron e criar os 7 jobs
5. [ ] Criar `lib/api/automation.ts`
6. [ ] Criar `lib/hooks/use-automation.ts`
7. [ ] Testar: aprovar uma ideia → verificar se enfileira automaticamente

### Fase 2: Geração de Conteúdo (Dia 3-5)

**Objetivo**: Substituir WF00, WF01, WF02

8. [ ] Criar API Route `/api/automation/gerar-ideias`
9. [ ] Criar API Route `/api/automation/gerar-roteiro`
10. [ ] Criar API Route `/api/automation/gerar-audio`
11. [ ] Criar API Route `/api/automation/orchestrator` (processa fila)
12. [ ] Testar pipeline completo: ideia → roteiro → áudio
13. [ ] Validar qualidade dos roteiros gerados
14. [ ] Validar qualidade dos áudios gerados

### Fase 3: Publicação (Dia 6-8)

**Objetivo**: Implementar WF04

15. [ ] Criar geração de metadados por plataforma (GPT)
16. [ ] Criar API Route `/api/automation/publicar`
17. [ ] Configurar integração Manus (webhook + callback)
18. [ ] Testar publicação em 1 plataforma (YouTube Shorts)
19. [ ] Expandir para TikTok, Instagram, Kwai

### Fase 4: Métricas e Relatórios (Dia 9-10)

**Objetivo**: Implementar WF04 métricas + WF05

20. [ ] Criar API Route `/api/automation/coletar-metricas`
21. [ ] Criar API Route `/api/automation/relatorio`
22. [ ] Configurar APIs de analytics (YouTube, TikTok, Instagram)
23. [ ] Testar coleta de métricas
24. [ ] Testar geração de relatório semanal

### Fase 5: Frontend + Cleanup (Dia 11-14)

**Objetivo**: Remover n8n e conectar tudo

25. [ ] Atualizar dashboard com dados da automation_queue
26. [ ] Atualizar página /workflows para mostrar fila nativa
27. [ ] Remover dependências n8n do código
28. [ ] Atualizar .env.example
29. [ ] Testar ponta a ponta: 1 canal, 5 ideias → publicadas
30. [ ] Documentar estado final

---

## Custos Estimados (sem n8n)

| Item | Custo Unitário | 100 vídeos/mês | 900 vídeos/mês |
|---|---|---|---|
| GPT-4o (ideias + roteiros) | $0.02/roteiro | $2.00 | $18.00 |
| GPT-4o (metadados publicação) | $0.005/post | $2.00 | $18.00 |
| OpenAI TTS-1-HD | $0.024/min (~30s) | $1.20 | $10.80 |
| Claude API (análise/relatórios) | $0.01/call | $1.00 | $4.00 |
| Supabase Pro | $25/mês fixo | $25.00 | $25.00 |
| **n8n Cloud** | **ELIMINADO** | **-$30.00** | **-$30.00** |
| **TOTAL** | | **~$31/mês** | **~$76/mês** |

Economia vs. stack com n8n: **~$30/mês** + menos complexidade + zero ponto de falha externo.

---

## Checklist de Prontidão para CoWork Iniciar

Antes do CoWork começar a executar, confirmar:

- [ ] Este documento lido e entendido
- [ ] `.env.local` com OPENAI_API_KEY configurada
- [ ] Supabase Pro ativo com pg_cron disponível
- [ ] Storage bucket `pulso-assets` criado
- [ ] Acesso ao Dashboard Supabase para executar SQL
- [ ] Credenciais Manus configuradas (se publicação automática)
- [ ] Pelo menos 1 canal ativo com ideias para testar

---

## Notas Importantes

1. **Manter n8n como fallback** durante a Fase 1-2. Só desligar após pipeline nativo validado.
2. **Não automatizar publicação real** até ter ao menos 10 vídeos testados manualmente.
3. **Começar com 1 canal** (PULSO Curiosidades) e expandir após validação.
4. **Humano no loop** para aprovação de roteiros na Fase 1. Auto-approve só após quality score confiável.
5. **Logs são sagrados**: toda execução deve estar rastreável na automation_queue.
