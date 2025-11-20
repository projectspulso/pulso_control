# Workflow 3: Variante → Publicação nas Plataformas

## 🎯 Objetivo

Publicar automaticamente ou agendar posts nas plataformas (YouTube, TikTok, Instagram).

## 🔄 Fluxo do Workflow

```
[Schedule Trigger - Horários de postagem]
    ↓
[Supabase: Buscar variantes PRONTO_PARA_PUBLICACAO]
    ↓
[Loop em cada variante]
    ↓
[Verificar plataforma de destino]
    ↓
[Switch: YouTube / TikTok / Instagram]
    ↓
[Download do vídeo do Storage]
    ↓
[Gerar título/descrição otimizada (IA)]
    ↓
[Upload para plataforma]
    ↓
[Criar registro de POST]
    ↓
[Atualizar status da variante]
    ↓
[Notificação: Post publicado]
```

## 📋 Nodes do Workflow

### 1. **Schedule Trigger**

- **Tipo**: Cron
- **Schedule**:
  - `0 10,14,18 * * *` (10h, 14h, 18h diariamente)
  - Ou horários personalizados por plataforma

### 2. **Buscar Variantes Prontas**

- **Tipo**: HTTP Request
- **URL**: `{{ $env.SUPABASE_URL }}/rest/v1/vw_pulso_conteudo_variantes_assets?variante_status=eq.PRONTO_PARA_PUBLICACAO&limit=5`

### 3. **Loop em cada variante**

### 4. **Preparar Dados da Variante**

- **Tipo**: Code

```javascript
const variante = $input.item.json;

// Buscar vídeo e assets
const videoAsset = variante.asset_tipo === "VIDEO" ? variante : null;
const audioAsset = variante.asset_tipo === "AUDIO" ? variante : null;

return {
  json: {
    variante_id: variante.conteudo_variantes_id,
    conteudo_id: variante.conteudo_id,
    plataforma_tipo: variante.plataforma_tipo,
    titulo_base: variante.titulo_interno,
    video_path: videoAsset?.caminho_storage,
    audio_path: audioAsset?.caminho_storage,
    canal_id: variante.canal_id,
    serie_nome: variante.serie_nome,
  },
};
```

### 5. **Gerar Título e Legenda Otimizados (IA)**

- **Tipo**: OpenAI

```javascript
// Prompt adaptado por plataforma
const plataforma = $json.plataforma_tipo;
const titulo_base = $json.titulo_base;

let prompt = "";

if (plataforma === "YOUTUBE_SHORTS") {
  prompt = `Crie um título viral para YouTube Shorts sobre: "${titulo_base}"

Regras:
- Máximo 60 caracteres
- Use emojis relevantes (1-2)
- Crie curiosidade
- Inclua palavras-chave SEO

Formato: apenas o título, sem explicações`;
} else if (plataforma === "TIKTOK") {
  prompt = `Crie uma legenda viral para TikTok sobre: "${titulo_base}"

Regras:
- Máximo 150 caracteres
- 3-5 hashtags relevantes
- Tom jovem e engajador
- Use emojis

Formato: legenda + hashtags`;
} else if (plataforma === "INSTAGRAM_REELS") {
  prompt = `Crie legenda para Instagram Reels sobre: "${titulo_base}"

Regras:
- Primeira linha: Hook forte
- 2-3 linhas de contexto
- 5-7 hashtags mistos (populares + nicho)
- Emojis estratégicos

Formato: legenda completa`;
}

return {
  json: {
    prompt: prompt,
    plataforma: plataforma,
    titulo_base: titulo_base,
  },
};
```

### 6. **Switch: Separar por Plataforma**

- **Tipo**: Switch
- **Regras**:
  - `{{ $json.plataforma_tipo }}` === `YOUTUBE_SHORTS` → YouTube
  - `{{ $json.plataforma_tipo }}` === `TIKTOK` → TikTok
  - `{{ $json.plataforma_tipo }}` === `INSTAGRAM_REELS` → Instagram

---

## 📺 Branch: YouTube Shorts

### 7a. **Download Vídeo do Storage**

- **Tipo**: HTTP Request
- **URL**: `{{ $env.SUPABASE_URL }}/storage/v1/object/public/pulso-assets/{{ $('Preparar Dados da Variante').item.json.video_path }}`
- **Response Format**: File

### 8a. **Upload para YouTube**

- **Tipo**: HTTP Request (YouTube Data API v3)
- **Método**: POST
- **URL**: `https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status`
- **Headers**:

```
Authorization: Bearer {{ $env.YOUTUBE_ACCESS_TOKEN }}
Content-Type: multipart/related
```

- **Body** (multipart):

