# 🗺️ MAPA COMPLETO PULSO - Como Tudo Se Conecta

## 🎯 O Problema que Você Está Enfrentando

Você tem **3 visões diferentes** do mesmo projeto:

1. **Blueprint de CONTEÚDO** - A parte criativa (o que fazer, calendário, formatos)
2. **Blueprint TÉCNICO** - A parte de automação (como fazer, banco de dados, n8n)
3. **Blueprints da pasta docs/** - A documentação completa que criamos

**E agora está perdido tentando unir tudo.**

---

## ✅ A VERDADE: Tudo Já Está Conectado!

Vou te mostrar como as **3 visões** são **a mesma coisa** vista de ângulos diferentes:

```
┌─────────────────────────────────────────────────────────────┐
│                    PULSO = 3 CAMADAS                         │
└─────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ CAMADA 1: CONTEÚDO (O QUÊ FAZER)                           │
│ Blueprint de CONTEÚDO                                       │
│                                                             │
│ - 5 Formatos de vídeo (curiosidade, psicologia, etc)       │
│ - Calendário 30 dias                                        │
│ - Templates de roteiro                                      │
│ - Identidade visual                                         │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌────────────────────────────────────────────────────────────┐
│ CAMADA 2: AUTOMAÇÃO (COMO FAZER)                           │
│ Blueprint TÉCNICO                                           │
│                                                             │
│ - Supabase (banco de dados)                                │
│ - n8n (5 workflows)                                         │
│ - APIs (YouTube, TikTok, IA)                               │
│ - Storage (vídeos, áudios)                                  │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌────────────────────────────────────────────────────────────┐
│ CAMADA 3: CONTROLE (GERENCIAR TUDO)                        │
│ Blueprints docs/50_BLUEPRINTS/                             │
│                                                             │
│ - Dashboard de métricas                                     │
│ - Relatórios semanais                                       │
│ - Análise de performance                                    │
│ - Decisões baseadas em dados                               │
└────────────────────────────────────────────────────────────┘
```

---

## 🔄 Como Funciona na Prática (União das 3 Camadas)

### Exemplo Real: "Vídeo sobre Efeito Placebo"

#### 📝 CAMADA 1 - CONTEÚDO (Blueprint de CONTEÚDO)

**Do calendário dia 1:**

- **Tipo**: Curiosidade
- **Tema**: Psicologia: efeito placebo
- **Formato**: Curiosidade Rápida (15-30s)
- **Template de roteiro**:
  ```
  [GANCHO]: "Você sabia que seu cérebro pode curar dor sem remédio?"
  [FATO]: "O efeito placebo faz 30% das pessoas..."
  [TWIST]: "Funciona mesmo sabendo que é falso!"
  [CTA]: "Segue o PULSO"
  ```

#### ⚙️ CAMADA 2 - AUTOMAÇÃO (Blueprint TÉCNICO)

**No banco de dados (Supabase):**

```sql
-- 1. Ideia criada
INSERT INTO pulso_conteudo.ideias (
  canal_id: 'PULSO Curiosidades',
  tipo: 'curiosidade',
  titulo_bruto: 'Efeito Placebo',
  status: 'nova'
)

-- 2. Workflow 01 roda (n8n)
-- IA gera roteiro completo usando o template

-- 3. Salva roteiro
INSERT INTO pulso_conteudo.roteiros (
  ideia_id: '...',
  roteiro_texto: 'Você sabia que seu cérebro...',
  duracao_estimada_seg: 25,
  status: 'gerado'
)

-- 4. Você aprova
UPDATE roteiros SET status = 'aprovado'

-- 5. Workflow 02 roda
-- TTS gera áudio
INSERT INTO assets_audio (roteiro_id, url_arquivo, duracao_seg: 25)

-- 6. Workflow 03 roda
-- Vídeo gerado
INSERT INTO assets_video (audio_id, url_arquivo)

-- 7. Workflow 04 roda
-- Publica em 4 plataformas
INSERT INTO publicacoes (
  video_id, plataforma: 'YouTube', status: 'publicado'
)
INSERT INTO publicacoes (
  video_id, plataforma: 'TikTok', status: 'publicado'
)
-- ... Instagram, Kwai
```

#### 📊 CAMADA 3 - CONTROLE (Blueprints docs/)

**Workflow 05 coleta métricas:**

```sql
-- Após 24h
INSERT INTO pulso_metrica.metrica_publicacao (
  publicacao_id: '...',
  plataforma: 'YouTube',
  views: 1250,
  likes: 89,
  comentarios: 12
)

-- Análise semanal (WF5)
-- IA identifica: "Vídeos de psicologia têm 2x mais engajamento"
-- Gera recomendação: "Criar mais conteúdo tipo 'psicologia'"
```

---

## 🎯 O QUE FAZER AGORA (Passo a Passo Unificado)

### FASE 0: Preparação (1-2 horas)

#### ✅ 1. Unificar os Blueprints

**Ação**: Mover os 2 blueprints para a pasta correta

```bash
# Mover Blueprint de CONTEÚDO
mv "automation/n8n/templates/Blueprint de CONTEÚDO PULSO.md" \
    "docs/50_BLUEPRINTS/06_CONTEUDO_EDITORIAL.md"

# Mover Blueprint TÉCNICO
mv "automation/n8n/workflows/Blueprint TÉCNICO.md" \
    "docs/50_BLUEPRINTS/07_ARQUITETURA_TECNICA.md"
```

**Resultado**: Tudo na mesma pasta, organizado

#### ✅ 2. Criar Lista de 30 Ideias

**Baseado no calendário do Blueprint de CONTEÚDO**, criar arquivo SQL:

```sql
-- content/ideias/fase1_30dias.sql

-- Dia 1
INSERT INTO pulso_content.ideias (canal_id, serie_id, titulo, descricao, origem, prioridade, status, tags)
VALUES (
  (SELECT id FROM pulso_core.canais WHERE slug='pulso-curiosidades-pt'),
  (SELECT id FROM pulso_core.series WHERE slug='curiosidades-dark'),
  'Efeito Placebo - Cérebro Cura sem Remédio',
  'O efeito placebo faz 30% das pessoas melhorarem sem medicamento real. Funciona até quando a pessoa SABE que é placebo!',
  'MANUAL',
  1,
  'RASCUNHO',
  ARRAY['psicologia', 'cérebro', 'ciência']
);

-- Dia 2
INSERT INTO pulso_content.ideias (...)
VALUES (
  ...,
  'O Soldado que Sumiu da Guerra',
  'Em 1945, soldado desapareceu do campo de batalha. 60 anos depois...',
  ...
);

-- ... continuar com as 30 ideias do calendário
```

---

### FASE 1: Implementação Técnica (Semana 1)

#### DIA 1-2: Setup do Banco

**Já temos:**

- ✅ Schemas criados (6 schemas)
- ✅ Views criadas (11 views)
- ✅ Dados iniciais (canal, séries, plataformas)

**FALTA:**

- [ ] Popular 30 ideias baseadas no calendário editorial

**Ação:**

```sql
-- Executar no Supabase SQL Editor
-- O arquivo que você vai criar: content/ideias/fase1_30dias.sql
```

#### DIA 3-4: Implementar Workflows

**Ordem de implementação:**

1. **Workflow 01** (Ideia → Roteiro)

   - Pega ideias do calendário
   - Usa **templates de roteiro** do Blueprint de CONTEÚDO
   - Gera roteiro completo

2. **Workflow 02** (Roteiro → Áudio)

   - TTS com ElevenLabs ou Google
   - Salva em Supabase Storage

3. **Workflow 04** (Coleta Métricas)
   - Configurar após publicar primeiros vídeos

---

### FASE 2: Produção de Conteúdo (Semana 1)

#### DIA 5: Produzir Primeiro Vídeo

**Seguir o processo unificado:**

1. **CONTEÚDO**: Escolher ideia Dia 1 (Efeito Placebo)
2. **TÉCNICO**: Executar WF1 → gera roteiro usando template
3. **TÉCNICO**: Executar WF2 → gera áudio
4. **MANUAL**: Editar vídeo no CapCut
   - Aplicar **padrão visual** do Blueprint CONTEÚDO:
     - Mascote PULSO no canto
     - Paleta: violeta + azul + amarelo
     - Texto grande e legível
     - CTA final
5. **TÉCNICO**: Upload vídeo para Storage
6. **MANUAL**: Publicar nas 4 plataformas
7. **TÉCNICO**: Registrar publicações no banco
8. **CONTROLE**: Aguardar WF4 coletar métricas

#### DIA 6-7: Repetir Processo

- Dia 6: Vídeo 2 (O Soldado que Sumiu)
- Dia 7: Vídeo 3 (3 Sinais Esgotamento Mental)

---

## 📋 MAPEAMENTO: Onde Está Cada Coisa

### Blueprint de CONTEÚDO → Onde Usar

| Item do Blueprint CONTEÚDO | Onde está no Sistema        | Como usar                     |
| -------------------------- | --------------------------- | ----------------------------- |
| **5 Formatos de vídeo**    | WF1 (n8n)                   | Prompts de IA usam templates  |
| **Calendário 30 dias**     | `pulso_content.ideias`      | Popular banco com SQL         |
| **Templates de roteiro**   | `automation/n8n/templates/` | IA gera roteiro baseado neles |
| **Padrão visual**          | CapCut (manual)             | Aplicar ao editar vídeo       |
| **CTAs**                   | WF3 (publicação)            | Inserir automaticamente       |

### Blueprint TÉCNICO → Já Implementado

| Item do Blueprint TÉCNICO | Status         | Localização                        |
| ------------------------- | -------------- | ---------------------------------- |
| **Schemas**               | ✅ Criado      | `database/sql/schema/001_*.sql`    |
| **Tabelas ideias**        | ✅ Existe      | `pulso_content.ideias`             |
| **Tabelas roteiros**      | ✅ Existe      | `pulso_content.roteiros`           |
| **Tabelas assets**        | ✅ Existe      | `pulso_assets.assets`              |
| **Tabelas publicacoes**   | ✅ Existe      | `pulso_distribution.posts`         |
| **Tabelas métricas**      | ✅ Existe      | `pulso_analytics.metricas_diarias` |
| **5 Workflows n8n**       | ⏳ Documentado | `automation/n8n/docs/`             |

### Blueprints docs/ → Guias de Referência

| Documento                    | Para quê usar              |
| ---------------------------- | -------------------------- |
| `00_ECOSSISTEMA_COMPLETO.md` | Visão geral do projeto     |
| `01_CANAIS_SERIES.md`        | Estratégia de conteúdo     |
| `02_WORKFLOWS_N8N.md`        | Implementar automações     |
| `03_BANCO_DE_DADOS.md`       | Consultar estrutura        |
| `04_FLUXO_CONTEUDO.md`       | Entender processo completo |
| `05_GUIA_FASE_1.md`          | **COMEÇAR POR AQUI!**      |

---

## 🎯 PLANO DE AÇÃO SIMPLIFICADO

### ✅ Você já tem (70% pronto):

1. ✅ Banco de dados estruturado
2. ✅ Schemas e views criados
3. ✅ Canal e séries definidos
4. ✅ Documentação completa
5. ✅ Blueprint de conteúdo (formatos, calendário)
6. ✅ Blueprint técnico (workflows, tabelas)

### 🔴 O que falta (30%):

1. **Popular 30 ideias** do calendário no banco
2. **Implementar WF1** (Ideia → Roteiro) no n8n
3. **Implementar WF2** (Roteiro → Áudio) no n8n
4. **Produzir primeiro vídeo** seguindo padrão visual
5. **Publicar** nas 4 plataformas
6. **Implementar WF4** (Métricas)

---

## 🚀 COMEÇAR AGORA (Próximas 2 Horas)

### Tarefa 1: Criar Arquivo de Ideias (30 min)

Crie: `content/ideias/fase1_30dias.sql`

Pegue o **calendário dos 30 dias** do Blueprint de CONTEÚDO e transforme em SQL:

```sql
-- Modelo
INSERT INTO pulso_content.ideias (
  canal_id,
  serie_id,
  titulo,
  descricao,
  origem,
  prioridade,
  status,
  tags,
  linguagem,
  metadata
) VALUES (
  (SELECT id FROM pulso_core.canais WHERE slug='pulso-curiosidades-pt'),
  (SELECT id FROM pulso_core.series WHERE slug='curiosidades-dark'), -- ou 'misterios-urbanos' ou 'ciencia-estranha'
  'TÍTULO DO DIA X',
  'DESCRIÇÃO DO DIA X',
  'MANUAL',
  1,
  'RASCUNHO',
  ARRAY['tag1', 'tag2'],
  'pt-BR',
  jsonb_build_object(
    'tipo_formato', 'curiosidade_rapida', -- ou 'psicologia', 'storytelling', 'misterio', 'motivacional'
    'dia_calendario', 1,
    'duracao_alvo', 25
  )
);
```

### Tarefa 2: Popular Banco (10 min)

```bash
# Copiar SQL gerado
# Executar no Supabase SQL Editor
```

### Tarefa 3: Ajustar Prompt do WF1 (30 min)

No n8n, node "Prepare Prompt", usar **templates do Blueprint CONTEÚDO**:

```javascript
const ideia = $input.item.json;
const tipo_formato = ideia.metadata.tipo_formato;

let template_roteiro = "";

// Usar templates do Blueprint de CONTEÚDO
if (tipo_formato === "curiosidade_rapida") {
  template_roteiro = `
Você é roteirista especializado em curiosidades para vídeos curtos.

FORMATO: Curiosidade Rápida (15-30s)
TEMA: ${ideia.titulo}
DESCRIÇÃO: ${ideia.descricao}

ESTRUTURA OBRIGATÓRIA:
[GANCHO] (1 frase forte, tipo "Você sabia que...")
[FATO] (Explicar em 2-3 frases simples)
[TWIST] (Algo inesperado)
[CTA] ("Segue o PULSO pra mais")

Escreva o roteiro completo, pronto para narração:
`;
} else if (tipo_formato === "psicologia") {
  template_roteiro = `
FORMATO: Psicologia & Comportamento (20-45s)
...usar template do Blueprint
`;
}
// ... outros formatos

return {
  json: {
    ideia_id: ideia.id,
    prompt: template_roteiro,
  },
};
```

### Tarefa 4: Testar Primeiro Roteiro (30 min)

1. Executar WF1 no n8n
2. Verificar roteiro gerado
3. Aprovar no banco
4. Executar WF2 (áudio)
5. Ouvir áudio gerado

---

## 💡 A CHAVE: Tudo Se Conecta Assim

```
BLUEPRINT CONTEÚDO          BLUEPRINT TÉCNICO           BLUEPRINTS DOCS
(O QUE)                     (COMO)                      (CONTROLE)
     │                           │                            │
     ▼                           ▼                            ▼
Calendário 30 dias ────────► Banco ideias ──────────► Dashboard métricas
Formatos (5 tipos) ────────► Prompts WF1 ──────────► Análise performance
Templates roteiro  ────────► IA gera roteiro ───────► Insights semanais
Padrão visual     ────────► Edição manual ─────────► A/B testing
CTAs              ────────► WF3 publicação ────────► Otimização
```

---

## 🎯 Resumo Final

**Você NÃO está perdido!** Você tem:

- ✅ **O QUE fazer** (Blueprint CONTEÚDO)
- ✅ **COMO fazer** (Blueprint TÉCNICO + docs/)
- ✅ **COMO CONTROLAR** (Workflows 4 e 5)

**Faltava apenas UNIR tudo num fluxo prático.**

**Próxima ação:**
👉 Criar `content/ideias/fase1_30dias.sql` com as 30 ideias do calendário
👉 Popular banco
👉 Testar WF1 com prompt usando templates do Blueprint CONTEÚDO

Tudo vai se conectar quando você **começar pelo primeiro vídeo**.

---

**Quer que eu crie o arquivo SQL com as 30 ideias do calendário agora?**
