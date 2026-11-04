-- ============================================================
-- 077 — views ganhas por dia, rede e vertical (gráfico de barras da aba Controle)
-- Pedido: dono, 04/11/2026 ("controle de barras com o filtro e os níveis de mês, semana, dia e ano").
-- A série diária tem ~78 mil linhas e cresce ~1.200/dia: agregar no navegador não escala. A view
-- devolve ~1 linha por (dia, rede, vertical) e o app agrupa em semana/mês/ano.
-- Ganho do dia = leitura do dia − leitura anterior do mesmo post (negativo vira 0: correção de contagem).
-- A primeira leitura de um post conta inteira, EXCETO no primeiro dia da série (19/06), que carrega
-- todo o histórico anterior e viraria um pico falso.
-- Regras: [x] R-044 objeto no schema do domínio  [x] R-043 security_invoker  [x] grant explícito  [x] reversão
-- Reversão: drop view pulso_analytics.v_ganho_diario;
-- ============================================================
begin;

create or replace view pulso_analytics.v_ganho_diario with (security_invoker = true) as
with l as (
  select lm.ideia_id, lm.plataforma, lm.data_ref, lm.views,
         lm.views - lag(lm.views) over (partition by lm.ideia_id, lm.plataforma order by lm.data_ref) as delta,
         min(lm.data_ref) over () as inicio
  from pulso_analytics.leituras_metricas lm
  where not lm.estimado
)
select l.data_ref as dia, l.plataforma, i.canal_id,
       sum(greatest(case when l.delta is null then (case when l.data_ref = l.inicio then 0 else l.views end) else l.delta end, 0))::bigint as views_ganhas
from l
join pulso_content.ideias i on i.id = l.ideia_id
where coalesce(i.formato, '') <> 'longo'
group by 1, 2, 3;

comment on view pulso_analytics.v_ganho_diario is 'Views ganhas por dia/rede/vertical (delta entre leituras). Fonte do gráfico de barras da aba Controle.';
revoke all on pulso_analytics.v_ganho_diario from public, anon;
grant select on pulso_analytics.v_ganho_diario to authenticated, service_role;

do $$ begin
  set local role authenticated;
  perform 1 from pulso_analytics.v_ganho_diario limit 1;
  reset role;
end $$;

commit;
