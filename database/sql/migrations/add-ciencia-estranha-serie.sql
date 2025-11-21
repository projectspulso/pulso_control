-- ============================================================================
-- Adicionar nova série: Ciência Estranha
-- ============================================================================
-- Para o canal Pulso Dark PT
WITH canal AS (
    SELECT id
    FROM pulso_core.canais
    WHERE slug = 'pulso-dark-pt'
)
INSERT INTO pulso_core.series (
        canal_id,
        nome,
        slug,
        descricao,
        ordem_padrao,
        metadata
    )
SELECT c.id,
    'Ciência Estranha',
    'ciencia-estranha',
    'Curiosidades científicas bizarras, limite entre ciência e absurdo.',
    3,
    jsonb_build_object('tipo', 'CIENCIA_DARK', 'formato', '15-40s')
FROM canal c
WHERE NOT EXISTS (
        SELECT 1
        FROM pulso_core.series
        WHERE canal_id = c.id
            AND slug = 'ciencia-estranha'
    );
-- Verificar séries criadas
SELECT s.nome,
    s.slug,
    s.descricao,
    s.ordem_padrao,
    c.nome as canal,
    s.metadata
FROM pulso_core.series s
    JOIN pulso_core.canais c ON c.id = s.canal_id
WHERE c.slug = 'pulso-dark-pt'
ORDER BY s.ordem_padrao;