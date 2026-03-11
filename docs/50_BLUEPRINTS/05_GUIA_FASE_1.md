# 🚀 Guia: Implementação Fase 1 (7 Dias)

## 🎯 Objetivo da Fase 1

Validar todo o sistema PULSO com **1 canal**, publicando **7 vídeos** (1 por dia) em **4 plataformas**, testando manualmente cada etapa antes de automatizar.

**Meta**: Provar que o conceito funciona e identificar gargalos antes de escalar.

---

## 📅 Cronograma Semanal

```
DIA 1-2: Setup e Preparação
DIA 3: Primeira Produção
DIA 4-7: Produção Diária
DIA 7: Análise e Ajustes
```

---

## 🔹 DIA 1: Setup Técnico (8h)

### Manhã (4h): Configurar Infraestrutura

#### ✅ 1. Supabase (1h)

- [x] Banco criado
- [x] Schemas executados
- [x] Views criadas
- [ ] **Executar seed inicial**

```bash
# No Supabase SQL Editor
# Copiar e executar: database/sql/seeds/001_initial_data.sql
```

**Verificar**:

```sql
SELECT * FROM vw_pulso_canais;
SELECT * FROM vw_pulso_series;
SELECT COUNT(*) FROM pulso_core.plataformas; -- Deve ser 6
```

#### ✅ 2. n8n Cloud (1h)

**Acessar**: https://pulsoprojects.app.n8n.cloud

**Configurar Credenciais**:

1. **Supabase**

   - Type: HTTP Request
   - URL Base: `https://nlcisbfdiokmipyihtuz.supabase.co`
   - Headers:
     - `apikey`: {{ SUPABASE_SERVICE_ROLE_KEY }}
     - `Authorization`: Bearer {{ SUPABASE_SERVICE_ROLE_KEY }}

