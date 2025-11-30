# 🚀 Guia de Importação - 5 Workflows Completos n8n

## 📦 Arquivos Criados

✅ **WF00_Gerar_Ideias.json** (14.5 KB)  
✅ **WF01_Gerar_Roteiro.json** (14.6 KB)  
✅ **WF02_Gerar_Audio.json** (15.1 KB)  
✅ **WF03_Preparar_Video.json** (11.0 KB)  
✅ **WF04_Publicar.json** (18.9 KB)

**Total:** 74 KB de automação completa

---

## 🎯 Visão Geral dos Workflows

```
WF00 (CRON 3h diário)
  └─> Gera 5 ideias/dia por canal
       └─> Status: RASCUNHO (você aprova no app)

WF01 (Webhook)
  └─> Trigger: Ideia aprovada
       └─> Gera roteiro com GPT-4o
            └─> Status: RASCUNHO (você aprova no app)

WF02 (Webhook)
  └─> Trigger: Roteiro aprovado
       └─> Gera áudio TTS (OpenAI)
            └─> Upload Supabase Storage
                 └─> Status: OK

WF03 (CRON 30min)
  └─> Busca áudios sem vídeo
       └─> Cria metadata + storyboard
            └─> Status: AGUARDANDO_MONTAGEM (você monta e faz upload)

WF04 (CRON 6h, 12h, 18h)
  └─> Busca vídeos prontos
       └─> Cria CONTEUDO + 3 VARIANTES (TikTok, YouTube, Instagram)
            └─> Registra publicação (PENDENTE - você publica manualmente)
```

---

## ⚙️ PRÉ-REQUISITOS

### 1. Credenciais no n8n (OBRIGATÓRIO)

Antes de importar, você DEVE ter estas 3 credenciais configuradas:

#### ✅ Postgres supabase

- **Nome exato:** `Postgres supabase`
- **Type:** PostgreSQL
- **Host:** `aws-0-sa-east-1.pooler.supabase.com`
- **Database:** `postgres`
- **User:** `postgres.nlcisbfdiokmipyihtuz`
- **Password:** [sua senha do Supabase]
- **Port:** `6543`
- **SSL:** `require`

#### ✅ Supabase Storage – Pulso

- **Nome exato:** `Supabase Storage – Pulso`
- **Type:** Supabase
- **Host:** `https://nlcisbfdiokmipyihtuz.supabase.co`
- **Service Role Key:** [sua chave service_role do Supabase]

#### ✅ OpenAi pulso_control

- **Nome exato:** `OpenAi pulso_control`
- **Type:** OpenAI
- **API Key:** [sua chave da OpenAI]
- **Organization ID:** (opcional)

---

## 📥 IMPORTAÇÃO PASSO A PASSO

### Passo 1: Abrir n8n

```bash
# Se ainda não está rodando
npm run n8n
# ou
npx n8n
```

Abra: `http://localhost:5678`

---

### Passo 2: Importar Workflows (Ordem IMPORTANTE)

Importe nesta ordem exata:

#### 1️⃣ WF00_Gerar_Ideias.json

1. **Workflows** (menu lateral) → **Add workflow** → **Import from File**
2. Selecione: `WF00_Gerar_Ideias.json`
3. ⚠️ **ERRO ESPERADO:** "Credential not found"
4. Clique em cada node com erro e selecione a credencial correta:
   - `Buscar Canal do Dia` → Selecione **Postgres supabase**
   - `GPT-4o - Gerar Ideias` → Selecione **OpenAi pulso_control**
   - `Salvar Ideias` → Selecione **Postgres supabase**
   - `Registrar Log` → Selecione **Postgres supabase**
5. **Save** (Ctrl+S)
6. **Ativar workflow** (toggle no canto superior direito)

---

#### 2️⃣ WF01_Gerar_Roteiro.json

1. **Import from File** → `WF01_Gerar_Roteiro.json`
2. Configurar credenciais em:
   - `Buscar Ideia Completa` → **Postgres supabase**
   - `GPT-4o - Gerar Roteiro` → **OpenAi pulso_control**
   - `Salvar Roteiro` → **Postgres supabase**
   - `Log Sucesso` → **Postgres supabase**
3. **Copiar URL do Webhook:**
   - Clique no node `Webhook Ideia Aprovada`
   - Copie a URL: `https://seu-n8n.com/webhook/ideia-aprovada`
   - **Anote para configurar no app depois**
4. **Save** e **Activate**

---

#### 3️⃣ WF02_Gerar_Audio.json

