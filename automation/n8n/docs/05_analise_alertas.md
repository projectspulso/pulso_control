# Workflow 5: Análise e Alertas Inteligentes

## 🎯 Objetivo

Analisar performance dos posts, identificar padrões e enviar relatórios e alertas acionáveis.

## 🔄 Fluxo do Workflow

```
[Schedule Trigger - Semanal]
    ↓
[Supabase: Buscar resumo de métricas]
    ↓
[Análise: Posts virais]
    ↓
[Análise: Posts com baixa performance]
    ↓
[Análise: Melhor horário de postagem]
    ↓
[Análise: Melhor plataforma]
    ↓
[IA: Gerar insights e recomendações]
    ↓
[Formatar relatório]
    ↓
[Enviar relatório (WhatsApp/Email/Discord)]
```

## 📋 Nodes do Workflow

### 1. **Schedule Trigger**

- **Tipo**: Cron
- **Schedule**:
  - `0 9 * * 1` (Segunda-feira 9h - Relatório semanal)
  - `0 9 1 * *` (Dia 1 do mês 9h - Relatório mensal)

### 2. **Buscar Dados de Performance**

- **Tipo**: HTTP Request
- **URL**: `{{ $env.SUPABASE_URL }}/rest/v1/vw_pulso_posts_resumo?order=total_views.desc`

### 3. **Buscar Métricas Diárias (Tendência)**

- **Tipo**: HTTP Request
- **URL**: `{{ $env.SUPABASE_URL }}/rest/v1/vw_pulso_posts_metricas_diarias?data_ref=gte.{{ getDateXDaysAgo(30) }}`

### 4. **Análise: Top Performers**

- **Tipo**: Code

```javascript
const posts = $("Buscar Dados de Performance").all();

// Top 5 posts por views
const topViews = posts
  .sort((a, b) => b.json.total_views - a.json.total_views)
  .slice(0, 5)
  .map((p) => ({
    titulo: p.json.titulo_publicado,
    plataforma: p.json.plataforma_nome,
    views: p.json.total_views,
    likes: p.json.total_likes,
    engagement_rate: ((p.json.total_likes / p.json.total_views) * 100).toFixed(
      2
    ),
  }));

// Top 5 por engagement
const topEngagement = posts
  .filter((p) => p.json.total_views > 100) // Mínimo de views
  .map((p) => ({
    ...p.json,
    engagement_rate: (p.json.total_likes / p.json.total_views) * 100,
  }))
  .sort((a, b) => b.engagement_rate - a.engagement_rate)
  .slice(0, 5)
  .map((p) => ({
    titulo: p.titulo_publicado,
    plataforma: p.plataforma_nome,
    engagement_rate: p.engagement_rate.toFixed(2),
    views: p.total_views,
    likes: p.total_likes,
  }));

return {
  json: {
    top_views: topViews,
    top_engagement: topEngagement,
  },
};
```

### 5. **Análise: Baixa Performance**

- **Tipo**: Code

```javascript
const posts = $("Buscar Dados de Performance").all();
const agora = new Date();

const underperformers = posts
  .filter((p) => {
    const diasPublicado = Math.floor(
      (agora - new Date(p.json.primeira_data_ref)) / (1000 * 60 * 60 * 24)
    );

    // Posts com mais de 7 dias e menos de 500 views
    return diasPublicado >= 7 && p.json.total_views < 500;
  })
  .slice(0, 5)
  .map((p) => ({
    titulo: p.json.titulo_publicado,
    plataforma: p.json.plataforma_nome,
    views: p.json.total_views,
    dias_publicado: Math.floor(
      (agora - new Date(p.json.primeira_data_ref)) / (1000 * 60 * 60 * 24)
    ),
  }));

return {
  json: {
    underperformers: underperformers,
    total: underperformers.length,
  },
};
```

### 6. **Análise: Comparação por Plataforma**

- **Tipo**: Code

```javascript
const posts = $("Buscar Dados de Performance").all();

const porPlataforma = {};

posts.forEach((p) => {
  const plat = p.json.plataforma_nome;

  if (!porPlataforma[plat]) {
    porPlataforma[plat] = {
      plataforma: plat,
      total_posts: 0,
      total_views: 0,
      total_likes: 0,
      total_comentarios: 0,
    };
  }

  porPlataforma[plat].total_posts++;
  porPlataforma[plat].total_views += p.json.total_views;
  porPlataforma[plat].total_likes += p.json.total_likes;
  porPlataforma[plat].total_comentarios += p.json.total_comentarios;
});

// Calcular médias
const resultado = Object.values(porPlataforma)
  .map((p) => ({
    ...p,
    avg_views: Math.round(p.total_views / p.total_posts),
    avg_likes: Math.round(p.total_likes / p.total_posts),
    engagement_rate: ((p.total_likes / p.total_views) * 100).toFixed(2),
  }))
  .sort((a, b) => b.avg_views - a.avg_views);

return {
  json: {
    por_plataforma: resultado,
    melhor_plataforma: resultado[0]?.plataforma || "N/A",
  },
};
```

