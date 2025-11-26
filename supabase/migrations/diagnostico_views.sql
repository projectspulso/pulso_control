-- =====================================================
-- DIAGNÓSTICO: Verificar views no banco
-- =====================================================

-- 1) Verificar se a view existe em pulso_content
SELECT 
    schemaname, 
    viewname, 
    viewowner
FROM pg_views
WHERE viewname = 'vw_agenda_publicacao_detalhada'
ORDER BY schemaname;

-- 2) Verificar se existe em public
SELECT COUNT(*) as existe_em_public
FROM pg_views
WHERE schemaname = 'public' 
  AND viewname = 'vw_agenda_publicacao_detalhada';

-- 3) Se existir em pulso_content, contar registros
SELECT 'Dados em pulso_content.vw_agenda_publicacao_detalhada' as info,
       COUNT(*) as total_registros
FROM pulso_content.vw_agenda_publicacao_detalhada;

-- 4) Tentar contar em public (vai dar erro se não existir)
-- SELECT 'Dados em public.vw_agenda_publicacao_detalhada' as info,
--        COUNT(*) as total_registros
-- FROM public.vw_agenda_publicacao_detalhada;

-- 5) Listar todas as views em public
SELECT viewname 
FROM pg_views 
WHERE schemaname = 'public'
ORDER BY viewname;