1. **Import from File** → `WF02_Gerar_Audio.json`
2. Configurar credenciais em:
   - `Buscar Roteiro Aprovado` → **Postgres supabase**
   - `OpenAI TTS` → **OpenAi pulso_control**
   - `Upload Supabase Storage` → **Supabase Storage – Pulso**
   - `Salvar Áudio no DB` → **Postgres supabase**
   - `Log Sucesso` → **Postgres supabase**
3. **Copiar URL do Webhook:**
   - Node `Webhook Roteiro Aprovado`
   - URL: `https://seu-n8n.com/webhook/roteiro-aprovado`
   - **Anote para configurar no app**
4. **Save** e **Activate**

---

#### 4️⃣ WF03_Preparar_Video.json

1. **Import from File** → `WF03_Preparar_Video.json`
2. Configurar credenciais em:
   - `Buscar Áudios Sem Vídeo` → **Postgres supabase**
   - `Registrar Vídeo (Metadata)` → **Postgres supabase**
   - `Registrar Log` → **Postgres supabase**
3. **Save** e **Activate**

---

#### 5️⃣ WF04_Publicar.json

1. **Import from File** → `WF04_Publicar.json`
2. Configurar credenciais em TODOS os nodes Postgres:
   - `Buscar Vídeos Prontos` → **Postgres supabase**
   - `Criar Conteúdo` → **Postgres supabase**
   - `Salvar Variante` → **Postgres supabase**
   - `Buscar Credenciais Plataforma` → **Postgres supabase**
   - `Registrar Publicação (Manual)` → **Postgres supabase**
   - `Atualizar Pipeline` → **Postgres supabase**
   - `Registrar Log Workflow` → **Postgres supabase**
3. **Save** e **Activate**

---

## ✅ VERIFICAÇÃO PÓS-IMPORTAÇÃO

### Checklist Rápido

```bash
# 1. Todos os 5 workflows importados?
[ ] WF00_Gerar_Ideias - ATIVO
[ ] WF01_Gerar_Roteiro - ATIVO
[ ] WF02_Gerar_Audio - ATIVO
[ ] WF03_Preparar_Video - ATIVO
[ ] WF04_Publicar - ATIVO

# 2. Todas as credenciais configuradas?
[ ] Postgres supabase (3 credenciais usadas)
[ ] OpenAi pulso_control (3 workflows)
[ ] Supabase Storage – Pulso (1 workflow)

# 3. URLs de webhook anotadas?
[ ] /webhook/ideia-aprovada (WF01)
[ ] /webhook/roteiro-aprovado (WF02)
```

---

## 🧪 TESTES INICIAIS

### Teste 1: WF00 - Gerar Ideias (Manual)

```bash
# No n8n, abra WF00_Gerar_Ideias
# Clique em "Execute Workflow"
# Aguarde ~30 segundos
# Resultado esperado: 5 ideias criadas com status RASCUNHO
```

**Verificar no banco:**

```sql
SELECT id, titulo, status, metadata->>'potencial_viral' as viral
FROM ideias
WHERE metadata->>'gerado_por_ia' = 'true'
ORDER BY created_at DESC
LIMIT 5;
```

---

### Teste 2: WF01 - Gerar Roteiro (Webhook)

```bash
# No app PULSO Control:
# 1. Vá em Ideias
# 2. Aprove uma ideia gerada pelo WF00
# 3. O webhook será disparado automaticamente
# 4. Aguarde ~20 segundos
# 5. Verifique em Roteiros se foi criado
```

**Testar via cURL:**

```bash
curl -X POST https://seu-n8n.com/webhook/ideia-aprovada \
  -H "Content-Type: application/json" \
  -d '{"ideia_id": "UUID_DA_IDEIA_APROVADA"}'
```

---

### Teste 3: WF02 - Gerar Áudio (Webhook)

```bash
# No app PULSO Control:
# 1. Vá em Roteiros
# 2. Aprove um roteiro gerado pelo WF01
# 3. O webhook será disparado
# 4. Aguarde ~30-60 segundos (gera áudio + upload)
# 5. Verifique se apareceu URL em Áudios
```

**Testar via cURL:**

```bash
curl -X POST https://seu-n8n.com/webhook/roteiro-aprovado \
  -H "Content-Type: application/json" \
  -d '{"roteiro_id": "UUID_DO_ROTEIRO_APROVADO"}'
```

---

### Teste 4: WF03 - Preparar Vídeo (CRON)

```bash
# Aguardar próxima execução (a cada 30 minutos)
# OU executar manualmente no n8n
# Resultado: Cria metadata de vídeo no banco
```

**Verificar:**

```sql
SELECT id, status, metadata->'storyboard' as storyboard
FROM pulso_content.videos
WHERE status = 'AGUARDANDO_MONTAGEM'
ORDER BY created_at DESC
LIMIT 3;
```

