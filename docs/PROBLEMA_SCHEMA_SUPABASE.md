# 🔍 Problema: Views do Schema Public

## 🎯 Descoberta

O erro `permission denied for schema pulso_content` ocorre porque:

1. **Frontend** usa `supabase.from('ideias')` → Acessa schema **PUBLIC**
2. **Backend API** também deve usar schema **PUBLIC**
3. **n8n** acessa diretamente `pulso_content.ideias` (tem permissões diferentes)

## 🏗️ Arquitetura Real

```
┌─────────────────────────────────────────┐
│         SCHEMA: pulso_content           │
│  (Tabelas reais, acesso via n8n)       │
│                                         │
│  • pulso_content.ideias                │
│  • pulso_content.roteiros               │
│  • pulso_content.conteudos              │
└─────────────────────────────────────────┘
                    ↓
        (Views com RLS)
                    ↓
┌─────────────────────────────────────────┐
│         SCHEMA: public                  │
│  (Views para frontend/API)              │
│                                         │
│  • public.ideias (view)                 │
│  • public.roteiros (view)               │
│  • public.conteudos (view)              │
└─────────────────────────────────────────┘
```

## ❌ Problema Atual

A view `public.ideias` provavelmente:
- **Existe** (senão o frontend não funcionaria)
- **Tem SELECT habilitado** (leitura funciona)
- **NÃO tem UPDATE habilitado** (erro 42501)

## ✅ Solução

### Opção 1: Habilitar UPDATE na View (Recomendado)
```sql
-- No Supabase SQL Editor
GRANT UPDATE ON public.ideias TO authenticated;
GRANT UPDATE ON public.ideias TO service_role;

-- Verificar permissões atuais
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
  AND table_name = 'ideias';
```

### Opção 2: Criar INSTEAD OF Trigger
```sql
-- Se a view não suporta UPDATE direto
CREATE OR REPLACE FUNCTION public.update_ideia()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE pulso_content.ideias
  SET 
    status = NEW.status,
    titulo = NEW.titulo,
    descricao = NEW.descricao,
    -- ... outros campos
    updated_at = NOW()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ideias_update_trigger
INSTEAD OF UPDATE ON public.ideias
FOR EACH ROW
EXECUTE FUNCTION public.update_ideia();
```

### Opção 3: Usar Direct Table Access no Backend
```typescript
// Apenas no backend (API routes) acessar tabela direta
const { data, error } = await supabase
  .schema('pulso_content')
  .from('ideias')
  .update({ status })
  .eq('id', id)
```

## 🧪 Como Verificar

### 1. Verificar se View Existe
```sql
SELECT 
  schemaname, 
  viewname, 
  definition 
FROM pg_views 
WHERE schemaname = 'public' 
  AND viewname = 'ideias';
```

### 2. Verificar Permissões da View
```sql
SELECT 
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name = 'ideias';
```

### 3. Verificar se Update Funciona
```sql
-- Testar update direto no SQL Editor
UPDATE public.ideias 
SET status = 'APROVADA'
WHERE id = '2b226a1e-0f4f-4208-bfaf-0e41e95db6d6';

-- Se funcionar aqui mas não na API, o problema é de RLS ou permissões do service_role
```

## 📝 Próximos Passos

1. ✅ Acessar Supabase SQL Editor
2. ✅ Verificar estrutura da view `public.ideias`
3. ✅ Verificar permissões (GRANT)
4. ✅ Testar UPDATE manual
5. ✅ Aplicar solução (Grant ou Trigger)
6. ✅ Testar endpoint novamente

## 🔗 Referências

- [Supabase Views Documentation](https://supabase.com/docs/guides/database/postgres/views)
- [PostgreSQL Updatable Views](https://www.postgresql.org/docs/current/sql-createview.html#SQL-CREATEVIEW-UPDATABLE-VIEWS)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
