# 🔍 RELATÓRIO DE VERIFICAÇÃO DO BANCO SUPABASE

**Data**: 26/11/2025  
**Status**: ⚠️ PROBLEMAS ENCONTRADOS

---

## 📊 RESUMO EXECUTIVO

O banco está **organizado** (schemas `pulso_*` criados), mas as **views públicas** estão **faltando**, causando erros 404 no frontend.

### Problemas Identificados:

1. ❌ **View `public.canais`** não existe
2. ❌ **View `public.ideias`** não existe
3. ❌ **View `public.roteiros`** não existe
4. ❌ **View `public.pipeline_producao`** não existe
5. ❌ **View `public.conteudos_producao`** não existe
6. ❌ **View `public.publicacoes`** não existe
7. ✅ **View `public.series`** existe (5 registros)
8. ✅ **View `public.plataformas`** existe (5 registros)

### Dados nas Tabelas Base:

- ✅ `pulso_content.ideias`: 5 registros
- ✅ `pulso_content.roteiros`: 5 registros
- ✅ `pulso_core.series`: 21 registros
- ❌ `pulso_content.pipeline_producao`: Tabela não encontrada no schema cache

---

## 🛠️ SOLUÇÃO

### Arquivo SQL criado:

```
supabase/migrations/fix_missing_views.sql
```

### O que o SQL faz:

1. ✅ Recria todas as views públicas (`public.canais`, `public.ideias`, etc.)
2. ✅ Cria triggers INSTEAD OF para INSERT/UPDATE/DELETE nas views
3. ✅ Configura permissões (GRANT) para `anon` e `authenticated`
4. ✅ Adiciona comentários explicativos
5. ✅ Recarrega schema cache do PostgREST

---

## 📝 PRÓXIMOS PASSOS

### 1️⃣ Executar SQL no Supabase Dashboard

1. Acesse: https://supabase.com/dashboard/project/nlcisbfdiokmipyihtuz/sql
2. Cole o conteúdo de `fix_missing_views.sql`
3. Execute o SQL
4. Aguarde mensagem: "Views criadas com sucesso!"

### 2️⃣ Verificar se funcionou

Execute o script de verificação:

```bash
node verify-database.js
```

Resultado esperado:

```
✅ canais                    | X registros
✅ series                    | 21 registros
✅ ideias                    | X registros
✅ roteiros                  | X registros
✅ pipeline_producao         | X registros
✅ conteudos_producao        | X registros
✅ publicacoes               | X registros
```

### 3️⃣ Testar no Frontend

1. Acesse: http://localhost:3000/organograma
2. Verifique se os canais aparecem
3. Clique em um canal para expandir séries
4. Clique em uma série para ver ideias/roteiros

---

## 🗂️ ESTRUTURA CORRETA DO BANCO

### Schemas:

- `pulso_core`: Canais, séries, plataformas, tags, usuários
- `pulso_content`: Ideias, roteiros, pipeline_producao, conteúdos
- `pulso_distribution`: Posts, publicações
- `pulso_analytics`: Métricas, eventos
- `pulso_assets`: Arquivos, assets
- `pulso_automation`: Workflows

### Views Públicas (schema `public`):

Todas as views apontam para as tabelas nos schemas `pulso_*`:

- `public.canais` → `pulso_core.canais`
- `public.series` → `pulso_core.series`
- `public.ideias` → `pulso_content.ideias`
- `public.roteiros` → `pulso_content.roteiros`
- `public.pipeline_producao` → `pulso_content.pipeline_producao`
- `public.publicacoes` → `pulso_distribution.posts`

---

## 🔧 PROBLEMAS ADICIONAIS ENCONTRADOS

### 1. Tabela `pipeline_producao` não acessível

```
❌ Could not find the table 'pulso_content.pipeline_producao' in the schema cache
```

**Possíveis causas:**

- Tabela não existe no schema `pulso_content`
- Schema cache desatualizado
- Permissões RLS bloqueando acesso

**Verificar:**

```sql
SELECT * FROM information_schema.tables
WHERE table_schema = 'pulso_content'
  AND table_name = 'pipeline_producao';
```

### 2. Dados vazios nas views públicas

```
⚠️  VAZIO canais                    | Total: 0
⚠️  VAZIO ideias                    | Total: 0
⚠️  VAZIO roteiros                  | Total: 0
```

Mas as tabelas base têm dados:

```
✅ pulso_content.ideias              | 5 registros
✅ pulso_content.roteiros            | 5 registros
```

**Causa**: Views públicas não existem ou não têm permissões.

**Solução**: Executar `fix_missing_views.sql`

---

## 📋 CHECKLIST DE VALIDAÇÃO

Após executar o SQL, verificar:

- [ ] View `public.canais` existe e retorna dados
- [ ] View `public.series` existe e retorna dados
- [ ] View `public.ideias` existe e retorna dados
- [ ] View `public.roteiros` existe e retorna dados
- [ ] View `public.pipeline_producao` existe e retorna dados
- [ ] View `public.conteudos_producao` existe e retorna dados (alias)
- [ ] View `public.publicacoes` existe e retorna dados
- [ ] Triggers funcionando (testar INSERT em uma view)
- [ ] Frontend consegue buscar canais
- [ ] Organograma expande corretamente

---

## 🎯 CONCLUSÃO

O banco está **estruturado corretamente** nos schemas `pulso_*`, mas as **views públicas** (`public.*`) que o frontend usa via API REST **não existem**.

A solução é simples: **executar o SQL** `fix_missing_views.sql` no Supabase Dashboard.

Após isso, o sistema funcionará 100%! 🚀
