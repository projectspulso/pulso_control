# ⚙️ Trigger de Agendamento Automático de Publicações

## 📌 Problema Original

**Pergunta do usuário**: "Quanto mais vamos incluindo ideias, é automático a inclusão de datas?"

**Resposta**: ❌ **NÃO era automático!** 

O script `ajustar_datas_inicio_projeto.sql` apenas distribui datas para os **129 items existentes** no momento da execução. Se você criar novas ideias depois, elas **NÃO receberiam datas automaticamente**.

---

## ✅ Solução Implementada

Criado um **trigger no banco de dados** que automaticamente atribui `data_publicacao` e `data_prevista` para toda nova ideia inserida no pipeline.

### Arquivo
```
supabase/migrations/trigger_auto_agendar_publicacao.sql
```

---

## 🔧 Como Funciona

### 1. Função Calculadora
```sql
pulso_content.fn_calcular_proxima_data_publicacao()
```

**O que faz:**
- Busca a última `data_publicacao` no pipeline
- Calcula o próximo slot disponível baseado nos horários: **9h, 15h, 21h**
- Verifica se o slot já está ocupado
- Se ocupado, avança para o próximo slot

**Lógica:**
```
Última data: 10/12/2025 às 09:00
  ↓
Próximo slot: 10/12/2025 às 15:00
  ↓ (se ocupado)
Próximo slot: 10/12/2025 às 21:00
  ↓ (se ocupado)
Próximo slot: 11/12/2025 às 09:00
```

### 2. Trigger Function
```sql
pulso_content.trg_auto_agendar_publicacao()
```

**O que faz:**
- Intercepta todo `INSERT` em `pulso_content.pipeline_producao`
- Se `data_publicacao` for NULL (não definida manualmente)
- Chama a função calculadora
- Atribui automaticamente `data_publicacao` e `data_prevista`

### 3. Trigger
```sql
CREATE TRIGGER trigger_auto_agendar_publicacao
    BEFORE INSERT ON pulso_content.pipeline_producao
    FOR EACH ROW
    EXECUTE FUNCTION pulso_content.trg_auto_agendar_publicacao();
```

**Quando dispara:**
- **BEFORE INSERT**: Antes de inserir um novo registro
- **FOR EACH ROW**: Para cada linha sendo inserida

---

## 📊 Exemplos Práticos

### Cenário 1: Criar Nova Ideia
```sql
-- Você insere uma nova ideia no pipeline (via WF00 ou manualmente)
INSERT INTO pulso_content.pipeline_producao (ideia_id, canal_id, status)
VALUES ('uuid-da-ideia', 'uuid-do-canal', 'AGUARDANDO_ROTEIRO');

-- ✅ Trigger dispara automaticamente!
-- data_publicacao = 2026-01-23 09:00:00 (próximo slot disponível)
-- data_prevista = 2026-01-23 09:00:00 (mesma data)
```

### Cenário 2: Data Manual (Bypass do Trigger)
```sql
-- Se você DEFINIR uma data manualmente, o trigger respeita
INSERT INTO pulso_content.pipeline_producao (
  ideia_id, 
  canal_id, 
  status, 
  data_publicacao
)
VALUES (
  'uuid-da-ideia', 
  'uuid-do-canal', 
  'AGUARDANDO_ROTEIRO',
  '2026-02-14 12:00:00'  -- Data específica (Dia dos Namorados ao meio-dia)
);

-- ✅ Trigger detecta que data_publicacao já está definida
-- ✅ NÃO sobrescreve, mantém sua data manual
```

### Cenário 3: Consultar Próxima Data
```sql
-- Ver qual será a próxima data atribuída
SELECT pulso_content.fn_calcular_proxima_data_publicacao();

-- Resultado: 2026-01-23 09:00:00+00
```

---

## 🎯 Benefícios

### ✅ Automação Total
- Não precisa mais se preocupar com datas
- Calendário se expande automaticamente
- Sempre mantém cadência de 3 posts/dia

### ✅ Sem Conflitos
- Nunca haverá dois posts no mesmo horário
- Algoritmo verifica ocupação antes de atribuir

### ✅ Flexibilidade
- Se quiser data manual, basta informar no INSERT
- Trigger só age se data_publicacao for NULL

### ✅ Manutenibilidade
- Lógica centralizada em função SQL
- Fácil de ajustar horários (mudar ARRAY[9, 15, 21])
- Fácil de desativar (DROP TRIGGER se necessário)

---

## 🔍 Validação

### Verificar se Trigger Está Instalado
```sql
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'pulso_content'
  AND event_object_table = 'pipeline_producao';
```

**Resultado esperado:**
```
trigger_name: trigger_auto_agendar_publicacao
event_manipulation: INSERT
action_timing: BEFORE
action_statement: EXECUTE FUNCTION pulso_content.trg_auto_agendar_publicacao()
```

