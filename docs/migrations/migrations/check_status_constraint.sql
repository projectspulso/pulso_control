-- Verificar constraint de status
SELECT con.conname as constraint_name,
    pg_get_constraintdef(con.oid) as constraint_definition
FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE nsp.nspname = 'pulso_content'
    AND rel.relname = 'pipeline_producao'
    AND con.contype = 'c'
ORDER BY con.conname;
| constraint_name | constraint_definition | | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| pipeline_producao_prioridade_check | CHECK (
    (
        (prioridade >= 1)
        AND (prioridade <= 10)
    )
) | | pipeline_producao_status_check | CHECK (
    (
        status = ANY (
            ARRAY ['AGUARDANDO_ROTEIRO'::text, 'ROTEIRO_PRONTO'::text, 'AUDIO_GERADO'::text, 'EM_EDICAO'::text, 'PRONTO_PUBLICACAO'::text, 'PUBLICADO'::text]
        )
    )
) |