2. **OpenAI**

   - API Key: (obter em https://platform.openai.com)

3. **ElevenLabs** (ou Google TTS)

   - API Key: (obter em https://elevenlabs.io)
   - Voice ID: (escolher voz)

4. **Discord** (notificações)
   - Webhook URL: (criar em servidor Discord)

#### ✅ 3. Criar Contas nas Plataformas (2h)

**YouTube**:

- Criar canal: `@PULSOCuriosidadesPT`
- Configurar perfil, banner, descrição
- Ativar YouTube Shorts

**TikTok**:

- Criar conta: `@pulsocuriosidades`
- Configurar perfil

**Instagram**:

- Criar conta: `@pulso.curiosidades`
- Converter para Business/Creator
- Configurar perfil

**Kwai**:

- Criar conta: `@pulsocuriosidades`
- Configurar perfil

**Registrar no Banco**:

```sql
-- Buscar IDs
SELECT id, tipo FROM pulso_core.plataformas;

-- Inserir contas
INSERT INTO pulso_core.canais_plataformas
  (canal_id, plataforma_id, identificador_externo, nome_exibicao, url_canal, ativo)
VALUES
  -- YouTube
  ((SELECT id FROM pulso_core.canais WHERE slug='pulso-curiosidades-pt'),
   (SELECT id FROM pulso_core.plataformas WHERE tipo='YOUTUBE_SHORTS'),
   '@PULSOCuriosidadesPT',
   'PULSO Curiosidades PT',
   'https://youtube.com/@PULSOCuriosidadesPT',
   true),
  -- TikTok
  (...),
  -- Instagram
  (...),
  -- Kwai
  (...);
```

---

### Tarde (4h): Preparar Conteúdo

#### ✅ 4. Criar 20 Ideias Iniciais (2h)

**Séries**:

1. Curiosidades Dark (7 ideias)
2. Mistérios Urbanos (7 ideias)
3. Ciência Estranha (6 ideias)

**Template de Ideia**:

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
  (SELECT id FROM pulso_core.canais WHERE slug='pulso-curiosidades-pt'),
  (SELECT id FROM pulso_core.series WHERE slug='curiosidades-dark'),
  'O Mistério do Triângulo das Bermudas',
  'Mais de 50 navios e aviões desapareceram sem deixar rastro. Teorias vão de anomalias magnéticas a portais dimensionais. O que realmente acontece lá?',
  'MANUAL',
  1,
  'RASCUNHO',
  ARRAY['mistério', 'mar', 'desaparecimento'],
  'pt-BR'
);
```

**Sugestões de Ideias - Curiosidades Dark**:

1. O Mistério do Triângulo das Bermudas
2. A Ilha das Bonecas Enforcadas (México)
3. O Castelo de Sangue da Condessa Elizabeth Bathory
4. O Experimento Russo do Sono (Creepypasta Real?)
5. Catacumbas de Paris: 6 Milhões de Esqueletos
6. O Farol de Flannan Isles: 3 Homens Sumiram
7. Taos Hum: O Som Misterioso que Ninguém Explica

**Executar Script**:

```bash
# Criar arquivo: content/ideias/fase1_inicial.sql
# Executar no Supabase
```

#### ✅ 5. Implementar Workflow 1 no n8n (2h)

**Importar Estrutura**:

1. Abrir n8n
2. Criar novo workflow: "WF1 - Ideia para Roteiro"
3. Seguir doc: `automation/n8n/docs/01_ideia_para_roteiro.md`

**Nodes Essenciais**:

1. Manual Trigger (para testes)
2. Supabase: GET ideias (status=RASCUNHO, limit=1)
3. Code: Prepare Prompt
4. OpenAI: Generate (gpt-4-turbo)
5. Code: Process Response
6. Supabase: POST roteiro
7. Supabase: PATCH ideia (status=EM_DESENVOLVIMENTO)
8. Discord: Notification

**Testar**:

- Executar workflow
- Verificar roteiro gerado
- Ajustar prompt se necessário

**Salvar e Exportar**:

```bash
# Exportar JSON
# Salvar em: automation/n8n/workflows/01_ideia_para_roteiro.json
```

---

## 🔹 DIA 2: Setup de Produção (6h)

### Manhã (3h): Workflow 2

#### ✅ 6. Implementar Workflow 2 (TTS) (3h)

**Criar Workflow**: "WF2 - Roteiro para Produção"

**Nodes Principais**:

1. Webhook Trigger
2. Supabase: GET roteiro (by ID)
3. Create Conteúdo Base
4. Code: Prepare Text for TTS
5. ElevenLabs: Generate Audio
6. Supabase Storage: Upload Audio
7. Create Asset Record
8. Create Variantes (4x)
9. Link Assets to Variantes
10. Update Status
11. Discord Notification

**Configurar Supabase Storage**:

- Criar bucket: `pulso-assets`
- Criar pastas: `audio/`, `video/`, `thumbs/`
- Configurar permissões (public read)

**Testar**:

1. Aprovar 1 roteiro manualmente
2. Disparar workflow via webhook
3. Verificar áudio gerado e upload

---

### Tarde (3h): Preparar Template de Vídeo

#### ✅ 7. Criar Template em CapCut (2h)

**Especificações**:

- Formato: 9:16 (1080x1920)
- Duração: 45-60s
- Camadas:
  1. B-roll (vídeos de fundo)
  2. Áudio TTS
  3. Legendas automáticas
  4. Música de fundo (20% volume)
  5. Logo PULSO (2s no início)

**Assets Necessários**:

- Compilar 50+ vídeos B-roll:
  - Oceano, tempestades (Pexels/Pixabay)
  - Mapas antigos
  - Céu estrelado
  - Símbolos misteriosos

**Salvar Template**:

- Exportar como template CapCut
- Documentar processo em: `content/templates/capcut_template.md`

#### ✅ 8. Produzir Vídeo 1 (Manual) (1h)

**Roteiro**: Escolher da lista
**Processo**:

1. Download do áudio do Supabase Storage
2. Importar no CapCut
3. Aplicar template
4. Ajustar B-roll conforme roteiro
5. Revisar legendas
6. Adicionar música
7. Exportar: 1080x1920, 60fps, H264

**Upload para Supabase**:

```bash
# Via interface Supabase Storage
# Ou via script Node.js
```

**Registrar Asset**:

```sql
INSERT INTO pulso_assets.assets (tipo, nome, caminho_storage, duracao_segundos)
VALUES ('VIDEO', 'Triângulo Bermudas - YouTube', 'video/xyz.mp4', 45);

-- Vincular à variante
INSERT INTO pulso_assets.conteudo_variantes_assets
  (conteudo_variantes_id, asset_id, papel, ordem)
VALUES (variante_id, asset_id, 'VIDEO_PRINCIPAL', 1);

-- Atualizar status
UPDATE pulso_content.conteudo_variantes
SET status = 'PRONTO_PARA_PUBLICACAO'
WHERE id = variante_id;
```

---

## 🔹 DIA 3: Primeira Publicação (4h)

### Manhã (2h): Preparar Metadados

#### ✅ 9. Gerar Títulos e Legendas Otimizados

**Usar IA** (ChatGPT/Claude):

**Prompt para YouTube**:

```
Crie título viral (max 60 chars, com emoji) para YouTube Shorts sobre:
"O Mistério do Triângulo das Bermudas - 50 navios desaparecidos"

Estilo: Dark, intrigante, clickbait leve mas honesto
```

**Output**:

```
🔺 50 Navios Sumiram Aqui! O Mistério Revelado
```

**Prompt para TikTok**:

```
Crie legenda + 5 hashtags para TikTok sobre Triângulo das Bermudas
Tom: Jovem, curioso, viral
```

**Output**:

```
Você não vai acreditar no que acontece no Triângulo das Bermudas 😱🌊

Mais de 50 navios desapareceram sem deixar rastro...

#triangulo #misterio #curiosidades #viral #fyp
```

**Salvar Metadados**:

```sql
UPDATE pulso_content.conteudo_variantes
SET
  titulo_publico = '🔺 50 Navios Sumiram Aqui!',
  descricao_publica = 'Descubra o mistério...',
  legenda = 'Você não vai acreditar...',
  hashtags = ARRAY['triangulo', 'misterio', 'curiosidades', 'viral', 'fyp']
WHERE plataforma_tipo = 'TIKTOK' AND conteudo_id = '...';
```

---

### Tarde (2h): Publicar em Todas as Plataformas

#### ✅ 10. Upload Manual (Fase 1)

**YouTube Shorts**:

1. YouTube Studio → Create → Upload Video
2. Colar título otimizado
3. Descrição + hashtags
4. Thumbnail custom (criar no Canva)
5. Não é feito para crianças
6. Publicar

**TikTok**:

1. App TikTok → Criar
2. Upload vídeo
3. Legenda + hashtags
4. Permitir comentários, dueto, stitch
5. Publicar

**Instagram Reels**:

1. Instagram → Reels → Upload
2. Legenda + hashtags
3. Cover (escolher frame)
4. Publicar

**Kwai**:

1. App Kwai → Criar
2. Upload
3. Legenda
4. Publicar

**Registrar Posts**:

```sql
-- Para cada publicação
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
  '🔺 50 Navios Sumiram Aqui!',
  'Você não vai acreditar...',
  'https://youtube.com/shorts/abc123',
  'abc123',
  NOW()
);
```

---

## 🔹 DIA 4-6: Produção Diária (3 dias × 3h = 9h)

### Rotina Diária

#### 8h-9h: Gerar Roteiro

- Executar WF1 para 1 ideia
- Revisar e aprovar roteiro

#### 9h-10h: Gerar Áudio

- Executar WF2
- Verificar qualidade do áudio

#### 10h-11h30: Editar Vídeo

- Aplicar template CapCut
- Customizar B-roll
- Revisar legendas

#### 11h30-12h: Publicar

- Upload nas 4 plataformas
- Registrar no banco

**Repetir para Dias 4, 5, 6**:

- Dia 4: Vídeo 2 (Série: Mistérios Urbanos)
- Dia 5: Vídeo 3 (Série: Ciência Estranha)
- Dia 6: Vídeo 4 (Série: Curiosidades Dark)

---

## 🔹 DIA 7: Análise e Implementação de Métricas (6h)

### Manhã (3h): Implementar Workflow 4

#### ✅ 11. Workflow 4 - Coleta de Métricas

**Criar Workflow**: "WF4 - Coleta Métricas"

**Configurar APIs**:

**YouTube Data API v3**:

1. Google Cloud Console
2. Criar projeto
3. Ativar YouTube Data API v3
4. Criar credenciais OAuth 2.0
5. Obter access token

**TikTok**: (limitado, pode pular inicialmente)

**Instagram**:

1. Meta Developers
2. Criar App
3. Obter access token de conta Business

**Nodes**:

1. Schedule Trigger (manual para teste)
2. Supabase: GET posts (últimos 7 dias)
3. Loop Items
4. Switch (por plataforma)
5. YouTube: Get Video Statistics
6. Code: Process Metrics
7. Supabase: Upsert Metrics
8. Discord: Summary

**Testar**:

- Executar para posts dos últimos dias
- Verificar métricas salvas

---

### Tarde (3h): Análise Manual

#### ✅ 12. Primeira Análise de Performance

**Queries**:

```sql
-- Performance geral
SELECT
  titulo_publicado,
  plataforma_nome,
  total_views,
  total_likes,
  (total_likes::float / NULLIF(total_views, 0) * 100) as engagement_rate
