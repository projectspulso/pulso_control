# 🔍 DEBUG: Erro 500 no Webhook n8n WF01

## ❌ Erro Atual

```json
{
  "success": false,
  "error": "Webhook retornou 500",
  "details": "{\"code\":0,\"message\":\"Unused Respond to Webhook node found in the workflow\"}"
}
```

**Tradução:** Existe um nó "Respond to Webhook" no workflow que não está sendo usado/conectado.

---

## 📊 Análise do Workflow WF01

### Estrutura Atual do Fluxo:

```
[Webhook Ideia Aprovada]
    ↓
[Validar Payload]
    ↓
[Validar UUID] ──┬──→ [Buscar Ideia Completa]
                 │
                 └──→ [Erro - UUID Inválido] ❌
                            ↓
                     [Respond to Webhook]
```

### Caminho de Sucesso:

```
[Buscar Ideia Completa]
    ↓
[Ideia Existe?] ──┬──→ [Preparar Contexto Roteiro]
                  │         ↓
                  │    [GPT-4o - Gerar Roteiro]
                  │         ↓
                  │    [Processar Roteiro]
                  │         ↓
                  │    [Salvar Roteiro]
                  │         ↓
                  │    [Log Sucesso]
                  │         ↓
                  │    [Resposta Sucesso] ✅
                  │         ↓
                  │    [Respond to Webhook]
                  │
                  └──→ [Erro - Ideia Não Encontrada] ❌
                       [Log Erro]
                            ↓
                     [Respond to Webhook]
```

### 🐛 Problema Identificado:

Existem **3 nós "Respond to Webhook"**:

1. ✅ `Resposta Sucesso` (linha 553) - **CONECTADO** após "Log Sucesso"
2. ❌ `Erro - UUID Inválido` (linha 564) - **NÃO CONECTADO**
3. ❌ `Erro - Ideia Não Encontrada` (linha 576) - **NÃO CONECTADO**

Os nós de erro retornam JSON mas **não disparam o webhook response**.

---

## 📤 Payload Enviado pela API

### Código Atual (`/api/ideias/[id]/gerar-roteiro`):

```typescript
const webhookResponse = await fetch(webhookUrl, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-webhook-secret": process.env.WEBHOOK_SECRET || "",
  },
  body: JSON.stringify({
    ideia_id: id,
    trigger: "manual-gerar-roteiro",
    timestamp: new Date().toISOString(),
  }),
});
```

**Estrutura Enviada:** ✅ **Opção A**

```json
{
  "ideia_id": "2b226a1e-0f4f-4208-bfaf-0e41e95db6d6",
  "trigger": "manual-gerar-roteiro",
  "timestamp": "2025-12-02T14:30:00.000Z"
}
```

### Validação no Webhook n8n:

```javascript
// Linha 32-48 do workflow
"value": "={{ $json.ideia_id || $json.body?.ideia_id || $json.data?.ideia_id }}"
```

O webhook aceita **qualquer uma das 3 estruturas**, então o payload está correto! ✅

---

## 🔧 Código Completo do Componente

### `components/ui/approve-buttons.tsx` - Função `handleGenerate`:

```typescript
export function GerarRoteiroButton({
  ideiaId,
  ideiaStatus,
  hasRoteiro,
  onSuccess,
  className,
}: GerarRoteiroButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const queryClient = useQueryClient();

  const handleGenerate = async () => {
    setIsGenerating(true);

    try {
      const response = await fetch(`/api/ideias/${ideiaId}/gerar-roteiro`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao gerar roteiro");
      }

      queryClient.invalidateQueries({ queryKey: ["ideias"] });
      queryClient.invalidateQueries({ queryKey: ["roteiros"] });
      queryClient.invalidateQueries({ queryKey: ["pipeline"] });

      alert(`✅ Roteiro gerado com sucesso! ID: ${data.roteiro_id || "N/A"}`);
      onSuccess?.();
    } catch (error) {
      console.error("Erro ao gerar roteiro:", error);
      alert("Erro ao gerar roteiro. Tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Não mostrar se ideia não está aprovada ou já tem roteiro
  if (ideiaStatus !== "APROVADA" || hasRoteiro) {
    return null;
  }

  return (
    <button
      onClick={handleGenerate}
      disabled={isGenerating}
      className={cn(
        "bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50",
        className
      )}
    >
      {isGenerating ? (
        <span className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Gerando roteiro...
        </span>
      ) : (
        <span className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          🤖 Gerar Roteiro (IA)
        </span>
      )}
    </button>
  );
}
```

---

## 🛣️ Código Completo da API Route

### `app/api/ideias/[id]/gerar-roteiro/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

