-- 058_natureza_por_lancamento.sql — 2026-08-24
--
-- Correção apontada pelo agente do digiai no RETORNO ao despacho do financeiro:
-- a v_custos_mes (migration 057) derivava `natureza` pelo NOME do serviço
-- (higgsfield=consumo, resto=caixa). Isso acerta o Higgsfield e ERRA o ElevenLabs:
-- os lançamentos de uso (R$ 17,97 — "10 narrações", "regen áudio") são consumo de
-- créditos da assinatura Creator já paga (que entra como servico='assinatura').
-- Mesmo padrão topup→higgsfield; classificados como caixa, duplicariam.
--
-- Solução em duas camadas, como o digiai sugeriu:
--   1. `natureza` passa a poder vir do PRÓPRIO lançamento (detalhes->>'natureza'),
--      gravada pelo pulso_guard daqui em diante — fornecedor novo nasce certo.
--   2. Fallback por serviço cobre o histórico: higgsfield E elevenlabs = consumo.
--      (openai permanece caixa: pagamento direto, sem pré-pago registrado no ledger.)

create or replace view pulso_content.v_custos_mes as
select
  date_trunc('month', (l.detalhes->>'data')::date)::date          as competencia,
  l.detalhes->>'servico'                                          as servico,
  coalesce(
    nullif(l.detalhes->>'natureza', ''),
    case when l.detalhes->>'servico' in ('higgsfield', 'elevenlabs')
         then 'consumo' else 'caixa' end
  )                                                               as natureza,
  round(sum((l.detalhes->>'brl')::numeric), 2)                    as brl,
  round(sum(coalesce((l.detalhes->>'creditos')::numeric, 0)), 2)  as creditos,
  count(*)                                                        as lancamentos
from pulso_content.logs_workflows l
where l.workflow_name = 'GASTO_SERVICO'
  and l.detalhes->>'data' is not null
  and l.detalhes->>'brl'  is not null
group by 1, 2, 3;

comment on view pulso_content.v_custos_mes is
  'Custo por mês×serviço lido de logs_workflows (GASTO_SERVICO). natureza vem do lançamento '
  '(detalhes->>natureza, gravada pelo pulso_guard) com fallback por serviço para o histórico: '
  'higgsfield e elevenlabs = consumo de crédito/assinatura já pagos; demais = caixa. '
  'caixa é o que o digiai lança em finance.expenses; consumo é gerencial — NÃO somar.';

grant select on pulso_content.v_custos_mes to service_role, authenticated;
notify pgrst, 'reload schema';
