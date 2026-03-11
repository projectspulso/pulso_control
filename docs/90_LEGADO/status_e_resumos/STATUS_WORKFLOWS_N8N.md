# 📋 Status das Funcionalidades e Workflows n8n

**Data:** 22 de Novembro de 2025  
**Projeto:** PULSO Control Centro de Comando

---

## ✅ FUNCIONALIDADES IMPLEMENTADAS NO APP

### 1. Gestão de Ideias

- ✅ Listar todas ideias
- ✅ Criar nova ideia
- ✅ Editar ideia existente
- ✅ Deletar ideia
- ✅ Filtrar por status
- ✅ Filtrar por canal
- ✅ **Botão "Gerar Roteiro (IA)"** → Chama n8n

### 2. Gestão de Roteiros

- ✅ Listar todos roteiros
- ✅ Visualizar roteiro completo
- ✅ Editar roteiro (markdown)
- ✅ Deletar roteiro
- ✅ Filtrar por status
- ✅ **Botão "Gerar Áudio"** → Chama n8n (implementado, workflow pendente)

### 3. Pipeline de Produção (Kanban)

- ✅ Visualização em 6 colunas
- ✅ Drag & Drop para mudar status
- ✅ Stats de conteúdos por status
- ✅ Link para calendário
- ⏳ Botões automáticos de workflow (pendente)

### 4. Calendário Editorial

- ✅ Visualização month/week/day/agenda
- ✅ Eventos com cores por status
- ✅ Localização PT-BR
- ⏳ Drag to reschedule (biblioteca não suporta nativamente)

### 5. Workflows & Monitoramento

- ✅ Lista workflows do n8n (via API)
- ✅ Lista execuções em tempo real
- ✅ Stats de sucesso/erro/executando
- ✅ Auto-refresh a cada 10s

### 6. Integrações

- ✅ Dashboard de status
- ✅ Verificação Supabase
- ✅ Verificação n8n
- ✅ Lista de próximas integrações

### 7. Canais & Séries

- ✅ Visualização de canais
- ✅ Visualização de séries por canal
- ✅ Stats de conteúdo

---

## 🔌 INTEGRAÇÃO n8n - STATUS

### Hooks React Query Implementados:

```typescript
// lib/hooks/use-n8n.ts
✅ useN8nWorkflows()           // Lista workflows do n8n
✅ useN8nExecutions(id)        // Lista execuções de workflow
✅ useGerarRoteiro()           // Gera roteiro via webhook
✅ useGerarAudio()             // Gera áudio via webhook
✅ useGerarVideo()             // Gera vídeo via webhook
✅ usePublicarConteudo()       // Publica via webhook
```

### API n8n Implementada:

```typescript
// lib/api/n8n.ts
✅ n8nApi.getWorkflows()                    // GET /api/v1/workflows
✅ n8nApi.getExecutions(id)                 // GET /api/v1/executions
✅ n8nApi.executeWorkflow(path, payload)    // POST /webhook/{path}
✅ n8nApi.workflows.gerarRoteiro(id)        // POST /webhook/gerar-roteiro
✅ n8nApi.workflows.gerarAudio(id)          // POST /webhook/gerar-audio
✅ n8nApi.workflows.gerarVideo(id)          // POST /webhook/gerar-video
✅ n8nApi.workflows.publicarConteudo(id)    // POST /webhook/publicar-conteudo
```

---

## 🎯 WORKFLOWS n8n A CRIAR

### 1. ✅ Gerar Roteiro (ATIVO)

**Status:** Implementado e funcionando  
**Webhook:** `gerar-roteiro`  
**Trigger:** Botão na página `/ideias/[id]`

**Payload de entrada:**

```json
{
  "ideia_id": "uuid",
  "titulo": "string",
  "descricao": "string",
  "canal_id": "uuid",
  "linguagem": "pt-BR"
}
```

**Fluxo esperado:**