FROM vw_pulso_posts_resumo
ORDER BY total_views DESC;

-- Por plataforma
SELECT
  plataforma_nome,
  COUNT(*) as posts,
  AVG(total_views) as avg_views,
  AVG(total_likes::float / NULLIF(total_views, 0) * 100) as avg_engagement
FROM vw_pulso_posts_resumo
GROUP BY plataforma_nome;
```

**Documentar**:

- Qual plataforma performou melhor?
- Qual tipo de conteúdo teve mais engajamento?
- Qual horário de postagem funcionou melhor?

**Criar Relatório**:

```markdown
# Relatório Fase 1 - Semana 1

## Resultados

- 4 vídeos publicados
- 4 plataformas
- Total: 16 posts

## Métricas

- Total Views: X
- Média Views/Post: Y
- Melhor plataforma: Z
- Melhor horário: W

## Aprendizados

1. ...
2. ...
3. ...

## Próximos Passos

1. ...
2. ...
```

Salvar em: `docs/relatorios/semana_01.md`

---

## 📊 Checklist Final Fase 1

### ✅ Infraestrutura

- [ ] Supabase configurado e populado
- [ ] n8n com credenciais configuradas
- [ ] Contas criadas nas 4 plataformas
- [ ] Contas registradas no banco

### ✅ Workflows

- [ ] WF1 (Ideia → Roteiro) funcionando
- [ ] WF2 (Roteiro → Áudio) funcionando
- [ ] WF4 (Coleta Métricas) funcionando

### ✅ Conteúdo

- [ ] 20 ideias no banco
- [ ] 7 roteiros gerados
- [ ] 4 vídeos produzidos
- [ ] 16 posts publicados (4 vídeos × 4 plataformas)

### ✅ Métricas

- [ ] Métricas coletadas para todos os posts
- [ ] Relatório de análise criado
- [ ] Aprendizados documentados

---

## 🎯 KPIs de Sucesso Fase 1

| Métrica               | Meta Mínima | Meta Ideal |
| --------------------- | ----------- | ---------- |
| **Vídeos Produzidos** | 4           | 7          |
| **Posts Publicados**  | 16          | 28         |
| **Views Totais**      | 500         | 2.000      |
| **Engajamento Médio** | 2%          | 5%         |
| **Tempo/Vídeo**       | <45 min     | <30 min    |

---

## 🚀 Próxima Fase: Fase 2 (Semana 2-4)

### Objetivos

- Escalar para **3 canais**
- Publicar **2 vídeos/dia** por canal
- Meta: **180 vídeos/mês**

### Setup Adicional

- Criar 2 novos canais
- Implementar WF3 (Publicação semi-automática)
- Implementar WF5 (Análise semanal)
- Otimizar templates de vídeo

---

## 💡 Dicas e Boas Práticas

### Organização

- Manter planilha de controle diário
- Documentar todos os problemas encontrados
- Salvar templates e presets usados

### Produção

- Gravar áudios em lote quando possível
- Manter biblioteca de B-roll organizada
- Padronizar thumbnails

### Publicação

- Testar diferentes horários
- A/B test de títulos (2 versões do mesmo vídeo)
- Interagir com comentários primeiras 2h

### Análise

- Acompanhar métricas diariamente
- Identificar padrões rapidamente
- Iterar com base em dados

---

## 🆘 Troubleshooting Comum

### Workflow não executa

- Verificar credenciais no n8n
- Checar logs de erro
- Testar conexão com Supabase manualmente

### Áudio com baixa qualidade

- Ajustar parâmetros TTS (stability, similarity)
- Testar diferentes vozes
- Considerar pós-processamento (Audacity)

### Baixo alcance orgânico

- Normal em início de canal
- Foco em qualidade e consistência
- Usar hashtags mix (populares + nicho)
- Interagir com comunidade

---

**Boa sorte! 🚀**

Após completar Fase 1, revisar este guia e ajustar o planejamento da Fase 2 com base nos aprendizados.
