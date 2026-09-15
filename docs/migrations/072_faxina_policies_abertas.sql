-- 072_faxina_policies_abertas.sql — 2026-09-15
-- APLICADA em 15/09/2026, com a palavra do dono ("pode fazer a faxina").
--
-- PROVA PELA API REAL, depois de aplicar (JWT assinado, `scratchpad/jwt_prova.py`):
--                            intruso   dono
--   pulso_automation.ai_config    0      9
--   pulso_core.canais             0     14
--   pulso_core.series             0     21
--   pulso_core.configuracoes      0     21
--   ESCRITA do intruso em ai_config.auto_approve_roteiro (PATCH no-op): 0 linhas
--   INSERÇÃO do intruso em automation_queue: HTTP 403
--   policies com auth.role() ou using(true) em pulso_* e public: 0
-- Testada antes em transação desfeita (intruso 0, dono lendo tudo, rollback conferido em 56 policies).
-- Nada quebrou: app 200 · hub 200 com 120 cards · service_role lê ai_config (9) para gerar-audio/roteiro.
--
-- ERA PARA SER SÓ FAXINA DE NOME. A 071 deixou, sem efeito, quatro policies com nome que mente
-- ("Configurações visíveis para authenticated", "Credenciais visíveis APENAS para authenticated" e as
-- duas "editáveis"). O plano era apagá-las. Duas coisas mudaram o plano ao fazer o inventário:
--
-- 1) A ARMADILHA DE APAGAR. Aquelas quatro eram as ÚNICAS policies PERMISSIVAS de `configuracoes` e
--    `plataforma_credenciais`. O veto da 071 é RESTRITIVO — ele multiplica, não concede. Tabela com RLS
--    e ZERO permissiva nega tudo, e isso inclui o dono: apagar sem repor trancaria o dono para fora das
--    configurações pelo app. Por isso a permissiva do interno entra PRIMEIRO, e só então a antiga sai.
--
-- 2) O INVENTÁRIO ACHOU MAIS, e medido pela API REAL (JWT assinado, `scratchpad/jwt_prova.py`):
--      pulso_automation.ai_config         policy ALL using(true) + grant INSERT/UPDATE
--                                         intruso lê 9 linhas E escreve
--      pulso_automation.automation_queue  policy ALL using(true) + grant INSERT/DELETE
--                                         vazia hoje, mas o intruso pode INSERIR trabalho na fila
--      pulso_core.canais / series         "Permitir SELECT para todos" using(true) — lê 14 e 21
--    Nenhuma das quatro tinha recebido o veto em 08/09 nem na 071.
--
--    `ai_config` não guarda credencial (conferido: nome e tamanho de cada chave). Guarda a OPERAÇÃO:
--    `auto_approve_roteiro`, `auto_approve_threshold`, `max_ideias_por_dia`, `openai_model`,
--    `tts_voices`. Com escrita, um logado qualquer viraria o auto-aprovar para true e passaria por
--    cima do portão de aprovação de roteiro do dono — o portão que existe justamente por causa dos
--    erros factuais de 09/09. `automation_queue` com escrita é pior em potencial: trabalho enfileirado
--    vira ação executada pelas rotas de automação, que rodam com service_role.
--
-- UMA INTERRUPÇÃO NO MEIO, registrada: a primeira escrita deste arquivo caiu depois do cabeçalho,
-- antes de qualquer comando. Conferido no banco que NADA tinha sido aplicado (as policies das 6 tabelas
-- idênticas ao inventário) antes de retomar. Um susto do caminho: contei 58 policies contra 56 do
-- inventário — eram duas consultas com filtro diferente, e as 2 a mais são do schema `cron`.
--
-- ORDEM, e ela não é estética:
--   (a) RLS ligada (idempotente) — a tabela passa a exigir policy
--   (b) permissiva do interno — quem concede
--   (c) restritiva de veto — anula qualquer permissiva antiga que sobre
--   (d) só então as antigas saem
-- Inverter (b) e (d) tranca o dono. Inverter (a) e (b) tranca o dono também, pelo mesmo motivo.
--
-- `usuarios_internos` NÃO entra aqui: ela já tem `ve_a_propria_linha` (071), sem subconsulta. Dar a
-- ela o veto das outras seria recursão infinita e derrubaria o app inteiro.

begin;

-- (a) RLS ligada nas seis — idempotente
alter table pulso_core.configuracoes           enable row level security;
alter table pulso_core.plataforma_credenciais  enable row level security;
alter table pulso_core.canais                  enable row level security;
alter table pulso_core.series                  enable row level security;
alter table pulso_automation.ai_config         enable row level security;
alter table pulso_automation.automation_queue  enable row level security;

