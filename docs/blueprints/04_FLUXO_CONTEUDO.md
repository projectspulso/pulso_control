# 🔄 Blueprint: Fluxo de Conteúdo (End-to-End)

## 🎯 Visão Geral

Este documento detalha o ciclo de vida completo de uma peça de conteúdo, desde a ideia inicial até a análise de performance.

---

## 📊 Diagrama do Fluxo Completo

```
┌──────────────────────────────────────────────────────────────┐
│           CICLO DE VIDA DO CONTEÚDO PULSO                    │
└──────────────────────────────────────────────────────────────┘

┌─────────────┐
│  GERAÇÃO    │
│  DE IDEIAS  │ ← [Manual, IA, Trends, Feedback de métricas]
└──────┬──────┘
       │
       ▼
┌──────────────────┐
│   pulso_content  │
│     .ideias      │ ← Status: RASCUNHO
└──────┬───────────┘
       │
       │ [WF1: n8n Ideia → Roteiro]
       ▼
┌──────────────────┐
│   pulso_content  │
│    .roteiros     │ ← Status: RASCUNHO → EM_REVISAO → APROVADO
└──────┬───────────┘
       │
       │ [WF2: n8n Roteiro → Produção]
       ▼
┌──────────────────┐
│   pulso_content  │
│   .conteudos     │ ← Status: EM_PRODUCAO
└──────┬───────────┘
       │
       ├─────────────────────────────────────┐
       │                                     │
       ▼                                     ▼
┌──────────────────┐              ┌──────────────────┐
│   pulso_content  │              │  pulso_assets    │
│conteudo_variantes│              │     .assets      │
│ (4 plataformas)  │◄─────────────┤ (áudio, vídeo)   │
└──────┬───────────┘              └──────────────────┘
       │
       │ Status: PRONTO_PARA_PUBLICACAO
       │
       │ [WF3: n8n Publicação]
       ▼
┌──────────────────┐
│pulso_distribution│
│      .posts      │ ← Status: AGENDADO → PUBLICADO
└──────┬───────────┘
       │
       │ [WF4: n8n Coleta Métricas (2x/dia)]
       ▼
┌──────────────────┐
│ pulso_analytics  │
│ .metricas_diarias│ ← Views, Likes, Comments, etc
└──────┬───────────┘
       │
       │ [WF5: n8n Análise Semanal]
       ▼
┌──────────────────┐
│   RELATÓRIO +    │
│    INSIGHTS      │ → [Feedback para novas ideias]
└──────────────────┘
       │
       └─────────────────┐
                         │
                         ▼
                  ┌──────────────┐
                  │ NOVAS IDEIAS │
                  └──────────────┘
```

---

## 🔹 Fase 1: Geração de Ideias

### Origem das Ideias

#### 1. **Manual**
- Brainstorming da equipe
- Inspiração em tendências
- Sugestões de audiência

**Processo**:
```sql
INSERT INTO pulso_content.ideias (
  canal_id,
  serie_id,
  titulo,
  descricao,
  origem,
  prioridade,
  status,
  tags,
  linguagem
) VALUES (
  '{{ canal_id }}',
  '{{ serie_id }}',
  'O Mistério do Triângulo das Bermudas',
  'Casos inexplicáveis de desaparecimentos no Triângulo das Bermudas...',
  'MANUAL',
  1, -- alta prioridade
  'RASCUNHO',
  ARRAY['mistério', 'história', 'dark'],
  'pt-BR'
);
```

#### 2. **IA/Automática**
- Workflow busca trending topics
- Gera ideias baseadas em padrões de sucesso

```javascript
// Exemplo pseudo-código
const trendingTopics = await getTikTokTrends();
const ideas = await openai.generateIdeas({
  topics: trendingTopics,
  style: 'dark, mysterious',
  duration: '45-60s'
});
```

#### 3. **Feedback de Métricas**
- Workflow 5 analisa posts de sucesso
- Gera variações de temas que funcionaram

```sql
-- Buscar temas de posts virais
SELECT tags, titulo FROM vw_pulso_posts_resumo
WHERE total_views > 10000
ORDER BY total_views DESC
LIMIT 10;
```

### Status de Ideias

| Status | Descrição | Próxima Ação |
|--------|-----------|--------------|
| `RASCUNHO` | Ideia inicial | Processar com WF1 |
| `EM_DESENVOLVIMENTO` | WF1 em execução | Aguardar roteiro |
| `APROVADA` | Roteiro gerado | Revisar manualmente |
| `DESCARTADA` | Não será usada | Arquivado |

---

## 🔹 Fase 2: Criação de Roteiro

### Workflow 1: Ideia → Roteiro

**Trigger**: Cron (3x/dia) ou Manual

