-- =====================================================
-- SEED: Popular pipeline_producao com dados de teste
-- =====================================================
-- Limpar dados existentes
TRUNCATE TABLE pulso_content.pipeline_producao CASCADE;
-- Buscar IDs reais de ideias e roteiros
DO $$
DECLARE v_ideia_id UUID;
v_roteiro_id UUID;
v_serie_id UUID;
counter INT := 1;
BEGIN -- Loop pelas ideias existentes e criar pipeline para cada uma
FOR v_ideia_id,
v_serie_id IN
SELECT id,
    serie_id
FROM pulso_content.ideias
ORDER BY created_at DESC
LIMIT 30 LOOP -- Verificar se existe roteiro para essa ideia
SELECT id INTO v_roteiro_id
FROM pulso_content.roteiros
WHERE ideia_id = v_ideia_id
LIMIT 1;
-- Inserir no pipeline com status variado
INSERT INTO pulso_content.pipeline_producao (
        ideia_id,
        roteiro_id,
        status,
        prioridade,
        data_prevista,
        data_publicacao,
        responsavel,
        observacoes,
        metadata
    )
VALUES (
        v_ideia_id,
        v_roteiro_id,
        CASE
            WHEN counter % 6 = 0 THEN 'AGUARDANDO_ROTEIRO'
            WHEN counter % 6 = 1 THEN 'ROTEIRO_PRONTO'
            WHEN counter % 6 = 2 THEN 'AUDIO_GERADO'
            WHEN counter % 6 = 3 THEN 'EM_EDICAO'
            WHEN counter % 6 = 4 THEN 'PRONTO_PUBLICACAO'
            ELSE 'PUBLICADO'
        END,
        CASE
            WHEN counter % 3 = 0 THEN 1 -- alta prioridade
            WHEN counter % 3 = 1 THEN 5 -- média prioridade
            ELSE 9 -- baixa prioridade
        END,
        CURRENT_DATE + (counter || ' days')::INTERVAL,
        CASE
            WHEN counter % 6 = 5 THEN CURRENT_DATE + ((counter + 7) || ' days')::INTERVAL
            ELSE NULL
        END,
        CASE
            WHEN counter % 6 >= 2 THEN 'Equipe A'
            ELSE NULL
        END,
        CASE
            WHEN counter % 6 = 0 THEN 'Aguardando aprovação do roteiro'
            WHEN counter % 6 = 1 THEN 'Roteiro em desenvolvimento'
            WHEN counter % 6 = 2 THEN 'Gravação agendada'
            WHEN counter % 6 = 3 THEN 'Edição em andamento - Editor ' || (counter % 3 + 1)
            WHEN counter % 6 = 4 THEN 'Aguardando revisão final'
            ELSE 'Pronto para publicação'
        END,
        jsonb_build_object(
            'serie_id',
            v_serie_id,
            'duracao_estimada_min',
            8 + (counter % 15),
            'formato',
            CASE
                WHEN counter % 2 = 0 THEN 'video'
                ELSE 'audio'
            END,
            'plataformas_destino',
            ARRAY ['youtube', 'spotify', 'instagram']
        )
    );
counter := counter + 1;
END LOOP;
-- Inserir alguns registros órfãos (sem roteiro) para testar
FOR v_ideia_id,
v_serie_id IN
SELECT id,
    serie_id
FROM pulso_content.ideias
WHERE id NOT IN (
        SELECT DISTINCT ideia_id
        FROM pulso_content.pipeline_producao
        WHERE ideia_id IS NOT NULL
    )
LIMIT 10 LOOP
INSERT INTO pulso_content.pipeline_producao (
        ideia_id,
        roteiro_id,
        status,
        prioridade,
        data_prevista,
        observacoes,
        metadata
    )
VALUES (
        v_ideia_id,
        NULL,
        'AGUARDANDO_ROTEIRO',
        5,
        CURRENT_DATE + (counter || ' days')::INTERVAL,
        'Aguardando criação de roteiro',
        jsonb_build_object(
            'serie_id',
            v_serie_id,
            'formato',
            'video',
            'status_roteiro',
            'pendente'
        )
    );
counter := counter + 1;
END LOOP;
END $$;
-- Verificação
SELECT COUNT(*) as total_pipeline,
    COUNT(
        CASE
            WHEN status = 'AGUARDANDO_ROTEIRO' THEN 1
        END
    ) as aguardando_roteiro,
    COUNT(
        CASE
            WHEN status = 'ROTEIRO_PRONTO' THEN 1
        END
    ) as roteiro_pronto,
    COUNT(
        CASE
            WHEN status = 'AUDIO_GERADO' THEN 1
        END
    ) as audio_gerado,
    COUNT(
        CASE
            WHEN status = 'EM_EDICAO' THEN 1
        END
    ) as em_edicao,
    COUNT(
        CASE
            WHEN status = 'PRONTO_PUBLICACAO' THEN 1
        END
    ) as pronto_publicacao,
    COUNT(
        CASE
            WHEN status = 'PUBLICADO' THEN 1
        END
    ) as publicado,
    COUNT(
        CASE
            WHEN roteiro_id IS NOT NULL THEN 1
        END
    ) as com_roteiro,
    COUNT(
        CASE
            WHEN roteiro_id IS NULL THEN 1
        END
    ) as sem_roteiro
FROM pulso_content.pipeline_producao;
-- Mostrar alguns exemplos
SELECT pp.id,
    pp.status,
    pp.prioridade,
    i.titulo as ideia_titulo,
    r.titulo as roteiro_titulo,
    pp.data_prevista,
    pp.data_publicacao,
    pp.responsavel,
    pp.observacoes
FROM pulso_content.pipeline_producao pp
    LEFT JOIN pulso_content.ideias i ON pp.ideia_id = i.id
    LEFT JOIN pulso_content.roteiros r ON pp.roteiro_id = r.id
ORDER BY pp.created_at DESC
LIMIT 10;
-- Mensagem de sucesso
SELECT 'Pipeline de produção populado com sucesso!' as resultado;