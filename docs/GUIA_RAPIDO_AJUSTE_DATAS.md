# 🚀 Atualização de Datas - Guia Rápido

## ⚡ Resumo Executivo

**O que aconteceu**: Início previsto para 01/12 não funcionou  
**O que temos**: 129 ideias aprovadas, estruturando roteiros  
**Nova data**: **10/12/2025 às 09:00** ✅  
**Ação necessária**: Executar 1 script SQL no Supabase

---

## 📋 Checklist de Execução

### ✅ Passo 1: Backup (Segurança)

Abra Supabase SQL Editor e execute:

```sql
CREATE TABLE pulso_content.pipeline_producao_backup_20241204 AS
SELECT * FROM pulso_content.pipeline_producao;
```

✅ **Resultado esperado**: "Success. No rows returned"

---

### ✅ Passo 2: Executar Ajuste

Abra o arquivo e copie TODO o conteúdo:

```
supabase/migrations/ajustar_datas_inicio_projeto.sql
```

Cole no SQL Editor e clique em **RUN**

✅ **Resultado esperado**: Ver mensagens como:

```
✅ PIPELINE atualizado: 49 items
✅ CALENDÁRIO DE PUBLICAÇÃO: 129 items agendados
✅ Primeira publicação: 2025-12-10
✅ Todas as datas foram ajustadas!
```

---

### ✅ Passo 3: Instalar Trigger (IMPORTANTE!)

Abra o arquivo:

```
supabase/migrations/trigger_auto_agendar_publicacao.sql
```

Cole no SQL Editor e clique em **RUN**

✅ **Resultado esperado**:

```
🧪 TESTE DO TRIGGER:
   ✅ Trigger instalado com sucesso!
   ✅ Data atribuída automaticamente: ...
   📌 Próximas inserções no pipeline receberão data automaticamente!
```

**O que isso faz?**: Garante que **novas ideias** criadas após hoje receberão automaticamente uma data de publicação no próximo slot disponível (9h, 15h ou 21h).

---

### ✅ Passo 4: Validar

Abra o arquivo:

```
supabase/migrations/validar_ajuste_datas.sql
```

Cole no SQL Editor e clique em **RUN**

✅ **Resultado esperado**:

- **CALENDÁRIO**: primeira_publicacao = 2025-12-10
- **items_agendados**: 129
- **media_posts_dia**: 3.00
- **CONFLITOS**: 0 linhas
- **PENDÊNCIAS**: 0 ideias_sem_data

---

## 📊 O Que Vai Mudar

### Antes

```
Primeira data prevista: 30/11/2025 ❌
Items com data_publicacao: 0 ❌
Calendário: Desorganizado ❌
```

### Depois

```
Primeira publicação: 10/12/2025 às 09:00 ✅
Items agendados: 129 ✅
Calendário: 3 posts/dia (9h, 15h, 21h) ✅
Período: 10/12/2025 a ~22/01/2026 ✅
```

---

## 🎯 Calendário Resultante

| Dia    | Data       | Posts | Horários            |
| ------ | ---------- | ----- | ------------------- |
| Terça  | 10/12/2025 | 3     | 09:00, 15:00, 21:00 |
| Quarta | 11/12/2025 | 3     | 09:00, 15:00, 21:00 |
| Quinta | 12/12/2025 | 3     | 09:00, 15:00, 21:00 |
| ...    | ...        | 3     | ...                 |
| Quarta | 22/01/2026 | 3     | 09:00, 15:00, 21:00 |

**Total**: 129 posts em ~43 dias

---

## 🔧 Se Algo Der Errado

### Reverter tudo:

```sql
BEGIN;
UPDATE pulso_content.pipeline_producao pp
SET
  data_prevista = bkp.data_prevista,
  data_publicacao = bkp.data_publicacao
FROM pulso_content.pipeline_producao_backup_20241204 bkp
WHERE pp.id = bkp.id;
COMMIT;
```

### Verificar estado atual:

