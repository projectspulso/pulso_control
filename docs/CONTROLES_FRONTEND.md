# 🎮 Controles Frontend - Automação n8n

## 📋 Resumo

Este documento descreve todos os controles frontend implementados para gerenciar os 5 workflows n8n do PULSO.

---

## 🔘 Botões de Aprovação

### ApproveIdeiaButton

**Localização:** `/ideias/[id]` (quando status = RASCUNHO)

**Função:**

1. Atualiza `pulso_content.ideias.status` → `'APROVADA'`
2. Dispara webhook `POST /webhook/ideia-aprovada` (WF01)
3. Callback `onSuccess()` para atualizar UI

**Props:**

```typescript
{
  ideiaId: string
  onSuccess?: () => void
  className?: string
}
```

**Comportamento:**

- Loading state com spinner
- Alert de sucesso/erro
- Cache invalidation automático (React Query)

---

### ApproveRoteiroButton

**Localização:** `/roteiros/[id]` (quando status = RASCUNHO)

**Função:**

1. Atualiza `pulso_content.roteiros.status` → `'APROVADO'`
2. Dispara webhook `POST /webhook/roteiro-aprovado` (WF02)
3. Callback `onSuccess()` para atualizar UI

**Props:**

```typescript
{
  roteiroId: string
  onSuccess?: () => void
  className?: string
}
```

**Comportamento:**

- Loading state com spinner
- Alert de sucesso/erro
- Cache invalidation automático (React Query)

---

## 📊 Monitor de Pipeline

### PipelineMonitor

**Localização:** `/monitor` (página dedicada)

**Função:**

- Query em tempo real da view `pulso_content.pipeline_producao`
- Auto-refresh a cada 10 segundos
- Visualização de progresso: Ideia → Roteiro → Áudio → Vídeo

**Features:**

1. **Cards de Stats** (6 status):

   - AGUARDANDO_ROTEIRO
   - ROTEIRO_PRONTO
   - AUDIO_GERADO
   - PRONTO_PUBLICACAO
   - PUBLICADO
   - ERRO

2. **Lista de Itens**:

   - 50 mais recentes
   - Ícones por status
   - Progresso visual (dots)
   - Link para `/ideias/[id]`

3. **Agrupamento**:
   - Por status
   - Com contadores

**Dependencies:**

```typescript
import { supabase } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";
```

---

## 📄 Página Monitor n8n

### /monitor/page.tsx

**Navegação:** Sidebar → "Monitor n8n" (badge AI)

**Seções:**

1. **Header**

   - Título com ícone Zap
   - Indicador de atualização automática (green dot)

2. **PipelineMonitor** (componente reutilizável)

   - Stats em tempo real
   - Auto-refresh 10s

3. **Workflows Ativos** (grid 3 cols)

   - WF00: Gerar Ideias (CRON)
   - WF01: Gerar Roteiro (Webhook)
   - WF02: Gerar Áudio (Webhook)
   - WF03: Preparar Vídeo (CRON)
   - WF04: Publicar (CRON)

   **Dados exibidos:**

   - Descrição do workflow
   - Tipo de trigger (CRON/Webhook)
   - Stats de execução (total, sucesso, erro)
   - Taxa de sucesso (%)

4. **Logs de Execução** (scroll 500px)
   - Query: `pulso_content.logs_workflows`
   - Auto-refresh 5s
   - 50 registros mais recentes
   - Ícones por status (✅ sucesso / ❌ erro)
   - Detalhes expandidos (metadata)
   - Timestamp formatado

---

## 🔌 Integração com n8n

### Webhooks Configurados

| Workflow | Webhook Path                  | Método | Trigger                       |
| -------- | ----------------------------- | ------ | ----------------------------- |
| WF00     | `/webhook/gerar-ideias`       | POST   | CRON 3h                       |
| WF01     | `/webhook/ideia-aprovada`     | POST   | Manual (ApproveIdeiaButton)   |
| WF02     | `/webhook/roteiro-aprovado`   | POST   | Manual (ApproveRoteiroButton) |
| WF03     | N/A                           | -      | CRON 30min                    |
| WF04     | `/webhook/agendar-publicacao` | POST   | Manual (futuro)               |
| WF04     | `/webhook/publicar-agora`     | POST   | Manual (futuro)               |

### API Client (lib/api/n8n.ts)

```typescript
export const n8nClient = {
  baseURL: process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL,

  workflows: {
    gerarIdeias(canalId, quantidade = 5)
    gerarRoteiro(ideiaId)
    gerarAudio(roteiroId)
    agendarPublicacao(...)
    publicarAgora(...)
  }
}
```

### React Query Hooks (lib/hooks/use-n8n.ts)

```typescript
useGerarIdeias(); // WF00
useGerarRoteiro(); // WF01
useGerarAudio(); // WF02
useAgendarPublicacao(); // WF04
usePublicarAgora(); // WF04
```

**Features:**

- Mutation com loading states
- Auto cache invalidation
- Error handling
- Success callbacks

---

## 📊 Views do Supabase

### pulso_content.pipeline_producao

**Propósito:** Agregação de dados para o PipelineMonitor

**Colunas:**

- `ideia_id`, `ideia_titulo`, `ideia_status`
- `canal_id`, `canal_nome`
- `roteiro_id`, `roteiro_status`
- `audio_id`, `audio_status`
- `video_id`, `video_status`
- `publicacao_id`, `publicacao_status`
- `status_pipeline` (enum)
- `created_at`, `updated_at`