**Processo**:
1. Busca ideias com status `RASCUNHO`
2. Gera prompt contextualizado
3. Chama IA (OpenAI/Claude)
4. Processa resposta
5. Salva roteiro
6. Atualiza status da ideia

**Exemplo de Roteiro Gerado**:
```markdown
## HOOK (3 segundos)
Você sabia que mais de 50 navios desapareceram sem deixar rastro no Triângulo das Bermudas?

## DESENVOLVIMENTO (40 segundos)
Entre Miami, Bermudas e Porto Rico existe uma área conhecida como o cemitério do Atlântico.

Em 1945, cinco aviões militares desapareceram. Nenhum destroço foi encontrado.

Teorias vão desde anomalias magnéticas até portais dimensionais.

Mas a ciência aponta para tempestades súbitas e correntes marítimas poderosas.

## CONCLUSÃO (7 segundos)
O mistério continua... Será que algum dia saberemos a verdade?

Segue para mais mistérios que a ciência ainda não explica!

## EXTRAS
- B-roll: Mapas antigos, oceano tempestuoso, radares
- Tom: Misterioso, intrigante
- Música: Suspense sutil
```

### Revisão e Aprovação

**Manual** (Fase 1):
- Revisar roteiros em `vw_pulso_roteiros`
- Aprovar ou solicitar revisão

```sql
-- Aprovar roteiro
UPDATE pulso_content.roteiros
SET status = 'APROVADO', revisado_por = '{{ user_id }}'
WHERE id = '{{ roteiro_id }}';
```

**Automático** (Futuro):
- Workflow de validação com IA
- Checagem de qualidade automatizada

---

## 🔹 Fase 3: Produção de Conteúdo

### Workflow 2: Roteiro → Produção

**Trigger**: Webhook (status=APROVADO) ou Cron (2x/dia)

**Etapas**:

#### 1. Criar Conteúdo Base
```sql
INSERT INTO pulso_content.conteudos (
  canal_id, serie_id, roteiro_id,
  titulo_interno, sinopse, status
) VALUES (...);
```

#### 2. Gerar Áudio (TTS)
- ElevenLabs (qualidade premium)
- Google TTS (econômico)

**Parâmetros**:
```json
{
  "text": "Você sabia que mais de 50 navios...",
  "voice_id": "{{ elevenlabs_voice_id }}",
  "stability": 0.5,
  "similarity_boost": 0.75
}
```

#### 3. Upload para Storage
```
Supabase Storage:
/pulso-assets/audio/{{ conteudo_id }}_{{ timestamp }}.mp3
```

#### 4. Criar Asset
```sql
INSERT INTO pulso_assets.assets (
  tipo, nome, caminho_storage, duracao_segundos
) VALUES (
  'AUDIO', 'Áudio TTS - Triângulo Bermudas',
  'audio/xyz.mp3', 45
);
```

#### 5. Gerar Variantes (4 plataformas)
```sql
INSERT INTO pulso_content.conteudo_variantes (
  conteudo_id, nome_variacao, plataforma_tipo, status
) VALUES
  (conteudo_id, 'YouTube Shorts - V1', 'YOUTUBE_SHORTS', 'PRONTO_PARA_PRODUCAO'),
  (conteudo_id, 'TikTok - V1', 'TIKTOK', 'PRONTO_PARA_PRODUCAO'),
  (conteudo_id, 'Instagram Reels - V1', 'INSTAGRAM_REELS', 'PRONTO_PARA_PRODUCAO'),
  (conteudo_id, 'Kwai - V1', 'KWAI', 'PRONTO_PARA_PRODUCAO');
```

#### 6. Vincular Assets
```sql
-- Para cada variante
INSERT INTO pulso_assets.conteudo_variantes_assets
  (conteudo_variantes_id, asset_id, papel, ordem)
VALUES
  (variante_id, audio_asset_id, 'AUDIO_TTS', 1);
```

### Etapa Manual (Fase 1): Edição de Vídeo

**Até automatizar geração de vídeo**:

1. **Download do áudio**:
```bash
https://{{ supabase_url }}/storage/v1/object/public/pulso-assets/audio/xyz.mp3
```

2. **Edição** (CapCut / Premiere):
   - Adicionar B-roll
   - Legendas sincronizadas
   - Música de fundo
   - Thumbnail

3. **Upload do vídeo**:
```sql
INSERT INTO pulso_assets.assets (tipo, caminho_storage, ...)
VALUES ('VIDEO', 'video/xyz.mp4', ...);

-- Vincular
INSERT INTO pulso_assets.conteudo_variantes_assets
VALUES (variante_id, video_asset_id, 'VIDEO_PRINCIPAL', 1);
```

4. **Atualizar status**:
```sql
UPDATE pulso_content.conteudo_variantes
SET status = 'PRONTO_PARA_PUBLICACAO'
WHERE id = '{{ variante_id }}';
```

