-- ============================================================
-- 083 — Ficha completa do episódio dos Longos: metadata do episódio + tabela de cortes
-- Pedido: dono, 05/11/2026 ("os detalhes do episódio têm que ser completos igual aos detalhes dos curtos").
-- O episódio passa a guardar o que cada etapa produziu (fontes, trava do segredo, narração, montagem,
-- publicação), e cada corte vertical vira uma linha própria, com status e publicação por rede.
-- Vídeo com o rosto do dono vai no bucket PRIVADO bastidores (078/080), lido por URL assinada.
-- Regras: [x] R-044 tabela no schema do domínio  [x] RLS interno (padrão interno_total_v2)
--   [x] grants explícitos  [x] sem view nova  [x] reversão
-- Reversão: drop table pulso_content.episodio_cortes; alter table pulso_content.episodios drop column metadata;
-- ============================================================
begin;

alter table pulso_content.episodios add column if not exists metadata jsonb not null default '{}'::jsonb;
comment on column pulso_content.episodios.metadata is
  'Ficha do episódio: fontes{assuntos,casos,banco}, trava{data,receitas,comuns}, narracao{blocos,total_s,voz}, montagem{versao,duracao_s,video,legenda,em}, publicacao{canal,url,data}. Escrito pelos motores dos Longos.';

create table if not exists pulso_content.episodio_cortes (
  id           uuid primary key default gen_random_uuid(),
  episodio_id  uuid not null references pulso_content.episodios(id) on delete cascade,
  numero       int  not null,
  titulo       text not null,
  gancho       text not null default '',
  inicio_s     numeric not null,
  fim_s        numeric not null,
  duracao_s    numeric not null,
  video        text,                                   -- caminho no bucket bastidores
  status       text not null default 'pronto' check (status in ('pronto','aprovado','publicado','descartado')),
  publicacoes  jsonb not null default '{}'::jsonb,     -- {rede: {url, data}}
  criado_em    timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (episodio_id, numero)
);

alter table pulso_content.episodio_cortes enable row level security;
drop policy if exists interno_total_v2 on pulso_content.episodio_cortes;
create policy interno_total_v2 on pulso_content.episodio_cortes for all to authenticated
  using (exists (select 1 from pulso_core.usuarios_internos u where u.auth_user_id = auth.uid() and u.ativo))
  with check (exists (select 1 from pulso_core.usuarios_internos u where u.auth_user_id = auth.uid() and u.ativo));

revoke all on pulso_content.episodio_cortes from public, anon;
grant select, insert, update, delete on pulso_content.episodio_cortes to authenticated, service_role;

do $$ begin
  set local role authenticated;
  perform 1 from pulso_content.episodio_cortes limit 1;
  perform metadata from pulso_content.episodios limit 1;
  reset role;
end $$;

commit;
