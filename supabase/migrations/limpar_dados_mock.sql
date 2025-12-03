-- ================================================================
-- LIMPEZA DE DADOS MOCK DO PIPELINE DE PRODUÇÃO
-- ================================================================
-- Criado em: 2025-12-03
-- Objetivo: Remover registros com status PRONTO_PUBLICACAO mas sem áudio/vídeo
--           (dados de teste/seed que não refletem a realidade)
-- ================================================================

-- 1. Verificar quantos serão deletados
SELECT 
  'ANTES DA LIMPEZA' as momento,
  COUNT(*) as total_mock,
  'status=PRONTO_PUBLICACAO mas audio_id=NULL e video_id=NULL' as criterio
FROM pulso_content.pipeline_producao
WHERE status = 'PRONTO_PUBLICACAO'
  AND audio_id IS NULL
  AND video_id IS NULL;

-- 2. Mostrar os registros que serão deletados (para auditoria)
SELECT 
  id,
  status,
  audio_id,
  video_id,
  created_at,
  metadata->>'canal_nome' as canal,
  metadata->>'serie_nome' as serie
FROM pulso_content.pipeline_producao
WHERE status = 'PRONTO_PUBLICACAO'
  AND audio_id IS NULL
  AND video_id IS NULL
ORDER BY created_at;

-- 3. DELETAR dados mock
DELETE FROM pulso_content.pipeline_producao
WHERE status = 'PRONTO_PUBLICACAO'
  AND audio_id IS NULL
  AND video_id IS NULL;

-- 4. Verificar estado final
SELECT 
  'APOS LIMPEZA' as momento,
  status,
  COUNT(*) as total
FROM pulso_content.pipeline_producao
GROUP BY status
ORDER BY COUNT(*) DESC;

-- 5. Confirmar que não há mais registros "prontos" sem assets
SELECT 
  'VALIDACAO FINAL' as verificacao,
  COUNT(*) as itens_prontos_sem_assets,
  CASE 
    WHEN COUNT(*) = 0 THEN 'OK - Nenhum mock restante'
    ELSE 'ATENÇÃO - Ainda há dados inconsistentes'
  END as resultado
FROM pulso_content.pipeline_producao
WHERE status = 'PRONTO_PUBLICACAO'
  AND audio_id IS NULL
  AND video_id IS NULL;

-- ================================================================
-- RESUMO FINAL
-- ================================================================
SELECT 
  'RESUMO GERAL' as secao,
  COUNT(*) as total_pipeline,
  COUNT(CASE WHEN audio_id IS NOT NULL THEN 1 END) as com_audio,
  COUNT(CASE WHEN video_id IS NOT NULL THEN 1 END) as com_video,
  COUNT(CASE WHEN audio_id IS NULL AND video_id IS NULL THEN 1 END) as sem_assets
FROM pulso_content.pipeline_producao;
