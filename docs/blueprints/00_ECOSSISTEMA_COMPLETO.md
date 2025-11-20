# 🌐 PULSO - Ecossistema Completo

## 📋 Visão Geral

O PULSO é um **ecossistema automatizado de criação e distribuição de conteúdo dark** para múltiplas plataformas de vídeo curto. Este documento consolida todos os componentes do sistema.

## 🎯 Objetivo Principal

Criar e gerenciar **10 canais multitemáticos** publicando conteúdo diário em **4+ plataformas** (YouTube Shorts, TikTok, Instagram Reels, Kwai) com **máxima automação** e **mínima intervenção humana**.

---

## 🏗️ Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    PULSO ECOSYSTEM                          │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   SUPABASE   │◄────►│     N8N      │◄────►│  PLATAFORMAS │
│   (Database) │      │ (Automação)  │      │   (Publicar) │
└──────────────┘      └──────────────┘      └──────────────┘
       │                     │                      │
       │                     │                      │
       ▼                     ▼                      ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│    SCHEMAS   │      │  WORKFLOWS   │      │   MÉTRICAS   │
│  6 schemas   │      │  5 workflows │      │    APIs      │
│  30+ tabelas │      │  Automação   │      │  Analytics   │
└──────────────┘      └──────────────┘      └──────────────┘
```

---

## 🔧 Componentes Principais

### 1. **Banco de Dados (Supabase)**

| Schema               | Propósito         | Tabelas Principais                     |
| -------------------- | ----------------- | -------------------------------------- |
| `pulso_core`         | Estrutura base    | canais, plataformas, series, tags      |
| `pulso_content`      | Conteúdo criativo | ideias, roteiros, conteudos, variantes |
| `pulso_assets`       | Arquivos de mídia | assets, conteudo_variantes_assets      |
| `pulso_distribution` | Publicações       | posts, posts_logs                      |
| `pulso_automation`   | Automações        | workflows, workflow_execucoes          |
| `pulso_analytics`    | Métricas          | eventos, metricas_diarias              |

**11 Views públicas** para frontend/dashboards

### 2. **Automação (n8n Cloud)**

| Workflow                    | Função               | Trigger | Frequência     |
| --------------------------- | -------------------- | ------- | -------------- |
| **WF1: Ideia → Roteiro**    | Gera roteiros com IA | Cron    | 3x/dia         |
| **WF2: Roteiro → Produção** | Cria áudio + vídeo   | Webhook | Sob demanda    |
| **WF3: Publicação**         | Posta em plataformas | Cron    | Horários fixos |
| **WF4: Coleta Métricas**    | Busca analytics      | Cron    | 2x/dia         |
| **WF5: Análise & Alertas**  | Relatórios IA        | Cron    | Semanal        |

### 3. **Plataformas de Distribuição**

- **YouTube Shorts** - API v3 (Analytics completo)
- **TikTok** - Research API (limitado)
- **Instagram Reels** - Graph API (Business)
- **Kwai** - Manual/API futura
- **Facebook Reels** - Graph API
- **Pinterest** - Futuro

### 4. **Integrações de IA**

- **OpenAI GPT-4** / **Claude 3.5 Sonnet** - Geração de roteiros
- **ElevenLabs** / **Google TTS** - Texto para voz
- **Runway** / **Pika** / **Kling** - Geração de vídeo (futuro)
- **Whisper** - Legendas automáticas (futuro)

---

## 📊 Fluxo de Dados Completo

```
[IDEIA] (Manual/IA/Trend)
   ↓ WF1: Gera roteiro com IA
[ROTEIRO] (Markdown, aprovado)
   ↓ WF2: TTS + geração de vídeo
[CONTEÚDO + VARIANTES] (3-4 versões por plataforma)
   ↓ Vincula assets (áudio, vídeo, thumb)
[ASSETS] (Armazenados no Supabase Storage)
   ↓ WF3: Agenda e publica
[POSTS] (Publicados em cada plataforma)
   ↓ WF4: Coleta métricas 2x/dia
[MÉTRICAS] (Views, likes, watch time...)
   ↓ WF5: Análise semanal com IA
[INSIGHTS & ALERTAS] (Relatórios acionáveis)
   ↓ Feedback loop
