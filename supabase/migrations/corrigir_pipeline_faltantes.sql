-- ================================================================
-- CORREÇÃO DO PIPELINE DE PRODUÇÃO
-- ================================================================
-- Problema: Pipeline tem 82 itens mas deveria ter 129 (1 por ideia)
-- Faltam 47 ideias no pipeline
-- ================================================================
-- 1. VERIFICAR ESTADO ATUAL
SELECT 'ANTES DA CORRECAO' as momento,
    (
        SELECT COUNT(*)
        FROM pulso_content.ideias
    ) as total_ideias,
    (
        SELECT COUNT(*)
        FROM pulso_content.pipeline_producao
    ) as total_pipeline,
    (
        SELECT COUNT(*)
        FROM pulso_content.ideias
    ) - (
        SELECT COUNT(*)
        FROM pulso_content.pipeline_producao
    ) as faltando;
-- 2. IDENTIFICAR IDEIAS SEM PIPELINE
SELECT 'IDEIAS SEM PIPELINE' as categoria,
    i.id as ideia_id,
    i.titulo,
    i.status as ideia_status,
    i.canal_id,
    i.serie_id,
    i.created_at
FROM pulso_content.ideias i
    LEFT JOIN pulso_content.pipeline_producao p ON p.ideia_id = i.id
WHERE p.id IS NULL
ORDER BY i.created_at;
-- 3. INSERIR IDEIAS FALTANTES NO PIPELINE
-- Para cada ideia sem pipeline, criar entrada com status apropriado
INSERT INTO pulso_content.pipeline_producao (
        ideia_id,
        roteiro_id,
        status,
        prioridade,
        data_prevista,
        metadata,
        created_at,
        updated_at
    )
SELECT i.id as ideia_id,
    r.id as roteiro_id,
    CASE
        WHEN r.id IS NOT NULL THEN 'ROTEIRO_PRONTO'::text
        ELSE 'AGUARDANDO_ROTEIRO'::text
    END as status,
    i.prioridade as prioridade,
    NULL as data_prevista,
    jsonb_build_object(
        'canal_id',
        i.canal_id::text,
        'serie_id',
        i.serie_id::text,
        'origem',
        'correcao_automatica',
        'corrigido_em',
        NOW()
    ) as metadata,
    NOW() as created_at,
    NOW() as updated_at
FROM pulso_content.ideias i
    LEFT JOIN pulso_content.pipeline_producao p ON p.ideia_id = i.id
    LEFT JOIN pulso_content.roteiros r ON r.ideia_id = i.id
WHERE p.id IS NULL;
-- 4. VERIFICAR APÓS INSERÇÃO
SELECT 'APOS INSERCAO' as momento,
    (
        SELECT COUNT(*)
        FROM pulso_content.ideias
    ) as total_ideias,
    (
        SELECT COUNT(*)
        FROM pulso_content.pipeline_producao
    ) as total_pipeline,
    (
        SELECT COUNT(*)
        FROM pulso_content.ideias
    ) - (
        SELECT COUNT(*)
        FROM pulso_content.pipeline_producao
    ) as diferenca;
-- 5. VERIFICAR DISTRIBUIÇÃO DE STATUS
SELECT 'DISTRIBUICAO STATUS' as categoria,
    status::text,
    COUNT(*) as total,
    CASE
        WHEN status = 'AGUARDANDO_ROTEIRO' THEN 'Ideias sem roteiro'
        WHEN status = 'ROTEIRO_PRONTO' THEN 'Ideias com roteiro em rascunho'
        ELSE 'Verificar'
    END as descricao
FROM pulso_content.pipeline_producao
GROUP BY status
ORDER BY COUNT(*) DESC;
-- 6. VALIDAÇÃO FINAL
SELECT 'VALIDACAO FINAL' as verificacao,
    CASE
        WHEN (
            SELECT COUNT(*)
            FROM pulso_content.ideias
        ) = (
            SELECT COUNT(*)
            FROM pulso_content.pipeline_producao
        ) THEN 'OK - Pipeline completo (1 item por ideia)'
        ELSE 'ERRO - Ainda há diferença'
    END as resultado,
    (
        SELECT COUNT(*)
        FROM pulso_content.ideias
    ) as ideias,
    (
        SELECT COUNT(*)
        FROM pulso_content.pipeline_producao
    ) as pipeline;
-- ================================================================
-- ESTADO ESPERADO FINAL:
-- - Pipeline: 129 itens (1 por ideia)
-- - Status AGUARDANDO_ROTEIRO: 10 (ideias sem roteiro)
-- - Status ROTEIRO_PRONTO: 119 (ideias com roteiro em rascunho)
-- ================================================================