---

### Teste 5: WF04 - Publicar (CRON)

```bash
# Pré-requisito:
# 1. Ter um vídeo com status = 'OK' no banco
# 2. Aguardar próxima execução (6h, 12h ou 18h)
# OU executar manualmente

# Resultado esperado:
# - 1 CONTEUDO criado
# - 3 VARIANTES criadas (TikTok, YouTube, Instagram)
# - 3 POSTS com status PENDENTE
```

---

## 🔧 CONFIGURAÇÃO NO APP

Após importar todos os workflows, configure as URLs dos webhooks no app:

### Arquivo: `.env.local`

```bash
# Adicionar estas variáveis:
NEXT_PUBLIC_N8N_WEBHOOK_IDEIA_APROVADA=https://seu-n8n.com/webhook/ideia-aprovada
NEXT_PUBLIC_N8N_WEBHOOK_ROTEIRO_APROVADO=https://seu-n8n.com/webhook/roteiro-aprovado
```

### Arquivo: `lib/api/n8n.ts`

```typescript
export const n8nWebhooks = {
  ideiaAprovada: process.env.NEXT_PUBLIC_N8N_WEBHOOK_IDEIA_APROVADA,
  roteiroAprovado: process.env.NEXT_PUBLIC_N8N_WEBHOOK_ROTEIRO_APROVADO,
};
```

---

## 📊 MONITORAMENTO

### Logs de Execução

Todos os workflows salvam logs na tabela `pulso_content.logs_workflows`:

```sql
SELECT
  workflow_name,
  status,
  detalhes,
  created_at
FROM pulso_content.logs_workflows
ORDER BY created_at DESC
LIMIT 20;
```

---

### Métricas de Custo

```sql
-- Custo total de geração de conteúdo
SELECT
  DATE(created_at) as data,
  COUNT(*) as total_execucoes,
  SUM((metadata->>'custo_geracao')::numeric) as custo_total
FROM ideias
WHERE metadata->>'gerado_por_ia' = 'true'
GROUP BY DATE(created_at)
ORDER BY data DESC;
```

---

## 🚨 TROUBLESHOOTING

### Erro: "Credential not found"

**Solução:** Certifique-se que os nomes das credenciais são EXATAMENTE:

- `Postgres supabase`
- `OpenAi pulso_control`
- `Supabase Storage – Pulso`

---

### Erro: "relation does not exist"

**Solução:** Execute os SQLs pendentes no Supabase:

```sql
-- Criar view n8n_roteiro_completo
-- Ver arquivo: supabase/views/n8n_roteiro_completo.sql

-- Criar tabela de logs
CREATE TABLE IF NOT EXISTS pulso_content.logs_workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_name text NOT NULL,
  execution_id text,
  status text,
  ideia_id uuid,
  roteiro_id uuid,
  pipeline_id uuid,
  detalhes jsonb,
  created_at timestamptz DEFAULT NOW()
);
```

---

### Erro: "permission denied for table audios"

**Solução:** Adicionar RLS policy:

```sql
GRANT SELECT ON pulso_content.audios TO anon, authenticated;
```

---

## 📈 PRÓXIMOS PASSOS

1. ✅ **Testar WF00** manualmente (gerar ideias)
2. ✅ **Aprovar 1 ideia** no app
3. ✅ **Verificar se WF01** gerou roteiro
4. ✅ **Aprovar roteiro** no app
5. ✅ **Verificar se WF02** gerou áudio
6. ✅ **Aguardar WF03** criar metadata de vídeo
7. ✅ **Montar vídeo** manualmente no CapCut
8. ✅ **Fazer upload** do vídeo no Supabase Storage
9. ✅ **Atualizar status** do vídeo para 'OK'
10. ✅ **Aguardar WF04** criar variantes e posts

---

## 💰 CUSTOS ESTIMADOS

### Por Vídeo Completo:

- **WF00:** $0.02 (ideia)
- **WF01:** $0.003 (roteiro)
- **WF02:** $0.0008 (áudio TTS)
- **Total:** ~$0.024 por vídeo

### 100 Vídeos/Mês:

- **Total:** ~$2.40/mês em IA
- **ROI:** Economia de ~40 horas de trabalho manual

---

## 📞 SUPORTE

Se encontrar problemas:

1. Verificar logs no n8n (Executions)
2. Verificar logs no banco (`logs_workflows`)
3. Checar credenciais estão configuradas
4. Testar webhooks via cURL

---

**✅ Importação completa!** Agora você tem 5 workflows automatizando todo o pipeline de produção de conteúdo do PULSO.
