# 🔄 Sistema de Feedback e Retry para Workflows n8n

## 📋 Visão Geral

Sistema completo de feedback em tempo real, retry automático e recuperação de falhas para os workflows n8n do PULSO Control.

---

## 🎯 Componentes Implementados

### 1️⃣ **Tabela de Fila de Workflows** (`pulso_automation.workflow_queue`)

Armazena workflows que falharam ou precisam ser reprocessados.

**Campos:**

- `id` - UUID único
- `workflow_name` - Nome do workflow (ex: "WF00 - Gerar Ideias")
- `workflow_id` - ID do workflow (WF00, WF01, WF02, etc.)
- `status` - `pending`, `processing`, `completed`, `failed`
- `payload` - JSON com parâmetros do workflow
- `error_message` - Mensagem de erro (se houver)
- `retry_count` - Contador de tentativas
- `max_retries` - Máximo de tentativas (padrão: 3)
- `next_retry_at` - Data/hora do próximo retry
- `created_at`, `updated_at`, `completed_at`

**Migration:** `supabase/migrations/create_workflow_queue.sql`

---

### 2️⃣ **API Endpoint para Webhook** (`/api/webhooks/workflow-completed`)

Endpoint que os workflows n8n chamam ao completar a execução.

**Localização:** `app/api/webhooks/workflow-completed/route.ts`

**Exemplo de chamada do n8n:**

```json
POST /api/webhooks/workflow-completed
{
  "workflow_id": "WF00",
  "workflow_name": "WF00 - Gerar Ideias",
  "status": "success",
  "data": {
    "ideias_geradas": 5,
    "canal_id": "uuid-do-canal"
  },
  "queue_id": "uuid-da-fila" // Opcional
}
```

**Resposta:**

```json
{
  "success": true,
  "message": "Workflow completion recorded"
}
```

---

### 3️⃣ **Componente Realtime** (`components/realtime-updates.tsx`)

Escuta mudanças no Supabase em tempo real e exibe notificações toast.

**Eventos monitorados:**

- Novas ideias criadas
- Novos roteiros gerados
- Logs de workflows
- Mudanças no pipeline
- Atualizações na fila de workflows

**Integração:**

```tsx
import { RealtimeUpdates } from "@/components/realtime-updates";

// No dashboard
<RealtimeUpdates />;
```

---

### 4️⃣ **Hook de Gerenciamento da Fila** (`lib/hooks/use-workflow-queue.ts`)

Hook React Query para gerenciar a fila de workflows.

**Funções disponíveis:**

- `useWorkflowQueue()` - Lista todos os itens da fila
- `usePendingWorkflows()` - Lista itens pendentes/falhos
- `useAddToQueue()` - Adiciona item à fila
- `useUpdateQueueStatus()` - Atualiza status de um item
- `useRetryWorkflow()` - Força retry manual
- `useQueueStats()` - Estatísticas da fila

**Exemplo de uso:**

```tsx
const { data: queue } = useWorkflowQueue();
const { mutate: addToQueue } = useAddToQueue();
const { mutate: retryWorkflow } = useRetryWorkflow();

// Adicionar workflow falho à fila
addToQueue({
  workflow_name: "WF01 - Gerar Roteiro",
  workflow_id: "WF01",
  payload: { ideia_id: "uuid-da-ideia" },
  max_retries: 3,
});

// Retry manual
retryWorkflow("uuid-do-item-da-fila");
```

---

### 5️⃣ **Workflow WF99 - Retry & Recovery** (`n8n-workflows/WF99_Retry_Recovery.json`)

Workflow n8n que processa a fila de retry automaticamente.

**Funcionamento:**

1. **Trigger:** Executa a cada 5 minutos (CRON)
2. **Busca pendentes:** Seleciona até 10 workflows com `status IN ('pending', 'failed')` e `retry_count < max_retries`
3. **Processa cada item:**
   - Marca como `processing`
   - Identifica qual workflow executar (WF00, WF01, WF02, etc.)
   - Chama o webhook correspondente com o payload
   - Marca como `completed` ou `failed` com novo retry agendado
4. **Log:** Registra execução em `logs_workflows`

**Importar no n8n:**

```bash
# Via CLI
n8n import:workflow --input=n8n-workflows/WF99_Retry_Recovery.json

# Ou via UI do n8n:
# Settings > Import from File > Selecionar WF99_Retry_Recovery.json
```

---

## 🔧 Como Configurar

### Passo 1: Executar Migration

```sql
-- No Supabase SQL Editor
\i supabase/migrations/create_workflow_queue.sql
```

### Passo 2: Importar Workflow WF99

1. Abrir n8n Dashboard
2. Import from File
3. Selecionar `WF99_Retry_Recovery.json`
4. Configurar credenciais do Supabase
5. Ativar o workflow

### Passo 3: Adicionar Webhook Callback nos Workflows Existentes

**Em cada workflow (WF00, WF01, WF02, WF03, WF04), adicionar no FINAL:**

```json
{
  "parameters": {
    "url": "{{$env.NEXT_PUBLIC_APP_URL}}/api/webhooks/workflow-completed",
    "method": "POST",
    "sendBody": true,
    "bodyParameters": {
      "parameters": [
        {
          "name": "workflow_id",
          "value": "WF00"
        },
        {
          "name": "workflow_name",
          "value": "WF00 - Gerar Ideias"
        },
        {
          "name": "status",
          "value": "success"
        },
        {
          "name": "data",
          "value": "={{ $json }}"
        },
        {
          "name": "queue_id",
          "value": "={{ $('Webhook').item.json.body.queue_id }}"
        }
      ]
    }
  },
  "name": "Notificar App (Sucesso)",
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.2
}
```

