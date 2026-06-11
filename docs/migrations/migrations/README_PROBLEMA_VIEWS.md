# 🚨 PROBLEMA: Kanban e Calendário Vazios

## 📊 Diagnóstico

**Situação:** Os dados existem no banco (31 registros), mas o frontend está vazio.

**Causa:** A view `vw_agenda_publicacao_detalhada` existe apenas em `pulso_content`, mas o frontend precisa dela em `public`.

---

## ✅ Solução (Execute nesta ordem)

### 1️⃣ Executar no Supabase SQL Editor

Abra o **Supabase Dashboard** → **SQL Editor** e execute:

```sql
-- Arquivo: create_public_view_agenda.sql
DROP VIEW IF EXISTS public.vw_agenda_publicacao_detalhada CASCADE;

CREATE OR REPLACE VIEW public.vw_agenda_publicacao_detalhada AS
SELECT * FROM pulso_content.vw_agenda_publicacao_detalhada;

GRANT SELECT ON public.vw_agenda_publicacao_detalhada TO anon, authenticated;

NOTIFY pgrst, 'reload schema';

-- Verificar se funcionou
SELECT COUNT(*) FROM public.vw_agenda_publicacao_detalhada;
```

**Resultado esperado:** `count: 31`

---

### 2️⃣ Verificar Permissões (se ainda não funcionar)

```sql
-- Verificar se anon/authenticated têm acesso
SELECT
    grantee,
    privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name = 'vw_agenda_publicacao_detalhada';
```

Deve retornar:

```
anon          | SELECT
authenticated | SELECT
```

---

### 3️⃣ Recarregar no Frontend

No terminal do projeto:

```bash
# Parar o dev server (Ctrl+C)
# Reiniciar
npm run dev
```

Acesse:

- http://localhost:3000/producao (Kanban)
- http://localhost:3000/calendario

---

## 🔍 Diagnóstico Adicional

Se ainda não funcionar, execute:

```sql
-- Arquivo: diagnostico_views.sql
SELECT
    schemaname,
    viewname,
    viewowner
FROM pg_views
WHERE viewname = 'vw_agenda_publicacao_detalhada';
```

Deve retornar **2 linhas**:

```
pulso_content | vw_agenda_publicacao_detalhada | postgres
public        | vw_agenda_publicacao_detalhada | postgres
```

---

## 📝 O Que Foi Feito

A view `vw_agenda_publicacao_detalhada` unifica:

- ✅ Canal e Série
- ✅ Ideia (título, status, prioridade, tags)
- ✅ Roteiro (última versão, status)
- ✅ Pipeline (status, prioridade, responsável)
- ✅ Plano de Publicação (data_inicio, intervalo_dias, hora_publicacao)
- ✅ Áudio e Vídeo (flags: tem_audio, tem_video)
- ✅ **datahora_publicacao_planejada** (campo calculado que combina pipeline + plano)

O frontend agora usa **UM ÚNICO SELECT** para buscar todos os dados! 🚀

---

## 🎯 Arquivos Importantes

- `supabase/migrations/create_public_view_agenda.sql` - SQL para criar a view
- `lib/hooks/use-producao.ts` - Hook atualizado
- `app/producao/page.tsx` - Kanban
- `app/calendario/page.tsx` - Calendário
