-- =====================================================
-- QUERY CORRIGIDA: Selecionar canal do dia
-- =====================================================
-- Seleciona um canal ativo com base em rotação pelo dia da semana
-- Evita sobrecarregar canais que já tiveram muitas ideias recentemente
-- =====================================================
-- VERSÃO 1: Rotação simples por dia da semana (Domingo=0, Segunda=1, ..., Sábado=6)
SELECT c.id as canal_id,
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
ORDER BY -- Rotação baseada no dia da semana
    -- Domingo=0, Segunda=1, Terça=2, Quarta=3, Quinta=4, Sexta=5, Sábado=6
    (
        EXTRACT(
            DOW
            FROM NOW()
        )::integer + c.metadata->>'ordem_prioridade'::integer
    ) % 7,
    c.created_at
LIMIT 1;
-- =====================================================
-- VERSÃO 2: Rotação com balanceamento (prioriza canal com menos ideias)
-- =====================================================
WITH canais_ativos AS (
    SELECT c.id,
        c.nome,
        c.slug,
        c.idioma,
        c.metadata,
        c.created_at,
        COALESCE((c.metadata->>'ordem_prioridade')::integer, 0) as ordem_prioridade,
        -- Contar ideias da última semana
        (
            SELECT COUNT(*)
            FROM pulso_content.ideias
            WHERE canal_id = c.id
                AND created_at > NOW() - INTERVAL '7 days'
        ) as ideias_ultima_semana,
        -- Contar todas as ideias
        (
            SELECT COUNT(*)
            FROM pulso_content.ideias
            WHERE canal_id = c.id
        ) as total_ideias
    FROM pulso_core.canais c
    WHERE c.status = 'ATIVO'
)
SELECT id as canal_id,
    nome as canal_nome,
    slug,
    idioma as linguagem_padrao,
    metadata,
    ideias_ultima_semana,
    total_ideias
FROM canais_ativos
ORDER BY -- 1. Priorizar canal com menos ideias na última semana
    ideias_ultima_semana ASC,
    -- 2. Rotação baseada no dia da semana
    (
        EXTRACT(
            DOW
            FROM NOW()
        )::integer + ordem_prioridade
    ) % 7,
    -- 3. Canal mais antigo
    created_at ASC
LIMIT 1;
-- =====================================================
-- VERSÃO 3: Rotação estrita por dia da semana (Round-robin)
-- =====================================================
WITH canais_numerados AS (
    SELECT c.id,
        c.nome,
        c.slug,
        c.idioma,
        c.metadata,
        ROW_NUMBER() OVER (
            ORDER BY c.created_at
        ) - 1 as indice_canal,
        (
            SELECT COUNT(*)
            FROM pulso_content.ideias
            WHERE canal_id = c.id
                AND created_at > NOW() - INTERVAL '7 days'
        ) as ideias_ultima_semana
    FROM pulso_core.canais c
    WHERE c.status = 'ATIVO'
)
SELECT id as canal_id,
    nome as canal_nome,
    slug,
    idioma as linguagem_padrao,
    metadata,
    ideias_ultima_semana
FROM canais_numerados
WHERE indice_canal = EXTRACT(
        DOW
        FROM NOW()
    )::integer % (
        SELECT COUNT(*)
        FROM pulso_core.canais
        WHERE status = 'ATIVO'
    )
LIMIT 1;
-- =====================================================
-- VERSÃO 4: Rotação inteligente (recomendada para n8n)
-- =====================================================
-- Esta versão equilibra:
-- 1. Distribuição temporal (dia da semana)
-- 2. Balanceamento de carga (evita sobrecarga)
-- 3. Prioridade configurável no metadata
-- =====================================================
WITH canais_com_stats AS (
    SELECT c.id,
        c.nome,
        c.slug,
        c.idioma,
        c.metadata,
        COALESCE((c.metadata->>'ordem_prioridade')::integer, 0) as ordem_prioridade,
        COALESCE((c.metadata->>'peso_rotacao')::integer, 1) as peso_rotacao,
        -- Ideias recentes (última semana)
        (
            SELECT COUNT(*)
            FROM pulso_content.ideias
            WHERE canal_id = c.id
                AND created_at > NOW() - INTERVAL '7 days'
        ) as ideias_7dias,
        -- Ideias hoje
        (
            SELECT COUNT(*)
            FROM pulso_content.ideias
            WHERE canal_id = c.id
                AND created_at::date = CURRENT_DATE
        ) as ideias_hoje,
        -- Última ideia criada
        (
            SELECT MAX(created_at)
            FROM pulso_content.ideias
            WHERE canal_id = c.id
        ) as ultima_ideia_em
    FROM pulso_core.canais c
    WHERE c.status = 'ATIVO'
),
canais_scored AS (
    SELECT *,
        -- Score baseado em múltiplos fatores (menor = melhor)
        (
            (ideias_hoje * 100) + -- Penalidade alta para ideias criadas hoje
            (ideias_7dias * 10) + -- Penalidade média para ideias na semana
            (
                EXTRACT(
                    EPOCH
                    FROM (
                            NOW() - COALESCE(ultima_ideia_em, '2000-01-01'::timestamptz)
                        )
                ) / 3600
            )::integer -- Bonus para canais sem ideias há mais tempo
        ) / peso_rotacao as score
    FROM canais_com_stats
)
SELECT id as canal_id,
    nome as canal_nome,
    slug,
    idioma as linguagem_padrao,
    metadata,
    ideias_7dias as ideias_ultima_semana,
    ideias_hoje,
    score
FROM canais_scored
ORDER BY -- Priorizar canal com menor score (menos sobrecarregado)
    score ASC,
    -- Desempate por ordem de prioridade configurada
    ordem_prioridade ASC,
    -- Desempate final por ID (estável)
    id
LIMIT 1;
-- =====================================================
-- EXEMPLO DE USO NO N8N (WF00)
-- =====================================================
-- Usar a VERSÃO 4 no node "Buscar Canal do Dia"
-- Retorna sempre o canal mais adequado considerando:
-- - Canais sem ideias hoje têm prioridade máxima
-- - Canais com poucas ideias na semana são preferidos
-- - Canais inativos há mais tempo são priorizados
-- - metadata.peso_rotacao permite ajuste fino (1-10, padrão=1)
-- - metadata.ordem_prioridade define preferência global (0-100, padrão=0)