# 📅 Ajuste de Datas - Início do Projeto

## Contexto

**Data original planejada**: 01/12/2025  
**Nova data de início**: 10/12/2025  
**Ajuste**: +9 dias

**Motivo**: Dia 1 de dezembro não funcionou conforme planejado. Temos 129 ideias criadas e ainda estamos estruturando os roteiros. Projeção realista para início: **10 de dezembro de 2025**.

---

## 📊 Estado Atual (04/12/2025)

### Conteúdo Criado

- ✅ **129 ideias** aprovadas (119 APROVADA + 10 RASCUNHO)
- ✅ **1 roteiro** criado (teste de aprovação)
- ❌ **0 áudios** gerados (aguardando WF02)
- ❌ **0 vídeos** gerados

### Datas no Sistema

- **Primeira ideia**: 20/11/2025
- **Primeiro log workflow**: 01/12/2025
- **Primeira data prevista**: 30/11/2025 (desatualizada)
- **49 items** com `data_prevista` definida

---

## 🔧 Alterações Realizadas

### 1. Pipeline - Datas Previstas

**Query**: Adiciona +9 dias a todas as `data_prevista` existentes

```sql
UPDATE pulso_content.pipeline_producao
SET
  data_prevista = data_prevista + INTERVAL '9 days',
  updated_at = NOW()
WHERE data_prevista IS NOT NULL;
```

**Resultado Esperado**:

- Primeira data prevista: **09/12/2025** (era 30/11)
- 49 items atualizados

---

### 2. Canais - Metadata

**Query**: Atualiza campos `data_inicio` e `data_lancamento` no metadata dos canais

```sql
UPDATE pulso_core.canais
SET metadata = jsonb_set(metadata, '{data_inicio}', '"2025-12-10"')
WHERE metadata ? 'data_inicio';

UPDATE pulso_core.canais
SET metadata = jsonb_set(metadata, '{data_lancamento}', '"2025-12-10"')
WHERE metadata ? 'data_lancamento';
```

**Resultado Esperado**:

- Canais com metadata atualizado para início em 10/12/2025

---

### 3. Calendário de Publicação

**Query**: Distribui automaticamente os 129 items em um calendário de publicação

**Estratégia**:

- 📅 **Início**: 10/12/2025 às 09:00
- 📊 **Frequência**: 3 posts por dia
- ⏰ **Horários**:
  - 09:00 (manhã)
  - 15:00 (tarde)
  - 21:00 (noite)

**Cálculo**:

- 129 ideias ÷ 3 posts/dia = **43 dias de conteúdo**
- Período: **10/12/2025 a ~22/01/2026**

```sql
WITH ideias_aprovadas AS (
  SELECT
    pp.id as pipeline_id,
    ROW_NUMBER() OVER (ORDER BY pp.created_at) - 1 as ordem
  FROM pulso_content.pipeline_producao pp
  WHERE pp.status IN ('ROTEIRO_PRONTO', 'AUDIO_PRONTO', 'VIDEO_PRONTO', 'AGUARDANDO_ROTEIRO')
    AND pp.data_publicacao IS NULL
)
UPDATE pulso_content.pipeline_producao pp
SET
  data_publicacao = (
    '2025-12-10 09:00:00'::timestamp +
    (ia.ordem / 3) * INTERVAL '1 day' +
    CASE
      WHEN (ia.ordem % 3) = 0 THEN INTERVAL '0 hours'  -- 9h
      WHEN (ia.ordem % 3) = 1 THEN INTERVAL '6 hours'  -- 15h
      ELSE INTERVAL '12 hours'                          -- 21h
    END
  ),
  updated_at = NOW()
FROM ideias_aprovadas ia
WHERE pp.id = ia.pipeline_id;
```

---

## 📋 Calendário Resultante

### Exemplo de distribuição (primeiros 5 dias):

| Dia | Data       | Posts | Horários            |
| --- | ---------- | ----- | ------------------- |
| 1   | 10/12/2025 | 3     | 09:00, 15:00, 21:00 |
| 2   | 11/12/2025 | 3     | 09:00, 15:00, 21:00 |
| 3   | 12/12/2025 | 3     | 09:00, 15:00, 21:00 |
| 4   | 13/12/2025 | 3     | 09:00, 15:00, 21:00 |
| 5   | 14/12/2025 | 3     | 09:00, 15:00, 21:00 |
| ... | ...        | ...   | ...                 |
| 43  | 22/01/2026 | 3     | 09:00, 15:00, 21:00 |

**Total**: 129 posts distribuídos em ~43 dias

---

## ✅ Como Executar

### 1. Abrir Supabase SQL Editor

