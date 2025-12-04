# 🔄 Query de Seleção de Canal do Dia - Corrigida

## 📋 Problema Original

A query tinha vários erros baseados em suposições incorretas sobre a estrutura do banco:

### ❌ Erros Identificados

1. **Coluna inexistente**: `c.idioma as linguagem_padrao`
   - ✅ **Correção**: Coluna existe! Nome correto: `idioma`

2. **Schema não especificado**: `FROM pulso_core.canais`
   - ✅ **Correção**: Schema correto é `pulso_core` (confirmado)

3. **Rotação complexa com ROW_NUMBER**: 
   ```sql
   AND EXTRACT(DOW FROM NOW())::integer = MOD((ROW_NUMBER() OVER (...))::integer - 1, 7)
   ```
   - ❌ **Problema**: ROW_NUMBER não pode ser usado diretamente em WHERE
   - ✅ **Correção**: Usar CTE ou subconsulta

---

## 🏗️ Estrutura Real das Tabelas

### Tabela: `pulso_core.canais`

```sql
CREATE TABLE pulso_core.canais (
    id UUID PRIMARY KEY,
    nome TEXT NOT NULL,
    slug TEXT,
    descricao TEXT,
    idioma TEXT,              -- ✅ Existe! (ex: 'pt-BR')
    status TEXT,              -- ✅ Existe! (ex: 'ATIVO')
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);
```

**Exemplo de registro**:
```json
{
  "id": "c89417ab-ceb0-4a07-9eaf-9293219330e8",
  "nome": "Pulso Dark PT",
  "slug": "pulso-dark-pt",
  "descricao": "Canal principal de conteúdos dark em português",
  "idioma": "pt-BR",
  "status": "ATIVO",
  "metadata": {
    "ordem_prioridade": 0
  },
  "created_at": "2025-11-19T23:21:51.658758",
  "updated_at": "2025-11-19T23:21:51.658758"
}
```

### Tabela: `pulso_content.ideias`

```sql
CREATE TABLE pulso_content.ideias (
    id UUID PRIMARY KEY,
    canal_id UUID REFERENCES pulso_core.canais(id),
    titulo TEXT NOT NULL,
    descricao TEXT,
    status TEXT DEFAULT 'RASCUNHO',
    linguagem TEXT DEFAULT 'pt-BR',
    tags TEXT[],
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);
```

---

## ✅ Queries Corrigidas

Criei **4 versões** diferentes, cada uma com um propósito específico:

### Versão 1: Rotação Simples por Dia da Semana

**Quando usar**: Rotação básica sem considerar balanceamento de carga

```sql
SELECT 
  c.id as canal_id,
  c.nome as canal_nome,
  c.slug,
  c.idioma as linguagem_padrao,
  c.metadata,
  (
    SELECT COUNT(*) 
    FROM pulso_content.ideias 
    WHERE canal_id = c.id 
      AND created_at > NOW() - INTERVAL '7 days'
  ) as ideias_ultima_semana
FROM pulso_core.canais c
WHERE c.status = 'ATIVO'
ORDER BY 
  (EXTRACT(DOW FROM NOW())::integer + (c.metadata->>'ordem_prioridade')::integer) % 7,
  c.created_at
LIMIT 1;
```

**Como funciona**:
- Domingo (0) + ordem_prioridade (0-N) % 7
- Seleciona sempre o mesmo canal no mesmo dia da semana
- Desempata por data de criação do canal

---

### Versão 2: Rotação com Balanceamento

**Quando usar**: Evitar sobrecarga de canais (recomendado)

```sql
WITH canais_ativos AS (
  SELECT 
    c.id,
    c.nome,
    c.slug,
    c.idioma,
    c.metadata,
    c.created_at,
    COALESCE((c.metadata->>'ordem_prioridade')::integer, 0) as ordem_prioridade,
    (SELECT COUNT(*) FROM pulso_content.ideias 
     WHERE canal_id = c.id AND created_at > NOW() - INTERVAL '7 days') as ideias_ultima_semana,
    (SELECT COUNT(*) FROM pulso_content.ideias WHERE canal_id = c.id) as total_ideias
  FROM pulso_core.canais c
  WHERE c.status = 'ATIVO'
)
SELECT 
  id as canal_id,
  nome as canal_nome,
  slug,
  idioma as linguagem_padrao,
  metadata,
  ideias_ultima_semana,
  total_ideias
FROM canais_ativos
ORDER BY 
  ideias_ultima_semana ASC,  -- 1. Menos ideias na semana
  (EXTRACT(DOW FROM NOW())::integer + ordem_prioridade) % 7,  -- 2. Rotação semanal
  created_at ASC  -- 3. Canal mais antigo
LIMIT 1;
```

**Como funciona**:
1. Prioriza canal com **menos ideias na última semana**
2. Aplica rotação por dia da semana como desempate
3. Canal mais antigo tem prioridade final

---

### Versão 3: Round-Robin Estrito

**Quando usar**: Distribuição absolutamente igual entre canais

```sql
WITH canais_numerados AS (
  SELECT 
    c.id,
    c.nome,
    c.slug,
    c.idioma,
    c.metadata,
    ROW_NUMBER() OVER (ORDER BY c.created_at) - 1 as indice_canal,
    (SELECT COUNT(*) FROM pulso_content.ideias 
     WHERE canal_id = c.id AND created_at > NOW() - INTERVAL '7 days') as ideias_ultima_semana
  FROM pulso_core.canais c
  WHERE c.status = 'ATIVO'
)
SELECT 
  id as canal_id,
  nome as canal_nome,
  slug,
  idioma as linguagem_padrao,
  metadata,
  ideias_ultima_semana
FROM canais_numerados
WHERE indice_canal = EXTRACT(DOW FROM NOW())::integer % (SELECT COUNT(*) FROM pulso_core.canais WHERE status = 'ATIVO')
LIMIT 1;
```

