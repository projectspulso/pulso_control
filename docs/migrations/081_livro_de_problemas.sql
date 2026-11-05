-- ============================================================
-- 081 — Livro de Problemas: cada caso (problema → causa → conserto → prova → trava) em duas partes
-- Pedido: dono, 04/11/2026 ("relatórios de tudo que tivemos de problemas e como resolvemos ... é nosso
-- segredo"). Fonte: 235 commits de correção, notas de memória, changelog e sessões.
-- O SEGREDO É ESTRUTURAL, não de cuidado ao escrever:
--   · livro_problemas         → a HISTÓRIA (pode virar Bastidores/episódio). Usuário interno lê.
--   · livro_problemas_receita → a RECEITA (limiares, prompts, modelos, horários, tema×rede). SÓ admin.
--   · v_livro_historia        → o que outro agente/app pode ler (Limelight, R-045): sem receita.
-- Limite honesto: a chave administrativa (service_role / PAT) ignora RLS; contra ela vale a regra
-- combinada com o Geral, não o banco.
-- Regras: [x] R-044 tabelas no schema do domínio  [x] R-043 view invoker  [x] grants explícitos  [x] reversão
-- Reversão: drop view pulso_content.v_livro_historia; drop table pulso_content.livro_problemas_receita; drop table pulso_content.livro_problemas;
-- ============================================================
begin;

create table if not exists pulso_content.livro_problemas (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  titulo      text not null,
  area        text not null check (area in ('coleta','publicacao','render','producao','dados','seguranca','custo','infra','conteudo')),
  gravidade   text not null check (gravidade in ('alta','media','baixa')),
  inicio      date not null,
  fim         date,                                   -- null = ainda aberto
  sintoma     text not null default '',
  causa       text not null default '',
  conserto    text not null default '',
  prova       text not null default '',
  trava       text not null default '',
  impacto     jsonb not null default '[]'::jsonb,     -- [{rotulo, valor, data}]
  historia_md text not null default '',
  commits     text[] not null default '{}',
  memorias    text[] not null default '{}',
  assunto_slug text,                                  -- assunto de Bastidores que conta este caso
  status      text not null default 'rascunho' check (status in ('rascunho','aprovado')),
  criado_em   timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index if not exists livro_problemas_inicio_idx on pulso_content.livro_problemas (inicio desc);

create table if not exists pulso_content.livro_problemas_receita (
  problema_id uuid primary key references pulso_content.livro_problemas(id) on delete cascade,
  receita_md  text not null default '',
  atualizado_em timestamptz not null default now()
);

alter table pulso_content.livro_problemas enable row level security;
drop policy if exists interno_total_v2 on pulso_content.livro_problemas;
create policy interno_total_v2 on pulso_content.livro_problemas for all to authenticated
  using (exists (select 1 from pulso_core.usuarios_internos u where u.auth_user_id = auth.uid() and u.ativo))
  with check (exists (select 1 from pulso_core.usuarios_internos u where u.auth_user_id = auth.uid() and u.ativo));

alter table pulso_content.livro_problemas_receita enable row level security;
drop policy if exists so_admin on pulso_content.livro_problemas_receita;
create policy so_admin on pulso_content.livro_problemas_receita for all to authenticated
  using (exists (select 1 from pulso_core.usuarios_internos u where u.auth_user_id = auth.uid() and u.ativo and u.papel = 'admin'))
  with check (exists (select 1 from pulso_core.usuarios_internos u where u.auth_user_id = auth.uid() and u.ativo and u.papel = 'admin'));

revoke all on pulso_content.livro_problemas, pulso_content.livro_problemas_receita from public, anon;
grant select, insert, update, delete on pulso_content.livro_problemas, pulso_content.livro_problemas_receita to authenticated, service_role;

create or replace view pulso_content.v_livro_historia with (security_invoker = true) as
  select slug, titulo, area, gravidade, inicio, fim, sintoma, causa, conserto, prova, trava, impacto, historia_md, assunto_slug, status
  from pulso_content.livro_problemas where status = 'aprovado';
comment on view pulso_content.v_livro_historia is 'Livro de Problemas sem a receita, só aprovados. É o que o Limelight e outros apps leem (R-045).';
revoke all on pulso_content.v_livro_historia from public, anon;
grant select on pulso_content.v_livro_historia to authenticated, service_role;

do $$ begin
  set local role authenticated;
  perform 1 from pulso_content.v_livro_historia limit 1;
  perform 1 from pulso_content.livro_problemas_receita limit 1;
  reset role;
end $$;

commit;
