-- ================================================================
-- VALIDAÇÃO DO ESTADO REAL - SEM MOCK
-- ================================================================
-- Criado em: 2025-12-03
-- Objetivo: Validar que todos os dados refletem o estado REAL
--           sem nenhum dado mock ou de teste
-- ================================================================
-- 1. IDEIAS - Estado Esperado
SELECT '1. IDEIAS' as secao,
    status::text,
    COUNT(*) as total,
    CASE
        WHEN status = 'APROVADA' THEN 'Ideias aprovadas manualmente'
        WHEN status = 'RASCUNHO' THEN 'Ideias em rascunho'
        ELSE status::text
    END as descricao
FROM pulso_content.ideias
GROUP BY status
ORDER BY COUNT(*) DESC;
-- Esperado: 
-- APROVADA: 119
-- RASCUNHO: 10
-- Total: 129
-- 2. ROTEIROS - Estado Esperado (APÓS CORREÇÃO)
SELECT '2. ROTEIROS' as secao,
    status::text,
    COUNT(*) as total,
    CASE
        WHEN status = 'RASCUNHO' THEN 'Todos devem estar aqui (nenhum aprovado ainda)'
        WHEN status = 'APROVADO' THEN 'ERRO - Não deveria ter nenhum'
        WHEN status = 'EM_REVISAO' THEN 'ERRO - Não deveria ter nenhum'
        ELSE status::text
    END as descricao
FROM pulso_content.roteiros
GROUP BY status
ORDER BY COUNT(*) DESC;
-- Esperado CORRETO:
-- RASCUNHO: 119
-- Total: 119
-- 3. AUDIOS - Estado Esperado
SELECT '3. AUDIOS' as secao,
    COUNT(*) as total,
    CASE
        WHEN COUNT(*) = 0 THEN 'CORRETO - Nenhum áudio gerado ainda'
        ELSE 'VERIFICAR - Há áudios no banco'
    END as status
FROM pulso_content.audios;
-- Esperado:
-- Total: 0
-- 4. PIPELINE - Estado Esperado
SELECT '4. PIPELINE' as secao,
    status::text,
    COUNT(*) as total,
    CASE
        WHEN status = 'AGUARDANDO_ROTEIRO' THEN 'Ideias sem roteiro'
        WHEN status = 'ROTEIRO_PRONTO' THEN 'Tem roteiro mas não aprovado'
        WHEN status = 'PRONTO_PUBLICACAO' THEN 'ERRO - Não deveria existir'
        WHEN status = 'AUDIO_GERADO' THEN 'ERRO - Nenhum áudio foi gerado'
        ELSE status::text
    END as descricao
FROM pulso_content.pipeline_producao
GROUP BY status
ORDER BY COUNT(*) DESC;
-- Esperado (APÓS LIMPEZA):
-- AGUARDANDO_ROTEIRO: 25
-- ROTEIRO_PRONTO: 57
-- Total: 82
-- 5. VERIFICAÇÃO DE CONSISTÊNCIA
SELECT '5. CONSISTENCIA' as secao,
    'Itens no pipeline com audio_id preenchido' as verificacao,
    COUNT(*) as total,
    CASE
        WHEN COUNT(*) = 0 THEN 'OK - Nenhum tem áudio (correto)'
        ELSE 'ERRO - Há inconsistência'
    END as resultado
FROM pulso_content.pipeline_producao
WHERE audio_id IS NOT NULL;
-- 6. RESUMO FINAL
SELECT '6. RESUMO FINAL' as secao,
    (
        SELECT COUNT(*)
        FROM pulso_content.ideias
        WHERE status = 'APROVADA'
    ) as ideias_aprovadas,
    (
        SELECT COUNT(*)
        FROM pulso_content.ideias
        WHERE status = 'RASCUNHO'
    ) as ideias_rascunho,
    (
        SELECT COUNT(*)
        FROM pulso_content.roteiros
        WHERE status = 'RASCUNHO'
    ) as roteiros_rascunho,
    (
        SELECT COUNT(*)
        FROM pulso_content.roteiros
        WHERE status = 'APROVADO'
    ) as roteiros_aprovados_DEVE_SER_ZERO,
    (
        SELECT COUNT(*)
        FROM pulso_content.audios
    ) as audios_DEVE_SER_ZERO,
    (
        SELECT COUNT(*)
        FROM pulso_content.pipeline_producao
    ) as total_pipeline;
-- ESTADO REAL ESPERADO:
-- ideias_aprovadas: 119
-- ideias_rascunho: 10
-- roteiros_rascunho: 119
-- roteiros_aprovados_DEVE_SER_ZERO: 0
-- audios_DEVE_SER_ZERO: 0
-- total_pipeline: 82
-- 7. VALIDAÇÃO CRÍTICA
SELECT '7. VALIDACAO CRITICA' as titulo,
    CASE
        WHEN (
            SELECT COUNT(*)
            FROM pulso_content.roteiros
            WHERE status IN ('APROVADO', 'EM_REVISAO')
        ) = 0
        AND (
            SELECT COUNT(*)
            FROM pulso_content.audios
        ) = 0
        AND (
            SELECT COUNT(*)
            FROM pulso_content.pipeline_producao
            WHERE status = 'PRONTO_PUBLICACAO'
        ) = 0 THEN 'SUCESSO - Banco sem dados mock, apenas dados reais'
        ELSE 'FALHA - Ainda há dados mock ou inconsistências'
    END as resultado;