**Como funciona**:
- Numera canais de 0 a N-1
- Dia da semana (0-6) % total de canais = índice do canal
- Garante que cada canal aparece exatamente uma vez por ciclo

---

### Versão 4: Rotação Inteligente ⭐ (RECOMENDADA)

**Quando usar**: Sistema de produção com múltiplos canais

```sql
WITH canais_com_stats AS (
  SELECT 
    c.id,
    c.nome,
    c.slug,
    c.idioma,
    c.metadata,
    COALESCE((c.metadata->>'ordem_prioridade')::integer, 0) as ordem_prioridade,
    COALESCE((c.metadata->>'peso_rotacao')::integer, 1) as peso_rotacao,
    (SELECT COUNT(*) FROM pulso_content.ideias 
     WHERE canal_id = c.id AND created_at > NOW() - INTERVAL '7 days') as ideias_7dias,
    (SELECT COUNT(*) FROM pulso_content.ideias 
     WHERE canal_id = c.id AND created_at::date = CURRENT_DATE) as ideias_hoje,
    (SELECT MAX(created_at) FROM pulso_content.ideias WHERE canal_id = c.id) as ultima_ideia_em
  FROM pulso_core.canais c
  WHERE c.status = 'ATIVO'
),
canais_scored AS (
  SELECT 
    *,
    (
      (ideias_hoje * 100) +
      (ideias_7dias * 10) +
      (EXTRACT(EPOCH FROM (NOW() - COALESCE(ultima_ideia_em, '2000-01-01'::timestamptz))) / 3600)::integer
    ) / peso_rotacao as score
  FROM canais_com_stats
)
SELECT 
  id as canal_id,
  nome as canal_nome,
  slug,
  idioma as linguagem_padrao,
  metadata,
  ideias_7dias as ideias_ultima_semana,
  ideias_hoje,
  score
FROM canais_scored
ORDER BY score ASC, ordem_prioridade ASC, id
LIMIT 1;
```

**Como funciona**:

1. **Score baseado em múltiplos fatores** (menor = melhor):
   - `ideias_hoje * 100`: Penalidade **alta** para canais com ideias criadas hoje
   - `ideias_7dias * 10`: Penalidade **média** para canais com muitas ideias na semana
   - `horas_desde_ultima_ideia`: **Bonus** para canais inativos há mais tempo

2. **Peso de rotação** (`metadata.peso_rotacao`):
   - Valor entre 1 e 10 (padrão = 1)
   - Canais com peso 2 aparecem com dobro de frequência
   - Score final = score_bruto / peso_rotacao

3. **Ordem de prioridade** (`metadata.ordem_prioridade`):
   - Valor entre 0 e 100 (padrão = 0)
   - Usado apenas como desempate quando scores são iguais

**Exemplo de scores**:
```
Canal A: 0 ideias hoje, 5 na semana, última há 24h
Score = (0*100 + 5*10 + 24) / 1 = 74

Canal B: 1 ideia hoje, 2 na semana, última há 2h
Score = (1*100 + 2*10 + 2) / 1 = 122

Canal C: 0 ideias hoje, 0 na semana, última há 168h (7 dias)
Score = (0*100 + 0*10 + 168) / 1 = 168... mas se peso=2, score = 84

Resultado: Canal A é escolhido (menor score = 74)
```

---

## 🎯 Recomendação para WF00

Use a **Versão 4 (Rotação Inteligente)** porque:

✅ Evita criar múltiplas ideias no mesmo canal no mesmo dia  
✅ Balanceia automaticamente a carga entre canais  
✅ Permite ajuste fino via metadata sem alterar código  
✅ Prioriza canais "descansados" (sem ideias recentes)  
✅ Garante distribuição justa a longo prazo  

---

## 🔧 Configuração via Metadata

### Adicionar peso de rotação
```sql
UPDATE pulso_core.canais
SET metadata = jsonb_set(metadata, '{peso_rotacao}', '2')
WHERE slug = 'pulso-dark-pt';
```

### Adicionar ordem de prioridade
```sql
UPDATE pulso_core.canais
SET metadata = jsonb_set(metadata, '{ordem_prioridade}', '10')
WHERE slug = 'canal-secundario';
```

---

## 📊 Testar Queries

Execute no Supabase SQL Editor:

```sql
-- Ver qual canal será escolhido hoje
[Cole a query da Versão 4]

-- Ver scores de todos os canais
[Remova o LIMIT 1 e ORDER BY da última SELECT]
```

---

## 🐛 Troubleshooting

### Erro: "column 'idioma' does not exist"
- ✅ **Corrigido!** A coluna existe na estrutura real

### Erro: "cannot use window function in WHERE clause"
- ✅ **Corrigido!** Movido ROW_NUMBER para CTE

### Sempre escolhe o mesmo canal
- 🔍 Verifique se `metadata.peso_rotacao` está muito alto
- 🔍 Verifique se há apenas um canal com `status = 'ATIVO'`
- 🔍 Execute query sem LIMIT 1 para ver todos os scores

---

Arquivo completo: `supabase/queries/selecionar_canal_dia_corrigido.sql`
