# ✅ CHECKLIST DE ATIVAÇÃO DO WORKFLOW WF01

## 🎯 Status Atual

### Workflow Corrigido:
- ✅ 2 nós "Respond to Webhook" (sucesso + erro)
- ✅ Fluxo de erro conectado (Log Erro → Resposta Erro)
- ✅ Fluxo de sucesso conectado (Log Sucesso → Resposta Sucesso)
- ✅ Validação de payload melhorada (ideia_id, trigger, timestamp)
- ⚠️ **Workflow está INATIVO** (`"active": false`)

---

## 📋 PASSOS OBRIGATÓRIOS

### 1. Importar/Atualizar Workflow no n8n

1. Acesse: `https://pulsoprojects.app.n8n.cloud/workflows`
2. Localize o workflow **"WF01 - Gerar Roteiro"**
3. Se já existe:
   - Clique em "..." → "Settings" → "Import"
   - Cole o conteúdo do arquivo `n8n-workflows/WF01_Gerar_Roteiro.json`
   - Salve
4. Se não existe:
   - Clique em "New Workflow"
   - "..." → "Import from File"
   - Selecione `WF01_Gerar_Roteiro.json`

---

### 2. Configurar Credenciais

#### 2.1 Postgres (Supabase)
- ✅ Nome esperado: `Postgres supabase`
- ✅ ID: `q19Ps5vylbEtdVtd`
- Verificar configuração:
  - Host: `db.xxx.supabase.co`
  - Database: `postgres`
  - User: `postgres`
  - Password: [sua senha]
  - Port: `5432`
  - SSL: Habilitado

#### 2.2 OpenAI API
- ✅ Nome esperado: `OpenAi pulso_control`
- ✅ ID: `UiqqtKTHr3xQlkcs`
- Verificar:
  - API Key: `sk-proj-...`

#### 2.3 Webhook Auth
- ✅ Nome esperado: `Supabase Storage – Pulso`
- ✅ ID: `jzqp2EgiwYn5wpcc`
- Header: `x-webhook-secret`
- Value: (mesmo valor de `WEBHOOK_SECRET` no `.env`)

---

### 3. Ativar Workflow

1. No editor do workflow, clique no botão **"Active"** (canto superior direito)
2. Deve mudar de OFF (vermelho) para ON (verde)
3. Verificar URL do webhook:
   ```
   https://pulsoprojects.app.n8n.cloud/webhook/ideia-aprovada
   ```

---

### 4. Testar Webhook

#### Teste 1: UUID Válido (Sucesso Esperado)

```bash
curl -X POST http://localhost:3000/api/ideias/2b226a1e-0f4f-4208-bfaf-0e41e95db6d6/gerar-roteiro
```

**Resposta esperada (200 OK):**
```json
{
  "success": true,
  "message": "Roteiro gerado com sucesso!",
  "data": {
    "roteiro": {
      "id": "uuid-do-roteiro",
      "titulo": "Título Gerado pela IA",
      "status": "RASCUNHO",
      "duracao_segundos": 48,
      "created_at": "2025-12-02T..."
    },
    "metricas": {
      "palavras_narracao": 120,
      "quality_score": 100,
      "hashtags_count": 5
    },
    "validacoes": {
      "tem_gancho": true,
      "tem_desenvolvimento": true,
      "tem_climax": true,
      "tem_cta": true,
      "duracao_ok": true,
      "palavras_ok": true
    },
    "metadados": {
      "plataforma_foco": "tiktok",
      "tom_narrativo": "narrativo",
      "momento_ideal": "qualquer"
    }
  },
  "workflow": {
    "execution_id": "NjX6oMBBt8KiagwJ_12345",
    "tempo_execucao_ms": 8500,
    "modelo_usado": "gpt-4o"
  }
}
```

---

#### Teste 2: UUID Inválido (Erro Esperado)

```bash
curl -X POST http://localhost:3000/api/ideias/abc123/gerar-roteiro
```

**Resposta esperada (400 Bad Request):**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_UUID",
    "message": "ID da ideia inválido ou não informado",
    "details": "O ideia_id deve ser um UUID válido"
  },
  "received": {
    "ideia_id": "abc123"
  },
  "workflow": {
    "execution_id": "NjX6oMBBt8KiagwJ_12346"
  }
}
```

---

#### Teste 3: Ideia Não Encontrada (Erro Esperado)

```bash
curl -X POST http://localhost:3000/api/ideias/00000000-0000-0000-0000-000000000000/gerar-roteiro
```

**Resposta esperada (404 Not Found):**
```json
{
  "success": false,
  "error": {
    "code": "IDEIA_NOT_FOUND",
    "message": "Ideia não encontrada ou não está aprovada",
    "details": "Verifique se o ID está correto e se a ideia foi aprovada"
  },
  "received": {
    "ideia_id": "00000000-0000-0000-0000-000000000000"
  },
  "workflow": {
    "execution_id": "NjX6oMBBt8KiagwJ_12347"
  }
}
```

---

### 5. Verificar Logs no Supabase

```sql
-- Ver últimas 5 execuções do workflow
SELECT 
  workflow_name,
  status,
  detalhes->>'ideia_id' as ideia_id,
  detalhes->>'roteiro_id' as roteiro_id,
  detalhes->>'titulo' as titulo,
  erro_mensagem,
  tempo_execucao_ms,
  created_at