/**
 * POST /api/ideias/[id]/gerar-roteiro
 * Dispara o workflow WF01 para gerar roteiro (SEM alterar status da ideia)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log("🎬 Iniciando geração de roteiro...");

    const { id } = await params;
    console.log(`📝 ID da ideia: ${id}`);

    // Criar cliente Supabase com SERVICE_ROLE_KEY
    const supabaseUrl =
      process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: "Configuração do servidor incompleta" },
        { status: 500 }
      );
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

    // 1. Verificar se ideia existe e está aprovada (usando view public.ideias)
    const { data: ideia, error: fetchError } = (await supabase
      .from("ideias")
      .select("id, status, titulo")
      .eq("id", id)
      .single()) as any;

    if (fetchError || !ideia) {
      return NextResponse.json(
        { error: "Ideia não encontrada" },
        { status: 404 }
      );
    }

    if (ideia.status !== "APROVADA") {
      return NextResponse.json(
        { error: "Ideia precisa estar aprovada antes de gerar roteiro" },
        { status: 400 }
      );
    }

    // 2. Verificar se já existe roteiro para esta ideia (usando view public.roteiros)
    const { data: roteiros, error: roteiroCheckError } = (await supabase
      .from("roteiros")
      .select("id")
      .eq("ideia_id", id)
      .limit(1)) as any;

    if (roteiros && roteiros.length > 0) {
      return NextResponse.json(
        {
          error: "Já existe um roteiro para esta ideia",
          roteiro_id: roteiros[0].id,
        },
        { status: 400 }
      );
    }

    console.log(`✅ Ideia ${id} válida para geração de roteiro`);

    // 3. Chamar webhook do n8n (WF01 - Gerar Roteiro)
    const webhookUrl = process.env.N8N_WEBHOOK_APROVAR_IDEIA;

    if (!webhookUrl) {
      console.warn("⚠️ Webhook URL não configurada");
      return NextResponse.json(
        {
          success: false,
          error: "Webhook WF01 não configurado",
        },
        { status: 500 }
      );
    }

    try {
      console.log(`📞 Chamando webhook WF01: ${webhookUrl}`);

      const webhookResponse = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-webhook-secret": process.env.WEBHOOK_SECRET || "",
        },
        body: JSON.stringify({
          ideia_id: id,
          trigger: "manual-gerar-roteiro",
          timestamp: new Date().toISOString(),
        }),
      });

      if (!webhookResponse.ok) {
        const errorText = await webhookResponse.text();
        console.error(
          `❌ Webhook falhou: ${webhookResponse.status} - ${errorText}`
        );

        return NextResponse.json(
          {
            success: false,
            error: `Webhook retornou ${webhookResponse.status}`,
            details: errorText,
          },
          { status: 500 }
        );
      }

      const workflowResult = await webhookResponse.json();
      console.log("✅ Workflow WF01 disparado com sucesso:", workflowResult);

      return NextResponse.json({
        success: true,
        message: "Roteiro sendo gerado...",
        ideia: {
          id: ideia.id,
          titulo: ideia.titulo,
        },
        workflow: {
          status: "triggered",
          data: workflowResult,
        },
        roteiro_id: workflowResult?.data?.roteiro?.id || null,
      });
    } catch (webhookError) {
      console.error("💥 Erro ao chamar webhook:", webhookError);
      return NextResponse.json(
        {
          success: false,
          error: "Falha ao disparar workflow",
          details:
            webhookError instanceof Error
              ? webhookError.message
              : "Erro desconhecido",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("💥 Erro ao processar geração de roteiro:", error);
    return NextResponse.json(
      {
        error: "Erro ao processar geração de roteiro",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
```

---

## 📋 Log Completo do Erro 500

### Resposta do Servidor:

```bash
HTTP/1.1 500 Internal Server Error
Content-Type: application/json

{
  "success": false,
  "error": "Webhook retornou 500",
  "details": "{\"code\":0,\"message\":\"Unused Respond to Webhook node found in the workflow\"}"
}
```

### Detalhamento:

- **Status Code:** 500 (vindo do n8n, não da API Next.js)
- **Mensagem:** "Unused Respond to Webhook node found in the workflow"
- **Causa:** O workflow tem nós "Respond to Webhook" que não estão conectados ao fluxo principal

---

## ✅ Solução Recomendada

### Opção 1: Remover Nós Não Usados ✨ (Recomendado)

No n8n, **deletar** os nós:

- `Erro - UUID Inválido` (linha 564)
- `Erro - Ideia Não Encontrada` (linha 576)

Esses erros podem ser tratados diretamente no código JS antes de chamar o webhook.

### Opção 2: Conectar os Nós de Erro

Conectar os nós de erro ao fluxo:

```
[Validar UUID] ──┬──→ [Buscar Ideia]
                 │
                 └──→ [Erro - UUID Inválido]
                           ↓
                     [Respond to Webhook] ← CONECTAR!
```

### Opção 3: Mudar responseMode para "onReceived"

No nó "Webhook Ideia Aprovada", mudar:

```json
{
  "parameters": {
    "responseMode": "onReceived" // ← em vez de "lastNode"
  }
}
```

Isso fará o webhook retornar 200 imediatamente, processando async.

---

## 🧪 Teste Rápido

Após corrigir o workflow, teste:

```bash
curl -X POST http://localhost:3000/api/ideias/2b226a1e-0f4f-4208-bfaf-0e41e95db6d6/gerar-roteiro \
  -H "Content-Type: application/json"
```

**Resultado esperado:**

```json
{
  "success": true,
  "message": "Roteiro sendo gerado...",
  "roteiro_id": "uuid-do-roteiro-criado"
}
```

---

## 📊 Resumo das Respostas

### 1️⃣ Estrutura de Payload Enviada:

✅ **Opção A** (simples e direta):

```json
{
  "ideia_id": "uuid-aqui",
  "trigger": "manual-gerar-roteiro",
  "timestamp": "2025-12-02T14:30:00.000Z"
}
```

### 2️⃣ Código do Componente:

✅ Ver seção "Código Completo do Componente" acima

### 3️⃣ Código da API Route:

✅ Ver seção "Código Completo da API Route" acima

### 4️⃣ Log Completo do Erro:

✅ Ver seção "Log Completo do Erro 500" acima

---

## 🎯 Próximo Passo

**AÇÃO IMEDIATA:** Abrir o workflow WF01 no n8n e deletar ou conectar os nós "Respond to Webhook" não utilizados.
