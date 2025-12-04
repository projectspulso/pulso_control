-- =====================================================
-- VALIDAÇÃO RÁPIDA - AJUSTE DE DATAS
-- =====================================================
-- Execute APÓS aplicar o script ajustar_datas_inicio_projeto.sql
-- =====================================================

-- 1. Resumo geral
SELECT 
  'RESUMO GERAL' as categoria,
  (SELECT COUNT(*) FROM pulso_content.ideias WHERE status = 'APROVADA') as ideias_aprovadas,
  (SELECT COUNT(*) FROM pulso_content.roteiros) as roteiros_criados,
  (SELECT COUNT(*) FROM pulso_content.audios) as audios_gerados,
  (SELECT COUNT(*) FROM pulso_content.pipeline_producao WHERE data_publicacao IS NOT NULL) as items_agendados;

-- 2. Distribuição de datas de publicação
SELECT 
  'CALENDÁRIO' as categoria,
  MIN(data_publicacao::date) as primeira_publicacao,
  MAX(data_publicacao::date) as ultima_publicacao,
  (MAX(data_publicacao::date) - MIN(data_publicacao::date)) as dias_cobertos,
  COUNT(*) as total_posts,
  ROUND(COUNT(*)::numeric / (MAX(data_publicacao::date) - MIN(data_publicacao::date) + 1), 2) as media_posts_dia
FROM pulso_content.pipeline_producao
WHERE data_publicacao IS NOT NULL;

-- 3. Primeiras 10 publicações
SELECT 
  'TOP 10 PUBLICAÇÕES' as categoria,
  ROW_NUMBER() OVER (ORDER BY pp.data_publicacao) as ordem,
  i.titulo,
  pp.status,
  TO_CHAR(pp.data_publicacao, 'DD/MM/YYYY') as data,
  TO_CHAR(pp.data_publicacao, 'HH24:MI') as hora,
  TO_CHAR(pp.data_publicacao, 'Day') as dia_semana
FROM pulso_content.pipeline_producao pp
LEFT JOIN pulso_content.ideias i ON i.id = pp.ideia_id
WHERE pp.data_publicacao IS NOT NULL
ORDER BY pp.data_publicacao
LIMIT 10;

-- 4. Posts por dia (primeiros 15 dias)
SELECT 
  'DISTRIBUIÇÃO DIÁRIA' as categoria,
  data_publicacao::date as dia,
  TO_CHAR(data_publicacao::date, 'Day') as dia_semana,
  COUNT(*) as total_posts,
  array_agg(TO_CHAR(data_publicacao, 'HH24:MI') ORDER BY data_publicacao) as horarios
FROM pulso_content.pipeline_producao
WHERE data_publicacao IS NOT NULL
GROUP BY data_publicacao::date
ORDER BY dia
LIMIT 15;

-- 5. Status do pipeline
SELECT 
  'PIPELINE STATUS' as categoria,
  status,
  COUNT(*) as total,
  COUNT(CASE WHEN data_publicacao IS NOT NULL THEN 1 END) as com_agenda,
  MIN(data_publicacao::date) as primeira_data,
  MAX(data_publicacao::date) as ultima_data
FROM pulso_content.pipeline_producao
GROUP BY status
ORDER BY total DESC;

-- 6. Verificar se há conflitos de horário
SELECT 
  'CONFLITOS' as categoria,
  data_publicacao,
  COUNT(*) as posts_mesmo_horario
FROM pulso_content.pipeline_producao
WHERE data_publicacao IS NOT NULL
GROUP BY data_publicacao
HAVING COUNT(*) > 1
ORDER BY data_publicacao;

-- 7. Ideias sem data de publicação
SELECT 
  'PENDÊNCIAS' as categoria,
  COUNT(*) as ideias_sem_data,
  array_agg(status) as status_encontrados
FROM pulso_content.pipeline_producao
WHERE data_publicacao IS NULL;

-- =====================================================
-- RESULTADO ESPERADO:
-- =====================================================
-- RESUMO GERAL:
--   - ideias_aprovadas: 119
--   - roteiros_criados: 1
--   - audios_gerados: 0
--   - items_agendados: 129
--
-- CALENDÁRIO:
--   - primeira_publicacao: 2025-12-10
--   - ultima_publicacao: 2026-01-22 (aprox.)
--   - dias_cobertos: 43
--   - media_posts_dia: 3.00
--
-- CONFLITOS: 0 linhas (não deve haver posts no mesmo horário)
-- PENDÊNCIAS: 0 ideias_sem_data
-- =====================================================