**SQL:**

```sql
-- Ver arquivo: supabase/views/pipeline_producao.sql
```

### pulso_content.logs_workflows

**Propósito:** Histórico de execuções dos workflows n8n

**Colunas:**

- `id` (uuid)
- `workflow_name` (text)
- `status` (text: 'sucesso' | 'erro')
- `detalhes` (jsonb)
- `created_at` (timestamp)

**Índices:**

- `idx_logs_created_at` (created_at DESC)
- `idx_logs_workflow_status` (workflow_name, status)

---

## 🎯 Fluxo Completo

### 1️⃣ Geração de Ideias (Automático)

```
CRON (3h diária)
  ↓
WF00 executa
  ↓
5 ideias/canal inseridas
  ↓
Status: RASCUNHO
  ↓
Aparecem em /ideias
```

### 2️⃣ Aprovação de Ideia (Manual)

```
User acessa /ideias/[id]
  ↓
Clica em ApproveIdeiaButton
  ↓
1. DB: status → APROVADA
2. Webhook: POST /webhook/ideia-aprovada
  ↓
WF01 gera roteiro
  ↓
Roteiro inserido em pulso_content.roteiros
  ↓
Status: RASCUNHO
  ↓
Aparece em /roteiros
```

### 3️⃣ Aprovação de Roteiro (Manual)

```
User acessa /roteiros/[id]
  ↓
Clica em ApproveRoteiroButton
  ↓
1. DB: status → APROVADO
2. Webhook: POST /webhook/roteiro-aprovado
  ↓
WF02 gera áudio TTS
  ↓
Áudio inserido em pulso_content.audios
  ↓
Upload para Supabase Storage
  ↓
Status: FINALIZADO
```

### 4️⃣ Preparação de Vídeo (Automático)

```
CRON (30min)
  ↓
WF03 executa
  ↓
Query: áudios FINALIZADOS sem vídeo
  ↓
Gera storyboard + metadata
  ↓
Vídeo inserido em pulso_content.videos
  ↓
Status: AGUARDANDO_EDICAO
```

### 5️⃣ Publicação (Automático)

```
CRON (3x dia: 6h, 12h, 18h)
  ↓
WF04 executa
  ↓
Query: vídeos PRONTO_PUBLICACAO
  ↓
Gera 3 variantes:
  - TikTok (9:16, 60s)
  - YouTube Shorts (9:16, 60s)
  - Instagram Reels (9:16, 60s)
  ↓
Publicações inseridas em pulso_distribution.publicacoes
  ↓
Status: PENDENTE
```

---

## 🛠️ Troubleshooting

### Botão de aprovação não funciona

1. **Verificar n8n URL:**

   ```bash
   echo $NEXT_PUBLIC_N8N_WEBHOOK_URL
   # Deve ser: https://n8n.your-domain.com
   ```

2. **Verificar webhook ativo no n8n:**

   - WF01 deve estar ativo
   - Webhook path: `/webhook/ideia-aprovada`

3. **Verificar console do browser:**
   - Network tab → POST request
   - Response status: 200 OK

### Pipeline Monitor vazio

1. **Verificar view existe:**

   ```sql
   SELECT * FROM pulso_content.pipeline_producao LIMIT 1;
   ```

2. **Verificar RLS:**

   - Desabilitar temporariamente: `ALTER TABLE pulso_content.pipeline_producao DISABLE ROW LEVEL SECURITY;`

3. **Verificar query:**
   - React Query DevTools → `['pipeline']`
   - Ver erro detalhado

### Logs não aparecem

1. **Verificar tabela existe:**

   ```sql
   SELECT * FROM pulso_content.logs_workflows ORDER BY created_at DESC LIMIT 10;
   ```

2. **Workflows devem inserir logs:**
   - Cada workflow tem nó "Salvar Log"
   - Verificar credencial Postgres no n8n

---

## 📝 Checklist de Implementação

- [x] ApproveIdeiaButton criado
- [x] ApproveRoteiroButton criado
- [x] PipelineMonitor criado
- [x] Página /monitor criada
- [x] Botões integrados em /ideias/[id]
- [x] Botões integrados em /roteiros/[id]
- [x] Link no sidebar para /monitor
- [x] Documentação completa

**Pendente:**

- [ ] Criar view `pulso_content.pipeline_producao` no Supabase
- [ ] Criar tabela `pulso_content.logs_workflows` no Supabase
- [ ] Importar 5 workflows no n8n
- [ ] Configurar credenciais no n8n (Postgres, OpenAI, Supabase Storage)
- [ ] Ativar todos os 5 workflows
- [ ] Testar fluxo completo end-to-end

---

## 🚀 Próximos Passos

1. **Executar SQL no Supabase:**

   - `supabase/views/pipeline_producao.sql`
   - `supabase/migrations/create_logs_workflows.sql`

2. **Importar workflows no n8n:**

   - Seguir `n8n-workflows/GUIA_IMPORTACAO_COMPLETO.md`

3. **Testar fluxo:**

   - Aprovar 1 ideia → Verificar roteiro criado
   - Aprovar roteiro → Verificar áudio gerado
   - Aguardar CRON → Verificar vídeo/publicação

4. **Monitorar:**
   - Acessar `/monitor`
   - Verificar stats atualizando em tempo real
   - Verificar logs de execução

---

**Última atualização:** 30 Nov 2024
**Autor:** GitHub Copilot
