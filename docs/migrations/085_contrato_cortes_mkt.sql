-- ============================================================
-- 085 — Contrato Pulso → digiai_mkt: cortes prontos (job) e devolução de estado
-- Desenho do Geral, com "pode" do dono (05/11/2026): Cockpit/bastidores/DESENHO-canais-stories-divisao-2026-11-05.md §3.
-- Um publicador por conta: o Pulso publica só no Bastidores DIGIAI; DIGIAI e pessoal o digiai_mkt publica
-- por job. Bancos separados: o MKT PUXA uma vez por dia por RPC e devolve o estado por outra RPC.
-- Ninguém faz .from() no schema do outro (R-044).
--
-- Por que uma lista própria de leitores e não usuarios_internos: a regra interno_total_v2 abre TODAS as
-- tabelas do Pulso a qualquer usuário interno ativo. A conta do MKT entra só em leitores_contrato, que abre
-- apenas estas duas funções (portão explícito, R-043); o resto do banco continua fechado para ela.
-- O link do vídeo é assinado pelo Pulso (bucket privado, rosto do dono) e renovado todo dia, validade 7 dias.
-- Regras: [x] R-044 tabela no domínio, public só RPC  [x] R-043 RPC definer com portão explícito, coalesce no NULL
--   [x] view nova security_invoker  [x] grant de função na mesma migration  [x] sem PII  [x] reversão
-- Reversão: drop function public.estado_corte_mkt(uuid,text,text,text); drop function public.cortes_para_mkt();
--   drop view pulso_content.v_cortes_job_mkt; drop table pulso_core.leitores_contrato;
--   alter table pulso_content.corte_publicacoes drop column video_url_assinada, drop column url_expira, drop column post_id;
-- ============================================================
begin;

alter table pulso_content.corte_publicacoes
  add column if not exists video_url_assinada text,
  add column if not exists url_expira timestamptz,
  add column if not exists post_id text;
alter table pulso_content.corte_publicacoes drop constraint if exists corte_publicacoes_status_check;
alter table pulso_content.corte_publicacoes add constraint corte_publicacoes_status_check
  check (status in ('planejado','agendado','publicado','recusado','erro','cancelado','aguarda_conta'));

create table if not exists pulso_core.leitores_contrato (
  auth_user_id uuid primary key,
  app          text not null check (app in ('digiai_mkt')),
  ativo        boolean not null default true,
  criado_em    timestamptz not null default now()
);
alter table pulso_core.leitores_contrato enable row level security;  -- sem política: só as funções definer leem
revoke all on pulso_core.leitores_contrato from public, anon, authenticated;

create or replace view pulso_content.v_cortes_job_mkt with (security_invoker = true) as
  select p.id                  as job_id,
         e.codigo              as episodio,
         e.titulo              as episodio_titulo,
         c.id                  as corte_id,
         c.numero              as corte_numero,
         c.titulo              as corte_titulo,
         p.destino,
         p.agendado_para       as data_sugerida,
         p.legenda,
         p.video_url_assinada  as video_url,
         p.url_expira,
         coalesce((e.metadata->>'rosto_real')::boolean, false) as rosto_real,
         e.metadata->'fontes'  as fontes,
         p.status
    from pulso_content.corte_publicacoes p
    join pulso_content.episodio_cortes c on c.id = p.corte_id
    join pulso_content.episodios e on e.id = c.episodio_id
   where p.modo = 'job' and p.status in ('planejado','agendado');
revoke all on pulso_content.v_cortes_job_mkt from public, anon;
grant select on pulso_content.v_cortes_job_mkt to authenticated, service_role;

create or replace function public.cortes_para_mkt()
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from pulso_core.leitores_contrato l where l.auth_user_id = auth.uid() and l.ativo and coalesce(l.app,'') = 'digiai_mkt')
     and not exists (select 1 from pulso_core.usuarios_internos u where u.auth_user_id = auth.uid() and u.ativo and coalesce(u.papel,'') = 'admin') then
    raise exception 'sem permissão para o contrato de cortes' using errcode = '42501';
  end if;
  return coalesce((select jsonb_agg(to_jsonb(v) order by v.data_sugerida) from pulso_content.v_cortes_job_mkt v), '[]'::jsonb);
end $$;

create or replace function public.estado_corte_mkt(p_job uuid, p_estado text, p_post_id text default null, p_url text default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from pulso_core.leitores_contrato l where l.auth_user_id = auth.uid() and l.ativo and coalesce(l.app,'') = 'digiai_mkt')
     and not exists (select 1 from pulso_core.usuarios_internos u where u.auth_user_id = auth.uid() and u.ativo and coalesce(u.papel,'') = 'admin') then
    raise exception 'sem permissão para o contrato de cortes' using errcode = '42501';
  end if;
  if coalesce(p_estado,'') not in ('agendado','publicado','recusado') then
    raise exception 'estado inválido: %', p_estado;
  end if;
  update pulso_content.corte_publicacoes
     set status = p_estado, post_id = coalesce(p_post_id, post_id), url = coalesce(p_url, url),
         publicado_em = case when p_estado = 'publicado' then now() else publicado_em end, atualizado_em = now()
   where id = p_job and modo = 'job';
  if not found then
    raise exception 'job % não existe ou não é do digiai_mkt', p_job;
  end if;
end $$;

revoke all on function public.cortes_para_mkt() from public, anon;
revoke all on function public.estado_corte_mkt(uuid,text,text,text) from public, anon;
grant execute on function public.cortes_para_mkt() to authenticated, service_role;
grant execute on function public.estado_corte_mkt(uuid,text,text,text) to authenticated, service_role;

-- Prova: usuário qualquer (sem linha em leitores_contrato nem admin) é barrado nas duas funções
do $$ declare ok boolean := false; begin
  set local role authenticated;
  perform set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000aa","role":"authenticated"}', true);
  begin perform public.cortes_para_mkt(); exception when insufficient_privilege then ok := true; end;
  if not ok then raise exception 'cortes_para_mkt abriu para quem não é leitor'; end if;
  ok := false;
  begin perform public.estado_corte_mkt(gen_random_uuid(), 'publicado'); exception when insufficient_privilege then ok := true; end;
  if not ok then raise exception 'estado_corte_mkt abriu para quem não é leitor'; end if;
  reset role;
end $$;

commit;
