-- 067_veto_interno_tambem_nas_tres.sql — 2026-09-08
--
-- SOBRA QUE A PROVA REVELOU. Depois da 065 eu simulei um usuário LOGADO que não está em
-- usuarios_internos — o intruso que o cadastro aberto teria produzido. Resultado:
--
--   roteiros 0 · videos 0   <- o veto funcionando
--   ideias   212            <- ainda via
--
-- Porque a restritiva das três tabelas do hub era `interno OU linha publicada`, e o ramo "ou
-- publicada" valia para qualquer papel, `authenticated` incluído. Ler catálogo não mostraria isso:
-- só a simulação mostrou. E `ideias.metadata` é justamente onde mora a `checagem` (as fontes).
--
-- POR QUE O RAMO PÚBLICO NÃO É MAIS NECESSÁRIO. Ele existia para o hub, que lia as tabelas. Desde
-- a 066 o hub lê `vw_hub_videos`/`vw_hub_links`, e view roda com o privilégio do dono dela — passa
-- pela RLS sozinha. Ninguém mais depende do ramo público.
--
-- POR QUE ADICIONAR EM VEZ DE TROCAR. Restritivas se multiplicam (AND). Somando `veto_so_interno`
-- às três, o efeito vira (interno OU publicado) E (interno) = interno. Mesmo destino de reescrever
-- a policy, sem apagar nada.

create policy veto_so_interno on pulso_content.pipeline_producao
  as restrictive for all to public
  using (exists (select 1 from pulso_core.usuarios_internos u
                  where u.auth_user_id = auth.uid() and u.ativo))
  with check (exists (select 1 from pulso_core.usuarios_internos u
                       where u.auth_user_id = auth.uid() and u.ativo));

create policy veto_so_interno on pulso_content.ideias
  as restrictive for all to public
  using (exists (select 1 from pulso_core.usuarios_internos u
                  where u.auth_user_id = auth.uid() and u.ativo))
  with check (exists (select 1 from pulso_core.usuarios_internos u
                       where u.auth_user_id = auth.uid() and u.ativo));

create policy veto_so_interno on pulso_content.metricas_publicacao
  as restrictive for all to public
  using (exists (select 1 from pulso_core.usuarios_internos u
                  where u.auth_user_id = auth.uid() and u.ativo))
  with check (exists (select 1 from pulso_core.usuarios_internos u
                       where u.auth_user_id = auth.uid() and u.ativo));

-- CONFERÊNCIA: repetir a simulação do intruso — ideias tem que virar 0, e o hub continuar 200.
