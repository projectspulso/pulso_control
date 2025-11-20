# ⚙️ Blueprint: Workflows n8n

## 🎯 Visão Geral

Os 5 workflows do PULSO automatizam todo o ciclo de vida do conteúdo, desde a geração de ideias até análise de performance.

---

## 🔄 Mapa de Workflows

```
┌─────────────────────────────────────────────────────────────┐
│                    CICLO DE AUTOMAÇÃO                        │
└─────────────────────────────────────────────────────────────┘

[WF1: Ideia → Roteiro]
        ↓
[WF2: Roteiro → Produção]
        ↓
[WF3: Publicação]
        ↓
[WF4: Coleta Métricas]
        ↓
[WF5: Análise & Alertas]
        ↓
   (Feedback Loop)
        ↓
[WF1: Novas Ideias...]
```

---

## 📋 Detalhamento dos Workflows

### 🔹 Workflow 1: Ideia → Roteiro

**Objetivo**: Gerar roteiros profissionais usando IA

**Input**: Ideias com status `RASCUNHO` ou `EM_DESENVOLVIMENTO`

**Output**: Roteiro completo em Markdown salvo no banco

**Frequência**: 3x ao dia (8h, 14h, 20h)

**Duração Média**: 15-30s por roteiro

**Nodes Principais**:
1. Schedule Trigger (Cron)
2. Supabase Query (buscar ideias)
3. Loop Over Items
4. Prepare Prompt (JavaScript)
5. OpenAI/Claude (geração)
6. Process Response (JavaScript)
7. Insert Roteiro (Supabase)
8. Update Ideia Status
9. Discord Notification

**APIs Utilizadas**:
- Supabase REST API
- OpenAI API (GPT-4) ou Anthropic (Claude)

**Custo Estimado**: $0.01-0.03 por roteiro

**Exemplo de Fluxo**:
```javascript
// Input
{
  "ideia": {
    "titulo": "O Mistério do Triângulo das Bermudas",
    "descricao": "Casos de desaparecimentos...",
    "canal": "PULSO Curiosidades",
    "serie": "Mistérios Urbanos"
  }
}

// Output
{
  "roteiro": {
    "titulo": "Roteiro - O Mistério do Triângulo das Bermudas",
    "conteudo_md": "## HOOK\nVocê sabia que mais de 50 navios...\n\n## DESENVOLVIMENTO\n...",
    "duracao_estimado_segundos": 45,
    "status": "RASCUNHO"
  }
}
```

**KPIs**:
- Roteiros gerados/dia: 5-10 (Fase 1)
- Taxa de aprovação: >70% (após ajustes)
- Tempo médio: <30s

---

### 🔹 Workflow 2: Roteiro → Produção

**Objetivo**: Transformar roteiro aprovado em conteúdo pronto (áudio + assets)

**Input**: Roteiros com status `APROVADO`

**Output**: Conteúdo + Variantes + Assets (áudio TTS)

**Frequência**: Sob demanda (Webhook) ou 2x ao dia

**Duração Média**: 2-5 min por roteiro

**Nodes Principais**:
1. Webhook Trigger
2. Supabase Query (roteiros aprovados)
3. Create Conteúdo Base
4. Prepare Text for TTS
5. Generate Audio (ElevenLabs/Google)
6. Upload to Supabase Storage
7. Create Asset Record
8. Generate Variantes (Loop)
9. Link Assets to Variantes
10. Update Status
11. Notification

**APIs Utilizadas**:
- Supabase REST + Storage API
- ElevenLabs API ou Google TTS
- (Futuro) Video generation API

**Custo Estimado**: $0.15-0.30 por áudio (ElevenLabs)

**Variantes Geradas**:
- YouTube Shorts (9:16, 60s)
- TikTok (9:16, 60s, legenda maior)
- Instagram Reels (9:16, 60s)
- Kwai (9:16, 60s, legenda em destaque)

**Exemplo de Output**:
```javascript
{
  "conteudo": {
    "id": "uuid",
    "titulo": "O Triângulo das Bermudas",
    "status": "PRONTO_PARA_PRODUCAO"
  },
  "variantes": [
    {
      "id": "uuid_1",
      "nome": "YouTube Shorts - Versão A",
      "plataforma_tipo": "YOUTUBE_SHORTS"
    },
    // ... 3 mais
  ],
  "assets": [
    {
      "tipo": "AUDIO",
      "caminho": "audio/uuid_timestamp.mp3",
      "duracao_segundos": 45
    }
  ]
}
```

**Próxima Etapa Manual** (até automatizar vídeo):
- Download do áudio
- Edição em CapCut/Premiere
- Upload do vídeo final para Storage
- Criar asset de vídeo vinculado

---

### 🔹 Workflow 3: Publicação

**Objetivo**: Publicar variantes prontas nas plataformas

**Input**: Variantes com status `PRONTO_PARA_PUBLICACAO`

**Output**: Posts agendados/publicados

**Frequência**: Cron (horários fixos: 10h, 14h, 18h, 21h)

**Duração Média**: 1-3 min por post

