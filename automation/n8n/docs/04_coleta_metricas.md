# Workflow 4: Coleta Automática de Métricas

## 🎯 Objetivo

Coletar diariamente as métricas de performance dos posts publicados em todas as plataformas.

## 🔄 Fluxo do Workflow

```
[Schedule Trigger - 2x ao dia]
    ↓
[Supabase: Buscar posts PUBLICADOS]
    ↓
[Loop em cada post]
    ↓
[Switch: YouTube / TikTok / Instagram]
    ↓
[API da Plataforma: Buscar métricas]
    ↓
[Processar dados]
    ↓
[Supabase: Inserir/Atualizar métricas_diarias]
    ↓
[Verificar anomalias]
    ↓
[Notificação: Resumo diário]
```

## 📋 Nodes do Workflow

### 1. **Schedule Trigger**

- **Tipo**: Cron
- **Schedule**: `0 10,22 * * *` (10h e 22h diariamente)
- **Motivo**: Coletar dados 2x/dia para acompanhar crescimento

### 2. **Buscar Posts Publicados**

- **Tipo**: HTTP Request
- **URL**: `{{ $env.SUPABASE_URL }}/rest/v1/vw_pulso_posts?post_status=eq.PUBLICADO&order=data_publicacao.desc&limit=50`
- **Filtro adicional**: Posts dos últimos 30 dias

### 3. **Filtrar Posts Recentes**

- **Tipo**: Code

```javascript
const posts = $input.all();
const now = new Date();
const diasAtras = 30;
const dataLimite = new Date(now - diasAtras * 24 * 60 * 60 * 1000);

// Filtrar apenas posts publicados nos últimos 30 dias
const postsRecentes = posts.filter((item) => {
  const dataPublicacao = new Date(item.json.data_publicacao);
  return dataPublicacao >= dataLimite;
});

return postsRecentes;
```

### 4. **Loop em cada post**

### 5. **Preparar Request de Métricas**

- **Tipo**: Code

```javascript
const post = $input.item.json;

return {
  json: {
    post_id: post.id,
    plataforma_tipo: post.plataforma_tipo,
    plataforma_id: post.plataforma_id,
    identificador_externo: post.identificador_externo,
    data_publicacao: post.data_publicacao,
    data_ref: new Date().toISOString().split("T")[0], // YYYY-MM-DD
  },
};
```

### 6. **Switch: Por Plataforma**

- `{{ $json.plataforma_tipo }}` === `YOUTUBE_SHORTS` → Branch YouTube
- `{{ $json.plataforma_tipo }}` === `TIKTOK` → Branch TikTok
- `{{ $json.plataforma_tipo }}` === `INSTAGRAM_REELS` → Branch Instagram

---

## 📺 Branch: YouTube

### 7a. **YouTube Analytics API**

- **Tipo**: HTTP Request
- **URL**: `https://youtubeanalytics.googleapis.com/v2/reports`
- **Params**:

```
ids: channel==MINE
dimensions: video
filters: video=={{ $json.identificador_externo }}
metrics: views,likes,dislikes,comments,shares,estimatedMinutesWatched,subscribersGained
startDate: {{ $json.data_publicacao.split('T')[0] }}
endDate: {{ new Date().toISOString().split('T')[0] }}
```

- **Headers**:

```
Authorization: Bearer {{ $env.YOUTUBE_ACCESS_TOKEN }}
```

**Alternativa**: YouTube Data API v3 (mais simples, menos detalhes)

- **URL**: `https://www.googleapis.com/youtube/v3/videos?part=statistics&id={{ $json.identificador_externo }}`

### 8a. **Processar Métricas YouTube**

- **Tipo**: Code

