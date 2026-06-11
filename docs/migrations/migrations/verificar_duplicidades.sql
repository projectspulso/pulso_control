-- =====================================================
-- VERIFICAR DUPLICIDADES NO BANCO
-- =====================================================
-- 1. Verificar ideias duplicadas (mesmo título)
SELECT titulo,
    COUNT(*) as quantidade
FROM pulso_content.ideias
GROUP BY titulo
HAVING COUNT(*) > 1
ORDER BY quantidade DESC;
-- 2. Verificar roteiros duplicados (mesmo título)
SELECT titulo,
    COUNT(*) as quantidade
FROM pulso_content.roteiros
GROUP BY titulo
HAVING COUNT(*) > 1
ORDER BY quantidade DESC;
-- 3. Verificar roteiros com mesma ideia_id (múltiplos roteiros para mesma ideia)
SELECT ideia_id,
    COUNT(*) as quantidade,
    STRING_AGG(titulo, ' | ') as titulos
FROM pulso_content.roteiros
GROUP BY ideia_id
HAVING COUNT(*) > 1
ORDER BY quantidade DESC;
-- 4. Verificar pipeline com mesma ideia_id (múltiplas entradas para mesma ideia)
SELECT ideia_id,
    COUNT(*) as quantidade
FROM pulso_content.pipeline_producao
GROUP BY ideia_id
HAVING COUNT(*) > 1
ORDER BY quantidade DESC;
-- 5. Verificar pipeline com mesmo roteiro_id
SELECT roteiro_id,
    COUNT(*) as quantidade
FROM pulso_content.pipeline_producao
WHERE roteiro_id IS NOT NULL
GROUP BY roteiro_id
HAVING COUNT(*) > 1
ORDER BY quantidade DESC;
-- 6. Contagem geral de registros
SELECT 'ideias' as tabela,
    COUNT(*) as total
FROM pulso_content.ideias
UNION ALL
SELECT 'roteiros' as tabela,
    COUNT(*) as total
FROM pulso_content.roteiros
UNION ALL
SELECT 'pipeline' as tabela,
    COUNT(*) as total
FROM pulso_content.pipeline_producao;
-- 7. Ver status dos roteiros
SELECT status,
    COUNT(*) as quantidade
FROM pulso_content.roteiros
GROUP BY status
ORDER BY quantidade DESC;