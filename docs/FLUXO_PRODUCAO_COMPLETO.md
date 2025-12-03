# 🎯 Fluxo Completo de Produção - PULSO

## 📊 Visão Geral

O sistema PULSO funciona de forma **100% automatizada via n8n workflows**. Não há upload manual de assets - tudo é gerado e gerenciado pelos workflows.

---

## 🔄 Pipeline Completo

### 1️⃣ **Criação de Ideia** (Manual no App)
- **Onde:** `/ideias` → Botão "Nova Ideia"
- **Quem:** Usuário no dashboard
- **O que:** Preencher formulário com:
  - Título
  - Descrição
  - Canal
  - Série (opcional)
  - Tags
  - Prioridade
- **Status inicial:** `RASCUNHO`
- **Próximo:** Aprovar a ideia

---

### 2️⃣ **Aprovação de Ideia** (Manual no App)
- **Onde:** `/ideias/[id]` → Botão "Aprovar Ideia"
- **O que acontece:**
  - Status: `RASCUNHO` → `APROVADA`
  - Insere entrada no `pipeline_producao` (status: `AGUARDANDO_ROTEIRO`)
- **Trigger:** WF01 detecta nova ideia aprovada
- **Próximo:** Workflow gera roteiro automaticamente

---

### 3️⃣ **WF01 - Gerar Roteiro** (Automático - Webhook)
- **Trigger:** Webhook `POST /webhook/wf01-gerar-roteiro`
- **Parâmetros:** `ideia_id`
- **Processo:**
  1. Busca dados da ideia no Supabase
  2. Busca contexto do canal e série
  3. Monta prompt estruturado para OpenAI GPT-4
  4. Gera roteiro em Markdown (4 seções: GANCHO, DESENVOLVIMENTO, CLÍMAX, CTA)
  5. Valida estrutura e qualidade
  6. Insere na tabela `pulso_content.roteiros`
  7. Atualiza pipeline: `AGUARDANDO_ROTEIRO` → `ROTEIRO_PRONTO`
- **Output:** Roteiro em `RASCUNHO`
- **Tabelas afetadas:**
  - `pulso_content.roteiros` (INSERT)
  - `pulso_content.pipeline_producao` (UPDATE roteiro_id, status)
  - `pulso_content.logs_workflows` (INSERT log)
- **Próximo:** Revisar e aprovar roteiro

---

### 4️⃣ **Aprovação de Roteiro** (Manual no App)
- **Onde:** `/roteiros/[id]` → Botão "Aprovar"
- **O que acontece:**
  - Status: `RASCUNHO` → `APROVADO`
  - Pipeline não muda (ainda não tem áudio)
- **Trigger:** WF02 detecta roteiro aprovado sem áudio
- **Próximo:** Workflow gera áudio automaticamente

---

### 5️⃣ **WF02 - Gerar Áudio TTS** (Automático - CRON 10min)
- **Trigger:** Schedule (a cada 10 minutos)
- **Query de Busca:**
  ```sql
  SELECT r.* FROM roteiros r
  LEFT JOIN audios a ON a.roteiro_id = r.id
  WHERE r.status = 'APROVADO'
  AND a.id IS NULL
  LIMIT 5
  ```
- **Processo:**
  1. **Preparação:**
     - Limpa markdown (remove headers, bold, links, etc.)
     - Identifica idioma/voz (`pt-BR` → `alloy`, `en-US` → `nova`)
     - Chunking se > 4000 caracteres
  
  2. **Geração (Loop em Chunks):**
     - OpenAI TTS-1-HD API
     - Modelo: `tts-1-hd`
     - Voice: configurável por idioma
     - Speed: 1.0
     - Format: MP3
  
  3. **Storage:**
     - Upload para Supabase Storage: `audios/{roteiro_id}.mp3`
     - Gera URL pública
  
  4. **Banco de Dados:**
     - INSERT em `pulso_content.audios`
     - UPDATE pipeline: `ROTEIRO_PRONTO` → `AUDIO_PRONTO`
     - UPDATE `pipeline.audio_id`
  
  5. **Metadata salva:**
     ```json
     {
       "provedor": "openai",
       "modelo": "tts-1-hd",
       "voice": "alloy",
       "speed": 1.0,
       "chunk_index": 1,
       "total_chunks": 1,
       "precisa_merge": false
     }
     ```

- **Output:** Áudio MP3 disponível
- **Tabelas afetadas:**
  - `pulso_content.audios` (INSERT)
  - `pulso_assets.assets` (INSERT via view - futuro)
  - `pulso_content.pipeline_producao` (UPDATE audio_id, status)
  - `pulso_content.logs_workflows` (INSERT log)
- **Próximo:** Gerar vídeo (WF03 - futuro)

---

### 6️⃣ **Visualização de Assets** (Manual no App)
- **Onde:** `/assets`
- **O que mostra:**
  - Grid de todos os assets (áudios, vídeos, imagens)
  - Filtros por tipo
  - Estatísticas
- **Dados de:** Views `public.assets` e `vw_pulso_pipeline_com_assets`
- **Ações:** 
  - ✅ Visualizar
  - ✅ Ouvir/Download
  - ❌ Upload (desabilitado - assets vêm do n8n)
  - ❌ Deletar (gerenciado via workflow)

---

## 📁 Estrutura de Dados

### Tabela: `pulso_content.audios`
```sql
id                UUID PRIMARY KEY
roteiro_id        UUID → pulso_content.roteiros
canal_id          UUID → pulso_core.canais
ideia_id          UUID → pulso_content.ideias
storage_path      TEXT (ex: 'audios/uuid.mp3')
public_url        TEXT (URL pública do Supabase Storage)
duracao_segundos  NUMERIC
linguagem         TEXT
formato           TEXT ('audio/mpeg')
tipo              TEXT ('AUDIO_TTS', 'AUDIO_VOICE_CLONE')
status            TEXT ('OK', 'AGUARDANDO_MERGE', 'ERRO')
metadata          JSONB
created_at        TIMESTAMPTZ
updated_at        TIMESTAMPTZ
```

