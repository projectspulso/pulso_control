-- =====================================================
-- AJUSTE DE DATAS - INÍCIO DO PROJETO
-- =====================================================
-- Data original de início: 01/12/2025
-- Nova data de início: 10/12/2025
-- Diferença: +9 dias
--
-- Contexto:
-- - Temos 129 ideias aprovadas
-- - 1 roteiro criado (teste)
-- - Pipeline em estruturação
-- - Ainda não há áudios gerados
-- - Primeira data prevista era 30/11/2025
-- =====================================================

BEGIN;

-- =====================================================
-- 1. ATUALIZAR PIPELINE - DATAS PREVISTAS
-- =====================================================
-- Ajustar todas as datas previstas para +9 dias
UPDATE pulso_content.pipeline_producao
SET 
  data_prevista = data_prevista + INTERVAL '9 days',
  updated_at = NOW()
WHERE data_prevista IS NOT NULL;

-- Verificar resultado
DO $$
DECLARE
  count_atualizado INTEGER;
  primeira_data DATE;
  ultima_data DATE;
BEGIN
  SELECT COUNT(*), MIN(data_prevista::date), MAX(data_prevista::date)
  INTO count_atualizado, primeira_data, ultima_data
  FROM pulso_content.pipeline_producao
  WHERE data_prevista IS NOT NULL;
  
  RAISE NOTICE '✅ PIPELINE atualizado:';
  RAISE NOTICE '   - Items com data_prevista: %', count_atualizado;
  RAISE NOTICE '   - Primeira data: %', primeira_data;
  RAISE NOTICE '   - Última data: %', ultima_data;
END $$;

-- =====================================================
-- 2. ATUALIZAR CANAIS - METADATA (se houver data_inicio)
-- =====================================================
-- Verificar se algum canal tem data_inicio no metadata
UPDATE pulso_core.canais
SET 
  metadata = jsonb_set(
    metadata,
    '{data_inicio}',
    to_jsonb('2025-12-10'::text)
  ),
  updated_at = NOW()
WHERE metadata ? 'data_inicio';

UPDATE pulso_core.canais
SET 
  metadata = jsonb_set(
    metadata,
    '{data_lancamento}',
    to_jsonb('2025-12-10'::text)
  ),
  updated_at = NOW()
WHERE metadata ? 'data_lancamento';

-- =====================================================
-- 3. DISTRIBUIR DATAS DE PUBLICAÇÃO
-- =====================================================
-- Configurar calendário de publicação a partir de 10/12/2025
-- Assumindo 3 posts por dia (manhã 9h, tarde 15h, noite 21h)

WITH ideias_aprovadas AS (
  SELECT 
    pp.id as pipeline_id,
    ROW_NUMBER() OVER (ORDER BY pp.created_at) - 1 as ordem
  FROM pulso_content.pipeline_producao pp
  WHERE pp.status IN ('ROTEIRO_PRONTO', 'AUDIO_PRONTO', 'VIDEO_PRONTO', 'AGUARDANDO_ROTEIRO')
    AND pp.data_publicacao IS NULL
)
UPDATE pulso_content.pipeline_producao pp
SET 
  data_publicacao = (
    '2025-12-10 09:00:00'::timestamp + 
    (ia.ordem / 3) * INTERVAL '1 day' +
    CASE 
      WHEN (ia.ordem % 3) = 0 THEN INTERVAL '0 hours'  -- 9h
      WHEN (ia.ordem % 3) = 1 THEN INTERVAL '6 hours'  -- 15h
      ELSE INTERVAL '12 hours'                          -- 21h
    END
  ),
  data_prevista = CASE 
    WHEN pp.data_prevista IS NULL THEN
      '2025-12-10 09:00:00'::timestamp + 
      (ia.ordem / 3) * INTERVAL '1 day' +
      CASE 
        WHEN (ia.ordem % 3) = 0 THEN INTERVAL '0 hours'
        WHEN (ia.ordem % 3) = 1 THEN INTERVAL '6 hours'
        ELSE INTERVAL '12 hours'
      END
    ELSE pp.data_prevista
  END,
  updated_at = NOW()