Acesse: [Supabase Dashboard → SQL Editor](https://supabase.com/dashboard/project/_/sql)

### 2. Executar o Script de Ajuste (Ideias Existentes)

Copie e cole o conteúdo de:

```
supabase/migrations/ajustar_datas_inicio_projeto.sql
```

### 3. **IMPORTANTE: Instalar Trigger Automático (Novas Ideias)**

Copie e cole o conteúdo de:

```
supabase/migrations/trigger_auto_agendar_publicacao.sql
```

**O que isso faz?**: Instala um trigger que automaticamente atribui datas de publicação para **novas ideias** criadas no futuro. Sem isso, apenas as 129 ideias existentes terão datas, e você precisaria executar o script manualmente toda vez que criar novas ideias.

### 4. Revisar Output

Você verá mensagens de validação:

**Do script de ajuste:**
```
✅ PIPELINE atualizado:
   - Items com data_prevista: 49
   - Primeira data: 2025-12-09
   - Última data: ...

✅ CALENDÁRIO DE PUBLICAÇÃO:
   - Items agendados: 129
   - Primeira publicação: 2025-12-10
   - Última publicação: 2026-01-22
   - Período (dias): 43
   - Posts por dia: ~3

✅ Todas as datas foram ajustadas!
```

**Do trigger automático:**
```
🧪 TESTE DO TRIGGER:
   ✅ Trigger instalado com sucesso!
   ✅ Data atribuída automaticamente: 2026-01-23 09:00:00
   ✅ Item de teste removido
   📌 Próximas inserções no pipeline receberão data automaticamente!
```

### 5. Validar Resultado

Execute as queries de validação (já incluídas no final do script):

```sql
-- Ver primeiras 10 publicações
SELECT
  i.titulo,
  pp.data_publicacao,
  TO_CHAR(pp.data_publicacao, 'DD/MM/YYYY HH24:MI') as data_hora
FROM pulso_content.pipeline_producao pp
LEFT JOIN pulso_content.ideias i ON i.id = pp.ideia_id
WHERE pp.data_publicacao IS NOT NULL
ORDER BY pp.data_publicacao
LIMIT 10;
```

---

## 🎯 Impacto nas Views

### Views Afetadas

1. ✅ `vw_pulso_calendario_publicacao_v2` - mostrará novas datas
2. ✅ `vw_pulso_pipeline_com_assets_v2` - refletirá datas atualizadas
3. ✅ `public.pipeline_producao` - view pública atualizada

### Páginas do App Afetadas

- 📅 `/pipeline` - calendário visual mostrará novas datas
- 📊 `/dashboard` - estatísticas refletirão novo cronograma
- 📝 `/ideias` - datas previstas atualizadas

---

## 🔄 Próximos Passos

### Imediato (hoje - 04/12)

1. ✅ Executar script de ajuste de datas
2. ✅ Validar no dashboard que datas foram atualizadas
3. ✅ Testar WF01 para gerar roteiros das 119 ideias aprovadas

### Curto prazo (até 10/12)

1. ⏳ Aprovar roteiros gerados pelo WF01
2. ⏳ Testar WF02 para gerar áudios
3. ⏳ Validar players de áudio funcionando
4. ⏳ Preparar infraestrutura de publicação

### Médio prazo (após 10/12)

1. 🎯 Publicar primeiro post em 10/12/2025 às 09:00
2. 🎯 Manter cadência de 3 posts/dia
3. 🎯 Monitorar pipeline de produção
4. 🎯 Ajustar calendário conforme necessário

---

## 📊 Métricas de Acompanhamento

### KPIs de Produção

- ✅ Ideias criadas: **129/129** (100%)
- ⏳ Roteiros aprovados: **1/129** (~1%)
- ⏳ Áudios gerados: **0/129** (0%)
- ⏳ Vídeos gerados: **0/129** (0%)

### Timeline Realista

- **04/12 - 09/12**: Finalizar roteiros (WF01 rodando a cada 5min)
- **10/12 - 10/12**: Gerar áudios (WF02 rodando a cada 10min)
- **10/12 às 09:00**: 🚀 **PRIMEIRO POST**

---

## ⚠️ Atenções

### Workflows a Monitorar

1. **WF01 - Gerar Roteiros**: CRON a cada 5 minutos

   - Deve processar as 119 ideias APROVADAS
   - Tempo estimado: ~10 horas (se processar 1 por vez)

2. **WF02 - Gerar Áudios**: CRON a cada 10 minutos

   - Só inicia após roteiros serem APROVADOS
   - Tempo estimado: depende de aprovações manuais

3. **WF03 - Gerar Vídeos**: A implementar
   - Aguardando áudios prontos

### Possíveis Ajustes

- Se roteiros demorarem mais: ajustar data_publicacao novamente
- Se quiser mudar frequência: modificar de 3 para 2 ou 4 posts/dia
- Se quiser mudar horários: alterar CASE no script

---

## 📝 Changelog

### 2025-12-04

- ✅ Script de ajuste criado
- ✅ Análise de datas realizada
- ✅ Documentação completa gerada
- ⏳ Aguardando execução no Supabase

### Próxima atualização

Após executar o script, atualizar este documento com:

- Datas reais aplicadas
- Total de items agendados
- Período final do calendário

---

## 🤝 Suporte

Se houver problemas na execução:

1. **Backup antes de executar**:

```sql
CREATE TABLE pulso_content.pipeline_producao_backup_20241204 AS
SELECT * FROM pulso_content.pipeline_producao;
```

2. **Rollback** (se necessário):

```sql
BEGIN;
UPDATE pulso_content.pipeline_producao pp
SET
  data_prevista = bkp.data_prevista,
  data_publicacao = bkp.data_publicacao,
  updated_at = NOW()
FROM pulso_content.pipeline_producao_backup_20241204 bkp
WHERE pp.id = bkp.id;
COMMIT;
```

3. **Validar sempre**:

```sql
SELECT COUNT(*), MIN(data_publicacao), MAX(data_publicacao)
FROM pulso_content.pipeline_producao
WHERE data_publicacao IS NOT NULL;
```