### Tabela: `pulso_content.pipeline_producao`
```sql
id                  UUID PRIMARY KEY
ideia_id            UUID → pulso_content.ideias
roteiro_id          UUID → pulso_content.roteiros (NULL até WF01)
audio_id            UUID → pulso_content.audios (NULL até WF02)
video_id            UUID → futuro
status              TEXT (AGUARDANDO_ROTEIRO → ROTEIRO_PRONTO → AUDIO_PRONTO → ...)
prioridade          INTEGER
data_prevista       DATE
metadata            JSONB
created_at          TIMESTAMPTZ
updated_at          TIMESTAMPTZ
```

### View: `public.assets`
```sql
-- Aponta para pulso_assets.assets
-- Mostra todos os assets do sistema
SELECT id, tipo, nome, descricao, caminho_storage, ...
FROM pulso_assets.assets
```

---

## 🎛️ Configuração de Workflows (n8n)

### WF01 - Gerar Roteiro
- **Tipo:** Webhook (manual trigger)
- **URL:** `POST {N8N_URL}/webhook/wf01-gerar-roteiro`
- **Payload:** `{ "ideia_id": "uuid" }`
- **Credenciais:**
  - Supabase (Postgres)
  - OpenAI GPT-4

### WF02 - Gerar Áudio
- **Tipo:** Schedule (CRON)
- **Frequência:** A cada 10 minutos
- **Query:** Busca roteiros APROVADO sem áudio
- **Batch:** Processa até 5 roteiros por execução
- **Credenciais:**
  - Supabase (Postgres + Storage)
  - OpenAI TTS

### WF03 - Preparar Vídeo (Futuro)
- **Tipo:** CRON
- **Trigger:** Detecta áudios OK sem vídeo
- **Processo:** Gera storyboard e metadados para montagem

---

## 🔍 Monitoramento

### Dashboard Principal (`/`)
- Total de ideias, roteiros, áudios
- Status de workflows
- Erros recentes

### Logs de Workflows (`pulso_content.logs_workflows`)
```sql
SELECT 
  workflow_id,
  status,
  duracao_ms,
  metadata->'error' as erro
FROM pulso_content.logs_workflows
WHERE status = 'erro'
ORDER BY started_at DESC
```

### Health Check
- WF01: Ideias aprovadas sem roteiro > 10 → ALERTA
- WF02: Roteiros aprovados sem áudio > 5 → ALERTA
- Storage: Uso > 80% → ALERTA

---

## 🚨 Troubleshooting

### Roteiro não foi gerado após aprovar ideia
1. Verificar se webhook WF01 está ativo
2. Checar logs em `logs_workflows` para erros
3. Verificar credenciais OpenAI
4. Re-executar manualmente: `POST /webhook/wf01-gerar-roteiro`

### Áudio não foi gerado após aprovar roteiro
1. WF02 roda a cada 10min - aguardar
2. Verificar status do roteiro: deve ser `APROVADO`
3. Verificar se já existe áudio: `SELECT * FROM audios WHERE roteiro_id = 'uuid'`
4. Checar logs do WF02
5. Verificar credenciais OpenAI TTS
6. Verificar quota da API OpenAI

### Áudio com status AGUARDANDO_MERGE
- Roteiro muito longo, foi dividido em chunks
- WF02.1 (Merge Audio) ainda não implementado
- Solução temporária: Aceitar chunks individuais ou regenerar roteiro mais curto

---

## 📝 Checklist de Produção

- [ ] 1. Criar ideia no app
- [ ] 2. Aprovar ideia → Trigger WF01
- [ ] 3. Aguardar roteiro ser gerado (webhook)
- [ ] 4. Revisar roteiro em `/roteiros/[id]`
- [ ] 5. Editar se necessário
- [ ] 6. Aprovar roteiro
- [ ] 7. Aguardar áudio (máx 10min - WF02 CRON)
- [ ] 8. Verificar áudio em `/roteiros/[id]` ou `/assets`
- [ ] 9. Testar reprodução
- [ ] 10. [Futuro] Gerar vídeo via WF03

---

## 🎯 Status Atual do Sistema

### ✅ Funcionalidades Implementadas
- CRUD completo de ideias
- Aprovação de ideias
- WF01 - Geração de roteiros via GPT-4
- CRUD completo de roteiros
- Aprovação de roteiros
- WF02 - Geração de áudios via TTS
- Storage automático no Supabase
- Visualização de assets (readonly)
- Dashboard com métricas
- Pipeline de produção kanban

### ⏳ Próximas Implementações
- WF02.1 - Merge de chunks de áudio
- WF03 - Geração de vídeos
- WF04 - Publicação automática
- WF05 - Coleta de métricas
- Sistema de variantes (multi-plataforma)
- Preview de vídeos no dashboard

### 🔧 Configurações Necessárias

#### Supabase Storage
```bash
# Bucket: audios (public)
gsutil cors set cors.json gs://pulso-audios
```

#### n8n Environment Variables
```env
DATABASE_URL=postgresql://...
SUPABASE_URL=https://nlcisbfdiokmipyihtuz.supabase.co
SUPABASE_SERVICE_KEY=eyJh...
OPENAI_API_KEY=sk-...
N8N_WEBHOOK_BASE_URL=https://n8n.pulso.com
```

---

**Última atualização:** 03/12/2025
**Versão:** 2.0
**Autor:** Sistema PULSO
