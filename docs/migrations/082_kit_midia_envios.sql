-- ============================================================
-- 082 — Kit de mídia: cada envio a patrocinador é uma foto CONGELADA e datada, aberta por link secreto
-- Pedido: dono, 03/11/2026 ("negócios futuros de vendas de espaço, patrocínios") e 05/11 ("pode seguir com o kit de mídia").
-- Por que congelado: o número que o patrocinador viu no dia do envio não pode mudar depois; o kit de
-- amanhã é outro envio. Os dados são montados pelo app (mesma lógica da aba Controle) e gravados aqui.
-- Por que link secreto e não login: patrocinador não tem conta. O link é a credencial: 48 hex aleatórios,
-- revogável, com validade. A tabela não abre para anon; só a RPC devolve UM envio pelo token exato.
-- Regras: [x] R-044 tabela no schema do domínio, public só RPC  [x] R-043 RPC definer com filtro explícito
--   (token + não revogado + não vencido)  [x] grant de função na mesma migration  [x] sem PII (destinatário
--   é nome de empresa, e não sai na RPC)  [x] reversão
-- Reversão: drop function public.kit_midia_publico(text); drop table pulso_analytics.kit_midia_envios;
-- ============================================================
begin;

create table if not exists pulso_analytics.kit_midia_envios (
  id            uuid primary key default gen_random_uuid(),
  token         text not null unique default encode(extensions.gen_random_bytes(24), 'hex'),
  destinatario  text not null check (length(trim(destinatario)) > 0),
  nota          text not null default '',               -- recado do dono para este patrocinador (sai no kit)
  dados         jsonb not null,                         -- o kit congelado (lib/analytics/kit.ts → KitDados)
  medido_em     timestamptz not null,                   -- quando os números foram lidos
  criado_em     timestamptz not null default now(),
  criado_por    uuid default auth.uid(),
  expira_em     timestamptz not null default now() + interval '60 days',
  revogado_em   timestamptz,
  acessos       integer not null default 0,
  ultimo_acesso timestamptz
);
create index if not exists kit_midia_envios_criado_idx on pulso_analytics.kit_midia_envios (criado_em desc);

alter table pulso_analytics.kit_midia_envios enable row level security;
drop policy if exists interno_total_v2 on pulso_analytics.kit_midia_envios;
create policy interno_total_v2 on pulso_analytics.kit_midia_envios for all to authenticated
  using (exists (select 1 from pulso_core.usuarios_internos u where u.auth_user_id = auth.uid() and u.ativo))
  with check (exists (select 1 from pulso_core.usuarios_internos u where u.auth_user_id = auth.uid() and u.ativo));

revoke all on pulso_analytics.kit_midia_envios from public, anon;
grant select, insert, update on pulso_analytics.kit_midia_envios to authenticated, service_role;

-- A única porta de fora. Conta o acesso (o dono quer saber se o patrocinador abriu).
create or replace function public.kit_midia_publico(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  r pulso_analytics.kit_midia_envios%rowtype;
begin
  if p_token is null or p_token !~ '^[0-9a-f]{48}$' then
    return null;
  end if;
  update pulso_analytics.kit_midia_envios
     set acessos = acessos + 1, ultimo_acesso = now()
   where token = p_token and revogado_em is null and expira_em > now()
  returning * into r;
  if not found then
    return null;
  end if;
  return jsonb_build_object('dados', r.dados, 'nota', r.nota, 'medido_em', r.medido_em, 'expira_em', r.expira_em);
end $$;
revoke all on function public.kit_midia_publico(text) from public;
grant execute on function public.kit_midia_publico(text) to anon, authenticated, service_role;

do $$ begin
  set local role authenticated;
  perform 1 from pulso_analytics.kit_midia_envios limit 1;
  reset role;
  set local role anon;
  if public.kit_midia_publico('nao-e-token') is not null then raise exception 'token inválido abriu o kit'; end if;
  if public.kit_midia_publico(repeat('0', 48)) is not null then raise exception 'token inexistente abriu o kit'; end if;
  reset role;
end $$;

commit;
