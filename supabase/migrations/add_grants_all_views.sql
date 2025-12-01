-- =====================================================
-- ADICIONAR GRANTS EM TODAS AS VIEWS PUBLIC
-- Este é o problema real: views sem permissões!
-- =====================================================
-- GRANTS nas views principais (com INSERT/UPDATE/DELETE para operações via triggers)
GRANT SELECT,
    INSERT,
    UPDATE,
    DELETE ON public.canais TO anon,
    authenticated;
GRANT SELECT,
    INSERT,
    UPDATE,
    DELETE ON public.series TO anon,
    authenticated;
GRANT SELECT,
    INSERT,
    UPDATE,
    DELETE ON public.ideias TO anon,
    authenticated;
GRANT SELECT,
    INSERT,
    UPDATE,
    DELETE ON public.roteiros TO anon,
    authenticated;
GRANT SELECT,
    INSERT,
    UPDATE,
    DELETE ON public.pipeline_producao TO anon,
    authenticated;
GRANT SELECT,
    INSERT,
    UPDATE,
    DELETE ON public.conteudos_producao TO anon,
    authenticated;
-- GRANTS nas views auxiliares (apenas SELECT)
GRANT SELECT ON public.vw_pulso_calendario_publicacao_v2 TO anon,
    authenticated;
GRANT SELECT ON public.vw_pulso_pipeline_com_assets_v2 TO anon,
    authenticated;
GRANT SELECT ON public.vw_pulso_canais TO anon,
    authenticated;
GRANT SELECT ON public.vw_agenda_publicacao_detalhada TO anon,
    authenticated;
GRANT SELECT ON public.n8n_roteiro_completo TO anon,
    authenticated;
GRANT SELECT ON public.vw_pulso_pipeline_com_assets TO anon,
    authenticated;
GRANT SELECT ON public.vw_pulso_pipeline_base TO anon,
    authenticated;
-- GRANTS em outras views que possam existir
GRANT SELECT ON public.assets TO anon,
    authenticated;
GRANT SELECT ON public.canais_plataformas TO anon,
    authenticated;
GRANT SELECT ON public.configuracoes TO anon,
    authenticated;
GRANT SELECT ON public.conteudo_variantes TO anon,
    authenticated;
GRANT SELECT ON public.conteudo_variantes_assets TO anon,
    authenticated;
GRANT SELECT ON public.conteudos TO anon,
    authenticated;
GRANT SELECT ON public.eventos TO anon,
    authenticated;
GRANT SELECT ON public.logs_workflows TO anon,
    authenticated;
GRANT SELECT ON public.metricas_diarias TO anon,
    authenticated;
GRANT SELECT ON public.plataformas TO anon,
    authenticated;
GRANT SELECT ON public.plataformas_conectadas TO anon,
    authenticated;
GRANT SELECT ON public.posts TO anon,
    authenticated;
GRANT SELECT ON public.posts_logs TO anon,
    authenticated;
GRANT SELECT ON public.publicacoes TO anon,
    authenticated;
GRANT SELECT ON public.tags TO anon,
    authenticated;
GRANT SELECT ON public.usuarios_internos TO anon,
    authenticated;
GRANT SELECT ON public.vw_pulso_conteudo_variantes_assets TO anon,
    authenticated;
GRANT SELECT ON public.vw_pulso_posts_metricas_diarias TO anon,
    authenticated;
GRANT SELECT ON public.vw_pulso_workflow_execucoes TO anon,
    authenticated;
GRANT SELECT ON public.vw_pulso_workflows TO anon,
    authenticated;
GRANT SELECT ON public.vw_roteiros TO anon,
    authenticated;
GRANT SELECT ON public.vw_roteiros_pendentes_audio TO anon,
    authenticated;
GRANT SELECT ON public.vw_roteiros_pendentes_video TO anon,
    authenticated;
GRANT SELECT ON public.vw_roteiros_prontos_para_render TO anon,
    authenticated;
GRANT SELECT ON public.workflow_execucoes TO anon,
    authenticated;
GRANT SELECT ON public.workflows TO anon,
    authenticated;
-- Garantir execução das funções trigger
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon,
    authenticated;
-- Garantir USAGE nos schemas
GRANT USAGE ON SCHEMA public TO anon,
    authenticated;
GRANT USAGE ON SCHEMA pulso_core TO anon,
    authenticated;
GRANT USAGE ON SCHEMA pulso_content TO anon,
    authenticated;
-- Recarregar cache do PostgREST
NOTIFY pgrst,
'reload schema';
NOTIFY pgrst,
'reload config';
-- Verificação
SELECT '=== VERIFICAÇÃO DE GRANTS ===' as status;
SELECT grantee,
    table_name,
    string_agg(
        privilege_type,
        ', '
        ORDER BY privilege_type
    ) as privileges
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
    AND grantee IN ('anon', 'authenticated')
    AND table_name IN (
        'ideias',
        'canais',
        'series',
        'roteiros',
        'pipeline_producao'
    )
GROUP BY grantee,
    table_name
ORDER BY table_name,
    grantee;
SELECT 'Grants aplicados com sucesso! Aguarde 5 segundos e teste os endpoints.' as resultado;