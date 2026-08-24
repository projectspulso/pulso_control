-- 057_financeiro_espelho.sql — 2026-08-24
--
-- Liga a parte financeira do PULSO ao app da DIGIAI.
--
-- CONTEXTO: os gastos já eram registrados, mas em `pulso_content.logs_workflows` com
-- workflow_name='GASTO_SERVICO' e tudo dentro de um jsonb — um log genérico servindo de ledger.
-- O app da DIGIAI (finance.expenses / finance.revenue, produto `pulso`) nunca recebeu nada disso,
-- então o burn da empresa estava incompleto e a receita do Pulso não tinha onde entrar.
--
-- ⚠️ DISTINÇÃO QUE IMPORTA — CAIXA × CONSUMO:
--   `topup` (R$ 2.168,48 em 7 lançamentos) é dinheiro que SAIU da conta comprando crédito.
--   `higgsfield` (R$ 7.300,65 em 140 lançamentos) é o USO desse crédito já comprado.
--   Somar os dois = dupla contagem. É o mesmo erro que inflou o burn do digiai em junho/2026
--   (aporte intelectual somado ao caixa) e que a migration 026 de lá corrigiu.
--   Por isso a view separa `custo_caixa_brl` de `custo_consumo_brl`. O digiai deve lançar em
--   finance.expenses APENAS o caixa.

-- ============================================================
-- 1. RECEITA — estrutura pronta antes do gate abrir
-- ============================================================
-- O Facebook está a 17 seguidores do programa Estrelas (500). Quando abrir, a receita precisa
-- ter onde cair. Hoje o app devolve `receita: 0` hardcoded (app/analytics/page.tsx).

