# ✅ Checklist - Verificar se Workflows Estão Funcionando

## 🎯 Verificação Rápida (5 minutos)

### 1️⃣ **n8n está rodando?**

Acesse: `https://pulsoprojects.app.n8n.cloud`

**✅ Verificar:**
- [ ] Login funciona
- [ ] Dashboard carrega
- [ ] Menu "Workflows" está acessível

---

### 2️⃣ **Workflows estão ativos?**

No n8n, vá em **Workflows** e verifique:

- [ ] **WF00_Gerar_Ideias** - Toggle VERDE (Ativo)
- [ ] **WF01_Gerar_Roteiro** - Toggle VERDE (Ativo)
- [ ] **WF02_Gerar_Audio** - Toggle VERDE (Ativo)
- [ ] **WF03_Preparar_Video** - Toggle VERDE (Ativo)
- [ ] **WF04_Publicar** - Toggle VERDE (Ativo)

**Se algum estiver vermelho (inativo):**
1. Clique no workflow
2. Clique no toggle no canto superior direito
3. Deve ficar VERDE

---

### 3️⃣ **Credenciais configuradas?**

No n8n, vá em **Settings** → **Credentials**

**✅ Deve ter 3 credenciais:**
- [ ] `Postgres supabase` (PostgreSQL)
- [ ] `OpenAi pulso_control` (OpenAI)
- [ ] `Supabase Storage – Pulso` (Supabase)

**Se faltar alguma:**
- Criar seguindo o guia `GUIA_IMPORTACAO_COMPLETO.md`

---

### 4️⃣ **Há execuções recentes?**

No n8n, vá em **Executions**

**✅ Verificar:**
- [ ] Há pelo menos 1 execução listada
- [ ] Status da última execução: **Success** (verde)
- [ ] Se houver erro (vermelho), clicar e ver detalhes

**Execuções esperadas:**
- **WF00**: 1x por dia às 3h (automático)
- **WF03**: A cada 30 minutos (automático)
- **WF04**: 3x por dia (6h, 12h, 18h) - automático
- **WF01, WF02**: Quando você aprovar ideia/roteiro (manual)

---

### 5️⃣ **Banco de dados tem dados?**

No **Supabase** → **SQL Editor**, execute:

```sql
-- Ver últimos logs dos workflows
SELECT workflow_name, status, created_at
FROM logs_workflows
ORDER BY created_at DESC
LIMIT 5;
```

**✅ Resultado esperado:**
- Pelo menos 1 linha com dados
- Status = `sucesso`

**Se retornar 0 linhas:**
- Workflows ainda não executaram
- Aguarde ou execute manualmente no n8n

---

### 6️⃣ **Teste end-to-end no app**

No app **PULSO Control** (`http://localhost:3000`):

#### Teste 1: Aprovar Ideia → Gerar Roteiro

1. [ ] Vá em `/ideias`
2. [ ] Clique em uma ideia com status **RASCUNHO**
3. [ ] Clique no botão verde **"✓ Aprovar e Gerar Roteiro"**
4. [ ] Aguarde 10-20 segundos
5. [ ] Vá em `/roteiros`
6. [ ] **Deve aparecer um roteiro novo** com o título da ideia

**Se não aparecer:**
- Verificar console do navegador (F12)
- Verificar execuções no n8n
- Verificar logs_workflows no Supabase

---

#### Teste 2: Aprovar Roteiro → Gerar Áudio

1. [ ] Vá em `/roteiros`
2. [ ] Clique em um roteiro com status **RASCUNHO**
3. [ ] Clique no botão verde **"✓ Aprovar e Gerar Áudio"**
4. [ ] Aguarde 30-60 segundos (gera áudio TTS)
5. [ ] Verifique no Supabase SQL:

```sql
SELECT id, url, duracao_segundos
FROM audios
ORDER BY created_at DESC
LIMIT 1;
```

**✅ Deve retornar 1 linha com:**
- URL do áudio no Supabase Storage
- Duração em segundos

---

### 7️⃣ **Monitor de Pipeline**

No app, vá em `/monitor`:

**✅ Verificar:**
- [ ] Página carrega sem erros
- [ ] Mostra estatísticas dos 5 workflows
- [ ] Lista de logs está populada
- [ ] Cards de status mostram números

**Se aparecer erro 500:**
- Verificar se `logs_workflows` foi criada no Supabase
- Executar SQL: `docs/SQL_EXECUTAR_SUPABASE.md`

---

## 🎯 Resultado Final

Se **TODOS** os itens acima estiverem ✅:

### ✅ **WORKFLOWS 100% FUNCIONANDO!**

Você pode:
- Aprovar ideias e gerar roteiros automaticamente
- Aprovar roteiros e gerar áudios TTS
- Ver logs em tempo real no `/monitor`
- Aguardar WF03 criar metadata de vídeos
- Aguardar WF04 criar variantes para publicação

---

## ❌ Se algo falhar:

### Troubleshooting Rápido

**Erro 1: "Webhook não responde"**
```bash
# Verificar se n8n está online
curl https://pulsoprojects.app.n8n.cloud/healthz
```

**Erro 2: "Credenciais inválidas"**
- Recriar credenciais no n8n
- Seguir exatamente os nomes do guia

**Erro 3: "Tabela não existe"**
- Executar SQLs em `docs/SQL_EXECUTAR_SUPABASE.md`

**Erro 4: "OpenAI API error"**
- Verificar se chave OpenAI está válida no `.env`
- Verificar saldo da conta OpenAI

---

## 📊 Métricas de Sucesso

Execute no Supabase SQL Editor:

```sql
-- Dashboard de métricas
SELECT
  (SELECT COUNT(*) FROM ideias WHERE metadata->>'gerado_por_ia' = 'true') as ideias_ia,
  (SELECT COUNT(*) FROM roteiros WHERE gerado_por = 'IA') as roteiros_ia,
  (SELECT COUNT(*) FROM audios) as audios_gerados,
  (SELECT COUNT(*) FROM logs_workflows WHERE status = 'sucesso') as workflows_sucesso,
  (SELECT COUNT(*) FROM logs_workflows WHERE status = 'erro') as workflows_erro;
```

**✅ Métricas saudáveis:**
- `ideias_ia` > 0
- `roteiros_ia` > 0
- `audios_gerados` > 0
- `workflows_sucesso` > `workflows_erro`

---

## 🚀 Tudo OK? Próximos Passos

1. Deixar WF00 rodando diariamente (gera 5 ideias/dia)
2. Aprovar as melhores ideias
3. Revisar roteiros gerados
4. Aprovar roteiros para gerar áudios
5. Montar vídeos com os áudios
6. Publicar nos canais

**Produção estimada:**
- 5 ideias/dia automáticas
- 2-3 roteiros/dia (você aprova)
- 2-3 áudios/dia (TTS automático)
- 2-3 vídeos/semana (você monta)

---

**✅ Automação PULSO 100% Operacional!** 🎉