```sql
SELECT
  COUNT(*) as total,
  COUNT(CASE WHEN data_publicacao IS NOT NULL THEN 1 END) as agendados,
  MIN(data_publicacao::date) as primeira,
  MAX(data_publicacao::date) as ultima
FROM pulso_content.pipeline_producao;
```

---

## 📈 Próximos Passos (Após Executar)

### Hoje (04/12)

1. ✅ Executar scripts SQL
2. ✅ Validar no dashboard: `/pipeline`
3. ✅ Verificar que WF01 está rodando

### Até 10/12

1. ⏳ Aguardar WF01 gerar roteiros (119 pendentes)
2. ⏳ Aprovar roteiros manualmente
3. ⏳ WF02 gerar áudios automaticamente
4. ⏳ Testar players no app

### 10/12 às 09:00

1. 🚀 **PRIMEIRO POST PUBLICADO**
2. 🚀 Manter cadência 3x/dia
3. 🚀 Monitorar pipeline

---

## 💡 Dicas

### Ajustar Frequência

Se quiser **2 posts/dia** em vez de 3:

```sql
-- Mudar de (ia.ordem / 3) para (ia.ordem / 2)
-- E ajustar horários (09:00 e 21:00 apenas)
```

### Ajustar Horários

Se quiser horários diferentes:

```sql
-- Modificar o CASE:
WHEN (ia.ordem % 3) = 0 THEN INTERVAL '0 hours'   -- 9h → trocar por '3 hours' = 12h
WHEN (ia.ordem % 3) = 1 THEN INTERVAL '6 hours'   -- 15h → trocar por '9 hours' = 18h
ELSE INTERVAL '12 hours'                           -- 21h → OK
```

### Adiar Início

Se quiser começar em **15/12** em vez de 10/12:

```sql
-- Trocar '2025-12-10 09:00:00' por '2025-12-15 09:00:00'
```

---

## 📞 Suporte

Algum problema? Verifique:

1. **Backup existe?**

```sql
SELECT COUNT(*) FROM pulso_content.pipeline_producao_backup_20241204;
```

2. **Datas aplicadas?**

```sql
SELECT MIN(data_publicacao), MAX(data_publicacao)
FROM pulso_content.pipeline_producao;
```

3. **Conflitos de horário?**

```sql
SELECT data_publicacao, COUNT(*)
FROM pulso_content.pipeline_producao
GROUP BY data_publicacao
HAVING COUNT(*) > 1;
```

---

## ✅ Quando Terminar

Você terá:

- ✅ 129 posts agendados (ideias existentes)
- ✅ Calendário organizado de 10/12 a 22/01
- ✅ 3 posts por dia em horários fixos
- ✅ Pipeline alinhado com nova data de início
- ✅ Views do app mostrando datas corretas
- ✅ **Trigger instalado: novas ideias receberão datas automaticamente!**

**Tempo estimado de execução**: 3-5 minutos ⚡

---

## 🔄 Como Funciona o Agendamento Automático

### Para Ideias Existentes (129)
Usam o script `ajustar_datas_inicio_projeto.sql` que distribui datas manualmente.

### Para Novas Ideias (futuras)
O **trigger** instalado funciona assim:

1. 📝 Você cria uma nova ideia no sistema
2. 🔍 Trigger busca a última data de publicação agendada
3. 🎯 Calcula o próximo slot disponível:
   - Se última foi 10/12 às 9h → próxima será 10/12 às 15h
   - Se última foi 10/12 às 15h → próxima será 10/12 às 21h
   - Se última foi 10/12 às 21h → próxima será 11/12 às 9h
4. ✅ Atribui automaticamente `data_publicacao` e `data_prevista`

**Exemplo**:
```
Última ideia agendada: 22/01/2026 às 21:00
Nova ideia criada: Recebe automaticamente 23/01/2026 às 09:00
```

**Vantagem**: Você nunca precisa se preocupar com datas novamente! O calendário se expande automaticamente.
