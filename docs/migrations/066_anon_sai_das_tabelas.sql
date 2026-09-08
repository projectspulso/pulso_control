-- 066_anon_sai_das_tabelas.sql — 2026-09-08
-- O último passo do fechamento. Ordem do dono ("pode fazer o push e o que for necessário").
--
-- O QUE ISTO FECHA. Até agora o `anon` — a chave que viaja no bundle do navegador de qualquer
-- visitante — ainda lia três tabelas, porque o hub em produção dependia delas. A pior consequência
-- estava em `ideias.metadata`, que o hub buscava inteiro com `select('metadata')`:
--
--   checagem  -> AS FONTES da checagem factual. Determinação do dono, textual: "não vamos mostrar
--                para o público, mas termos isso em nosso banco, até para combater algum haters".
--                MEDIDO com a chave pública: 52 de 60 ideias expunham a checagem.
--   ancora, gancho_sugerido, gatilho_psicologico, harness, seed, experimento, padrao, raia
--             -> a receita. "RESULTADO e JORNADA sim, RECEITA nunca" é a regra dos Bastidores, e o
--                banco a desmentia desde que o hub existe.
--
-- POR QUE AGORA E NÃO ANTES. Revogar antes do deploy do hub derrubaria o site público. A sequência
-- foi: (062) criar as views mínimas -> corrigir o hub -> publicar o hub -> CONFIRMAR que o hub vivo
-- passou a usar as views -> só então revogar.
--
-- COMO A CONFIRMAÇÃO FOI FEITA, e vale registrar porque não era óbvia: o Etag do Netlify não mudou
-- e não havia tráfego para observar. Então provoquei uma ficha no hub em produção e li os
-- `edge_logs` do próprio Supabase para ver que caminho ele bateu:
--
--   /rest/v1/vw_hub_videos   2
--   /rest/v1/vw_hub_links    1
--
-- Nenhuma chamada às tabelas. É prova de comportamento do site vivo, não leitura de código nem
-- suposição de que o deploy passou.
--
-- MEDIDO ANTES: anon lia pipeline_producao, ideias e metricas_publicacao.
-- MEDIDO DEPOIS: anon lê SÓ as duas views. Zero tabelas.

revoke select on pulso_content.pipeline_producao   from anon;
revoke select on pulso_content.ideias              from anon;
revoke select on pulso_content.metricas_publicacao from anon;

-- CONFERÊNCIA (por chamada real com a chave anon):
--   ideias / pipeline_producao / metricas_publicacao -> negado
--   vw_hub_videos / vw_hub_links                     -> continuam lendo
--   hub em produção, home e ficha                    -> 200
--
-- PARA DESFAZER (só se o hub precisar voltar a ler tabela, o que não deve acontecer):
--   grant select on pulso_content.<tabela> to anon;
