-- 065_rls_aditiva_pulso_content.sql — 2026-09-08
-- Ordem do dono ("hora de resolver tudo", 08/09). Substitui a 063, que fica como registro.
--
-- POR QUE ESTA E NÃO A 063. A 063 removia as policies "Permitir tudo para todos" antes de ligar a
-- RLS. Correto, mas destrutivo — e o portão desta sessão barra remoção de policy, com razão: uma
-- policy apagada por engano não volta sozinha. Esta migração chega ao MESMO estado final sem
-- apagar nada, usando o recurso que existe exatamente para isso.
--
-- COMO POLICY RESTRITIVA RESOLVE. No Postgres, policies PERMISSIVAS se somam (OR) — é por isso que
-- "Permitir tudo para todos" com `using (true)` estragaria qualquer trava nova. Policies
-- RESTRITIVAS se multiplicam (AND) com o resultado de todas as permissivas. Então a restritiva
-- abaixo vale como veto final: por mais permissiva que seja a policy antiga, o acesso só passa se
-- a restritiva também deixar. A policy velha continua no catálogo e deixa de ter efeito.
--
-- ORDEM DOS PASSOS, E POR QUE ELA IMPORTA:
--   1) permissiva do interno PRIMEIRO. Tabela com RLS ligada e ZERO policy permissiva nega tudo.
--      Nem todas as 20 tabelas tinham policy — ligar a RLS antes deste passo apagaria o app.
--   2) restritiva depois — o veto.
--   3) enable por último — nada muda de comportamento até este ponto.
--
-- QUEM PASSA DEPOIS DISTO:
--   · service_role — bypassrls confirmado no catálogo (rolbypassrls = true). As 44 rotas de API
--     não sentem nada.
--   · interno ativo — conferido antes de aplicar: o único usuário do auth casa com
--     usuarios_internos.auth_user_id e ativo = true. A condição devolve true para ele.
--   · anon — só SELECT, só nas 3 tabelas do hub, só de conteúdo publicado. Nas outras 17 já tinha
--     perdido o grant na 064; aqui perde também pela RLS, que é a trava que sobrevive a um `grant`
--     distraído no futuro.
--
-- O BURACO QUE ISTO FECHA E QUE A 064 NÃO FECHAVA: `authenticated` tinha INSERT/UPDATE/DELETE em
-- tudo. Hoje isso é inofensivo porque o cadastro está fechado e só existe 1 usuário — mas era
-- contenção circunstancial, não trava. Se o cadastro reabrir por qualquer motivo, sem esta
-- migração o problema volta inteiro.

begin;

-- 1) PERMISSIVA: o interno ativo faz tudo, em toda tabela (tem que vir antes do enable)
do $$
declare t record;
begin
  for t in select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
            where n.nspname = 'pulso_content' and c.relkind = 'r'
  loop
    execute format($f$
      create policy interno_total_v2 on pulso_content.%I
        for all to authenticated
        using (exists (select 1 from pulso_core.usuarios_internos u
                        where u.auth_user_id = auth.uid() and u.ativo))
        with check (exists (select 1 from pulso_core.usuarios_internos u
                             where u.auth_user_id = auth.uid() and u.ativo))
    $f$, t.relname);
  end loop;
end $$;

-- 2) RESTRITIVA: o veto que anula "Permitir tudo para todos" sem apagá-la.
--    Nas 17 tabelas que o hub não usa: só interno.
do $$
declare t record;
begin
  for t in select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
            where n.nspname = 'pulso_content' and c.relkind = 'r'
              and c.relname not in ('pipeline_producao', 'ideias', 'metricas_publicacao')
  loop
    execute format($f$
      create policy veto_so_interno on pulso_content.%I
        as restrictive for all to public
        using (exists (select 1 from pulso_core.usuarios_internos u
                        where u.auth_user_id = auth.uid() and u.ativo))
        with check (exists (select 1 from pulso_core.usuarios_internos u
                             where u.auth_user_id = auth.uid() and u.ativo))
    $f$, t.relname);
  end loop;
end $$;

--    Nas 3 do hub: interno, OU linha publicada (leitura pública do que já está no ar).
create policy veto_interno_ou_publicado on pulso_content.pipeline_producao
  as restrictive for all to public
  using (exists (select 1 from pulso_core.usuarios_internos u
                  where u.auth_user_id = auth.uid() and u.ativo)
         or status in ('PUBLICADO', 'PRONTO_PUBLICACAO'))
  with check (exists (select 1 from pulso_core.usuarios_internos u
                       where u.auth_user_id = auth.uid() and u.ativo));

create policy veto_interno_ou_publicado on pulso_content.ideias
  as restrictive for all to public
  using (exists (select 1 from pulso_core.usuarios_internos u
                  where u.auth_user_id = auth.uid() and u.ativo)
         or exists (select 1 from pulso_content.pipeline_producao p
                     where p.ideia_id = ideias.id
                       and p.status in ('PUBLICADO', 'PRONTO_PUBLICACAO')))
  with check (exists (select 1 from pulso_core.usuarios_internos u
                       where u.auth_user_id = auth.uid() and u.ativo));

create policy veto_interno_ou_publicado on pulso_content.metricas_publicacao
  as restrictive for all to public
  using (exists (select 1 from pulso_core.usuarios_internos u
                  where u.auth_user_id = auth.uid() and u.ativo)
         or exists (select 1 from pulso_content.pipeline_producao p
                     where p.ideia_id = metricas_publicacao.ideia_id
                       and p.status in ('PUBLICADO', 'PRONTO_PUBLICACAO')))
  with check (exists (select 1 from pulso_core.usuarios_internos u
                       where u.auth_user_id = auth.uid() and u.ativo));

-- 3) só agora liga
do $$
declare t record;
begin
  for t in select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
            where n.nspname = 'pulso_content' and c.relkind = 'r'
  loop
    execute format('alter table pulso_content.%I enable row level security', t.relname);
  end loop;
end $$;

commit;

-- CONFERÊNCIA (por chamada real, não por leitura de catálogo):
--   anon em roteiros/videos            -> negado
--   anon em pipeline_producao/ideias   -> continua lendo o publicado (hub vivo depende)
--   hub em produção                    -> 200
--   app em produção                    -> 200 (as rotas usam service_role, que tem bypassrls)
--
-- FICA PENDENTE, e não é desta migração: as policies antigas "Permitir tudo para todos" continuam
-- no catálogo, agora sem efeito. Elas devem ser removidas pelo dono numa faxina — enquanto
-- existirem, quem ler `pg_policies` vê um nome que mente sobre o que o banco faz.
