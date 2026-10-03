-- ============================================================
-- 074 — motor de stories: uma linha por story (automático IG/FB e manual TikTok/Kwai)
-- Pedido/decisão: dono, 03/10/2026, chat ("montar um plano e vamos começar as criações e o sempre
--   postar os automáticos e os manuais tbm"). Plano: docs/planos/motor-stories.md
-- Regras: [x] R-044 tabela no schema do domínio (pulso_content), nada em public
--   [x] leitura authenticated, escrita só service_role (padrão do schema)  [x] reversão abaixo
-- ============================================================
begin;

do $$ begin
  if to_regclass('pulso_content.stories') is not null then
    raise exception 'pulso_content.stories já existe — entrada diferente do medido em 03/10/2026';
  end if;
end $$;

create table pulso_content.stories (
  id            uuid primary key default gen_random_uuid(),
  ideia_id      uuid not null,
  rede          text not null check (rede in ('instagram','facebook','tiktok','kwai')),
  -- antes = expectativa para o vídeo das 19h; depois = "saiu, está no perfil"
  momento       text not null check (momento in ('antes','depois')),
  tipo          text not null check (tipo in ('imagem','video')),
  asset_url     text not null,
  -- automático: publicado | erro ; manual: pendente → feito (o dono marca na Central)
  status        text not null default 'pendente'
                check (status in ('pendente','publicado','erro','feito','pulado')),
  modo          text not null check (modo in ('auto','manual')),
  post_id       text,
  publicado_em  timestamptz,
  erro          text,
  -- métricas do Instagram (reach, replies, navigation, follows, profile_visits, shares) — a API só
  -- entrega enquanto o story está no ar (24h), então o coletor lê no mesmo dia
  metricas      jsonb,
  metricas_em   timestamptz,
  created_at    timestamptz not null default now()
);

comment on table pulso_content.stories is
  'Stories do PULSO: 2 momentos por vídeo do dia (antes/depois das 19h). IG e FB saem por API (modo auto); '
  'TikTok e Kwai são manuais (modo manual, o dono marca feito). Idempotência por (ideia, rede, momento, tipo).';

create unique index stories_uk on pulso_content.stories (ideia_id, rede, momento, tipo);
create index stories_publicado_idx on pulso_content.stories (publicado_em desc);

alter table pulso_content.stories enable row level security;
create policy stories_select on pulso_content.stories for select to authenticated using (true);

revoke all on pulso_content.stories from public, anon;
grant select on pulso_content.stories to authenticated;
grant all on pulso_content.stories to service_role;

do $$ begin
  set local role authenticated;
  perform 1 from pulso_content.stories limit 1;
  reset role;
end $$;

commit;

-- Reversão: drop table pulso_content.stories;
