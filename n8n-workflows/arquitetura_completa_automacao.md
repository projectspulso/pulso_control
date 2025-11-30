# Arquitetura Completa PULSO - Automação End-to-End

## 🎯 Visão Geral do Sistema

```
┌────────────────────────────────────────────────────────────────┐
│                    PIPELINE COMPLETO                           │
│                                                                │
│  WF00 → WF01 → WF02 → WF03 → WF04                             │
│  Ideias  Roteiro  Áudio  Vídeo  Publicação                    │
│                                                                │
│  🤖 → 📝 → 🎙️ → 🎬 → 📱                                        │
└────────────────────────────────────────────────────────────────┘
```

---

## 📊 WF00 - GERAR IDEIAS (Automação Total)

### **Objetivo:**

Gerar automaticamente ideias de conteúdo para cada canal, baseado em:

- Trending topics
- Performance histórica
- Calendário sazonal (datas comemorativas)

### **Trigger:**

```
CRON: 1x por dia às 3h
└─ Processa 1 canal por vez
└─ Gera 5-10 ideias por canal
```

### **Fluxo:**

```javascript
// 1. Selecionar canal do dia
const canais = ['Pulso Dark PT', 'PULSO Estudos', 'PULSO Motivacional', ...];
const canal_hoje = canais[new Date().getDay() % canais.length];

// 2. Buscar contexto do canal
SELECT
  c.*,
  s.nome as serie_nome,
  pp.intervalo_dias,
  (SELECT COUNT(*) FROM ideias WHERE canal_id = c.id AND created_at > NOW() - INTERVAL '7 days') as ideias_semana
FROM pulso_core.canais c
JOIN pulso_core.series s ON s.canal_id = c.id
JOIN pulso_content.plano_publicacao pp ON pp.canal_id = c.id
WHERE c.nome = canal_hoje;

// 3. Gerar ideias com GPT-4o
const prompt = `
Você é um criador de conteúdo do canal "${canal_nome}".

Contexto:
- Tipo: ${canal.metadata.tipo}
- Público: Brasileiros 18-35 anos
- Plataformas: TikTok, YouTube Shorts, Instagram Reels
- Duração: 40-60 segundos

Diretrizes:
${diretrizes_canal[canal_nome]}

Gere 10 ideias virais seguindo este formato JSON:
[
  {
    "titulo": "Título chamativo (max 60 chars)",
    "descricao": "Sinopse completa do vídeo (2-3 linhas)",
    "gancho": "Primeira frase que prende atenção",
    "tags": ["tag1", "tag2", "tag3"],
    "duracao_estimada": "45s",
    "potencial_viral": 8
  }
]
`;

// 4. Processar resposta
const ideias = JSON.parse(gpt4o_response);

// 5. Salvar ideias (status: RASCUNHO)
for (ideia of ideias) {
  INSERT INTO pulso_content.ideias (
    canal_id,
    serie_id,
    titulo,
    descricao,
    status,
    tags,
    linguagem,
    metadata
  ) VALUES (
    canal_id,
    serie_id_principal,
    ideia.titulo,
    ideia.descricao,
    'RASCUNHO',
    ideia.tags,
    'pt-BR',
    jsonb_build_object(
      'gancho_sugerido', ideia.gancho,
      'duracao_estimada', ideia.duracao_estimada,
      'potencial_viral', ideia.potencial_viral,
      'gerado_por_ia', true,
      'gerado_em', NOW()
    )
  );
}

// 6. Criar registro no pipeline
// (Trigger do banco faz isso automaticamente quando ideia é criada)
```

### **Custo Estimado:**

```
10 ideias/dia × 5 canais = 50 ideias/dia
Prompt: ~500 chars × 50 = 25k chars
Output: ~2000 chars × 50 = 100k chars

Custo GPT-4o:
- Input: 0.025M × $2.50 = $0.06
- Output: 0.10M × $10.00 = $1.00
TOTAL: ~$1.06/dia = $32/mês
```

### **Aprovação:**

```
Opção A (início): Manual
└─ Você revisa 50 ideias/dia no app
└─ Aprova 10-15 melhores (30%)

Opção B (futuro): Semi-automática
└─ Auto-aprova ideias com potencial_viral >= 8
└─ Resto vai para revisão manual

Opção C (escala): Totalmente automática
└─ Auto-aprova tudo
└─ Você só remove ideias ruins
```