1. Recebe ideia via webhook
2. Chama API de IA (OpenAI/Claude/Gemini)
3. Gera roteiro em markdown
4. Salva em `pulso_content.roteiros`
5. Cria execução em `workflow_execucoes`

**Saída:**

```json
{
  "roteiro_id": "uuid",
  "status": "SUCESSO"
}
```

---

### 2. ⏳ Gerar Áudio (PENDENTE)

**Status:** Hook implementado, workflow não criado  
**Webhook:** `gerar-audio`  
**Trigger:** Botão na página `/roteiros/[id]` ou Pipeline status "ROTEIRO_PRONTO"

**Payload de entrada:**

```json
{
  "roteiro_id": "uuid",
  "voz_id": "string (optional)"
}
```

**Fluxo esperado:**

1. Recebe roteiro_id via webhook
2. Busca roteiro completo do Supabase
3. Chama TTS API (ElevenLabs/Google Cloud TTS/Azure)
4. Upload do áudio gerado
5. Salva URL em `assets.audios`
6. Atualiza `pipeline_producao.audio_id`
7. Muda status para "AUDIO_GERADO"

**Saída:**

```json
{
  "audio_id": "uuid",
  "url": "https://...",
  "duracao_segundos": 120,
  "status": "SUCESSO"
}
```

**Serviços TTS sugeridos:**

- ElevenLabs (melhor qualidade)
- Google Cloud Text-to-Speech
- Azure Speech Service
- OpenAI TTS

---

### 3. ⏳ Gerar Vídeo (PENDENTE)

**Status:** Hook implementado, workflow não criado  
**Webhook:** `gerar-video`  
**Trigger:** Pipeline status "AUDIO_GERADO"

**Payload de entrada:**

```json
{
  "audio_id": "uuid",
  "template": "string (optional)"
}
```

**Fluxo esperado:**

1. Recebe audio_id via webhook
2. Busca áudio do Supabase
3. Gera vídeo com template (imagens + áudio)
4. Usa serviço de video editing (Remotion/FFmpeg)
5. Upload do vídeo gerado
6. Salva em `assets.videos`
7. Atualiza `pipeline_producao.video_id`
8. Muda status para "EM_EDICAO"

**Saída:**

```json
{
  "video_id": "uuid",
  "url": "https://...",
  "thumbnail_url": "https://...",
  "duracao_segundos": 120,
  "resolucao": "1080x1920",
  "status": "SUCESSO"
}
```

**Serviços sugeridos:**

- Remotion (React-based video rendering)
- FFmpeg (linha de comando)
- Pictory.ai (automático)
- Synthesia (AI avatars)

---

### 4. ⏳ Publicar Conteúdo (PENDENTE - Sprint 4)

**Status:** Hook implementado, workflow não criado  
**Webhook:** `publicar-conteudo`  
**Trigger:** Wizard de publicação ou status "PRONTO_PUBLICACAO"

**Payload de entrada:**

```json
{
  "conteudo_id": "uuid",
  "plataforma": "youtube|tiktok|instagram|kwai",
  "titulo": "string",
  "descricao": "string",
  "tags": ["array"],
  "thumbnail_url": "string (optional)",
  "agendamento": "timestamp (optional)"
}
```

**Fluxo esperado:**

1. Recebe dados de publicação
2. Busca vídeo do Supabase
3. Faz upload na plataforma via API
4. Agenda publicação se necessário
5. Salva ID externo
6. Muda status para "PUBLICADO"

**APIs necessárias:**

- YouTube Data API v3
- TikTok Content Posting API
- Instagram Graph API
- Kwai API

**Saída:**

```json
{
  "plataforma": "youtube",
  "video_id_externo": "dQw4w9WgXcQ",
  "url_publica": "https://youtube.com/watch?v=...",
  "status": "PUBLICADO"
}
```

---