FROM pulso_content.logs_workflows
WHERE workflow_name = 'WF01_Gerar_Roteiro'
ORDER BY created_at DESC
LIMIT 5;
```

**Resultado esperado:**
| workflow_name | status | ideia_id | roteiro_id | titulo | tempo_execucao_ms | created_at |
|--------------|--------|----------|------------|--------|------------------|------------|
| WF01_Gerar_Roteiro | sucesso | 2b226a1e... | uuid-novo | Título Gerado | 8500 | 2025-12-02 ... |

---

### 6. Verificar Roteiro Criado

```sql
-- Ver roteiro criado
SELECT 
  id,
  titulo,
  status,
  duracao_estimado_segundos,
  metadata->>'quality_score' as quality_score,
  metadata->>'palavras_narracao' as palavras_narracao,
  metadata->>'hashtags_sugeridas' as hashtags,
  created_at
FROM pulso_content.roteiros
WHERE ideia_id = '2b226a1e-0f4f-4208-bfaf-0e41e95db6d6'
ORDER BY created_at DESC
LIMIT 1;
```

---

### 7. Verificar Execuções no n8n

1. Acesse: `https://pulsoprojects.app.n8n.cloud/workflows/NjX6oMBBt8KiagwJ/executions`
2. Verifique:
   - ✅ Status: Success (verde)
   - ✅ Duração: ~8-15 segundos
   - ✅ Todos os nós executados sem erro
   - ✅ Resposta retornada corretamente

---

## 🐛 Troubleshooting

### Problema: Timeout ao chamar endpoint

**Sintoma:** `curl` trava e não retorna

**Causas possíveis:**
1. ❌ Workflow não está ativado no n8n
2. ❌ Nó "Respond to Webhook" não está conectado
3. ❌ Erro no GPT-4o (quota excedida, API key inválida)

**Solução:**
1. Verificar se workflow está "Active" (verde)
2. Verificar execuções no n8n → Logs
3. Verificar saldo da OpenAI API

---

### Problema: Erro 500 "Unused Respond to Webhook"

**Sintoma:** 
```json
{"error": "Webhook retornou 500", "details": "Unused Respond to Webhook node..."}
```

**Causa:** Nós "Respond to Webhook" não conectados

**Solução:**
1. ✅ **JÁ CORRIGIDO** no arquivo JSON atual
2. Reimportar workflow no n8n

---

### Problema: Erro "permission denied"

**Sintoma:**
```json
{"error": "permission denied for schema pulso_content"}
```

**Causa:** Permissões do Supabase

**Solução:**
```sql
-- JÁ EXECUTADO ANTERIORMENTE
GRANT UPDATE ON pulso_content.ideias TO service_role;
GRANT UPDATE ON pulso_content.roteiros TO service_role;
```

---

### Problema: Roteiro não aparece na UI

**Sintoma:** Workflow executa mas UI não mostra roteiro

**Causa:** Cache do React Query não invalidado

**Solução:** No componente `GerarRoteiroButton`, verificar:
```typescript
queryClient.invalidateQueries({ queryKey: ['roteiros'] })
```

---

## ✅ CHECKLIST FINAL

Antes de testar, certifique-se:

- [ ] Workflow importado no n8n
- [ ] Credenciais Postgres configuradas
- [ ] Credenciais OpenAI configuradas  
- [ ] Credencial Webhook Auth configurada
- [ ] Workflow **ATIVADO** (botão verde)
- [ ] URL do webhook correta no `.env`: `N8N_WEBHOOK_APROVAR_IDEIA`
- [ ] Servidor Next.js rodando: `npm run dev`
- [ ] Permissões do Supabase configuradas (GRANT executados)

---

## 🎯 ORDEM DE EXECUÇÃO DOS TESTES

1. ✅ **Teste básico:** UUID válido com ideia aprovada
2. ✅ **Teste de erro:** UUID inválido
3. ✅ **Teste de edge case:** Ideia não encontrada
4. ✅ **Teste de duplicata:** Tentar gerar roteiro 2x para mesma ideia
5. ✅ **Verificar logs:** SQL no Supabase
6. ✅ **Verificar execuções:** n8n Dashboard

---

## 📊 MÉTRICAS DE SUCESSO

Após executar testes, você deve ver:

- ✅ Status 200 no curl
- ✅ `"success": true` na resposta
- ✅ Roteiro criado no banco (`pulso_content.roteiros`)
- ✅ Log de sucesso (`pulso_content.logs_workflows`)
- ✅ Execução verde no n8n
- ✅ Botão "Gerar Roteiro" desaparece na UI
- ✅ Roteiro aparece na lista de roteiros

---

## 🚀 PRÓXIMOS PASSOS

Após workflow funcionar:

1. ✅ Testar fluxo completo na UI (não só via curl)
2. ✅ Testar workflow WF02 (Gerar Áudio)
3. ✅ Integrar com pipeline de produção
4. ✅ Configurar notificações de erro (se workflow falhar)
5. ✅ Documentar prompts da OpenAI para ajustes futuros

---

**IMPORTANTE:** O workflow precisa estar **ATIVO** no n8n para funcionar!

Verifique o status em: https://pulsoprojects.app.n8n.cloud/workflows