---

## 🔹 Fase 4: Publicação

### Workflow 3: Variante → Publicação

**Trigger**: Cron (horários fixos: 10h, 14h, 18h, 21h)

**Processo**:

#### 1. Buscar Variantes Prontas
```sql
SELECT * FROM vw_pulso_conteudo_variantes_assets
WHERE variante_status = 'PRONTO_PARA_PUBLICACAO'
AND asset_tipo = 'VIDEO'
LIMIT 10;
```

#### 2. Gerar Título e Legenda Otimizados (IA)

**YouTube Shorts**:
```
Prompt: "Crie título viral (max 60 chars) para YouTube Shorts: 'Triângulo das Bermudas'"
Output: "🔺 50 Navios Sumiram Aqui! O Mistério Revelado"
```

**TikTok**:
```
Prompt: "Crie legenda + hashtags para TikTok: 'Triângulo das Bermudas'"
Output: "Você não vai acreditar no que acontece no Triângulo das Bermudas 😱 
#misterio #curiosidades #triangulo #viral #fyp"
```

**Instagram Reels**:
```
Output: "O lugar mais misterioso do mundo 🌊
Mais de 50 navios desapareceram sem deixar rastro...

#triangulo #bermudas #misterios #curiosidades #viral #reels #explore"
```

#### 3. Download do Vídeo
```javascript
const videoUrl = `${SUPABASE_URL}/storage/v1/object/public/pulso-assets/${video_path}`;
const videoFile = await downloadFile(videoUrl);
```

#### 4. Upload para Plataforma

**YouTube (via API)**:
```javascript
await youtube.videos.insert({
  part: ['snippet', 'status'],
  requestBody: {
    snippet: {
      title: titulo_otimizado,
      description: descricao,
      categoryId: '24', // Entertainment
      tags: ['shorts', 'curiosidades', 'mistério']
    },
    status: {
      privacyStatus: 'public',
      selfDeclaredMadeForKids: false
    }
  },
  media: {
    body: videoFile
  }
});
```

**Alternativa (Fase 1)**: Usar Publer/Buffer API

#### 5. Criar Registro de Post
```sql
INSERT INTO pulso_distribution.posts (
  conteudo_variantes_id,
  canal_plataforma_id,
  status,
  titulo_publicado,
  legenda_publicada,
  url_publicacao,
  identificador_externo,
  data_publicacao
) VALUES (
  variante_id,
  canal_plataforma_id,
  'PUBLICADO',
  '🔺 50 Navios Sumiram...',
  'Você não vai acreditar...',
  'https://youtube.com/shorts/abc123',
  'abc123',
  NOW()
);
```

#### 6. Atualizar Status da Variante
```sql
UPDATE pulso_content.conteudo_variantes
SET status = 'PUBLICADO'
WHERE id = variante_id;
```

---

## 🔹 Fase 5: Coleta de Métricas

### Workflow 4: Coleta Automática

**Trigger**: Cron (10h, 22h diariamente)

**Processo**:

#### 1. Buscar Posts Publicados (últimos 30 dias)
```sql
SELECT * FROM vw_pulso_posts
WHERE post_status = 'PUBLICADO'
AND data_publicacao >= NOW() - INTERVAL '30 days';
```

#### 2. Para Cada Post, Buscar Métricas

**YouTube**:
```javascript
const stats = await youtube.videos.list({
  part: ['statistics'],
  id: identificador_externo
});

return {
  views: parseInt(stats.items[0].statistics.viewCount),
  likes: parseInt(stats.items[0].statistics.likeCount),
  comentarios: parseInt(stats.items[0].statistics.commentCount)
};
```

**TikTok**:
```javascript
// Via TikTok Research API (limitado)
const data = await tiktok.getVideoInfo(video_id);
```

**Instagram**:
```javascript
const insights = await instagram.getMediaInsights(media_id, {
  metric: ['plays', 'likes', 'comments', 'shares', 'saved']
});
```

#### 3. Salvar/Atualizar Métricas
```sql
INSERT INTO pulso_analytics.metricas_diarias (
  post_id, plataforma_id, data_ref,
  views, likes, comentarios, compartilhamentos
) VALUES (
  post_id, plataforma_id, CURRENT_DATE,
  5420, 312, 45, 89
)
ON CONFLICT (post_id, data_ref)
DO UPDATE SET
  views = EXCLUDED.views,
  likes = EXCLUDED.likes,
  comentarios = EXCLUDED.comentarios,
  compartilhamentos = EXCLUDED.compartilhamentos,
  updated_at = NOW();
```

#### 4. Detectar Anomalias

**Viral** (>10k views em 24h):
```javascript
if (views > 10000 && diasPublicado <= 1) {
  notifyDiscord('🚀 POST VIRAL! 15.2k views em 24h');
}
```

