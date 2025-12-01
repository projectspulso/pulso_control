-- =====================================================
-- SCRIPT DE VERIFICAÇÃO - Workflows n8n
-- Execute no SQL Editor do Supabase
-- =====================================================
-- 1. Verificar se há ideias no banco
SELECT COUNT(*) as total_ideias,
    COUNT(*) FILTER (
        WHERE status = 'RASCUNHO'
    ) as rascunho,
    COUNT(*) FILTER (
        WHERE status = 'APROVADA'
    ) as aprovadas,
    COUNT(*) FILTER (
        WHERE metadata->>'gerado_por_ia' = 'true'
    ) as geradas_ia
FROM ideias;
-- 2. Verificar roteiros gerados
SELECT COUNT(*) as total_roteiros,
    COUNT(*) FILTER (
        WHERE status = 'RASCUNHO'
    ) as rascunho,
    COUNT(*) FILTER (
        WHERE status = 'APROVADO'
    ) as aprovado,
    COUNT(*) FILTER (
        WHERE gerado_por = 'IA'
    ) as gerados_ia
FROM roteiros;
-- 3. Verificar logs dos workflows (últimos 10)
SELECT workflow_name,
    status,
    detalhes,
    created_at
FROM logs_workflows
ORDER BY created_at DESC
LIMIT 10;
-- 4. Verificar pipeline de produção
SELECT status,
    COUNT(*) as quantidade
FROM pipeline_producao
GROUP BY status
ORDER BY quantidade DESC;
-- 5. Verificar áudios gerados
SELECT COUNT(*) as total_audios,
    SUM(duracao_segundos) as total_segundos,
    AVG(duracao_segundos) as media_segundos
FROM pulso_assets.audios;
-- 6. Últimas 5 execuções do pipeline
SELECT p.id,
    p.status,
    i.titulo as ideia,
    c.nome as canal,
    p.created_at,
    p.updated_at
FROM pipeline_producao p
    LEFT JOIN ideias i ON p.ideia_id = i.id
    LEFT JOIN canais c ON i.canal_id = c.id
ORDER BY p.updated_at DESC
LIMIT 5;