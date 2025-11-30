# 🗄️ SQL para Executar no Supabase

## ✅ Checklist de Execução

### 1️⃣ Verificar se pipeline_producao existe

Execute no **SQL Editor** do Supabase:

```sql
-- Verificar se view pipeline_producao existe no schema public
SELECT COUNT(*) 
FROM information_schema.views 
WHERE table_schema = 'public' 
  AND table_name = 'pipeline_producao';
```

**Resultado esperado:** `count = 1` ✅

Se retornar `0`, execute:
```sql
-- Executar arquivo completo
-- supabase/migrations/20241121_create_pipeline_producao.sql
```

---

### 2️⃣ Criar tabela logs_workflows

```sql
-- =====================================================
-- MIGRATION: Logs de Workflows n8n
-- =====================================================
-- Criar tabela de logs para workflows n8n
CREATE TABLE IF NOT EXISTS pulso_content.logs_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('sucesso', 'erro', 'em_andamento')),
    detalhes JSONB DEFAULT '{}'::jsonb,
    erro_mensagem TEXT,
    tempo_execucao_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_logs_workflows_created_at 
    ON pulso_content.logs_workflows(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_logs_workflows_workflow_name 
    ON pulso_content.logs_workflows(workflow_name);

CREATE INDEX IF NOT EXISTS idx_logs_workflows_status 
    ON pulso_content.logs_workflows(status);

-- Row Level Security
ALTER TABLE pulso_content.logs_workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Logs públicos leitura" 
    ON pulso_content.logs_workflows 
    FOR SELECT 
    USING (true);

CREATE POLICY "Logs públicos escrita" 
    ON pulso_content.logs_workflows 
    FOR ALL 
    USING (true);

-- View pública para acesso via Supabase client
CREATE OR REPLACE VIEW public.logs_workflows AS
SELECT 
    id,
    workflow_name,
    status,
    detalhes,
    erro_mensagem,
    tempo_execucao_ms,
    created_at
FROM pulso_content.logs_workflows
ORDER BY created_at DESC;

-- Grant de acesso
GRANT SELECT ON public.logs_workflows TO anon, authenticated;

-- Comentários
COMMENT ON TABLE pulso_content.logs_workflows IS 'Logs de execução dos workflows n8n (WF00-WF04)';
COMMENT ON VIEW public.logs_workflows IS 'View pública de logs de workflows para frontend';
```

---

### 3️⃣ Verificar se criou corretamente

```sql
-- Verificar tabela
SELECT table_schema, table_name 
FROM information_schema.tables 
WHERE table_name = 'logs_workflows';

-- Verificar view pública
SELECT COUNT(*) 
FROM information_schema.views 
WHERE table_schema = 'public' 
  AND table_name = 'logs_workflows';

-- Testar insert
INSERT INTO pulso_content.logs_workflows (
    workflow_name,
    status,
    detalhes
) VALUES (
    'WF00 - Gerar Ideias',
    'sucesso',
    '{"ideias_geradas": 5, "canal": "YouTube Principal"}'::jsonb
);

-- Verificar se aparece na view pública
SELECT * FROM public.logs_workflows LIMIT 5;
```

---

### 4️⃣ (Opcional) Criar view n8n_roteiro_completo

Se você tiver o arquivo `supabase/views/n8n_roteiro_completo.sql`, execute:

```sql
-- Ver arquivo: supabase/views/n8n_roteiro_completo.sql
```

---

## 🎯 Resumo

Após executar os SQLs acima:

✅ `public.pipeline_producao` → Já existia  
✅ `public.logs_workflows` → Criada agora  
✅ Frontend → Pode consumir ambas as views  
✅ n8n → Pode inserir logs via Postgres node  

---

## 🔧 Troubleshooting

### Erro: "schema pulso_content does not exist"

```sql
CREATE SCHEMA IF NOT EXISTS pulso_content;
```

### Erro: "permission denied"

Certifique-se de estar executando como **postgres** ou **service_role**.

### Logs não aparecem no frontend

Verifique RLS:
```sql
-- Ver policies ativas
SELECT * FROM pg_policies 
WHERE tablename = 'logs_workflows';
```

Se não houver policies, execute novamente a seção RLS do SQL acima.