```json
{
  "snippet": {
    "title": "={{ $('Gerar Título e Legenda').item.json.titulo }}",
    "description": "={{ $('Gerar Título e Legenda').item.json.legenda }}",
    "categoryId": "24",
    "tags": ["shorts", "curiosidades", "dark"],
    "defaultLanguage": "pt-BR"
  },
  "status": {
    "privacyStatus": "public",
    "selfDeclaredMadeForKids": false
  }
}
```

**Nota**: YouTube API requer OAuth 2.0. Considere usar biblioteca ou ferramenta como Zapier/Make para simplificar.

---

## 🎵 Branch: TikTok

### 7b. **TikTok API - Upload**

- **Tipo**: HTTP Request
- **Método**: POST
- **URL**: `https://open-api.tiktok.com/share/video/upload/`
- **Nota**: TikTok API é limitada. Alternativas:
  - Usar ferramenta como **Publer** ou **Buffer**
  - Upload manual inicial
  - API oficial (requer aprovação)

---

## 📸 Branch: Instagram Reels

### 7c. **Instagram Graph API**

- **Tipo**: HTTP Request
- Similar ao YouTube, mas com autenticação Facebook/Instagram
- **Nota**: Reels API disponível apenas para contas Business/Creator

---

## 🔄 Após Upload (Todos os branches)

### 9. **Criar Registro de POST**

- **Tipo**: HTTP Request
- **Método**: POST
- **URL**: `{{ $env.SUPABASE_URL }}/rest/v1/posts`
- **Body**:

```json
{
  "conteudo_variantes_id": "={{ $('Preparar Dados').item.json.variante_id }}",
  "canal_plataforma_id": "={{ $('Buscar Canal Plataforma').item.json.id }}",
  "status": "PUBLICADO",
  "titulo_publicado": "={{ $('Gerar Título').item.json.titulo }}",
  "descricao_publicada": "={{ $('Gerar Título').item.json.legenda }}",
  "url_publicacao": "={{ $('Upload YouTube').item.json.url }}",
  "identificador_externo": "={{ $('Upload YouTube').item.json.id }}",
  "data_publicacao": "={{ new Date().toISOString() }}",
  "metadata": {
    "workflow": "n8n_workflow_3",
    "plataforma": "={{ $json.plataforma_tipo }}"
  }
}
```

### 10. **Atualizar Status da Variante**

- **Tipo**: HTTP Request
- **Método**: PATCH
- **URL**: `{{ $env.SUPABASE_URL }}/rest/v1/conteudo_variantes?id=eq.={{ $('Preparar Dados').item.json.variante_id }}`
- **Body**:

```json
{
  "status": "PUBLICADO"
}
```

### 11. **Notificação**

- **Tipo**: Discord

```
🚀 Post publicado!

📱 Plataforma: {{ $json.plataforma_tipo }}
📝 Título: {{ $('Gerar Título').item.json.titulo }}
🔗 URL: {{ $json.url_publicacao }}
⏰ Publicado: {{ new Date().toLocaleString('pt-BR') }}
```

## 🛠️ Alternativas Simplificadas

### Opção 1: Agendamento (sem publicação direta)

Em vez de publicar diretamente, o workflow pode:

1. Preparar todos os assets
2. Gerar títulos/legendas otimizados
3. Criar tarefas em ferramenta de agendamento (Publer, Buffer)
4. Você publica manualmente depois

### Opção 2: Exportar para Cloud Storage

1. Fazer upload dos vídeos prontos para Google Drive/Dropbox
2. Gerar CSV com metadados (título, legenda, hashtags)
3. Usar ferramenta de publicação em massa

### Opção 3: Webhooks + Zapier/Make

1. n8n dispara webhook com dados
2. Zapier/Make faz a publicação (têm integrações nativas)

## 🔐 Credenciais Necessárias

```
# YouTube
YOUTUBE_CLIENT_ID=
YOUTUBE_CLIENT_SECRET=
YOUTUBE_ACCESS_TOKEN= (renovar periodicamente)
YOUTUBE_REFRESH_TOKEN=

# TikTok (se disponível)
TIKTOK_CLIENT_KEY=
TIKTOK_ACCESS_TOKEN=

# Instagram
INSTAGRAM_BUSINESS_ACCOUNT_ID=
INSTAGRAM_ACCESS_TOKEN=
```

## 📊 Limitações das APIs

- **YouTube**: 10.000 unidades/dia (1 upload = ~1600 unidades)
- **TikTok**: API limitada, requer aprovação
- **Instagram**: Apenas contas Business/Creator

## 🎨 Recomendação Inicial

**Fase 1**: Automatizar apenas preparação

- Gerar títulos/legendas com IA
- Organizar arquivos
- Publicação manual

**Fase 2**: Integração com ferramentas de agendamento

- Publer API
- Buffer API
- Later API

**Fase 3**: APIs diretas (quando escalar)

- YouTube API
- Instagram Graph API
