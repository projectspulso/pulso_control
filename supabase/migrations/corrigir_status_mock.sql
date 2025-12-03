-- ================================================================
-- CORREÇÃO DE STATUS MOCK - ROTEIROS
-- ================================================================
-- Criado em: 2025-12-03
-- Objetivo: Corrigir status de roteiros que foram marcados como 
--           APROVADO ou EM_REVISAO por scripts de teste/seed
-- Realidade: Todos devem estar em RASCUNHO até aprovação manual real
-- ================================================================

-- 1. VERIFICAR ANTES DA CORREÇÃO
SELECT 
  'ANTES DA CORRECAO' as momento,
  status,
  COUNT(*) as total
FROM pulso_content.roteiros
GROUP BY status
ORDER BY COUNT(*) DESC;

-- 2. MOSTRAR ROTEIROS QUE SERÃO CORRIGIDOS
SELECT 
  'ROTEIROS COM STATUS MOCK' as categoria,
  id,
  titulo,
  status as status_atual,
  'RASCUNHO' as novo_status,
  created_at
FROM pulso_content.roteiros
WHERE status IN ('APROVADO', 'EM_REVISAO')
ORDER BY created_at;

-- 3. CORRIGIR STATUS DOS ROTEIROS
-- Todos roteiros APROVADO → RASCUNHO
UPDATE pulso_content.roteiros
SET 
  status = 'RASCUNHO',
  updated_at = NOW()
WHERE status = 'APROVADO';

-- Todos roteiros EM_REVISAO → RASCUNHO
UPDATE pulso_content.roteiros
SET 
  status = 'RASCUNHO',
  updated_at = NOW()
WHERE status = 'EM_REVISAO';

-- 4. VERIFICAR DEPOIS DA CORREÇÃO
SELECT 
  'APOS CORRECAO' as momento,
  status,
  COUNT(*) as total
FROM pulso_content.roteiros
GROUP BY status
ORDER BY COUNT(*) DESC;

-- 5. VALIDAÇÃO FINAL
SELECT 
  'VALIDACAO' as verificacao,
  COUNT(*) as roteiros_aprovados_ou_revisao,
  CASE 
    WHEN COUNT(*) = 0 THEN 'OK - Todos em RASCUNHO'
    ELSE 'ATENÇÃO - Ainda há status incorretos'
  END as resultado
FROM pulso_content.roteiros
WHERE status IN ('APROVADO', 'EM_REVISAO');

-- ================================================================
-- OBSERVAÇÃO IMPORTANTE
-- ================================================================
-- Após esta correção:
-- - Todos os 119 roteiros estarão em RASCUNHO
-- - Workflow WF02 (Gerar Áudio) não rodará pois busca status APROVADO
-- - Será necessário aprovar manualmente roteiros reais conforme workflow
-- - Pipeline de produção refletirá estado real sem mock
-- ================================================================