**Baixa Performance** (<100 views em 7 dias):
```javascript
if (views < 100 && diasPublicado >= 7) {
  notifyDiscord('⚠️ Baixo alcance: 89 views em 7 dias');
}
```

**Alto Engajamento** (>5%):
```javascript
const engagementRate = (likes / views) * 100;
if (engagementRate > 5) {
  notifyDiscord('💚 Alto engajamento: 5.8%');
}
```

---

## 🔹 Fase 6: Análise e Feedback

### Workflow 5: Análise Semanal

**Trigger**: Segunda-feira 9h (semanal)

**Análises**:

#### 1. Top Performers
```sql
SELECT titulo_publicado, plataforma_nome, total_views, total_likes
FROM vw_pulso_posts_resumo
ORDER BY total_views DESC
LIMIT 5;
```

#### 2. Underperformers
```sql
SELECT * FROM vw_pulso_posts_resumo
WHERE total_views < 500
AND EXTRACT(DAY FROM NOW() - primeira_data_ref) >= 7;
```

#### 3. Melhor Plataforma
```sql
SELECT 
  plataforma_nome,
  COUNT(*) as posts,
  AVG(total_views) as avg_views,
  AVG(total_likes::float / NULLIF(total_views, 0) * 100) as avg_engagement
FROM vw_pulso_posts_resumo
GROUP BY plataforma_nome
ORDER BY avg_views DESC;
```

#### 4. Insights com IA

**Prompt**:
```
Analise esses dados de performance e identifique:
1. 3 Padrões de sucesso
2. 3 Problemas recorrentes
3. 5 Recomendações acionáveis

Dados: [JSON com métricas]
```

**Output Exemplo**:
```markdown
### PADRÕES DE SUCESSO
1. Vídeos com "mistério" no título têm 2.3x mais views
2. TikTok supera YouTube em 45% de engajamento
3. Posts às 14h performam melhor

### PROBLEMAS
1. Baixa retenção em vídeos >50s
2. Hashtags genéricas não trazem alcance
3. Poucos posts nos finais de semana

### RECOMENDAÇÕES
1. Criar 70% de conteúdo de mistérios
2. Reduzir duração para 40-45s
3. Usar hashtags nicho (#misteriosbr, #darkfacts)
4. Aumentar frequência sábado/domingo
5. Testar thumbnails com rostos expressivos
```

#### 5. Feedback Loop para Novas Ideias

**Automático**:
```javascript
// Gerar ideias baseadas em posts de sucesso
const topPosts = await getTopPosts(limit=10);
const themes = extractThemes(topPosts);

const newIdeas = await openai.generateIdeas({
  baseThemes: themes,
  quantity: 20,
  style: 'dark, mysterious'
});

// Inserir no banco
for (const idea of newIdeas) {
  await supabase.from('ideias').insert({
    titulo: idea.title,
    descricao: idea.description,
    origem: 'IA',
    prioridade: 2,
    status: 'RASCUNHO'
  });
}
```

---

## 📊 Métricas de Ciclo Completo

### Tempo Médio (Fase 1 - Manual)

| Fase | Tempo | Automação |
|------|-------|-----------|
| Ideia → Roteiro | 30s | 100% (WF1) |
| Roteiro → Áudio | 2 min | 100% (WF2) |
| Áudio → Vídeo | **20-30 min** | 0% (manual) |
| Vídeo → Publicação | 5 min | 50% (semi-auto) |
| Coleta Métricas | 10s/post | 100% (WF4) |
| **Total** | **~30-40 min/vídeo** | **~60%** |

### Tempo Médio (Fase 3 - Automatizado)

| Fase | Tempo | Automação |
|------|-------|-----------|
| Ideia → Roteiro | 30s | 100% |
| Roteiro → Vídeo | 5 min | 100% (IA) |
| Vídeo → Publicação | 2 min | 100% |
| Coleta Métricas | 10s | 100% |
| **Total** | **~8 min/vídeo** | **100%** |

---

## 🎯 Próximos Passos

1. **Validar Fluxo Manual** (Semana 1-2)
   - Produzir 7 vídeos manualmente
   - Testar cada etapa
   - Documentar pontos de fricção

2. **Automatizar Workflows 1, 2, 4** (Semana 3-4)
   - Implementar no n8n
   - Integrar com Supabase
   - Monitorar execuções

3. **Semi-automatizar Publicação** (Semana 5)
   - Usar Publer/Buffer
   - n8n prepara assets
   - Aprovação manual

4. **Automatizar Vídeo** (Mês 2-3)
   - Integrar Pictory/Invideo
   - Templates padronizados
   - Testes A/B

---

**Próximo**: [Guia: Implementação Fase 1](./05_GUIA_FASE_1.md)
