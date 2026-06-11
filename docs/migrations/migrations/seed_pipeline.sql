-- Script para popular pipeline de produção
-- Execute no Supabase SQL Editor
-- Inserir roteiros no pipeline de produção
INSERT INTO pulso_content.pipeline_producao (
        ideia_id,
        roteiro_id,
        status,
        prioridade,
        data_prevista,
        responsavel
    )
SELECT r.ideia_id,
    r.id as roteiro_id,
    CASE
        WHEN r.status = 'RASCUNHO' THEN 'AGUARDANDO_ROTEIRO'
        WHEN r.status IN ('EM_REVISAO', 'REVISAO') THEN 'ROTEIRO_PRONTO'
        WHEN r.status = 'APROVADO' THEN 'ROTEIRO_PRONTO'
        ELSE 'AGUARDANDO_ROTEIRO'
    END as status,
    FLOOR(RANDOM() * 10 + 1)::INTEGER as prioridade,
    CURRENT_DATE + (RANDOM() * 20)::INTEGER as data_prevista,
    'Equipe PULSO' as responsavel
FROM pulso_content.roteiros r
WHERE NOT EXISTS (
        SELECT 1
        FROM pulso_content.pipeline_producao p
        WHERE p.roteiro_id = r.id
    )
LIMIT 30;
-- Verificar itens no pipeline
SELECT status,
    COUNT(*) as quantidade,
    ROUND(AVG(prioridade), 1) as prioridade_media,
    COUNT(
        CASE
            WHEN prioridade >= 8 THEN 1
        END
    ) as alta_prioridade
FROM pulso_content.pipeline_producao
GROUP BY status
ORDER BY CASE
        status
        WHEN 'AGUARDANDO_ROTEIRO' THEN 1
        WHEN 'ROTEIRO_PRONTO' THEN 2
        WHEN 'GRAVACAO' THEN 3
        WHEN 'EDICAO' THEN 4
        WHEN 'REVISAO_FINAL' THEN 5
        WHEN 'PUBLICACAO' THEN 6
        ELSE 7
    END;