# 🚀 SQLs para Executar no Supabase

## ⚠️ IMPORTANTE: Execute na ordem indicada!

### 1️⃣ CRÍTICO - Corrigir Frontend Vazio (Kanban/Calendário)

**Arquivo:** `supabase/migrations/create_public_view_agenda.sql`

Acesse: https://supabase.com/dashboard/project/nlcisbfdiokmipyihtuz/sql/new

```sql
-- Cole o conteúdo de create_public_view_agenda.sql aqui
-- Esse SQL cria a view pública que o frontend precisa para acessar os dados
```

**Verificar depois:**

```sql
SELECT COUNT(*) FROM public.vw_agenda_publicacao_detalhada;
-- Deve retornar 31 registros
```

---

### 2️⃣ Habilitar Credenciais OAuth das Plataformas

**Arquivo:** `supabase/migrations/create_plataformas_e_configuracoes.sql`

```sql
-- Cole o conteúdo de create_plataformas_e_configuracoes.sql aqui
-- Cria:
-- - Tabela pulso_core.plataforma_credenciais (OAuth tokens)
-- - Tabela pulso_core.configuracoes (n8n URL, API keys)
-- - Views públicas seguras (SEM expor secrets)
-- - RLS policies
```

**Verificar depois:**

```sql
-- Ver plataformas conectadas
SELECT * FROM public.plataformas_conectadas;

-- Ver configurações do n8n
SELECT * FROM public.configuracoes WHERE categoria = 'n8n';
```

---

## ✅ Status Atual

### Já temos:

- ✅ 6 plataformas cadastradas (YouTube, TikTok, Instagram, Facebook, Kwai)
- ✅ View `public.plataformas` funcionando
- ✅ Enum de tipos de plataforma
- ✅ 31 conteúdos na pipeline de produção

### Falta criar:

- ⏳ Tabela de credenciais OAuth (tokens, secrets)
- ⏳ Tabela de configurações do sistema (n8n)
- ⏳ View pública da agenda (para Kanban/Calendário)

---

## 📋 Ordem de Execução

1. Execute `create_public_view_agenda.sql` → **Desbloqueia Kanban e Calendário**
2. Execute `create_plataformas_e_configuracoes.sql` → **Habilita OAuth e configurações**
3. Acesse `/settings` no frontend → **Configure n8n e conecte plataformas**

---

## 🔗 Link Direto

https://supabase.com/dashboard/project/nlcisbfdiokmipyihtuz/sql/new

---

## 💡 Próximos Passos Depois

Após executar os SQLs:

1. **Testar Kanban/Calendário** - Devem aparecer os 31 conteúdos
2. **Configurar n8n** - URL e API Key em `/settings`
3. **Conectar Plataformas** - Implementar fluxo OAuth
4. **Testar Webhooks** - Publicação automática via n8n

---

## 🐛 Se der erro

```sql
-- Verificar se tabelas existem
SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_name IN ('plataforma_credenciais', 'configuracoes')
AND table_schema = 'pulso_core';

-- Verificar se views existem
SELECT schemaname, viewname
FROM pg_views
WHERE viewname IN ('vw_agenda_publicacao_detalhada', 'plataformas_conectadas', 'configuracoes')
ORDER BY schemaname;
```
