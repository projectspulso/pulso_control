# 🚀 Script de População Completa do Banco de Dados

## Execute estes scripts no Supabase SQL Editor nesta ordem:

### 1️⃣ Popular Roteiros (30 roteiros)

```sql
-- Copie e cole o conteúdo de: seed_roteiros.sql
```

### 2️⃣ Popular Pipeline Kanban

```sql
-- Copie e cole o conteúdo de: seed_pipeline.sql
```

### 3️⃣ Popular Calendário de Publicações (60 publicações)

```sql
-- Copie e cole o conteúdo de: seed_calendario.sql
```

---

## ✅ Depois de executar, você terá:

- **~30 roteiros** com conteúdo real em Markdown
- **~30 itens no Pipeline** distribuídos nas 6 etapas
- **~60 publicações agendadas** para próximos 30 dias
- **10 publicações recorrentes** (séries)

---

## 🧪 Como Executar:

1. Acesse: https://supabase.com/dashboard/project/nlcisbfdiokmipyihtuz/sql
2. Crie uma nova query
3. Cole o conteúdo de **seed_roteiros.sql**
4. Clique em **Run**
5. Repita para os outros 2 arquivos

---

## 📊 Verificar Dados Criados:

```sql
-- Ver resumo geral
SELECT
  'Roteiros' as tabela, COUNT(*) as total FROM pulso_content.roteiros
UNION ALL
SELECT 'Pipeline', COUNT(*) FROM pulso_content.pipeline_producao
UNION ALL
SELECT 'Publicações', COUNT(*) FROM pulso_content.publicacoes_agendadas;

-- Ver distribuição do Pipeline
SELECT etapa_atual, COUNT(*)
FROM pulso_content.pipeline_producao
GROUP BY etapa_atual;

-- Ver próximas publicações
SELECT data_agendada, COUNT(*)
FROM pulso_content.publicacoes_agendadas
WHERE data_agendada >= CURRENT_DATE
GROUP BY data_agendada
ORDER BY data_agendada
LIMIT 7;
```

---

## 🎯 Próximos Passos Após Popular:

1. ✅ Acessar https://pulso-control.vercel.app
2. ✅ Testar página /ideias (deve mostrar 130 ideias)
3. ✅ Testar página /roteiros (deve mostrar 30 roteiros)
4. ✅ Testar página /producao (Kanban com ~30 cards)
5. ✅ Testar página /calendario (60 publicações agendadas)
6. ✅ Criar nova ideia pelo formulário
7. ✅ Criar novo roteiro
8. ✅ Mover card no Kanban (drag & drop)
9. ✅ Agendar publicação no calendário

---

**Tudo pronto para testar o app com dados reais!** 🚀