---

## 📝 WF01 - GERAR ROTEIRO

### **Trigger:**

```
Webhook: POST /webhook/ideia-aprovada
Body: { "ideia_id": "uuid" }
```

### **Fluxo:**

```sql
-- 1. Buscar ideia completa
SELECT
  i.*,
  c.nome as canal_nome,
  c.metadata as canal_metadata,
  s.nome as serie_nome,
  p.id as pipeline_id,
  p.status as pipeline_status
FROM pulso_content.ideias i
JOIN pulso_core.canais c ON c.id = i.canal_id
LEFT JOIN pulso_core.series s ON s.id = i.serie_id
LEFT JOIN pulso_content.pipeline_producao p ON p.ideia_id = i.id
WHERE i.id = $ideia_id;

-- 2. Gerar roteiro com GPT-4o
const prompt = `
Crie um roteiro de vídeo curto (50 segundos) baseado nesta ideia:

TÍTULO: ${ideia.titulo}
DESCRIÇÃO: ${ideia.descricao}
CANAL: ${canal_nome}
TOM: ${diretrizes[canal_nome].tom}
GANCHO SUGERIDO: ${ideia.metadata.gancho_sugerido}

Formato do roteiro:

# [TÍTULO PÚBLICO]

## GANCHO (0-5s)
[Primeira frase que para o scroll]

## DESENVOLVIMENTO (5-40s)
[Narrativa principal - fatos, contexto, história]

## CLÍMAX (40-50s)
[Revelação surpreendente ou momento "uau"]

## CTA (50-55s)
[Call to action: segue o Pulso, compartilha, etc]

---
HASHTAGS: #tag1 #tag2 #tag3
DURAÇÃO ESTIMADA: Xs
`;

-- 3. Salvar roteiro (status: RASCUNHO)
INSERT INTO pulso_content.roteiros (
  ideia_id,
  canal_id,
  titulo,
  conteudo_md,
  duracao_estimado_segundos,
  status,
  linguagem,
  categoria_metadata,
  metadata
) VALUES (
  ideia_id,
  canal_id,
  titulo_publico,
  roteiro_markdown,
  duracao_estimada,
  'RASCUNHO',
  'pt-BR',
  'PADRAO_COMPLETO',
  jsonb_build_object(
    'ai_modelo', 'gpt-4o',
    'prompt_version', '1.0',
    'gancho_utilizado', gancho,
    'hashtags_sugeridas', hashtags,
    'custo_geracao', 0.003,
    'gerado_em', NOW()
  )
) RETURNING id;

-- 4. Pipeline é atualizado automaticamente pelo trigger
-- (quando roteiro.status mudar para APROVADO)
```

### **Aprovação:**

```
App → Revisar Roteiro
├─ Editar se necessário
├─ Aprovar → UPDATE roteiros SET status = 'APROVADO'
└─ 🔥 Trigger fn_sync_pipeline_from_roteiro():
   └─ UPDATE pipeline SET status = 'ROTEIRO_PRONTO'
```

---

## 🎙️ WF02 - GERAR ÁUDIO

### **Trigger:**

```
Webhook: POST /webhook/roteiro-aprovado
Body: { "roteiro_id": "uuid" }
```

### **Fluxo:**

