-- ============================================================
-- 084 — Fábrica de cortes por dentro: destinos, tipo do corte e agenda de publicação
-- Pedido: dono, 05/11/2026 ("pode seguir com a fábrica de cortes por dentro"). Plano:
-- Cockpit/bastidores/PLANO-fabrica-de-cortes-2026-11-05.md (§0 com as regras do digiai_mkt).
-- · configuracoes.cortes_destinos: Bastidores DIGIAI (o Pulso publica), DIGIAI e pessoal (job
--   para a fila do digiai_mkt: um publicador por conta), com modo por rede, estilo e cadência.
-- · episodio_cortes.tipo: gancho | historia | tecnico | licao, para escolher o destino.
-- · corte_publicacoes: cada corte × destino × rede, com data, arquivo da versão, legenda e status.
-- As contas ainda não existem (criação com o Geral e o dono); a agenda é planejada antes delas.
-- Regras: [x] R-044 tabela no schema do domínio  [x] RLS interno  [x] grants explícitos  [x] reversão
-- Reversão: drop table pulso_content.corte_publicacoes; alter table pulso_content.episodio_cortes drop column tipo;
--           delete from pulso_core.configuracoes where chave = 'cortes_destinos';
-- ============================================================
begin;

alter table pulso_content.episodio_cortes add column if not exists tipo text
  check (tipo in ('gancho','historia','tecnico','licao'));

create table if not exists pulso_content.corte_publicacoes (
  id            uuid primary key default gen_random_uuid(),
  corte_id      uuid not null references pulso_content.episodio_cortes(id) on delete cascade,
  destino       text not null,                       -- id em configuracoes.cortes_destinos
  rede          text not null,                       -- youtube | instagram | facebook | tiktok | kwai | instagram_story | facebook_story | whatsapp_status | fila_mkt
  modo          text not null check (modo in ('auto','rascunho','manual','job')),
  agendado_para timestamptz,
  video         text,                                -- versão do destino no bucket bastidores
  legenda       text not null default '',
  status        text not null default 'planejado' check (status in ('planejado','publicado','erro','cancelado','aguarda_conta')),
  url           text,
  publicado_em  timestamptz,
  erro          text,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (corte_id, destino, rede)
);
create index if not exists corte_publicacoes_agenda_idx on pulso_content.corte_publicacoes (agendado_para);

alter table pulso_content.corte_publicacoes enable row level security;
drop policy if exists interno_total_v2 on pulso_content.corte_publicacoes;
create policy interno_total_v2 on pulso_content.corte_publicacoes for all to authenticated
  using (exists (select 1 from pulso_core.usuarios_internos u where u.auth_user_id = auth.uid() and u.ativo))
  with check (exists (select 1 from pulso_core.usuarios_internos u where u.auth_user_id = auth.uid() and u.ativo));
revoke all on pulso_content.corte_publicacoes from public, anon;
grant select, insert, update, delete on pulso_content.corte_publicacoes to authenticated, service_role;

insert into pulso_core.configuracoes (chave, valor, tipo, categoria, descricao)
values ('cortes_destinos', $j${"atualizadoEm":"2026-11-05","destinos":[
 {"id":"bastidores_digiai","nome":"Bastidores DIGIAI","arroba":"@bastidoresdigiai","publica":"pulso","contas_criadas":false,
  "tipos":["gancho","historia","tecnico","licao"],"so_rosto_real":false,
  "selo":"BASTIDORES DIGIAI","final":["EPISÓDIO COMPLETO","no YouTube"],
  "redes":{"youtube":"auto","instagram":"auto","tiktok":"rascunho","facebook":"manual","kwai":"manual","instagram_story":"auto","facebook_story":"manual","whatsapp_status":"manual"},
  "cadencia":{"cortes_por_dia":1,"dias_semana":[1,2,3,4,5,6],"hora":"12:00","trailer_vespera":true},
  "tom":"descoberta: gancho direto, curiosidade, convida para o episódio completo"},
 {"id":"digiai","nome":"DIGIAI","arroba":"@sisdigiai","publica":"digiai_mkt","contas_criadas":true,
  "tipos":["tecnico","licao"],"so_rosto_real":false,
  "selo":"DIGIAI · BASTIDORES","final":["EPISÓDIO COMPLETO","no YouTube"],
  "redes":{"fila_mkt":"job"},
  "cadencia":{"por_semana":1,"dias_semana":[2],"hora":"10:00"},
  "tom":"empresa construindo com IA: lição prática, sem gíria, sem número fora da folha"},
 {"id":"pessoal","nome":"Pessoal do dono","arroba":null,"publica":"digiai_mkt","contas_criadas":true,
  "tipos":["historia","licao"],"so_rosto_real":true,
  "selo":"BASTIDORES","final":["EPISÓDIO COMPLETO","no YouTube"],
  "redes":{"fila_mkt":"job"},
  "cadencia":{"por_semana":3,"dias_semana":[2,4,6],"hora":"18:00"},
  "tom":"primeira pessoa, fundador, conta o erro e o que aprendeu"}
],"regras":["domingo nada sai (regra da casa)","mesmo corte não sai no mesmo dia em dois destinos","no X não se replica","pessoal só com rosto real (nunca avatar de IA)","DIGIAI e pessoal só por job na fila do digiai_mkt"]}$j$,
 'json', 'longos', 'Destinos da fábrica de cortes dos Longos (05/11/2026). O Pulso publica só no Bastidores DIGIAI; DIGIAI e pessoal vão como job ao digiai_mkt.')
on conflict (chave) do update set valor = excluded.valor, updated_at = now();

do $$ begin
  set local role authenticated;
  perform 1 from pulso_content.corte_publicacoes limit 1;
  reset role;
end $$;

commit;
