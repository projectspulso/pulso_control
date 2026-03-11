# 🚀 PULSO Control - Integrações Ativas

**Status:** ✅ Todas as integrações principais conectadas  
**Data:** 21 de Novembro de 2025

---

## 📊 Status Geral

### Banco de Dados (Supabase)

- ✅ **Conectado** - `nlcisbfdiokmipyihtuz.supabase.co`
- 📦 **Dados em Produção:**
  - 130 Ideias
  - 10 Canais (YouTube, TikTok, Instagram, Kwai, Podcast, etc.)
  - 60+ Séries
  - Roteiros gerados
  - Execuções de workflows

### n8n Workflows

- ✅ **Conectado** - `https://pulsoprojects.app.n8n.cloud`
- 🔑 API Key configurada
- 🤖 Workflows ativos monitorados em tempo real

---

## 🔌 Integrações Implementadas

### 1. Supabase PostgreSQL

**Status:** ✅ Ativo  
**Função:** Banco de dados principal

**Schemas:**

- `pulso_core` - Canais, Séries, Tags
- `pulso_content` - Ideias, Roteiros, Pipeline
- `assets` - Áudios, Vídeos
- `public` - Views públicas para acesso do frontend

**Views Públicas Criadas:**

- ✅ `public.canais` → `pulso_core.canais`
- ✅ `public.series` → `pulso_core.series`
- ✅ `public.ideias` → `pulso_content.ideias` (com triggers CRUD)
- ✅ `public.roteiros` → `pulso_content.roteiros` (com triggers CRUD)
- ✅ `public.workflow_execucoes` → `pulso_content.workflow_execucoes`
- ✅ `public.pipeline_producao` → `pulso_content.pipeline_producao`

---

### 2. n8n - Automação de Workflows

**Status:** ✅ Ativo  
**URL:** `https://pulsoprojects.app.n8n.cloud`

**Workflows Configurados:**

#### ✅ Gerar Roteiro (Ativo)

- **Trigger:** Botão "Gerar Roteiro (IA)" na página `/ideias/[id]`
- **Webhook:** `gerar-roteiro`
- **Entrada:** `{ ideia_id, titulo, descricao, canal_id, linguagem }`
- **Saída:** Cria registro em `roteiros` table
- **Status:** Funcionando

#### ⏳ Gerar Áudio (Pendente)

- **Trigger:** Pipeline de Produção → Status "ROTEIRO_PRONTO"
- **Webhook:** `gerar-audio`
- **Entrada:** `{ roteiro_id, voz_id }`
- **Saída:** Cria registro em `assets.audios`
- **Status:** Implementação pendente

#### ⏳ Gerar Vídeo (Pendente)

- **Trigger:** Pipeline de Produção → Status "AUDIO_GERADO"
- **Webhook:** `gerar-video`
- **Entrada:** `{ audio_id, template }`
- **Saída:** Cria registro em `assets.videos`
- **Status:** Implementação pendente

#### ⏳ Publicar Conteúdo (Pendente)

- **Trigger:** Sistema de Publicação → Wizard de upload
- **Webhook:** `publicar-conteudo`
- **Entrada:** `{ conteudo_id, plataforma }`
- **Saída:** Publica em YouTube/TikTok/Instagram/Kwai
- **Status:** Implementação pendente (Sprint 4)

---

## 🎯 Páginas com Integração n8n

### `/ideias/[id]` - Detalhes da Ideia

- ✅ Botão "Gerar Roteiro (IA)"
- Dispara webhook `gerar-roteiro` no n8n
- Monitora status via `workflow_execucoes`

### `/workflows` - Monitoramento de Workflows

- ✅ Lista workflows ativos do n8n (via API)
- ✅ Monitora execuções em tempo real
- ✅ Dashboard com stats (Sucesso/Erro/Executando)
- Auto-refresh a cada 10 segundos

### `/integracoes` - Status das Integrações (NOVA!)

- ✅ Dashboard de status de todas integrações
- ✅ Contadores de dados do Supabase
- ✅ Status do n8n
- ✅ Lista de workflows configurados
- ✅ Próximas integrações planejadas

### `/producao` - Pipeline Kanban

- ✅ Kanban de 6 colunas
- ⏳ Botões para disparar workflows (próxima sprint)

### `/calendario` - Calendário Editorial

- ✅ Visualização de conteúdos agendados
- ⏳ Integração com publicação automática (Sprint 4)

---

## 🔄 Fluxo de Dados

