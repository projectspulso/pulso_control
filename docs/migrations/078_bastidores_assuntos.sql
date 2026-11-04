-- ============================================================
-- 078 — linha do tempo de Bastidores: assuntos + imagens privadas
-- Pedido: dono, 04/11/2026 ("timeline focada em assunto card e página de detalhes com fotos e
-- imagens do app"). Coordenado com o Orquestrador Geral (R-045): o Limelight passa a ler daqui.
-- Assunto = uma história (começo, meio e fim), não um commit. Números ficam CONGELADOS com a data
-- da medição: o que se conta no episódio é o que valia naquele dia.
-- Imagens em bucket PRIVADO: captura do app mostra número interno e o repo é público; sai por URL
-- assinada só para usuário interno.
-- Regras: [x] R-044 tabela no schema do domínio  [x] RLS igual às tabelas internas  [x] reversão
-- Reversão: drop table pulso_content.bastidores_assuntos; delete from storage.buckets where id='bastidores';
-- ============================================================
begin;

create table if not exists pulso_content.bastidores_assuntos (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  titulo      text not null,
  tipo        text not null check (tipo in ('incidente', 'marco', 'decisao', 'produto', 'numero')),
  data        date not null,
  resumo      text not null,
  corpo_md    text not null default '',
  numeros     jsonb not null default '[]'::jsonb,   -- [{rotulo, valor, data}]
  imagens     jsonb not null default '[]'::jsonb,   -- [{caminho, legenda}] no bucket bastidores
  videos      integer[] not null default '{}',      -- números dos vídeos citados
  fontes      jsonb not null default '[]'::jsonb,   -- de onde saiu cada fato
  episodio    text,                                 -- ficha de episódio que cobre o assunto
  status      text not null default 'rascunho' check (status in ('rascunho', 'aprovado')),
  origem      text not null default 'manual',       -- manual | reconstituido | automatico
  chave_auto  text unique,                          -- evita o gerador automático repetir o assunto
  criado_em   timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index if not exists bastidores_assuntos_data_idx on pulso_content.bastidores_assuntos (data desc);

alter table pulso_content.bastidores_assuntos enable row level security;
drop policy if exists interno_total_v2 on pulso_content.bastidores_assuntos;
create policy interno_total_v2 on pulso_content.bastidores_assuntos for all to authenticated
  using (exists (select 1 from pulso_core.usuarios_internos u where u.auth_user_id = auth.uid() and u.ativo))
  with check (exists (select 1 from pulso_core.usuarios_internos u where u.auth_user_id = auth.uid() and u.ativo));
revoke all on pulso_content.bastidores_assuntos from public, anon;
grant select, insert, update, delete on pulso_content.bastidores_assuntos to authenticated, service_role;

insert into storage.buckets (id, name, public) values ('bastidores', 'bastidores', false)
  on conflict (id) do update set public = false;
drop policy if exists bastidores_interno_le on storage.objects;
create policy bastidores_interno_le on storage.objects for select to authenticated
  using (bucket_id = 'bastidores'
         and exists (select 1 from pulso_core.usuarios_internos u where u.auth_user_id = auth.uid() and u.ativo));

do $$ begin
  set local role authenticated;
  perform 1 from pulso_content.bastidores_assuntos limit 1;
  reset role;
end $$;

commit;
