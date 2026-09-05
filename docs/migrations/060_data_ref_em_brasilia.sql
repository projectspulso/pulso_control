-- 060_data_ref_em_brasilia.sql — 2026-09-04
-- APLICADA em 04/09/2026 via Management API do Supabase. Registrada aqui como espelho.
--
-- O QUE O DONO VIU: "por que está aparecendo ainda 875 no dia 05?", às 21h do dia 04. O ganho de
-- 875 views era REAL — só estava pendurado no dia errado.
--
-- A CAUSA: `pulso_analytics.leituras_metricas.data_ref` era carimbada com o dia UTC
-- (`new Date().toISOString().slice(0,10)` no coletar-metricas). A coleta principal roda às 21h de
-- Brasília, que já é 00h UTC do dia seguinte — então toda leitura da noite nascia com a data de
-- AMANHÃ, e o gráfico mostrava ganho num dia que ainda não tinha começado.
--
-- POR QUE NÃO ERA "SUBTRAIR UM DIA DE TUDO". Existem dois caminhos de coleta:
--   · 21h-23h BRT (00h-02h UTC) -> carimbo saía +1 dia   ~80% das linhas
--   · 03h BRT      (06h UTC)    -> carimbo já estava certo
-- Deslocar tudo teria QUEBRADO as 5.620 que estavam corretas. Por isso o conserto recalcula linha
-- a linha, a partir do `created_at`, que é timestamptz de verdade e não mente.
--
-- MEDIDO ANTES DE APLICAR:
--   total 31.351 · já certas 5.620 · a corrigir 25.731 (24.579 exatamente +1 dia)
--   colisões previstas: 2.504 chaves, 2.963 linhas duplicadas · tabela final prevista: 28.388
-- RESULTADO: 28.388 linhas, 0 erradas. Exatamente o previsto.
--
-- BACKUP: `pulso_analytics.leituras_metricas_bkp_20260904` (as 31.351 linhas originais).
-- Só apagar depois de conferir o gráfico do desafio por alguns dias.

begin;

-- 1) o dia da leitura passa a ser o dia de Brasília em que ela foi tirada
update pulso_analytics.leituras_metricas
   set data_ref = (created_at at time zone 'America/Sao_Paulo')::date
 where data_ref <> (created_at at time zone 'America/Sao_Paulo')::date;

-- 2) duas leituras do mesmo post no mesmo dia BRT (a das 21h e a das 03h) viram duplicata.
--    Fica a MAIS RECENTE — é a semântica que o coletor já usa ("latest do dia").
--    O índice `idx_leituras` não é único, então a duplicata não daria erro: passaria calada,
--    e quem lê a série escolheria uma das duas por ordem de chegada.
delete from pulso_analytics.leituras_metricas l
 using pulso_analytics.leituras_metricas m
 where l.ideia_id = m.ideia_id
   and l.plataforma = m.plataforma
   and l.data_ref = m.data_ref
   and (l.created_at < m.created_at or (l.created_at = m.created_at and l.id < m.id));

commit;

-- CONFERÊNCIA:
--   select count(*) as linhas,
--          count(*) filter (where data_ref <> (created_at at time zone 'America/Sao_Paulo')::date) as erradas
--     from pulso_analytics.leituras_metricas;
--
-- PARA DESFAZER (enquanto o backup existir):
--   truncate pulso_analytics.leituras_metricas;
--   insert into pulso_analytics.leituras_metricas select * from pulso_analytics.leituras_metricas_bkp_20260904;