[NOVAS IDEIAS] (baseado em performance)
```

---

## 🎬 Canais Planejados

### Fase 1 (1 canal - 7 dias)

- **PULSO Curiosidades** - Validação do sistema

### Fase 2 (3 canais - 30 dias)

1. **PULSO Curiosidades**
2. **PULSO Mistérios / História**
3. **PULSO Motivação**

### Fase 3 (10 canais - 60 dias)

1. PULSO Curiosidades
2. PULSO Psicologia
3. PULSO Mistérios
4. PULSO História
5. PULSO Motivacional
6. PULSO Infantil
7. PULSO Romance Narrado
8. PULSO Educação
9. PULSO Games Nostalgia
10. PULSO Contos Mini-histórias

**Meta Final**: 30 vídeos/dia × 4 plataformas = **120 publicações diárias**

---

## 🔄 Status Atual do Projeto

### ✅ Completado

- [x] Estrutura de pastas criada
- [x] Banco de dados modelado (6 schemas)
- [x] 11 Views públicas criadas
- [x] Documentação dos 5 workflows
- [x] Templates de prompts IA
- [x] Scripts de seed/setup
- [x] Repositório GitHub inicializado
- [x] Push inicial para GitHub

### 🟡 Em Progresso

- [ ] Implementar Workflow 1 no n8n (Ideia → Roteiro)
- [ ] Configurar credenciais das APIs
- [ ] Criar primeiro canal de teste

### ⏳ Planejado

- [ ] Implementar Workflows 2-5
- [ ] Dashboard de monitoramento
- [ ] Automação de geração de vídeo
- [ ] Sistema de A/B testing
- [ ] Analytics avançado com ML

---

## 🔐 Credenciais Necessárias

### Banco de Dados

- ✅ Supabase URL: `https://nlcisbfdiokmipyihtuz.supabase.co`
- ✅ Anon Key (configurado)
- ✅ Service Role Key (configurado)

### Automação

- ✅ n8n Cloud: `https://pulsoprojects.app.n8n.cloud`
- ⏳ n8n API Key (a configurar)

### IA/TTS

- ⏳ OpenAI API Key
- ⏳ Anthropic Claude API Key (opcional)
- ⏳ ElevenLabs API Key + Voice ID
- ⏳ Google TTS API Key (alternativa)

### Plataformas

- ⏳ YouTube Data API v3 (OAuth)
- ⏳ TikTok API (limitado)
- ⏳ Instagram Graph API (Business)

### Notificações

- ⏳ Discord Webhook URL
- ⏳ Email SMTP (opcional)

---

## 📁 Estrutura de Arquivos

```
pulso_projects/
├── apps/
│   ├── dashboard/          # Frontend (futuro)
│   └── api/                # Backend auxiliar
├── automation/
│   └── n8n/
│       ├── docs/           # ✅ Documentação dos workflows
│       ├── templates/      # ✅ Prompts IA
│       └── workflows/      # ⏳ JSONs exportados
├── database/
│   └── sql/
│       ├── schema/         # ✅ DDL completo
│       └── seeds/          # ✅ Dados iniciais
├── content/
│   ├── ideias/            # Banco de ideias
│   ├── roteiros/          # Roteiros aprovados
│   └── assets/            # Mídia gerada
├── analytics/
│   └── exports/           # Relatórios exportados
└── docs/
    ├── blueprints/        # 📍 Você está aqui
    ├── processos/         # Processos operacionais
    └── canais/            # Docs por canal
```

---

## 🚀 Próximos Passos (Ordem de Prioridade)

### 1. **Configurar APIs (2-3 horas)**

- OpenAI/Claude para geração de roteiros
- ElevenLabs ou Google TTS para áudio
- YouTube Data API para publicação

### 2. **Implementar Workflow 1 (4-6 horas)**

- Importar estrutura no n8n
- Testar com 1 ideia
- Validar roteiro gerado

### 3. **Popular Banco com Ideias (2 horas)**

- Criar 20-30 ideias iniciais
- Distribuir entre séries
- Definir prioridades

### 4. **Workflow 4 - Métricas (3 horas)**

- Configurar coleta de dados
- Testar com posts de exemplo

### 5. **Workflows 2 e 3 (8-10 horas)**

- Produção de conteúdo
- Publicação automatizada

### 6. **Dashboard de Monitoramento (1 semana)**

- Interface para visualizar métricas
- Gestão de ideias/roteiros
- Calendário editorial

---

## 📊 Métricas de Sucesso

### Curto Prazo (30 dias)

- [ ] 7 vídeos publicados (1 canal)
- [ ] 3 workflows funcionando
- [ ] Sistema de métricas ativo

### Médio Prazo (90 dias)

- [ ] 3 canais ativos
- [ ] 180 vídeos publicados
- [ ] 100k views acumuladas

### Longo Prazo (180 dias)

- [ ] 10 canais ativos
- [ ] 900 vídeos/mês
- [ ] 1M+ views/mês
- [ ] Monetização em 2+ plataformas

---

## 🔗 Links Úteis

- **Repositório**: https://github.com/projectspulso/pulso_control
- **Supabase**: https://supabase.com/dashboard/project/nlcisbfdiokmipyihtuz
- **n8n**: https://pulsoprojects.app.n8n.cloud
- **Docs Blueprint**: `docs/blueprints/`

---

## 📚 Documentos Relacionados

- [Blueprint: Canais e Séries](./01_CANAIS_SERIES.md)
- [Blueprint: Workflows n8n](./02_WORKFLOWS_N8N.md)
- [Blueprint: Banco de Dados](./03_BANCO_DE_DADOS.md)
- [Blueprint: Fluxo de Conteúdo](./04_FLUXO_CONTEUDO.md)
- [Guia: Implementação Fase 1](./05_GUIA_FASE_1.md)

---

**Última atualização**: 2025-11-20
**Status**: 🟢 Estrutura completa, aguardando implementação dos workflows
