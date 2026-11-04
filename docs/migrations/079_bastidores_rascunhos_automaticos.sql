-- ============================================================
-- 079 — rascunhos automáticos da linha do tempo de Bastidores
-- Por quê: o diário de Bastidores morreu em 16/09 porque dependia de alguém escrever. Aqui o banco
-- cria o rascunho do que ele mesmo prova; o dono ou o Limelight aprovam e completam o texto.
-- Fontes (medidas em 04/11 antes de virar regra, para não virar ruído):
--   · degrau de 100 mil views acumuladas (5 redes): 7 até hoje. Acumulado = soma da 1ª leitura de
--     19/06 (34.527) + views ganhas da v_ganho_diario (077), a mesma série das barras da aba Controle
--   · vídeo que passa de 3 mil views numa rede (o mesmo limite de "estouro" do Decisor): 16 até hoje
-- Idempotente: chave_auto única; rodar de novo não duplica nem sobrescreve texto editado.
-- Regras: [x] R-044 função no schema do domínio  [x] grant explícito  [x] log de toda rodada  [x] reversão
-- Reversão: select cron.unschedule('pulso-bastidores-rascunhos'); drop function pulso_content.gerar_rascunhos_bastidores();
-- ============================================================
begin;

create or replace function pulso_content.nome_rede(p text) returns text
language sql immutable set search_path = '' as $$
  select case p when 'youtube' then 'YouTube' when 'tiktok' then 'TikTok' when 'instagram' then 'Instagram'
                when 'facebook' then 'Facebook' when 'kwai' then 'Kwai' else p end
$$;
grant execute on function pulso_content.nome_rede(text) to authenticated, service_role;

create or replace function pulso_content.gerar_rascunhos_bastidores() returns integer
language plpgsql security invoker set search_path = '' as $$
declare
  inicio date;
  base bigint;
  novos integer := 0;
  n integer;
begin
  select min(data_ref) into inicio from pulso_analytics.leituras_metricas where not estimado;
  select coalesce(sum(views), 0) into base from pulso_analytics.leituras_metricas where not estimado and data_ref = inicio;

  -- degraus de 100 mil views acumuladas
  with g as (select dia, sum(views_ganhas) v from pulso_analytics.v_ganho_diario group by dia),
       c as (select dia, base + sum(v) over (order by dia) acum from g),
       d as (select k * 100000 as degrau, (select min(dia) from c where acum >= k * 100000) as dia
             from generate_series(1, 100) k)
  insert into pulso_content.bastidores_assuntos (slug, titulo, tipo, data, resumo, numeros, fontes, origem, chave_auto)
  select 'marco-' || (degrau / 1000) || '-mil-views',
         'PULSO passa de ' || (degrau / 1000) || ' mil views',
         'marco', dia,
         'A soma das views nas 5 redes passou de ' || (degrau / 1000) || ' mil em ' || to_char(dia, 'DD/MM/YYYY') || '.',
         jsonb_build_array(jsonb_build_object('rotulo', 'Views acumuladas', 'valor', replace(to_char(degrau, 'FM999G999G999'), ',', '.') || '+', 'data', dia)),
         jsonb_build_array('pulso_analytics.v_ganho_diario (077) + 1ª leitura de ' || to_char(inicio, 'DD/MM/YYYY')),
         'automatico', 'marco-views-' || degrau
  from d where dia is not null
  on conflict do nothing;
  get diagnostics n = row_count; novos := novos + n;

  -- vídeo que passa de 3 mil views numa rede
  with primeira as (
    select distinct on (lm.ideia_id, lm.plataforma) lm.ideia_id, lm.plataforma, lm.data_ref, lm.views
    from pulso_analytics.leituras_metricas lm
    where not lm.estimado and lm.views >= 3000 and lm.ideia_id is not null
    order by lm.ideia_id, lm.plataforma, lm.data_ref
  ), pub as (
    select ideia_id, plataforma, min(data_publicacao) em from pulso_content.metricas_publicacao group by 1, 2
  )
  insert into pulso_content.bastidores_assuntos (slug, titulo, tipo, data, resumo, numeros, videos, fontes, origem, chave_auto)
  select 'estouro-' || (pp.metadata->>'numero') || '-' || p.plataforma,
         '#' || (pp.metadata->>'numero') || ' passa de 3 mil views no ' || pulso_content.nome_rede(p.plataforma),
         'numero', p.data_ref,
         '"' || i.titulo || '" chegou a ' || replace(to_char(p.views, 'FM999G999'), ',', '.') || ' views no ' || pulso_content.nome_rede(p.plataforma)
           || coalesce(case greatest(p.data_ref - (pub.em at time zone 'America/Sao_Paulo')::date, 0)
                when 0 then ' no mesmo dia em que saiu' when 1 then ' em 1 dia no ar'
                else ' em ' || greatest(p.data_ref - (pub.em at time zone 'America/Sao_Paulo')::date, 0) || ' dias no ar' end, '') || '.',
         jsonb_build_array(jsonb_build_object('rotulo', 'Views no ' || pulso_content.nome_rede(p.plataforma), 'valor', replace(to_char(p.views, 'FM999G999'), ',', '.'), 'data', p.data_ref)),
         array[(pp.metadata->>'numero')::int],
         jsonb_build_array('pulso_analytics.leituras_metricas: 1ª leitura ≥ 3.000'),
         'automatico', 'estouro-' || p.ideia_id || '-' || p.plataforma
  from primeira p
  join pulso_content.ideias i on i.id = p.ideia_id
  join pulso_content.pipeline_producao pp on pp.ideia_id = p.ideia_id and (pp.metadata->>'numero') ~ '^\d+$'
  left join pub on pub.ideia_id = p.ideia_id and pub.plataforma = p.plataforma
  where coalesce(i.formato, '') <> 'longo'
  on conflict do nothing;
  get diagnostics n = row_count; novos := novos + n;

  insert into pulso_content.logs_workflows (workflow_name, status, detalhes)
  values ('BASTIDORES_RASCUNHOS', case when novos > 0 then 'sucesso' else 'ocioso' end, jsonb_build_object('novos', novos));
  return novos;
end $$;

revoke all on function pulso_content.gerar_rascunhos_bastidores() from public, anon, authenticated;
grant execute on function pulso_content.gerar_rascunhos_bastidores() to service_role;

select cron.schedule('pulso-bastidores-rascunhos', '0 11 * * *', 'select pulso_content.gerar_rascunhos_bastidores()');

commit;
