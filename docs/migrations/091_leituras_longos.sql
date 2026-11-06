-- ============================================================
-- 091 — Medição dos Longos: leituras diárias do episódio e de cada peça, seguidores dos canais dos Bastidores
-- Pedido: dono, 06/11/2026 ("o analytics do VC tem que ser referência para os do VL, com gráficos, ideias e tudo completo").
-- Mesmo desenho da leituras_metricas dos Curtos (1 leitura por peça por dia, crescimento = delta), mas à parte:
-- os números dos Longos nunca somam nos Curtos.
-- Quem escreve:
--   · o Pulso (rota coletar-longos, service_role): o longo no canal principal e os cortes do YouTube, pela API pública
--   · o digiai_mkt (rpc leitura_peca_bastidores / seguidores_bastidores): as redes em que só ele tem token
-- Regras: [x] R-044 tabelas em pulso_analytics, public só RPC  [x] R-043 RPC definer com portão explícito + coalesce
--   [x] grants na mesma migration  [x] sem PII  [x] prova de permissão  [x] reversão
-- Reversão: drop function public.leitura_peca_bastidores(uuid,date,integer,integer,integer,integer,numeric,numeric,integer,jsonb);
--   drop function public.seguidores_bastidores(text,text,date,integer); drop table pulso_analytics.seguidores_longos;
--   drop table pulso_analytics.leituras_longos; delete from pulso_core.configuracoes where chave = 'longos_metas';
-- ============================================================
begin;

create table if not exists pulso_analytics.leituras_longos (
  id                 uuid primary key default gen_random_uuid(),
  episodio_id        uuid not null references pulso_content.episodios(id) on delete cascade,
  peca_id            uuid references pulso_content.corte_publicacoes(id) on delete cascade,  -- null = o longo no principal
  canal              text not null check (canal in ('principal','cortes','digiai')),
  rede               text not null,
  tipo               text not null check (tipo in ('longo','corte','story','carrossel','video')),
  post_id            text,
  data_ref           date not null,
  views              integer not null default 0,
  likes              integer not null default 0,
  comentarios        integer not null default 0,
  compartilhamentos  integer not null default 0,
  horas_exibicao     numeric,              -- só o longo (YouTube Analytics)
  retencao_media_pct numeric,              -- % médio assistido
  cliques_episodio   integer,              -- quantas pessoas a peça levou ao episódio, quando a rede informa
  retencao_curva     jsonb,                -- [{"p":0.1,"ret":0.82},...] do longo
  fonte              text not null check (fonte in ('pulso','digiai_mkt','dono')),
  coletado_em        timestamptz not null default now()
);
create unique index if not exists leituras_longos_um_por_dia
  on pulso_analytics.leituras_longos (episodio_id, coalesce(peca_id, '00000000-0000-0000-0000-000000000000'::uuid), rede, data_ref);
create index if not exists leituras_longos_data on pulso_analytics.leituras_longos (data_ref);

create table if not exists pulso_analytics.seguidores_longos (
  id          uuid primary key default gen_random_uuid(),
  canal       text not null check (canal in ('principal','cortes','digiai')),
  rede        text not null,
  data_ref    date not null,
  seguidores  integer not null,
  fonte       text not null check (fonte in ('pulso','digiai_mkt','dono')),
  coletado_em timestamptz not null default now(),
  unique (canal, rede, data_ref)
);

alter table pulso_analytics.leituras_longos enable row level security;
alter table pulso_analytics.seguidores_longos enable row level security;
drop policy if exists leituras_longos_interno_le on pulso_analytics.leituras_longos;
create policy leituras_longos_interno_le on pulso_analytics.leituras_longos for select to authenticated
  using (exists (select 1 from pulso_core.usuarios_internos u where u.auth_user_id = auth.uid() and u.ativo));
drop policy if exists seguidores_longos_interno_le on pulso_analytics.seguidores_longos;
create policy seguidores_longos_interno_le on pulso_analytics.seguidores_longos for select to authenticated
  using (exists (select 1 from pulso_core.usuarios_internos u where u.auth_user_id = auth.uid() and u.ativo));
revoke all on pulso_analytics.leituras_longos, pulso_analytics.seguidores_longos from public, anon;
grant select on pulso_analytics.leituras_longos, pulso_analytics.seguidores_longos to authenticated;
grant all on pulso_analytics.leituras_longos, pulso_analytics.seguidores_longos to service_role;

-- o MKT devolve a leitura do dia de uma peça que ele publicou (a mesma peca_id do contrato)
create or replace function public.leitura_peca_bastidores(
  p_peca uuid, p_data date, p_views integer, p_likes integer default 0, p_comentarios integer default 0,
  p_compartilhamentos integer default 0, p_retencao_media_pct numeric default null, p_horas_exibicao numeric default null,
  p_cliques_episodio integer default null, p_retencao_curva jsonb default null)
