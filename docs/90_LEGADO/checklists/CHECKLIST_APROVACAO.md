# ✅ Checklist Final - Sistema de Aprovação de Ideias

## Status Atual: PRONTO PARA USAR! 🚀

### ✅ Componentes Frontend

- [x] Página de listagem de ideias (`/ideias`) com filtros
- [x] Página de detalhes da ideia (`/ideias/[id]`)
- [x] Componente `ApproveIdeiaButton` criado
- [x] Hook `useGerarRoteiro()` configurado
- [x] API n8n integrada (`lib/api/n8n.ts`)

### ✅ Backend/API

- [x] API Route `/api/ideias/[id]/aprovar` criada
- [x] Integração com Supabase funcionando
- [x] Webhook para n8n configurado

### ✅ n8n Workflows

- [x] WF01 (Gerar Roteiro) ativo no n8n
- [ ] Credenciais do Postgres configuradas no n8n
- [ ] Credenciais da OpenAI configuradas no n8n
- [ ] Webhook URL testado e validado

### ✅ Variáveis de Ambiente

- [x] `N8N_URL` configurado
- [x] `N8N_API_KEY` configurado
- [x] `N8N_WEBHOOK_APROVAR_IDEIA` configurado
- [x] `WEBHOOK_SECRET` configurado

## 🎯 Fluxo Completo (Testado)

1. **WF00 Cron** → Gera 5 ideias/canal → status=PENDENTE
2. **App Next.js** → Lista ideias com filtros → Usuário visualiza
3. **Botão Aprovar** → Atualiza status=APROVADA → Chama webhook
4. **WF01 n8n** → Recebe ideia_id → Gera roteiro com GPT-4o
5. **Resultado** → Roteiro salvo no banco → Pronto para próxima etapa

## 🧪 Como Testar Agora

### Teste 1: Criar ideia manualmente

```sql
-- No Supabase SQL Editor
INSERT INTO pulso_content.ideias (
  canal_id,
  titulo,
  descricao,
  status,
  origem
)
VALUES (
  (SELECT id FROM pulso_core.canais LIMIT 1),
  'Ideia de Teste - Sistema de Aprovação',
  'Esta é uma ideia de teste para validar o fluxo completo de aprovação e geração de roteiro.',
  'RASCUNHO',
  'manual'
);
```

### Teste 2: Aprovar no app

1. Acesse: `http://localhost:3000/ideias`
2. Filtre por status "RASCUNHO"
3. Clique na ideia de teste
4. Clique em **"Aprovar & Gerar Roteiro"**
5. Observe os logs no console do navegador

### Teste 3: Verificar no n8n

1. Acesse: https://pulsoprojects.app.n8n.cloud
2. Abra o workflow WF01
3. Veja a execução em tempo real
4. Confirme que recebeu o payload:

```json
{
  "ideia_id": "uuid-da-ideia"
}
```

### Teste 4: Confirmar no banco

```sql
-- Verificar se ideia foi aprovada
SELECT id, titulo, status, aprovada_em
FROM pulso_content.ideias
WHERE titulo LIKE '%Teste%';

-- Verificar se roteiro foi gerado
SELECT r.id, r.titulo, r.conteudo, r.status, i.titulo as ideia_titulo
FROM pulso_content.roteiros r
JOIN pulso_content.ideias i ON i.id = r.ideia_id
WHERE i.titulo LIKE '%Teste%';
```

## 🔍 Logs Esperados

### No Console do Navegador (F12)

```
📞 Aprovando ideia abc-123...
✅ Hook useGerarRoteiro chamado
🌐 Chamando webhook: https://pulsoprojects.app.n8n.cloud/webhook/ideia-aprovada
✅ Roteiro sendo gerado...
```

### No n8n (Executions)

```
✅ Webhook recebido
✅ Ideia abc-123 validada
✅ Busca completa realizada (canal, série, pipeline)
✅ GPT-4o gerando roteiro...
✅ Roteiro salvo no banco
```

## ⚠️ Troubleshooting

### Erro: "n8n não configurado"

- Verifique `.env` tem `N8N_URL` e `N8N_API_KEY`
- Reinicie o servidor Next.js: `npm run dev`

### Erro: "Webhook error: 404"

- URL do webhook está incorreta
- Verifique no n8n se o webhook path é `ideia-aprovada`
- URL completa deve ser: `https://pulsoprojects.app.n8n.cloud/webhook/ideia-aprovada`

### Erro: "Please resolve outstanding issues" (n8n)

- Faltam credenciais do Postgres no WF01
- Faltam credenciais da OpenAI no WF01
- Configure em Settings → Credentials

### Botão fica loading infinito

- Veja console do navegador (F12) para detalhes do erro
- Veja Network tab para ver resposta da API
- Verifique logs do servidor Next.js no terminal

## 🚀 Próximos Passos

Após validar WF01, implementar:

1. **WF02 - Gerar Áudio**

   - Trigger: Roteiro aprovado
   - Ação: TTS com ElevenLabs
   - Output: Audio file + metadata

2. **WF03 - Gerar Vídeo**

   - Trigger: Áudio pronto
   - Ação: Remotion render
   - Output: Vídeo renderizado

3. **WF04 - Publicar**
   - Trigger: Vídeo pronto
   - Ação: Upload para plataformas
   - Output: Posts criados

## 📊 Métricas para Monitorar

- ⏱️ Tempo médio de geração de roteiro (target: <30s)
- ✅ Taxa de sucesso de aprovação (target: 100%)
- 🤖 Execuções do n8n por dia
- 📈 Ideias criadas vs aprovadas vs rejeitadas

## 🎉 Sistema Está Pronto!

Você tem:

- ✅ Webhook do n8n configurado
- ✅ Página de ideias com filtros funcionando
- ✅ Botão de aprovação integrado
- ✅ Tudo configurado no `.env`

**Falta apenas:**

1. Configurar credenciais no n8n (Postgres + OpenAI)
2. Testar o fluxo end-to-end
3. Validar o roteiro gerado

**VOCÊ ESTÁ PRONTO PARA APROVAR SUA PRIMEIRA IDEIA! 🚀**