```javascript
const response = $input.item.json;
const post = $("Preparar Request").item.json;

// YouTube Data API v3 response
const stats = response.items?.[0]?.statistics || {};

return {
  json: {
    post_id: post.post_id,
    plataforma_id: post.plataforma_id,
    data_ref: post.data_ref,
    views: parseInt(stats.viewCount) || 0,
    likes: parseInt(stats.likeCount) || 0,
    deslikes: 0, // YouTube removeu dislikes públicos
    comentarios: parseInt(stats.commentCount) || 0,
    compartilhamentos: 0, // Não disponível na API básica
    cliques_link: 0,
    inscricoes: 0, // Requer Analytics API
    watch_time_segundos: 0, // Requer Analytics API
    metadata: {
      favorited: stats.favoriteCount,
      coletado_em: new Date().toISOString(),
    },
  },
};
```

---

## 🎵 Branch: TikTok

### 7b. **TikTok Research API** (se disponível)

- **Tipo**: HTTP Request
- **URL**: `https://open.tiktokapis.com/v2/research/video/query/`
- **Nota**: API limitada, requer aprovação

**Alternativa**: Web Scraping (não recomendado, viola ToS)

### 8b. **Processar Métricas TikTok**

```javascript
// Similar ao YouTube, adaptado para estrutura do TikTok
const stats = $input.item.json.data?.video_info || {};

return {
  json: {
    post_id: post.post_id,
    plataforma_id: post.plataforma_id,
    data_ref: post.data_ref,
    views: stats.view_count || 0,
    likes: stats.like_count || 0,
    comentarios: stats.comment_count || 0,
    compartilhamentos: stats.share_count || 0,
    watch_time_segundos: Math.floor(stats.play_duration || 0),
  },
};
```

---

## 📸 Branch: Instagram

### 7c. **Instagram Graph API - Insights**

- **Tipo**: HTTP Request
- **URL**: `https://graph.facebook.com/v18.0/{{ $json.identificador_externo }}/insights`
- **Params**:

```
metric: plays,likes,comments,shares,saved,reach
access_token: {{ $env.INSTAGRAM_ACCESS_TOKEN }}
```

### 8c. **Processar Métricas Instagram**

```javascript
const insights = $input.item.json.data || [];

const metricas = {};
insights.forEach((insight) => {
  metricas[insight.name] = insight.values[0].value;
});

return {
  json: {
    post_id: post.post_id,
    plataforma_id: post.plataforma_id,
    data_ref: post.data_ref,
    views: metricas.plays || 0,
    likes: metricas.likes || 0,
    comentarios: metricas.comments || 0,
    compartilhamentos: metricas.shares || 0,
    cliques_link: 0,
    inscricoes: 0,
    watch_time_segundos: 0,
  },
};
```

---

## 🔄 Após Coletar (Todas as plataformas)

### 9. **Merge: Reunir todas as métricas**

- **Tipo**: Merge
- Combinar dados de todas as branches

### 10. **Inserir/Atualizar Métricas Diárias**

- **Tipo**: HTTP Request
- **Método**: POST
- **URL**: `{{ $env.SUPABASE_URL }}/rest/v1/metricas_diarias`
- **Headers**:

```
Prefer: resolution=merge-duplicates
```

- **Body**: `={{ $json }}`

**SQL Equivalente**:

```sql
INSERT INTO pulso_analytics.metricas_diarias (...)
VALUES (...)
ON CONFLICT (post_id, data_ref)
DO UPDATE SET
  views = EXCLUDED.views,
  likes = EXCLUDED.likes,
  ...
  updated_at = NOW();
```

### 11. **Verificar Anomalias**

- **Tipo**: Code

