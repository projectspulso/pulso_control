# PULSO - Automação Completa com n8n

## 🎯 Visão Geral

Este documento descreve os 5 workflows principais do ecossistema PULSO, que automatizam todo o processo desde a geração de ideias até a análise de métricas.

## 📊 Fluxo Completo

```
[IDEIA]
   ↓ (Workflow 1)
[ROTEIRO]
   ↓ (Workflow 2)
[CONTEÚDO + VARIANTES + ASSETS]
   ↓ (Workflow 3)
[POSTS AGENDADOS/PUBLICADOS]
   ↓ (Workflow 4)
[MÉTRICAS COLETADAS]
   ↓ (Workflow 5)
[ANÁLISE E ALERTAS]
```

## 🔧 Workflows

### Workflow 1: Ideia → Roteiro (Geração com IA)

- **Trigger**: Cron (diário) ou Webhook
- **Entrada**: Ideias com status `RASCUNHO` ou `EM_DESENVOLVIMENTO`
- **Processamento**: IA (OpenAI/Anthropic) gera roteiro completo
- **Saída**: Roteiro salvo em `pulso_content.roteiros`
- **📄 Doc**: `01_ideia_para_roteiro.md`

### Workflow 2: Roteiro → Produção (TTS + Vídeo)

- **Trigger**: Webhook (mudança de status) ou Cron
- **Entrada**: Roteiros com status `APROVADO`
- **Processamento**:
  - Gera áudio com TTS (ElevenLabs/Google)
  - Cria vídeo automatizado
  - Upload para Supabase Storage
- **Saída**: Conteúdo, variantes e assets criados
- **📄 Doc**: `02_roteiro_para_producao.md`

### Workflow 3: Variante → Publicação

- **Trigger**: Cron (horários específicos) ou Manual
- **Entrada**: Variantes com status `PRONTO_PARA_PUBLICACAO`
- **Processamento**: Publica em plataformas (YouTube, TikTok, etc.)
- **Saída**: Posts criados/agendados
- **📄 Doc**: `03_publicacao_plataformas.md`

### Workflow 4: Coleta de Métricas

- **Trigger**: Cron (diário - 2x ao dia)
- **Entrada**: Posts com status `PUBLICADO`
- **Processamento**: Busca métricas via APIs das plataformas
- **Saída**: Métricas salvas em `pulso_analytics.metricas_diarias`
- **📄 Doc**: `04_coleta_metricas.md`

### Workflow 5: Análise e Alertas

- **Trigger**: Cron (semanal) ou sob demanda
- **Entrada**: Resumo de métricas
- **Processamento**: Análise de performance e geração de insights
- **Saída**: Relatório enviado (WhatsApp/Email/Discord)
- **📄 Doc**: `05_analise_alertas.md`

## 🔑 Credenciais Necessárias no n8n

### Supabase

```
Host: nlcisbfdiokmipyihtuz.supabase.co
Service Role Key: (ver .env)
```

### IA / TTS

- **OpenAI** ou **Anthropic Claude** (geração de roteiros)
- **ElevenLabs** (TTS premium) ou **Google TTS** (gratuito)

### Plataformas

- **YouTube Data API v3** (publicação e métricas)
- **TikTok API** (se disponível)
- **Instagram Graph API**

### Notificações

- **Discord Webhook** (recomendado)
- **WhatsApp Business API** ou **Twilio**
- **SMTP** (email)

## 📁 Estrutura de Arquivos

```
automation/n8n/
├── docs/
│   ├── 00_VISAO_GERAL_WORKFLOWS.md (este arquivo)
│   ├── 01_ideia_para_roteiro.md
│   ├── 02_roteiro_para_producao.md
│   ├── 03_publicacao_plataformas.md
│   ├── 04_coleta_metricas.md
│   └── 05_analise_alertas.md
├── workflows/
│   ├── 01_ideia_para_roteiro.json
│   ├── 02_roteiro_para_producao.json
│   ├── 03_publicacao_plataformas.json
│   ├── 04_coleta_metricas.json
│   └── 05_analise_alertas.json
└── templates/
    ├── prompt_roteiro.txt
    ├── prompt_titulo.txt
    └── prompt_legenda.txt
```

## 🚀 Ordem de Implementação Recomendada

1. **Workflow 1** - Ideia → Roteiro (base do sistema)
2. **Workflow 4** - Coleta de Métricas (para ter dados)
3. **Workflow 2** - Roteiro → Produção (core da criação)
4. **Workflow 3** - Publicação (distribuição)
5. **Workflow 5** - Análise (inteligência)

## 📝 Próximos Passos

1. Configure todas as credenciais no n8n
2. Leia a documentação específica de cada workflow
3. Importe os JSONs dos workflows (quando disponíveis)
4. Teste cada workflow individualmente
5. Ajuste prompts e parâmetros conforme necessário

## 🔗 Links Úteis

- [n8n Cloud](https://pulsoprojects.app.n8n.cloud)
- [Supabase Dashboard](https://supabase.com/dashboard/project/nlcisbfdiokmipyihtuz)
- [Documentação n8n](https://docs.n8n.io)