**Nodes Principais**:
1. Schedule Trigger
2. Buscar Variantes Prontas
3. Loop Items
4. Prepare Data
5. Generate Title/Caption (IA)
6. Switch (por plataforma)
   - Branch YouTube
   - Branch TikTok
   - Branch Instagram
7. Download Video from Storage
8. Upload to Platform API
9. Create Post Record
10. Update Variante Status
11. Notification

**APIs Utilizadas**:
- YouTube Data API v3
- TikTok API (limitado)
- Instagram Graph API
- Supabase

**Limitações**:
- YouTube: 10.000 unidades/dia
- TikTok: API restrita
- Instagram: Apenas Business accounts

**Alternativa Fase 1** (Recomendada):
- Usar **Publer** ou **Buffer** API
- n8n prepara assets + metadata
- Ferramenta externa publica

**Exemplo de Post**:
```javascript
{
  "post": {
    "titulo": "🔺 O Segredo do Triângulo das Bermudas Revelado!",
    "legenda": "Mais de 50 navios desapareceram...\n\n#triangulo #misterio #curiosidades",
    "url_publicacao": "https://youtube.com/shorts/xyz",
    "data_publicacao": "2025-11-20T14:00:00Z",
    "status": "PUBLICADO"
  }
}
```

---

### 🔹 Workflow 4: Coleta de Métricas

**Objetivo**: Coletar métricas de performance dos posts

**Input**: Posts com status `PUBLICADO`

**Output**: Métricas salvas em `metricas_diarias`

**Frequência**: 2x ao dia (10h, 22h)

**Duração Média**: 5-10 min (todos os posts)

**Nodes Principais**:
1. Schedule Trigger (Cron)
2. Buscar Posts Publicados (últimos 30 dias)
3. Filter Recent Posts
4. Loop Items
5. Prepare Metrics Request
6. Switch (por plataforma)
   - YouTube Analytics API
   - TikTok Research API
   - Instagram Insights API
7. Process Metrics
8. Merge All Platforms
9. Upsert Metrics (Supabase)
10. Detect Anomalies
11. Generate Daily Summary
12. Notification

**Métricas Coletadas**:
- Views
- Likes / Dislikes
- Comentários
- Compartilhamentos
- Watch Time (quando disponível)
- Inscrições geradas
- CTR (cliques em links)

**APIs Utilizadas**:
- YouTube Analytics API v2
- YouTube Data API v3
- TikTok Research API
- Instagram Graph API Insights

**Anomalias Detectadas**:
- 🚀 **VIRAL**: >10k views em 24h
- ⚠️ **BAIXA PERFORMANCE**: <100 views em 7 dias
- 💚 **ALTO ENGAJAMENTO**: Taxa likes/views >5%

**Exemplo Output**:
```javascript
{
  "metricas_diarias": {
    "post_id": "uuid",
    "data_ref": "2025-11-20",
    "views": 5420,
    "likes": 312,
    "comentarios": 45,
    "compartilhamentos": 89,
    "watch_time_segundos": 12600
  },
  "anomalias": [
    {
      "tipo": "ALTO_ENGAJAMENTO",
      "mensagem": "💚 Alto engajamento: 5.8%"
    }
  ]
}
```

---

### 🔹 Workflow 5: Análise & Alertas

**Objetivo**: Gerar insights acionáveis e relatórios semanais

**Input**: Resumo de métricas (últimos 7-30 dias)

**Output**: Relatório detalhado com recomendações

**Frequência**: Semanal (Segunda-feira 9h) + Mensal (Dia 1)

**Duração Média**: 3-5 min

**Nodes Principais**:
1. Schedule Trigger (Cron)
2. Fetch Performance Summary
3. Fetch Daily Metrics (trend)
4. Analyze Top Performers
5. Analyze Underperformers
6. Compare by Platform
7. Analyze Best Time to Post
8. Generate AI Insights (OpenAI)
9. Format Report (Markdown)
10. Send Discord
11. Send Email (opcional)

**Análises Realizadas**:

1. **Top 5 Posts** (por views e engajamento)
2. **Posts com Baixa Performance** (alertas)
3. **Comparação por Plataforma** (qual funciona melhor)
4. **Melhor Horário de Postagem** (padrões)
5. **Insights de IA** (padrões + recomendações)

**Exemplo de Relatório**:
```markdown
# 📊 Relatório Semanal PULSO
**Período**: 13/11 - 20/11/2025

## 🏆 TOP PERFORMERS
1. **O Segredo do Triângulo** (YouTube)
   - 15.2k views | 890 likes | 5.8% eng.

## ⚠️ BAIXA PERFORMANCE (3)
- Vídeo X - 89 views em 7 dias

## 📱 PERFORMANCE POR PLATAFORMA
- **YouTube**: 8.5k avg views | 4.2% eng.
- **TikTok**: 12.3k avg views | 6.1% eng. 🏅

## ⏰ MELHORES HORÁRIOS
1. 14h-15h | Média: 9.8k views
2. 18h-19h | Média: 8.2k views

## 🤖 INSIGHTS DA IA
**Padrões identificados:**
1. Vídeos com "mistério" no título têm 2.3x mais views
2. TikTok supera YouTube em 45% de engajamento
3. Posts às 14h têm melhor performance

**Recomendações:**
1. Criar mais conteúdo de mistérios
2. Focar esforços no TikTok
3. Agendar posts principais às 14h
```