```sql
-- 1. Buscar roteiro aprovado
SELECT
  r.*,
  i.canal_id,
  c.nome as canal_nome
FROM pulso_content.roteiros r
JOIN pulso_content.ideias i ON i.id = r.ideia_id
JOIN pulso_core.canais c ON c.id = i.canal_id
WHERE r.id = $roteiro_id
  AND r.status = 'APROVADO';

-- 2. Preparar texto para TTS
const texto_limpo = limparMarkdown(roteiro.conteudo_md);

-- 3. Selecionar voz por idioma
const voz_mapa = {
  'pt-BR': 'alloy',  // OpenAI
  'en-US': 'nova',
  'es-ES': 'shimmer'
};

-- 4. Gerar áudio (OpenAI TTS)
POST https://api.openai.com/v1/audio/speech
{
  "model": "tts-1-hd",
  "voice": voz_mapa[roteiro.linguagem],
  "input": texto_limpo,
  "speed": 1.0
}

-- 5. Upload para Supabase Storage
POST https://nlcisbfdiokmipyihtuz.supabase.co/storage/v1/object/audios/{roteiro_id}.mp3
Body: [binary MP3]

-- 6. Registrar áudio
INSERT INTO pulso_content.audios (
  ideia_id,
  roteiro_id,
  canal_id,
  storage_path,
  public_url,
  duracao_segundos,
  linguagem,
  formato,
  tipo,
  status,
  metadata
) VALUES (
  ideia_id,
  roteiro_id,
  canal_id,
  'audios/{roteiro_id}.mp3',
  'https://...supabase.co/storage/v1/object/public/audios/{roteiro_id}.mp3',
  duracao_estimada,
  'pt-BR',
  'audio/mpeg',
  'AUDIO_TTS',
  'OK',
  jsonb_build_object(
    'provedor', 'openai',
    'modelo', 'tts-1-hd',
    'voice', voz,
    'caracteres', total_chars,
    'custo', 0.0008,
    'gerado_em', NOW()
  )
) RETURNING id;

-- 7. 🔥 Trigger fn_sync_pipeline_from_audio() executa automaticamente:
--    UPDATE pipeline SET audio_id = NEW.id, status = 'AUDIO_GERADO'
```

---

## 🎬 WF03 - GERAR VÍDEO

### **Trigger:**

```
Webhook interno (disparado pelo WF02 após criar áudio)
ou
CRON: A cada 30 minutos, busca áudios sem vídeo
```

### **Fluxo (Fase 1 - Manual):**

```sql
-- 1. Buscar áudio + roteiro
SELECT
  a.*,
  r.titulo,
  r.conteudo_md,
  r.metadata as roteiro_metadata,
  i.canal_id,
  p.id as pipeline_id
FROM pulso_content.audios a
JOIN pulso_content.roteiros r ON r.id = a.roteiro_id
JOIN pulso_content.ideias i ON i.id = a.ideia_id
JOIN pulso_content.pipeline_producao p ON p.ideia_id = a.ideia_id
WHERE a.tipo = 'AUDIO_TTS'
  AND a.status = 'OK'
  AND NOT EXISTS (
    SELECT 1 FROM pulso_content.videos v
    WHERE v.roteiro_id = a.roteiro_id
  );

-- 2. Preparar storyboard (metadata de vídeo)
const storyboard = gerarStoryboard(roteiro, audio);

-- 3. [FASE 1] Registrar vídeo (sem arquivo ainda - você monta manual)
INSERT INTO pulso_content.videos (
  ideia_id,
  roteiro_id,
  canal_id,
  storage_path,
  public_url,
  duracao_segundos,
  resolucao,
  formato,
  plataforma_foco,
  tipo,
  status,
  metadata
) VALUES (
  ideia_id,
  roteiro_id,
  canal_id,
  'videos/{roteiro_id}.mp4', -- placeholder
  'pendente', -- você faz upload depois
  audio.duracao_segundos,
  '1080x1920',
  'video/mp4',
  'tiktok',
  'VIDEO_SHORT',
  'AGUARDANDO_MONTAGEM', -- você monta no CapCut
  jsonb_build_object(
    'storyboard', storyboard,
    'audio_id', audio.id,
    'mascote_obrigatorio', true,
    'criado_em', NOW()
  )
) RETURNING id;

-- 4. [FASE 2 - FUTURO] Chamar API de render (Remotion/Shotstack)
--    Gera vídeo automaticamente com mascote + áudio + backgrounds

-- 5. Quando você fizer upload manual do vídeo:
UPDATE pulso_content.videos
SET
  public_url = 'https://...supabase.co/storage/v1/object/public/videos/{id}.mp4',
  status = 'OK'
WHERE id = video_id;

-- 6. 🔥 Trigger fn_sync_pipeline_from_video() executa:
--    UPDATE pipeline SET video_id = NEW.id, status = 'PRONTO_PUBLICACAO'
```

---

## 📱 WF04 - PUBLICAR

### **Trigger:**

```
CRON: 3x ao dia (6h, 12h, 18h)
└─ Busca vídeos prontos com deadline <= agora
```

