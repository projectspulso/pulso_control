# 🧪 TESTE RÁPIDO - Aprovação de Ideia

## ✅ O que foi corrigido

1. **Payload flexível**: Aceita `$json.ideia_id`, `$json.body.ideia_id` ou `$json.data.ideia_id`
2. **Query simplificada**: Removido `AND i.status = 'APROVADA'` para evitar race condition

## 🚀 Como testar AGORA

### Opção 1: Script automático (recomendado)

```bash
# No terminal Git Bash
cd /d/projetos/pulso_projects
chmod +x test-approval-flow.sh
./test-approval-flow.sh
```

O script vai pedir o UUID de uma ideia. Você pode:

- Colar um UUID real do banco
- Ou pressionar ENTER para usar UUID de teste (vai falhar, mas mostra se webhook está OK)

### Opção 2: cURL manual

```bash
# Substitua COLE_UUID_AQUI por um UUID real
curl -X POST https://pulsoprojects.app.n8n.cloud/webhook/ideia-aprovada \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: pulso_wh_sec_2024_n8n_b9c6ef9_secure_token" \
  -d '{
    "ideia_id": "COLE_UUID_AQUI",
    "trigger": "manual-test",
    "timestamp": "2024-12-02T00:00:00.000Z"
  }'
```

### Opção 3: Pelo frontend

1. `npm run dev`
2. Abrir `http://localhost:3000`
3. Ir em página de ideias
4. Clicar "Aprovar" em qualquer ideia
5. Ver console do browser e terminal do Next.js

---

## 📊 Respostas esperadas

### ✅ Sucesso (200/201)

```json
{
  "success": true,
  "message": "Roteiro gerado com sucesso!",
  "data": {
    "roteiro": {
      "id": "uuid-do-roteiro",
      "titulo": "Título gerado pela IA",
      "status": "RASCUNHO",
      "duracao_segundos": 52
    },
    "metricas": {
      "palavras_narracao": 125,
      "quality_score": 100
    }
  }
}
```

### ❌ Erro 400 - UUID inválido

```json
{
  "success": false,
  "error": {
    "code": "INVALID_UUID",
    "message": "ID da ideia inválido"
  }
}
```

### ❌ Erro 500 - Ideia não encontrada

```json
{
  "success": false,
  "error": {
    "code": "IDEIA_NOT_FOUND",
    "message": "Ideia não encontrada ou não está aprovada"
  }
}
```

**Solução:** Usar UUID de ideia que REALMENTE existe no banco.

### ❌ Erro 500 - Credencial OpenAI

```
Error: Insufficient quota
```

**Solução:** Adicionar créditos na conta OpenAI ou verificar API key.

---

## 🔍 Como pegar UUID de ideia real

### Opção A: Via Supabase Dashboard

1. https://supabase.com/dashboard/project/nlcisbfdiokmipyihtuz
2. Table Editor → `pulso_content.ideias`
3. Copiar qualquer `id` (UUID)

### Opção B: Via SQL (se tiver psql)

```sql
SELECT id, titulo, status
FROM pulso_content.ideias
LIMIT 5;
```

---

## 🎯 Checklist pós-teste

Depois de executar o teste, verificar:

- [ ] Webhook retornou 200/201
- [ ] Resposta contém `roteiro.id`
- [ ] Roteiro aparece em `pulso_content.roteiros` no banco
- [ ] Logs do n8n mostram execução verde (sucesso)
- [ ] Frontend consegue aprovar ideia sem erro 500

---

## 📞 Próximos passos

Se tudo funcionar:

1. ✅ Marcar WF01 como completo
2. 🔄 Configurar WF02 (gerar áudio do roteiro)
3. 📱 Integrar com plataformas (TikTok, YouTube)

Se algo falhar:

1. Ver logs detalhados no n8n: Executions → Última execução
2. Ver erro específico do nó que falhou
3. Ajustar configuração e re-testar
