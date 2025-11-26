-- =====================================================
-- Criar view pública vw_agenda_publicacao_detalhada
-- =====================================================
-- Esta view é usada pelo Kanban e Calendário no front
DROP VIEW IF EXISTS public.vw_agenda_publicacao_detalhada CASCADE;
CREATE OR REPLACE VIEW public.vw_agenda_publicacao_detalhada AS
SELECT *
FROM pulso_content.vw_agenda_publicacao_detalhada;
-- Permissões
GRANT SELECT ON public.vw_agenda_publicacao_detalhada TO anon,
    authenticated;
-- Comentário
COMMENT ON VIEW public.vw_agenda_publicacao_detalhada IS 'View pública para agenda de publicação com todos os dados: canal, série, ideia, roteiro, pipeline, plano de publicação';
-- Recarregar cache
NOTIFY pgrst,
'reload schema';
-- Verificação
SELECT 'View pública vw_agenda_publicacao_detalhada criada com sucesso!' as status;
-- Testar a view
SELECT canal,
    serie,
    ideia_titulo,
    pipeline_status,
    tem_roteiro,
    tem_audio,
    tem_video,
    datahora_publicacao_planejada
FROM public.vw_agenda_publicacao_detalhada
WHERE datahora_publicacao_planejada IS NOT NULL
ORDER BY datahora_publicacao_planejada
LIMIT 5;