**Notificações**:
- Discord (completo)
- Email (resumo executivo)
- WhatsApp (alertas críticos)

---

## 🔐 Credenciais Necessárias

### Supabase
```env
SUPABASE_URL=https://nlcisbfdiokmipyihtuz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=***
```

### IA & TTS
```env
OPENAI_API_KEY=sk-***
ANTHROPIC_API_KEY=sk-ant-*** (opcional)
ELEVENLABS_API_KEY=***
ELEVENLABS_VOICE_ID=***
GOOGLE_TTS_API_KEY=*** (alternativa)
```

### Plataformas
```env
# YouTube
YOUTUBE_CLIENT_ID=***
YOUTUBE_CLIENT_SECRET=***
YOUTUBE_ACCESS_TOKEN=***
YOUTUBE_REFRESH_TOKEN=***

# TikTok
TIKTOK_CLIENT_KEY=***
TIKTOK_ACCESS_TOKEN=***

# Instagram
INSTAGRAM_BUSINESS_ACCOUNT_ID=***
INSTAGRAM_ACCESS_TOKEN=***
```

### Notificações
```env
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/***
SMTP_HOST=smtp.gmail.com
SMTP_USER=***
SMTP_PASSWORD=***
```

---

## 📊 Ordem de Implementação

### ✅ Prioridade 1 (Semana 1)
1. **Workflow 1** - Ideia → Roteiro
   - Core do sistema de criação

### ✅ Prioridade 2 (Semana 2)
2. **Workflow 4** - Coleta Métricas
   - Começar a coletar dados o quanto antes

### ✅ Prioridade 3 (Semana 3)
3. **Workflow 2** - Roteiro → Produção
   - Automatizar produção de áudio
   - Vídeo manual inicialmente

### 🔄 Prioridade 4 (Semana 4)
4. **Workflow 3** - Publicação
   - Pode ser semi-manual no início
   - Usar Publer/Buffer como ponte

### 📊 Prioridade 5 (Semana 5)
5. **Workflow 5** - Análise & Alertas
   - Quando já tiver dados suficientes

---

## 🧪 Testes Recomendados

### Workflow 1
```sql
-- Criar ideia de teste
INSERT INTO pulso_content.ideias (canal_id, titulo, descricao, status)
VALUES (...);
```
- Executar workflow manualmente
- Verificar roteiro gerado
- Validar qualidade do prompt

### Workflow 2
```sql
-- Aprovar roteiro
UPDATE pulso_content.roteiros SET status = 'APROVADO' WHERE id = '...';
```
- Disparar via webhook
- Verificar áudio gerado
- Validar upload no Storage

### Workflow 4
```sql
-- Simular post publicado
INSERT INTO pulso_distribution.posts (...) VALUES (...);
```
- Executar coleta
- Verificar métricas salvas
- Validar anomalias detectadas

---

## 💰 Custos Estimados (Mensal)

| Serviço | Uso Estimado | Custo Mensal |
|---------|--------------|--------------|
| **OpenAI** (roteiros) | 300 roteiros × $0.02 | $6.00 |
| **ElevenLabs** (TTS) | 300 áudios × $0.25 | $75.00 |
| **Supabase** | Storage 10GB | $0 (free tier) |
| **n8n Cloud** | Workflows ativos | $20-40 |
| **APIs (YouTube/etc)** | Leitura | $0 (gratuito) |
| **Total** | | **~$100-120/mês** |

**Alternativa Econômica**:
- Google TTS (gratuito): -$75
- Total: **~$25-45/mês**

---

## 🎯 KPIs por Workflow

### WF1: Ideia → Roteiro
- Roteiros gerados/dia: 5-10
- Tempo médio: <30s
- Taxa de erro: <5%

### WF2: Roteiro → Produção
- Conteúdos produzidos/dia: 3-7
- Tempo médio: 2-5 min
- Qualidade do áudio: >4/5

### WF3: Publicação
- Posts publicados/dia: 4-28
- Taxa de sucesso: >95%
- Tempo de agendamento: <2 min

### WF4: Coleta Métricas
- Posts rastreados: 100%
- Frequência: 2x/dia
- Anomalias detectadas: registradas

### WF5: Análise
- Relatórios gerados: Semanal
- Insights acionáveis: 3-5 por relatório
- Implementação de recomendações: >50%

---

## 📁 Estrutura de Exportação

```
automation/n8n/workflows/
├── 01_ideia_para_roteiro.json
├── 02_roteiro_para_producao.json
├── 03_publicacao_plataformas.json
├── 04_coleta_metricas.json
└── 05_analise_alertas.json
```

Após criar cada workflow no n8n:
1. Export JSON
2. Salvar na pasta `workflows/`
3. Versionar no Git

---

**Próximo**: [Blueprint: Banco de Dados](./03_BANCO_DE_DADOS.md)
