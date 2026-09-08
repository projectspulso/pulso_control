-- 063_rls_pulso_content.sql — 2026-09-08
-- LIGA A RLS EM pulso_content. Ordem do dono ("hora de resolver tudo", 08/09).
--
-- O QUE ESTAVA ABERTO, MEDIDO COM A CHAVE PÚBLICA (a anon, que viaja no bundle do navegador de
-- qualquer visitante do hub):
--   roteiros 220 linhas — o `conteudo_md` INTEIRO, o roteiro completo de cada vídeo
--   ideias 283 · pipeline_producao 220 · metricas_publicacao 853 · videos 67 · plano_publicacao 20
--   e em ideias.metadata: checagem (AS FONTES), ancora, gancho_sugerido, gatilho_psicologico,
--   harness, seed, experimento — a receita da operação. 52 de 60 ideias expunham a checagem.
--
-- A ARMADILHA QUE ESTA MIGRAÇÃO DESARMA PRIMEIRO. As tabelas já tinham policies — chamadas
-- "Permitir tudo para todos", role `public`, `using (true)`. Com RLS desligada elas não faziam
-- nada. Ligar a RLS sem removê-las teria criado o pior estado possível: RLS ativa, policies
-- presentes, e o banco exatamente tão aberto quanto antes. Uma auditoria por leitura ("RLS on?
-- sim. policies? sim.") passaria batido. Por isso a remoção vem antes do enable.
--
-- QUEM CONTINUA PASSANDO:
--   · service_role — tem BYPASSRLS. As 44 rotas de API do app não sentem nada.
--   · usuário interno ativo — o app lê pelo navegador com papel `authenticated` em 39 arquivos.
--     A policy casa auth.uid() com pulso_core.usuarios_internos.auth_user_id e exige ativo.
--   · anon — SÓ leitura, SÓ nas 3 tabelas que o hub público usa, e SÓ de conteúdo publicado.
--     Nas outras 13 tabelas o anon deixa de ler qualquer coisa. É isto que fecha os 220 roteiros.
--
-- POR QUE O anon AINDA LÊ AS 3: o hub em produção (pulsohub.netlify.app) ainda aponta para as
-- tabelas. A correção dele existe e está commitada em pulso_hub (2b69387), lendo as views
-- vw_hub_videos/vw_hub_links — mas o deploy dele não foi possível daqui (o remoto
-- projectspulso/pulso-hub não abre para este agente). ENQUANTO O HUB NÃO SUBIR, revogar o SELECT
-- do anon derruba o site público. Fechar a porta quebrando a vitrine é trocar de problema.
-- Depois do deploy do hub, aplicar a 064 (revoke total do anon).

begin;

-- 1) fora as policies permissivas — o passo que impede a "segurança de fachada"
do $$
declare p record;
begin
  for p in select schemaname, tablename, policyname from pg_policies where schemaname = 'pulso_content'
  loop
    execute format('drop policy if exists %I on %I.%I', p.policyname, p.schemaname, p.tablename);
  end loop;
end $$;

-- 2) RLS ligada em TODA tabela do schema (as 16 que estavam off + as 4 que já estavam on)
do $$
declare t record;
begin
  for t in select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
            where n.nspname = 'pulso_content' and c.relkind = 'r'
  loop
    execute format('alter table pulso_content.%I enable row level security', t.relname);
  end loop;
end $$;

-- 3) o interno ativo faz tudo, em toda tabela
do $$
declare t record;
begin
  for t in select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
            where n.nspname = 'pulso_content' and c.relkind = 'r'
  loop
    execute format($f$
      create policy interno_total on pulso_content.%I
        for all to authenticated
        using (exists (select 1 from pulso_core.usuarios_internos u
                        where u.auth_user_id = auth.uid() and u.ativo))
        with check (exists (select 1 from pulso_core.usuarios_internos u
                             where u.auth_user_id = auth.uid() and u.ativo))
    $f$, t.relname);
  end loop;
end $$;

-- 4) o público lê só o que já foi publicado, e só nas 3 tabelas do hub
create policy hub_le_publicado on pulso_content.pipeline_producao
  for select to anon
  using (status in ('PUBLICADO', 'PRONTO_PUBLICACAO'));

create policy hub_le_publicado on pulso_content.ideias
  for select to anon
  using (exists (select 1 from pulso_content.pipeline_producao p
                  where p.ideia_id = ideias.id
                    and p.status in ('PUBLICADO', 'PRONTO_PUBLICACAO')));

create policy hub_le_publicado on pulso_content.metricas_publicacao
  for select to anon
  using (exists (select 1 from pulso_content.pipeline_producao p
                  where p.ideia_id = metricas_publicacao.ideia_id
                    and p.status in ('PUBLICADO', 'PRONTO_PUBLICACAO')));

commit;

-- CONFERÊNCIA (por chamada real com a chave anon, não por leitura de catálogo):
--   roteiros            -> deve virar 0 linhas   (eram 220 roteiros completos)
--   videos              -> deve virar 0 linhas   (eram 67)
--   plano_publicacao    -> deve virar 0 linhas   (eram 20)
--   pipeline_producao   -> continua devolvendo o publicado (o hub vivo depende)
--   ideias              -> continua devolvendo as publicadas
--   hub em produção     -> 200
--
-- PARA DESFAZER (volta ao estado aberto — só em emergência, e reabre tudo acima):
--   desligar a row level security de cada tabela de pulso_content.