FROM ideias_aprovadas ia
WHERE pp.id = ia.pipeline_id;

-- Verificar distribuição
DO $$
DECLARE
  count_com_data INTEGER;
  primeira_pub DATE;
  ultima_pub DATE;
  dias_cobertos INTEGER;
BEGIN
  SELECT 
    COUNT(*), 
    MIN(data_publicacao::date), 
    MAX(data_publicacao::date),
    MAX(data_publicacao::date) - MIN(data_publicacao::date)
  INTO count_com_data, primeira_pub, ultima_pub, dias_cobertos
  FROM pulso_content.pipeline_producao
  WHERE data_publicacao IS NOT NULL;
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ CALENDÁRIO DE PUBLICAÇÃO:';
  RAISE NOTICE '   - Items agendados: %', count_com_data;
  RAISE NOTICE '   - Primeira publicação: %', primeira_pub;
  RAISE NOTICE '   - Última publicação: %', ultima_pub;
  RAISE NOTICE '   - Período (dias): %', dias_cobertos;
  RAISE NOTICE '   - Posts por dia: ~3';
END $$;

-- =====================================================
-- 4. RELATÓRIO FINAL
-- =====================================================
DO $$
DECLARE
  total_ideias INTEGER;
  total_roteiros INTEGER;
  total_audios INTEGER;
  items_agendados INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_ideias FROM pulso_content.ideias WHERE status = 'APROVADA';
  SELECT COUNT(*) INTO total_roteiros FROM pulso_content.roteiros;
  SELECT COUNT(*) INTO total_audios FROM pulso_content.audios;
  SELECT COUNT(*) INTO items_agendados FROM pulso_content.pipeline_producao WHERE data_publicacao IS NOT NULL;
  
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'RESUMO DO AJUSTE DE DATAS';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Data de início anterior: 01/12/2025';
  RAISE NOTICE 'Nova data de início: 10/12/2025';
  RAISE NOTICE 'Ajuste aplicado: +9 dias';
  RAISE NOTICE '';
  RAISE NOTICE 'Status do conteúdo:';
  RAISE NOTICE '  - Ideias aprovadas: %', total_ideias;
  RAISE NOTICE '  - Roteiros criados: %', total_roteiros;
  RAISE NOTICE '  - Áudios gerados: %', total_audios;
  RAISE NOTICE '  - Items agendados: %', items_agendados;
  RAISE NOTICE '';
  RAISE NOTICE '✅ Todas as datas foram ajustadas!';
  RAISE NOTICE '================================================';
END $$;

COMMIT;

-- =====================================================
-- CONSULTAS DE VALIDAÇÃO (executar após o COMMIT)
-- =====================================================

-- Ver primeiras 10 publicações agendadas
SELECT 
  i.titulo,
  r.status as roteiro_status,
  pp.status as pipeline_status,
  pp.data_prevista,
  pp.data_publicacao,
  pp.data_publicacao::date as dia,
  TO_CHAR(pp.data_publicacao, 'HH24:MI') as hora
FROM pulso_content.pipeline_producao pp
LEFT JOIN pulso_content.ideias i ON i.id = pp.ideia_id
LEFT JOIN pulso_content.roteiros r ON r.id = pp.roteiro_id
WHERE pp.data_publicacao IS NOT NULL
ORDER BY pp.data_publicacao
LIMIT 10;

-- Ver distribuição de posts por dia
SELECT 
  data_publicacao::date as dia_publicacao,
  COUNT(*) as total_posts,
  array_agg(TO_CHAR(data_publicacao, 'HH24:MI') ORDER BY data_publicacao) as horarios
FROM pulso_content.pipeline_producao
WHERE data_publicacao IS NOT NULL
GROUP BY data_publicacao::date
ORDER BY dia_publicacao
LIMIT 15;

-- Ver status do pipeline
SELECT 
  status,
  COUNT(*) as total,
  COUNT(CASE WHEN data_publicacao IS NOT NULL THEN 1 END) as com_data_publicacao,
  MIN(data_publicacao::date) as primeira_data,
  MAX(data_publicacao::date) as ultima_data
FROM pulso_content.pipeline_producao
GROUP BY status
ORDER BY total DESC;
