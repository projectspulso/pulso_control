-- 070_views_security_invoker.sql — 2026-09-14
-- APLICADA em 14/09/2026, com a palavra do dono ("então vamos corrigir"). Espelho aqui.
--
-- PROVA PELA API REAL, antes e depois — nao por `set local role`. JWT assinado com a chave do proprio
-- projeto (HS256), para um `sub` que nao existe em usuarios_internos. Nenhuma conta criada, nenhuma
-- senha usada: a RLS so le o `sub` do token. Chamadas feitas ao PostgREST de producao.
--
--                           ANTES              DEPOIS
--                           intruso  dono      intruso  dono
--   public.roteiros          225     225          0     225
--   public.ideias            291     291          0     291
--   public.configuracoes      21      21          0      21
--   pulso_core.configuracoes  21      21          0      21
--   pulso_core.usuarios_int.   1       1          0       1
--   pulso_content.v_custos_mes 10     10          0      10
--   ESCRITA do intruso em configuracoes (PATCH no-op): 1 linha -> 0
--
-- Nada quebrou, conferido depois: hub publico 200 com 120 cards · vw_hub_videos (anon) 200 ·
-- v_espelho_pulso_dias (anon) 200 · app 200.
--
--
-- O QUE ESTA ABERTO, MEDIDO. Das 69 views do PULSO, 68 sao SECURITY DEFINER por omissao — no
-- Postgres, view sem `security_invoker` le as tabelas com o privilegio de QUEM A CRIOU, nao de quem
-- consulta. E TODAS as 69 estao liberadas (SELECT) a `authenticated`. Resultado: a RLS ligada em
-- 08/09 nas 20 tabelas de pulso_content e atravessada por qualquer usuario logado, pela view.
--
-- Simulado com um usuario logado que NAO esta em usuarios_internos:
--   pulso_content.roteiros (tabela)   0     <- a RLS funciona
--   public.roteiros        (view)     225   <- e a view passa por cima
--   public.ideias          (view)     291   (com metadata, onde mora a checagem)
--   public.configuracoes   (view)     21
--   public.usuarios_internos (view)   1
--   pulso_content.v_custos_mes (view) 10    (financeiro)
--
-- ERRO MEU QUE ISTO CORRIGE. Em 08/09 declarei "intruso logado ve 0·0·0·0" e registrei como prova.
-- A simulacao foi feita nas TABELAS. Nunca testei as views. A superficie e a view — a mesma licao
-- que o orquestrador aprendeu no MKT e que eu repeti no anon sem aplicar ao authenticated.
--
-- CONTENCAO HOJE, que e circunstancial e nao trava: o cadastro publico esta fechado e existe 1
-- usuario (o dono, que e interno). Nenhum intruso logado existe agora. Se o cadastro reabrir, ou uma
-- conta for criada fora de usuarios_internos, esta porta abre inteira.
--
-- O QUE ESTA MIGRACAO FAZ: 65 views passam a `security_invoker = on` — respeitam a RLS e os grants
-- de quem consulta.
--
-- AS 4 QUE FICAM DEFINER, DE PROPOSITO:
--   pulso_content.vw_hub_videos, pulso_content.vw_hub_links
--       projecao PUBLICA do hub (7 campos). O anon nao tem grant nas tabelas desde a 066: aqui o
--       definer E o mecanismo de seguranca. Virar invoker derruba o hub publico.
--   public.v_espelho_pulso_dias
--       Telao, so engajamento, lida pelo anon. Mesmo motivo.
--   public.vw_agenda_semanal
--       a unica que QUEBRARIA para o proprio dono: authenticated nao tem SELECT em
--       pulso_core.agenda_semanal. E a grade da semana (dia, horario, canal), sem dado sensivel.
--       Fica definer; a alternativa seria abrir grant na tabela so para poder fechar a view.
--
-- POR QUE TODAS E NAO SO AS SENSIVEIS: invoker nao se propaga. Uma view invoker que le uma view
-- definer continua atravessando a RLS pela de dentro. Virar so as "de roteiro" deixaria a porta
-- aberta pelas views intermediarias.
--
-- CONFERIDO ANTES DE ESCREVER, sobre o dono: das 69, so vw_agenda_semanal tem tabela de base sem
-- grant para authenticated. As outras 65 continuam lendo para ele — service_role, que as rotas usam,
-- tem bypassrls e nao sente nada.
--
-- PONTO CEGO DECLARADO: essa conferencia segue a view ate TABELA e nao atravessa view-sobre-view.
-- Por isso a prova tem que ser por chamada, depois de aplicar — ver CONFERENCIA.

begin;