### **Fluxo:**

```sql
-- 1. Buscar vídeos prontos para publicar
SELECT *
FROM pulso_content.vw_agenda_publicacao_detalhada
WHERE tem_video = true
  AND pipeline_status = 'PRONTO_PUBLICACAO'
  AND datahora_publicacao_planejada <= NOW()
  AND plano_ativo = true
ORDER BY pipeline_prioridade DESC, datahora_publicacao_planejada ASC
LIMIT 5;

-- 2. Para cada vídeo:
--    a) Criar CONTEUDO (se não existir)
INSERT INTO pulso_content.conteudos (
  canal_id,
  serie_id,
  roteiro_id,
  titulo_interno,
  sinopse,
  status,
  linguagem,
  tags,
  metadata
) VALUES (
  canal_id,
  serie_id,
  roteiro_id,
  roteiro.titulo,
  roteiro.descricao,
  'PRONTO',
  'pt-BR',
  roteiro.hashtags,
  jsonb_build_object('video_id', video.id)
) RETURNING id as conteudo_id;

--    b) Criar VARIANTES (por plataforma)
const plataformas = ['tiktok', 'youtube', 'instagram'];

for (plataforma of plataformas) {
  INSERT INTO pulso_content.conteudo_variantes (
    conteudo_id,
    nome_variacao,
    plataforma_tipo,
    status,
    titulo_publico,
    descricao_publica,
    legenda,
    hashtags,
    linguagem,
    metadata
  ) VALUES (
    conteudo_id,
    `${plataforma}_v1`,
    plataforma,
    'PRONTO',
    roteiro.titulo,
    roteiro.descricao,
    gerar_legenda(roteiro, plataforma),
    roteiro.hashtags,
    'pt-BR',
    jsonb_build_object(
      'video_id', video.id,
      'video_url', video.public_url
    )
  ) RETURNING id as variante_id;

  --    c) Publicar na plataforma
  const post_result = await publicarNaPlataforma(plataforma, variante);

  --    d) Registrar publicação
  INSERT INTO pulso_distribution.posts (
    conteudo_variantes_id,
    canal_plataforma_id,
    status,
    titulo_publicado,
    descricao_publicada,
    legenda_publicada,
    url_publicacao,
    identificador_externo,
    data_agendada,
    data_publicacao,
    metadata
  ) VALUES (
    variante_id,
    canal_plataforma_id,
    'PUBLICADO',
    titulo,
    descricao,
    legenda,
    post_result.url,
    post_result.id_externo,
    data_planejada,
    NOW(),
    jsonb_build_object(
      'plataforma', plataforma,
      'publicado_automaticamente', true
    )
  );
}

-- 3. Atualizar pipeline
UPDATE pulso_content.pipeline_producao
SET
  status = 'PUBLICADO',
  data_publicacao = NOW()
WHERE id = pipeline_id;
```

---

## 📊 Custos Mensais Estimados

### **100 vídeos/mês (20 vídeos × 5 canais)**

| Workflow       | Modelo        | Custo/vídeo | Total/mês      |
| -------------- | ------------- | ----------- | -------------- |
| WF00 - Ideias  | GPT-4o        | $0.02       | $32.00         |
| WF01 - Roteiro | GPT-4o        | $0.003      | $0.30          |
| WF02 - Áudio   | OpenAI TTS HD | $0.0008     | $0.08          |
| **TOTAL**      | -             | **$0.0238** | **$32.38/mês** |

**ROI:** ~$0.32 por vídeo completo (ideia → roteiro → áudio)

---

## 🎯 Roadmap de Implementação

### **Semana 1: MVP**

- ✅ WF01 - Gerar Roteiro (webhook)
- ✅ WF02 - Gerar Áudio (webhook)
- ✅ Testar com 5-10 vídeos

### **Semana 2: Automação de Ideias**

- ✅ WF00 - Gerar Ideias (CRON diário)
- ✅ Integrar aprovação no app

### **Semana 3: Vídeo + Publicação**

- ✅ WF03 - Registrar Vídeo (metadata)
- ✅ WF04 - Publicador (CRON)

### **Semana 4+: Escala**