### 7. **Análise: Melhor Horário de Postagem**

- **Tipo**: Code

```javascript
const metricas = $("Buscar Métricas Diárias").all();

// Agrupar por hora de publicação
const porHora = {};

metricas.forEach((m) => {
  const dataPublicacao = new Date(m.json.data_publicacao);
  const hora = dataPublicacao.getHours();

  if (!porHora[hora]) {
    porHora[hora] = {
      hora: hora,
      total_posts: 0,
      total_views: 0,
    };
  }

  porHora[hora].total_posts++;
  porHora[hora].total_views += m.json.views;
});

// Calcular média e ordenar
const ranking = Object.values(porHora)
  .map((h) => ({
    ...h,
    avg_views: Math.round(h.total_views / h.total_posts),
  }))
  .sort((a, b) => b.avg_views - a.avg_views);

const top3Horarios = ranking.slice(0, 3);

return {
  json: {
    melhores_horarios: top3Horarios,
    recomendacao: `Poste entre ${top3Horarios[0]?.hora}h e ${
      top3Horarios[0]?.hora + 1
    }h`,
  },
};
```

### 8. **Gerar Insights com IA**

- **Tipo**: OpenAI

```javascript
const topPerformers = $("Análise: Top Performers").item.json;
const underperformers = $("Análise: Baixa Performance").item.json;
const porPlataforma = $("Análise: Comparação por Plataforma").item.json;
const horarios = $("Análise: Melhor Horário").item.json;

const prompt = `Você é um analista de dados especializado em redes sociais.

# DADOS DE PERFORMANCE

## Top 5 Posts (Views)
${JSON.stringify(topPerformers.top_views, null, 2)}

## Top 5 Posts (Engajamento)
${JSON.stringify(topPerformers.top_engagement, null, 2)}

## Posts com Baixa Performance
${JSON.stringify(underperformers.underperformers, null, 2)}

## Performance por Plataforma
${JSON.stringify(porPlataforma.por_plataforma, null, 2)}

## Melhores Horários
${JSON.stringify(horarios.melhores_horarios, null, 2)}

# TAREFA

Analise esses dados e forneça:

1. **3 Padrões Identificados** (o que posts de sucesso têm em comum)
2. **3 Problemas Encontrados** (por que alguns posts floparam)
3. **5 Recomendações Acionáveis** (o que fazer esta semana)

Seja direto, objetivo e baseado em dados. Formato markdown.`;

return {
  json: {
    prompt: prompt,
  },
};
```

### 9. **Processar Resposta da IA**

```javascript
const insights = $input.item.json.choices[0].message.content;

return {
  json: {
    insights: insights,
  },
};
```

### 10. **Formatar Relatório Completo**

- **Tipo**: Code

```javascript
const topPerformers = $("Análise: Top Performers").item.json;
const underperformers = $("Análise: Baixa Performance").item.json;
const porPlataforma = $("Análise: Comparação por Plataforma").item.json;
const horarios = $("Análise: Melhor Horário").item.json;
const insights = $("Processar Resposta da IA").item.json.insights;

const dataInicio = new Date();
dataInicio.setDate(dataInicio.getDate() - 7);

const relatorio = `
# 📊 Relatório Semanal PULSO
**Período**: ${dataInicio.toLocaleDateString(
  "pt-BR"
)} - ${new Date().toLocaleDateString("pt-BR")}

---

## 🏆 TOP PERFORMERS

### Por Views
${topPerformers.top_views
  .map(
    (p, i) =>
      `${i + 1}. **${p.titulo}** (${p.plataforma})
   - ${p.views.toLocaleString()} views | ${p.likes.toLocaleString()} likes | ${
        p.engagement_rate
      }% eng.`
  )
  .join("\n")}

### Por Engajamento
${topPerformers.top_engagement
  .map(
    (p, i) =>
      `${i + 1}. **${p.titulo}** (${p.plataforma})
   - ${p.engagement_rate}% eng. | ${p.views.toLocaleString()} views`
  )
  .join("\n")}

