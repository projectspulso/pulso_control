# 🔍 RELATÓRIO DE TESTES - Conexões com Banco de Dados

**Data:** 29/11/2025  
**Status Geral:** ✅ 5 de 7 testes passaram (71%)

---

## ✅ CONEXÕES FUNCIONANDO (5/7)

| Tabela/View                         | Schema        | Status              |
| ----------------------------------- | ------------- | ------------------- |
| `canais`                            | public        | ✅ OK (3 registros) |
| `ideias`                            | public        | ✅ OK (3 registros) |
| `roteiros`                          | public        | ✅ OK (3 registros) |
| `pipeline_producao`                 | pulso_content | ✅ OK (3 registros) |
| `vw_pulso_calendario_publicacao_v2` | public        | ✅ OK (3 registros) |

---

## ⚠️ PROBLEMAS ENCONTRADOS (2/7)

### 1. `audios` (pulso_content)

**Erro:** `permission denied for table audios`

**Causa:** Tabela existe mas não tem permissão de acesso via API (RLS)

**Solução:**

```sql
-- Executar no Supabase SQL Editor:
GRANT SELECT ON pulso_content.audios TO anon, authenticated;

-- OU criar policy RLS:
ALTER TABLE pulso_content.audios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON pulso_content.audios
FOR SELECT USING (true);
```

---

### 2. `n8n_roteiro_completo` (pulso_content)

**Erro:** `Could not find the table 'public.n8n_roteiro_completo' in the schema cache`

**Causa:** View não foi criada no banco ainda

**Solução:**

```sql
-- Executar no Supabase SQL Editor:
-- (Copiar conteúdo de: supabase/views/n8n_roteiro_completo.sql)

CREATE OR REPLACE VIEW pulso_content.n8n_roteiro_completo AS
SELECT r.id as roteiro_id,
    r.ideia_id,
    r.titulo as roteiro_titulo,
    r.conteudo_md,
    r.duracao_estimado_segundos,
    r.status as roteiro_status,
    r.metadata as metadata_roteiro,
    r.created_at as roteiro_created_at,
    r.updated_at as roteiro_updated_at,
    i.canal_id,
    i.titulo as ideia_titulo,
    i.descricao as ideia_descricao,
    i.metadata as metadata_ideia,
    c.nome as canal_nome,
    c.slug as canal_slug,
    c.descricao as canal_descricao,
    c.idioma as canal_idioma,
    c.status as canal_status,
    c.metadata as metadata_canal
FROM pulso_content.roteiros r
    JOIN pulso_content.ideias i ON i.id = r.ideia_id
    LEFT JOIN pulso_core.canais c ON c.id = i.canal_id;

GRANT SELECT ON pulso_content.n8n_roteiro_completo TO postgres, anon, authenticated;

-- Criar view em public para facilitar acesso do app:
CREATE OR REPLACE VIEW public.n8n_roteiro_completo AS
SELECT * FROM pulso_content.n8n_roteiro_completo;

GRANT SELECT ON public.n8n_roteiro_completo TO anon, authenticated;
```

---

## 📋 CHECKLIST DE AÇÕES NECESSÁRIAS

- [ ] Executar SQL para criar view `n8n_roteiro_completo`
- [ ] Configurar permissões na tabela `audios`
- [ ] Re-testar conexões após executar SQLs
- [ ] Fazer build da aplicação

---

## 🎯 CONCLUSÃO

O banco está **quase 100% funcional**. Os problemas são apenas de:

1. **Permissões** (RLS na tabela audios)
2. **View não criada** (n8n_roteiro_completo)

Ambos são **fáceis de resolver** executando os SQLs acima no Supabase SQL Editor.

---

## 📝 PRÓXIMO PASSO

Execute os SQLs acima e depois rode:

```bash
npm run build
```
