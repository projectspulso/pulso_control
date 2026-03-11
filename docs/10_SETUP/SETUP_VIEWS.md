# 🚀 Setup do Dashboard PULSO Control

## Problema Atual

O dashboard está com erro `400 Bad Request` porque faltam views no schema `public` do Supabase.

## ✅ Solução: Criar Views no Supabase

### Passo 1: Abra o Supabase Dashboard

1. Acesse: https://supabase.com/dashboard
2. Selecione o projeto: **nlcisbfdiokmipyihtuz**
3. No menu lateral, clique em **SQL Editor**

### Passo 2: Execute o SQL

Cole e execute o seguinte SQL:

```sql
-- CRIAR VIEWS FALTANTES NO SCHEMA PUBLIC

-- 1. Workflows
DROP VIEW IF EXISTS public.workflows CASCADE;
CREATE VIEW public.workflows AS SELECT * FROM pulso_automation.workflows;

-- 2. Execuções de Workflows
DROP VIEW IF EXISTS public.workflow_execucoes CASCADE;
CREATE VIEW public.workflow_execucoes AS SELECT * FROM pulso_automation.workflow_execucoes;

-- 3. Conteúdos
DROP VIEW IF EXISTS public.conteudos CASCADE;
CREATE VIEW public.conteudos AS SELECT * FROM pulso_content.conteudos;

-- 4. Variantes de Conteúdo
DROP VIEW IF EXISTS public.conteudo_variantes CASCADE;
CREATE VIEW public.conteudo_variantes AS SELECT * FROM pulso_content.conteudo_variantes;

-- 5. Posts
DROP VIEW IF EXISTS public.posts CASCADE;
CREATE VIEW public.posts AS SELECT * FROM pulso_distribution.posts;

-- 6. Logs de Posts
DROP VIEW IF EXISTS public.posts_logs CASCADE;
CREATE VIEW public.posts_logs AS SELECT * FROM pulso_distribution.posts_logs;

-- 7. Canais-Plataformas
DROP VIEW IF EXISTS public.canais_plataformas CASCADE;
CREATE VIEW public.canais_plataformas AS SELECT * FROM pulso_core.canais_plataformas;

-- 8. Assets
DROP VIEW IF EXISTS public.assets CASCADE;
CREATE VIEW public.assets AS SELECT * FROM pulso_assets.assets;

-- 9. Eventos
DROP VIEW IF EXISTS public.eventos CASCADE;
CREATE VIEW public.eventos AS SELECT * FROM pulso_analytics.eventos;
```

### Passo 3: Verificar

Depois de executar o SQL, execute esta query para confirmar:

```sql
SELECT schemaname, viewname
FROM pg_views
WHERE schemaname = 'public'
  AND viewname IN (
    'workflows', 'workflow_execucoes', 'conteudos',
    'canais_plataformas', 'posts', 'assets'
  )
ORDER BY viewname;
```

Deve retornar 9 views.

### Passo 4: Recarregar Dashboard

1. Volte para http://localhost:3000
2. Recarregue a página (F5)
3. Os dados devem aparecer! 🎉

---

## 📊 Dados Disponíveis

Depois de criar as views, você verá:

- ✅ **30 ideias** (temas dark/mistérios/curiosidades)
- ✅ **5 workflows** N8N
- ✅ **25 execuções** de workflows
- ✅ **1 canal**: Pulso Dark PT
- ✅ **2 séries**: Curiosidades Dark + Mistérios Urbanos
- ✅ **6 plataformas** conectadas

---

## 🔧 Troubleshooting

### Erro: "relation does not exist"

Execute o SQL acima no Supabase SQL Editor.

### Erro: "placeholder.supabase.co"

As variáveis de ambiente estão incorretas. Verifique `.env`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://nlcisbfdiokmipyihtuz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

Reinicie o servidor: `npm run dev`

### Dashboard vazio

1. Verifique se as views foram criadas (passo 3 acima)
2. Verifique se há dados: `SELECT COUNT(*) FROM public.ideias;`
3. Se não houver dados, execute: `node database/sql/seeds/seed-via-api.js`

---

## 📁 Arquivos de Referência

- **SQL completo**: `content/database/create_missing_views.sql`
- **Script helper**: `content/database/create-missing-views.js`
- **Seed de dados**: `database/sql/seeds/seed-via-api.js`

---

## 🎯 Próximos Passos

Depois do dashboard funcionar:

1. ✅ Configurar variáveis de ambiente no Vercel
2. ✅ Deploy em produção
3. ✅ Conectar workflows N8N reais
4. ✅ Começar a gerar conteúdo!