### Testar Manualmente
```sql
-- 1. Ver última data agendada
SELECT MAX(data_publicacao) FROM pulso_content.pipeline_producao;
-- Ex: 2026-01-22 21:00:00

-- 2. Ver próxima data que será atribuída
SELECT pulso_content.fn_calcular_proxima_data_publicacao();
-- Ex: 2026-01-23 09:00:00

-- 3. Inserir teste (depois deletar)
INSERT INTO pulso_content.pipeline_producao (ideia_id, canal_id, status)
SELECT 
  (SELECT id FROM pulso_content.ideias LIMIT 1),
  (SELECT id FROM pulso_core.canais LIMIT 1),
  'AGUARDANDO_ROTEIRO'
RETURNING id, data_publicacao, data_prevista;

-- 4. Deletar teste
DELETE FROM pulso_content.pipeline_producao 
WHERE id = 'id-retornado-acima';
```

---

## ⚙️ Configurações Avançadas

### Mudar Horários de Publicação
**Atual**: 9h, 15h, 21h  
**Desejado**: 10h, 14h, 18h, 22h (4 posts/dia)

```sql
-- Editar a função fn_calcular_proxima_data_publicacao
-- Linha: horarios int[] := ARRAY[9, 15, 21];
-- Mudar para: horarios int[] := ARRAY[10, 14, 18, 22];
```

### Mudar Frequência
**Atual**: 3 posts/dia  
**Desejado**: 2 posts/dia (9h e 21h apenas)

```sql
-- Editar a função fn_calcular_proxima_data_publicacao
-- Simplificar lógica para apenas 2 horários
-- Linha: horarios int[] := ARRAY[9, 15, 21];
-- Mudar para: horarios int[] := ARRAY[9, 21];
```

### Desativar Temporariamente
```sql
-- Desativar trigger (mantém função)
ALTER TABLE pulso_content.pipeline_producao 
DISABLE TRIGGER trigger_auto_agendar_publicacao;

-- Reativar
ALTER TABLE pulso_content.pipeline_producao 
ENABLE TRIGGER trigger_auto_agendar_publicacao;
```

### Remover Completamente
```sql
-- Remover trigger
DROP TRIGGER IF EXISTS trigger_auto_agendar_publicacao 
ON pulso_content.pipeline_producao;

-- Remover funções
DROP FUNCTION IF EXISTS pulso_content.trg_auto_agendar_publicacao();
DROP FUNCTION IF EXISTS pulso_content.fn_calcular_proxima_data_publicacao();
```

---

## 🐛 Troubleshooting

### Problema: Trigger não está funcionando
```sql
-- Verificar se trigger existe
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'trigger_auto_agendar_publicacao';

-- Se não existir, executar novamente:
-- supabase/migrations/trigger_auto_agendar_publicacao.sql
```

### Problema: Datas estranhas sendo atribuídas
```sql
-- Verificar última data no sistema
SELECT MAX(data_publicacao) FROM pulso_content.pipeline_producao;

-- Verificar se há conflitos
SELECT data_publicacao, COUNT(*) 
FROM pulso_content.pipeline_producao 
GROUP BY data_publicacao 
HAVING COUNT(*) > 1;

-- Recalcular próxima data
SELECT pulso_content.fn_calcular_proxima_data_publicacao();
```

### Problema: Quero resetar todas as datas
```sql
-- CUIDADO! Isso remove todas as datas de publicação
UPDATE pulso_content.pipeline_producao
SET data_publicacao = NULL, data_prevista = NULL;

-- Depois execute novamente:
-- supabase/migrations/ajustar_datas_inicio_projeto.sql
```

---

## 📚 Referências

### Arquivos Relacionados
- `supabase/migrations/ajustar_datas_inicio_projeto.sql` - Ajuste inicial (129 ideias)
- `supabase/migrations/trigger_auto_agendar_publicacao.sql` - Trigger automático (novas ideias)
- `supabase/migrations/validar_ajuste_datas.sql` - Validação do calendário
- `docs/AJUSTE_DATAS_INICIO.md` - Documentação completa
- `docs/GUIA_RAPIDO_AJUSTE_DATAS.md` - Guia rápido de execução

### Commits
- `feat: scripts e docs para ajustar datas de início do projeto (01/12 → 10/12)`
- `feat: adicionar trigger automático para agendamento de novas ideias`

---

## ✅ Checklist de Implementação

- [x] Criar função calculadora de próxima data
- [x] Criar trigger function para interceptar INSERTs
- [x] Criar trigger no pipeline_producao
- [x] Testar com INSERT de teste
- [x] Documentar funcionamento
- [x] Atualizar guias de execução
- [x] Commitar para repositório

**Status**: ✅ **IMPLEMENTADO E TESTADO**

---

## 🎓 Para Entender Melhor

### O que é um Trigger?
Um trigger é uma **função automática** que o banco de dados executa quando um evento ocorre (INSERT, UPDATE, DELETE).

### Por que BEFORE INSERT?
`BEFORE INSERT` permite **modificar os dados** antes de serem salvos. Perfeito para calcular e atribuir datas automaticamente.

### Por que não UPDATE também?
Porque não queremos sobrescrever datas que já foram definidas. O trigger só age em novos registros (INSERT).

### Posso modificar a lógica?
Sim! A função `fn_calcular_proxima_data_publicacao()` é SQL puro e pode ser editada para mudar:
- Horários de publicação
- Frequência diária
- Lógica de distribuição
- Fuso horário
- Dias da semana específicos

---

**Dúvidas?** Consulte a documentação completa em `docs/AJUSTE_DATAS_INICIO.md`