```javascript
const metricas = $input.all();

const anomalias = [];

metricas.forEach((m) => {
  const data = m.json;

  // Viral: mais de 10k views em 24h
  if (data.views > 10000) {
    anomalias.push({
      tipo: "VIRAL",
      post_id: data.post_id,
      metrica: "views",
      valor: data.views,
      mensagem: `🚀 POST VIRAL! ${data.views} views`,
    });
  }

  // Baixa performance: menos de 100 views em 7 dias
  const diasPublicado = Math.floor(
    (new Date() - new Date(data.data_publicacao)) / (1000 * 60 * 60 * 24)
  );

  if (diasPublicado >= 7 && data.views < 100) {
    anomalias.push({
      tipo: "BAIXA_PERFORMANCE",
      post_id: data.post_id,
      metrica: "views",
      valor: data.views,
      mensagem: `⚠️ Baixo alcance: ${data.views} views em ${diasPublicado} dias`,
    });
  }

  // Bom engajamento: taxa de likes > 5%
  if (data.views > 0 && data.likes / data.views > 0.05) {
    anomalias.push({
      tipo: "ALTO_ENGAJAMENTO",
      post_id: data.post_id,
      metrica: "engagement_rate",
      valor: ((data.likes / data.views) * 100).toFixed(2),
      mensagem: `💚 Alto engajamento: ${(
        (data.likes / data.views) *
        100
      ).toFixed(1)}%`,
    });
  }
});

return anomalias.map((a) => ({ json: a }));
```

### 12. **Gerar Resumo Diário**

- **Tipo**: Code

```javascript
const metricas = $("Merge").all();

const totais = metricas.reduce(
  (acc, m) => {
    acc.views += m.json.views || 0;
    acc.likes += m.json.likes || 0;
    acc.comentarios += m.json.comentarios || 0;
    acc.posts += 1;
    return acc;
  },
  { views: 0, likes: 0, comentarios: 0, posts: 0 }
);

const anomalias = $("Verificar Anomalias").all();

return {
  json: {
    data: new Date().toISOString().split("T")[0],
    posts_atualizados: totais.posts,
    total_views: totais.views,
    total_likes: totais.likes,
    total_comentarios: totais.comentarios,
    anomalias: anomalias.length,
    detalhes_anomalias: anomalias.map((a) => a.json),
  },
};
```

### 13. **Notificação Discord/Email**

- **Tipo**: Discord Webhook

```
📊 **Relatório de Métricas - {{ $json.data }}**

📈 Posts atualizados: {{ $json.posts_atualizados }}
👁️ Views totais: {{ $json.total_views.toLocaleString() }}
💚 Likes totais: {{ $json.total_likes.toLocaleString() }}
💬 Comentários: {{ $json.total_comentarios.toLocaleString() }}

{{#if $json.anomalias > 0}}
⚡ **Anomalias Detectadas: {{ $json.anomalias }}**

{{ $json.detalhes_anomalias.map(a => a.mensagem).join('\n') }}
{{/if}}

🔗 [Ver Dashboard no Supabase]
```

## 🔐 Variáveis de Ambiente

```
YOUTUBE_ACCESS_TOKEN=
YOUTUBE_API_KEY=

TIKTOK_ACCESS_TOKEN=

INSTAGRAM_ACCESS_TOKEN=
INSTAGRAM_BUSINESS_ACCOUNT_ID=

DISCORD_WEBHOOK_URL=
```

## ⏰ Estratégia de Coleta

- **Primeira semana**: 2x ao dia (manhã e noite)
- **Semana 2-4**: 1x ao dia
- **Após 1 mês**: 1x a cada 3 dias
- **Após 3 meses**: Apenas quando solicitado

## 📊 Visualização dos Dados

Depois de coletar, use as views:

```sql
-- Performance geral
SELECT * FROM public.vw_pulso_posts_resumo
ORDER BY total_views DESC;

-- Tendência diária
SELECT * FROM public.vw_pulso_posts_metricas_diarias
WHERE post_id = 'seu_post_id'
ORDER BY data_ref;

-- Comparação por plataforma
SELECT
  plataforma_nome,
  COUNT(*) as total_posts,
  SUM(total_views) as views,
  AVG(total_likes) as avg_likes
FROM public.vw_pulso_posts_resumo
GROUP BY plataforma_nome;
```

## 🎨 Melhorias Futuras

1. **Benchmark automático**: Comparar com média do canal
2. **Previsão**: ML para prever performance
3. **Otimização**: Sugerir melhor horário de postagem
4. **A/B Testing**: Comparar performance de variantes
5. **ROI**: Calcular custo por view/engajamento
