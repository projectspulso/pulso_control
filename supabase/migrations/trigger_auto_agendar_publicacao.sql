-- =====================================================
-- TRIGGER: AUTO-AGENDAR PUBLICAÇÃO DE NOVAS IDEIAS
-- =====================================================
-- Este trigger garante que toda nova ideia inserida no pipeline
-- receba automaticamente uma data_publicacao calculada
-- baseada no último horário agendado + próximo slot disponível
-- =====================================================
-- =====================================================
-- FUNÇÃO: Calcular próxima data de publicação
-- =====================================================
CREATE OR REPLACE FUNCTION pulso_content.fn_calcular_proxima_data_publicacao() RETURNS timestamp with time zone LANGUAGE plpgsql AS $$
DECLARE ultima_data timestamp with time zone;
proxima_data timestamp with time zone;
data_base timestamp with time zone;
horarios int [] := ARRAY [9, 15, 21];
-- 9h, 15h, 21h
hora_atual int;
indice_hora int;
dia_atual date;
BEGIN -- Buscar a última data de publicação agendada
SELECT MAX(data_publicacao) INTO ultima_data
FROM pulso_content.pipeline_producao
WHERE data_publicacao IS NOT NULL;
-- Se não houver nenhuma data agendada, começar em 10/12/2025 às 09:00
IF ultima_data IS NULL THEN RETURN '2025-12-10 09:00:00'::timestamp with time zone;
END IF;
-- Extrair hora da última data
hora_atual := EXTRACT(
    HOUR
    FROM ultima_data
)::int;
dia_atual := ultima_data::date;
-- Determinar o próximo horário disponível
IF hora_atual < 9 THEN -- Antes das 9h, próximo slot é 9h do mesmo dia
proxima_data := (dia_atual || ' 09:00:00')::timestamp with time zone;
ELSIF hora_atual >= 9
AND hora_atual < 15 THEN -- Entre 9h e 15h, próximo slot é 15h do mesmo dia
proxima_data := (dia_atual || ' 15:00:00')::timestamp with time zone;
ELSIF hora_atual >= 15
AND hora_atual < 21 THEN -- Entre 15h e 21h, próximo slot é 21h do mesmo dia
proxima_data := (dia_atual || ' 21:00:00')::timestamp with time zone;
ELSE -- Depois das 21h, próximo slot é 9h do dia seguinte
proxima_data := (
    (dia_atual + INTERVAL '1 day')::date || ' 09:00:00'
)::timestamp with time zone;
END IF;
-- Verificar se o slot calculado já está ocupado
WHILE EXISTS (
    SELECT 1
    FROM pulso_content.pipeline_producao
    WHERE data_publicacao = proxima_data
) LOOP -- Se já existe, avançar para o próximo slot
hora_atual := EXTRACT(
    HOUR
    FROM proxima_data
)::int;
dia_atual := proxima_data::date;
IF hora_atual = 9 THEN proxima_data := (dia_atual || ' 15:00:00')::timestamp with time zone;
ELSIF hora_atual = 15 THEN proxima_data := (dia_atual || ' 21:00:00')::timestamp with time zone;
ELSE -- hora_atual = 21
proxima_data := (
    (dia_atual + INTERVAL '1 day')::date || ' 09:00:00'
)::timestamp with time zone;
END IF;
END LOOP;
RETURN proxima_data;
END;
$$;
-- =====================================================
-- TRIGGER FUNCTION: Auto-agendar ao inserir no pipeline
-- =====================================================
CREATE OR REPLACE FUNCTION pulso_content.trg_auto_agendar_publicacao() RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE nova_data timestamp with time zone;
BEGIN -- Se data_publicacao já foi definida manualmente, não sobrescrever
IF NEW.data_publicacao IS NOT NULL THEN RETURN NEW;
END IF;
-- Calcular próxima data disponível
nova_data := pulso_content.fn_calcular_proxima_data_publicacao();
-- Atribuir ao novo registro
NEW.data_publicacao := nova_data;
-- Se data_prevista também estiver nula, usar a mesma data
IF NEW.data_prevista IS NULL THEN NEW.data_prevista := nova_data;
END IF;
RETURN NEW;
END;
$$;
-- =====================================================
-- CRIAR TRIGGER no pipeline_producao
-- =====================================================
-- Remover trigger se já existir
DROP TRIGGER IF EXISTS trigger_auto_agendar_publicacao ON pulso_content.pipeline_producao;
-- Criar novo trigger
CREATE TRIGGER trigger_auto_agendar_publicacao BEFORE
INSERT ON pulso_content.pipeline_producao FOR EACH ROW EXECUTE FUNCTION pulso_content.trg_auto_agendar_publicacao();
-- =====================================================
-- COMENTÁRIOS
-- =====================================================
COMMENT ON FUNCTION pulso_content.fn_calcular_proxima_data_publicacao() IS 'Calcula a próxima data/hora disponível para publicação baseado no calendário existente. 
Usa slots de 9h, 15h e 21h. Se um slot já estiver ocupado, avança para o próximo.';
COMMENT ON FUNCTION pulso_content.trg_auto_agendar_publicacao() IS 'Trigger function que automaticamente atribui data_publicacao e data_prevista 
quando um novo item é inserido no pipeline_producao, caso esses campos estejam NULL.';
-- =====================================================
-- TESTE DO TRIGGER
-- =====================================================
DO $$
DECLARE 
    test_ideia_id uuid;
    data_atribuida timestamp with time zone;
BEGIN 
    -- Buscar primeira ideia que já existe no pipeline
    SELECT ideia_id INTO test_ideia_id
    FROM pulso_content.pipeline_producao
    LIMIT 1;
    
    -- Se não houver ideias no pipeline, buscar qualquer ideia
    IF test_ideia_id IS NULL THEN
        SELECT id INTO test_ideia_id
        FROM pulso_content.ideias
        LIMIT 1;
    END IF;
    
    -- Inserir item de teste SEM data_publicacao
    INSERT INTO pulso_content.pipeline_producao (
        ideia_id,
        status,
        prioridade
    )
    VALUES (
        test_ideia_id,
        'AGUARDANDO_ROTEIRO',
        5
    )
    RETURNING data_publicacao INTO data_atribuida;
    
    -- Deletar o item de teste (rollback do insert)
    DELETE FROM pulso_content.pipeline_producao
    WHERE ideia_id = test_ideia_id
        AND data_publicacao = data_atribuida
        AND status = 'AGUARDANDO_ROTEIRO'
        AND prioridade = 5;
    
    -- Mostrar resultado
    RAISE NOTICE '';
    RAISE NOTICE '🧪 TESTE DO TRIGGER:';
    RAISE NOTICE '   ✅ Trigger instalado com sucesso!';
    RAISE NOTICE '   ✅ Data atribuída automaticamente: %', data_atribuida;
    RAISE NOTICE '   ✅ Item de teste removido';
    RAISE NOTICE '';
    RAISE NOTICE '📌 Próximas inserções no pipeline receberão data automaticamente!';
END $$;
-- =====================================================
-- QUERY PARA VISUALIZAR PRÓXIMA DATA DISPONÍVEL
-- =====================================================
SELECT 'Próxima data disponível:' as info,
    pulso_content.fn_calcular_proxima_data_publicacao() as proxima_data,
    TO_CHAR(
        pulso_content.fn_calcular_proxima_data_publicacao(),
        'DD/MM/YYYY HH24:MI'
    ) as formatado;