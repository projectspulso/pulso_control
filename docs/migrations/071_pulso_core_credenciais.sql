-- 071_pulso_core_credenciais.sql — 2026-09-14
-- ESCRITA, NAO APLICADA. Aguarda a palavra do dono. Aplicar JUNTO com a 070.
--
-- O QUE ESTA ABERTO, E E O PIOR ACHADO DESDE 08/09. A 070 faz as views respeitarem a RLS. Mas
-- testando a 070, duas views continuaram vazando para o intruso logado — porque o problema nao
-- estava na view, estava na TABELA:
--
--   pulso_core.configuracoes     RLS on, policy "Configurações visíveis para authenticated"
--                                using (auth.role() = 'authenticated')
--   pulso_core.plataforma_credenciais   policy "Credenciais visíveis APENAS para authenticated"
--                                using (auth.role() = 'authenticated')
--   pulso_core.usuarios_internos RLS OFF, e authenticated le
--
-- `auth.role() = 'authenticated'` significa QUALQUER USUARIO LOGADO. E o "apenas" do nome da
-- segunda soa restritivo e nao e: e a mesma frase. Terceira policy com nome que mente nesta auditoria.
--
-- O QUE UM INTRUSO LOGADO FARIA em configuracoes — LER E ESCREVER, e isto corrige o que reportei
-- primeiro. Das 4 policies com `auth.role() = 'authenticated'`, DUAS sao `ALL`, nao SELECT. Medido com
-- update que nao muda valor nenhum (chave = chave), em transacao desfeita:
--   intruso, antes da 071: consegue alterar 21 de 21 linhas
--   intruso, depois:       0        ·   dono, depois: 21 (nao quebra)
-- Leitura: youtube_oauth, tiktok_oauth, n8n_api_key — os tokens que PUBLICAM nos canais.
-- Escrita: trocar esses tokens pelos dele, ou apagar `orcamento_travas` e desligar a trava de gasto
-- do Higgsfield, que e dinheiro real. Eu tinha escrito "leria". Era pior.
--
-- CONTENCAO HOJE, circunstancial: cadastro fechado, 1 usuario (o dono, interno). Nenhum intruso
-- existe agora — por isso nao ha evidencia de que esses tokens tenham vazado, e rotacionar por causa
-- DESTE achado nao e necessario. Abrir o cadastro sem esta migracao entregaria os canais.
--
-- A ARMADILHA DA RECURSAO, e por que usuarios_internos NAO recebe o veto das outras.
-- Todas as policies de veto fazem `exists (select 1 from pulso_core.usuarios_internos ...)`. Se
-- usuarios_internos recebesse ESSE mesmo veto, avaliar a policy exigiria ler usuarios_internos, que
-- exigiria a policy... O Postgres acusa recursao infinita e TODA tabela que usa o veto passa a dar
-- erro — o app inteiro fica fora do ar, dono incluso. Por isso usuarios_internos recebe uma policy
-- que nao consulta tabela nenhuma: cada usuario enxerga so a propria linha. Isso basta para o veto
-- das outras funcionar: o `exists` do dono encontra a linha dele; o do intruso nao encontra nada.

begin;

-- 1) usuarios_internos: RLS com policy SEM subconsulta (nao recursa)
alter table pulso_core.usuarios_internos enable row level security;

create policy ve_a_propria_linha on pulso_core.usuarios_internos
  for select to authenticated
  using (auth_user_id = auth.uid());

-- 2) configuracoes e plataforma_credenciais: o veto restritivo das outras (aditivo, nao apaga as
--    policies antigas — restritiva multiplica com AND e anula o `auth.role() = 'authenticated'`)
create policy veto_so_interno on pulso_core.configuracoes
  as restrictive for all to public
  using (exists (select 1 from pulso_core.usuarios_internos u
                  where u.auth_user_id = auth.uid() and u.ativo))
  with check (exists (select 1 from pulso_core.usuarios_internos u
                       where u.auth_user_id = auth.uid() and u.ativo));

create policy veto_so_interno on pulso_core.plataforma_credenciais
  as restrictive for all to public
  using (exists (select 1 from pulso_core.usuarios_internos u
                  where u.auth_user_id = auth.uid() and u.ativo))
  with check (exists (select 1 from pulso_core.usuarios_internos u
                       where u.auth_user_id = auth.uid() and u.ativo));

commit;

-- CONFERENCIA (070 + 071 juntas), por papel:
--   intruso logado -> configuracoes 0 · usuarios_internos 0 · roteiros 0 · ideias 0
--   dono (interno) -> configuracoes 21 · usuarios_internos 1 · roteiros e ideias com conteudo
--   anon           -> hub e espelho diario intactos
--   service_role   -> bypassrls: as rotas de API (youtube_oauth e lido por elas) nao sentem nada
--
-- FAXINA PENDENTE, do dono: as policies "Configurações visíveis para authenticated" e
-- "Credenciais visíveis apenas para authenticated" ficam no catalogo, sem efeito. Os nomes mentem.