---

## ⚠️ POSTS COM BAIXA PERFORMANCE (${underperformers.total})

${underperformers.underperformers
  .map(
    (p) =>
      `- ${p.titulo} (${p.plataforma}) - ${p.views} views em ${p.dias_publicado} dias`
  )
  .join("\n")}

---

## 📱 PERFORMANCE POR PLATAFORMA

${porPlataforma.por_plataforma
  .map(
    (p) =>
      `**${p.plataforma}**
- Posts: ${p.total_posts}
- Média de views: ${p.avg_views.toLocaleString()}
- Engajamento: ${p.engagement_rate}%`
  )
  .join("\n\n")}

🏅 **Melhor plataforma**: ${porPlataforma.melhor_plataforma}

---

## ⏰ MELHORES HORÁRIOS PARA POSTAR

${horarios.melhores_horarios
  .map(
    (h, i) =>
      `${i + 1}. ${h.hora}h - ${
        h.hora + 1
      }h | Média: ${h.avg_views.toLocaleString()} views`
  )
  .join("\n")}

💡 ${horarios.recomendacao}

---

## 🤖 INSIGHTS DA IA

${insights}

---

## 🎯 PRÓXIMAS AÇÕES

1. Revisar posts com baixa performance
2. Criar mais conteúdo no estilo dos top performers
3. Focar na plataforma: ${porPlataforma.melhor_plataforma}
4. Postar nos horários recomendados

---

📈 [Ver Dashboard Completo no Supabase]
`;

return {
  json: {
    relatorio: relatorio,
    data_geracao: new Date().toISOString(),
  },
};
```

### 11. **Enviar via Discord**

- **Tipo**: Discord Webhook
- **URL**: `{{ $env.DISCORD_WEBHOOK_URL }}`
- **Content**: `{{ $json.relatorio }}`

### 12. **Enviar via Email (Opcional)**

- **Tipo**: Send Email (SMTP)
- **To**: seu@email.com
- **Subject**: `📊 Relatório PULSO - {{ new Date().toLocaleDateString('pt-BR') }}`
- **HTML**: Converter markdown para HTML

### 13. **Enviar via WhatsApp (Opcional)**

- **Tipo**: Twilio ou WhatsApp Business API
- **Para**: Seu número
- **Mensagem**: Versão resumida do relatório

## 🔐 Variáveis de Ambiente

```
DISCORD_WEBHOOK_URL=
OPENAI_API_KEY=
SMTP_HOST=
SMTP_USER=
SMTP_PASSWORD=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=
```

## 📊 Exemplo de Alerta em Tempo Real

Além do relatório semanal, configure alertas instantâneos:

### Trigger: Webhook do Workflow 4 (Coleta de Métricas)

```
SE post.views > 10000 em 24h
  → Discord: "🚀 POST VIRAL!"

SE post.views < 100 em 7 dias
  → Discord: "⚠️ Post precisa de boost"

SE engagement_rate > 10%
  → Discord: "💚 Excelente engajamento!"
```

## 🎨 Dashboard Sugestões

Crie visualizações no Supabase ou ferramentas como:

- **Metabase** (open source)
- **Grafana** (dashboards)
- **Google Data Studio** (gratuito)

Queries úteis:

```sql
-- Evolução semanal
SELECT
  DATE_TRUNC('week', data_ref) as semana,
  SUM(views) as total_views,
  AVG(views) as avg_views
FROM pulso_analytics.metricas_diarias
GROUP BY semana
ORDER BY semana DESC;

-- Conteúdo viral (top 1%)
WITH percentis AS (
  SELECT PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY total_views) as p99
  FROM public.vw_pulso_posts_resumo
)
SELECT * FROM public.vw_pulso_posts_resumo
WHERE total_views >= (SELECT p99 FROM percentis);
```

## 🎯 KPIs a Monitorar

1. **Crescimento**: Views mês a mês
2. **Engajamento**: Likes/Views ratio
3. **Retenção**: Watch time (quando disponível)
4. **Viralidade**: % de posts com >10k views
5. **Consistência**: Desvio padrão de performance

## 🚀 Melhorias Futuras

1. **Previsão de performance**: ML para prever sucesso antes de publicar
2. **Sugestões de temas**: IA sugere próximas ideias baseado em tendências
3. **Comparação com concorrentes**: Benchmark com canais similares
4. **ROI**: Calcular retorno sobre investimento (tempo/custo)
5. **Teste A/B automatizado**: Comparar variantes e escolher vencedora