-- (b) permissiva do interno — PRIMEIRO, antes de qualquer remoção
create policy interno_total_v2 on pulso_core.configuracoes for all to authenticated
  using (exists (select 1 from pulso_core.usuarios_internos u where u.auth_user_id = auth.uid() and u.ativo))
  with check (exists (select 1 from pulso_core.usuarios_internos u where u.auth_user_id = auth.uid() and u.ativo));
create policy interno_total_v2 on pulso_core.plataforma_credenciais for all to authenticated
  using (exists (select 1 from pulso_core.usuarios_internos u where u.auth_user_id = auth.uid() and u.ativo))
  with check (exists (select 1 from pulso_core.usuarios_internos u where u.auth_user_id = auth.uid() and u.ativo));
create policy interno_total_v2 on pulso_core.canais for all to authenticated
  using (exists (select 1 from pulso_core.usuarios_internos u where u.auth_user_id = auth.uid() and u.ativo))
  with check (exists (select 1 from pulso_core.usuarios_internos u where u.auth_user_id = auth.uid() and u.ativo));
create policy interno_total_v2 on pulso_core.series for all to authenticated
  using (exists (select 1 from pulso_core.usuarios_internos u where u.auth_user_id = auth.uid() and u.ativo))
  with check (exists (select 1 from pulso_core.usuarios_internos u where u.auth_user_id = auth.uid() and u.ativo));
create policy interno_total_v2 on pulso_automation.ai_config for all to authenticated
  using (exists (select 1 from pulso_core.usuarios_internos u where u.auth_user_id = auth.uid() and u.ativo))
  with check (exists (select 1 from pulso_core.usuarios_internos u where u.auth_user_id = auth.uid() and u.ativo));
create policy interno_total_v2 on pulso_automation.automation_queue for all to authenticated
  using (exists (select 1 from pulso_core.usuarios_internos u where u.auth_user_id = auth.uid() and u.ativo))
  with check (exists (select 1 from pulso_core.usuarios_internos u where u.auth_user_id = auth.uid() and u.ativo));

-- (c) veto restritivo onde ainda não existe (configuracoes e plataforma_credenciais já têm, da 071)
create policy veto_so_interno on pulso_core.canais as restrictive for all to public
  using (exists (select 1 from pulso_core.usuarios_internos u where u.auth_user_id = auth.uid() and u.ativo))
  with check (exists (select 1 from pulso_core.usuarios_internos u where u.auth_user_id = auth.uid() and u.ativo));
create policy veto_so_interno on pulso_core.series as restrictive for all to public
  using (exists (select 1 from pulso_core.usuarios_internos u where u.auth_user_id = auth.uid() and u.ativo))
  with check (exists (select 1 from pulso_core.usuarios_internos u where u.auth_user_id = auth.uid() and u.ativo));
create policy veto_so_interno on pulso_automation.ai_config as restrictive for all to public
  using (exists (select 1 from pulso_core.usuarios_internos u where u.auth_user_id = auth.uid() and u.ativo))
  with check (exists (select 1 from pulso_core.usuarios_internos u where u.auth_user_id = auth.uid() and u.ativo));
create policy veto_so_interno on pulso_automation.automation_queue as restrictive for all to public
  using (exists (select 1 from pulso_core.usuarios_internos u where u.auth_user_id = auth.uid() and u.ativo))
  with check (exists (select 1 from pulso_core.usuarios_internos u where u.auth_user_id = auth.uid() and u.ativo));

-- (d) só agora as antigas saem — as que mentem no nome e as que abrem com using(true)
drop policy if exists "Configurações visíveis para authenticated"        on pulso_core.configuracoes;
drop policy if exists "Configurações editáveis para authenticated"       on pulso_core.configuracoes;
drop policy if exists "Credenciais visíveis apenas para authenticated"   on pulso_core.plataforma_credenciais;
drop policy if exists "Credenciais editáveis apenas para authenticated"  on pulso_core.plataforma_credenciais;
drop policy if exists "Permitir SELECT para todos"                       on pulso_core.canais;
drop policy if exists "Permitir SELECT para todos"                       on pulso_core.series;
drop policy if exists ai_config_read                                     on pulso_automation.ai_config;
drop policy if exists ai_config_write                                    on pulso_automation.ai_config;
drop policy if exists automation_queue_read                              on pulso_automation.automation_queue;
drop policy if exists automation_queue_write                             on pulso_automation.automation_queue;

commit;

-- CONFERÊNCIA (pela API real, `python scratchpad/jwt_prova.py DEPOIS`):
--   intruso -> ai_config 0 · automation_queue 0 · canais 0 · series 0 · configuracoes 0 · escrita 0
--   dono    -> ai_config 9 · canais 14 · series 21 · configuracoes 21 (nada trancado)
--   hub, espelho, app -> 200 · rotas de API (service_role, bypassrls) -> intactas
--   policies com nome que mente ou using(true) nessas seis tabelas -> nenhuma