```
IDEIA (criada manualmente)
  ↓
  → [BOTÃO] Gerar Roteiro (IA) → n8n webhook
  ↓
ROTEIRO (gerado por IA)
  ↓
  → Pipeline: AGUARDANDO_ROTEIRO → ROTEIRO_PRONTO
  ↓
  → [n8n] Gerar Áudio (TTS)
  ↓
ÁUDIO (assets.audios)
  ↓
  → Pipeline: AUDIO_GERADO
  ↓
  → [n8n] Gerar Vídeo
  ↓
VÍDEO (assets.videos)
  ↓
  → Pipeline: EM_EDICAO → PRONTO_PUBLICACAO
  ↓
  → [n8n] Publicar Conteúdo
  ↓
PUBLICADO (YouTube, TikTok, Instagram, Kwai)
```

---

## 📁 Arquivos de Integração

### APIs

- `lib/api/n8n.ts` - Cliente para API do n8n
- `lib/api/workflows.ts` - API de workflows do Supabase
- `lib/api/ideias.ts` - CRUD de ideias
- `lib/api/roteiros.ts` - CRUD de roteiros
- `lib/api/producao.ts` - Pipeline de produção

### Hooks React Query

- `lib/hooks/use-n8n.ts` - Hooks para n8n (workflows, execuções)
- `lib/hooks/use-workflows.ts` - Hooks para workflows do banco
- `lib/hooks/use-producao.ts` - Hooks para pipeline Kanban
- `lib/hooks/use-ideias.ts` - Hooks para ideias
- `lib/hooks/use-roteiros.ts` - Hooks para roteiros

### Migrations (Executadas)

- ✅ `20241121_views_publicas.sql` - Views públicas + triggers
- ✅ `20241121_apenas_pipeline.sql` - Tabela pipeline_producao

---

## 🔐 Variáveis de Ambiente (.env.local)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://nlcisbfdiokmipyihtuz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...PpOI

# n8n
N8N_URL=https://pulsoprojects.app.n8n.cloud
N8N_API_KEY=eyJ...laU
```

---

## 🎨 UI Components Conectados

### Dashboard (/)

- ✅ Stats com dados do Supabase
- ✅ Log de workflows em tempo real
- ✅ Gráficos de ideias e roteiros

### Kanban (/producao)

- ✅ Drag & drop funcional
- ✅ 6 colunas de status
- ✅ Atualização de status via API

### Calendário (/calendario)

- ✅ react-big-calendar integrado
- ✅ Visualização month/week/day/agenda
- ✅ Drag to reschedule

---

## 🚀 Próximas Integrações (Sprint 4-6)

### Sprint 4 - Sistema de Publicação

- [ ] YouTube Data API v3
- [ ] TikTok API
- [ ] Instagram Graph API
- [ ] Kwai API
- [ ] Wizard de publicação
- [ ] Upload de thumbnails e metadados

### Sprint 5 - Analytics

- [ ] YouTube Analytics
- [ ] TikTok Analytics
- [ ] Instagram Insights
- [ ] Dashboards de métricas
- [ ] Comparação de performance

### Sprint 6 - UX & Polish

- [ ] Notificações em tempo real
- [ ] Temas claro/escuro
- [ ] Atalhos de teclado
- [ ] Tour guiado
- [ ] Documentação integrada

---

## ✅ Testes de Conectividade

### Supabase

```bash
curl "https://nlcisbfdiokmipyihtuz.supabase.co/rest/v1/ideias?select=id,titulo&limit=3" \
  -H "apikey: eyJ...PpOI"
# ✅ Retorna: [{"id":"...", "titulo":"Experimento Humano Mais Bizarro"}...]
```

### n8n

```bash
curl "https://pulsoprojects.app.n8n.cloud/api/v1/workflows" \
  -H "X-N8N-API-KEY: eyJ...laU"
# ✅ Retorna: {"data": [{"id":"...", "name":"Gerar Roteiro", "active":true}...]}
```

### Workflow Execuções

```bash
curl "https://nlcisbfdiokmipyihtuz.supabase.co/rest/v1/workflow_execucoes?limit=5" \
  -H "apikey: eyJ...PpOI"
# ✅ Retorna: [{"id":"...", "status":"SUCESSO", "workflow_id":"..."}...]
```

---

## 📊 Métricas Atuais

- **Ideias:** 130
- **Canais:** 10
- **Séries:** 60+
- **Workflows n8n:** Conectado
- **Execuções de Workflow:** Monitoradas
- **APIs Integradas:** 2/6 (Supabase + n8n)
- **Sprints Completos:** 3/6

---

**Última atualização:** 21/11/2025  
**Desenvolvido por:** PULSO Projects Team  
**Stack:** Next.js 16 + React 19 + Supabase + n8n