### 5. ⏳ Sincronizar Métricas (PENDENTE - Sprint 5)

**Status:** Não implementado  
**Webhook:** `sincronizar-metricas`  
**Trigger:** Cron job (diário)

**Fluxo esperado:**

1. Lista todos conteúdos publicados
2. Para cada plataforma, busca métricas via API
3. Salva em tabela `metricas`
4. Atualiza dashboards

**Métricas a coletar:**

- Views
- Likes
- Comments
- Shares
- Watch time
- CTR
- Engajamento

---

## 🛠️ COMO CRIAR OS WORKFLOWS NO n8n

### Acesso ao n8n:

- URL: https://pulsoprojects.app.n8n.cloud
- Credenciais: (suas credenciais)

### Template Básico de Workflow:

```
1. WEBHOOK NODE
   - Method: POST
   - Path: gerar-audio (exemplo)
   - Response Mode: When Last Node Finishes

2. FUNCTION NODE (Processar Payload)
   - Extrair dados do webhook
   - Validar campos obrigatórios

3. SUPABASE NODE (Buscar Dados)
   - Query: SELECT * FROM roteiros WHERE id = $payload.roteiro_id

4. HTTP REQUEST (Chamar API Externa)
   - ElevenLabs/TTS Service
   - Body: texto do roteiro

5. SUPABASE NODE (Inserir Áudio)
   - INSERT INTO assets.audios (...)

6. SUPABASE NODE (Atualizar Pipeline)
   - UPDATE pipeline_producao SET audio_id = ...

7. SUPABASE NODE (Log Execução)
   - INSERT INTO workflow_execucoes (status='SUCESSO')

8. RESPOND TO WEBHOOK
   - Return: { success: true, audio_id: ... }
```

---

## 📊 PRIORIDADES DE IMPLEMENTAÇÃO

### Sprint 3 (Atual) - ✅ COMPLETO

- ✅ Gerar Roteiro workflow

### Sprint 4 (Próximo)

1. **Gerar Áudio** (Alta prioridade)

   - Escolher serviço TTS
   - Criar workflow no n8n
   - Testar integração

2. **Gerar Vídeo** (Alta prioridade)

   - Escolher serviço de edição
   - Templates de vídeo
   - Criar workflow no n8n

3. **Publicar Conteúdo** (Média prioridade)
   - Configurar APIs das plataformas
   - Wizard de publicação no frontend
   - Workflow de upload

### Sprint 5

- Analytics e métricas
- Sincronização automática

---

## 🔐 CREDENCIAIS NECESSÁRIAS

### Para Gerar Áudio:

- [ ] ElevenLabs API Key (ou alternativa)
- [ ] Storage para áudios (Supabase Storage ou S3)

### Para Gerar Vídeo:

- [ ] Remotion License (se usar)
- [ ] FFmpeg instalado
- [ ] Storage para vídeos

### Para Publicar (Sprint 4):

- [ ] YouTube API Key + OAuth
- [ ] TikTok Client Key + Secret
- [ ] Instagram App ID + Token
- [ ] Kwai API credentials

---

## ✅ CHECKLIST DE VERIFICAÇÃO

**Frontend:**

- ✅ Hooks n8n implementados
- ✅ Botões de ação nas páginas
- ✅ Monitoramento de execuções
- ✅ Tratamento de erros

**Backend/n8n:**

- ✅ Workflow "Gerar Roteiro" ativo
- ⏳ Workflow "Gerar Áudio" (a criar)
- ⏳ Workflow "Gerar Vídeo" (a criar)
- ⏳ Workflow "Publicar" (Sprint 4)

**Database:**

- ✅ Tabelas criadas
- ✅ Views públicas
- ✅ RLS configurado
- ✅ Triggers funcionando

---

**Última atualização:** 22/11/2025  
**Próximo passo:** Criar workflows "Gerar Áudio" e "Gerar Vídeo" no n8n