returns void language plpgsql security definer set search_path = '' as $$
declare v_peca record;
begin
  if not exists (select 1 from pulso_core.leitores_contrato l where l.auth_user_id = auth.uid() and l.ativo and coalesce(l.app,'') = 'digiai_mkt')
     and not exists (select 1 from pulso_core.usuarios_internos u where u.auth_user_id = auth.uid() and u.ativo and coalesce(u.papel,'') = 'admin') then
    raise exception 'sem permissão para o contrato dos Bastidores' using errcode = '42501';
  end if;
  if p_data is null or p_data > current_date or coalesce(p_views, -1) < 0 then
    raise exception 'leitura inválida: data % views %', p_data, p_views;
  end if;
  select p.id, p.rede, p.tipo, p.destino, p.post_id, c.episodio_id into v_peca
    from pulso_content.corte_publicacoes p join pulso_content.episodio_cortes c on c.id = p.corte_id
   where p.id = p_peca and p.modo = 'job';
  if not found then raise exception 'peça % não existe', p_peca; end if;
  insert into pulso_analytics.leituras_longos as l (episodio_id, peca_id, canal, rede, tipo, post_id, data_ref, views, likes,
         comentarios, compartilhamentos, retencao_media_pct, horas_exibicao, cliques_episodio, retencao_curva, fonte)
  values (v_peca.episodio_id, v_peca.id, case when v_peca.destino = 'digiai' then 'digiai' else 'cortes' end,
          split_part(v_peca.rede, '_', 1), v_peca.tipo, v_peca.post_id, p_data, p_views, coalesce(p_likes,0),
          coalesce(p_comentarios,0), coalesce(p_compartilhamentos,0), p_retencao_media_pct, p_horas_exibicao,
          p_cliques_episodio, p_retencao_curva, 'digiai_mkt')
  on conflict (episodio_id, coalesce(peca_id, '00000000-0000-0000-0000-000000000000'::uuid), rede, data_ref) do update
     set views = excluded.views, likes = excluded.likes, comentarios = excluded.comentarios,
         compartilhamentos = excluded.compartilhamentos, retencao_media_pct = excluded.retencao_media_pct,
         horas_exibicao = excluded.horas_exibicao, cliques_episodio = excluded.cliques_episodio,
         retencao_curva = excluded.retencao_curva, coletado_em = now();
end $$;

create or replace function public.seguidores_bastidores(p_canal text, p_rede text, p_data date, p_seguidores integer)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from pulso_core.leitores_contrato l where l.auth_user_id = auth.uid() and l.ativo and coalesce(l.app,'') = 'digiai_mkt')
     and not exists (select 1 from pulso_core.usuarios_internos u where u.auth_user_id = auth.uid() and u.ativo and coalesce(u.papel,'') = 'admin') then
    raise exception 'sem permissão para o contrato dos Bastidores' using errcode = '42501';
  end if;
  if coalesce(p_canal,'') not in ('principal','cortes','digiai') or p_data is null or coalesce(p_seguidores,-1) < 0 then
    raise exception 'contagem inválida';
  end if;
  insert into pulso_analytics.seguidores_longos (canal, rede, data_ref, seguidores, fonte)
  values (p_canal, p_rede, p_data, p_seguidores, 'digiai_mkt')
  on conflict (canal, rede, data_ref) do update set seguidores = excluded.seguidores, coletado_em = now();
end $$;

revoke all on function public.leitura_peca_bastidores(uuid,date,integer,integer,integer,integer,numeric,numeric,integer,jsonb) from public, anon;
revoke all on function public.seguidores_bastidores(text,text,date,integer) from public, anon;
grant execute on function public.leitura_peca_bastidores(uuid,date,integer,integer,integer,integer,numeric,numeric,integer,jsonb) to authenticated, service_role;
grant execute on function public.seguidores_bastidores(text,text,date,integer) to authenticated, service_role;

-- metas do canal principal (regras públicas do YouTube Partner Program, conferidas em 06/11/2026; o dono ajusta)
insert into pulso_core.configuracoes (chave, valor, descricao, updated_at)
values ('longos_metas', $j${
  "canal": "principal (YouTube, longo)",
  "gates": [
    {"id":"ypp_inicial","nome":"Programa de parcerias, nível inicial","inscritos":500,"horas_12m":3000,"recompensa":"assinaturas, Super Thanks, compras"},
    {"id":"ypp_anuncios","nome":"Programa de parcerias, anúncios","inscritos":1000,"horas_12m":4000,"recompensa":"receita de anúncios no longo"}
  ],
  "nota": "as horas contam só no canal onde o longo está; as do PULSO Histórias não somam aqui"
}$j$, 'Metas de monetização do canal principal dos Bastidores (Analytics dos Longos)', now())
on conflict (chave) do nothing;

do $$ declare ok boolean; begin
  set local role authenticated;
  perform 1 from pulso_analytics.leituras_longos limit 1;
  perform 1 from pulso_analytics.seguidores_longos limit 1;
  perform set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000aa","role":"authenticated"}', true);
  ok := false; begin perform public.leitura_peca_bastidores(gen_random_uuid(), current_date, 10); exception when insufficient_privilege then ok := true; end;
  if not ok then raise exception 'leitura_peca_bastidores abriu para quem não é leitor'; end if;
  ok := false; begin perform public.seguidores_bastidores('cortes', 'youtube', current_date, 10); exception when insufficient_privilege then ok := true; end;
  if not ok then raise exception 'seguidores_bastidores abriu para quem não é leitor'; end if;
  reset role;
end $$;

commit;