create table if not exists pulso_content.receitas (
  id            uuid primary key default gen_random_uuid(),
  plataforma    text not null check (plataforma in ('youtube','instagram','facebook','tiktok','kwai','outro')),
  programa      text,                       -- 'Estrelas', 'YPP', 'Creator Rewards', 'CMP'…
  competencia   date not null,              -- mês de referência, sempre dia 1
  valor_brl     numeric(12,2) not null default 0 check (valor_brl >= 0),
  valor_usd     numeric(12,2) check (valor_usd is null or valor_usd >= 0),
  status        text not null default 'estimado'
                check (status in ('estimado','confirmado','recebido')),
  recebido_em   date,
  observacao    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table pulso_content.receitas is
  'Receita dos programas de monetização das redes. Uma linha por plataforma×competência. '
  'status: estimado (projeção) → confirmado (a plataforma fechou o valor) → recebido (caiu na conta).';

create unique index if not exists receitas_plataforma_competencia_programa_uk
  on pulso_content.receitas (plataforma, competencia, coalesce(programa, ''));

create index if not exists receitas_competencia_idx on pulso_content.receitas (competencia desc);

alter table pulso_content.receitas enable row level security;

-- Mesmo padrão do resto do schema: leitura para authenticated, escrita só service_role.
drop policy if exists receitas_select on pulso_content.receitas;
create policy receitas_select on pulso_content.receitas for select to authenticated using (true);

-- ============================================================
-- 2. CUSTOS — view sobre o ledger que já existe (não move dado)
-- ============================================================
create or replace view pulso_content.v_custos_mes as
select
  date_trunc('month', (l.detalhes->>'data')::date)::date          as competencia,
  l.detalhes->>'servico'                                          as servico,
  -- topup/assinatura/openai/elevenlabs = dinheiro saindo.
  -- higgsfield = uso de crédito já comprado no topup (não é caixa).
  case when l.detalhes->>'servico' = 'higgsfield' then 'consumo' else 'caixa' end as natureza,
  round(sum((l.detalhes->>'brl')::numeric), 2)                    as brl,
  round(sum(coalesce((l.detalhes->>'creditos')::numeric, 0)), 2)  as creditos,
  count(*)                                                        as lancamentos
from pulso_content.logs_workflows l
where l.workflow_name = 'GASTO_SERVICO'
  and l.detalhes->>'data' is not null
  and l.detalhes->>'brl'  is not null
group by 1, 2, 3;

comment on view pulso_content.v_custos_mes is
  'Custo por mês×serviço lido de logs_workflows (GASTO_SERVICO). natureza=caixa é o que o digiai '
  'deve lançar em finance.expenses; natureza=consumo é uso de crédito já pago — NÃO somar aos dois.';

-- ============================================================
-- 3. ESPELHO — estende o contrato com o digiai
-- ============================================================
-- ⚠️ Todos os 8 campos originais permanecem, na mesma ordem e com o mesmo nome.
-- O digiai lê esta view por `espelhoMotores.ts` → MarketingEspelho.tsx. Remover campo = tela vazia.

create or replace view public.v_espelho_pulso as
select
  -- ---- contrato original (não alterar) ----
  (select count(*) from pulso_content.metricas_publicacao)                          as publicacoes,
  (select coalesce(sum(mp.views), 0) from pulso_content.metricas_publicacao mp)     as views_total,
  (select coalesce(jsonb_object_agg(p.plataforma, p.views), '{}'::jsonb)
     from (select mp.plataforma, sum(mp.views) as views
             from pulso_content.metricas_publicacao mp
            group by mp.plataforma) p)                                              as views_por_plataforma,
  (select max(mp.data_publicacao)::date from pulso_content.metricas_publicacao mp)  as ultima_publicacao,
  (select max(mp.created_at)::date from pulso_content.metricas_publicacao mp)       as ultima_descoberta,
  (select coalesce(jsonb_object_agg(s.status, s.n), '{}'::jsonb)
     from (select pp.status, count(*) as n
             from pulso_content.pipeline_producao pp
            group by pp.status) s)                                                  as pipeline,
  (select count(*) from pulso_content.ideias)                                       as ideias,
  (select count(*) from public.canais)                                              as canais,

  -- ---- financeiro (novo em 2026-08-24) ----
  -- CAIXA: o que o digiai deve lançar em finance.expenses (produto `pulso`).
  (select coalesce(round(sum(c.brl), 2), 0) from pulso_content.v_custos_mes c
    where c.natureza = 'caixa')                                                     as custo_caixa_total_brl,
  (select coalesce(round(sum(c.brl), 2), 0) from pulso_content.v_custos_mes c
    where c.natureza = 'caixa'
      and c.competencia = date_trunc('month', current_date)::date)                  as custo_caixa_mes_brl,
  -- CONSUMO: gerencial. NÃO somar com o caixa — o crédito já foi pago no topup.
  (select coalesce(round(sum(c.brl), 2), 0) from pulso_content.v_custos_mes c
    where c.natureza = 'consumo')                                                   as custo_consumo_total_brl,
  (select coalesce(jsonb_object_agg(x.servico, x.brl), '{}'::jsonb)
     from (select c.servico, round(sum(c.brl), 2) as brl
             from pulso_content.v_custos_mes c
            group by c.servico) x)                                                  as custo_por_servico,
  -- RECEITA: zero até o primeiro gate abrir; a estrutura já existe.
  (select coalesce(round(sum(r.valor_brl), 2), 0) from pulso_content.receitas r)    as receita_total_brl,
  (select coalesce(round(sum(r.valor_brl), 2), 0) from pulso_content.receitas r
    where r.competencia = date_trunc('month', current_date)::date)                  as receita_mes_brl,
  (select coalesce(round(sum(r.valor_brl), 2), 0) from pulso_content.receitas r
    where r.status = 'recebido')                                                    as receita_recebida_brl,
  -- Custo por vídeo publicado, em caixa. Denominador = publicações distintas, não linhas de métrica.
  (select case when v.n > 0
               then round((select coalesce(sum(c.brl), 0) from pulso_content.v_custos_mes c
                            where c.natureza = 'caixa') / v.n, 2)
               else 0 end
     from (select count(distinct mp.ideia_id) as n from pulso_content.metricas_publicacao mp) v)
                                                                                    as custo_caixa_por_video_brl;

comment on view public.v_espelho_pulso is
  'Contrato de leitura do app DIGIAI (espelhoMotores.ts). Só agregados, sem PII. '
  'Financeiro adicionado em 2026-08-24: usar custo_caixa_* em finance.expenses; '
  'custo_consumo_* é gerencial e NÃO deve ser somado (evita a dupla contagem topup×uso).';

-- ⚠️ Tabela criada depois NÃO herda os privilégios padrão do schema — sem estes grants o
-- service_role recebe 403 mesmo sendo service_role (verificado na aplicação em 24/08).
grant usage  on schema pulso_content to service_role, authenticated, anon;
grant all    on pulso_content.receitas    to service_role;
grant select on pulso_content.receitas    to authenticated;
grant select on pulso_content.v_custos_mes to service_role, authenticated;
grant select on public.v_espelho_pulso     to anon, authenticated;

-- PostgREST cacheia o schema; sem isto a tabela nova só aparece no próximo restart.
notify pgrst, 'reload schema';