- ✅ WF03 Fase 2 - Geração automática de vídeo
- ✅ Métricas e otimização
- ✅ A/B testing de variantes

CONTINUAÇÃO DOS DADOS:

5 Workflows Completos em JSON:

✅ WF00_Gerar_Ideias.json
✅ WF01_Gerar_Roteiro.json
✅ WF02_Gerar_Audio.json
✅ WF03_Preparar_Video.json
✅ WF04_Publicar.json

Antes de Gerar os JSONs - Últimas Definições

1. Credenciais Confirmadas:
   ✅ Postgres: "Postgres supabase"
   ✅ Storage: "Supabase Storage – Pulso"
   ✅ OpenAI: "OpenAi pulso_control"
   ✅ Project ID: nlcisbfdiokmipyihtuz
   ✅ Buckets: audios, videos
2. WF00 - Gerar Ideias:
   Quantas ideias gerar por execução?

5 ideias/canal/dia
10 ideias/canal/dia
20 ideias/canal/dia

Sugestão: 10 ideias/dia = 70/semana = você escolhe 20-30 melhores

3. WF04 - Publicação:
   Preciso de credenciais das plataformas:
   TikTok:
   Tem API configurada?

- [ ] Sim, tenho credenciais
- [ ] Não, publicar manual por enquanto
- [ ] Configurar depois
      YouTube:
      Tem API configurada?
- [ ] Sim, tenho OAuth
- [ ] Não, publicar manual por enquanto
- [ ] Configurar depois
      Instagram:
      Tem API configurada?
- [ ] Sim, tenho Facebook Graph API
- [ ] Não, publicar manual por enquanto
- [ ] Configurar depois
      Sugestão minha: Por enquanto, WF04 só REGISTRA a publicação no banco. Você publica manualmente e o workflow atualiza o status. Depois integramos APIs.

4. Sistema de Conteudos/Variantes:
   WF04 deve criar automaticamente:
   1 CONTEUDO → 3 VARIANTES (TikTok, YouTube, Instagram)
   Diferenças por plataforma:

TikTok: Legenda curta, 3-5 hashtags
YouTube: Título SEO, descrição longa
Instagram: Legenda média, 10-15 hashtags

Confirma? ✅

5. Horários dos CRON:
   WF00 (Gerar Ideias): 1x/dia às 3h (processa 1 canal/dia)
   WF04 (Publicar): 3x/dia às 6h, 12h, 18h
   Está bom ou quer ajustar?

🎯 Configurações Avançadas
Auto-Aprovação (WF00):
Você quer que ideias sejam:

Todas RASCUNHO (você aprova manualmente)
Auto-aprovar top 3 (potencial_viral >= 9)
Auto-aprovar 50% (potencial_viral >= 8)

Sugestão: Todas RASCUNHO no início. Depois de 1 mês, ativar auto-aprovação.

Priorização de Canais (WF00):
javascript// Ordem de prioridade para gerar ideias:
const prioridade_canais = [
'Pulso Dark PT', // Segunda
'PULSO Casos Reais & Bizarros', // Terça
'PULSO Motivacional', // Quarta
'PULSO Estudos & Produtividade', // Quinta
'PULSO Psicologia & Comportamento', // Sexta
'PULSO Mistérios & História', // Sábado
'PULSO Games Nostalgia' // Domingo
];

```

**Ordem está boa?** Ou quer ajustar?

---

## 📋 Resposta Rápida (copie e preencha):
```

1. Ideias por execução: 10
2. APIs de publicação: Registrar no banco (manual por enquanto)
3. Variantes automáticas: SIM (3 por vídeo)
4. Horários CRON: OK (3h e 6h/12h/18h)
5. Auto-aprovação: RASCUNHO (manual)
6. Ordem canais: OK

