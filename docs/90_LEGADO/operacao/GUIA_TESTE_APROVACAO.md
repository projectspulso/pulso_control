# 🧪 Guia de Teste: Nova Estrutura de Aprovação

## ✅ O Que Foi Implementado

### Mudanças Principais:

1. **Separação de responsabilidades**: Aprovação de ideia ≠ Geração de roteiro
2. **Controle de duplicatas**: Sistema verifica se roteiro já existe antes de criar
3. **Feedback visual**: Botões aparecem/desaparecem baseado no estado
4. **Permissões corretas**: Uso de SERVICE_ROLE_KEY em todas as operações

---

## 📋 Passo a Passo para Testar

### Cenário 1: Aprovar Ideia Nova ✅

**Pré-requisitos:**

- Ter uma ideia com `status = 'RASCUNHO'`

**Passos:**

1. Acesse `http://localhost:3000/ideias`
2. Clique em uma ideia com status "Rascunho"
3. Observe que aparece o botão **"Aprovar Ideia"**
4. Clique no botão
5. ✅ **Resultado esperado:**
   - Status muda para "APROVADA"
   - Badge verde "Aprovada" aparece
   - Botão "Aprovar Ideia" desaparece
   - Seção "📄 Roteiros" aparece
   - Botão "🤖 Gerar Roteiro (IA)" fica visível

**Validações:**

- [ ] Status atualizado no banco de dados
- [ ] UI refletiu mudança imediatamente
- [ ] Nenhum erro no console do navegador
- [ ] Nenhum erro nos logs do servidor

---

### Cenário 2: Gerar Roteiro Automaticamente 🤖

**Pré-requisitos:**

- Ideia com `status = 'APROVADA'`
- Ainda não tem roteiro criado

**Passos:**

1. Na mesma página da ideia aprovada
2. Role até a seção "📄 Roteiros"
3. Observe a mensagem: "Nenhum roteiro gerado ainda..."
4. Clique em **"🤖 Gerar Roteiro (IA)"**
5. ✅ **Resultado esperado:**
   - Loading aparece no botão
   - Mensagem de sucesso: "Roteiro sendo gerado..."
   - Após alguns segundos, roteiro aparece na lista
   - Botão "Gerar Roteiro" desaparece

**Validações Backend (n8n):**

- [ ] Abra `https://pulsoprojects.app.n8n.cloud/workflows`
- [ ] Vá em "Executions" → Filtre por "WF01 - Gerar Roteiro"
- [ ] Verifique última execução:
  - Status: ✅ Success
  - Input: `{ "ideia_id": "uuid-aqui" }`
  - Output: Roteiro criado com sucesso

**Validações Database:**

```sql
-- No Supabase SQL Editor
SELECT
  r.id,
  r.titulo,
  r.ideia_id,
  r.status,
  r.created_at
FROM pulso_content.roteiros r
WHERE r.ideia_id = 'COLE-O-UUID-DA-IDEIA-AQUI'
ORDER BY r.created_at DESC
LIMIT 1;
```

**Logs do Servidor (Terminal):**

```bash
# Procure por:
✅ POST /api/ideias/[uuid]/gerar-roteiro 200
📊 Resposta do webhook: { roteiro_id: "uuid-do-roteiro" }
```

---

### Cenário 3: Tentativa de Duplicação (Deve Falhar) ❌

**Pré-requisitos:**

- Ideia com roteiro já criado

**Passos:**

1. Acesse ideia que **já tem roteiro**
2. Observe a seção "📄 Roteiros"
3. ✅ **Resultado esperado:**
   - Lista de roteiros aparece
   - **NÃO** aparece botão "Gerar Roteiro"
   - Card do roteiro existente é clicável

**Teste Manual via cURL (opcional):**

```bash
# Tente forçar criação duplicada
curl -X POST http://localhost:3000/api/ideias/UUID-AQUI/gerar-roteiro \
  -H "Content-Type: application/json"

# Resposta esperada:
{
  "error": "Já existe um roteiro para esta ideia",
  "roteiro_id": "uuid-do-roteiro-existente"
}
```

**Validações:**