alter view public."assets" set (security_invoker = on);
alter view public."canais" set (security_invoker = on);
alter view public."canais_plataformas" set (security_invoker = on);
alter view public."configuracoes" set (security_invoker = on);
alter view public."conteudo_variantes" set (security_invoker = on);
alter view public."conteudo_variantes_assets" set (security_invoker = on);
alter view public."conteudos" set (security_invoker = on);
alter view public."conteudos_producao" set (security_invoker = on);
alter view public."eventos" set (security_invoker = on);
alter view public."ideias" set (security_invoker = on);
alter view public."logs_workflows" set (security_invoker = on);
alter view public."metricas_diarias" set (security_invoker = on);
alter view public."n8n_roteiro_completo" set (security_invoker = on);
alter view public."pipeline_producao" set (security_invoker = on);
alter view public."plataformas" set (security_invoker = on);
alter view public."plataformas_conectadas" set (security_invoker = on);
alter view public."posts" set (security_invoker = on);
alter view public."posts_logs" set (security_invoker = on);
alter view public."publicacoes" set (security_invoker = on);
alter view public."roteiros" set (security_invoker = on);
alter view public."series" set (security_invoker = on);
alter view public."tags" set (security_invoker = on);
alter view public."usuarios_internos" set (security_invoker = on);
alter view public."v_espelho_pulso" set (security_invoker = on);
alter view public."vw_agenda_atribuicoes" set (security_invoker = on);
alter view public."vw_agenda_publicacao_detalhada" set (security_invoker = on);
alter view public."vw_automation_queue" set (security_invoker = on);
alter view public."vw_automation_stats" set (security_invoker = on);
alter view public."vw_pipeline_status" set (security_invoker = on);
alter view public."vw_pulso_calendario_publicacao_v2" set (security_invoker = on);
alter view public."vw_pulso_canais" set (security_invoker = on);
alter view public."vw_pulso_conteudo_variantes" set (security_invoker = on);
alter view public."vw_pulso_conteudo_variantes_assets" set (security_invoker = on);
alter view public."vw_pulso_conteudos" set (security_invoker = on);
alter view public."vw_pulso_ideias" set (security_invoker = on);
alter view public."vw_pulso_pipeline_base" set (security_invoker = on);
alter view public."vw_pulso_pipeline_com_assets" set (security_invoker = on);
alter view public."vw_pulso_pipeline_com_assets_v2" set (security_invoker = on);
alter view public."vw_pulso_posts" set (security_invoker = on);
alter view public."vw_pulso_posts_metricas_diarias" set (security_invoker = on);
alter view public."vw_pulso_posts_resumo" set (security_invoker = on);
alter view public."vw_pulso_roteiros" set (security_invoker = on);
alter view public."vw_pulso_series" set (security_invoker = on);
alter view public."vw_pulso_workflow_execucoes" set (security_invoker = on);
alter view public."vw_pulso_workflows" set (security_invoker = on);
alter view public."vw_roteiros" set (security_invoker = on);
alter view public."vw_roteiros_pendentes_audio" set (security_invoker = on);
alter view public."vw_roteiros_pendentes_video" set (security_invoker = on);
alter view public."vw_roteiros_prontos_para_render" set (security_invoker = on);
alter view public."workflow_execucoes" set (security_invoker = on);
alter view public."workflows" set (security_invoker = on);
alter view pulso_content."n8n_roteiro_completo" set (security_invoker = on);
alter view pulso_content."v_custos_mes" set (security_invoker = on);
alter view pulso_content."vw_agenda_publicacao_detalhada" set (security_invoker = on);
alter view pulso_content."vw_agenda_publicacao_geral" set (security_invoker = on);
alter view pulso_content."vw_performance_por_tipo" set (security_invoker = on);
alter view pulso_content."vw_personagens_performance" set (security_invoker = on);
alter view pulso_content."vw_pipeline_calendario_publicacao" set (security_invoker = on);
alter view pulso_content."vw_pipeline_kanban" set (security_invoker = on);
alter view pulso_content."vw_pulso_pipeline_base" set (security_invoker = on);
alter view pulso_content."vw_pulso_pipeline_base_v2" set (security_invoker = on);
alter view pulso_content."vw_pulso_pipeline_com_assets" set (security_invoker = on);
alter view pulso_content."vw_pulso_pipeline_com_assets_v2" set (security_invoker = on);
alter view pulso_content."vw_roteiros_prontos_tts" set (security_invoker = on);
alter view pulso_content."vw_thumbnails_performance" set (security_invoker = on);

commit;

-- CONFERENCIA (por chamada, com os papeis):
--   intruso logado  -> public.roteiros, public.ideias, public.configuracoes, public.usuarios_internos,
--                      pulso_content.v_custos_mes: TODOS 0
--   dono (interno)  -> as mesmas views continuam devolvendo o conteudo
--   anon            -> vw_hub_videos/vw_hub_links e v_espelho_pulso_dias continuam 200
--   hub em producao -> 200 · app em producao -> 200
--
-- PARA DESFAZER uma view:  alter view <schema>."<nome>" set (security_invoker = off);