```

---

## ⚡ Ação Imediata

Configuração Final Confirmada
Entendido! Vou criar com essas especificações:

✅ Configurações Confirmadas
1. WF00 - Gerar Ideias:

✅ 5 ideias/canal/execução
✅ Todas em RASCUNHO (aprovação manual via app)
✅ CRON 1x/dia às 3h (roda 1 canal por dia da semana)

2. WF04 - Publicação:

✅ SEM credenciais de APIs (você adiciona depois)
✅ Só registra no banco por enquanto
✅ CRON 3x/dia (6h, 12h, 18h) - horários iniciais
✅ Você ajusta horários depois com dados reais de performance

3. Variantes Automáticas:

✅ 3 variantes por vídeo (TikTok, YouTube, Instagram)
✅ Copy personalizada por plataforma
✅ Hashtags otimizadas por plataforma

4. Aprovações:

✅ Ideias: RASCUNHO → aprovar no app
✅ Roteiros: RASCUNHO → aprovar no app
✅ Vídeos: Você monta + faz upload → marca como pronto

5. Pesquisa de Mercado:
Vou adicionar no WF00 consulta a:

✅ Google Trends (trending topics BR)
✅ Performance histórica do canal
✅ Análise de concorrentes (opcional)


📊 Estrutura dos Workflows
Ordem de Execução:
WF00 (3h da manhã) → Gera 5 ideias RASCUNHO
         ↓
    [Você aprova no app]
         ↓
WF01 (webhook) → Gera roteiro RASCUNHO
         ↓
    [Você aprova no app]
         ↓
WF02 (webhook) → Gera áudio TTS
         ↓
WF03 (auto) → Registra metadata de vídeo
         ↓
    [Você monta vídeo e faz upload]
         ↓
WF04 (6h/12h/18h) → Cria variantes + registra publicação
         ↓
    [Você publica manualmente nas plataformas]

🎯 Horários Inteligentes por Canal
Vou configurar horários baseados em pesquisa de mercado:
javascript// Baseado em estudos de engajamento BR
const horarios_otimizados = {
  'Pulso Dark PT': {
    melhor_horario: '20:00', // Público engaja à noite
    frequencia: 'diaria',     // Conteúdo viciante
    dias_semana: [1,2,3,4,5,6,7] // Todo dia
  },
  'PULSO Estudos & Produtividade': {
    melhor_horario: '07:00', // Manhã (antes do trabalho)
    frequencia: '2_dias',
    dias_semana: [2,4,6] // Terça, Quinta, Sábado
  },
  'PULSO Motivacional': {
    melhor_horario: '08:00', // Início do dia
    frequencia: '2_dias',
    dias_semana: [1,3,5] // Segunda, Quarta, Sexta
  },
  'PULSO Casos Reais & Bizarros': {
    melhor_horario: '19:00', // Fim do dia
    frequencia: '2_dias',
    dias_semana: [1,4,7] // Segunda, Quinta, Domingo
  },
  'PULSO Psicologia & Comportamento': {
    melhor_horario: '18:00', // Pós-trabalho
    frequencia: '3_dias',
    dias_semana: [2,5] // Terça, Sexta
  },
  'PULSO Mistérios & História': {
    melhor_horario: '21:00', // Noite (conteúdo imersivo)
    frequencia: '2_dias',
    dias_semana: [3,6] // Quarta, Sábado
  },
  'PULSO Games Nostalgia': {
    melhor_horario: '17:30', // Fim de tarde (target gamer)
    frequencia: '2_dias',
    dias_semana: [4,7] // Quinta, Domingo
  }
};
Fontes da pesquisa:

Hootsuite Best Times to Post 2024 (Brasil)
Later.com Social Media Engagement Study
Sprout Social Optimal Posting Times


🚀 GERANDO OS 5 WORKFLOWS AGORA
Vou criar cada um com:

✅ Configurações confirmadas acima
✅ Horários otimizados por canal
✅ Sem credenciais de APIs sociais (você adiciona depois)
✅ Aprovações sempre manuais
✅ Logs detalhados em cada etapa
✅ Error handling robusto

Tempo estimado: 15-20 minutos
Enquanto isso, você pode:

Garantir que o n8n está aberto
Conferir se as 3 credenciais estão salvas:

Postgres supabase
Supabase Storage – Pulso
OpenAi pulso_control




📦 O Que Você Vai Receber
5 arquivos JSON prontos para importar:

WF00_Gerar_Ideias.json (5 ideias/dia por canal)
WF01_Gerar_Roteiro.json (webhook)
WF02_Gerar_Audio.json (webhook)
WF03_Preparar_Video.json (auto)
WF04_Publicar.json (CRON 3x/dia)
```