**E adicionar um nó de erro (Error Trigger):**

```json
{
  "parameters": {
    "url": "{{$env.NEXT_PUBLIC_APP_URL}}/api/webhooks/workflow-completed",
    "method": "POST",
    "sendBody": true,
    "bodyParameters": {
      "parameters": [
        {
          "name": "workflow_id",
          "value": "WF00"
        },
        {
          "name": "workflow_name",
          "value": "WF00 - Gerar Ideias"
        },
        {
          "name": "status",
          "value": "error"
        },
        {
          "name": "error",
          "value": "={{ $json.error }}"
        },
        {
          "name": "queue_id",
          "value": "={{ $('Webhook').item.json.body.queue_id }}"
        }
      ]
    }
  },
  "name": "Notificar App (Erro)",
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.2,
  "onError": "continueRegularOutput"
}
```

### Passo 4: Configurar Variáveis de Ambiente

**No n8n (`.env` ou Settings > Environment Variables):**

```env
NEXT_PUBLIC_APP_URL=https://seu-app.vercel.app
```

**No Next.js (`.env.local`):**

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
```

---

## 🚀 Fluxo Completo

### Cenário 1: Workflow Executado com Sucesso

1. n8n executa WF00 (Gerar Ideias)
2. Workflow completa com sucesso
3. n8n chama `/api/webhooks/workflow-completed` com `status: "success"`
4. API registra em `logs_workflows`
5. Se houver `queue_id`, marca item como `completed`
6. Supabase Realtime notifica o frontend
7. Toast aparece: "✅ WF00 - Gerar Ideias concluído!"

### Cenário 2: Workflow Falhou

1. n8n executa WF01 (Gerar Roteiro)
2. Ocorre erro (ex: API OpenAI timeout)
3. Error Trigger chama `/api/webhooks/workflow-completed` com `status: "error"`
4. API adiciona à fila com `status: 'failed'` e `next_retry_at: now() + 5 min`
5. Toast aparece: "⚠️ WF01 falhou. Retry agendado."
6. Após 5 min, WF99 processa a fila e re-executa WF01
7. Se sucesso, marca como `completed`. Se falha novamente, incrementa `retry_count`

### Cenário 3: Máximo de Retries Excedido

1. Workflow falha 3 vezes (max_retries)
2. WF99 não processa mais (filtro: `retry_count < max_retries`)
3. Item permanece como `failed` na fila
4. Admin pode ver na UI e fazer retry manual

---

## 📊 Monitoramento

### SQL para Ver Estatísticas da Fila

```sql
SELECT
  status,
  COUNT(*) as quantidade,
  AVG(retry_count) as media_retries
FROM pulso_automation.workflow_queue
GROUP BY status
ORDER BY quantidade DESC;
```

### Ver Workflows que Excederam Retries

```sql
SELECT
  workflow_name,
  error_message,
  retry_count,
  created_at
FROM pulso_automation.workflow_queue
WHERE retry_count >= max_retries
ORDER BY created_at DESC;
```

### Últimas 10 Execuções do WF99

```sql
SELECT
  workflow_name,
  status,
  detalhes,
  created_at
FROM pulso_content.logs_workflows
WHERE workflow_name LIKE 'WF99%'
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🎨 UI Components (Próximos Passos)

### Componente de Visualização da Fila

```tsx
// components/workflow-queue-monitor.tsx
import {
  useWorkflowQueue,
  useRetryWorkflow,
} from "@/lib/hooks/use-workflow-queue";

export function WorkflowQueueMonitor() {
  const { data: queue } = useWorkflowQueue();
  const { mutate: retry } = useRetryWorkflow();

  return (
    <div className="glass rounded-xl p-6">
      <h2>Fila de Workflows</h2>
      {queue?.map((item) => (
        <div key={item.id} className="flex items-center justify-between">
          <span>{item.workflow_name}</span>
          <span className={statusColor[item.status]}>{item.status}</span>
          {item.status === "failed" && (
            <button onClick={() => retry(item.id)}>Retry Manual</button>
          )}
        </div>
      ))}
    </div>
  );
}
```

---

## ✅ Checklist de Implementação

- [x] Migration `create_workflow_queue.sql` criada
- [x] API endpoint `/api/webhooks/workflow-completed` criado
- [x] Componente `RealtimeUpdates` criado
- [x] Hook `use-workflow-queue.ts` criado
- [x] Workflow WF99 criado
- [x] Integrado componente Realtime no dashboard
- [ ] Adicionar webhooks nos workflows WF00-WF04
- [ ] Importar WF99 no n8n
- [ ] Criar UI para monitorar fila
- [ ] Testar fluxo completo end-to-end

---

## 🐛 Troubleshooting

**Problema:** Toast não aparece quando workflow completa

- Verificar se Supabase Realtime está habilitado
- Verificar se `RealtimeUpdates` está montado no componente
- Checar console do navegador para erros

**Problema:** WF99 não processa a fila

- Verificar se workflow está ativo no n8n
- Confirmar que CRON está configurado (a cada 5 min)
- Checar logs do n8n para erros de execução

**Problema:** Webhook retorna 404

- Confirmar rota: `/api/webhooks/workflow-completed`
- Verificar se arquivo `route.ts` existe
- Checar se app está rodando e acessível

---

## 📚 Referências

- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [n8n Webhook Trigger](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/)
- [React Query Mutations](https://tanstack.com/query/latest/docs/framework/react/guides/mutations)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
