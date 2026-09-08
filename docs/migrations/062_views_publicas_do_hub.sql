-- 062_views_publicas_do_hub.sql — 2026-09-08
-- APLICADA em 08/09/2026 via Management API. Espelho aqui.
--
-- O PROBLEMA. O hub público (pulsohub.netlify.app) lia `pipeline_producao` e `ideias` direto, com a
-- chave `anon` — que viaja no bundle do navegador de qualquer visitante. Ele só precisa de sete
-- campos, mas `select('metadata')` traz o objeto INTEIRO. E o metadata carrega:
--
--   checagem  -> AS FONTES da checagem factual. O dono determinou, textual: "não vamos mostrar
--                para o público, mas termos isso em nosso banco, até para combater algum haters".
--                MEDIDO com a chave pública: 52 de 60 ideias expunham a checagem.
--   ancora, gancho_sugerido, gatilho_psicologico, harness, seed, experimento, padrao, raia
--             -> a receita da operação. A regra dos Bastidores é "RESULTADO e JORNADA sim, RECEITA
--                nunca", e o banco vinha desmentindo a regra desde que o hub existe.
--
-- A SOLUÇÃO. Duas views com exatamente o que o hub consome, e nada mais. View em Postgres roda com
-- os privilégios do DONO dela, então ela continua lendo as tabelas mesmo depois que a RLS ligar e o
-- anon perder o acesso direto — que é o passo seguinte (063 e 064).
--
-- MEDIDO DEPOIS: vw_hub_videos 212 linhas (212 números distintos, zero duplicados — confere com o
-- `.limit()` que o hub aplica antes do dedupe) · vw_hub_links 853 linhas.
-- CONFERIDO rodando o hub compilado contra o banco real: home 200 com 120 cards; /v/67 200 com
-- título certo e 7 links de rede; e no HTML público, os termos checagem, ancora, gancho_sugerido,
-- gatilho_psicologico, harness, seed e experimento: TODOS ausentes.

create or replace view pulso_content.vw_hub_videos as
select (p.metadata->>'numero')::int as numero,
       p.ideia_id,
       i.titulo,
       p.metadata->>'caption'      as descricao,
       p.metadata->>'thumb'        as thumb,
       p.metadata->>'transcricao'  as transcricao,
       i.metadata->>'tipo_formato' as formato
  from pulso_content.pipeline_producao p
  join pulso_content.ideias i on i.id = p.ideia_id
 where p.status in ('PUBLICADO','PRONTO_PUBLICACAO')
   and p.metadata->>'numero' is not null;

create or replace view pulso_content.vw_hub_links as
select m.ideia_id, m.plataforma, m.url_publicacao, m.data_publicacao
  from pulso_content.metricas_publicacao m
  join pulso_content.pipeline_producao p on p.ideia_id = m.ideia_id
 where p.status in ('PUBLICADO','PRONTO_PUBLICACAO');

grant select on pulso_content.vw_hub_videos to anon, authenticated;
grant select on pulso_content.vw_hub_links  to anon, authenticated;

-- PENDENTE, e é o que dá valor a esta migração: o hub em PRODUÇÃO ainda lê as tabelas. O código
-- que lê as views está commitado em pulso_hub (2b69387) e verificado, mas não foi publicado — o
-- remoto projectspulso/pulso-hub não abre para este agente. Enquanto o hub não subir, o vazamento
-- da checagem continua no ar e o anon não pode perder o SELECT nas tabelas.
