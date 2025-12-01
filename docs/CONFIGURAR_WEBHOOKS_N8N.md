# Configuração dos Webhooks n8n para Feedback ao App

## Visão Geral

Este documento explica como configurar os workflows do n8n para enviar feedback ao aplicativo Next.js quando completarem suas execuções.

## Endpoint de Webhook

**URL:** `https://seu-dominio.com/api/webhooks/workflow-completed`  
**Método:** `POST`  
**Content-Type:** `application/json`

## Payload Esperado

```json
{
  "workflow_name": "WF00 - Gerar Ideias",
  "workflow_id": "workflow_id_do_n8n",
  "status": "success",
  "execution_id": "execution_id_do_n8n",
  "duration_ms": 5432,
  "data": {
    "ideias_geradas": 5,
    "canal_id": "uuid-do-canal",
    "custom_data": {}
  },
  "error": null
}
```

### Campos Obrigatórios

- `workflow_name` (string): Nome do workflow (ex: "WF00 - Gerar Ideias")
- `status` (string): "success" | "error"

### Campos Opcionais

- `workflow_id` (string): ID do workflow no n8n
- `execution_id` (string): ID da execução no n8n
- `duration_ms` (number): Duração da execução em milissegundos
- `data` (object): Dados específicos do workflow
- `error` (string): Mensagem de erro (apenas quando status = "error")

## Configuração em Cada Workflow

### 1. Adicionar nó HTTP Request no Final do Workflow

Adicione um nó **HTTP Request** ao final de cada workflow (WF00, WF01, WF02, WF03, WF04):

1. Abra o workflow no n8n
2. Adicione um novo nó **HTTP Request**
3. Configure:
   - **Request Method:** POST
   - **URL:** `https://seu-dominio.com/api/webhooks/workflow-completed`
   - **Authentication:** None (ou conforme sua segurança)
   - **Send Body:** true
   - **Body Content Type:** JSON

### 2. Configurar Body para Sucesso

No campo **Body (JSON)**, adicione:

```json
{
  "workflow_name": "{{ $workflow.name }}",
  "workflow_id": "{{ $workflow.id }}",
  "status": "success",
  "execution_id": "{{ $execution.id }}",
  "duration_ms": {{ $execution.duration }},
  "data": {
    "items_processed": {{ $input.all().length }},
    "custom_field": "{{ $json.campo_especifico }}"
  }
}
```

### 3. Adicionar Tratamento de Erro

Para cada workflow, adicione também um **Error Workflow** ou um nó de erro:

1. Crie um **Error Trigger**
2. Adicione um nó **HTTP Request** configurado para:

```json
{
  "workflow_name": "{{ $workflow.name }}",
  "workflow_id": "{{ $workflow.id }}",
  "status": "error",
  "execution_id": "{{ $execution.id }}",
  "error": "{{ $json.error.message }}",
  "data": {
    "error_details": "{{ $json.error }}"
  }
}
```

## Exemplo: WF00 - Gerar Ideias

### Fluxo Completo

```
[CRON Trigger] → [Buscar Canal] → [Generate Ideas (OpenAI)] → [Insert no Supabase] → [HTTP Request - Success]
                                                                                    ↓ (on error)
                                                                      [HTTP Request - Error]
```

### Body de Sucesso - WF00

```json
{
  "workflow_name": "WF00 - Gerar Ideias",
  "workflow_id": "{{ $workflow.id }}",
  "status": "success",
  "execution_id": "{{ $execution.id }}",
  "duration_ms": {{ $execution.duration }},
  "data": {
    "ideias_geradas": {{ $('Insert no Supabase').all().length }},
    "canal_id": "{{ $('Buscar Canal').first().json.id }}",
    "canal_nome": "{{ $('Buscar Canal').first().json.nome }}"
  }
}
```

## Exemplo: WF01 - Gerar Roteiro

### Body de Sucesso - WF01

```json
{
  "workflow_name": "WF01 - Gerar Roteiro",
  "workflow_id": "{{ $workflow.id }}",
  "status": "success",
  "execution_id": "{{ $execution.id }}",
  "duration_ms": {{ $execution.duration }},
  "data": {
    "roteiro_id": "{{ $('Insert Roteiro').first().json.id }}",
    "ideia_id": "{{ $json.ideia_id }}",
    "titulo": "{{ $('Insert Roteiro').first().json.titulo }}"
  }
}
```

## Exemplo: WF02 - Gerar Áudio

### Body de Sucesso - WF02

```json
{
  "workflow_name": "WF02 - Gerar Áudio",
  "workflow_id": "{{ $workflow.id }}",
  "status": "success",
  "execution_id": "{{ $execution.id }}",
  "duration_ms": {{ $execution.duration }},
  "data": {
    "audio_id": "{{ $('Insert Audio').first().json.id }}",
    "roteiro_id": "{{ $json.roteiro_id }}",
    "duracao_segundos": {{ $('Insert Audio').first().json.duracao_segundos }},
    "url": "{{ $('Insert Audio').first().json.url }}"
  }
}
```

## Segurança

### Opção 1: API Key Simples

Adicione um header de autenticação:

```
Header: X-API-Key
Value: sua-chave-secreta-aqui
```

Configure no código do endpoint:

```typescript
const apiKey = request.headers.get("x-api-key");
if (apiKey !== process.env.WEBHOOK_API_KEY) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

### Opção 2: Verificação de IP

Limite o acesso apenas ao IP do servidor n8n:

```typescript
const allowedIPs = ["IP_DO_SEU_N8N"];
const clientIP = request.headers.get("x-forwarded-for")?.split(",")[0];

if (!allowedIPs.includes(clientIP)) {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
```

### Opção 3: HMAC Signature

Para máxima segurança, use assinatura HMAC (a implementar).

## Testando

### 1. Teste Local com curl

```bash
curl -X POST http://localhost:3000/api/webhooks/workflow-completed \
  -H "Content-Type: application/json" \
  -d '{
    "workflow_name": "WF00 - Gerar Ideias",
    "status": "success",
    "data": {
      "ideias_geradas": 3
    }
  }'
```

### 2. Teste no n8n

1. Abra o workflow
2. Execute manualmente
3. Verifique os logs do endpoint Next.js
4. Confirme que os dados foram recebidos

## Monitoramento

### Logs no App

Todos os webhooks recebidos são logados em:

- Console do servidor Next.js
- Tabela `logs_workflows` no Supabase (se configurado)

### Dashboard

Acesse o dashboard em tempo real para ver:

- Execuções recentes
- Status de cada workflow
- Erros e falhas

## Troubleshooting

### Webhook não está sendo recebido

1. Verifique se a URL está correta
2. Confirme que o servidor Next.js está rodando
3. Verifique firewalls e regras de rede
4. Confira os logs do n8n para ver se houve erro no envio

### Dados não aparecem no dashboard

1. Verifique se o Supabase Realtime está ativo
2. Confirme que a tabela tem RLS configurado
3. Verifique o console do navegador por erros

### Erros 401/403

1. Confirme que a API Key está correta
2. Verifique se o IP está na lista de permitidos
3. Confira os headers da requisição

## Próximos Passos

1. ✅ Configurar webhooks em WF00
2. ✅ Configurar webhooks em WF01
3. ✅ Configurar webhooks em WF02
4. ✅ Configurar webhooks em WF03
5. ✅ Configurar webhooks em WF04
6. ⏳ Implementar retry automático via WF99
7. ⏳ Adicionar métricas e analytics

## Recursos Adicionais

- [n8n HTTP Request Node Documentation](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