- [ ] API retorna erro 400
- [ ] Mensagem clara de que roteiro já existe
- [ ] Nenhum webhook disparado (verificar n8n Executions)
- [ ] Banco de dados NÃO criou roteiro duplicado

---

### Cenário 4: Ideia Não Aprovada (Bloqueio) 🚫

**Pré-requisitos:**

- Ideia com `status = 'RASCUNHO'` ou `'EM_ANALISE'`

**Passos:**

1. Tente chamar endpoint diretamente:

```bash
curl -X POST http://localhost:3000/api/ideias/UUID-IDEIA-NAO-APROVADA/gerar-roteiro \
  -H "Content-Type: application/json"
```

2. ✅ **Resultado esperado:**

```json
{
  "error": "Ideia precisa estar aprovada antes de gerar roteiro"
}
```

**Validações:**

- [ ] Status code 400
- [ ] Mensagem de erro clara
- [ ] Nenhum webhook disparado
- [ ] Nenhum roteiro criado

---

## 🔍 Checklist Completo de Validação

### Frontend (UI/UX):

- [ ] ApproveIdeiaButton só aparece se status != 'APROVADA'
- [ ] GerarRoteiroButton só aparece se status === 'APROVADA' && !hasRoteiro
- [ ] Transições visuais suaves (loading, success, error)
- [ ] Mensagens de erro são legíveis
- [ ] Nenhum erro no console do navegador

### Backend (API):

- [ ] `PATCH /api/ideias/[id]/status` retorna 200
- [ ] `POST /api/ideias/[id]/gerar-roteiro` retorna 200
- [ ] Validações funcionam corretamente
- [ ] SERVICE_ROLE_KEY está sendo usado
- [ ] Logs aparecem no terminal do servidor

### Integrações (n8n):

- [ ] Webhook recebe payload correto
- [ ] WF01 executa sem erros
- [ ] GPT-4o gera roteiro válido
- [ ] Roteiro é salvo no banco de dados

### Database (Supabase):

- [ ] Status da ideia atualizado corretamente
- [ ] Roteiro criado com campos obrigatórios preenchidos
- [ ] Timestamps (created_at, updated_at) corretos
- [ ] Relação ideia ↔ roteiro funciona (foreign key)

---

## 🐛 Troubleshooting Comum

### Erro: "permission denied for schema pulso_content"

**Causa:** SERVICE_ROLE_KEY não configurada ou incorreta  
**Solução:**

```bash
# Verifique .env.local
cat .env.local | grep SUPABASE_SERVICE_ROLE_KEY

# Deve retornar algo como:
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...muito-longo...
```

### Erro: "Webhook timeout" ou "n8n não responde"

**Causa:** Webhook URL incorreta ou n8n fora do ar  
**Solução:**

```bash
# Teste webhook manualmente
curl -X POST https://pulsoprojects.app.n8n.cloud/webhook/ideia-aprovada \
  -H "Content-Type: application/json" \
  -d '{"ideia_id":"teste"}'

# Resposta esperada: 204 No Content (sem body)
```

### Erro: "Roteiro não aparece na UI após criação"

**Causa:** Cache do React Query não invalidado  
**Solução:** Adicionar `refetch()` no `onSuccess` do botão

### Botão "Gerar Roteiro" não desaparece após criação

**Causa:** Hook `useRoteirosPorIdeia` não atualizou  
**Solução:** Verificar se `queryClient.invalidateQueries(['roteiros'])` está sendo chamado

---

## 📊 Métricas de Sucesso

Considere o teste **PASSOU** se:

1. ✅ Todos os 4 cenários funcionaram conforme esperado
2. ✅ Nenhum erro 500 nos logs do servidor
3. ✅ n8n mostra execução bem-sucedida do WF01
4. ✅ Database tem roteiro criado corretamente
5. ✅ UI atualiza automaticamente após cada ação
6. ✅ Não é possível criar roteiro duplicado

---

## 🎯 Próximos Passos Após Testes

1. [ ] Testar fluxo completo: Ideia → Roteiro → Áudio
2. [ ] Adicionar testes automatizados (Jest/Playwright)
3. [ ] Melhorar mensagens de erro com toast notifications
4. [ ] Criar dashboard de acompanhamento de execuções
5. [ ] Documentar fluxo no Notion/Confluence
